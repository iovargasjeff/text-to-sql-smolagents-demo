from src.db import get_connection

def fetch_schema_overview() -> str:
    """
    Inspecciona la base de datos PostgreSQL para obtener el esquema de las tablas relevantes
    y lo devuelve en un formato de texto amigable para pasar al LLM.
    """
    query = """
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'orders', 'support_tickets')
    ORDER BY table_name, ordinal_position;
    """
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            
    if not rows:
        return "No schema found."
        
    schema_dict = {}
    for row in rows:
        t_name = row['table_name']
        c_name = row['column_name']
        d_type = row['data_type']
        
        if t_name not in schema_dict:
            schema_dict[t_name] = []
        schema_dict[t_name].append(f"  - {c_name} ({d_type})")
        
    schema_str = "Esquema de la base de datos:\n\n"
    for t_name, columns in schema_dict.items():
        schema_str += f"Tabla: {t_name}\n"
        schema_str += "\n".join(columns)
        schema_str += "\n\n"
        
    return schema_str
