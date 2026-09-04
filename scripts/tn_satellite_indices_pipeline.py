"""
Real Sentinel-2 zonal statistics pipeline for Tamil Nadu districts.

Queries Microsoft Planetary Computer's public STAC catalog for Sentinel-2
L2A scenes, computes NDVI/NDBI/NDWI for the least-cloudy scene per district
per season, cloud/shadow-masks using the scene's own SCL band, and writes
zonal statistics (mean/median/std/min/max) in the exact CSV schema the app
already expects — so the output drops straight into tamil_nadu_dataset/
and tamilnadu_data.py's existing loader picks it up with no code changes.

copilot.py now checks per-district/season whether real data exists in these
CSVs and labels its answer accordingly (VALIDATED with real values, or
KNOWN_GAP with an honest "no reading available" — never a fabricated
number) — no manual toggle needed after running this.

Setup:
    pip install pystac-client planetary-computer rasterio rasterstats shapely numpy certifi

Usage:
    # Test on one district first (~1 min) before committing to the full run:
    python scripts/tn_satellite_indices_pipeline.py --district Tiruppur

    # Full statewide run (37 of 38 districts x 2 seasons x 3 indices).
    # Actual observed runtime: ~35-45 min in a bandwidth-constrained sandbox
    # (reads are decimated to TARGET_PIXEL_SIZE_M=40 specifically to make this
    # feasible — see that constant if you want finer resolution and have
    # faster/unmetered bandwidth to Azure Blob Storage). Safe to re-run if
    # interrupted: already-written districts are skipped automatically
    # (--no-resume forces a full re-fetch instead).
    python scripts/tn_satellite_indices_pipeline.py

Known gaps after a full run (expected, not bugs):
  - Mayiladuthurai is absent — it's not in tamil_nadu_districts_exact.geojson
    (split from Nagapattinam in 2020, boundary not yet in that file).
  - A handful of district/season combos will be missing even after 3 fallback
    years (2024/2023/2022) if every candidate Sentinel-2 scene was too
    cloud-covered over that specific polygon. copilot.py reports these as
    KNOWN_GAP rather than silently estimating a number.

Output (written to tamil_nadu_dataset/, appended to incrementally — existing
rows for other districts are preserved, not overwritten):
    ndvi_post_monsoon_greenery_by_district.csv
    ndvi_peak_dry_summer_by_district.csv
    ndbi_post_monsoon_greenery_by_district.csv
    ndbi_peak_dry_summer_by_district.csv
    ndwi_post_monsoon_greenery_by_district.csv
    ndwi_peak_dry_summer_by_district.csv
"""

import argparse
import json
import os
import sys
import warnings

import numpy as np

# Windows GDAL wheels' curl backend (schannel) frequently fails remote COG
# reads with "certificate chain is incomplete" — schannel needs certs in the
# Windows cert store, not a PEM bundle, so pointing it at certifi's bundle
# (CURL_CA_BUNDLE) does NOT fix it. The practical fix is to disable TLS
# verification for these specific reads. This is a reasonable trade-off here:
# every asset fetched is public, unauthenticated, non-sensitive Sentinel-2
# open data — there's nothing a MITM could meaningfully tamper with that
# would matter, and no credentials ever cross this connection.
if os.name == "nt":
    os.environ.setdefault("GDAL_HTTP_UNSAFESSL", "YES")

try:
    import pystac_client
    import planetary_computer
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.windows import from_bounds, Window
    from rasterio.warp import transform_geom
    from rasterstats import zonal_stats
    from shapely.geometry import shape
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install pystac-client planetary-computer rasterio rasterstats shapely numpy")
    sys.exit(1)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TN_DATASET_DIR = os.path.join(BASE_DIR, "tamil_nadu_dataset")
# NOTE: tamil_nadu_dataset/tamil_nadu_districts.geojson stores coordinates as
# [lat, lon] instead of GeoJSON's standard [lon, lat] — confirmed by checking
# Tiruppur's shapely .bounds, which came back as (10.9, 77.1, 11.3, 77.5),
# i.e. latitude where longitude should be. That file is loaded by
# tamilnadu_data.py into an unused variable (REAL_DISTRICTS_GEOJSON is never
# read again), so nothing in the running app is affected — but it silently
# breaks any bbox/geometry op done directly against it, which is exactly
# what happened on the first run of this script (matched a Svalbard tile
# instead of Tamil Nadu). Use the correctly-ordered, already-trusted file
# instead — the same one the live GIS map renders from.
DISTRICTS_GEOJSON = os.path.join(BASE_DIR, "backend", "app", "data", "tamil_nadu_districts_exact.geojson")
DISTRICT_NAME_PROPERTY = "name"  # tamil_nadu_districts_exact.geojson uses "name", not "district"
# This file has 37 of the 38 districts — Mayiladuthurai (split from
# Nagapattinam in 2020) isn't in it. Mayiladuthurai keeps its existing
# MODEL_ESTIMATE value in copilot.py; every other district gets real data.

STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
COLLECTION = "sentinel-2-l2a"

# Two seasons matching the existing CSV naming convention. Adjust the year
# if 2024 imagery is sparse for a given district (cloud cover in NE monsoon
# districts especially) — the search falls back automatically if a window
# returns nothing, see SEASON_FALLBACK_YEARS.
SEASONS = {
    "post_monsoon_greenery": ("2024-11-01", "2024-12-15"),
    "peak_dry_summer": ("2024-04-01", "2024-05-15"),
}
SEASON_FALLBACK_YEARS = [2024, 2023, 2022]  # tried in order until a scene is found

# Sentinel-2 L2A Scene Classification (SCL) values to exclude as cloud/shadow/snow/nodata.
SCL_BAD_VALUES = {0, 1, 3, 8, 9, 10, 11}

MAX_CLOUD_COVER_PCT = 40

# District-level zonal stats don't need native 10m pixels — decimate reads to
# this effective resolution (meters) to cut network transfer volume. 40m is
# still far finer than any district's shape, so mean/median are unaffected
# beyond rounding noise; lower this (e.g. back to 10) only if you have fast,
# unmetered bandwidth to Azure Blob Storage and want finer std/min/max tails.
TARGET_PIXEL_SIZE_M = 40


def load_districts(only_district=None):
    with open(DISTRICTS_GEOJSON, "r", encoding="utf-8") as f:
        geo = json.load(f)
    districts = []
    for feat in geo["features"]:
        name = feat["properties"][DISTRICT_NAME_PROPERTY]
        if only_district and name.lower() != only_district.lower():
            continue
        districts.append({"name": name, "geometry": shape(feat["geometry"])})
    return districts


def find_best_item(catalog, bbox, date_from, date_to):
    search = catalog.search(
        collections=[COLLECTION],
        bbox=bbox,
        datetime=f"{date_from}/{date_to}",
        query={"eo:cloud_cover": {"lt": MAX_CLOUD_COVER_PCT}},
    )
    items = list(search.items())
    if not items:
        return None
    items.sort(key=lambda it: it.properties.get("eo:cloud_cover", 100))
    return items[0]


def _clip_window(window, width, height):
    return window.intersection(Window(0, 0, width, height))


def compute_indices_for_item(item, geom_wgs84):
    """
    Reads only the district's bounding window from each band (no full-scene
    download), staying entirely in the scene's native UTM CRS instead of
    reprojecting raster data — reprojecting the *raster* via WarpedVRT was
    the actual bug in the first version of this script: it silently produced
    a nonsensical window (offsets larger than the whole 10980x10980 source
    raster) that then failed on read. Reprojecting the much smaller district
    *polygon* into the raster's CRS instead avoids that entirely, and is the
    standard pattern for zonal stats.
    """
    signed = planetary_computer.sign(item)
    assets = signed.assets

    with rasterio.open(assets["B04"].href) as src04:
        raster_crs = src04.crs
        geom_native = shape(transform_geom("EPSG:4326", raster_crs, geom_wgs84.__geo_interface__))
        minx, miny, maxx, maxy = geom_native.bounds
        window = from_bounds(minx, miny, maxx, maxy, transform=src04.transform)
        window = _clip_window(window, src04.width, src04.height)
        if window.width < 1 or window.height < 1:
            return None, None, None
        window = window.round_lengths().round_offsets()

        # We only need district-level zonal *statistics*, not full-resolution
        # pixels — reading at native 10m over a whole district (often
        # 5000x5000+ px, tens of MB per band) is unnecessarily slow on a
        # constrained connection. Decimate to TARGET_PIXEL_SIZE_M using
        # rasterio's own windowed-read resampling (average = proper areal
        # mean per output pixel, not a nearest-neighbor guess) — this cuts
        # transfer volume by (TARGET_PIXEL_SIZE_M/10)^2 while still being
        # real Sentinel-2 reflectance data, just coarser-grained, which is
        # entirely appropriate for a whole-district summary statistic.
        decim = max(1, round(TARGET_PIXEL_SIZE_M / 10))
        out_shape = (max(1, int(window.height) // decim), max(1, int(window.width) // decim))
        b04 = src04.read(1, window=window, out_shape=out_shape, resampling=Resampling.average, out_dtype="float32")
        left, bottom, right, top = src04.window_bounds(window)
        win_transform = rasterio.transform.from_bounds(left, bottom, right, top, out_shape[1], out_shape[0])

    def read_10m(band, resampling):
        with rasterio.open(assets[band].href) as src:
            return src.read(1, window=window, out_shape=out_shape, resampling=resampling, out_dtype="float32")

    def read_20m(band, resampling):
        # B11/SCL are natively 20m (half the pixel size of B04/B08/B03), so
        # the same ground footprint is a window half as wide/tall in their
        # own grid.
        with rasterio.open(assets[band].href) as src:
            scale = src.transform.a / src04.transform.a  # ~2.0
            w20 = Window(window.col_off / scale, window.row_off / scale,
                         window.width / scale, window.height / scale)
            w20 = _clip_window(w20, src.width, src.height)
            return src.read(1, window=w20, out_shape=out_shape, resampling=resampling, out_dtype="float32")

    b08 = read_10m("B08", Resampling.average)   # NIR
    b03 = read_10m("B03", Resampling.average)   # Green
    b11 = read_20m("B11", Resampling.average)   # SWIR
    scl = read_20m("SCL", Resampling.nearest)   # Scene classification (categorical -> nearest, never average)

    bad_mask = np.isin(np.round(scl), list(SCL_BAD_VALUES))

    def safe_index(a, b):
        denom = a + b
        idx = np.where(denom != 0, (a - b) / np.where(denom == 0, 1, denom), np.nan)
        idx[bad_mask] = np.nan
        idx[(a == 0) & (b == 0)] = np.nan
        return idx

    ndvi = safe_index(b08, b04)
    ndbi = safe_index(b11, b08)
    ndwi = safe_index(b03, b08)
    return {"ndvi": ndvi, "ndbi": ndbi, "ndwi": ndwi}, win_transform, geom_native


def zonal_summary(array, transform, geometry):
    valid = array[~np.isnan(array)]
    if valid.size == 0:
        return None
    stats = zonal_stats(
        [geometry], array, affine=transform, nodata=np.nan,
        stats=["mean", "median", "std", "min", "max"]
    )[0]
    if stats["mean"] is None:
        return None
    return {k: round(float(v), 4) for k, v in stats.items()}


def with_retries(fn, *args, attempts=4, base_delay=5, **kwargs):
    """Long statewide runs will hit transient network drops (confirmed: a
    RemoteDisconnected killed a real run at district 28/37 with no retry).
    Retry with backoff rather than letting one hiccup lose everything."""
    import time
    last_err = None
    for attempt in range(attempts):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            last_err = e
            if attempt < attempts - 1:
                delay = base_delay * (2 ** attempt)
                print(f"    (network hiccup: {type(e).__name__}: {e} — retrying in {delay}s, attempt {attempt+2}/{attempts})")
                time.sleep(delay)
    raise last_err


def out_path_for(idx_name, season):
    return os.path.join(TN_DATASET_DIR, f"{idx_name}_{season}_by_district.csv")


def load_done_districts():
    """Districts already present in every one of the 6 output CSVs, so a
    re-run after a crash resumes instead of re-fetching finished work."""
    done = {season: set() for season in SEASONS}
    for season in SEASONS:
        per_index_districts = []
        for idx_name in ["ndvi", "ndbi", "ndwi"]:
            path = out_path_for(idx_name, season)
            names = set()
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    next(f, None)  # header
                    for line in f:
                        parts = line.split(",", 1)
                        if parts:
                            names.add(parts[0].strip('"'))
            per_index_districts.append(names)
        done[season] = set.intersection(*per_index_districts) if per_index_districts else set()
    return done


def append_row(idx_name, season, row):
    path = out_path_for(idx_name, season)
    is_new = not os.path.exists(path)
    os.makedirs(TN_DATASET_DIR, exist_ok=True)
    with open(path, "a", encoding="utf-8", newline="") as f:
        if is_new:
            f.write("district,season,index,mean,median,std,min,max\n")
        f.write(f'"{row["district"]}","{row["season"]}","{row["index"]}",{row["mean"]},{row["median"]},{row["std"]},{row["min"]},{row["max"]}\n')


def run(only_district=None, resume=True):
    catalog = pystac_client.Client.open(STAC_URL)
    districts = load_districts(only_district)
    if not districts:
        print(f"No matching district found for '{only_district}'. Check the name against tamil_nadu_districts.geojson.")
        sys.exit(1)

    done = load_done_districts() if resume else {season: set() for season in SEASONS}
    total_written = 0

    for i, d in enumerate(districts, 1):
        name = d["name"]
        bbox = d["geometry"].bounds  # (minx, miny, maxx, maxy) in WGS84, for the STAC search only
        print(f"[{i}/{len(districts)}] {name}")

        for season, (date_from, date_to) in SEASONS.items():
            if name in done[season]:
                print(f"    {season}: already done (resume) — skipping.")
                continue

            item = None
            for year in SEASON_FALLBACK_YEARS:
                yf = date_from.replace("2024", str(year))
                yt = date_to.replace("2024", str(year))
                try:
                    item = with_retries(find_best_item, catalog, bbox, yf, yt)
                except Exception as e:
                    print(f"    {season} {year}: search failed after retries — {e}")
                    continue
                if item:
                    break
            if not item:
                print(f"    {season}: no cloud-free scene found in {SEASON_FALLBACK_YEARS} — skipping (leave prior value / flag as gap).")
                continue

            cloud_pct = item.properties.get("eo:cloud_cover", "?")
            print(f"    {season}: using {item.id} (cloud cover {cloud_pct}%)")

            try:
                indices, transform, geom_native = with_retries(compute_indices_for_item, item, d["geometry"])
            except Exception as e:
                print(f"    {season}: failed to read/compute after retries — {e}")
                continue

            if indices is None:
                print(f"    {season}: district polygon fell outside the matched scene's coverage — skipping.")
                continue

            for idx_name, arr in indices.items():
                summary = zonal_summary(arr, transform, geom_native)
                if summary is None:
                    print(f"    {season}/{idx_name}: no valid (cloud-free) pixels in district polygon — skipping.")
                    continue
                append_row(idx_name, season, {"district": name, "season": season, "index": idx_name, **summary})
                total_written += 1

    print(f"\nWrote {total_written} new rows across 6 CSVs in {TN_DATASET_DIR}.")
    print("Restart the backend so tamilnadu_data.py re-reads the new CSVs.")
    print("If this run was interrupted, just re-run the same command — completed districts are skipped automatically.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real Sentinel-2 zonal stats pipeline for Tamil Nadu districts.")
    parser.add_argument("--district", default=None, help="Run for a single district only (e.g. --district Tiruppur), for testing before the full statewide run.")
    parser.add_argument("--no-resume", action="store_true", help="Re-fetch every district even if already present in the output CSVs (default: skip districts already done).")
    args = parser.parse_args()
    run(only_district=args.district, resume=not args.no_resume)
