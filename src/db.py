import psycopg
from psycopg.rows import dict_row
from src import config

def get_connection():
    """Devuelve una conexión usando psycopg conectada a la base de datos"""
    conn_str = f"host={config.POSTGRES_HOST} port={config.POSTGRES_PORT} dbname={config.POSTGRES_DB} user={config.POSTGRES_USER} password={config.POSTGRES_PASSWORD}"
    return psycopg.connect(conn_str, row_factory=dict_row)

def run_query(sql: str, params: tuple = None) -> list[dict]:
    """
    Ejecuta una consulta SQL (SELECT) y devuelve los resultados como lista de diccionarios.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if cur.description: # Si la query retorna resultados (es un SELECT)
                return cur.fetchall()
            return []
