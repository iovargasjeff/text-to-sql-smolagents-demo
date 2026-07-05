import psycopg
from psycopg.rows import dict_row
from src import config

def get_connection():
    return psycopg.connect(
        host=config.POSTGRES_HOST,
        port=config.POSTGRES_PORT,
        dbname=config.POSTGRES_DB,
        user=config.POSTGRES_USER,
        password=config.POSTGRES_PASSWORD,
        row_factory=dict_row
    )

def log_query_execution(
    question: str,
    provider: str,
    model: str,
    status: str,
    latency_ms: int,
    generated_sql: str = None,
    natural_answer: str = None,
    row_count: int = None,
    error_message: str = None
):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO query_logs (
                        question, provider, model, generated_sql, natural_answer,
                        row_count, latency_ms, status, error_message
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    question, provider, model, generated_sql, natural_answer,
                    row_count, latency_ms, status, error_message
                ))
            conn.commit()
    except Exception as e:
        print(f"Error guardando log de consulta: {e}")

def list_recent_queries(limit: int = 20, status: str = None):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = "SELECT * FROM query_logs"
                params = []
                if status and status in ["success", "error"]:
                    query += " WHERE status = %s"
                    params.append(status)
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                cur.execute(query, params)
                return cur.fetchall()
    except Exception as e:
        print(f"Error listando queries: {e}")
        return []

def get_query_by_id(query_id: int):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM query_logs WHERE id = %s", (query_id,))
                return cur.fetchone()
    except Exception as e:
        print(f"Error obteniendo query {query_id}: {e}")
        return None
