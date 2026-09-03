"""
Tamil Nadu Land Governance Intelligence Platform (TN-LGIP)
Backend REST API Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import API routers
from app.api.regions import router as regions_router
from app.api.lulc import router as lulc_router
from app.api.gis import router as gis_router
from app.api.predictions import router as predictions_router
from app.api.ask_map import router as ask_map_router
from app.api.research import router as research_router
from app.api.scenarios import router as scenarios_router
from app.api.models_eval import router as models_router
from app.api.datasets import router as datasets_router
from app.api.evidence import router as evidence_router
from app.api.reports import router as reports_router
from app.api.taluks import router as taluks_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligence and research decision-support layer for Tamil Nadu land governance, agricultural preservation, and policy scenario evaluation.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(regions_router, prefix=settings.API_V1_STR)
app.include_router(taluks_router, prefix=settings.API_V1_STR)
app.include_router(lulc_router, prefix=settings.API_V1_STR)
app.include_router(gis_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(ask_map_router, prefix=settings.API_V1_STR)
app.include_router(research_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "jurisdiction": settings.JURISDICTION,
        "pilot_district": settings.PILOT_DISTRICT,
        "status": "Operational",
        "api_docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "TN-LGIP Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
