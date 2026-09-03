from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.rag.copilot import copilot

router = APIRouter(prefix="/research", tags=["Research & Policy RAG"])

class ResearchQueryRequest(BaseModel):
    question: str

@router.post("/query")
def query_research(req: ResearchQueryRequest) -> Dict[str, Any]:
    return copilot.query(req.question)

@router.get("/documents")
def get_documents() -> Dict[str, Any]:
    return copilot.get_documents()
