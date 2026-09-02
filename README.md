# SIH 2026 Problem Statement 26019
## National Digital Platform for Research and Policy Innovation in Land Governance
### Pilot Jurisdiction: State of Tamil Nadu (Tiruppur District Pilot)

An end-to-end geospatial intelligence and policy simulation platform for Tamil Nadu land governance.

---

## 🌟 Key Capabilities

1. **Exact 38-District Tamil Nadu Map:**
   * Authentic Survey of India / GADM administrative boundary geometries for all 38 districts of Tamil Nadu.
   * Minimalist, monochrome presentation (zero green/brown clutter, no API keys required).
   * Interactive click-to-focus and sub-district **Area / Taluk Dropdown** selection.

2. **Machine Learning Land Conversion Prediction:**
   * Ensemble Dual-Model (`RandomForestClassifier` + `GradientBoostingClassifier`) with 5-fold cross-validation.
   * Calibrated probability scores predicting 5-year farmland conversion danger into industrial built-up zones along the NH-544 corridor.
   * Explainable AI (XAI) feature attribution breakdown for every individual plot.

3. **Grounded Research & Policy RAG Copilot:**
   * Context-grounded retrieval from Tamil Nadu statutory acts (TNCDBR 2019 Rule 22 & 19, Tamil Nadu Town and Country Planning Act 1971 Section 47A, Tamil Nadu State Water Policy / Noyyal River Directives) and peer-reviewed studies.
   * Strict source citation safeguards against hallucinations.

4. **Policy Scenario Simulation Engine:**
   * Live sensitivity analysis across 3 development pathways (Business-as-Usual, Industrial Aggressive, Sustainable Agro-Ecological).
   * Live 0–100 Land Development Impact Score with interactive weights.

5. **Decision Support & Executive Briefs:**
   * One-click printable PDF Executive Evidence Briefs with formal signature blocks, charts, and recommendations.

---

## 🏗️ Architecture

```
SIH 2026 Metaminds/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # REST Endpoints (GIS, ML, Scenarios, RAG, Datasets)
│   │   ├── data/             # 38 Districts & Tiruppur micro-parcels GeoJSON
│   │   ├── ml/               # Scikit-learn Random Forest & Gradient Boosting models
│   │   ├── rag/              # Grounded Tamil Nadu Statutory Knowledge Base
│   │   ├── scenarios/        # Policy simulation engine & sensitivity modeling
│   │   └── main.py           # FastAPI entrypoint
│   └── test_backend.py       # Automated backend test suite
└── frontend/                 # React + TypeScript + Vite + Tailwind CSS
    ├── src/
    │   ├── components/       # MapcnPresentationMap, TamilNaduIsometricMap, ReportModal
    │   ├── pages/            # 10 Application views (Overview, GIS, Predictions, etc.)
    │   ├── data/             # Exact district vector paths
    │   └── services/         # Typed API clients
    └── package.json
```

---

## 🚀 Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
python -m pip install fastapi uvicorn scikit-learn numpy shapely pydantic
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Dashboard: `http://localhost:5173/`

---

## 👥 Team Metaminds — SIH 2026
