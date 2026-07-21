"""Kyrenis Pharmacy OS - Backend regression tests."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://scan-verify-trust.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

STAFF_EMAIL = "chemist@kyrenis.in"
STAFF_PASSWORD = "password"


@pytest.fixture(scope="session")
def anon_session():
    return requests.Session()


@pytest.fixture(scope="session")
def auth_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies or r.json().get("access_token")
    return s


# ---------------- Auth ----------------
class TestAuth:
    def test_root(self, anon_session):
        r = anon_session.get(f"{API}/")
        assert r.status_code == 200
        assert "Kyrenis" in r.json().get("app", "")

    def test_login_success(self, anon_session):
        r = anon_session.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == STAFF_EMAIL
        assert data["user"]["designated_role"] == "PHARMACY_STAFF"

    def test_login_invalid(self, anon_session):
        r = anon_session.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_pharmacy_route_unauth_401(self):
        # Fresh session, no cookies
        r = requests.get(f"{API}/pharmacy/medicines")
        assert r.status_code == 401

    def test_auth_me(self, auth_session):
        r = auth_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["user"]["email"] == STAFF_EMAIL


# ---------------- Reference Data ----------------
class TestReferenceData:
    def test_distributors(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/distributors")
        assert r.status_code == 200
        dists = r.json()["distributors"]
        assert len(dists) >= 5
        assert all("_id" not in d for d in dists)

    def test_medicines(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/medicines")
        assert r.status_code == 200
        meds = r.json()["medicines"]
        assert len(meds) >= 100

    def test_inventory(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/inventory")
        assert r.status_code == 200
        inv = r.json()["inventory"]
        assert len(inv) >= 100


# ---------------- 4-Step Verification ----------------
class TestStockIntake:
    def _payload(self, qr, ocr, batch, mrp=45.0):
        return {
            "qr_string": qr,
            "ocr_text": ocr,
            "distributor_id": "will-fill",
            "medicine_id": "will-fill",
            "batch_number": batch,
            "package_declared_mrp": mrp,
            "quantity": 100,
            "mfg_date": "2024-01-01",
            "expiry_date": "2026-12-31",
            "scan_city": "Mumbai",
        }

    @pytest.fixture(scope="class")
    def dist_and_med(self, auth_session):
        d = auth_session.get(f"{API}/pharmacy/distributors").json()["distributors"][0]["id"]
        m = auth_session.get(f"{API}/pharmacy/medicines").json()["medicines"][0]["id"]
        return d, m

    def test_intake_recall_hit_blocked(self, auth_session, dist_and_med):
        d, m = dist_and_med
        p = self._payload(
            "(01)89000000000021(10)PCM240721(17)261231",
            "BATCH: PCM240721 EXP: 12/2026",
            "PCM240721",
        )
        p["distributor_id"] = d
        p["medicine_id"] = m
        r = auth_session.post(f"{API}/pharmacy/intake", json=p)
        assert r.status_code == 200
        j = r.json()
        assert j["inventory_written"] is False
        assert j["verification"]["status"] != "Valid"
        # Ensure recall check present
        checks = j["verification"]["checks"]
        assert any(c["name"] == "CDSCO Recall Registry" and not c["passed"] for c in checks)

    def test_intake_mismatch_check1_fails(self, auth_session, dist_and_med):
        d, m = dist_and_med
        p = self._payload(
            "(01)89000000000038(10)AAA12345(17)261231",
            "BATCH: BBB98765 EXP: 12/2026",
            "AAA12345",
        )
        p["distributor_id"] = d
        p["medicine_id"] = m
        r = auth_session.post(f"{API}/pharmacy/intake", json=p)
        assert r.status_code == 200
        j = r.json()
        assert j["inventory_written"] is False
        checks = j["verification"]["checks"]
        assert checks[0]["name"] == "Packaging Metadata Match"
        assert checks[0]["passed"] is False

    def test_intake_clean_writes_inventory(self, auth_session, dist_and_med):
        d, m = dist_and_med
        p = self._payload(
            "(01)89000000000014(10)CLEAN9999(17)261231",
            "BATCH: CLEAN9999 EXP: 12/2026",
            "CLEAN9999",
        )
        p["distributor_id"] = d
        p["medicine_id"] = m
        r = auth_session.post(f"{API}/pharmacy/intake", json=p)
        assert r.status_code == 200
        j = r.json()
        assert j["verification"]["status"] == "Valid"
        assert j["inventory_written"] is True
        assert j["inventory_batch"]["batch_number"] == "CLEAN9999"
        # telemetry hash present
        assert len(j["telemetry"]["cryptographic_telemetry_hash"]) == 64


# ---------------- Replenishment & PO ----------------
class TestReplenishment:
    def test_low_stock(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/replenishment/low-stock")
        assert r.status_code == 200
        assert isinstance(r.json()["low_stock"], list)

    def test_expiring(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/replenishment/expiring")
        assert r.status_code == 200

    def test_generate_po(self, auth_session):
        r = auth_session.post(f"{API}/pharmacy/replenishment/generate-po")
        assert r.status_code == 200
        po = r.json().get("po")
        if po is not None:
            assert po["po_number"].startswith("KYR-PO-")
            # verify listed
            r2 = auth_session.get(f"{API}/pharmacy/purchase-orders")
            assert r2.status_code == 200
            assert any(x["id"] == po["id"] for x in r2.json()["purchase_orders"])


# ---------------- Telemetry ----------------
class TestTelemetry:
    def test_volumetric(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/telemetry/volumetric")
        assert r.status_code == 200
        assert r.json()["threshold"] == 40000

    def test_spatial(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/telemetry/spatial")
        assert r.status_code == 200
        assert isinstance(r.json()["spatial_anomalies"], list)

    def test_alerts(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/security-alerts")
        assert r.status_code == 200
        assert len(r.json()["alerts"]) >= 15

    def test_recalls(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/recalls")
        assert r.status_code == 200
        assert len(r.json()["recalls"]) >= 5


# ---------------- POS FIFO ----------------
class TestPOS:
    def test_checkout_fifo(self, auth_session):
        inv = auth_session.get(f"{API}/pharmacy/inventory").json()["inventory"]
        # Pick a medicine with sufficient stock
        target = None
        for i in inv:
            if i.get("current_stock_qty", 0) >= 2 and i.get("verification_status") == "Verified":
                target = i
                break
        assert target, "No suitable stock for POS test"
        r = auth_session.post(f"{API}/pharmacy/pos/checkout", json={
            "items": [{"medicine_id": target["medicine_id"], "quantity": 1}]
        })
        assert r.status_code == 200
        rec = r.json()
        assert rec["grand_total"] > 0
        assert len(rec["lines"][0]["deductions"]) >= 1


# ---------------- Consumer (public) - CDSCO Risk Score API ----------------
class TestConsumer:
    # SHT7550 is a real record in the integrated CDSCO NSQ dataset
    # (Levocetirizine Hydrochloride Tablets IP 5 MG, Syncom Healthcare Ltd).
    def test_verify_high_risk_match(self, anon_session):
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "SHT7550", "medicine_name": "Levocetirizine"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["alert_found"] is True
        assert v["severity"] == "High Risk"
        assert v["headline"] == "Regulatory Alert"
        assert v["risk_score"] >= 80
        assert v["alert_card"]["source"] == "CDSCO"
        assert v["alert_card"]["batch_number"].upper().replace("-", "") == "SHT7550"
        assert v["alert_card"]["alert_category"] in ("NSQ", "Recall", "Spurious")

    def test_verify_high_risk_second_batch(self, anon_session):
        # Second known real batch — Sterile Disposable Syringe (batch 21702S1117)
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "21702S1117"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["alert_found"] is True
        assert v["severity"] == "High Risk"

    def test_verify_qr_extracted_batch(self, anon_session):
        # GS1 payload embedding a known dataset batch (SHT7550) via AI (10)
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "qr_string": "(01)89000000000021(10)SHT7550(17)201130"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["alert_found"] is True
        assert v["severity"] == "High Risk"

    def test_verify_low_risk_no_match(self, anon_session):
        # Random batch NOT present in the integrated dataset
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "CLEAN00000000001"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["alert_found"] is False
        assert v["severity"] == "Low Risk"
        assert v["headline"] == "No Regulatory Alert Found"
        assert v["risk_score"] < 20

    def test_openfda_paracetamol(self, anon_session):
        # Backend uses `q` param name; try both to be tolerant
        r = anon_session.get(f"{API}/consumer/openfda", params={"q": "paracetamol"}, timeout=20)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "results" in j and "count" in j
        if j["count"] >= 1:
            first = j["results"][0]
            assert "warnings" in first
            assert "adverse_reactions" in first
            assert "dosage_and_administration" in first


# ---------------- Register / Auth-me ----------------
class TestRegister:
    def test_register_new_staff(self, anon_session):
        import uuid as _u
        email = f"TEST_staff_{_u.uuid4().hex[:8]}@kyrenis.in".lower()
        r = anon_session.post(f"{API}/auth/register", json={
            "email": email, "password": "password123"
        })
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["user"]["email"] == email
        assert j["user"]["designated_role"] == "PHARMACY_STAFF"
        assert "access_token" in j


# ---------------- Receipts, Invoice Detail, Manual PO, Timeline, CSV ----------------
class TestExtras:
    def test_receipts_and_detail(self, auth_session):
        # Ensure at least one receipt exists (POS test creates one; else create now)
        inv = auth_session.get(f"{API}/pharmacy/inventory").json()["inventory"]
        target = next((i for i in inv if i.get("current_stock_qty", 0) >= 1 and i.get("verification_status") == "Verified"), None)
        assert target
        auth_session.post(f"{API}/pharmacy/pos/checkout", json={
            "items": [{"medicine_id": target["medicine_id"], "quantity": 1}]
        })
        r = auth_session.get(f"{API}/pharmacy/pos/receipts")
        assert r.status_code == 200
        receipts = r.json()["receipts"]
        assert len(receipts) >= 1
        inv_no = receipts[0]["invoice_number"]
        assert inv_no.startswith("INV-")
        # Detail
        r2 = auth_session.get(f"{API}/pharmacy/pos/receipts/{inv_no}")
        assert r2.status_code == 200
        assert r2.json()["receipt"]["invoice_number"] == inv_no

    def test_invoice_detail_404(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/pos/receipts/NOPE-INV-XYZ")
        assert r.status_code == 404

    def test_manual_po(self, auth_session):
        dist = auth_session.get(f"{API}/pharmacy/distributors").json()["distributors"][0]
        med = auth_session.get(f"{API}/pharmacy/medicines").json()["medicines"][0]
        r = auth_session.post(f"{API}/pharmacy/purchase-orders/manual", json={
            "distributor_id": dist["id"],
            "expected_delivery_date": "2026-03-15",
            "lines": [{"medicine_id": med["id"], "quantity": 50}],
            "notes": "TEST_manual PO"
        })
        assert r.status_code == 200, r.text
        po = r.json()["po"]
        assert po["po_number"].startswith("KYR-PO-")
        assert po["creation_mode"] == "Manual"
        assert po["distributor_id"] == dist["id"]
        # Verify listing
        listing = auth_session.get(f"{API}/pharmacy/purchase-orders").json()["purchase_orders"]
        assert any(p["id"] == po["id"] for p in listing)

    def test_telemetry_timeline(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/telemetry/timeline")
        assert r.status_code == 200
        assert isinstance(r.json().get("timeline", []), list)

    def test_audit_csv(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/export/audit-log.csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        # header line present
        assert "batch_number" in r.text.splitlines()[0]
