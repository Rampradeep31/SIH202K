"""
Land Dispute Statistics.
Source: tamil_nadu_dataset/tamil_nadu_synthetic_land_disputes.csv — SYNTHETIC
data (768 rows: districts x years x dispute types), modeled on NJDG-style
case categories. Labeled honestly as synthetic in every response; no real
National Judicial Data Grid feed is wired into this platform.
"""

import os
import csv
from collections import defaultdict
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/disputes", tags=["Land Dispute Statistics"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DISPUTES_CSV = os.path.join(BASE_DIR, "tamil_nadu_dataset", "tamil_nadu_synthetic_land_disputes.csv")


def _load_disputes():
    rows = []
    if os.path.exists(DISPUTES_CSV):
        with open(DISPUTES_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                try:
                    rows.append({
                        "district": r["district"].strip(),
                        "year": int(r["year"]),
                        "dispute_type": r["dispute_type"].strip(),
                        "count": int(r["count"]),
                        "status": r["status"].strip(),
                    })
                except (KeyError, ValueError):
                    continue
    return rows


DISPUTE_ROWS = _load_disputes()


@router.get("")
def get_dispute_stats() -> Dict[str, Any]:
    if not DISPUTE_ROWS:
        return {
            "data_source": "synthetic",
            "note": "Land dispute dataset not found on disk.",
            "total_cases": 0,
            "by_type": [],
            "by_status": [],
            "by_year": [],
            "top_districts": [],
        }

    total_cases = sum(r["count"] for r in DISPUTE_ROWS)

    by_type = defaultdict(int)
    by_status = defaultdict(int)
    by_year = defaultdict(int)
    by_district = defaultdict(int)

    for r in DISPUTE_ROWS:
        by_type[r["dispute_type"]] += r["count"]
        by_status[r["status"]] += r["count"]
        by_year[r["year"]] += r["count"]
        by_district[r["district"]] += r["count"]

    pending = by_status.get("Pending", 0)

    return {
        "data_source": "synthetic (modeled on NJDG-style case categories; not a live judiciary feed)",
        "total_cases": total_cases,
        "pending_case_rate_pct": round(100 * pending / total_cases, 1) if total_cases else 0,
        "by_type": sorted(
            [{"dispute_type": k, "count": v} for k, v in by_type.items()],
            key=lambda x: -x["count"]
        ),
        "by_status": sorted(
            [{"status": k, "count": v} for k, v in by_status.items()],
            key=lambda x: -x["count"]
        ),
        "by_year": sorted(
            [{"year": k, "count": v} for k, v in by_year.items()],
            key=lambda x: x["year"]
        ),
        "top_districts": sorted(
            [{"district": k, "count": v} for k, v in by_district.items()],
            key=lambda x: -x["count"]
        )[:10],
    }
