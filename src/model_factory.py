import re
from src import config

class LLMProvider:
    def generate_sql(self, question: str, schema: str, model_name: str) -> str:
        raise NotImplementedError

class MockProvider(LLMProvider):
    def generate_sql(self, question: str, schema: str, model_name: str) -> str:
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
    def generate_sql(self, question: str, schema: str, model_name: str) -> str:
        if not config.OPENAI_API_KEY:
            raise ValueError("Falta OPENAI_API_KEY en el entorno.")
            
        import requests
        headers = {
            "Authorization": f"Bearer {config.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = self._build_prompt(question, schema)
        data = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0
        }
        
        base_url = config.OPENAI_BASE_URL.rstrip('/') if config.OPENAI_BASE_URL else "https://api.openai.com/v1"
        response = requests.post(f"{base_url}/chat/completions", headers=headers, json=data)
        if response.status_code != 200:
            raise ValueError(f"Error de OpenAI: {response.text}")
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

class DeepSeekProvider(OpenAIProvider):
    def generate_sql(self, question: str, schema: str, model_name: str) -> str:
        if not config.DEEPSEEK_API_KEY:
            raise ValueError("Falta DEEPSEEK_API_KEY en el entorno.")
            
        import requests
        headers = {
            "Authorization": f"Bearer {config.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = self._build_prompt(question, schema)
        data = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0
        }
        
        base_url = config.DEEPSEEK_BASE_URL.rstrip('/')
        response = requests.post(f"{base_url}/chat/completions", headers=headers, json=data)
        if response.status_code != 200:
            raise ValueError(f"Error de DeepSeek: {response.text}")
        content = response.json()["choices"][0]["message"]["content"]
        return self._extract_sql(content)

class GeminiProvider(OpenAIProvider):
    def generate_sql(self, question: str, schema: str, model_name: str) -> str:
        if not config.GEMINI_API_KEY:
            raise ValueError("Falta GEMINI_API_KEY en el entorno.")
            
        import requests
        headers = {
            "Content-Type": "application/json"
        }
        prompt = self._build_prompt(question, schema)
        
        # Gemini REST API Format
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.0
            }
        }
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={config.GEMINI_API_KEY}"
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 200:
            raise ValueError(f"Error de Gemini: {response.text}")
            
        json_resp = response.json()
        try:
            content = json_resp["candidates"][0]["content"]["parts"][0]["text"]
            return self._extract_sql(content)
        except (KeyError, IndexError):
            raise ValueError(f"Respuesta inesperada de Gemini: {json_resp}")

# Factory function
def get_provider(provider_name: str) -> LLMProvider:
    provider_name = provider_name.lower()
    if provider_name == "mock":
        return MockProvider()
    elif provider_name == "openai":
        return OpenAIProvider()
    elif provider_name == "deepseek":
        return DeepSeekProvider()
    elif provider_name == "gemini":
        return GeminiProvider()
    else:
        raise ValueError(f"Proveedor desconocido: {provider_name}")
