from sqlalchemy import (
    create_engine, MetaData, Table, Column,
    String, Integer, Float, insert, text
)

engine = create_engine("sqlite:///:memory:")
metadata_obj = MetaData()

# Tabla 1: receipts (recibos)
table_name = "receipts"
receipts = Table(
    table_name,
    metadata_obj,
    Column("receipt_id", Integer, primary_key=True),
    Column("customer_name", String(16), primary_key=True),
    Column("price", Float),
    Column("tip", Float),
)
metadata_obj.create_all(engine)

rows = [
    {"receipt_id": 1, "customer_name": "Alan Payne", "price": 12.06, "tip": 1.20},
    {"receipt_id": 2, "customer_name": "Alex Mason", "price": 23.86, "tip": 0.24},
    {"receipt_id": 3, "customer_name": "Woodrow Wilson", "price": 53.43, "tip": 5.43},
    {"receipt_id": 4, "customer_name": "Margaret James", "price": 21.11, "tip": 1.00},
]

for row in rows:
    stmt = insert(receipts).values(**row)
    with engine.begin() as connection:
        connection.execute(stmt)

# Tabla 2: waiters (meseros), para hacer joins
table_name = "waiters"
waiters = Table(
    table_name,
    metadata_obj,
    Column("receipt_id", Integer, primary_key=True),
    Column("waiter_name", String(16), primary_key=True),
)
metadata_obj.create_all(engine)

waiter_rows = [
    {"receipt_id": 1, "waiter_name": "Corey Johnson"},
    {"receipt_id": 2, "waiter_name": "Michael Watts"},
    {"receipt_id": 3, "waiter_name": "Michael Watts"},
    {"receipt_id": 4, "waiter_name": "Margaret James"},
]

for row in waiter_rows:
    stmt = insert(waiters).values(**row)
    with engine.begin() as connection:
        connection.execute(stmt)

if __name__ == "__main__":
    # Prueba de aislamiento para verificar que las tablas y filas se crearon
    with engine.connect() as con:
        print("--- Receipts ---")
        for r in con.execute(text("SELECT * FROM receipts")):
            print(r)
        print("--- Waiters ---")
        for r in con.execute(text("SELECT * FROM waiters")):
            print(r)
