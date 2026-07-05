import time
import os
import psycopg
from psycopg import OperationalError
import sys

def main():
    host = os.environ.get("POSTGRES_HOST", "db")
    port = os.environ.get("POSTGRES_PORT", "5432")
    db = os.environ.get("POSTGRES_DB", "text2sql_demo")
    user = os.environ.get("POSTGRES_USER", "postgres")
    password = os.environ.get("POSTGRES_PASSWORD", "postgres")
    
    conn_info = f"host={host} port={port} dbname={db} user={user} password={password}"
    
    max_retries = 30
    print(f"Esperando a la base de datos PostgreSQL en {host}:{port}...", flush=True)
    
    for i in range(max_retries):
        try:
            conn = psycopg.connect(conn_info)
            conn.close()
            print("¡Base de datos lista!", flush=True)
            sys.exit(0)
        except OperationalError:
            time.sleep(1)
            
    print("Error: La base de datos no está disponible después de 30 segundos.")
    sys.exit(1)

if __name__ == "__main__":
    main()
