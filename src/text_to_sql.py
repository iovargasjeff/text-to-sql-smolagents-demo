from src.schema_introspector import fetch_schema_overview
from src.model_factory import get_provider
from src.sql_guard import validate_sql
from src.db import run_query

def process_question(question: str) -> dict:
    """
    Orquesta todo el flujo de Text-to-SQL:
    1. Obtiene esquema.
    2. Usa el LLM para generar SQL.
    3. Valida SQL.
    4. Ejecuta SQL.
    """
    try:
        # 1. Esquema
        schema = fetch_schema_overview()
        
        # 2. Generar SQL
        provider = get_provider()
        raw_sql = provider.generate_sql(question, schema)
        
        # 3. Validar
        safe_sql = validate_sql(raw_sql)
        
        # 4. Ejecutar
        results = run_query(safe_sql)
        
        return {
            "success": True,
            "generated_sql": safe_sql,
            "results": results
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
