import re
from src import config

class LLMProvider:
    def generate_sql(self, question: str, schema: str) -> str:
        raise NotImplementedError

class MockProvider(LLMProvider):
    def generate_sql(self, question: str, schema: str) -> str:
        # Mock answers for predefined questions
        q = question.lower()
        if "más órdenes completadas" in q:
            return "SELECT c.full_name, COUNT(o.id) as total_orders FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' GROUP BY c.id ORDER BY total_orders DESC LIMIT 1;"
        elif "críticos siguen abiertos" in q or "críticos" in q:
            return "SELECT COUNT(*) FROM support_tickets WHERE priority = 'high' AND status = 'open';"
        elif "pedidos pendientes" in q:
            return "SELECT DISTINCT c.full_name FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'pending';"
        elif "monto total" in q:
            return "SELECT c.city, SUM(o.amount) as total_amount FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.city;"
        else:
            # Fallback simple count for any other question in mock mode
            return "SELECT COUNT(*) FROM customers;"

class OpenAIProvider(LLMProvider):
    def generate_sql(self, question: str, schema: str) -> str:
        if not config.OPENAI_API_KEY:
            raise ValueError("Falta OPENAI_API_KEY en el entorno.")
            
        import requests
        headers = {
            "Authorization": f"Bearer {config.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = self._build_prompt(question, schema)
        data = {
            "model": config.MODEL_NAME,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0
        }
        
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return self._extract_sql(content)

    def _build_prompt(self, question: str, schema: str) -> str:
        return f"""Eres un experto traductor de lenguaje natural a SQL para PostgreSQL.
Dado el siguiente esquema de base de datos:
{schema}

Convierte la siguiente pregunta a una consulta SQL válida:
"{question}"

Reglas:
- Devuelve SOLO la consulta SQL, sin explicaciones ni markdown.
- Usa solo sentencias SELECT.
"""

    def _extract_sql(self, text: str) -> str:
        # Extraer de bloque de código si es necesario
        match = re.search(r"```(?:sql)?(.*?)```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()

# Factory function
def get_provider() -> LLMProvider:
    provider_name = config.MODEL_PROVIDER.lower()
    
    if provider_name == "mock":
        return MockProvider()
    elif provider_name == "openai":
        return OpenAIProvider()
    elif provider_name == "deepseek":
        # Podría reusar clase OpenAIProvider cambiando el endpoint si es compatible,
        # o implementar una específica. Dejamos el esqueleto preparado.
        raise NotImplementedError("Integración con DeepSeek pendiente de implementar.")
    elif provider_name == "gemini":
        raise NotImplementedError("Integración con Gemini pendiente de implementar.")
    else:
        raise ValueError(f"Proveedor desconocido: {provider_name}")
