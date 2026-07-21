"""CDSCO Regulatory Intelligence Repository.

Loads the authoritative CDSCO surveillance dataset — Not of Standard Quality
(NSQ), Spurious Drug and Recall advisories — from `cdsco_dataset.json`, built
by the ingestion pipeline from the official CDSCO XLSX + PDF releases.

Exposes a fast in-memory batch-number index used by the consumer verification
endpoint. Records that are not present in the dataset are treated as **Low Risk
· No Regulatory Alert Found**. Records that *are* present are returned as
**High Risk · Regulatory Alert** with the CDSCO advisory details attached.
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

DATASET_PATH = Path(__file__).parent / "cdsco_dataset.json"


def normalize_batch(raw: str) -> str:
    """Uppercase + strip everything except A-Z and 0-9 for tolerant matching."""
    if not raw:
        return ""
    return "".join(c for c in str(raw).upper() if c.isalnum())


@lru_cache(maxsize=1)
def _load() -> tuple[list, dict]:
    if not DATASET_PATH.exists():
        return [], {}
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    index: dict[str, dict] = {}
    for rec in records:
        b = rec.get("batch_number") or ""
        if not b:
            continue
        # First writer wins — deterministic across restarts (dataset is sorted).
        if b not in index:
            index[b] = rec
    return records, index


def get_all_records() -> list:
    return _load()[0]


def get_batch_index() -> dict:
    return _load()[1]


def lookup_batch(raw: str) -> Optional[dict]:
    """Return the CDSCO record for a batch number, or None if no match."""
    if not raw:
        return None
    key = normalize_batch(raw)
    if not key:
        return None
    return get_batch_index().get(key)


def dataset_stats() -> dict:
    records = get_all_records()
    unique_batches = len({r.get("batch_number", "") for r in records if r.get("batch_number")})
    categories = sorted({r.get("alert_category", "") for r in records if r.get("alert_category")})
    return {
        "total_records": len(records),
        "unique_batches": unique_batches,
        "categories": categories,
    }
