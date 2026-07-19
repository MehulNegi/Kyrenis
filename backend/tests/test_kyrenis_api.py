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


# ---------------- Consumer (public) ----------------
class TestConsumer:
    def test_verify_recall_red(self, anon_session):
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "qr_string": "(01)89000000000021(10)PCM240721(17)261231"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["shield"] == "red"
        assert v["batch_number"] == "PCM240721"

    def test_verify_security_alert_red(self, anon_session):
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "SAT240000"
        })
        assert r.status_code == 200
        v = r.json()
        assert v["shield"] == "red"

    def test_verify_teleport_red(self, anon_session):
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "TEL240000"
        })
        assert r.status_code == 200
        assert r.json()["shield"] == "red"

    def test_verify_clean_green(self, anon_session):
        r = anon_session.post(f"{API}/consumer/verify-batch", json={
            "batch_number": "UNKNOWN_CLEAN_ZZZ_" + os.urandom(3).hex().upper()
        })
        assert r.status_code == 200
        assert r.json()["shield"] == "green"

    def test_openfda_ibuprofen(self, anon_session):
        r = anon_session.get(f"{API}/consumer/openfda", params={"q": "Ibuprofen"}, timeout=20)
        assert r.status_code == 200
        j = r.json()
        assert j["count"] >= 1
        first = j["results"][0]
        assert "warnings" in first
        assert "adverse_reactions" in first
