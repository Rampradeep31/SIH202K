import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.ml.models import ml_system
from app.rag.copilot import copilot
from app.scenarios.engine import scenario_engine

print("=== BACKEND INITIALIZATION TEST ===")
print("FastAPI app title:", app.title)
print("ML Random Forest ROC-AUC:", ml_system.metrics_rf["roc_auc"])
print("ML Gradient Boosting ROC-AUC:", ml_system.metrics_gb["roc_auc"])
print("Total Evaluated Parcels:", len(ml_system.predictions_cache))

# Test Ask-the-Map parser
from app.api.ask_map import ask_map_query, QueryRequest
res = ask_map_query(QueryRequest(query="Show agricultural areas with high predicted conversion risk within 5 km of major roads"))
print("Ask-the-Map matches count:", res["matched_count"])

# Test RAG query
rag_res = copilot.query("Where is agricultural land most likely to experience built-up expansion in Tiruppur?")
print("RAG Answer snippet:", rag_res["answer"][:100], "...")
print("RAG Citations count:", len(rag_res["sources"]))

# Test Scenario Engine
scenarios = scenario_engine.simulate_all()
print("Total Scenarios:", len(scenarios))
for s in scenarios:
    print(f" - {s['name']}: Overall Score = {s['scoring']['overall_score']}")

print("=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===")
