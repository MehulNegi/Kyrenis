"""Kyrenis backend — All-in-One Smart Pharmacy OS.
FastAPI + Motor + MongoDB. All routes are under /api. Pharmacy routes require
JWT-authenticated PHARMACY_STAFF users; Patient Trust Hub routes are public."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import hashlib
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any

import httpx
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    require_user,
    require_pharmacy_staff,
)
from verification import (
    sanitize_string,
    run_verification_pipeline,
    run_volumetric_check,
    run_spatial_check,
    compute_telemetry_hash,
)
from seed_data import seed_all
from email_dispatch import dispatch_alert_email, dispatch_contact_email

# ---------------- Setup ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Kyrenis Pharmacy OS")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kyrenis")


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def _clean_many(docs: list) -> list:
    for d in docs:
        d.pop("_id", None)
    return docs


# ---------------- Pydantic Models ----------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    pharmacy_name: Optional[str] = None
    license_number: Optional[str] = None
    location_city: Optional[str] = None
    postal_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class IntakePayload(BaseModel):
    qr_string: str
    ocr_text: str
    distributor_id: str
    medicine_id: str
    batch_number: Optional[str] = None
    package_declared_mrp: float
    quantity: int = Field(ge=1)
    mfg_date: str
    expiry_date: str
    scan_city: Optional[str] = None


class POSItem(BaseModel):
    medicine_id: str
    quantity: int = Field(ge=1)


class POSCheckoutPayload(BaseModel):
    items: List[POSItem]


class ConsumerVerifyPayload(BaseModel):
    qr_string: Optional[str] = ""
    ocr_text: Optional[str] = ""
    batch_number: Optional[str] = ""
    medicine_name: Optional[str] = ""
    package_declared_mrp: Optional[float] = None


class ContactEnquiryPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    organisation: Optional[str] = ""
    category: str = Field(min_length=1, max_length=40)
    message: str = Field(min_length=1, max_length=4000)


# ---------------- Auth Endpoints ----------------
def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        "access_token", access, httponly=True, secure=True, samesite="none",
        max_age=60 * 60 * 12, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=True, samesite="none",
        max_age=60 * 60 * 24 * 7, path="/",
    )


@api.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    pharmacy_id = None
    if payload.pharmacy_name:
        pharmacy_id = str(uuid.uuid4())
        await db.pharmacies.insert_one(
            {
                "id": pharmacy_id,
                "name": payload.pharmacy_name,
                "license_number": payload.license_number or "N/A",
                "location_city": payload.location_city or "Unknown",
                "postal_code": payload.postal_code or "",
                "created_at": _iso(datetime.now(timezone.utc)),
            }
        )
    else:
        # attach to reference pharmacy
        ref = await db.pharmacies.find_one({})
        if ref:
            pharmacy_id = ref["id"]

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "designated_role": "PHARMACY_STAFF",
        "associated_pharmacy_id": pharmacy_id,
        "created_at": _iso(datetime.now(timezone.utc)),
    }
    await db.users.insert_one(user_doc)

    access = create_access_token(user_id, email, "PHARMACY_STAFF")
    refresh = create_refresh_token(user_id)
    _set_auth_cookies(response, access, refresh)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], email, user.get("designated_role", "PHARMACY_STAFF"))
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response, request: Request):
    # Clear JWT cookies
    response.delete_cookie("access_token", path="/", samesite="none", secure=True)
    response.delete_cookie("refresh_token", path="/", samesite="none", secure=True)
    # Also invalidate any active Google session
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------- Google (Emergent-managed) Auth ----------------
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
class GoogleSessionPayload(BaseModel):
    session_id: str
    flow: Optional[str] = "pharmacy"  # "pharmacy" or "patient"


@api.post("/auth/google/session")
async def google_session(payload: GoogleSessionPayload, response: Response):
    """Exchange an Emergent OAuth session_id for a persistent session_token.
    Creates/updates the local user; new users default to PENDING_ONBOARDING and
    must complete /auth/complete-onboarding before they can access pharmacy routes."""
    if not payload.session_id or len(payload.session_id) > 512:
        raise HTTPException(status_code=400, detail="Invalid session_id")

    try:
        async with httpx.AsyncClient(timeout=15) as http_client:
            r = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": payload.session_id},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Session exchange failed")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Auth provider unreachable: {e}")

    email = (data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google response missing email")

    session_token = data.get("session_token")
    if not session_token:
        raise HTTPException(status_code=500, detail="Missing session_token from auth provider")

    now = datetime.now(timezone.utc)
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    is_new_user = existing is None

    if existing:
        # Preserve role and pharmacy attachment; just update google metadata
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "name": data.get("name") or existing.get("name", ""),
                    "picture": data.get("picture") or existing.get("picture", ""),
                    "auth_provider": existing.get("auth_provider") or "google",
                    "last_login_at": _iso(now),
                }
            },
        )
        user = await db.users.find_one({"email": email}, {"_id": 0})
    else:
        user_id = str(uuid.uuid4())
        initial_role = "PENDING_ONBOARDING" if payload.flow == "pharmacy" else "CONSUMER_GUEST"
        user = {
            "id": user_id,
            "user_id": user_id,
            "email": email,
            "name": data.get("name") or "",
            "picture": data.get("picture") or "",
            "designated_role": initial_role,
            "auth_provider": "google",
            "associated_pharmacy_id": None,
            "created_at": _iso(now),
            "last_login_at": _iso(now),
        }
        await db.users.insert_one(user)

    # Persist session (7 days)
    expires_at = now + timedelta(days=7)
    await db.user_sessions.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_token": session_token,
            "created_at": _iso(now),
            "expires_at": expires_at,
        }
    )

    response.set_cookie(
        "session_token",
        session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "is_new_user": is_new_user, "needs_onboarding": user.get("designated_role") == "PENDING_ONBOARDING"}


class OnboardingPayload(BaseModel):
    pharmacy_name: str = Field(min_length=2, max_length=120)
    license_number: str = Field(min_length=2, max_length=60)
    location_city: str = Field(min_length=2, max_length=60)
    postal_code: Optional[str] = ""


@api.post("/auth/complete-onboarding")
async def complete_onboarding(payload: OnboardingPayload, request: Request):
    user = await require_user(request, db)
    if user.get("designated_role") == "PHARMACY_STAFF":
        return {"user": user, "already_onboarded": True}

    pharmacy_id = str(uuid.uuid4())
    await db.pharmacies.insert_one(
        {
            "id": pharmacy_id,
            "name": payload.pharmacy_name.strip(),
            "license_number": payload.license_number.strip(),
            "location_city": payload.location_city.strip(),
            "postal_code": (payload.postal_code or "").strip(),
            "created_at": _iso(datetime.now(timezone.utc)),
        }
    )
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "designated_role": "PHARMACY_STAFF",
            "associated_pharmacy_id": pharmacy_id,
            "onboarded_at": _iso(datetime.now(timezone.utc)),
        }},
    )
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    updated.pop("password_hash", None)
    return {"user": updated, "pharmacy_id": pharmacy_id}


@api.get("/auth/me")
async def me(request: Request):
    user = await require_user(request, db)
    return {"user": user}


# ---------------- Reference Data ----------------
@api.get("/pharmacy/distributors")
async def list_distributors(request: Request):
    await require_pharmacy_staff(request, db)
    docs = await db.distributors.find({}, {"_id": 0}).to_list(200)
    return {"distributors": docs}


@api.get("/pharmacy/medicines")
async def list_medicines(request: Request):
    await require_pharmacy_staff(request, db)
    docs = await db.medicines.find({}, {"_id": 0}).to_list(2000)
    return {"medicines": docs}


@api.get("/pharmacy/inventory")
async def list_inventory(request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    docs = await db.inventory_batches.find(
        {"pharmacy_id": pharmacy_id}, {"_id": 0}
    ).sort("expiry_date", 1).to_list(4000)
    # enrich with medicine + distributor
    med_ids = list({d["medicine_id"] for d in docs})
    dist_ids = list({d["distributor_id"] for d in docs})
    meds = {
        m["id"]: m
        for m in await db.medicines.find({"id": {"$in": med_ids}}, {"_id": 0}).to_list(4000)
    }
    dists = {
        d["id"]: d
        for d in await db.distributors.find({"id": {"$in": dist_ids}}, {"_id": 0}).to_list(200)
    }
    for d in docs:
        d["medicine"] = meds.get(d["medicine_id"])
        d["distributor"] = dists.get(d["distributor_id"])
    return {"inventory": docs}


# ---------------- 4-Step Verification + Stock Intake ----------------
@api.post("/pharmacy/intake")
async def stock_intake(payload: IntakePayload, request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")

    qr = sanitize_string(payload.qr_string, 2048)
    ocr = sanitize_string(payload.ocr_text, 2048)

    verification = await run_verification_pipeline(
        db,
        qr_string=qr,
        ocr_text=ocr,
        package_declared_mrp=payload.package_declared_mrp,
        pharmacy_id=pharmacy_id,
        user_id=user["id"],
    )

    # Telemetry log
    scan_city = sanitize_string(payload.scan_city or "Mumbai", 60)
    batch_no = (verification.get("qr_batch") or payload.batch_number or "").upper()
    now = datetime.now(timezone.utc)
    telemetry_doc = {
        "id": str(uuid.uuid4()),
        "pharmacy_id": pharmacy_id,
        "user_id": user["id"],
        "cryptographic_telemetry_hash": compute_telemetry_hash(
            verification.get("qr_gtin", ""), batch_no, pharmacy_id
        ),
        "batch_number": batch_no,
        "scanned_gtin": verification.get("qr_gtin", ""),
        "parsed_qr_data": verification.get("parsed_qr", {}),
        "detected_ocr_text": ocr[:512],
        "quantity": payload.quantity,
        "city": scan_city,
        "distributor_id": payload.distributor_id,
        "timestamp": _iso(now),
        "status_badge": "Anomaly_Flagged" if verification["status"] != "Valid" else "Valid",
    }
    await db.scan_telemetry.insert_one(telemetry_doc)
    telemetry_doc.pop("_id", None)

    # Telemetry engines fire regardless of verification result
    triggered_alerts: list[dict] = []
    if batch_no:
        vol_alert = await run_volumetric_check(db, batch_no, payload.quantity)
        if vol_alert:
            triggered_alerts.append(vol_alert)
        spatial_alert = await run_spatial_check(db, batch_no, scan_city, now)
        if spatial_alert:
            triggered_alerts.append(spatial_alert)

    # persist as security alerts + refuse inventory write on critical anomalies
    for alert in triggered_alerts:
        alert_doc = {
            "id": str(uuid.uuid4()),
            "target_batch_number": batch_no,
            "target_medicine_name": None,
            "alert_type": alert["alert_type"],
            "severity": alert["severity"],
            "triggering_telemetry_json": alert,
            "resolved_status": False,
            "demo_generated": True,
            "created_at": _iso(now),
        }
        await db.security_alerts.insert_one(alert_doc)
        alert_doc["detail"] = alert.get("message", "")
        alert_doc.pop("_id", None)
        asyncio.create_task(dispatch_alert_email(alert_doc))

    if verification["status"] != "Valid":
        # persist critical alert record from pipeline
        alert_meta = verification.get("final_alert") or {}
        alert_type = (
            "Metadata Mismatch" if "Metadata" in alert_meta.get("title", "")
            else "Recall Hit" if "Recall" in alert_meta.get("title", "")
            else "Invalid Checksum"
        )
        alert_doc = {
            "id": str(uuid.uuid4()),
            "target_batch_number": batch_no,
            "target_medicine_name": alert_meta.get("medicine"),
            "alert_type": alert_type,
            "severity": alert_meta.get("level", "Critical"),
            "triggering_telemetry_json": alert_meta,
            "resolved_status": False,
            "demo_generated": True,
            "created_at": _iso(now),
        }
        await db.security_alerts.insert_one(alert_doc)
        alert_doc["detail"] = alert_meta.get("detail", "")
        alert_doc.pop("_id", None)
        asyncio.create_task(dispatch_alert_email(alert_doc))
        return {
            "verification": verification,
            "inventory_written": False,
            "telemetry": telemetry_doc,
            "triggered_alerts": triggered_alerts,
        }

    # Write inventory batch
    inv_doc = {
        "id": str(uuid.uuid4()),
        "pharmacy_id": pharmacy_id,
        "medicine_id": payload.medicine_id,
        "distributor_id": payload.distributor_id,
        "batch_number": batch_no or f"MAN{random_batch()}",
        "mfg_date": payload.mfg_date,
        "expiry_date": payload.expiry_date,
        "package_declared_mrp": payload.package_declared_mrp,
        "current_stock_qty": payload.quantity,
        "verification_status": "Verified",
        "mrp_variance_warning": bool(verification.get("warnings")),
        "created_at": _iso(now),
    }
    await db.inventory_batches.insert_one(inv_doc)
    inv_doc.pop("_id", None)

    return {
        "verification": verification,
        "inventory_written": True,
        "inventory_batch": inv_doc,
        "telemetry": telemetry_doc,
        "triggered_alerts": triggered_alerts,
    }


def random_batch() -> str:
    return uuid.uuid4().hex[:8].upper()


# ---------------- POS Billing (FIFO) ----------------
@api.post("/pharmacy/pos/checkout")
async def pos_checkout(payload: POSCheckoutPayload, request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    today_iso = datetime.now(timezone.utc).date().isoformat()

    receipt_lines: list[dict] = []
    subtotal = 0.0
    for item in payload.items:
        remaining = item.quantity
        med = await db.medicines.find_one({"id": item.medicine_id}, {"_id": 0})
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine not found: {item.medicine_id}")

        # Expiry lock — cannot dispense stock that is already expired
        expired_only = await db.inventory_batches.find_one(
            {
                "pharmacy_id": pharmacy_id,
                "medicine_id": item.medicine_id,
                "current_stock_qty": {"$gt": 0},
                "expiry_date": {"$lt": today_iso},
            },
            {"_id": 0},
        )
        batches = await db.inventory_batches.find(
            {
                "pharmacy_id": pharmacy_id,
                "medicine_id": item.medicine_id,
                "current_stock_qty": {"$gt": 0},
                "verification_status": "Verified",
                "expiry_date": {"$gte": today_iso},
            },
            {"_id": 0},
        ).sort("expiry_date", 1).to_list(200)

        if not batches and expired_only:
            raise HTTPException(
                status_code=400,
                detail=f"Billing locked — all on-hand stock of {med['brand_name']} has expired.",
            )

        deductions = []
        for b in batches:
            if remaining <= 0:
                break
            take = min(remaining, b["current_stock_qty"])
            new_qty = b["current_stock_qty"] - take
            await db.inventory_batches.update_one(
                {"id": b["id"]}, {"$set": {"current_stock_qty": new_qty}}
            )
            deductions.append(
                {
                    "batch_number": b["batch_number"],
                    "expiry_date": b["expiry_date"],
                    "qty_taken": take,
                    "mrp": b["package_declared_mrp"],
                }
            )
            subtotal += take * b["package_declared_mrp"]
            remaining -= take

        if remaining > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {med['brand_name']}: short by {remaining} units",
            )
        receipt_lines.append(
            {
                "medicine": med,
                "requested_qty": item.quantity,
                "deductions": deductions,
                "line_total": round(sum(d["qty_taken"] * d["mrp"] for d in deductions), 2),
            }
        )

    gst_rate = 0.12  # 12% GST default for pharmaceuticals
    taxable = round(subtotal / (1 + gst_rate), 2)
    gst_amount = round(subtotal - taxable, 2)
    cgst = round(gst_amount / 2, 2)
    sgst = round(gst_amount - cgst, 2)

    invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    receipt = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "pharmacy_id": pharmacy_id,
        "user_id": user["id"],
        "lines": receipt_lines,
        "subtotal": round(subtotal, 2),
        "taxable_value": taxable,
        "gst_rate": gst_rate,
        "cgst": cgst,
        "sgst": sgst,
        "gst_total": gst_amount,
        "grand_total": round(subtotal, 2),
        "status": "Paid",
        "timestamp": _iso(datetime.now(timezone.utc)),
    }
    await db.pos_receipts.insert_one({**receipt})
    return _clean(receipt)


# ---------------- Replenishment ----------------
@api.get("/pharmacy/replenishment/low-stock")
async def low_stock(request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    # Sum stock per medicine
    pipeline = [
        {"$match": {"pharmacy_id": pharmacy_id}},
        {
            "$group": {
                "_id": "$medicine_id",
                "total_stock": {"$sum": "$current_stock_qty"},
                "batches": {"$sum": 1},
            }
        },
    ]
    agg = await db.inventory_batches.aggregate(pipeline).to_list(4000)
    med_ids = [a["_id"] for a in agg]
    meds = {
        m["id"]: m
        for m in await db.medicines.find({"id": {"$in": med_ids}}, {"_id": 0}).to_list(4000)
    }
    low = []
    for a in agg:
        med = meds.get(a["_id"])
        if not med:
            continue
        if a["total_stock"] < med["minimum_safety_stock"]:
            low.append(
                {
                    "medicine": med,
                    "total_stock": a["total_stock"],
                    "minimum_safety_stock": med["minimum_safety_stock"],
                    "deficit": med["minimum_safety_stock"] - a["total_stock"],
                }
            )
    low.sort(key=lambda x: x["total_stock"])
    return {"low_stock": low}


@api.get("/pharmacy/replenishment/expiring")
async def expiring(request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    cutoff = (datetime.now(timezone.utc) + timedelta(days=60)).date().isoformat()
    today = datetime.now(timezone.utc).date().isoformat()
    docs = await db.inventory_batches.find(
        {
            "pharmacy_id": pharmacy_id,
            "expiry_date": {"$lte": cutoff, "$gte": today},
            "current_stock_qty": {"$gt": 0},
        },
        {"_id": 0},
    ).sort("expiry_date", 1).to_list(500)
    med_ids = list({d["medicine_id"] for d in docs})
    meds = {
        m["id"]: m
        for m in await db.medicines.find({"id": {"$in": med_ids}}, {"_id": 0}).to_list(4000)
    }
    for d in docs:
        d["medicine"] = meds.get(d["medicine_id"])
    return {"expiring": docs}


@api.post("/pharmacy/replenishment/generate-po")
async def generate_po(request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    low = (await low_stock(request))["low_stock"]
    if not low:
        return {"po": None, "message": "No low-stock items to reorder"}
    lines = []
    for item in low:
        med = item["medicine"]
        qty = max(item["deficit"] * 3, med["minimum_safety_stock"] * 2)
        lines.append(
            {
                "medicine_id": med["id"],
                "brand_name": med["brand_name"],
                "generic_composition": med["generic_composition"],
                "reorder_qty": qty,
                "expected_unit_price": med["expected_mrp_baseline"] * 0.7,
            }
        )
    total = round(sum(l["reorder_qty"] * l["expected_unit_price"] for l in lines), 2)
    po = {
        "id": str(uuid.uuid4()),
        "po_number": f"KYR-PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "pharmacy_id": pharmacy_id,
        "generated_by": user["id"],
        "lines": lines,
        "estimated_total": total,
        "status": "Draft",
        "created_at": _iso(datetime.now(timezone.utc)),
    }
    await db.purchase_orders.insert_one({**po})
    return {"po": _clean(po)}


@api.get("/pharmacy/purchase-orders")
async def list_pos(request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    docs = await db.purchase_orders.find({"pharmacy_id": pharmacy_id}, {"_id": 0}).sort(
        "created_at", -1
    ).to_list(50)
    return {"purchase_orders": docs}


class ManualPOLine(BaseModel):
    medicine_id: str
    quantity: int = Field(ge=1)


class ManualPOPayload(BaseModel):
    distributor_id: str
    expected_delivery_date: str
    lines: List[ManualPOLine]
    notes: Optional[str] = ""


@api.post("/pharmacy/purchase-orders/manual")
async def create_manual_po(payload: ManualPOPayload, request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    if not payload.lines:
        raise HTTPException(status_code=400, detail="At least one line item is required")

    distributor = await db.distributors.find_one({"id": payload.distributor_id}, {"_id": 0})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")

    lines_out = []
    total = 0.0
    for l in payload.lines:
        med = await db.medicines.find_one({"id": l.medicine_id}, {"_id": 0})
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine not found: {l.medicine_id}")
        unit = float(med.get("expected_mrp_baseline", 0) or 0) * 0.7
        lines_out.append({
            "medicine_id": med["id"],
            "brand_name": med["brand_name"],
            "generic_composition": med["generic_composition"],
            "reorder_qty": l.quantity,
            "expected_unit_price": unit,
        })
        total += unit * l.quantity

    po = {
        "id": str(uuid.uuid4()),
        "po_number": f"KYR-PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "pharmacy_id": pharmacy_id,
        "distributor_id": distributor["id"],
        "distributor_name": distributor["company_name"],
        "expected_delivery_date": payload.expected_delivery_date,
        "notes": (payload.notes or "").strip()[:400],
        "generated_by": user["id"],
        "creation_mode": "Manual",
        "lines": lines_out,
        "estimated_total": round(total, 2),
        "status": "Draft",
        "created_at": _iso(datetime.now(timezone.utc)),
    }
    await db.purchase_orders.insert_one({**po})
    return {"po": _clean(po)}


# ---------------- Sales & Invoice History ----------------
@api.get("/pharmacy/pos/receipts")
async def list_receipts(request: Request, q: Optional[str] = None):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    query: dict = {"pharmacy_id": pharmacy_id}
    if q:
        q_norm = sanitize_string(q, 80)
        query["$or"] = [
            {"invoice_number": {"$regex": q_norm, "$options": "i"}},
            {"lines.medicine.brand_name": {"$regex": q_norm, "$options": "i"}},
            {"lines.medicine.generic_composition": {"$regex": q_norm, "$options": "i"}},
        ]
    docs = await db.pos_receipts.find(query, {"_id": 0}).sort("timestamp", -1).to_list(200)
    return {"receipts": docs}


@api.get("/pharmacy/pos/receipts/{invoice_number}")
async def get_receipt(invoice_number: str, request: Request):
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")
    doc = await db.pos_receipts.find_one(
        {"pharmacy_id": pharmacy_id, "invoice_number": invoice_number}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"receipt": doc}


# ---------------- Telemetry ----------------
@api.get("/pharmacy/telemetry/volumetric")
async def telemetry_volumetric(request: Request):
    await require_pharmacy_staff(request, db)
    pipeline = [
        {
            "$group": {
                "_id": "$batch_number",
                "total_units": {"$sum": "$quantity"},
                "scans": {"$sum": 1},
                "cities": {"$addToSet": "$city"},
                "latest": {"$max": "$timestamp"},
            }
        },
        {"$sort": {"total_units": -1}},
        {"$limit": 25},
    ]
    docs = await db.scan_telemetry.aggregate(pipeline).to_list(25)
    for d in docs:
        d["batch_number"] = d.pop("_id")
        d["threshold_exceeded"] = d["total_units"] > 40000
    return {"volumetric": docs, "threshold": 40000}


@api.get("/pharmacy/telemetry/spatial")
async def telemetry_spatial(request: Request):
    await require_pharmacy_staff(request, db)
    # gather batches logged in ≥2 cities within 12h
    logs_all = await db.scan_telemetry.find(
        {}, {"_id": 0, "batch_number": 1, "city": 1, "timestamp": 1, "quantity": 1}
    ).sort("timestamp", 1).to_list(3000)
    by_batch: dict[str, list] = {}
    for doc in logs_all:
        by_batch.setdefault(doc["batch_number"], []).append(doc)

    alerts = []
    for batch, logs in by_batch.items():
        logs.sort(key=lambda x: x["timestamp"])
        for i in range(len(logs) - 1):
            a, b = logs[i], logs[i + 1]
            if a["city"] and b["city"] and a["city"] != b["city"]:
                try:
                    ta = datetime.fromisoformat(a["timestamp"].replace("Z", "+00:00"))
                    tb = datetime.fromisoformat(b["timestamp"].replace("Z", "+00:00"))
                    delta_h = abs((tb - ta).total_seconds() / 3600)
                    if delta_h <= 12:
                        alerts.append(
                            {
                                "batch_number": batch,
                                "from_city": a["city"],
                                "to_city": b["city"],
                                "gap_hours": round(delta_h, 2),
                                "first_ts": a["timestamp"],
                                "second_ts": b["timestamp"],
                            }
                        )
                        break
                except Exception:
                    continue
    alerts.sort(key=lambda x: x["gap_hours"])
    return {"spatial_anomalies": alerts[:30]}


@api.get("/pharmacy/security-alerts")
async def security_alerts(request: Request):
    await require_pharmacy_staff(request, db)
    docs = await db.security_alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"alerts": docs}


@api.get("/pharmacy/recalls")
async def recalls(request: Request):
    await require_pharmacy_staff(request, db)
    docs = await db.cdsco_recalls.find({}, {"_id": 0}).sort("date_published", -1).to_list(100)
    return {"recalls": docs}


@api.post("/pharmacy/reset-demo")
async def reset_demo(request: Request):
    """Purge only demo-generated intake artefacts so the CLEAN sample stays green
    across repeat demonstrations. Preserves original seed data (marked demo_generated=None)."""
    user = await require_pharmacy_staff(request, db)
    pharmacy_id = user.get("associated_pharmacy_id")

    alerts_del = await db.security_alerts.delete_many({"demo_generated": True})
    telemetry_del = await db.scan_telemetry.delete_many({"pharmacy_id": pharmacy_id, "batch_number": {"$in": ["CRO241001", "ABC000111", "PCM240721", "XYZ000999"]}})
    # remove inventory batches created by demo intakes (batch numbers from samples)
    inv_del = await db.inventory_batches.delete_many({
        "pharmacy_id": pharmacy_id,
        "batch_number": {"$in": ["CRO241001", "ABC000111", "PCM240721"]}
    })
    po_del = await db.purchase_orders.delete_many({"pharmacy_id": pharmacy_id})
    return {
        "cleared": {
            "security_alerts": alerts_del.deleted_count,
            "scan_telemetry": telemetry_del.deleted_count,
            "inventory_batches": inv_del.deleted_count,
            "purchase_orders": po_del.deleted_count,
        }
    }


@api.get("/pharmacy/telemetry/timeline")
async def telemetry_timeline(request: Request, hours: int = 168):
    """Return a 7-day hourly histogram of scan telemetry activity, split by
    status_badge (Valid vs Anomaly_Flagged) — powers the timeline heat-map."""
    await require_pharmacy_staff(request, db)
    hours = max(24, min(hours, 24 * 30))
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff}}},
        {"$project": {
            "hour": {"$substr": ["$timestamp", 0, 13]},  # YYYY-MM-DDTHH
            "status_badge": 1,
            "quantity": {"$ifNull": ["$quantity", 0]},
        }},
        {"$group": {
            "_id": {"hour": "$hour", "status": "$status_badge"},
            "count": {"$sum": 1},
            "units": {"$sum": "$quantity"},
        }},
        {"$sort": {"_id.hour": 1}},
    ]
    docs = await db.scan_telemetry.aggregate(pipeline).to_list(2000)
    by_hour: dict[str, dict] = {}
    for d in docs:
        h = d["_id"]["hour"]
        entry = by_hour.setdefault(h, {"hour": h, "valid": 0, "anomaly": 0, "valid_units": 0, "anomaly_units": 0})
        if d["_id"]["status"] == "Anomaly_Flagged":
            entry["anomaly"] += d["count"]
            entry["anomaly_units"] += d["units"]
        else:
            entry["valid"] += d["count"]
            entry["valid_units"] += d["units"]
    timeline = sorted(by_hour.values(), key=lambda x: x["hour"])
    return {"timeline": timeline, "window_hours": hours}


@api.get("/pharmacy/export/audit-log.csv")
async def export_audit_log(request: Request):
    """Regulator-ready CSV audit-log export: telemetry + security alerts + recalls."""
    from fastapi.responses import StreamingResponse
    import csv
    from io import StringIO

    await require_pharmacy_staff(request, db)
    telemetry = await db.scan_telemetry.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5000)
    alerts = await db.security_alerts.find({}, {"_id": 0}).to_list(1000)

    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "record_type", "timestamp", "batch_number", "scanned_gtin", "city",
        "quantity", "status_badge", "alert_type", "severity", "cryptographic_telemetry_hash",
    ])
    for t in telemetry:
        writer.writerow([
            "telemetry",
            t.get("timestamp", ""),
            t.get("batch_number", ""),
            t.get("scanned_gtin", ""),
            t.get("city", ""),
            t.get("quantity", 0),
            t.get("status_badge", ""),
            "",
            "",
            t.get("cryptographic_telemetry_hash", ""),
        ])
    for a in alerts:
        writer.writerow([
            "security_alert",
            a.get("created_at", ""),
            a.get("target_batch_number", ""),
            "",
            "",
            "",
            "",
            a.get("alert_type", ""),
            a.get("severity", ""),
            "",
        ])
    buf.seek(0)
    filename = f"kyrenis-audit-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@api.get("/pharmacy/pos/receipts-legacy")
async def list_receipts_legacy(request: Request):
    """Deprecated — kept for backwards compat. Use /pharmacy/pos/receipts."""
    user = await require_pharmacy_staff(request, db)
    docs = await db.pos_receipts.find(
        {"pharmacy_id": user.get("associated_pharmacy_id")}, {"_id": 0}
    ).sort("timestamp", -1).to_list(20)
    return {"receipts": docs}


# ---------------- Consumer Trust Hub ----------------
@api.post("/consumer/verify-batch")
async def consumer_verify(payload: ConsumerVerifyPayload):
    """Lookup a batch against the integrated CDSCO NSQ / Recall / Spurious dataset.

    - If the batch exists in the dataset → High Risk / Regulatory Alert.
    - If the batch is not present → Low Risk / No Regulatory Alert Found.
    No heuristics, no invented alerts — only exact dataset matches are flagged.
    """
    from cdsco_repository import lookup_batch, normalize_batch
    from verification import parse_gs1_datamatrix

    qr = sanitize_string(payload.qr_string or "", 1024)
    manual_batch = sanitize_string((payload.batch_number or "").upper(), 60)

    parsed = parse_gs1_datamatrix(qr) if qr else {}
    gtin = parsed.get("01", "").lstrip("0")
    batch_raw = parsed.get("10", "") or manual_batch or ""
    expiry = parsed.get("17", "") or ""
    serial = parsed.get("21", "") or ""

    hit = lookup_batch(batch_raw)

    if hit:
        return {
            "risk_score": 95,
            "severity": "High Risk",
            "headline": "Regulatory Alert",
            "alert_found": True,
            "alert_card": {
                "product_name": hit.get("product_name", ""),
                "batch_number": hit.get("batch_raw") or hit.get("batch_number", ""),
                "manufacturer": hit.get("manufacturer", ""),
                "alert_category": hit.get("alert_category", "NSQ"),
                "failure_reason": hit.get("failure_reason", ""),
                "reporting_authority": hit.get("reporting_source", "CDSCO"),
                "reporting_lab": hit.get("reporting_lab", ""),
                "reporting_month": hit.get("reporting_month", ""),
                # Legacy field kept for existing UI compatibility.
                "reporting_date": hit.get("reporting_month", ""),
                "source": "CDSCO",
            },
            "parsed_payload": {
                "gtin": gtin or None,
                "batch_number": batch_raw or None,
                "expiry": expiry or None,
                "serial": serial or None,
            },
        }

    return {
        "risk_score": 5,
        "severity": "Low Risk",
        "headline": "No Regulatory Alert Found",
        "alert_found": False,
        "message": "This batch was not found in the integrated CDSCO NSQ, Recall or Spurious Drug datasets.",
        "parsed_payload": {
            "gtin": gtin or None,
            "batch_number": batch_raw or None,
            "expiry": expiry or None,
            "serial": serial or None,
        },
    }


@api.get("/public/metrics")
async def public_metrics():
    """Live dataset counts used by the marketing landing page."""
    from cdsco_repository import dataset_stats
    s = dataset_stats()
    return {
        "alert_categories_monitored": len(s["categories"]) or 3,
        "categories": s["categories"] or ["NSQ", "Recall", "Spurious"],
        "flagged_batches_indexed": s["unique_batches"],
        "cdsco_records_indexed": s["total_records"],
        "advisory_refresh_cycle": "Monthly",
    }


@api.post("/public/contact")
async def public_contact(payload: ContactEnquiryPayload):
    """Route a contact-form enquiry to the internal Kyrenis inbox.

    The destination address is never rendered in the UI — see
    `email_dispatch._CONTACT_INBOX`."""
    enquiry = {
        "name": sanitize_string(payload.name, 120),
        "email": sanitize_string(payload.email, 200),
        "organisation": sanitize_string(payload.organisation or "", 200),
        "category": sanitize_string(payload.category, 40),
        "message": sanitize_string(payload.message, 4000),
    }
    # Fire-and-forget delivery — the API always confirms receipt so demo users
    # aren't blocked if the email integration is offline. Logs record every send.
    await dispatch_contact_email(enquiry)
    return {
        "submitted": True,
        "message": "Thank you for contacting Kyrenis. Your enquiry has been submitted successfully.",
    }


@api.get("/consumer/openfda")
async def openfda_search(q: str):
    q = sanitize_string(q, 80)
    if not q:
        raise HTTPException(status_code=400, detail="Query is required")
    key = os.environ.get("OPENFDA_API_KEY", "")
    url = (
        f'https://api.fda.gov/drug/label.json?search='
        f'openfda.brand_name:"{q}"+OR+openfda.generic_name:"{q}"&limit=3'
    )
    if key:
        url += f"&api_key={key}"
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.get(url)
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenFDA unreachable: {e}")

    results = []
    for entry in data.get("results", []):
        openfda = entry.get("openfda", {}) or {}
        results.append(
            {
                "brand_name": (openfda.get("brand_name") or [q])[0],
                "generic_name": (openfda.get("generic_name") or [""])[0],
                "manufacturer_name": (openfda.get("manufacturer_name") or [""])[0],
                "warnings": entry.get("warnings") or entry.get("boxed_warning") or [],
                "adverse_reactions": entry.get("adverse_reactions") or [],
                "dosage_and_administration": entry.get("dosage_and_administration") or [],
                "indications_and_usage": entry.get("indications_and_usage") or [],
                "contraindications": entry.get("contraindications") or [],
            }
        )
    return {"query": q, "count": len(results), "results": results}


@api.get("/")
async def root():
    return {"app": "Kyrenis Pharmacy OS", "tagline": "Scan-Verify-Trust"}


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.medicines.create_index("global_gtin")
    await db.inventory_batches.create_index([("pharmacy_id", 1), ("medicine_id", 1)])
    await db.scan_telemetry.create_index("batch_number")
    await db.scan_telemetry.create_index("timestamp")
    await db.cdsco_recalls.create_index("target_batch_number")
    await db.security_alerts.create_index("target_batch_number")
    # seed
    counts = await seed_all(db)
    logger.info("Kyrenis seed complete: %s", counts)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# Mount router
app.include_router(api)

# CORS
frontend_url = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in frontend_url.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
