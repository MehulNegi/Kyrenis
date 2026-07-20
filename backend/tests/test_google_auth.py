"""Kyrenis - Google (Emergent-managed) Auth endpoint tests.
Covers:
  - /api/auth/google/session (invalid session_id, missing field)
  - /api/auth/me (JWT + session_token cookie)
  - /api/auth/complete-onboarding (PENDING_ONBOARDING → PHARMACY_STAFF)
  - /api/auth/logout clears session_token cookie + deletes user_sessions row
"""
import os
import uuid
import asyncio
import requests
import pytest
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://scan-verify-trust.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

STAFF_EMAIL = "chemist@kyrenis.in"
STAFF_PASSWORD = "password"


# --- Direct DB helpers via motor ---
def _db():
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    return client, client[os.environ.get("DB_NAME", "test_database")]


async def _provision_pending_user(session_token: str, email: str):
    client, db = _db()
    try:
        uid = "test-user-" + uuid.uuid4().hex[:8]
        await db.users.insert_one({
            "id": uid,
            "user_id": uid,
            "email": email,
            "name": "Test User",
            "picture": "",
            "designated_role": "PENDING_ONBOARDING",
            "auth_provider": "google",
            "associated_pharmacy_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.user_sessions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "session_token": session_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        })
        return uid
    finally:
        client.close()


async def _cleanup_user(uid: str, session_token: str):
    client, db = _db()
    try:
        await db.users.delete_many({"id": uid})
        await db.user_sessions.delete_many({"session_token": session_token})
        # Also delete pharmacies created during onboarding tests (best-effort)
    finally:
        client.close()


async def _session_exists(session_token: str) -> bool:
    client, db = _db()
    try:
        s = await db.user_sessions.find_one({"session_token": session_token})
        return s is not None
    finally:
        client.close()


# ---------------- google/session ----------------
class TestGoogleSessionExchange:
    def test_invalid_session_id_returns_401(self):
        # Random invalid session_id → backend calls Emergent → non-200 → 401
        r = requests.post(
            f"{API}/auth/google/session",
            json={"session_id": "bogus-" + uuid.uuid4().hex, "flow": "pharmacy"},
            timeout=20,
        )
        assert r.status_code in (401, 502), f"Unexpected {r.status_code}: {r.text}"
        # Prefer 401 per spec (502 acceptable only if upstream unreachable)
        if r.status_code == 401:
            assert "Session exchange failed" in r.text

    def test_missing_session_id_returns_422(self):
        r = requests.post(f"{API}/auth/google/session", json={"flow": "pharmacy"}, timeout=15)
        assert r.status_code in (400, 422)

    def test_empty_session_id_returns_400_or_422(self):
        r = requests.post(f"{API}/auth/google/session", json={"session_id": ""}, timeout=15)
        assert r.status_code in (400, 422)


# ---------------- /auth/me dual auth ----------------
class TestAuthMeDualAuth:
    def test_me_with_jwt_login(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD})
        assert r.status_code == 200
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["user"]["email"] == STAFF_EMAIL

    def test_me_unauth_returns_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_session_token_cookie(self):
        session_token = "test_session_" + uuid.uuid4().hex
        email = f"test.session.{uuid.uuid4().hex[:6]}@example.com"
        uid = asyncio.run(_provision_pending_user(session_token, email))
        try:
            s = requests.Session()
            s.cookies.set("session_token", session_token, domain=BASE_URL.split("//")[1])
            r = s.get(f"{API}/auth/me")
            assert r.status_code == 200, r.text
            assert r.json()["user"]["email"] == email
            assert r.json()["user"]["designated_role"] == "PENDING_ONBOARDING"
        finally:
            asyncio.run(_cleanup_user(uid, session_token))


# ---------------- complete-onboarding ----------------
class TestCompleteOnboarding:
    def test_requires_auth(self):
        r = requests.post(f"{API}/auth/complete-onboarding", json={
            "pharmacy_name": "X", "license_number": "Y", "location_city": "Z"
        })
        assert r.status_code in (401, 422)

    def test_pending_user_onboards(self):
        session_token = "test_session_" + uuid.uuid4().hex
        email = f"test.onboard.{uuid.uuid4().hex[:6]}@example.com"
        uid = asyncio.run(_provision_pending_user(session_token, email))
        try:
            s = requests.Session()
            s.cookies.set("session_token", session_token, domain=BASE_URL.split("//")[1])
            r = s.post(f"{API}/auth/complete-onboarding", json={
                "pharmacy_name": "TEST_Pharm_" + uid[-6:],
                "license_number": "TEST-LIC-001",
                "location_city": "TestCity",
                "postal_code": "999999",
            })
            assert r.status_code == 200, r.text
            j = r.json()
            assert j["user"]["designated_role"] == "PHARMACY_STAFF"
            assert j["user"].get("associated_pharmacy_id")
            assert "pharmacy_id" in j

            # 2nd call idempotent
            r2 = s.post(f"{API}/auth/complete-onboarding", json={
                "pharmacy_name": "TEST_Pharm2", "license_number": "L2X", "location_city": "City2"
            })
            assert r2.status_code == 200
            assert r2.json().get("already_onboarded") is True
        finally:
            asyncio.run(_cleanup_user(uid, session_token))


# ---------------- logout clears session ----------------
class TestLogoutClearsSession:
    def test_logout_deletes_session_row_and_cookie(self):
        session_token = "test_session_" + uuid.uuid4().hex
        email = f"test.logout.{uuid.uuid4().hex[:6]}@example.com"
        uid = asyncio.run(_provision_pending_user(session_token, email))
        try:
            s = requests.Session()
            s.cookies.set("session_token", session_token, domain=BASE_URL.split("//")[1])
            # Confirm session exists in db
            assert asyncio.run(_session_exists(session_token)) is True
            r = s.post(f"{API}/auth/logout")
            assert r.status_code == 200
            # DB row should be gone
            assert asyncio.run(_session_exists(session_token)) is False
            # Cookie should be cleared server-side (Set-Cookie clearing header)
            set_cookie = r.headers.get("set-cookie", "").lower()
            assert "session_token" in set_cookie
        finally:
            asyncio.run(_cleanup_user(uid, session_token))
