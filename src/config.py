import os
from dotenv import load_dotenv

# Cargar variables de entorno (por si se usa localmente sin docker)
load_dotenv()

MODEL_PROVIDER = os.environ.get("MODEL_PROVIDER", "mock")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o-mini")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "text2sql_demo")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")

def get_postgres_url() -> str:
    """Devuelve la URL de conexión a PostgreSQL"""
    return f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
