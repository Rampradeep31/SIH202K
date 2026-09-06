from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.rag.copilot import copilot

router = APIRouter(prefix="/research", tags=["Research & Policy RAG"])

class ResearchQueryRequest(BaseModel):
    question: str
    use_web_search: Optional[bool] = False

@router.post("/query")
def query_research(req: ResearchQueryRequest) -> Dict[str, Any]:
    return copilot.query(req.question, use_web_search=bool(req.use_web_search))

@router.get("/documents")
def get_documents() -> Dict[str, Any]:
    return copilot.get_documents()
