"""Kyrenis Pharmacy OS - iteration-3 new feature backend tests."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://scan-verify-trust.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

STAFF_EMAIL = "chemist@kyrenis.in"
STAFF_PASSWORD = "password"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=15)
    assert r.status_code == 200
    return s


# ----- Reset Demo -----
class TestResetDemo:
    def test_unauth_401(self):
        r = requests.post(f"{API}/pharmacy/reset-demo")
        assert r.status_code == 401

    def test_reset_returns_cleared(self, auth_session):
        # Seed pollution first: submit a sample-recall intake to guarantee a demo alert row
        d = auth_session.get(f"{API}/pharmacy/distributors").json()["distributors"][0]["id"]
        m = auth_session.get(f"{API}/pharmacy/medicines").json()["medicines"][0]["id"]
        payload = {
            "qr_string": "(01)89000000000021(10)PCM240721(17)261231",
            "ocr_text": "BATCH: PCM240721 EXP: 12/2026",
            "distributor_id": d, "medicine_id": m, "batch_number": "PCM240721",
            "package_declared_mrp": 45.0, "quantity": 100,
            "mfg_date": "2024-01-01", "expiry_date": "2026-12-31", "scan_city": "Mumbai",
        }
        auth_session.post(f"{API}/pharmacy/intake", json=payload)

        r = auth_session.post(f"{API}/pharmacy/reset-demo")
        assert r.status_code == 200
        j = r.json()
        assert "cleared" in j
        c = j["cleared"]
        for key in ("security_alerts", "scan_telemetry", "inventory_batches", "purchase_orders"):
            assert key in c
            assert isinstance(c[key], int)

    def test_seed_data_unchanged_after_reset(self, auth_session):
        # Reset already ran above; verify seeds intact.
        meds = auth_session.get(f"{API}/pharmacy/medicines").json()["medicines"]
        recalls = auth_session.get(f"{API}/pharmacy/recalls").json()["recalls"]
        dists = auth_session.get(f"{API}/pharmacy/distributors").json()["distributors"]
        alerts = auth_session.get(f"{API}/pharmacy/security-alerts").json()["alerts"]
        assert len(meds) >= 100
        assert len(recalls) >= 5
        assert len(dists) >= 5
        # seed alerts have demo_generated != True, so >=15 seeded should survive
        seeded_alerts = [a for a in alerts if not a.get("demo_generated")]
        assert len(seeded_alerts) >= 15


# ----- Telemetry Timeline -----
class TestTelemetryTimeline:
    def test_unauth_401(self):
        r = requests.get(f"{API}/pharmacy/telemetry/timeline")
        assert r.status_code == 401

    def test_default_window(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/telemetry/timeline?hours=168")
        assert r.status_code == 200
        j = r.json()
        assert "timeline" in j and "window_hours" in j
        assert isinstance(j["timeline"], list)
        assert j["window_hours"] == 168
        # Check schema of buckets if any
        for b in j["timeline"]:
            assert set(b.keys()) >= {"hour", "valid", "anomaly", "valid_units", "anomaly_units"}
        # Sorted ascending
        hours = [b["hour"] for b in j["timeline"]]
        assert hours == sorted(hours)


# ----- Audit-log CSV export -----
class TestAuditLogCSV:
    def test_unauth_401(self):
        r = requests.get(f"{API}/pharmacy/export/audit-log.csv")
        assert r.status_code == 401

    def test_csv_download(self, auth_session):
        r = auth_session.get(f"{API}/pharmacy/export/audit-log.csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd and ".csv" in cd
        header = r.text.split("\n", 1)[0].strip()
        assert header == "record_type,timestamp,batch_number,scanned_gtin,city,quantity,status_badge,alert_type,severity,cryptographic_telemetry_hash"


# ----- Email dispatch fire-and-forget -----
class TestEmailDispatchFireAndForget:
    def test_recall_intake_still_200_and_no_inventory(self, auth_session):
        d = auth_session.get(f"{API}/pharmacy/distributors").json()["distributors"][0]["id"]
        m = auth_session.get(f"{API}/pharmacy/medicines").json()["medicines"][0]["id"]
        payload = {
            "qr_string": "(01)89000000000021(10)PCM240721(17)261231",
            "ocr_text": "BATCH: PCM240721 EXP: 12/2026",
            "distributor_id": d, "medicine_id": m, "batch_number": "PCM240721",
            "package_declared_mrp": 45.0, "quantity": 100,
            "mfg_date": "2024-01-01", "expiry_date": "2026-12-31", "scan_city": "Mumbai",
        }
        import time as _t
        t0 = _t.time()
        r = auth_session.post(f"{API}/pharmacy/intake", json=payload)
        elapsed = _t.time() - t0
        assert r.status_code == 200
        j = r.json()
        assert j["inventory_written"] is False
        # Regression: email dispatch must be non-blocking (asyncio.create_task)
        assert elapsed < 3.0, f"Intake response too slow ({elapsed:.2f}s) — email dispatch appears to be blocking"
