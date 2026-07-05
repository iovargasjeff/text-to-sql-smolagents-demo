import os
import psycopg
import glob

def get_conn_info():
    host = os.environ.get("POSTGRES_HOST", "db")
    port = os.environ.get("POSTGRES_PORT", "5432")
    db = os.environ.get("POSTGRES_DB", "text2sql_demo")
    user = os.environ.get("POSTGRES_USER", "postgres")
    password = os.environ.get("POSTGRES_PASSWORD", "postgres")
    return f"host={host} port={port} dbname={db} user={user} password={password}"

def main():
    conn_info = get_conn_info()
    
    print("Iniciando ejecución de migraciones...", flush=True)
    
    # Obtener archivos de migración
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
    sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
    
    if not sql_files:
        print("No se encontraron archivos de migración en /migrations.")
        return

    with psycopg.connect(conn_info) as conn:
        # Creamos una tabla para registrar las migraciones ya aplicadas
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS migrations_history (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

            for sql_file in sql_files:
                filename = os.path.basename(sql_file)
                
                # Verificar si ya se aplicó
                cur.execute("SELECT id FROM migrations_history WHERE filename = %s", (filename,))
                if cur.fetchone():
                    print(f"Saltando {filename} (ya aplicado).")
                    continue
                
                print(f"Aplicando migración {filename}...")
                with open(sql_file, "r", encoding="utf-8") as f:
                    sql_content = f.read()
                
                cur.execute(sql_content)
                cur.execute("INSERT INTO migrations_history (filename) VALUES (%s)", (filename,))
                conn.commit()
                print(f"Migración {filename} aplicada con éxito.")

    print("Migraciones finalizadas.")

if __name__ == "__main__":
    main()
