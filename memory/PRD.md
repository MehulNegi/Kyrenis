# Kyrenis — Smart Pharmacy OS · PRD

## Original Problem Statement
Build a secure, privacy-preserving full-stack application called "Kyrenis" that serves as
an All-in-One Smart Pharmacy OS — retail inventory, POS billing, compliance, drug safety
intelligence, and supply chain anomaly telemetry. Strict brand palette (Jet Black,
Dark Charcoal, Deep Navy, Soft Light Grey, Stark White + emerald safe / crimson danger).
Tagline: "Scan-Verify-Trust".

## User Personas
1. **Pharmacy Staff** — Signs in through `/pharmacy/auth`, operates the enterprise OS
   (stock intake with 4-step verification, POS FIFO billing, replenishment governance,
   telemetry & anomaly dashboards).
2. **Patient / Consumer Guest** — Anonymous, no sign-up. Uses `/patient` to authenticate
   a specific batch code and browse OpenFDA drug safety data.

## Core Requirements (static)
- Landing gateway → split between Pharmacy Portal and Patient Trust Hub
- JWT (bcrypt + cookie) auth for pharmacy staff; guest anonymous state for consumers
- 4-Step Verification Pipeline (OCR↔QR match → Mod-10 → CDSCO recall → MRP ±20%)
- POS with strict FIFO deduction by expiry
- Replenishment: low-stock queue + expiring-in-60-days + one-click PO generator
- Telemetry engines: Volumetric Saturation (>40k units) + Spatial Teleportation (12h window)
- Consumer batch authenticator (Green/Amber/Red shield verdict)
- OpenFDA proxy (warnings / adverse_reactions / dosage_and_administration)
- SHA-256 hashing of GTIN+Batch+PharmacyID for privacy telemetry

## Data Models (MongoDB collections)
users · pharmacies · distributors · medicines · inventory_batches · scan_telemetry ·
cdsco_recalls · security_alerts · purchase_orders · pos_receipts · seed_marker

## What's Been Implemented — 2026-02-19
- Backend FastAPI service with full JWT auth, 4-step pipeline, POS FIFO, replenishment,
  telemetry, security alerts, consumer verify, OpenFDA proxy
- Heavy seed: 5 distributors, 109 medicines, 224 inventory batches, 1694 scan
  telemetry logs, 5 CDSCO recalls, 15 pre-triggered security alerts
- React SPA with custom Kyrenis palette, inline SVG logo, Cabinet Grotesk /
  IBM Plex Sans / JetBrains Mono typography
- Landing gateway, pharmacy auth (sign-in/register + autofill), 4-tab pharmacy dashboard,
  2-tab patient trust hub with Recharts volumetric bar chart
- All UI elements carry `data-testid` attributes

## Backlog / Future Work
- P1: Real webcam-based QR scanner (currently text-input simulation as per spec)
- P1: Email dispatch when new critical anomaly is fired (Resend integration)
- P2: Multi-pharmacy tenant isolation UI (data model already supports it)
- P2: Historical timeline / heat-map view on telemetry (currently list + bar chart)
- P2: Audit-log export CSV for regulators
- P3: Role-based sub-roles inside PHARMACY_STAFF (e.g., manager vs cashier)
