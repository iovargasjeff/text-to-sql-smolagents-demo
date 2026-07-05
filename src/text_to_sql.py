from src.schema_introspector import fetch_schema_overview
from src.model_factory import get_provider
from src.sql_guard import validate_sql
from src.db import run_query
from src.answer_synthesizer import generate_natural_answer
from src import config

def process_question(question: str, provider_name: str = None, model_name: str = None) -> dict:
    """
    Orquesta todo el flujo de Text-to-SQL:
    1. Obtiene esquema.
    2. Usa el LLM para generar SQL.
    3. Valida SQL.
    4. Ejecuta SQL.
    """
    if not provider_name:
        provider_name = config.MODEL_PROVIDER
    if not model_name:
        model_name = config.MODEL_NAME

    try:
        # 1. Esquema
        schema = fetch_schema_overview()
        
        # 2. Generar SQL
        provider = get_provider(provider_name)
        raw_sql = provider.generate_sql(question, schema, model_name)
        
        # 3. Validar
        safe_sql = validate_sql(raw_sql)
        
        # 4. Ejecutar
        results = run_query(safe_sql)
        
        # 5. Sintetizar respuesta
        answer = generate_natural_answer(question, safe_sql, results, provider_name, model_name)
        
        return {
            "success": True,
            "provider": provider_name,
            "model": model_name,
            "question": question,
            "answer": answer,
            "generated_sql": safe_sql,
            "rows": results,
            "row_count": len(results),
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "provider": provider_name,
            "model": model_name,
            "question": question,
            "answer": None,
            "generated_sql": None,
            "rows": [],
            "row_count": 0,
            "error": str(e)
        }
