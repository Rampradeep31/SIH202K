import urllib.request
import json

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        res = urllib.request.urlopen(req, data=json.dumps(data).encode('utf-8'))
    else:
        res = urllib.request.urlopen(req)
    out = json.loads(res.read().decode('utf-8'))
    return res.status, out

print("1. Testing /regions ...")
st, out = test(f"{BASE_URL}/regions")
print(f"   Status: {st}, Districts: {out.get('total_districts')}")

print("2. Testing /taluks?district=Tiruppur ...")
st, out = test(f"{BASE_URL}/taluks?district=Tiruppur")
print(f"   Status: {st}, Taluks: {out.get('taluks')}")

print("3. Testing /taluks/geojson?district=Tiruppur ...")
st, out = test(f"{BASE_URL}/taluks/geojson?district=Tiruppur")
print(f"   Status: {st}, Total Taluk Polygons: {len(out.get('features', []))}")

print("4. Testing /taluks/intelligence?district=Tiruppur&taluk=Palladam ...")
st, out = test(f"{BASE_URL}/taluks/intelligence?district=Tiruppur&taluk=Palladam")
print(f"   Status: {st}, Agri%: {out['metrics']['agricultural_land_pct']}, NDBI: {out['metrics']['ndbi_dry_summer']}, Soil: {out['metrics']['soil_condition']['status']}")

print("5. Testing /taluks/compare?district=Tiruppur ...")
st, out = test(f"{BASE_URL}/taluks/compare?district=Tiruppur")
print(f"   Status: {st}, Compared count: {out.get('total_taluks_evaluated')}, Top Agri: {out.get('rankings', [{}])[0]}")

print("6. Testing /taluks/filter/high-rain-agri ...")
st, out = test(f"{BASE_URL}/taluks/filter/high-rain-agri")
print(f"   Status: {st}, Total matches: {out.get('total_matches')}")

print("7. Testing /taluks/industry-suitability?district=Tiruppur&taluk=Palladam&industry=textile ...")
st, out = test(f"{BASE_URL}/taluks/industry-suitability?district=Tiruppur&taluk=Palladam&industry=textile")
print(f"   Status: {st}, Score: {out.get('suitability_score')}/100, Grade: {out.get('suitability_grade')}")

print("8. Testing /ask-map for Taluk Queries ...")
st, out = test(f"{BASE_URL}/ask-map", method='POST', data={"query": "Show taluks with high rainfall and high agricultural land"})
print(f"   Status: {st}, Matched: {out.get('matched_count')}, Explanation: {out.get('explanation')[:80]}...")

print("\nALL API ENDPOINTS VALIDATED SUCCESSFULLY!")
