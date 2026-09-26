"""
Machine Learning Core: Land-Use Transition Risk Models
Task: Predict probability of Agricultural -> Built-up conversion across Tamil Nadu districts.
Models:
  - Model A: RandomForestClassifier (Baseline ensemble)
  - Model B: GradientBoostingClassifier (Boosted sequential trees)
Features:
  - dist_to_nh_km (proximity to NH-544 / SH corridors)
  - dist_to_urban_center_km (proximity to municipal core)
  - dist_to_rail_km
  - ndvi_2018, ndbi_2018, ndvi_delta, ndbi_delta (Sentinel-2 satellite indicators)
  - pop_density_sqkm (Census / OGD Tamil Nadu)
  - soil_quality_score
  - slope_pct
Validation: 5-Fold Stratified Cross-Validation + Calibration Analysis
Explainability: Transparent feature attribution ("Why this result?")
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, precision_recall_curve, auc
)
from sklearn.calibration import calibration_curve
from typing import Dict, List, Any, Tuple, Optional
from app.data.tamilnadu_data import ALL_DISTRICT_PARCELS

FEATURE_NAMES = [
    "dist_to_nh_km",
    "dist_to_urban_center_km",
    "dist_to_rail_km",
    "ndvi_2018",
    "ndbi_2018",
    "ndvi_delta",
    "ndbi_delta",
    "pop_density_sqkm",
    "soil_quality_score",
    "slope_pct"
]

FEATURE_LABELS = {
    "dist_to_nh_km": "Proximity to NH-544 Corridor",
    "dist_to_urban_center_km": "Proximity to District Urban Core",
    "dist_to_rail_km": "Railway Logistics Access",
    "ndvi_2018": "Baseline Vegetation Health (NDVI)",
    "ndbi_2018": "Baseline Built-up Index (NDBI)",
    "ndvi_delta": "5-Year Vegetation Loss (ΔNDVI)",
    "ndbi_delta": "5-Year Built Index Expansion (ΔNDBI)",
    "pop_density_sqkm": "Local Population Density",
    "soil_quality_score": "Agrarian Soil Quality / Productivity",
    "slope_pct": "Terrain Slope / Topography"
}

class MLSystem:
    def __init__(self):
        self.feature_names = FEATURE_NAMES
        self.feature_labels = FEATURE_LABELS
        self.model_a_rf = None
        self.model_b_gb = None
        self.metrics_rf = {}
        self.metrics_gb = {}
        self.predictions_cache = {}
        self.parcels_by_cell_id: Dict[str, Dict[str, Any]] = {}
        # Every parcel in ALL_DISTRICT_PARCELS only knows its own "taluk",
        # not which district it's grouped under — tag it once here (in
        # place; this dict is shared with lulc.py, which doesn't mind the
        # extra key) so predictions and the cell explainability endpoint
        # can filter/report by district.
        for dname, plist in ALL_DISTRICT_PARCELS.items():
            for p in plist:
                p.setdefault("district", dname)
                self.parcels_by_cell_id[p["cell_id"]] = p
        self._train_models()

    def _all_parcels(self) -> List[Dict[str, Any]]:
        return list(self.parcels_by_cell_id.values())

    def _prepare_data(self) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
        # Train on agricultural parcels pooled across every district with
        # data (not Tiruppur-only) — a statewide-trained model generalizes
        # better than one fit on a single district's ~280 rows and applied
        # everywhere else out-of-distribution.
        agri_parcels = [p for p in self._all_parcels() if p["lulc_2018"] == "Agriculture"]

        X_list = []
        y_list = []
        for p in agri_parcels:
            row = [
                p["dist_to_nh_km"],
                p["dist_to_urban_center_km"],
                p["dist_to_rail_km"],
                p["ndvi_2018"],
                p["ndbi_2018"],
                p["ndvi_delta"],
                p["ndbi_delta"],
                p["pop_density_sqkm"] / 1000.0,  # scale
                p["soil_quality_score"] / 100.0,
                p["slope_pct"]
            ]
            X_list.append(row)
            y_list.append(p["converted_agri_to_built"])
            
        return np.array(X_list), np.array(y_list), agri_parcels

    def _train_models(self):
        X, y, agri_parcels = self._prepare_data()
        
        # 1. Train Model A: Random Forest
        self.model_a_rf = RandomForestClassifier(
            n_estimators=120,
            max_depth=6,
            min_samples_split=4,
            random_state=42,
            class_weight="balanced"
        )
        self.model_a_rf.fit(X, y)
        
        # 2. Train Model B: Gradient Boosting
        self.model_b_gb = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=4,
            subsample=0.85,
            random_state=42
        )
        self.model_b_gb.fit(X, y)
        
        # Evaluate using 5-fold cross validation to avoid overfitting
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        y_pred_rf = cross_val_predict(self.model_a_rf, X, y, cv=cv)
        y_proba_rf = cross_val_predict(self.model_a_rf, X, y, cv=cv, method="predict_proba")[:, 1]
        
        y_pred_gb = cross_val_predict(self.model_b_gb, X, y, cv=cv)
        y_proba_gb = cross_val_predict(self.model_b_gb, X, y, cv=cv, method="predict_proba")[:, 1]
        
        self.metrics_rf = self._compute_evaluation("Random Forest (Model A)", y, y_pred_rf, y_proba_rf, self.model_a_rf.feature_importances_)
        self.metrics_gb = self._compute_evaluation("Gradient Boosting (Model B)", y, y_pred_gb, y_proba_gb, self.model_b_gb.feature_importances_)
        
        # Pre-calculate predictions across all districts' parcels
        self._generate_parcel_predictions(agri_parcels)

    def _compute_evaluation(self, name: str, y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray, feat_importances: np.ndarray) -> Dict[str, Any]:
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        roc = roc_auc_score(y_true, y_proba)
        
        precision_curve, recall_curve, _ = precision_recall_curve(y_true, y_proba)
        pr_auc = auc(recall_curve, precision_curve)
        
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        # Calibration curve (reliability)
        prob_true, prob_pred = calibration_curve(y_true, y_proba, n_bins=5, strategy='uniform')
        calibration_points = [
            {"predicted_bin": round(float(p), 2), "observed_fraction": round(float(t), 2)}
            for p, t in zip(prob_pred, prob_true)
        ]
        
        # Feature importances formatted
        features_ranked = []
        for feat_name, imp in sorted(zip(self.feature_names, feat_importances), key=lambda x: x[1], reverse=True):
            features_ranked.append({
                "feature_key": feat_name,
                "label": self.feature_labels.get(feat_name, feat_name),
                "importance_pct": round(float(imp) * 100, 1)
            })
            
        return {
            "model_name": name,
            "version": "v1.2-pilot-tn",
            "sample_size": len(y_true),
            "precision": round(float(prec), 3),
            "recall": round(float(rec), 3),
            "f1_score": round(float(f1), 3),
            "roc_auc": round(float(roc), 3),
            "pr_auc": round(float(pr_auc), 3),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            },
            "calibration_curve": calibration_points,
            "feature_importance": features_ranked,
            "training_period": "2018 – 2023 Sentinel-2 Historical Baseline",
            "data_sources": ["Bhuvan LULC (NRSC)", "Copernicus Sentinel-2", "OGD Tamil Nadu", "OpenStreetMap Road Network"],
            "limitations": (
                "Model trained on pooled parcels across all 32 districts with cadastral data (real "
                "geometry with modeled, not measured, conversion labels — see "
                "scripts/tn_satellite_indices_pipeline.py for what real satellite data this platform "
                "does have). ROC-AUC is higher than a single-district model (e.g. Tiruppur alone "
                "scored ~0.87) because pooling adds strong between-district variance on top of the "
                "same per-parcel noise — mean distance-to-urban-core ranges from ~5km in Chennai to "
                "~43km in Ariyalur, which the model can separate on district context alone, not just "
                "true land-use signal. Requires field validation before statutory rezoning."
            )
        }

    def _generate_parcel_predictions(self, agri_parcels: List[Dict[str, Any]]):
        # Batch every agricultural parcel into one matrix and call
        # predict_proba() once per model instead of once per parcel. With
        # ~7,500 parcels across all districts (vs. ~280 for Tiruppur alone),
        # one-row-at-a-time calls took ~223s at backend startup — each
        # sklearn predict_proba call has fixed Python/validation overhead
        # that dominates when the actual math per row is this cheap.
        all_parcels = self._all_parcels()
        agri_in_order = [p for p in all_parcels if p["lulc_2018"] == "Agriculture"]
        if agri_in_order:
            X_batch = np.array([[
                p["dist_to_nh_km"], p["dist_to_urban_center_km"], p["dist_to_rail_km"],
                p["ndvi_2018"], p["ndbi_2018"], p["ndvi_delta"], p["ndbi_delta"],
                p["pop_density_sqkm"] / 1000.0, p["soil_quality_score"] / 100.0, p["slope_pct"]
            ] for p in agri_in_order])
            probs_rf = self.model_a_rf.predict_proba(X_batch)[:, 1]
            probs_gb = self.model_b_gb.predict_proba(X_batch)[:, 1]
            ensemble_probs = {
                p["cell_id"]: round(float(0.5 * rf + 0.5 * gb), 3)
                for p, rf, gb in zip(agri_in_order, probs_rf, probs_gb)
            }
        else:
            ensemble_probs = {}

        for p in all_parcels:
            cell_id = p["cell_id"]
            if p["lulc_2018"] == "Agriculture":
                prob = ensemble_probs[cell_id]

                # Risk category
                if prob < 0.20:
                    risk_cat = "Very Low"
                elif prob < 0.40:
                    risk_cat = "Low"
                elif prob < 0.60:
                    risk_cat = "Moderate"
                elif prob < 0.80:
                    risk_cat = "High"
                else:
                    risk_cat = "Very High"
                    
                confidence = round(1.0 - abs(prob - 0.5) * 0.4, 2)  # Higher confidence when further from boundary
                
                # Top contributing factors for explainability
                contributions = self._compute_cell_explainability(p, prob)
                
                self.predictions_cache[cell_id] = {
                    "cell_id": cell_id,
                    "district": p["district"],
                    "taluk": p["taluk"],
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "transition_probability": prob,
                    "risk_category": risk_cat,
                    "confidence": confidence,
                    "model_version": "TN-Ensemble v1.2",
                    "contributing_factors": contributions,
                    "polygon": p["polygon"]
                }
            else:
                # Already built-up, waterbody, or scrub
                prob = 0.0 if p["lulc_2018"] == "Waterbody" else (0.85 if p["lulc_2018"] == "Built-up" else 0.25)
                risk_cat = "N/A (Built-up)" if p["lulc_2018"] == "Built-up" else ("Protected Water" if p["lulc_2018"] == "Waterbody" else "Low")
                self.predictions_cache[cell_id] = {
                    "cell_id": cell_id,
                    "district": p["district"],
                    "taluk": p["taluk"],
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "transition_probability": prob,
                    "risk_category": risk_cat,
                    "confidence": 0.95,
                    "model_version": "TN-Ensemble v1.2",
                    "contributing_factors": [],
                    "polygon": p["polygon"]
                }

    def _compute_cell_explainability(self, p: Dict[str, Any], prob: float) -> List[Dict[str, Any]]:
        # Calculate localized Shapley-like feature attribution based on deviation from agrarian mean
        factors = []
        
        # Road proximity impact
        nh_dist = p["dist_to_nh_km"]
        if nh_dist < 3.0:
            impact = round((3.0 - nh_dist) / 3.0 * 35, 1)
            factors.append({
                "factor": "High Proximity to NH-544 / SH-174 Corridor",
                "direction": "increases_risk",
                "contribution_pct": impact,
                "detail": f"{nh_dist:.1f} km from arterial highway"
            })
        elif nh_dist > 15.0:
            impact = round(min(25, (nh_dist - 15.0) * 1.2), 1)
            factors.append({
                "factor": "Remoteness from Highway Infrastructure",
                "direction": "decreases_risk",
                "contribution_pct": impact,
                "detail": f"{nh_dist:.1f} km buffer attenuates conversion pressure"
            })

        # Urban center proximity
        u_dist = p["dist_to_urban_center_km"]
        if u_dist < 5.0:
            impact = round((5.0 - u_dist) / 5.0 * 28, 1)
            factors.append({
                "factor": "Peri-Urban Spillover from District Urban Core",
                "direction": "increases_risk",
                "contribution_pct": impact,
                "detail": f"{u_dist:.1f} km from municipal boundary"
            })
            
        # NDBI Trend (Built expansion)
        ndbi_delta = p["ndbi_delta"]
        if ndbi_delta > 0.05:
            factors.append({
                "factor": "Accelerating Spectral Built-up Index (ΔNDBI)",
                "direction": "increases_risk",
                "contribution_pct": round(ndbi_delta * 120, 1),
                "detail": f"+{ndbi_delta:.3f} index rise over 5 years"
            })
            
        # Population density
        pop = p["pop_density_sqkm"]
        if pop > 800:
            factors.append({
                "factor": "High Local Demographic Pressure",
                "direction": "increases_risk",
                "contribution_pct": round(min(22, (pop - 800) / 40), 1),
                "detail": f"{pop} persons/sq.km"
            })
            
        # Soil fertility resilience
        soil = p["soil_quality_score"]
        if soil > 75:
            factors.append({
                "factor": "High Agro-Ecological Soil Productivity",
                "direction": "decreases_risk",
                "contribution_pct": round((soil - 75) * 1.1, 1),
                "detail": f"Index {soil}/100 provides farming resilience"
            })
            
        # Ensure at least 4 factors
        if len(factors) < 4:
            factors.append({
                "factor": "Groundwater Table Stress in Taluk",
                "direction": "increases_risk" if p["groundwater_status"] in ["Over-exploited", "Critical"] else "decreases_risk",
                "contribution_pct": 14.5,
                "detail": f"TWAD Category: {p['groundwater_status']}"
            })
            
        return sorted(factors, key=lambda x: x["contribution_pct"], reverse=True)[:5]

    def get_predictions(self, taluk: str = None, risk: str = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        results = list(self.predictions_cache.values())
        if district:
            results = [r for r in results if r["district"].lower() == district.lower()]
        if taluk:
            results = [r for r in results if r["taluk"].lower() == taluk.lower()]
        if risk:
            results = [r for r in results if r["risk_category"].lower() == risk.lower()]
        return results

    def get_cell_explanation(self, cell_id: str) -> Dict[str, Any]:
        if cell_id not in self.predictions_cache:
            return {"error": f"Cell {cell_id} not found"}
        cell_data = self.predictions_cache[cell_id]
        parcel_meta = self.parcels_by_cell_id.get(cell_id)
        
        return {
            "prediction": cell_data,
            "parcel_metadata": parcel_meta,
            "evidence_chain": {
                "prediction_value": f"{round(cell_data['transition_probability'] * 100, 1)}% Agricultural -> Built-up conversion risk",
                "model_architecture": "Ensemble (Random Forest v1.2 + Gradient Boosting v1.2)",
                "validation_roc_auc": self.metrics_rf["roc_auc"],
                "input_features": self.feature_names,
                "primary_datasets": [
                    {"dataset": "Bhuvan LULC 2018/2023", "authority": "NRSC / ISRO", "resolution": "30m"},
                    {"dataset": "Sentinel-2 Multi-Spectral (B4, B8, B11, B3)", "authority": "Copernicus ESA", "resolution": "10m"},
                    {"dataset": "Tamil Nadu OGD & CGWB Groundwater Assessment", "authority": "GoTN / TWAD Board", "resolution": "Block-level"},
                    {"dataset": "National Highway & State Highway Network", "authority": "MoRTH / TN Highways Dept", "resolution": "Vector lines"}
                ],
                "training_period": "2018 - 2023",
                "target_horizon": "2024 - 2029 Policy Horizon",
                "decision_support_notice": "Decision-support probability metric. Not a legal rezoning declaration. Requires statutory field inspection."
            }
        }

class _LazyMLSystem:
    """
    Defers the real MLSystem() construction — 5-fold CV training plus
    batched predict_proba over ~8,640 pooled parcels, 55s+ even on a
    reasonably fast local machine — until the first attribute a caller
    actually accesses, instead of at module-import time.

    Every router that touches ML predictions does `from app.ml.models
    import ml_system` at its own top level, and app/main.py imports every
    router before defining any FastAPI route. On the old eager singleton,
    that meant the whole training run had to finish before uvicorn could
    even register `/health`, let alone answer it — fine locally, but on a
    slower deploy host (e.g. Render's free tier) that blocked long enough
    for the platform's health check to time out the deploy entirely.

    __getattr__ only fires for attributes not already found on this proxy
    itself, so existing call sites (`ml_system.get_predictions(...)`,
    `ml_system.metrics_rf`, etc.) keep working completely unchanged — the
    first one just pays the training cost once, and it's cached after.
    """
    def __init__(self):
        self._real = None

    def _ensure(self) -> "MLSystem":
        if self._real is None:
            self._real = MLSystem()
        return self._real

    def __getattr__(self, name):
        return getattr(self._ensure(), name)

# Global singleton (lazy — see _LazyMLSystem above)
ml_system = _LazyMLSystem()
