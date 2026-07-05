import json
from src.model_factory import get_provider

def generate_natural_answer(question: str, sql: str, rows: list, provider_name: str, model_name: str, language: str = "es") -> str:
    """
    Genera una respuesta en lenguaje natural a partir de los resultados devueltos por la base de datos.
    """
    try:
        if provider_name.lower() == "mock":
            return fallback_natural_answer(question, rows, language)

        provider = get_provider(provider_name)
        
        # Limitar las filas para no saturar el prompt
        max_rows = 10
        truncated_rows = rows[:max_rows]
        has_more = len(rows) > max_rows
        
        rows_str = json.dumps(truncated_rows, indent=2, ensure_ascii=False, default=str)
        if has_more:
            rows_str += f"\n... (y {len(rows) - max_rows} resultados más omitidos)"

        lang_instruction = "Responde en español." if language == "es" else "Respond in English."
        
        prompt = f"""Eres un asistente de análisis de datos. Debes responder a la pregunta del usuario usando ÚNICAMENTE los datos obtenidos de la base de datos.

Pregunta del usuario: "{question}"

Consulta SQL ejecutada:
```sql
{sql}
```

Resultados obtenidos (formato JSON):
{rows_str}

Instrucciones:
1. {lang_instruction}
2. Sé claro, directo y conversacional.
3. NO inventes datos. Usa estrictamente los resultados obtenidos.
4. Si los resultados están vacíos, indica claramente que no se encontraron resultados para la búsqueda.
5. No expliques ni repitas el código SQL a menos que sea estrictamente necesario para la respuesta.
6. No digas que eres un modelo de IA.
7. No uses markdown innecesario.
"""
        return provider.generate_text(prompt, model_name)
    except Exception as e:
        print(f"Error generando respuesta natural con LLM: {e}")
        return fallback_natural_answer(question, rows, language)

def fallback_natural_answer(question: str, rows: list, language: str = "es") -> str:
    """Fallback por reglas simples cuando el LLM falla o es mock."""
    if not rows:
        return "No se encontraron resultados para tu consulta." if language == "es" else "No results found for your query."
    
    count = len(rows)
    if count == 1:
        row = rows[0]
        keys = list(row.keys())
        if len(keys) == 1:
            return f"El resultado es {row[keys[0]]}." if language == "es" else f"The result is {row[keys[0]]}."
        else:
            parts = [f"{k}: {v}" for k, v in row.items()]
            return f"Se encontró 1 registro con los siguientes datos: {', '.join(parts)}." if language == "es" else f"Found 1 record with the following data: {', '.join(parts)}."
    
    return f"Se encontraron {count} resultados. El primer registro es: {json.dumps(rows[0], ensure_ascii=False, default=str)}." if language == "es" else f"Found {count} results. The first record is: {json.dumps(rows[0], ensure_ascii=False, default=str)}."
