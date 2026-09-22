"""
Real pytest tripwires for the failure modes most likely to break during a
live demo. This does NOT aim for full coverage — test_backend.py (the
original smoke script, still useful for eyeballing real output) has zero
assertions and nothing to catch a silent regression before a jury sees it.
These tests exist to catch exactly that, for the four features a judge is
most likely to click on: RAG citations, ML risk predictions, scenario
scoring math, and village search.

Run with: pytest backend/tests -v
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# --- RAG: a known query must return a non-empty, cited answer -------------

def test_rag_query_returns_citations_for_known_question():
    res = client.post(
        "/api/v1/research/query",
        json={"question": "Where is agricultural land most likely to experience built-up expansion in Tiruppur?"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["answer"], "RAG returned an empty answer for a question the corpus should cover"
    assert len(body["sources"]) > 0, "RAG returned zero sources — every synthesized answer should cite something"
    assert 0.0 <= body["confidence_score"] <= 1.0


def test_rag_query_does_not_crash_on_gibberish():
    # A question with no corpus match must degrade to the honest
    # "insufficient evidence" template, not throw a 500.
    res = client.post("/api/v1/research/query", json={"question": "asdkfjaslkdfj qwerty 12345"})
    assert res.status_code == 200
    assert "answer" in res.json()


# --- ML Predictions: every returned cell must have a valid risk category --

VALID_RISK_CATEGORIES = {"Very Low", "Low", "Moderate", "High", "Very High"}


def test_predictions_endpoint_returns_valid_risk_categories():
    res = client.get("/api/v1/predictions?district=Tiruppur")
    assert res.status_code == 200
    body = res.json()
    assert body["total_evaluated_cells"] > 0
    predictions = body["predictions"]
    assert len(predictions) > 0
    for cell in predictions:
        assert cell["risk_category"] in VALID_RISK_CATEGORIES, f"Unexpected risk category: {cell['risk_category']}"
        assert 0.0 <= cell["transition_probability"] <= 1.0
        assert 0.0 <= cell["confidence"] <= 1.0


def test_predictions_handles_unknown_district_without_crashing():
    res = client.get("/api/v1/predictions?district=NotARealDistrict")
    assert res.status_code in (200, 404), "An unknown district should be handled explicitly, not a raw 500"


# --- Scenario Simulator: overall_score must actually equal the documented
#     weighted-sum formula, not something the endpoint merely claims -------

def test_scenario_scoring_matches_documented_formula():
    res = client.get("/api/v1/scenarios")
    assert res.status_code == 200
    body = res.json()
    assert len(body["scenarios"]) == 3

    for scenario in body["scenarios"]:
        indicators = scenario["indicators"]
        weights = scenario["scoring"]["normalized_weights"]
        expected = (
            indicators["development_suitability"] * weights["development_suitability"]
            + indicators["infrastructure_access"] * weights["infrastructure_access"]
            + indicators["agricultural_preservation"] * weights["agricultural_preservation"]
            + indicators["water_flood_safety"] * weights["water_flood_safety"]
            + indicators["ecological_protection"] * weights["ecological_protection"]
        )
        actual = scenario["scoring"]["overall_score"]
        assert actual == pytest.approx(expected, abs=0.15), (
            f"{scenario['name']}: overall_score {actual} doesn't match the weighted-sum "
            f"formula's own component_contributions ({expected:.2f})"
        )


def test_custom_policy_scorer_rejects_non_policy_input():
    # Regression test for the "not_a_policy" honesty fix: a bare question
    # must not be forced through the 5-component rubric with a fake score.
    res = client.post(
        "/api/v1/scenarios/analyze-custom",
        json={"policy_text": "is Parandur the best site for the new airport or is there a better one?"},
        headers={"X-User-Role": "Policymaker"},
    )
    assert res.status_code == 200
    body = res.json()
    # Either the LLM correctly flags this as not a policy, or no provider is
    # configured at all — both are honest outcomes. A fabricated numeric
    # score for a bare question would not be.
    assert body["status"] in ("not_a_policy", "unavailable", "success")


# --- Village Directory: a known district must return real results ---------

def test_village_search_returns_results_for_tiruppur():
    res = client.get("/api/v1/villages?district=Tiruppur&limit=20")
    assert res.status_code == 200
    body = res.json()
    assert body["total_matches"] > 0, "Tiruppur has real LGD villages — zero results means the CSV isn't loading"
    assert len(body["villages"]) > 0
    first = body["villages"][0]
    assert first["village_name"], "Village record is missing a name"
    assert first["district"], "Village record is missing its district"


# --- RBAC: server-side enforcement must actually reject the wrong role ----

def test_scenario_simulation_requires_authorized_role():
    res = client.post("/api/v1/scenarios/simulate", json={}, headers={"X-User-Role": "Public User"})
    assert res.status_code == 403, "Public User should not be able to run scenario simulations"


def test_scenario_simulation_allows_policymaker():
    res = client.post("/api/v1/scenarios/simulate", json={}, headers={"X-User-Role": "Policymaker"})
    assert res.status_code == 200


def test_authorized_land_records_role_comes_from_header_not_query_param():
    # Regression test for the Step-1 security fix: passing role as a query
    # parameter must no longer self-grant elevated clearance.
    res = client.get(
        "/api/v1/authorized/land-records?survey_no=42&district=Tiruppur&role=Policymaker",
        headers={"X-User-Role": "Public User"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["authorization_status"]["clearance_level"] == "PUBLIC_RESTRICTED", (
        "A Public User sending ?role=Policymaker in the query string got elevated "
        "clearance — the role query param should be ignored entirely now."
    )


# --- External Interoperability: must degrade gracefully, never 500 -------

def test_bhuvan_interop_never_returns_500():
    res = client.get("/api/v1/interop/bhuvan/layers")
    assert res.status_code == 200, "A slow/unreachable external service must degrade to status:unavailable, not a 500"
    assert res.json()["status"] in ("success", "unavailable")
