"""
Climate Resilience Metrics.
Source: tamil_nadu_dataset/tamil_nadu_rainfall_1901_2015.csv — REAL IMD
(India Meteorological Department) state-level monthly rainfall series,
1901-2015. This is genuinely real historical data, but it stops at 2015 —
there is no live/current feed, which this endpoint states explicitly rather
than implying real-time coverage.
"""

import os
import csv
from collections import defaultdict
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/climate", tags=["Climate Resilience"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
RAINFALL_CSV = os.path.join(BASE_DIR, "tamil_nadu_dataset", "tamil_nadu_rainfall_1901_2015.csv")

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _load_rainfall():
    rows = []
    if os.path.exists(RAINFALL_CSV):
        with open(RAINFALL_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                try:
                    rows.append({
                        "year": int(r["year"]),
                        "month": int(r["month"]),
                        "rainfall_mm": float(r["rainfall_mm"]),
                    })
                except (KeyError, ValueError):
                    continue
    return rows


RAINFALL_ROWS = _load_rainfall()


@router.get("")
def get_climate_metrics() -> Dict[str, Any]:
    if not RAINFALL_ROWS:
        return {"data_source": "real (IMD)", "note": "Rainfall dataset not found on disk.", "annual_totals": []}

    by_year = defaultdict(float)
    by_month = defaultdict(list)
    for r in RAINFALL_ROWS:
        by_year[r["year"]] += r["rainfall_mm"]
        by_month[r["month"]].append(r["rainfall_mm"])

    years_sorted = sorted(by_year.keys())
    baseline_years = years_sorted
    baseline_avg = round(sum(by_year[y] for y in baseline_years) / len(baseline_years), 1)

    recent_years = [y for y in years_sorted if y >= years_sorted[-1] - 9]
    recent_avg = round(sum(by_year[y] for y in recent_years) / len(recent_years), 1)

    monthly_seasonality = [
        {"month": MONTH_NAMES[m - 1], "avg_rainfall_mm": round(sum(by_month[m]) / len(by_month[m]), 1)}
        for m in sorted(by_month.keys())
    ]

    return {
        "data_source": "real (India Meteorological Department, TAMIL NADU state subdivision, monthly series)",
        "coverage": f"{years_sorted[0]}–{years_sorted[-1]} (historical archive; no live/current feed wired into this platform)",
        "long_term_annual_avg_mm": baseline_avg,
        "recent_decade_annual_avg_mm": recent_avg,
        "recent_vs_baseline_pct_change": round(100 * (recent_avg - baseline_avg) / baseline_avg, 1),
        "recent_decade_years": [recent_years[0], recent_years[-1]],
        "monthly_seasonality": monthly_seasonality,
        "annual_totals": [{"year": y, "total_rainfall_mm": round(by_year[y], 1)} for y in years_sorted],
    }
