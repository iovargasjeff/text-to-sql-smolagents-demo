from sqlalchemy import inspect

def describe_table(engine, table_name: str) -> str:
    """Inspecciona dinámicamente la tabla y devuelve su descripción."""
    inspector = inspect(engine)
    columns_info = [(col["name"], col["type"]) for col in inspector.get_columns(table_name)]
    
    table_description = "Columns:\n"
    for name, col_type in columns_info:
        table_description += f"  - {name}: {col_type}\n"
    
    return table_description

if __name__ == "__main__":
    # Prueba de aislamiento
    from database import engine
    print("--- Describe Receipts ---")
    print(describe_table(engine, "receipts"))
    print("--- Describe Waiters ---")
    print(describe_table(engine, "waiters"))
