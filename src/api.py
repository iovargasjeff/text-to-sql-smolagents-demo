from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.provider_registry import load_provider_catalog
from src.text_to_sql import process_question

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    provider: str
    model: str

@router.get("/api/health")
def health_check():
    return {"status": "ok"}

@router.get("/api/providers")
def get_providers():
    return load_provider_catalog()

@router.post("/api/query")
def run_query(req: QueryRequest):
    if not req.question:
        raise HTTPException(status_code=400, detail="Pregunta vacía")
        
    result = process_question(req.question, req.provider, req.model)
    return result
