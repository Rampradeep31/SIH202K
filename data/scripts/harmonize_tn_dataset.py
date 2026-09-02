import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)

print("--- Harmonizing Raw Tamil Nadu Datasets ---")

spatial_features = []

# Scan boundaries
bound_dir = os.path.join(RAW_DIR, "boundaries")
if os.path.exists(bound_dir):
    for f in os.listdir(bound_dir):
        if f.endswith(".geojson") or f.endswith(".json"):
            fp = os.path.join(bound_dir, f)
            with open(fp, "r", encoding="utf-8") as file:
                data = json.load(file)
                feats = data.get("features", []) if isinstance(data, dict) else []
                for feat in feats:
                    feat.setdefault("properties", {})["layer_type"] = "Administrative Boundary"
                    spatial_features.append(feat)

# Scan infrastructure
infra_dir = os.path.join(RAW_DIR, "infrastructure")
if os.path.exists(infra_dir):
    for f in os.listdir(infra_dir):
        if f.endswith(".geojson") or f.endswith(".json"):
            fp = os.path.join(infra_dir, f)
            with open(fp, "r", encoding="utf-8") as file:
                data = json.load(file)
                feats = data.get("features", []) if isinstance(data, dict) else []
                for feat in feats:
                    feat.setdefault("properties", {})["layer_type"] = "Transportation / Infrastructure Corridor"
                    spatial_features.append(feat)

# Scan LULC
lulc_dir = os.path.join(RAW_DIR, "lulc")
if os.path.exists(lulc_dir):
    for f in os.listdir(lulc_dir):
        if f.endswith(".geojson") or f.endswith(".json"):
            fp = os.path.join(lulc_dir, f)
            with open(fp, "r", encoding="utf-8") as file:
                data = json.load(file)
                feats = data.get("features", []) if isinstance(data, dict) else []
                for feat in feats:
                    feat.setdefault("properties", {})["layer_type"] = "LULC Grid"
                    spatial_features.append(feat)

# Scan Cadastral
cad_dir = os.path.join(RAW_DIR, "cadastral")
if os.path.exists(cad_dir):
    for f in os.listdir(cad_dir):
        if f.endswith(".geojson") or f.endswith(".json"):
            fp = os.path.join(cad_dir, f)
            with open(fp, "r", encoding="utf-8") as file:
                data = json.load(file)
                feats = data.get("features", []) if isinstance(data, dict) else []
                for feat in feats:
                    feat.setdefault("properties", {})["layer_type"] = "Cadastral Survey Parcel"
                    spatial_features.append(feat)

spatial_master = {
    "type": "FeatureCollection",
    "name": "Tamil_Nadu_Unified_Spatial_Master",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "total_features": len(spatial_features),
    "features": spatial_features
}

out_spatial = os.path.join(PROCESSED_DIR, "spatial_master.geojson")
with open(out_spatial, "w", encoding="utf-8") as f:
    json.dump(spatial_master, f, indent=2)
print(f"Saved {len(spatial_features)} features to {out_spatial}")

# Build Dataset Metadata Dictionary
metadata = {
    "project_id": "SIH_2026_PS_26019",
    "project_title": "National Digital Platform for Research and Policy Innovation in Land Governance",
    "pilot_state": "Tamil Nadu",
    "coordinate_reference_system": "EPSG:4326 (WGS84)",
    "datasets": {
        "districts_boundary": {
            "path": "data/raw/boundaries/tn_districts.geojson",
            "format": "GeoJSON Boundary",
            "source": "OpenStreetMap Nominatim / DataMeet"
        },
        "coimbatore_roads": {
            "path": "data/raw/infrastructure/coimbatore_roads.geojson",
            "format": "GeoJSON LineString Network",
            "source": "OpenStreetMap Overpass API"
        },
        "spatial_master": {
            "path": "data/processed/spatial_master.geojson",
            "total_features": len(spatial_features),
            "format": "GeoJSON Master Spatial Layer"
        }
    }
}

out_meta = os.path.join(BASE_DIR, "dataset_metadata.json")
with open(out_meta, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)
print(f"Saved dataset metadata dictionary to {out_meta}")

print("Harmonization finished successfully!")
