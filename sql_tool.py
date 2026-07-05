from smolagents import tool
from sqlalchemy import text
from database import engine
from schema_utils import describe_table

# Bloquear palabras clave peligrosas
FORBIDDEN_KEYWORDS = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]

@tool
def sql_engine(query: str) -> str:
    """
    Permite realizar consultas SQL sobre la base de datos.
    Devuelve una representación en texto del resultado.
    
    Args:
        query: La consulta SQL a ejecutar. Debe ser SQL válido.
    """
    # Validación de seguridad: bloquear keywords prohibidas
    upper_query = query.upper()
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in upper_query:
            raise ValueError(f"Error de seguridad: La consulta contiene una palabra clave no permitida: {keyword}")

    output = ""
    with engine.connect() as con:
        rows = con.execute(text(query))
        for row in rows:
            output += "\n" + str(row)
    return output

# Inicializar docstring dinámico para la primera etapa
receipts_desc = describe_table(engine, "receipts")
sql_engine.description = f"""
Permite realizar consultas SQL sobre las tablas. Ten en cuenta que la salida de esta herramienta es una representación en texto de la ejecución.
Puede usar las siguientes tablas:

Tabla 'receipts':
{receipts_desc}
"""

if __name__ == "__main__":
    # Prueba de aislamiento
    print("--- Test SELECT ---")
    print(sql_engine("SELECT * FROM receipts"))
    print("\n--- Test Security (DROP) ---")
    try:
        sql_engine("DROP TABLE receipts")
    except ValueError as e:
        print(f"Excepción capturada correctamente: {e}")
