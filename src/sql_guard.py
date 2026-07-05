import re

def validate_sql(sql: str) -> str:
    """
    Valida que la consulta SQL sea segura.
    Solo permite SELECT y bloquea instrucciones destructivas.
    Agrega LIMIT 20 si no tiene LIMIT.
    """
    # Eliminar espacios extra y comentarios si hubiera
    clean_sql = sql.strip().upper()
    
    # Bloquear palabras clave peligrosas
    forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"]
    for keyword in forbidden:
        # Regex para buscar la palabra exacta como token
        if re.search(rf'\b{keyword}\b', clean_sql):
            raise ValueError(f"Consulta bloqueada por seguridad. Contiene comando prohibido: {keyword}")
            
    # Solo permitir SELECT
    if not clean_sql.startswith("SELECT"):
        raise ValueError("Consulta bloqueada por seguridad. Solo se permiten comandos SELECT.")
        
    # Validar o inyectar LIMIT
    if not re.search(r'\bLIMIT\b', clean_sql):
        # Para evitar problemas con el punto y coma final
        if sql.strip().endswith(";"):
            sql = sql.strip()[:-1] + " LIMIT 20;"
        else:
            sql = sql.strip() + " LIMIT 20;"
            
    return sql
