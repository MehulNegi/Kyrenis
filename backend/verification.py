"""4-step verification pipeline + telemetry engines for Kyrenis."""
import re
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any


# ---------- QR + text sanitization ----------
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")
_INJECTION_PATTERNS = re.compile(
    r"(<script|javascript:|onerror=|onload=|--\s*$|;\s*drop\s+table|\$where|\$ne\s*:)",
    re.IGNORECASE,
)


def sanitize_string(value: str, max_len: int = 512) -> str:
    if not isinstance(value, str):
        value = str(value)
    value = _CONTROL_CHARS.sub("", value).strip()
    value = _INJECTION_PATTERNS.sub("", value)
    return value[:max_len]


# ---------- GS1 DataMatrix parser ----------
GS = "\x1d"  # GS1 group separator


def parse_gs1_datamatrix(raw: str) -> dict:
    """Parse a GS1-formatted string into AIs: 01 (GTIN), 10 (batch), 17 (expiry),
    21 (serial), 3103/3922 (variable). Very forgiving: also accepts pipe or space
    delimiters and inline parenthesized AIs like (01)08901234567892(10)PCM240721.
    """
    if not raw:
        return {}

    # Parenthesized form: (01)0890...(10)PCM...(17)241231(21)ABC
    paren = re.findall(r"\((\d{2,4})\)([^\(]+)", raw)
    if paren:
        parsed = {}
        for ai, val in paren:
            parsed[ai] = val.strip().rstrip(GS)
        return parsed

    # Delimited/plain form. Normalize separators.
    text = raw.replace("|", GS).replace("  ", GS)
    parsed: dict[str, str] = {}
    i = 0
    fixed_len = {"01": 14, "17": 6, "11": 6, "15": 6}
    var_ai = {"10", "21", "22"}

    while i < len(text):
        if not text[i].isdigit():
            i += 1
            continue
        # peek 2-digit AI
        ai = text[i : i + 2]
        i += 2
        if ai in fixed_len:
            ln = fixed_len[ai]
            parsed[ai] = text[i : i + ln]
            i += ln
        elif ai in var_ai:
            # read until GS or end
            j = text.find(GS, i)
            if j == -1:
                j = len(text)
            parsed[ai] = text[i:j]
            i = j + 1
        else:
            # skip unknown AI, advance one char
            continue
    return parsed


# ---------- Modulo 10 (Luhn/GS1) check ----------
def gtin_mod10_valid(gtin: str) -> bool:
    """Validate GS1 Modulo 10 checksum for GTIN-8/12/13/14."""
    if not gtin or not gtin.isdigit():
        return False
    if len(gtin) not in (8, 12, 13, 14):
        return False
    digits = [int(d) for d in gtin]
    check = digits[-1]
    body = digits[:-1][::-1]  # rightmost body digit gets weight 3
    total = 0
    for idx, d in enumerate(body):
        weight = 3 if idx % 2 == 0 else 1
        total += d * weight
    calc = (10 - (total % 10)) % 10
    return calc == check


# ---------- Extract expiry from OCR ----------
_DATE_RE = re.compile(r"(20\d{2})[/\-.](\d{1,2})|EXP[:\s]*([0-9]{2})[/\-.]([0-9]{2,4})", re.IGNORECASE)


def extract_ocr_expiry(ocr: str) -> str | None:
    m = re.search(r"EXP[:\s]*([0-9]{2}[/\-.][0-9]{2,4})", ocr, re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.search(r"(20\d{2})[/\-.]?(\d{2})", ocr)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return None


def _yy_mm_from_gs1(yymmdd: str) -> str | None:
    if not yymmdd or len(yymmdd) != 6:
        return None
    yy, mm = yymmdd[:2], yymmdd[2:4]
    return f"20{yy}-{mm}"


def _yy_mm_from_ocr(text: str) -> str | None:
    if not text:
        return None
    # Prefer EXP-anchored capture — else fall back to LAST YYYY-MM/YY-MM in text
    m = re.search(r"EXP[:\s]*([0-9]{2,4})[/\-.]([0-9]{2,4})", text, re.IGNORECASE)
    if m:
        a, b = m.group(1), m.group(2)
        if len(a) == 4:
            return f"{a}-{int(b):02d}"
        if len(b) == 4:
            return f"{b}-{int(a):02d}"
        return f"20{b}-{int(a):02d}"
    matches = re.findall(r"(20\d{2})[/\-.](\d{1,2})", text)
    if matches:
        y, mo = matches[-1]
        return f"{y}-{int(mo):02d}"
    m = re.search(r"(\d{2})[/\-.](\d{2})\b", text)
    if m:
        return f"20{m.group(2)}-{int(m.group(1)):02d}"
    return None


def _batch_from_ocr(text: str) -> str | None:
    m = re.search(r"(?:BATCH|B\.NO|LOT)[:\s#]*([A-Z0-9]{4,20})", text, re.IGNORECASE)
    return m.group(1).upper() if m else None


# ---------- Crypto hash for telemetry ----------
def compute_telemetry_hash(gtin: str, batch: str, pharmacy_id: str | None) -> str:
    seed = f"{gtin or ''}|{batch or ''}|{pharmacy_id or 'GUEST'}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


# ---------- 4-step pipeline ----------
async def run_verification_pipeline(
    db,
    qr_string: str,
    ocr_text: str,
    package_declared_mrp: float | None,
    pharmacy_id: str | None,
    user_id: str,
) -> dict:
    qr_string = sanitize_string(qr_string, 1024)
    ocr_text = sanitize_string(ocr_text, 1024)

    parsed = parse_gs1_datamatrix(qr_string)
    qr_gtin = parsed.get("01", "").lstrip("0")
    qr_batch = parsed.get("10", "").upper()
    qr_expiry_iso = _yy_mm_from_gs1(parsed.get("17", ""))

    ocr_batch = _batch_from_ocr(ocr_text)
    ocr_expiry_iso = _yy_mm_from_ocr(ocr_text)

    results = {
        "parsed_qr": parsed,
        "qr_gtin": qr_gtin,
        "qr_batch": qr_batch,
        "qr_expiry": qr_expiry_iso,
        "ocr_batch": ocr_batch,
        "ocr_expiry": ocr_expiry_iso,
        "checks": [],
        "status": "Valid",
        "final_alert": None,
        "warnings": [],
    }

    # --- Check 1: OCR ↔ QR metadata match ---
    check1 = {"name": "Packaging Metadata Match", "passed": True, "detail": ""}
    if qr_batch and ocr_batch and qr_batch.upper() != ocr_batch.upper():
        check1["passed"] = False
        check1["detail"] = f"QR batch '{qr_batch}' ≠ OCR batch '{ocr_batch}'"
    elif qr_expiry_iso and ocr_expiry_iso and qr_expiry_iso != ocr_expiry_iso:
        check1["passed"] = False
        check1["detail"] = f"QR expiry '{qr_expiry_iso}' ≠ OCR expiry '{ocr_expiry_iso}'"
    results["checks"].append(check1)
    if not check1["passed"]:
        results["status"] = "Anomaly_Flagged"
        results["final_alert"] = {
            "level": "Critical",
            "title": "Packaging Metadata Mismatch",
            "detail": check1["detail"],
        }
        return results

    # --- Check 2: GTIN Mod10 ---
    check2 = {"name": "Modulo-10 GTIN Checksum", "passed": True, "detail": ""}
    if not qr_gtin:
        check2["passed"] = False
        check2["detail"] = "GTIN missing from QR payload"
    elif not gtin_mod10_valid(qr_gtin.zfill(14)):
        check2["passed"] = False
        check2["detail"] = f"GTIN '{qr_gtin}' fails Mod-10 validation"
    results["checks"].append(check2)
    if not check2["passed"]:
        results["status"] = "Anomaly_Flagged"
        results["final_alert"] = {
            "level": "High-Risk",
            "title": "Invalid Barcode Checksum",
            "detail": check2["detail"],
        }
        return results

    # --- Check 3: CDSCO Recall Registry ---
    check3 = {"name": "CDSCO Recall Registry", "passed": True, "detail": ""}
    recall = None
    if qr_batch:
        recall = await db.cdsco_recalls.find_one({"target_batch_number": qr_batch})
    results["checks"].append(check3)
    if recall:
        check3["passed"] = False
        check3["detail"] = f"Active recall: {recall.get('hazard_classification')}"
        results["status"] = "Anomaly_Flagged"
        results["final_alert"] = {
            "level": "Critical",
            "title": "CDSCO Recall Hit",
            "detail": recall.get("hazard_classification"),
            "medicine": recall.get("target_medicine_name"),
            "batch": qr_batch,
            "date_published": recall.get("date_published"),
        }
        return results

    # --- Check 4: MRP deviation ---
    check4 = {"name": "MRP Baseline Comparison", "passed": True, "detail": ""}
    medicine = None
    if qr_gtin:
        medicine = await db.medicines.find_one({"global_gtin": qr_gtin})
    if not medicine:
        # try zero-padded 14
        medicine = await db.medicines.find_one({"global_gtin": qr_gtin.zfill(14)})
    if medicine and package_declared_mrp is not None:
        baseline = float(medicine.get("expected_mrp_baseline", 0) or 0)
        if baseline > 0:
            deviation = abs(package_declared_mrp - baseline) / baseline * 100
            if deviation > 20:
                check4["detail"] = f"MRP variance {deviation:.1f}% vs baseline ₹{baseline:.2f}"
                results["warnings"].append(
                    {"tag": "Suspicious MRP Variance", "detail": check4["detail"]}
                )
    results["checks"].append(check4)

    return results


# ---------- Telemetry rules ----------
VOLUMETRIC_THRESHOLD = 40000
TELEPORT_HOURS = 12


async def run_volumetric_check(db, batch_number: str, qty: int) -> dict | None:
    pipeline = [
        {"$match": {"batch_number": batch_number}},
        {"$group": {"_id": None, "total": {"$sum": "$quantity"}}},
    ]
    agg = await db.scan_telemetry.aggregate(pipeline).to_list(1)
    total = (agg[0]["total"] if agg else 0) + int(qty or 0)
    if total > VOLUMETRIC_THRESHOLD:
        return {
            "alert_type": "Volumetric Saturation",
            "severity": "Critical",
            "message": f"Volumetric threshold exceeded: {total:,} units logged for batch {batch_number}",
            "total_units": total,
        }
    return None


async def run_spatial_check(db, batch_number: str, city: str, ts: datetime) -> dict | None:
    if not city or not batch_number:
        return None
    window_start = ts - timedelta(hours=TELEPORT_HOURS)
    cursor = db.scan_telemetry.find(
        {
            "batch_number": batch_number,
            "city": {"$ne": city},
            "timestamp": {"$gte": window_start.isoformat()},
        }
    ).limit(1)
    async for doc in cursor:
        return {
            "alert_type": "Spatial Teleportation",
            "severity": "High",
            "message": f"Batch {batch_number} logged in {doc.get('city')} then {city} within {TELEPORT_HOURS}h",
            "cities": [doc.get("city"), city],
        }
    return None
