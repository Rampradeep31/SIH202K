"""
Tamil Nadu Geographic & Pilot Data Module
Contains:
1. All 38 Districts of Tamil Nadu with centroids, taluks/areas, and boundaries
2. Detailed Tiruppur District granular taluk structures
3. 320 Spatial analysis grid parcels across Tiruppur district for ML, GIS, and Scenario modeling
4. Statutory and Environmental base values (CGWB, Census, TNCDBR)
"""

import json
import math
import random
from typing import Dict, List, Any

# All 38 Districts of Tamil Nadu with Centroids, Taluks, and approximate boundary polygons
TAMIL_NADU_DISTRICTS = [
    {
        "id": "tiruppur", "name": "Tiruppur", "region": "Western", "hq": "Tiruppur", "area_sqkm": 5187, "population": 2479052, "urban_pct": 61.4, "pilot_focus": True,
        "lat": 11.1075, "lon": 77.3411,
        "description": "Global knitwear & textile hub; acute agricultural-industrial transition along NH-544 and Noyyal basin",
        "taluks": ["Tiruppur North", "Tiruppur South", "Avinashi", "Palladam", "Kangeyam", "Dharapuram", "Udumalaipettai", "Madathukulam"]
    },
    {
        "id": "coimbatore", "name": "Coimbatore", "region": "Western", "hq": "Coimbatore", "area_sqkm": 4723, "population": 3458045, "urban_pct": 75.7, "pilot_focus": False,
        "lat": 11.0168, "lon": 76.9558,
        "description": "Major manufacturing, precision engineering, textile machinery and IT hub",
        "taluks": ["Coimbatore North", "Coimbatore South", "Sulur", "Pollachi", "Mettupalayam", "Annur", "Kinathukadavu", "Valparai"]
    },
    {
        "id": "erode", "name": "Erode", "region": "Western", "hq": "Erode", "area_sqkm": 5722, "population": 2251744, "urban_pct": 51.4, "pilot_focus": False,
        "lat": 11.3410, "lon": 77.7172,
        "description": "Turmeric hub, textile processing, and agrarian belts along the Bhavani river",
        "taluks": ["Erode", "Perundurai", "Bhavani", "Gobichettipalayam", "Sathyamangalam", "Anthiyur", "Modakkurichi", "Kodumudi"]
    },
    {
        "id": "salem", "name": "Salem", "region": "Western", "hq": "Salem", "area_sqkm": 5245, "population": 3482056, "urban_pct": 50.9, "pilot_focus": False,
        "lat": 11.6643, "lon": 78.1460,
        "description": "Steel, sago, textile spinning, and mineral-rich industrial nexus",
        "taluks": ["Salem", "Salem South", "Salem West", "Attur", "Mettur", "Omalur", "Edappadi", "Sankari", "Yercaud"]
    },
    {
        "id": "chennai", "name": "Chennai", "region": "Northern", "hq": "Chennai", "area_sqkm": 426, "population": 7088000, "urban_pct": 100.0, "pilot_focus": False,
        "lat": 13.0827, "lon": 80.2707,
        "description": "State capital, automotive capital, seaport logistics, and IT hub",
        "taluks": ["Egmore", "Guindy", "Mylapore", "Tondiarpet", "Velachery", "Alandur", "Aminjikarai", "Sholinganallur"]
    },
    {
        "id": "kanchipuram", "name": "Kanchipuram", "region": "Northern", "hq": "Kanchipuram", "area_sqkm": 1655, "population": 1166401, "urban_pct": 63.5, "pilot_focus": False,
        "lat": 12.8342, "lon": 79.7036,
        "description": "Silk heritage, temple city, and electronics SIPCOT corridor (Sriperumbudur)",
        "taluks": ["Kanchipuram", "Sriperumbudur", "Kundrathur", "Uthiramerur", "Walajabad"]
    },
    {
        "id": "chengalpattu", "name": "Chengalpattu", "region": "Northern", "hq": "Chengalpattu", "area_sqkm": 2944, "population": 2556244, "urban_pct": 68.2, "pilot_focus": False,
        "lat": 12.6841, "lon": 79.9836,
        "description": "Automotive cluster, aerospace park, pharma SEZ, and residential expansion",
        "taluks": ["Chengalpattu", "Tambaram", "Pallavaram", "Vandalur", "Madurantakam", "Cheyyur", "Tiruporur"]
    },
    {
        "id": "thiruvallur", "name": "Thiruvallur", "region": "Northern", "hq": "Thiruvallur", "area_sqkm": 3422, "population": 3728104, "urban_pct": 65.1, "pilot_focus": False,
        "lat": 13.1432, "lon": 79.9083,
        "description": "Kattupalli / Ennore port corridors, heavy industrial belts, and peri-urban growth",
        "taluks": ["Thiruvallur", "Poonamallee", "Avadi", "Ambattur", "Gummidipoondi", "Ponneri", "Tiruttani", "Uthukkottai"]
    },
    {
        "id": "vellore", "name": "Vellore", "region": "Northern", "hq": "Vellore", "area_sqkm": 1791, "population": 1614242, "urban_pct": 43.3, "pilot_focus": False,
        "lat": 12.9165, "lon": 79.1325,
        "description": "Leather manufacturing, healthcare nexus, and Palar river basin",
        "taluks": ["Vellore", "Katpadi", "Gudiyatham", "Anaicut", "Pernambut", "K.V. Kuppam"]
    },
    {
        "id": "ranipet", "name": "Ranipet", "region": "Northern", "hq": "Ranipet", "area_sqkm": 2234, "population": 1210277, "urban_pct": 48.0, "pilot_focus": False,
        "lat": 12.9272, "lon": 79.3330,
        "description": "Industrial SIPCOT corridor, leather processing, and boiler fabrication",
        "taluks": ["Ranipet", "Walajah", "Arcot", "Arakkonam", "Nemili", "Kalavai", "Sholinghur"]
    },
    {
        "id": "tirupathur", "name": "Tirupathur", "region": "Northern", "hq": "Tirupathur", "area_sqkm": 1797, "population": 1111812, "urban_pct": 34.0, "pilot_focus": False,
        "lat": 12.4925, "lon": 78.5678,
        "description": "Agrarian, footwear hub, Yelagiri hills, and dryland farming",
        "taluks": ["Tirupathur", "Vaniyambadi", "Ambur", "Natrampalli"]
    },
    {
        "id": "viluppuram", "name": "Viluppuram", "region": "Northern", "hq": "Viluppuram", "area_sqkm": 3725, "population": 2032890, "urban_pct": 15.0, "pilot_focus": False,
        "lat": 11.9401, "lon": 79.4861,
        "description": "Agrarian heartland, sugarcane, oilseeds, and paddy cultivation",
        "taluks": ["Viluppuram", "Tindivanam", "Gingee", "Vanur", "Marakkanam", "Vikravandi", "Kandachipuram", "Thiruvennainallur"]
    },
    {
        "id": "kallakurichi", "name": "Kallakurichi", "region": "Northern", "hq": "Kallakurichi", "area_sqkm": 3520, "population": 1370281, "urban_pct": 14.5, "pilot_focus": False,
        "lat": 11.7384, "lon": 78.9639,
        "description": "Agricultural base with extensive dryland and irrigated paddy",
        "taluks": ["Kallakurichi", "Sankarapuram", "Chinnasalem", "Ulundurpet", "Tirukoilur", "Kalvarayan Hills"]
    },
    {
        "id": "cuddalore", "name": "Cuddalore", "region": "Northern", "hq": "Cuddalore", "area_sqkm": 3678, "population": 2605914, "urban_pct": 33.9, "pilot_focus": False,
        "lat": 11.7480, "lon": 79.7714,
        "description": "Coastal aquaculture, Neyveli lignite mining, and chemical SIPCOT",
        "taluks": ["Cuddalore", "Panruti", "Chidambaram", "Vridhachalam", "Kattumannarkoil", "Tittakudi", "Kurinjipadi", "Veppur", "Srimushnam"]
    },
    {
        "id": "tiruvannamalai", "name": "Tiruvannamalai", "region": "Northern", "hq": "Tiruvannamalai", "area_sqkm": 6191, "population": 2464875, "urban_pct": 20.1, "pilot_focus": False,
        "lat": 12.2253, "lon": 79.0747,
        "description": "Heritage centre, silk weaving, and rainfed agrarian belts",
        "taluks": ["Tiruvannamalai", "Arani", "Cheyyar", "Chengam", "Polur", "Vandavasi", "Kalawasal", "Jamunamarathur", "Kilpennathur", "Chetpet", "Vembakkam"]
    },
    {
        "id": "dharmapuri", "name": "Dharmapuri", "region": "Western", "hq": "Dharmapuri", "area_sqkm": 4497, "population": 1506843, "urban_pct": 17.3, "pilot_focus": False,
        "lat": 12.1211, "lon": 78.1582,
        "description": "Horticulture, mango belt, sericulture, and dryland farming",
        "taluks": ["Dharmapuri", "Palacode", "Pennagaram", "Harur", "Pappireddipatti", "Karimangalam", "Nallampalli"]
    },
    {
        "id": "krishnagiri", "name": "Krishnagiri", "region": "Western", "hq": "Krishnagiri", "area_sqkm": 5143, "population": 1879809, "urban_pct": 22.8, "pilot_focus": False,
        "lat": 12.5186, "lon": 78.2137,
        "description": "Hosur auto-EV manufacturing corridor and horticulture",
        "taluks": ["Krishnagiri", "Hosur", "Pochampalli", "Uthangarai", "Denkanikottai", "Bargur", "Shoolagiri", "Anchetty"]
    },
    {
        "id": "namakkal", "name": "Namakkal", "region": "Western", "hq": "Namakkal", "area_sqkm": 3368, "population": 1726601, "urban_pct": 40.3, "pilot_focus": False,
        "lat": 11.2189, "lon": 78.1674,
        "description": "Poultry capital of India, transport logistics, and borewell industry",
        "taluks": ["Namakkal", "Rasipuram", "Tiruchengode", "Paramathi Velur", "Kolli Hills", "Sendamangalam", "Mohanur", "Kumarapalayam"]
    },
    {
        "id": "dindigul", "name": "Dindigul", "region": "Central", "hq": "Dindigul", "area_sqkm": 6266, "population": 2159775, "urban_pct": 37.4, "pilot_focus": False,
        "lat": 10.3673, "lon": 77.9803,
        "description": "Lock manufacturing, spinning mills, and Kodaikanal hill ecology",
        "taluks": ["Dindigul East", "Dindigul West", "Palani", "Oddanchatram", "Kodaikanal", "Natham", "Nilakottai", "Athoor", "Vedasandur", "Gujiliamparai"]
    },
    {
        "id": "karur", "name": "Karur", "region": "Central", "hq": "Karur", "area_sqkm": 2895, "population": 1064493, "urban_pct": 40.8, "pilot_focus": False,
        "lat": 10.9601, "lon": 78.0766,
        "description": "Home textiles exports, TNPL paper mills, and bus bodybuilding",
        "taluks": ["Karur", "Aravakurichi", "Kulithalai", "Krishnarayapuram", "Kadavur", "Manmangalam", "Pugalur"]
    },
    {
        "id": "tiruchirappalli", "name": "Tiruchirappalli", "region": "Central", "hq": "Tiruchirappalli", "area_sqkm": 4403, "population": 2722290, "urban_pct": 49.2, "pilot_focus": False,
        "lat": 10.7905, "lon": 78.7047,
        "description": "BHEL heavy engineering, railway hub, and educational nexus",
        "taluks": ["Tiruchirappalli West", "Tiruchirappalli East", "Srirangam", "Lalgudi", "Manachanallur", "Musiri", "Thottiyam", "Thuraiyur", "Manapparai", "Marungapuri"]
    },
    {
        "id": "perambalur", "name": "Perambalur", "region": "Central", "hq": "Perambalur", "area_sqkm": 1756, "population": 565223, "urban_pct": 17.2, "pilot_focus": False,
        "lat": 11.2342, "lon": 78.8820,
        "description": "Maize, cotton agrarian belt, and MRF tyre industrial corridor",
        "taluks": ["Perambalur", "Kunnam", "Veppanthattai", "Alathur"]
    },
    {
        "id": "ariyalur", "name": "Ariyalur", "region": "Central", "hq": "Ariyalur", "area_sqkm": 1949, "population": 754894, "urban_pct": 11.1, "pilot_focus": False,
        "lat": 11.1401, "lon": 79.0786,
        "description": "Major cement manufacturing clusters and limestone reserves",
        "taluks": ["Ariyalur", "Udayarpalayam", "Sendurai", "Andimadam"]
    },
    {
        "id": "thanjavur", "name": "Thanjavur", "region": "Delta", "hq": "Thanjavur", "area_sqkm": 3396, "population": 2405890, "urban_pct": 35.4, "pilot_focus": False,
        "lat": 10.7870, "lon": 79.1378,
        "description": "Rice bowl of Tamil Nadu, Cauvery delta perennial agriculture",
        "taluks": ["Thanjavur", "Kumbakonam", "Papanasam", "Pattukkottai", "Orathanadu", "Thiruvaiyaru", "Peravurani", "Budalur", "Thiruvidaimarudur"]
    },
    {
        "id": "tiruvarur", "name": "Tiruvarur", "region": "Delta", "hq": "Tiruvarur", "area_sqkm": 2097, "population": 1264277, "urban_pct": 20.4, "pilot_focus": False,
        "lat": 10.7725, "lon": 79.6365,
        "description": "Delta wetlands, traditional paddy, and agrarian tank systems",
        "taluks": ["Tiruvarur", "Mannargudi", "Thiruthuraipoondi", "Nannilam", "Kudavasal", "Valangaiman", "Needamangalam", "Koothanallur"]
    },
    {
        "id": "nagapattinam", "name": "Nagapattinam", "region": "Delta", "hq": "Nagapattinam", "area_sqkm": 1397, "population": 697069, "urban_pct": 22.6, "pilot_focus": False,
        "lat": 10.7672, "lon": 79.8449,
        "description": "Coastal fisheries, delta agriculture, and port infrastructure",
        "taluks": ["Nagapattinam", "Kilvelur", "Vedaranyam", "Thirukkuvalai"]
    },
    {
        "id": "mayiladuthurai", "name": "Mayiladuthurai", "region": "Delta", "hq": "Mayiladuthurai", "area_sqkm": 1172, "population": 918356, "urban_pct": 21.0, "pilot_focus": False,
        "lat": 11.1075, "lon": 79.6524,
        "description": "Cauvery delta mouth ecology, temple agriculture, and marine fishing",
        "taluks": ["Mayiladuthurai", "Sirkazhi", "Tharangambadi", "Kuthalam"]
    },
    {
        "id": "pudukkottai", "name": "Pudukkottai", "region": "Central", "hq": "Pudukkottai", "area_sqkm": 4663, "population": 1618345, "urban_pct": 19.5, "pilot_focus": False,
        "lat": 10.3797, "lon": 78.8208,
        "description": "Traditional tank cascades, agro-forestry, and dryland farming",
        "taluks": ["Pudukkottai", "Alangudi", "Aranthangi", "Gandarvakottai", "Illuppur", "Karambakkudi", "Kulathur", "Manamelkudi", "Ponnamaravathi", "Thirumayam", "Avudiyarkoil"]
    },
    {
        "id": "madurai", "name": "Madurai", "region": "Southern", "hq": "Madurai", "area_sqkm": 3741, "population": 3038252, "urban_pct": 60.8, "pilot_focus": False,
        "lat": 9.9252, "lon": 78.1198,
        "description": "Cultural capital, commercial hub, and Vaigai river basin",
        "taluks": ["Madurai North", "Madurai South", "Madurai East", "Madurai West", "Melur", "Thirumangalam", "Usilampatti", "Vadipatti", "Peraiyur", "Tiruparankundram"]
    },
    {
        "id": "theni", "name": "Theni", "region": "Southern", "hq": "Theni", "area_sqkm": 2889, "population": 1245899, "urban_pct": 53.8, "pilot_focus": False,
        "lat": 10.0104, "lon": 77.4768,
        "description": "Western Ghats foothills, banana/cardamom cash crops, and horticulture",
        "taluks": ["Theni", "Periyakulam", "Bodinayakanur", "Uthamapalayam", "Andipatti"]
    },
    {
        "id": "virudhunagar", "name": "Virudhunagar", "region": "Southern", "hq": "Virudhunagar", "area_sqkm": 4241, "population": 1942288, "urban_pct": 50.5, "pilot_focus": False,
        "lat": 9.5680, "lon": 77.9624,
        "description": "Sivakasi printing/fireworks clusters, cotton ginning, and agro-trade",
        "taluks": ["Virudhunagar", "Sivakasi", "Rajapalayam", "Srivilliputhur", "Aruppukkottai", "Sattur", "Kariapatti", "Tiruchuli", "Vembakottai", "Watrap"]
    },
    {
        "id": "sivaganga", "name": "Sivaganga", "region": "Southern", "hq": "Sivaganga", "area_sqkm": 4189, "population": 1339101, "urban_pct": 30.8, "pilot_focus": False,
        "lat": 9.8433, "lon": 78.4809,
        "description": "Chettinad region, dryland agriculture, and traditional tank networks",
        "taluks": ["Sivaganga", "Karaikudi", "Devakottai", "Manamadurai", "Ilayangudi", "Tirupathur", "Kalaiyarkovil", "Singampunari"]
    },
    {
        "id": "ramanathapuram", "name": "Ramanathapuram", "region": "Southern", "hq": "Ramanathapuram", "area_sqkm": 4104, "population": 1353445, "urban_pct": 30.3, "pilot_focus": False,
        "lat": 9.3639, "lon": 78.8395,
        "description": "Dry coastal ecosystem, chilli cultivation, and Gulf of Mannar biosphere",
        "taluks": ["Ramanathapuram", "Paramakudi", "Rameswaram", "Tiruvadanai", "Mudukulathur", "Kamuthi", "Kadaladi", "Rajasingamangalam", "Kilakarai"]
    },
    {
        "id": "thoothukudi", "name": "Thoothukudi", "region": "Southern", "hq": "Thoothukudi", "area_sqkm": 4707, "population": 1750176, "urban_pct": 50.1, "pilot_focus": False,
        "lat": 8.7642, "lon": 78.1348,
        "description": "Major international seaport, thermal power, and petrochemical SIPCOT",
        "taluks": ["Thoothukudi", "Kovilpatti", "Tiruchendur", "Srivaikuntam", "Ottapidaram", "Ettayapuram", "Vilathikulam", "Sathankulam", "Kayathar", "Eral"]
    },
    {
        "id": "tirunelveli", "name": "Tirunelveli", "region": "Southern", "hq": "Tirunelveli", "area_sqkm": 3842, "population": 1665253, "urban_pct": 49.9, "pilot_focus": False,
        "lat": 8.7139, "lon": 77.7567,
        "description": "Tamirabarani river perennial irrigation, wind energy corridor",
        "taluks": ["Tirunelveli", "Palayamkottai", "Ambasamudram", "Nanguneri", "Radhapuram", "Cheranmahadevi", "Manur", "Tisayanvilai"]
    },
    {
        "id": "tenkasi", "name": "Tenkasi", "region": "Southern", "hq": "Tenkasi", "area_sqkm": 2916, "population": 1407627, "urban_pct": 43.1, "pilot_focus": False,
        "lat": 8.9594, "lon": 77.3161,
        "description": "Western Ghats waterfalls, spice plantations, and fertile paddy belt",
        "taluks": ["Tenkasi", "Sankarankovil", "Kadayanallur", "Sivagiri", "Alangulam", "Shenkottai", "Thiruvengadam", "Veerakeralamputhur"]
    },
    {
        "id": "kanniyakumari", "name": "Kanniyakumari", "region": "Southern", "hq": "Nagercoil", "area_sqkm": 1672, "population": 1870374, "urban_pct": 82.3, "pilot_focus": False,
        "lat": 8.0883, "lon": 77.5385,
        "description": "Southernmost tip, rubber plantations, high population density, and wetlands",
        "taluks": ["Agasteeswaram", "Thovalai", "Kalkulam", "Vilavancode", "Thiruvattar", "Killiyoor"]
    },
    {
        "id": "nilgiris", "name": "Nilgiris", "region": "Western", "hq": "Udhagamandalam", "area_sqkm": 2549, "population": 735394, "urban_pct": 59.2, "pilot_focus": False,
        "lat": 11.4102, "lon": 76.6950,
        "description": "High-altitude shola-grassland ecosystem, tea plantations, and biosphere reserve",
        "taluks": ["Udhagamandalam", "Coonoor", "Kotagiri", "Gudalur", "Pandalur", "Kundah"]
    }
]

# Tiruppur Taluks
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

# Generate synthetic spatial grid cells covering Tiruppur District (Centred around 10.5 to 11.3 N, 77.1 to 77.7 E)
def _generate_tiruppur_parcels() -> List[Dict[str, Any]]:
    random.seed(42)  # Deterministic seed for reproducible evaluation & demo
    parcels = []
    
    taluk_specs = [
        {"taluk": "Tiruppur North", "clat": 11.145, "clon": 77.341, "count": 50, "bias_built": 0.45, "dist_nh": 2.5},
        {"taluk": "Tiruppur South", "clat": 11.082, "clon": 77.355, "count": 50, "bias_built": 0.50, "dist_nh": 4.0},
        {"taluk": "Avinashi", "clat": 11.193, "clon": 77.269, "count": 45, "bias_built": 0.35, "dist_nh": 1.2},
        {"taluk": "Palladam", "clat": 10.998, "clon": 77.291, "count": 45, "bias_built": 0.30, "dist_nh": 6.5},
        {"taluk": "Kangeyam", "clat": 11.005, "clon": 77.561, "count": 45, "bias_built": 0.15, "dist_nh": 14.0},
        {"taluk": "Dharapuram", "clat": 10.728, "clon": 77.526, "count": 45, "bias_built": 0.10, "dist_nh": 28.0},
        {"taluk": "Udumalaipettai", "clat": 10.583, "clon": 77.248, "count": 40, "bias_built": 0.12, "dist_nh": 36.0}
    ]
    
    cell_idx = 1
    for spec in taluk_specs:
        tname = spec["taluk"]
        clat = spec["clat"]
        clon = spec["clon"]
        count = spec["count"]
        
        for i in range(count):
            dlat = (random.random() - 0.5) * 0.12
            dlon = (random.random() - 0.5) * 0.12
            lat = round(clat + dlat, 5)
            lon = round(clon + dlon, 5)
            
            nh_dist = max(0.2, round(spec["dist_nh"] + abs(dlat * 111) * 0.7 + (random.random() * 2 - 1), 2))
            rail_dist = max(0.3, round(abs(lat - 11.10) * 110 + abs(lon - 77.34) * 80 + random.random() * 2, 2))
            urban_dist = max(0.5, round(math.sqrt((lat - 11.107)**2 + (lon - 77.341)**2) * 111, 2))
            
            is_near_core = urban_dist < 4.5 or nh_dist < 2.0
            
            if is_near_core and random.random() < 0.35:
                lulc_2018 = "Built-up"
            elif random.random() < 0.08:
                lulc_2018 = "Waterbody"
            elif random.random() < 0.10:
                lulc_2018 = "Barren/Scrub"
            else:
                lulc_2018 = "Agriculture"
                
            if lulc_2018 == "Agriculture":
                ndvi_2018 = round(0.52 + random.random() * 0.28, 3)
                ndbi_2018 = round(-0.25 + random.random() * 0.15, 3)
                ndwi_2018 = round(0.12 + random.random() * 0.20, 3)
            elif lulc_2018 == "Built-up":
                ndvi_2018 = round(0.15 + random.random() * 0.12, 3)
                ndbi_2018 = round(0.22 + random.random() * 0.25, 3)
                ndwi_2018 = round(-0.30 + random.random() * 0.15, 3)
            elif lulc_2018 == "Waterbody":
                ndvi_2018 = round(0.05 + random.random() * 0.10, 3)
                ndbi_2018 = round(-0.45 + random.random() * 0.10, 3)
                ndwi_2018 = round(0.65 + random.random() * 0.25, 3)
            else:
                ndvi_2018 = round(0.20 + random.random() * 0.15, 3)
                ndbi_2018 = round(0.05 + random.random() * 0.15, 3)
                ndwi_2018 = round(-0.15 + random.random() * 0.10, 3)

            converted_to_built = False
            if lulc_2018 == "Agriculture":
                conversion_score = (
                    (1.0 / (nh_dist + 1.0)) * 0.40 +
                    (1.0 / (urban_dist + 2.0)) * 0.35 +
                    (0.3 if tname in ["Tiruppur North", "Tiruppur South", "Avinashi", "Palladam"] else 0.05)
                )
                if conversion_score + (random.random() * 0.3 - 0.15) > 0.48:
                    converted_to_built = True
                    lulc_2023 = "Built-up"
                else:
                    lulc_2023 = "Agriculture"
            elif lulc_2018 == "Built-up":
                lulc_2023 = "Built-up"
            elif lulc_2018 == "Waterbody":
                lulc_2023 = "Waterbody" if random.random() > 0.12 else "Barren/Scrub"
            else:
                lulc_2023 = "Built-up" if (is_near_core and random.random() < 0.4) else "Barren/Scrub"
                
            if lulc_2023 == "Built-up":
                ndvi_2023 = round(0.14 + random.random() * 0.10, 3)
                ndbi_2023 = round(0.25 + random.random() * 0.22, 3)
                ndwi_2023 = round(-0.28 + random.random() * 0.12, 3)
            elif lulc_2023 == "Agriculture":
                ndvi_2023 = round(0.48 + random.random() * 0.25, 3)
                ndbi_2023 = round(-0.22 + random.random() * 0.14, 3)
                ndwi_2023 = round(0.08 + random.random() * 0.18, 3)
            elif lulc_2023 == "Waterbody":
                ndvi_2023 = round(0.06 + random.random() * 0.08, 3)
                ndbi_2023 = round(-0.42 + random.random() * 0.12, 3)
                ndwi_2023 = round(0.60 + random.random() * 0.20, 3)
            else:
                ndvi_2023 = round(0.18 + random.random() * 0.12, 3)
                ndbi_2023 = round(0.08 + random.random() * 0.12, 3)
                ndwi_2023 = round(-0.16 + random.random() * 0.08, 3)
                
            gw_status = "Over-exploited" if tname in ["Tiruppur North", "Tiruppur South"] else ("Critical" if tname in ["Avinashi", "Palladam"] else ("Semi-critical" if tname == "Kangeyam" else "Safe"))
            soil_quality = round(max(30, min(95, 80 - (nh_dist * 0.5) + (random.random() * 20 - 10))), 1)
            pop_density = int(max(150, (1200 / (urban_dist + 1.5)) * (2.2 if "Tiruppur" in tname else 1.0) + random.randint(50, 200)))
            
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
                "taluk": tname,
                "lat": lat,
                "lon": lon,
                "area_ha": round(25.0 + random.random() * 5.0, 1),
                "lulc_2018": lulc_2018,
                "lulc_2023": lulc_2023,
                "transition_type": f"{lulc_2018} -> {lulc_2023}",
                "converted_agri_to_built": 1 if (lulc_2018 == "Agriculture" and lulc_2023 == "Built-up") else 0,
                "ndvi_2018": ndvi_2018,
                "ndvi_2023": ndvi_2023,
                "ndbi_2018": ndbi_2018,
                "ndbi_2023": ndbi_2023,
                "ndwi_2023": ndwi_2023,
                "ndvi_delta": round(ndvi_2023 - ndvi_2018, 3),
                "ndbi_delta": round(ndbi_2023 - ndbi_2018, 3),
                "dist_to_nh_km": nh_dist,
                "dist_to_rail_km": rail_dist,
                "dist_to_urban_center_km": urban_dist,
                "groundwater_status": gw_status,
                "soil_quality_score": soil_quality,
                "pop_density_sqkm": pop_density,
                "slope_pct": round(1.0 + random.random() * 4.5, 1),
                "polygon": polygon_coords
            })
            cell_idx += 1
            
    return parcels

TIRUPPUR_PARCELS = _generate_tiruppur_parcels()
