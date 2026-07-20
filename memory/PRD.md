# Kyrenis — CDSCO Regulatory Intelligence Platform · PRD

## Original Problem Statement
Build a secure, privacy-preserving full-stack application called "Kyrenis" — an
All-in-One Smart Pharmacy OS covering retail inventory, POS billing, compliance,
drug-safety intelligence, and supply-chain anomaly telemetry.

## Product Pivot (V2 — Msg 183)
Kyrenis was transformed from a "Counterfeit Detection" tool into a professional
**CDSCO Regulatory Intelligence Platform** that cross-references any medicine batch
against India's Central Drugs Standard Control Organisation (CDSCO) NSQ, Spurious,
Recall and Diversion advisories, producing a transparent **risk score (0–100)**
with a severity label (Critical / Quality Risk / Clear). All "Genuine/Counterfeit"
language has been removed.

## User Personas
1. **Pharmacy Staff** — Signs in via `/pharmacy/auth` (JWT bcrypt cookies) or Google
   session. Operates the enterprise console: Stock Intake, POS Billing, Sales
   History, Replenishment, Telemetry, Security & Recalls.
2. **Patient / Consumer Guest** — Anonymous, no sign-up. Uses `/patient` to look up
   a batch and see the CDSCO risk verdict + OpenFDA drug safety data.

## Core Features Delivered
- **Landing** — CDSCO-branded gateway with About + Contact + two CTAs.
- **Auth** — Hybrid JWT (bcrypt cookies) + Emergent-managed Google session.
- **Consumer Batch Authenticator** — Risk-based verdict card with CDSCO source, lab,
  and reporting authority.
- **Stock Intake** — 4-Step Verification (OCR↔QR match → Mod-10 → CDSCO recall →
  MRP ±20%) + real webcam QR scanning (html5-qrcode).
- **POS Billing** — Client-side Autocomplete typeahead, expiry-lock enforcement,
  strict FIFO deduction, GST-styled printable invoice.
- **Sales History** — Invoice history list with reprint.
- **Replenishment** — Low-stock + expiring-in-60-days queues + one-click Auto PO
  generator + Manual PO modal with distributor+medicine autocomplete.
- **Telemetry** — Volumetric Saturation (>40k units), Spatial Teleportation (12h
  window), timeline heat-map, and CSV audit-log export.
- **Security & Recalls** — Dedicated tab surfacing all 21 CDSCO advisories +
  16 seeded security alerts, with severity/category filters. *(Added 2026-02-19)*
- **Consumer OpenFDA Directory** — warnings / adverse_reactions / dosage sections.
- **Email Alerts** — Resend integration for critical anomalies.

## Data Models (MongoDB)
users · pharmacies · distributors · medicines · inventory_batches ·
scan_telemetry · cdsco_recalls · security_alerts · purchase_orders ·
pos_receipts · seed_marker

## What's Been Implemented (2026-02-19)
- V2 Pivot fully wired: risk_score / severity / alert_card response shape.
- Autocomplete component (`components/Autocomplete.jsx`) is client-side; it filters
  `/api/pharmacy/{medicines,distributors,inventory}` responses. No dedicated
  `/api/autocomplete/*` route needed.
- Sales History, GST InvoicePrint, Manual PO endpoints and UI complete.
- Security & Recalls tab (`components/pharmacy/SecurityRecalls.jsx`) shipped.
- `test_reports/iteration_6.json` → 47/47 backend pytest GREEN + Playwright flows
  pass. Only spec-alignment gap (missing 6th tab + label mismatches) has been
  addressed in this session.

## Testing Status
- Backend: 47/47 pytest (iteration_6)
- Frontend: Playwright happy paths PASS. Landing, Patient verify (critical + clear),
  POS billing autocomplete + invoice, Sales History, Replenishment Auto/Manual PO
  all functional. New Security & Recalls tab smoke-verified.

## Backlog / Future Work
- P1: Refactor `backend/server.py` (1167 lines) into APIRouter modules
  (auth, pharmacy_ops, telemetry, consumer).
- P1: Align `POST /api/consumer/verify-batch` payload — add `medicine_name` field
  explicitly to `ConsumerVerifyPayload`.
- P2: Multi-pharmacy tenant isolation UI.
- P2: Role-based sub-roles inside PHARMACY_STAFF (manager vs cashier).
- P2: Convert TestStockIntake class-scoped fixture to `@classmethod` (pytest 10
  deprecation warning).
- P3: Confirm severity taxonomy — currently 3-tier (Critical ≥95 / Quality Risk 80–94
  / Clear <80). PRD wording alludes to a 2-tier taxonomy; product decision needed.

## Test Credentials
See `/app/memory/test_credentials.md`.
