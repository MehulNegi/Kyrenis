# Kyrenis Auth Testing Playbook (Emergent-managed Google Auth)

## Provisioning a Test Session Manually
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  designated_role: 'PHARMACY_STAFF',
  auth_provider: 'google',
  associated_pharmacy_id: null,
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Backend Smoke Tests
```bash
# /auth/me with bearer
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $SESSION_TOKEN"

# protected pharmacy endpoint
curl -X GET "$API_URL/api/pharmacy/inventory" -H "Authorization: Bearer $SESSION_TOKEN"
```

## Browser Test (Playwright)
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": SESSION_TOKEN,
    "domain": "scan-verify-trust.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None",
}])
await page.goto("https://scan-verify-trust.preview.emergentagent.com/pharmacy")
```

## Cleanup
```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Route Map
- `/auth/callback` — synchronous session_id exchange (no ProtectedRoute)
- `/pharmacy/onboarding` — first-time Google users who chose Pharmacy Portal
- `/pharmacy` — PHARMACY_STAFF only
- `/patient` — anonymous OR CONSUMER_GUEST (Google-identified but not required)

## Auth Providers Coexisting
- `access_token` cookie → JWT flow (email/password + Autofill Test Credentials)
- `session_token` cookie → Emergent Google Auth flow
- `require_user` dependency tries JWT first, then falls back to session_token → user_sessions lookup

## Checklist
- [ ] `/api/auth/google/session` exchanges X-Session-ID via demobackend.emergentagent.com
- [ ] New users get role=`PENDING_ONBOARDING` and are routed to `/pharmacy/onboarding` if flow=pharmacy
- [ ] `/api/auth/complete-onboarding` upgrades role → PHARMACY_STAFF
- [ ] `/api/auth/logout` clears BOTH access_token and session_token cookies
- [ ] `AuthProvider` skips `/auth/me` when URL contains `#session_id=`
