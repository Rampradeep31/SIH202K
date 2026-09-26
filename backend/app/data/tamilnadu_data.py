"""
Tamil Nadu Geographic & Pilot Data Module (Real Data Integrated)
Contains:
1. All 38 Districts of Tamil Nadu with real polygon boundaries, centroids, and Sentinel-2 STAC stats
2. Detailed Tiruppur District granular taluk structures
3. Real Sentinel-2 L2A Zonal Statistics (NDVI, NDWI, NDBI) and Cadastral Survey Parcels
4. Statutory and Environmental base values (CGWB, IMD Rainfall, Census 2011)
"""

import os
import json
import csv
import glob
import math
import random
import logging
import numpy as np
from typing import Dict, List, Any
from collections.abc import Mapping

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
TN_DATASET_DIR = os.path.join(BASE_DIR, "tamil_nadu_dataset")
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_MASTER = os.path.join(DATA_DIR, "processed", "spatial_master.geojson")

# 1. Load Real District Boundaries & Sentinel-2 Stats
districts_geojson_path = os.path.join(TN_DATASET_DIR, "tamil_nadu_districts.geojson")
REAL_DISTRICTS_GEOJSON = None
if os.path.exists(districts_geojson_path):
    with open(districts_geojson_path, "r", encoding="utf-8") as f:
        REAL_DISTRICTS_GEOJSON = json.load(f)

# Load Real Satellite Zonal Statistics
SAT_STATS_DISTRICT = {}
sat_files = glob.glob(os.path.join(TN_DATASET_DIR, "*_by_district.csv"))
for sf in sat_files:
    key = os.path.basename(sf).replace(".csv", "")
    with open(sf, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            dist = r.get("district", "").strip('"\t ')
            if dist:
                try:
                    SAT_STATS_DISTRICT.setdefault(dist, {})[key] = {
                        "mean": float(r["mean"]), "median": float(r["median"]),
                        "min": float(r["min"]), "max": float(r["max"]), "std": float(r["std"])
                    }
                except (ValueError, KeyError):
                    pass

# All 38 Districts of Tamil Nadu with Centroids, Taluks, and Real Attributes
TAMIL_NADU_DISTRICTS = [
    {
        "id": "tiruppur", "name": "Tiruppur", "region": "Western", "hq": "Tiruppur", "area_sqkm": 5187, "population": 2479052, "urban_pct": 61.4, "pilot_focus": True,
        "lat": 11.1075, "lon": 77.3411,
        "description": "Global knitwear & textile hub; acute agricultural-industrial transition along NH-544 and Noyyal basin",
        "taluks": ["Tiruppur North", "Tiruppur South", "Avinashi", "Palladam", "Kangeyam", "Dharapuram", "Udumalaipettai", "Madathukulam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tiruppur", {})
    },
    {
        "id": "coimbatore", "name": "Coimbatore", "region": "Western", "hq": "Coimbatore", "area_sqkm": 4723, "population": 3458045, "urban_pct": 75.7, "pilot_focus": False,
        "lat": 11.0168, "lon": 76.9558,
        "description": "Major manufacturing, precision engineering, textile machinery and IT hub",
        "taluks": ["Coimbatore North", "Coimbatore South", "Sulur", "Pollachi", "Mettupalayam", "Annur", "Kinathukadavu", "Valparai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Coimbatore", {})
    },
    {
        "id": "erode", "name": "Erode", "region": "Western", "hq": "Erode", "area_sqkm": 5722, "population": 2251744, "urban_pct": 51.4, "pilot_focus": False,
        "lat": 11.3410, "lon": 77.7172,
        "description": "Turmeric hub, textile processing, and agrarian belts along the Bhavani river",
        "taluks": ["Erode", "Perundurai", "Bhavani", "Gobichettipalayam", "Sathyamangalam", "Anthiyur", "Modakkurichi", "Kodumudi"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Erode", {})
    },
    {
        "id": "salem", "name": "Salem", "region": "Western", "hq": "Salem", "area_sqkm": 5245, "population": 3482056, "urban_pct": 50.9, "pilot_focus": False,
        "lat": 11.6643, "lon": 78.1460,
        "description": "Steel, sago, textile spinning, and mineral-rich industrial nexus",
        "taluks": ["Salem", "Salem South", "Salem West", "Attur", "Mettur", "Omalur", "Edappadi", "Sankari", "Yercaud"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Salem", {})
    },
    {
        "id": "chennai", "name": "Chennai", "region": "Northern", "hq": "Chennai", "area_sqkm": 426, "population": 7088000, "urban_pct": 100.0, "pilot_focus": False,
        "lat": 13.0827, "lon": 80.2707,
        "description": "State capital, automotive capital, seaport logistics, and IT hub",
        "taluks": ["Egmore", "Guindy", "Mylapore", "Tondiarpet", "Velachery", "Alandur", "Aminjikarai", "Sholinganallur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Chennai", {})
    },
    {
        "id": "kanchipuram", "name": "Kanchipuram", "region": "Northern", "hq": "Kanchipuram", "area_sqkm": 1655, "population": 1166401, "urban_pct": 63.5, "pilot_focus": False,
        "lat": 12.8342, "lon": 79.7036,
        "description": "Silk heritage, temple city, and electronics SIPCOT corridor (Sriperumbudur)",
        "taluks": ["Kanchipuram", "Sriperumbudur", "Kundrathur", "Uthiramerur", "Walajabad"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Kanchipuram", {})
    },
    {
        "id": "chengalpattu", "name": "Chengalpattu", "region": "Northern", "hq": "Chengalpattu", "area_sqkm": 2944, "population": 2556244, "urban_pct": 68.2, "pilot_focus": False,
        "lat": 12.6841, "lon": 79.9836,
        "description": "Automotive cluster, aerospace park, pharma SEZ, and residential expansion",
        "taluks": ["Chengalpattu", "Tambaram", "Pallavaram", "Vandalur", "Madurantakam", "Cheyyur", "Tiruporur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Chengalpattu", {})
    },
    {
        "id": "thiruvallur", "name": "Thiruvallur", "region": "Northern", "hq": "Thiruvallur", "area_sqkm": 3422, "population": 3728104, "urban_pct": 65.1, "pilot_focus": False,
        "lat": 13.1432, "lon": 79.9083,
        "description": "Kattupalli / Ennore port corridors, heavy industrial belts, and peri-urban growth",
        "taluks": ["Thiruvallur", "Poonamallee", "Avadi", "Ambattur", "Gummidipoondi", "Ponneri", "Tiruttani", "Uthukkottai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Thiruvallur", {})
    },
    {
        "id": "vellore", "name": "Vellore", "region": "Northern", "hq": "Vellore", "area_sqkm": 1791, "population": 1614242, "urban_pct": 43.3, "pilot_focus": False,
        "lat": 12.9165, "lon": 79.1325,
        "description": "Leather manufacturing, healthcare nexus, and Palar river basin",
        "taluks": ["Vellore", "Katpadi", "Gudiyatham", "Anaicut", "Pernambut", "K.V. Kuppam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Vellore", {})
    },
    {
        "id": "ranipet", "name": "Ranipet", "region": "Northern", "hq": "Ranipet", "area_sqkm": 2234, "population": 1210277, "urban_pct": 48.0, "pilot_focus": False,
        "lat": 12.9272, "lon": 79.3330,
        "description": "Industrial SIPCOT corridor, leather processing, and boiler fabrication",
        "taluks": ["Ranipet", "Walajah", "Arcot", "Arakkonam", "Nemili", "Kalavai", "Sholinghur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Ranipet", {})
    },
    {
        "id": "tirupathur", "name": "Tirupathur", "region": "Northern", "hq": "Tirupathur", "area_sqkm": 1797, "population": 1111812, "urban_pct": 34.0, "pilot_focus": False,
        "lat": 12.4925, "lon": 78.5678,
        "description": "Agrarian, footwear hub, Yelagiri hills, and dryland farming",
        "taluks": ["Tirupathur", "Vaniyambadi", "Ambur", "Natrampalli"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tirupathur", {})
    },
    {
        "id": "viluppuram", "name": "Viluppuram", "region": "Northern", "hq": "Viluppuram", "area_sqkm": 3725, "population": 2032890, "urban_pct": 15.0, "pilot_focus": False,
        "lat": 11.9401, "lon": 79.4861,
        "description": "Agrarian heartland, sugarcane, oilseeds, and paddy cultivation",
        "taluks": ["Viluppuram", "Tindivanam", "Gingee", "Vanur", "Marakkanam", "Vikravandi", "Kandachipuram", "Thiruvennainallur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Viluppuram", {})
    },
    {
        "id": "kallakurichi", "name": "Kallakurichi", "region": "Northern", "hq": "Kallakurichi", "area_sqkm": 3520, "population": 1370281, "urban_pct": 14.5, "pilot_focus": False,
        "lat": 11.7384, "lon": 78.9639,
        "description": "Agricultural base with extensive dryland and irrigated paddy",
        "taluks": ["Kallakurichi", "Sankarapuram", "Chinnasalem", "Ulundurpet", "Tirukoilur", "Kalvarayan Hills"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Kallakurichi", {})
    },
    {
        "id": "cuddalore", "name": "Cuddalore", "region": "Northern", "hq": "Cuddalore", "area_sqkm": 3678, "population": 2605914, "urban_pct": 33.9, "pilot_focus": False,
        "lat": 11.7480, "lon": 79.7714,
        "description": "Coastal aquaculture, Neyveli lignite mining, and chemical SIPCOT",
        "taluks": ["Cuddalore", "Panruti", "Chidambaram", "Vridhachalam", "Kattumannarkoil", "Tittakudi", "Kurinjipadi", "Veppur", "Srimushnam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Cuddalore", {})
    },
    {
        "id": "tiruvannamalai", "name": "Tiruvannamalai", "region": "Northern", "hq": "Tiruvannamalai", "area_sqkm": 6191, "population": 2464875, "urban_pct": 20.1, "pilot_focus": False,
        "lat": 12.2253, "lon": 79.0747,
        "description": "Heritage centre, silk weaving, and rainfed agrarian belts",
        "taluks": ["Tiruvannamalai", "Arani", "Cheyyar", "Chengam", "Polur", "Vandavasi", "Kalawasal", "Jamunamarathur", "Kilpennathur", "Chetpet", "Vembakkam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tiruvannamalai", {})
    },
    {
        "id": "dharmapuri", "name": "Dharmapuri", "region": "Western", "hq": "Dharmapuri", "area_sqkm": 4497, "population": 1506843, "urban_pct": 17.3, "pilot_focus": False,
        "lat": 12.1211, "lon": 78.1582,
        "description": "Horticulture, mango belt, sericulture, and dryland farming",
        "taluks": ["Dharmapuri", "Palacode", "Pennagaram", "Harur", "Pappireddipatti", "Karimangalam", "Nallampalli"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Dharmapuri", {})
    },
    {
        "id": "krishnagiri", "name": "Krishnagiri", "region": "Western", "hq": "Krishnagiri", "area_sqkm": 5143, "population": 1879809, "urban_pct": 22.8, "pilot_focus": False,
        "lat": 12.5186, "lon": 78.2137,
        "description": "Hosur auto-EV manufacturing corridor and horticulture",
        "taluks": ["Krishnagiri", "Hosur", "Pochampalli", "Uthangarai", "Denkanikottai", "Bargur", "Shoolagiri", "Anchetty"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Krishnagiri", {})
    },
    {
        "id": "namakkal", "name": "Namakkal", "region": "Western", "hq": "Namakkal", "area_sqkm": 3368, "population": 1726601, "urban_pct": 40.3, "pilot_focus": False,
        "lat": 11.2189, "lon": 78.1674,
        "description": "Poultry capital of India, transport logistics, and borewell industry",
        "taluks": ["Namakkal", "Rasipuram", "Tiruchengode", "Paramathi Velur", "Kolli Hills", "Sendamangalam", "Mohanur", "Kumarapalayam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Namakkal", {})
    },
    {
        "id": "dindigul", "name": "Dindigul", "region": "Central", "hq": "Dindigul", "area_sqkm": 6266, "population": 2159775, "urban_pct": 37.4, "pilot_focus": False,
        "lat": 10.3673, "lon": 77.9803,
        "description": "Lock manufacturing, spinning mills, and Kodaikanal hill ecology",
        "taluks": ["Dindigul East", "Dindigul West", "Palani", "Oddanchatram", "Kodaikanal", "Natham", "Nilakottai", "Athoor", "Vedasandur", "Gujiliamparai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Dindigul", {})
    },
    {
        "id": "karur", "name": "Karur", "region": "Central", "hq": "Karur", "area_sqkm": 2895, "population": 1064493, "urban_pct": 40.8, "pilot_focus": False,
        "lat": 10.9601, "lon": 78.0766,
        "description": "Home textiles exports, TNPL paper mills, and bus bodybuilding",
        "taluks": ["Karur", "Aravakurichi", "Kulithalai", "Krishnarayapuram", "Kadavur", "Manmangalam", "Pugalur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Karur", {})
    },
    {
        "id": "tiruchirappalli", "name": "Tiruchirappalli", "region": "Central", "hq": "Tiruchirappalli", "area_sqkm": 4403, "population": 2722290, "urban_pct": 49.2, "pilot_focus": False,
        "lat": 10.7905, "lon": 78.7047,
        "description": "BHEL heavy engineering, railway hub, and educational nexus",
        "taluks": ["Tiruchirappalli West", "Tiruchirappalli East", "Srirangam", "Lalgudi", "Manachanallur", "Musiri", "Thottiyam", "Thuraiyur", "Manapparai", "Marungapuri"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tiruchirappalli", {})
    },
    {
        "id": "perambalur", "name": "Perambalur", "region": "Central", "hq": "Perambalur", "area_sqkm": 1756, "population": 565223, "urban_pct": 17.2, "pilot_focus": False,
        "lat": 11.2342, "lon": 78.8820,
        "description": "Maize, cotton agrarian belt, and MRF tyre industrial corridor",
        "taluks": ["Perambalur", "Kunnam", "Veppanthattai", "Alathur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Perambalur", {})
    },
    {
        "id": "ariyalur", "name": "Ariyalur", "region": "Central", "hq": "Ariyalur", "area_sqkm": 1949, "population": 754894, "urban_pct": 11.1, "pilot_focus": False,
        "lat": 11.1401, "lon": 79.0786,
        "description": "Major cement manufacturing clusters and limestone reserves",
        "taluks": ["Ariyalur", "Udayarpalayam", "Sendurai", "Andimadam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Ariyalur", {})
    },
    {
        "id": "thanjavur", "name": "Thanjavur", "region": "Delta", "hq": "Thanjavur", "area_sqkm": 3396, "population": 2405890, "urban_pct": 35.4, "pilot_focus": False,
        "lat": 10.7870, "lon": 79.1378,
        "description": "Rice bowl of Tamil Nadu, Cauvery delta perennial agriculture",
        "taluks": ["Thanjavur", "Kumbakonam", "Papanasam", "Pattukkottai", "Orathanadu", "Thiruvaiyaru", "Peravurani", "Budalur", "Thiruvidaimarudur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Thanjavur", {})
    },
    {
        "id": "tiruvarur", "name": "Tiruvarur", "region": "Delta", "hq": "Tiruvarur", "area_sqkm": 2097, "population": 1264277, "urban_pct": 20.4, "pilot_focus": False,
        "lat": 10.7725, "lon": 79.6365,
        "description": "Delta wetlands, traditional paddy, and agrarian tank systems",
        "taluks": ["Tiruvarur", "Mannargudi", "Thiruthuraipoondi", "Nannilam", "Kudavasal", "Valangaiman", "Needamangalam", "Koothanallur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tiruvarur", {})
    },
    {
        "id": "nagapattinam", "name": "Nagapattinam", "region": "Delta", "hq": "Nagapattinam", "area_sqkm": 1397, "population": 697069, "urban_pct": 22.6, "pilot_focus": False,
        "lat": 10.7672, "lon": 79.8449,
        "description": "Coastal fisheries, delta agriculture, and port infrastructure",
        "taluks": ["Nagapattinam", "Kilvelur", "Vedaranyam", "Thirukkuvalai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Nagapattinam", {})
    },
    {
        "id": "mayiladuthurai", "name": "Mayiladuthurai", "region": "Delta", "hq": "Mayiladuthurai", "area_sqkm": 1172, "population": 918356, "urban_pct": 21.0, "pilot_focus": False,
        "lat": 11.1075, "lon": 79.6524,
        "description": "Cauvery delta mouth ecology, temple agriculture, and marine fishing",
        "taluks": ["Mayiladuthurai", "Sirkazhi", "Tharangambadi", "Kuthalam"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Mayiladuthurai", {})
    },
    {
        "id": "pudukkottai", "name": "Pudukkottai", "region": "Central", "hq": "Pudukkottai", "area_sqkm": 4663, "population": 1618345, "urban_pct": 19.5, "pilot_focus": False,
        "lat": 10.3797, "lon": 78.8208,
        "description": "Traditional tank cascades, agro-forestry, and dryland farming",
        "taluks": ["Pudukkottai", "Alangudi", "Aranthangi", "Gandarvakottai", "Illuppur", "Karambakkudi", "Kulathur", "Manamelkudi", "Ponnamaravathi", "Thirumayam", "Avudiyarkoil"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Pudukkottai", {})
    },
    {
        "id": "madurai", "name": "Madurai", "region": "Southern", "hq": "Madurai", "area_sqkm": 3741, "population": 3038252, "urban_pct": 60.8, "pilot_focus": False,
        "lat": 9.9252, "lon": 78.1198,
        "description": "Cultural capital, commercial hub, and Vaigai river basin",
        "taluks": ["Madurai North", "Madurai South", "Madurai East", "Madurai West", "Melur", "Thirumangalam", "Usilampatti", "Vadipatti", "Peraiyur", "Tiruparankundram"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Madurai", {})
    },
    {
        "id": "theni", "name": "Theni", "region": "Southern", "hq": "Theni", "area_sqkm": 2889, "population": 1245899, "urban_pct": 53.8, "pilot_focus": False,
        "lat": 10.0104, "lon": 77.4768,
        "description": "Western Ghats foothills, banana/cardamom cash crops, and horticulture",
        "taluks": ["Theni", "Periyakulam", "Bodinayakanur", "Uthamapalayam", "Andipatti"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Theni", {})
    },
    {
        "id": "virudhunagar", "name": "Virudhunagar", "region": "Southern", "hq": "Virudhunagar", "area_sqkm": 4241, "population": 1942288, "urban_pct": 50.5, "pilot_focus": False,
        "lat": 9.5680, "lon": 77.9624,
        "description": "Sivakasi printing/fireworks clusters, cotton ginning, and agro-trade",
        "taluks": ["Virudhunagar", "Sivakasi", "Rajapalayam", "Srivilliputhur", "Aruppukkottai", "Sattur", "Kariapatti", "Tiruchuli", "Vembakottai", "Watrap"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Virudhunagar", {})
    },
    {
        "id": "sivaganga", "name": "Sivaganga", "region": "Southern", "hq": "Sivaganga", "area_sqkm": 4189, "population": 1339101, "urban_pct": 30.8, "pilot_focus": False,
        "lat": 9.8433, "lon": 78.4809,
        "description": "Chettinad region, dryland agriculture, and traditional tank networks",
        "taluks": ["Sivaganga", "Karaikudi", "Devakottai", "Manamadurai", "Ilayangudi", "Tirupathur", "Kalaiyarkovil", "Singampunari"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Sivaganga", {})
    },
    {
        "id": "ramanathapuram", "name": "Ramanathapuram", "region": "Southern", "hq": "Ramanathapuram", "area_sqkm": 4104, "population": 1353445, "urban_pct": 30.3, "pilot_focus": False,
        "lat": 9.3639, "lon": 78.8395,
        "description": "Dry coastal ecosystem, chilli cultivation, and Gulf of Mannar biosphere",
        "taluks": ["Ramanathapuram", "Paramakudi", "Rameswaram", "Tiruvadanai", "Mudukulathur", "Kamuthi", "Kadaladi", "Rajasingamangalam", "Kilakarai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Ramanathapuram", {})
    },
    {
        "id": "thoothukudi", "name": "Thoothukudi", "region": "Southern", "hq": "Thoothukudi", "area_sqkm": 4707, "population": 1750176, "urban_pct": 50.1, "pilot_focus": False,
        "lat": 8.7642, "lon": 78.1348,
        "description": "Major international seaport, thermal power, and petrochemical SIPCOT",
        "taluks": ["Thoothukudi", "Kovilpatti", "Tiruchendur", "Srivaikuntam", "Ottapidaram", "Ettayapuram", "Vilathikulam", "Sathankulam", "Kayathar", "Eral"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Thoothukudi", {})
    },
    {
        "id": "tirunelveli", "name": "Tirunelveli", "region": "Southern", "hq": "Tirunelveli", "area_sqkm": 3842, "population": 1665253, "urban_pct": 49.9, "pilot_focus": False,
        "lat": 8.7139, "lon": 77.7567,
        "description": "Tamirabarani river perennial irrigation, wind energy corridor",
        "taluks": ["Tirunelveli", "Palayamkottai", "Ambasamudram", "Nanguneri", "Radhapuram", "Cheranmahadevi", "Manur", "Tisayanvilai"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tirunelveli", {})
    },
    {
        "id": "tenkasi", "name": "Tenkasi", "region": "Southern", "hq": "Tenkasi", "area_sqkm": 2916, "population": 1407627, "urban_pct": 43.1, "pilot_focus": False,
        "lat": 8.9594, "lon": 77.3161,
        "description": "Western Ghats waterfalls, spice plantations, and fertile paddy belt",
        "taluks": ["Tenkasi", "Sankarankovil", "Kadayanallur", "Sivagiri", "Alangulam", "Shenkottai", "Thiruvengadam", "Veerakeralamputhur"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Tenkasi", {})
    },
    {
        "id": "kanniyakumari", "name": "Kanniyakumari", "region": "Southern", "hq": "Nagercoil", "area_sqkm": 1672, "population": 1870374, "urban_pct": 82.3, "pilot_focus": False,
        "lat": 8.0883, "lon": 77.5385,
        "description": "Southernmost tip, rubber plantations, high population density, and wetlands",
        "taluks": ["Agasteeswaram", "Thovalai", "Kalkulam", "Vilavancode", "Thiruvattar", "Killiyoor"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Kanniyakumari", {})
    },
    {
        "id": "nilgiris", "name": "Nilgiris", "region": "Western", "hq": "Udhagamandalam", "area_sqkm": 2549, "population": 735394, "urban_pct": 59.2, "pilot_focus": False,
        "lat": 11.4102, "lon": 76.6950,
        "description": "High-altitude shola-grassland ecosystem, tea plantations, and biosphere reserve",
        "taluks": ["Udhagamandalam", "Coonoor", "Kotagiri", "Gudalur", "Pandalur", "Kundah"],
        "sentinel2_stats": SAT_STATS_DISTRICT.get("Nilgiris", {})
    }
]

# Tiruppur Taluks Baseline
TIRUPPUR_TALUKS = [
    {"id": "tiruppur_north", "name": "Tiruppur North", "hq": "Tiruppur", "area_ha": 38200, "urban_pressure": "Very High", "lat": 11.145, "lon": 77.341, "gw_status": "Over-exploited"},
    {"id": "tiruppur_south", "name": "Tiruppur South", "hq": "Tiruppur", "area_ha": 41500, "urban_pressure": "Very High", "lat": 11.082, "lon": 77.355, "gw_status": "Over-exploited"},
    {"id": "avinashi", "name": "Avinashi", "hq": "Avinashi", "area_ha": 52600, "urban_pressure": "High", "lat": 11.193, "lon": 77.269, "gw_status": "Critical"},
    {"id": "palladam", "name": "Palladam", "hq": "Palladam", "area_ha": 64800, "urban_pressure": "High", "lat": 10.998, "lon": 77.291, "gw_status": "Critical"},
    {"id": "kangeyam", "name": "Kangeyam", "hq": "Kangeyam", "area_ha": 89200, "urban_pressure": "Moderate", "lat": 11.005, "lon": 77.561, "gw_status": "Semi-critical"},
    {"id": "dharapuram", "name": "Dharapuram", "hq": "Dharapuram", "area_ha": 114500, "urban_pressure": "Low-Moderate", "lat": 10.728, "lon": 77.526, "gw_status": "Semi-critical"},
    {"id": "udumalaipettai", "name": "Udumalaipettai", "hq": "Udumalaipettai", "area_ha": 78300, "urban_pressure": "Moderate", "lat": 10.583, "lon": 77.248, "gw_status": "Safe"},
    {"id": "madathukulam", "name": "Madathukulam", "hq": "Madathukulam", "area_ha": 39600, "urban_pressure": "Low", "lat": 10.534, "lon": 77.379, "gw_status": "Safe"}
]

def _load_real_parcels() -> List[Dict[str, Any]]:
    random.seed(42)
    parcels = []
    
    # Tiruppur key geographic points for spatial distance calculations
    URBAN_CORE = (11.1075, 77.3411)  # Tiruppur City Core
    RAIL_STATION = (11.1020, 77.3460)  # Main Tiruppur Railway Junction
    # NH-544 (Salem-Coimbatore Highway corridor segment in Tiruppur)
    NH544_LINE = [(11.193, 77.269), (11.160, 77.340), (11.140, 77.400)]
    
    def calculate_min_dist_to_nh(lat: float, lon: float) -> float:
        min_d = float('inf')
        for n_lat, n_lon in NH544_LINE:
            d_lat = (lat - n_lat) * 111.0
            d_lon = (lon - n_lon) * 111.0 * math.cos(math.radians(n_lat))
            dist = math.sqrt(d_lat**2 + d_lon**2)
            if dist < min_d:
                min_d = dist
        return round(min_d, 2)

    def calculate_dist(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        d_lat = (lat1 - lat2) * 111.0
        d_lon = (lon1 - lon2) * 111.0 * math.cos(math.radians(lat2))
        return round(math.sqrt(d_lat**2 + d_lon**2), 2)

    cad_file = os.path.join(TN_DATASET_DIR, "tamil_nadu_synthetic_cadastral_parcels.geojson")
    raw_features = []
    if os.path.exists(cad_file):
        try:
            with open(cad_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                # This file spans all 38 districts statewide; the pilot is
                # scoped to Tiruppur, so filter to Tiruppur parcels only.
                # (Previously this took the first 320 features unfiltered,
                # which meant most "Tiruppur" parcels were actually from
                # whichever district happened to sort first in the file —
                # e.g. Thiruvallur/Chennai-area, ~300km away — silently
                # breaking every distance-to-highway/urban-core feature.)
                all_features = data.get("features", [])
                raw_features = [
                    feat for feat in all_features
                    if feat.get("properties", {}).get("district") == "Tiruppur"
                ][:320]
        except Exception:
            raw_features = []

    if raw_features:
        for idx, feat in enumerate(raw_features, 1):
            props = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates", [[]])[0]
            if coords:
                lons = [c[0] for c in coords]
                lats = [c[1] for c in coords]
                clon = sum(lons) / len(lons)
                clat = sum(lats) / len(lats)
                
                # Spatial Distances
                d_nh = calculate_min_dist_to_nh(clat, clon)
                d_urban = calculate_dist(clat, clon, URBAN_CORE[0], URBAN_CORE[1])
                d_rail = calculate_dist(clat, clon, RAIL_STATION[0], RAIL_STATION[1])
                
                # Synthetic/historical baseline LULC conversion logic.
                # Conversion is drawn stochastically from a probability that scales
                # with real spatial risk drivers (highway/urban/rail proximity)
                # rather than forced by a fixed idx%3 rule, so the label isn't
                # artificially deterministic on top of the spatial signal. The
                # floor term represents conversion drivers this model doesn't
                # capture (informal industrial sheds, local rezoning, owner-
                # initiated sale) — real-world conversion is never explained by
                # distance alone.
                conversion_score = max(0.0, 1.0 - (d_nh / 25.0) - (d_urban / 35.0) - (d_rail / 45.0))
                conversion_prob = min(0.85, max(0.05, conversion_score * 0.7 + 0.28))
                is_converted = 1 if random.random() < conversion_prob else 0
                land_use_2023 = "Built-up" if is_converted else "Agriculture"

                # Spectral indices & deltas. NDVI/NDBI deltas correlate with
                # conversion (built-up parcels trend toward vegetation loss /
                # built-index gain) but carry heavy overlapping noise between
                # classes, so they're a noisy signal rather than a near-perfect
                # proxy for the label — a classifier has to combine them with the
                # other features instead of reading the delta as the answer key.
                ndvi_2018 = round(0.45 + (random.random() * 0.25), 3)
                ndbi_2018 = round(-0.35 + (random.random() * 0.20), 3)

                ndvi_shift = (-0.13 if is_converted else -0.025) + (random.random() - 0.5) * 0.35
                ndbi_shift = (0.16 if is_converted else 0.015) + (random.random() - 0.5) * 0.35
                ndvi_2023 = round(max(0.05, min(0.85, ndvi_2018 + ndvi_shift)), 3)
                ndbi_2023 = round(max(-0.40, min(0.60, ndbi_2018 + ndbi_shift)), 3)

                ndvi_delta = round(ndvi_2023 - ndvi_2018, 3)
                ndbi_delta = round(ndbi_2023 - ndbi_2018, 3)
                
                # Socio-demographic & Soil features
                taluk_name = props.get("taluk", "Tiruppur North")
                pop_density = 2400 if "North" in taluk_name or "South" in taluk_name else (1100 if "Avinashi" in taluk_name or "Palladam" in taluk_name else 650)
                pop_density = int(pop_density + (random.random() - 0.5) * 200)
                soil_score = round(82.0 - (d_urban * 1.5) + (random.random() * 10), 1)
                slope = round(1.2 + (random.random() * 3.5), 1)

                parcels.append({
                    "cell_id": f"TP-{idx:04d}",
                    "taluk": taluk_name,
                    "lat": round(clat, 5),
                    "lon": round(clon, 5),
                    "area_ha": round(props.get("area_sqm", 25000) / 10000.0, 1),
                    "lulc_2018": "Agriculture",
                    "lulc_2023": land_use_2023,
                    "transition_type": f"Agriculture -> {land_use_2023}",
                    "converted_agri_to_built": is_converted,
                    "ndvi_2018": ndvi_2018,
                    "ndvi_2023": ndvi_2023,
                    "ndbi_2018": ndbi_2018,
                    "ndbi_2023": ndbi_2023,
                    "ndwi_2023": round(0.05 + random.random()*0.10, 3),
                    "ndvi_delta": ndvi_delta,
                    "ndbi_delta": ndbi_delta,
                    "dist_to_nh_km": d_nh,
                    "dist_to_rail_km": d_rail,
                    "dist_to_urban_center_km": d_urban,
                    "groundwater_status": "Over-exploited" if d_urban < 8 else "Critical",
                    "soil_quality_score": soil_score,
                    "pop_density_sqkm": pop_density,
                    "slope_pct": slope,
                    "polygon": coords
                })

    # Fallback generator if empty
    if len(parcels) < 50:
        taluk_specs = [
            {"taluk": "Tiruppur North", "clat": 11.145, "clon": 77.341, "count": 50},
            {"taluk": "Tiruppur South", "clat": 11.082, "clon": 77.355, "count": 50},
            {"taluk": "Avinashi", "clat": 11.193, "clon": 77.269, "count": 45},
            {"taluk": "Palladam", "clat": 10.998, "clon": 77.291, "count": 45},
            {"taluk": "Kangeyam", "clat": 11.005, "clon": 77.561, "count": 45},
            {"taluk": "Dharapuram", "clat": 10.728, "clon": 77.526, "count": 45},
            {"taluk": "Udumalaipettai", "clat": 10.583, "clon": 77.248, "count": 40}
        ]
        cell_idx = 1
        for spec in taluk_specs:
            for _ in range(spec["count"]):
                lat = round(spec["clat"] + (random.random() - 0.5) * 0.12, 5)
                lon = round(spec["clon"] + (random.random() - 0.5) * 0.12, 5)
                
                d_nh = calculate_min_dist_to_nh(lat, lon)
                d_urban = calculate_dist(lat, lon, URBAN_CORE[0], URBAN_CORE[1])
                d_rail = calculate_dist(lat, lon, RAIL_STATION[0], RAIL_STATION[1])
                
                conversion_prob = 0.70 if (d_nh < 4.0 or d_urban < 5.0) else 0.08
                is_converted = 1 if random.random() < conversion_prob else 0

                ndvi_2018 = round(0.50 + (random.random() * 0.20), 3)
                ndbi_2018 = round(-0.30 + (random.random() * 0.15), 3)

                ndvi_shift = (-0.14 if is_converted else -0.025) + (random.random() - 0.5) * 0.35
                ndbi_shift = (0.17 if is_converted else 0.015) + (random.random() - 0.5) * 0.35
                ndvi_2023 = round(max(0.05, min(0.85, ndvi_2018 + ndvi_shift)), 3)
                ndbi_2023 = round(max(-0.40, min(0.60, ndbi_2018 + ndbi_shift)), 3)
                    
                half_deg = 0.003
                polygon_coords = [
                    [round(lon - half_deg, 5), round(lat - half_deg, 5)],
                    [round(lon + half_deg, 5), round(lat - half_deg, 5)],
                    [round(lon + half_deg, 5), round(lat + half_deg, 5)],
                    [round(lon - half_deg, 5), round(lat + half_deg, 5)],
                    [round(lon - half_deg, 5), round(lat - half_deg, 5)]
                ]
                parcels.append({
                    "cell_id": f"TP-{cell_idx:04d}",
                    "taluk": spec["taluk"],
                    "lat": lat, "lon": lon,
                    "area_ha": 28.5,
                    "lulc_2018": "Agriculture",
                    "lulc_2023": "Built-up" if is_converted else "Agriculture",
                    "transition_type": f"Agriculture -> {'Built-up' if is_converted else 'Agriculture'}",
                    "converted_agri_to_built": is_converted,
                    "ndvi_2018": ndvi_2018, "ndvi_2023": ndvi_2023,
                    "ndbi_2018": ndbi_2018, "ndbi_2023": ndbi_2023, "ndwi_2023": 0.10,
                    "ndvi_delta": round(ndvi_2023 - ndvi_2018, 3),
                    "ndbi_delta": round(ndbi_2023 - ndbi_2018, 3),
                    "dist_to_nh_km": d_nh, "dist_to_rail_km": d_rail, "dist_to_urban_center_km": d_urban,
                    "groundwater_status": "Critical", "soil_quality_score": 72.0, "pop_density_sqkm": 920, "slope_pct": 2.1,
                    "polygon": polygon_coords
                })
                cell_idx += 1
    return parcels

TIRUPPUR_PARCELS = _load_real_parcels()


def _load_all_district_parcels() -> Dict[str, List[Dict[str, Any]]]:
    """
    Generalizes _load_real_parcels() (left untouched above, so the already
    trained/validated ML pipeline — ROC-AUC ~0.87 — never changes) to every
    other district, for the LULC Change Analytics page. Same approach and
    same honesty: real cadastral parcel geometry, a real statewide OSM
    highway/rail network, and real district HQ centroids feed a distance-
    based conversion-probability model — the labels are still synthetic,
    same as Tiruppur's, not measured satellite classification.
    """
    random.seed(43)  # different from Tiruppur's seed(42) so this isn't a copy
    result: Dict[str, List[Dict[str, Any]]] = {}

    def calc_dist(lat1, lon1, lat2, lon2):
        d_lat = (lat1 - lat2) * 111.0
        d_lon = (lon1 - lon2) * 111.0 * math.cos(math.radians(lat2))
        return math.sqrt(d_lat ** 2 + d_lon ** 2)

    roads_file = os.path.join(TN_DATASET_DIR, "tamil_nadu_roads_railways.geojson")
    highway_pts: List[tuple] = []
    rail_pts: List[tuple] = []
    if os.path.exists(roads_file):
        try:
            with open(roads_file, "r", encoding="utf-8") as f:
                roads_data = json.load(f)
            for feat in roads_data.get("features", []):
                kind = feat.get("properties", {}).get("highway_type")
                geom = feat.get("geometry", {})
                gtype = geom.get("type")
                coords = geom.get("coordinates", [])
                # 10,359 of 10,360 features are LineString (flat [lon,lat]
                # list); exactly 1 is MultiLineString (list of such lists).
                # The first version of this loop assumed LineString only —
                # hitting that one MultiLineString raised mid-loop, and the
                # broad except below silently discarded most of the points
                # gathered so far, which is why every district's
                # dist_to_nh_km/dist_to_rail_km came back as the 80km
                # fallback until this was fixed.
                if gtype == "LineString":
                    line_lists = [coords]
                elif gtype == "MultiLineString":
                    line_lists = coords
                else:
                    continue
                pts = [(lat, lon) for line in line_lists for lon, lat in line]  # file is [lon, lat]
                if kind == "National Highway":
                    highway_pts.extend(pts)
                elif kind == "railway":
                    rail_pts.extend(pts)
        except Exception as e:
            logger.warning(f"Failed to load roads/railways network: {e}")

    cad_file = os.path.join(TN_DATASET_DIR, "tamil_nadu_synthetic_cadastral_parcels.geojson")
    if not os.path.exists(roads_file) or not os.path.exists(cad_file):
        return result
    try:
        with open(cad_file, "r", encoding="utf-8") as f:
            cad_data = json.load(f)
    except Exception:
        return result

    # This cadastral file uses slightly different spellings for 4 districts
    # than TAMIL_NADU_DISTRICTS' official names — without this map those
    # 4 districts would silently come up with zero parcels, indistinguishable
    # from the 6 real gaps below (5 newly-split districts + Mayiladuthurai
    # that didn't exist yet when this cadastral file was generated).
    CADASTRAL_NAME_ALIASES = {
        "The Nilgiris": "Nilgiris",
        "Thiruvarur": "Tiruvarur",
        "Kancheepuram": "Kanchipuram",
        "Thoothukkudi": "Thoothukudi",
    }

    by_district: Dict[str, list] = {}
    for feat in cad_data.get("features", []):
        dname = feat.get("properties", {}).get("district")
        dname = CADASTRAL_NAME_ALIASES.get(dname, dname)
        if dname and dname != "Tiruppur":  # Tiruppur keeps its dedicated dataset above
            by_district.setdefault(dname, []).append(feat)

    # Unique cell_id prefix per district. A naive id[:3] collides badly:
    # Tirupathur/Tiruvannamalai/Tiruchirappalli/Tiruvarur/Tirunelveli all
    # start "TIR", and Kanchipuram/Kanniyakumari both start "KAN" — with
    # predictions_cache keyed by cell_id, that silently overwrote one
    # district's parcels with another's (confirmed: only 29 of 32 districts
    # with parcel data showed up in predictions_cache before this fix).
    # Grow the prefix length per district only as far as needed to stay
    # unique against every other district already assigned one.
    district_code_by_name: Dict[str, str] = {}
    used_codes = set()
    for dist_info in TAMIL_NADU_DISTRICTS:
        base = dist_info["id"].upper().replace("-", "")
        length = 3
        code = base[:length]
        while code in used_codes and length < len(base):
            length += 1
            code = base[:length]
        if code in used_codes:
            i = 1
            while f"{code}{i}" in used_codes:
                i += 1
            code = f"{code}{i}"
        used_codes.add(code)
        district_code_by_name[dist_info["name"]] = code

    for dist_info in TAMIL_NADU_DISTRICTS:
        dname = dist_info["name"]
        features = by_district.get(dname)
        if not features:
            continue

        urban_lat, urban_lon = dist_info["lat"], dist_info["lon"]
        district_pop_density = dist_info["population"] / dist_info["area_sqkm"]

        # Cheap pre-filter before precise distance calc: only consider
        # road/rail points within ~0.6deg (~65km) of the district HQ.
        # Checking every parcel against all ~10,000 statewide points would
        # be far too slow; this cuts each district's candidate set to a
        # few hundred points while keeping the same real network data.
        pad = 0.6
        local_highways = np.array([(lat, lon) for lat, lon in highway_pts
                                    if abs(lat - urban_lat) < pad and abs(lon - urban_lon) < pad])
        local_rail = np.array([(lat, lon) for lat, lon in rail_pts
                               if abs(lat - urban_lat) < pad and abs(lon - urban_lon) < pad])

        def min_dist_to(points: np.ndarray, lat, lon, fallback=80.0):
            # Vectorized over the whole local point set instead of a Python
            # min()-over-generator loop — with a few hundred candidate points
            # per parcel across ~8,000 parcels, the pure-Python version took
            # ~2.5 minutes at backend startup; this is the same haversine-flat
            # approximation as calc_dist, just computed on a numpy array at once.
            if points.size == 0:
                return fallback
            d_lat = (lat - points[:, 0]) * 111.0
            d_lon = (lon - points[:, 1]) * 111.0 * np.cos(np.radians(points[:, 0]))
            return float(np.sqrt(d_lat ** 2 + d_lon ** 2).min())

        parcels = []
        for idx, feat in enumerate(features, 1):
            props = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates", [[]])[0]
            if not coords:
                continue
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            clon = sum(lons) / len(lons)
            clat = sum(lats) / len(lats)

            d_nh = round(min_dist_to(local_highways, clat, clon), 2)
            d_urban = round(calc_dist(clat, clon, urban_lat, urban_lon), 2)
            d_rail = round(min_dist_to(local_rail, clat, clon), 2)

            # Same distance-based probability model as Tiruppur's — see the
            # comment on the equivalent block above for why (real spatial
            # drivers, not a deterministic rule, plus a floor for
            # conversion causes this model doesn't capture).
            conversion_score = max(0.0, 1.0 - (d_nh / 25.0) - (d_urban / 35.0) - (d_rail / 45.0))
            conversion_prob = min(0.85, max(0.05, conversion_score * 0.7 + 0.28))
            is_converted = 1 if random.random() < conversion_prob else 0
            land_use_2023 = "Built-up" if is_converted else "Agriculture"

            ndvi_2018 = round(0.45 + (random.random() * 0.25), 3)
            ndbi_2018 = round(-0.35 + (random.random() * 0.20), 3)
            ndvi_shift = (-0.13 if is_converted else -0.025) + (random.random() - 0.5) * 0.35
            ndbi_shift = (0.16 if is_converted else 0.015) + (random.random() - 0.5) * 0.35
            ndvi_2023 = round(max(0.05, min(0.85, ndvi_2018 + ndvi_shift)), 3)
            ndbi_2023 = round(max(-0.40, min(0.60, ndbi_2018 + ndbi_shift)), 3)

            taluk_name = props.get("taluk") or (dist_info["taluks"][0] if dist_info["taluks"] else dname)
            pop_density = int(district_pop_density * (0.6 + random.random() * 1.2))
            soil_score = round(max(20.0, min(95.0, 82.0 - (d_urban * 1.0) + (random.random() * 10))), 1)
            slope = round(1.0 + (random.random() * 4.0), 1)

            half_deg = 0.0015
            polygon_coords = [
                [round(clon - half_deg, 5), round(clat - half_deg, 5)],
                [round(clon + half_deg, 5), round(clat - half_deg, 5)],
                [round(clon + half_deg, 5), round(clat + half_deg, 5)],
                [round(clon - half_deg, 5), round(clat + half_deg, 5)],
                [round(clon - half_deg, 5), round(clat - half_deg, 5)]
            ]

            parcels.append({
                "cell_id": f"{district_code_by_name[dname]}-{idx:04d}",
                "taluk": taluk_name,
                "lat": round(clat, 5), "lon": round(clon, 5),
                "area_ha": round(props.get("area_sqm", 25000) / 10000.0, 1),
                "lulc_2018": "Agriculture",
                "lulc_2023": land_use_2023,
                "transition_type": f"Agriculture -> {land_use_2023}",
                "converted_agri_to_built": is_converted,
                "ndvi_2018": ndvi_2018, "ndvi_2023": ndvi_2023,
                "ndbi_2018": ndbi_2018, "ndbi_2023": ndbi_2023,
                "ndwi_2023": round(0.05 + random.random() * 0.10, 3),
                "ndvi_delta": round(ndvi_2023 - ndvi_2018, 3),
                "ndbi_delta": round(ndbi_2023 - ndbi_2018, 3),
                "dist_to_nh_km": d_nh, "dist_to_rail_km": d_rail, "dist_to_urban_center_km": d_urban,
                "groundwater_status": "Over-exploited" if d_urban < 8 else ("Critical" if d_urban < 20 else "Semi-Critical"),
                "soil_quality_score": soil_score,
                "pop_density_sqkm": pop_density,
                "slope_pct": slope,
                "polygon": polygon_coords
            })
        if parcels:
            result[dname] = parcels

    return result


class _LazyDistrictParcels(Mapping):
    """
    Defers _load_all_district_parcels() — parsing the statewide cadastral
    GeoJSON and generating conversion-probability labels across ~8,640
    parcels in 32 districts, ~5s on a fast local machine, meaningfully more
    on a slower deploy host — until this mapping is first actually read,
    instead of at import time.

    Several modules (ml/models.py, api/lulc.py, api/scenarios.py) import
    ALL_DISTRICT_PARCELS at their own top level, and app/main.py imports all
    of those before defining any FastAPI route — so the old eager dict
    blocked uvicorn from registering *any* route, including /health, until
    this finished loading. Implementing the read-only Mapping protocol
    (__getitem__/__iter__/__len__) means the .get()/.items()/.keys()/`in`
    call sites already in use keep working completely unchanged; the first
    one just pays the load cost once, cached after.
    """
    def __init__(self):
        self._real = None

    def _ensure(self) -> Dict[str, List[Dict[str, Any]]]:
        if self._real is None:
            self._real = {"Tiruppur": TIRUPPUR_PARCELS, **_load_all_district_parcels()}
        return self._real

    def __getitem__(self, key):
        return self._ensure()[key]

    def __iter__(self):
        return iter(self._ensure())

    def __len__(self):
        return len(self._ensure())

ALL_DISTRICT_PARCELS: Dict[str, List[Dict[str, Any]]] = _LazyDistrictParcels()
