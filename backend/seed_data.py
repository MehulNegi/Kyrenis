"""Seed data generator for Kyrenis: pharmacies, distributors, 100+ medicines,
500+ scan telemetry logs, CDSCO recalls, and 15+ pre-triggered security alerts.
Idempotent — safe to call on every startup."""
import hashlib
import random
import uuid
from datetime import datetime, timezone, timedelta

from auth_utils import hash_password
from cdsco_repository import CDSCO_ENTRIES, normalize_batch

random.seed(42)


DISTRIBUTOR_HUBS = [
    ("MedNet Wholesale Mumbai", "MH-WHL-4421", "orders@mednet-mum.in", "Mumbai"),
    ("Prime Pharma Distributors Delhi", "DL-WHL-9910", "supply@primepharma.in", "Delhi"),
    ("Southern Med Hub Bengaluru", "KA-WHL-3378", "hub@southernmed.in", "Bengaluru"),
    ("Deccan Rx Logistics Hyderabad", "TG-WHL-2201", "ops@deccanrx.in", "Hyderabad"),
    ("Eastern Pharma Kolkata", "WB-WHL-1177", "central@easternpharma.in", "Kolkata"),
]

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Kolkata", "Pune", "Chennai", "Ahmedabad"]

MEDICINES_MASTER = [
    # (brand, generic, base_mrp, min_safety_stock, gtin_seed)
    ("Crocin Advance", "Paracetamol 500mg", 32.50, 50),
    ("Dolo 650", "Paracetamol 650mg", 30.00, 40),
    ("Lipitor 10mg", "Atorvastatin 10mg", 178.00, 20),
    ("Lipitor 20mg", "Atorvastatin 20mg", 245.00, 15),
    ("Metformin GP 500", "Metformin HCl 500mg", 45.00, 60),
    ("Glycomet 850", "Metformin HCl 850mg", 52.00, 35),
    ("Amoxil 500mg", "Amoxicillin 500mg", 92.00, 30),
    ("Augmentin 625", "Amoxicillin+Clavulanate 625mg", 210.00, 25),
    ("Azithral 500", "Azithromycin 500mg", 132.00, 20),
    ("Cipmox 250", "Amoxicillin 250mg", 58.00, 40),
    ("Zerodol SP", "Aceclofenac+Paracetamol+Serratiopeptidase", 88.00, 30),
    ("Combiflam", "Ibuprofen+Paracetamol", 42.00, 45),
    ("Brufen 400", "Ibuprofen 400mg", 38.00, 40),
    ("Sumo Tablet", "Nimesulide+Paracetamol", 62.00, 20),
    ("Voveran 50", "Diclofenac Sodium 50mg", 55.00, 30),
    ("Norflox 400", "Norfloxacin 400mg", 74.00, 15),
    ("Ciplox 500", "Ciprofloxacin 500mg", 88.00, 20),
    ("Levoflox 500", "Levofloxacin 500mg", 148.00, 15),
    ("Ofloxacin OZ", "Ofloxacin+Ornidazole", 96.00, 20),
    ("Clavam 625", "Amoxicillin+Clavulanic Acid", 195.00, 20),
    ("Pantop 40", "Pantoprazole 40mg", 84.00, 40),
    ("Pan 40", "Pantoprazole 40mg", 78.00, 35),
    ("Rantac 150", "Ranitidine 150mg", 32.00, 30),
    ("Zantac 300", "Ranitidine 300mg", 55.00, 20),
    ("Ocid 20", "Omeprazole 20mg", 62.00, 40),
    ("Nexium 40", "Esomeprazole 40mg", 145.00, 20),
    ("Ecosprin 75", "Aspirin 75mg", 22.00, 60),
    ("Clopilet A 75", "Clopidogrel+Aspirin", 88.00, 25),
    ("Deplatt 75", "Clopidogrel 75mg", 62.00, 30),
    ("Concor 5", "Bisoprolol 5mg", 132.00, 20),
    ("Amlokind 5", "Amlodipine 5mg", 24.00, 50),
    ("Amlopres 10", "Amlodipine 10mg", 38.00, 40),
    ("Telma 40", "Telmisartan 40mg", 108.00, 30),
    ("Telma 80", "Telmisartan 80mg", 168.00, 25),
    ("Cardace 5", "Ramipril 5mg", 88.00, 20),
    ("Envas 5", "Enalapril 5mg", 42.00, 30),
    ("Losar 50", "Losartan 50mg", 62.00, 25),
    ("Cilacar 10", "Cilnidipine 10mg", 138.00, 20),
    ("Prazopress XL", "Prazosin 2.5mg", 92.00, 15),
    ("Metolar 25", "Metoprolol 25mg", 32.00, 30),
    ("Metpure XL 50", "Metoprolol 50mg", 62.00, 25),
    ("Ivabrad 5", "Ivabradine 5mg", 148.00, 15),
    ("Rosuvas 10", "Rosuvastatin 10mg", 178.00, 20),
    ("Rosuvas 20", "Rosuvastatin 20mg", 258.00, 15),
    ("Storvas 10", "Atorvastatin 10mg", 88.00, 25),
    ("Fenofibrate 200", "Fenofibrate 200mg", 118.00, 20),
    ("Glimulin M2", "Glimepiride+Metformin", 96.00, 25),
    ("Amaryl 2", "Glimepiride 2mg", 148.00, 20),
    ("Januvia 100", "Sitagliptin 100mg", 468.00, 15),
    ("Galvus Met 50/500", "Vildagliptin+Metformin", 358.00, 15),
    ("Zita Plus 20/500", "Teneligliptin+Metformin", 168.00, 20),
    ("Levipil 500", "Levetiracetam 500mg", 148.00, 15),
    ("Encorate Chrono", "Sodium Valproate 500mg", 118.00, 15),
    ("Eptoin 100", "Phenytoin 100mg", 42.00, 25),
    ("Gabapin 100", "Gabapentin 100mg", 78.00, 20),
    ("Neurontin 300", "Gabapentin 300mg", 168.00, 15),
    ("Pregeb 75", "Pregabalin 75mg", 92.00, 20),
    ("Nervijen P", "Pregabalin+Methylcobalamin", 128.00, 20),
    ("Alprax 0.5", "Alprazolam 0.5mg", 62.00, 25),
    ("Restyl 0.25", "Alprazolam 0.25mg", 42.00, 30),
    ("Nexito 10", "Escitalopram 10mg", 108.00, 20),
    ("Prothiaden 25", "Dosulepin 25mg", 82.00, 15),
    ("Fluoxetine 20", "Fluoxetine 20mg", 68.00, 20),
    ("Zolfresh 5", "Zolpidem 5mg", 88.00, 20),
    ("Cetzine 10", "Cetirizine 10mg", 24.00, 50),
    ("Allegra 120", "Fexofenadine 120mg", 118.00, 30),
    ("Levocet M", "Levocetirizine+Montelukast", 96.00, 25),
    ("Montek LC", "Montelukast+Levocetirizine", 128.00, 25),
    ("Asthalin 4", "Salbutamol 4mg", 34.00, 30),
    ("Deriphyllin OD 300", "Etophylline+Theophylline", 62.00, 25),
    ("Foracort 200 Inhaler", "Formoterol+Budesonide", 348.00, 15),
    ("Seroflo 250 Inhaler", "Salmeterol+Fluticasone", 468.00, 10),
    ("Duolin Inhaler", "Levosalbutamol+Ipratropium", 288.00, 12),
    ("Ambrolite Syrup", "Ambroxol 30mg/5ml", 88.00, 20),
    ("Alex Cough Syrup", "Chlorpheniramine+Phenylephrine+Dextromethorphan", 118.00, 25),
    ("Benadryl Syrup", "Diphenhydramine+Ammonium Chloride", 98.00, 25),
    ("Ascoril LS Syrup", "Levosalbutamol+Ambroxol+Guaifenesin", 138.00, 25),
    ("Grilinctus Syrup", "Chlorpheniramine+Ammonium Chloride", 108.00, 25),
    ("Digene Gel", "Aluminium+Magnesium Hydroxide", 92.00, 30),
    ("Gelusil MPS", "Aluminium+Magnesium+Simethicone", 118.00, 30),
    ("Cremaffin Plus", "Milk of Magnesia+Liquid Paraffin+Senna", 158.00, 25),
    ("Duphalac Syrup", "Lactulose Solution", 218.00, 25),
    ("Isabgol Husk", "Psyllium Husk", 158.00, 30),
    ("Enterogermina", "Bacillus Clausii Probiotic", 132.00, 25),
    ("Sporlac DS", "Lactic Acid Bacillus", 98.00, 25),
    ("Vizylac Capsule", "Lactic Acid Bacillus+B-Complex", 118.00, 25),
    ("Neurobion Forte", "Vitamin B-Complex+B12", 92.00, 30),
    ("Becosules Capsule", "Multivitamin B-Complex+C", 82.00, 30),
    ("Zincovit Tablet", "Multivitamin+Multimineral", 148.00, 25),
    ("Shelcal 500", "Calcium Carbonate+Vitamin D3", 178.00, 30),
    ("Calcirol Sachet", "Cholecalciferol 60000 IU", 42.00, 40),
    ("Uprise D3", "Cholecalciferol 60000 IU", 38.00, 40),
    ("Livogen Captab", "Ferrous Fumarate+Folic Acid", 132.00, 25),
    ("Autrin Capsule", "Ferrous Fumarate+Folic Acid+B12", 118.00, 20),
    ("Orofer XT", "Iron+Folic Acid", 158.00, 20),
    ("Thyronorm 50mcg", "Levothyroxine 50mcg", 138.00, 40),
    ("Thyronorm 100mcg", "Levothyroxine 100mcg", 178.00, 30),
    ("Eltroxin 100", "Levothyroxine 100mcg", 168.00, 25),
    ("Sildigra 50", "Sildenafil 50mg", 218.00, 15),
    ("Manforce 50", "Sildenafil 50mg", 258.00, 15),
    ("Zincobal G", "Methylcobalamin+Gabapentin", 148.00, 20),
    ("Volini Gel", "Diclofenac+Linseed Oil", 168.00, 25),
    ("Moov Spray", "Menthol+Diclofenac Topical", 148.00, 25),
    ("Iodex Balm", "Methyl Salicylate+Camphor", 138.00, 25),
    ("Vicks VapoRub", "Camphor+Menthol+Eucalyptus", 118.00, 30),
    ("Sinarest Tablet", "Paracetamol+Phenylephrine+CPM", 62.00, 30),
    ("Cheston Cold", "Cetirizine+Phenylephrine+Paracetamol", 68.00, 30),
    ("Coldact Flu Plus", "Paracetamol+PPA+Chlorpheniramine", 72.00, 25),
    ("D-Cold Total", "Paracetamol+CPM+Phenylephrine", 58.00, 30),
]


def _gtin_with_checksum(seed: int) -> str:
    """Build a valid 14-digit GTIN with correct Mod-10 checksum."""
    core = f"{8900000000000 + seed:013d}"[:13]  # 13-digit body
    digits = [int(d) for d in core][::-1]
    total = 0
    for idx, d in enumerate(digits):
        weight = 3 if idx % 2 == 0 else 1
        total += d * weight
    check = (10 - (total % 10)) % 10
    return f"{core}{check}"


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


async def seed_all(db) -> dict:
    """Idempotent seed. Returns counts. Skips if marker doc exists."""
    marker = await db.seed_marker.find_one({"key": "kyrenis_v2"})
    if marker:
        return {"skipped": True, **marker.get("counts", {})}
    # Purge legacy v1 data so the v2 schema (with CDSCO intelligence categories) is clean
    await db.seed_marker.delete_many({})
    await db.pharmacies.delete_many({})
    await db.users.delete_many({})
    await db.distributors.delete_many({})
    await db.medicines.delete_many({})
    await db.inventory_batches.delete_many({})
    await db.cdsco_recalls.delete_many({})
    await db.scan_telemetry.delete_many({})
    await db.security_alerts.delete_many({})

    now = datetime.now(timezone.utc)

    # ---------- Pharmacy ----------
    pharmacy_id = str(uuid.uuid4())
    pharmacy_doc = {
        "id": pharmacy_id,
        "name": "Kyrenis Reference Pharmacy",
        "license_number": "MH-RTL-77812",
        "location_city": "Mumbai",
        "postal_code": "400001",
        "created_at": _iso(now),
    }
    await db.pharmacies.insert_one(pharmacy_doc)

    # ---------- Staff user ----------
    staff_user = {
        "id": str(uuid.uuid4()),
        "email": "chemist@kyrenis.in",
        "password_hash": hash_password("password"),
        "designated_role": "PHARMACY_STAFF",
        "associated_pharmacy_id": pharmacy_id,
        "created_at": _iso(now),
    }
    await db.users.insert_one(staff_user)

    # ---------- Distributors ----------
    distributor_docs = []
    for name, lic, email, city in DISTRIBUTOR_HUBS:
        distributor_docs.append(
            {
                "id": str(uuid.uuid4()),
                "company_name": name,
                "wholesale_license_number": lic,
                "contact_email": email,
                "hub_city": city,
            }
        )
    await db.distributors.insert_many(distributor_docs)

    # ---------- Medicines ----------
    medicine_docs = []
    for idx, (brand, generic, mrp, safety) in enumerate(MEDICINES_MASTER):
        medicine_docs.append(
            {
                "id": str(uuid.uuid4()),
                "brand_name": brand,
                "generic_composition": generic,
                "global_gtin": _gtin_with_checksum(idx + 1),
                "expected_mrp_baseline": mrp,
                "minimum_safety_stock": safety,
            }
        )
    await db.medicines.insert_many(medicine_docs)

    # ---------- Inventory Batches ----------
    inventory_docs = []
    for med in medicine_docs:
        # 1–3 batches per medicine
        for b_idx in range(random.randint(1, 3)):
            distributor = random.choice(distributor_docs)
            mfg = now - timedelta(days=random.randint(30, 600))
            exp = mfg + timedelta(days=random.randint(400, 1100))
            declared_mrp = med["expected_mrp_baseline"] * random.uniform(0.95, 1.15)
            # Force some low stock scenarios for demo
            if b_idx == 0 and med["brand_name"] in {"Crocin Advance", "Lipitor 10mg", "Metformin GP 500", "Amoxil 500mg", "Pantop 40"}:
                stock = random.randint(2, 8)
            else:
                stock = random.randint(20, 250)
            # Force some near-expiry batches
            if random.random() < 0.08:
                exp = now + timedelta(days=random.randint(15, 55))
            inventory_docs.append(
                {
                    "id": str(uuid.uuid4()),
                    "pharmacy_id": pharmacy_id,
                    "medicine_id": med["id"],
                    "distributor_id": distributor["id"],
                    "batch_number": f"{med['brand_name'][:3].upper()}{240000 + random.randint(1,9999)}",
                    "mfg_date": mfg.date().isoformat(),
                    "expiry_date": exp.date().isoformat(),
                    "package_declared_mrp": round(declared_mrp, 2),
                    "current_stock_qty": stock,
                    "verification_status": "Verified",
                    "mrp_variance_warning": False,
                    "created_at": _iso(mfg),
                }
            )
    await db.inventory_batches.insert_many(inventory_docs)

    # ---------- CDSCO Regulatory Intelligence Repository ----------
    from datetime import datetime as _dt
    recall_docs = []
    for entry in CDSCO_ENTRIES:
        recall_docs.append({
            "id": str(uuid.uuid4()),
            "alert_category": entry["alert_category"],
            "product_name": entry["product_name"],
            "generic_composition": entry.get("generic_composition", ""),
            "target_medicine_name": entry["product_name"],
            "batch_number": entry["batch_number"],
            "batch_normalised": normalize_batch(entry["batch_number"]),
            "target_batch_number": entry["batch_number"],
            "manufacturer": entry["manufacturer"],
            "failure_reason": entry["failure_reason"],
            "hazard_classification": entry["failure_reason"],
            "reporting_authority": entry["reporting_authority"],
            "reporting_lab": entry["reporting_lab"],
            "reporting_date": entry["reporting_date"],
            "date_published": entry["reporting_date"],
            "risk_score": entry["risk_score"],
        })
    await db.cdsco_recalls.insert_many(recall_docs)

    # ---------- Scan Telemetry Logs (500+) ----------
    telemetry_docs = []
    for i in range(560):
        med = random.choice(medicine_docs)
        distributor = random.choice(distributor_docs)
        batch_no = f"{med['brand_name'][:3].upper()}{240000 + random.randint(1,9999)}"
        ts = now - timedelta(hours=random.randint(1, 24 * 40))
        city = random.choice(CITIES)
        qty = random.randint(20, 400)
        gtin = med["global_gtin"]
        hash_tok = hashlib.sha256(f"{gtin}|{batch_no}|{pharmacy_id}".encode()).hexdigest()
        telemetry_docs.append(
            {
                "id": str(uuid.uuid4()),
                "pharmacy_id": pharmacy_id if random.random() > 0.3 else None,
                "user_id": staff_user["id"],
                "cryptographic_telemetry_hash": hash_tok,
                "batch_number": batch_no,
                "scanned_gtin": gtin,
                "parsed_qr_data": {"01": gtin, "10": batch_no},
                "detected_ocr_text": f"BATCH:{batch_no} MRP:{med['expected_mrp_baseline']}",
                "quantity": qty,
                "city": city,
                "distributor_id": distributor["id"],
                "timestamp": _iso(ts),
                "status_badge": "Valid",
            }
        )

    # Inject 15 anomaly-triggering log clusters
    security_alerts = []
    anomaly_batches = []
    for a_idx in range(8):
        # volumetric saturation cluster
        med = random.choice(medicine_docs)
        batch_no = f"SAT{240000 + a_idx}"
        for _ in range(140):  # ~140 * ~350 units = ~49000 > 40k
            ts = now - timedelta(hours=random.randint(1, 240))
            city = random.choice(CITIES)
            qty = random.randint(300, 400)
            telemetry_docs.append(
                {
                    "id": str(uuid.uuid4()),
                    "pharmacy_id": None,
                    "user_id": staff_user["id"],
                    "cryptographic_telemetry_hash": hashlib.sha256(
                        f"{med['global_gtin']}|{batch_no}|SAT".encode()
                    ).hexdigest(),
                    "batch_number": batch_no,
                    "scanned_gtin": med["global_gtin"],
                    "parsed_qr_data": {"01": med["global_gtin"], "10": batch_no},
                    "detected_ocr_text": f"BATCH:{batch_no}",
                    "quantity": qty,
                    "city": city,
                    "distributor_id": random.choice(distributor_docs)["id"],
                    "timestamp": _iso(ts),
                    "status_badge": "Anomaly_Flagged",
                }
            )
        anomaly_batches.append((med["brand_name"], batch_no, "Volumetric Saturation", "Critical"))

    for a_idx in range(7):
        # spatial teleportation pairs
        med = random.choice(medicine_docs)
        batch_no = f"TEL{240000 + a_idx}"
        city_a = random.choice(CITIES)
        city_b = random.choice([c for c in CITIES if c != city_a])
        base_ts = now - timedelta(hours=random.randint(20, 400))
        telemetry_docs.append(
            {
                "id": str(uuid.uuid4()),
                "pharmacy_id": None,
                "user_id": staff_user["id"],
                "cryptographic_telemetry_hash": hashlib.sha256(
                    f"{med['global_gtin']}|{batch_no}|TEL".encode()
                ).hexdigest(),
                "batch_number": batch_no,
                "scanned_gtin": med["global_gtin"],
                "parsed_qr_data": {"01": med["global_gtin"], "10": batch_no},
                "detected_ocr_text": f"BATCH:{batch_no}",
                "quantity": random.randint(80, 200),
                "city": city_a,
                "distributor_id": random.choice(distributor_docs)["id"],
                "timestamp": _iso(base_ts),
                "status_badge": "Anomaly_Flagged",
            }
        )
        telemetry_docs.append(
            {
                "id": str(uuid.uuid4()),
                "pharmacy_id": None,
                "user_id": staff_user["id"],
                "cryptographic_telemetry_hash": hashlib.sha256(
                    f"{med['global_gtin']}|{batch_no}|TEL2".encode()
                ).hexdigest(),
                "batch_number": batch_no,
                "scanned_gtin": med["global_gtin"],
                "parsed_qr_data": {"01": med["global_gtin"], "10": batch_no},
                "detected_ocr_text": f"BATCH:{batch_no}",
                "quantity": random.randint(80, 200),
                "city": city_b,
                "distributor_id": random.choice(distributor_docs)["id"],
                "timestamp": _iso(base_ts + timedelta(hours=random.randint(2, 10))),
                "status_badge": "Anomaly_Flagged",
            }
        )
        anomaly_batches.append((med["brand_name"], batch_no, "Spatial Teleportation", "High"))

    await db.scan_telemetry.insert_many(telemetry_docs)

    for medname, batch_no, atype, sev in anomaly_batches:
        security_alerts.append(
            {
                "id": str(uuid.uuid4()),
                "target_batch_number": batch_no,
                "target_medicine_name": medname,
                "alert_type": atype,
                "severity": sev,
                "triggering_telemetry_json": {"batch": batch_no, "engine": atype},
                "resolved_status": False,
                "created_at": _iso(now - timedelta(hours=random.randint(1, 240))),
            }
        )
    if security_alerts:
        await db.security_alerts.insert_many(security_alerts)

    counts = {
        "pharmacies": 1,
        "users": 1,
        "distributors": len(distributor_docs),
        "medicines": len(medicine_docs),
        "inventory_batches": len(inventory_docs),
        "cdsco_recalls": len(recall_docs),
        "scan_telemetry": len(telemetry_docs),
        "security_alerts": len(security_alerts),
    }
    await db.seed_marker.insert_one(
        {"key": "kyrenis_v2", "created_at": _iso(now), "counts": counts}
    )
    return counts
