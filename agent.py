import os
from dotenv import load_dotenv
from smolagents import CodeAgent, InferenceClientModel
from sql_tool import sql_engine
from database import engine
from schema_utils import describe_table

# Cargar variables de entorno
load_dotenv()
hf_token = os.getenv("HF_TOKEN")

if not hf_token:
    print("Advertencia: No se encontró HF_TOKEN en las variables de entorno. Ejecute configurando el token en .env primero.")
    exit(0)

print("=== Agente 1: Consulta básica (receipts) ===")
agent1 = CodeAgent(
    tools=[sql_engine],
    model=InferenceClientModel(model_id="meta-llama/Llama-3.1-8B-Instruct", token=hf_token),
)
agent1.run("¿Puedes darme el nombre del cliente con el recibo más caro?")

print("\n=== Agente 2: Consulta con JOIN (receipts + waiters) ===")

# Actualizar la descripción de la herramienta para incluir la tabla waiters
receipts_desc = describe_table(engine, "receipts")
waiters_desc = describe_table(engine, "waiters")

updated_description = f"""Permite realizar consultas SQL sobre las tablas. Ten en cuenta que la salida de esta herramienta es una representación en texto de la ejecución.
Puede usar las siguientes tablas:

Tabla 'receipts':
{receipts_desc}

Tabla 'waiters':
{waiters_desc}
"""

sql_engine.description = updated_description

agent2 = CodeAgent(
    tools=[sql_engine],
    # model_id="Qwen/Qwen3-Next-80B-A3B-Thinking" (usado en el artículo original)
    model=InferenceClientModel(model_id="Qwen/Qwen3-Next-80B-A3B-Thinking", token=hf_token),
)

agent2.run("¿Qué mesero recibió más dinero en propinas en total?")

print("\n=== Agente 2: Tercera pregunta combinada ===")
agent2.run("Dime el nombre del mesero que atendió al cliente Woodrow Wilson y cuánto dejó de propina.")
