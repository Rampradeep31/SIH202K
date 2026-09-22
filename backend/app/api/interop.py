"""
External Interoperability: live integration with Bhuvan (NRSC/ISRO), India's
national geospatial portal — the SIH26019 deliverable asks for standardized
endpoints that integrate with existing digital governance portals (ULPIN,
Bhuvan). Elsewhere in this platform, Bhuvan is only *cited* as a data-lineage
source (e.g. in datasets.py, evidence.py) — this module is the one place
that actually calls Bhuvan's own public WMS service over the network.

Design choice: rather than hardcoding a guessed Bhuvan layer name (which
would either work by luck or silently 404 during a live demo), this queries
Bhuvan's real GetCapabilities document at request time and returns whatever
layers it currently advertises. This is also just a more honest integration —
the platform actually asks Bhuvan what's available instead of assuming.

Bhuvan's WMS access constraints are published as "NONE" (open, unauthenticated)
per its own GetCapabilities response, so no API key is required or stored.
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List

router = APIRouter(prefix="/interop", tags=["External Interoperability (Bhuvan/NRSC)"])

BHUVAN_WMS_BASE = "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms/get"
BHUVAN_GETCAPABILITIES_URL = f"{BHUVAN_WMS_BASE}?service=WMS&version=1.1.1&request=GetCapabilities"
REQUEST_TIMEOUT_SECONDS = 12  # Indian govt WMS endpoints are often slow; give it real room before giving up


def _strip_ns(tag: str) -> str:
    """ElementTree keeps XML namespaces glued onto tag names as '{uri}tag' — strip that."""
    return tag.split("}", 1)[-1] if "}" in tag else tag


@router.get("/bhuvan/layers")
def get_bhuvan_layers() -> Dict[str, Any]:
    """
    Live call to Bhuvan's public WMS GetCapabilities endpoint, parsed into a
    flat list of {name, title} the frontend can offer as WMS overlay choices.
    Returns status: "unavailable" (never a 500) if Bhuvan can't be reached —
    an external government service being briefly down shouldn't break this
    platform's own GIS Explorer.
    """
    try:
        req = urllib.request.Request(BHUVAN_GETCAPABILITIES_URL, headers={"User-Agent": "TN-LGIP/1.0"})
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            raw_xml = resp.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
        return {
            "status": "unavailable",
            "source": "Bhuvan (NRSC/ISRO) WMS",
            "message": f"Live Bhuvan WMS service could not be reached: {e}. This is an external government service outage, not a bug in this platform.",
            "layers": []
        }

    try:
        root = ET.fromstring(raw_xml)
    except ET.ParseError as e:
        return {
            "status": "unavailable",
            "source": "Bhuvan (NRSC/ISRO) WMS",
            "message": f"Bhuvan responded but the capabilities document couldn't be parsed: {e}",
            "layers": []
        }

    layers: List[Dict[str, str]] = []
    for elem in root.iter():
        if _strip_ns(elem.tag) != "Layer":
            continue
        name_el = next((c for c in elem if _strip_ns(c.tag) == "Name"), None)
        title_el = next((c for c in elem if _strip_ns(c.tag) == "Title"), None)
        if name_el is not None and name_el.text:
            layers.append({
                "name": name_el.text.strip(),
                "title": (title_el.text.strip() if title_el is not None and title_el.text else name_el.text.strip())
            })

    return {
        "status": "success",
        "source": "Bhuvan (NRSC/ISRO) WMS — live GetCapabilities",
        "wms_base_url": BHUVAN_WMS_BASE,
        "access_constraints": "None published by Bhuvan (public WMS, no API key required)",
        "total_layers": len(layers),
        "layers": layers[:200]  # cap payload; Bhuvan's full capabilities list can run into the hundreds
    }


@router.get("/bhuvan/wms-tile-url")
def get_bhuvan_wms_tile_url(layer: str = Query(..., description="Bhuvan layer name from /interop/bhuvan/layers")) -> Dict[str, Any]:
    """
    Returns a ready-to-use Leaflet L.tileLayer.wms() config for a chosen
    Bhuvan layer — the frontend never needs to know Bhuvan's request-building
    conventions itself.
    """
    return {
        "url": BHUVAN_WMS_BASE,
        "wms_params": {
            "service": "WMS",
            "version": "1.1.1",
            "layers": layer,
            "format": "image/png",
            "transparent": True,
            "srs": "EPSG:4326"
        }
    }
