from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from src.provider_registry import load_provider_catalog
from src.text_to_sql import process_question
from src.query_logger import list_recent_queries, get_query_by_id

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    provider: str
    model: str
    language: str = "es"

@router.get("/api/health")
def health_check():
    return {"status": "ok"}

@router.get("/api/providers")
def get_providers():
    return load_provider_catalog()

@router.post("/api/query")
def api_query(req: QueryRequest):
    result = process_question(req.question, req.provider, req.model, req.language)
    if not result["success"]:
        return result
    return result

@router.get("/api/history")
def get_history(limit: int = Query(20, le=100), status: Optional[str] = None):
    return {"history": list_recent_queries(limit, status)}

@router.get("/api/history/{query_id}")
def get_history_detail(query_id: int):
    query = get_query_by_id(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    return query
