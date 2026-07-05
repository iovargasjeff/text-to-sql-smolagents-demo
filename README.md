# Text-to-SQL AI Database Solutions (Fase 2)

Este proyecto es un entorno reproducible ("Laboratorio") para probar arquitecturas Text-to-SQL.
En la **Fase 2** hemos extendido el backend original de la Fase 1 incorporando una interfaz web ligera y un soporte robusto multi-proveedor.

## Arquitectura

- **Base de Datos**: PostgreSQL 16 + pgvector.
- **Backend API**: Python (FastAPI).
- **Frontend**: HTML/CSS/JS (sin framework) con Interfaz tipo Chat servido estáticamente.
- **Síntesis NLP**: `answer_synthesizer.py` para generar respuestas en lenguaje natural usando LLMs.
- **Migraciones**: Scripts Python (`scripts/run_migrations.py`) sobre archivos `.sql` puros.
- **Infraestructura**: Todo dockerizado vía `docker-compose`.

## Novedades Fase 2 (Mejora Chat UI)

1. **Interfaz Web (Chat UI)**: Accesible en `http://localhost:8000`. Experiencia de conversación moderna. El usuario envía preguntas y el asistente responde con una burbuja de chat que incluye:
   - Una **Respuesta en Lenguaje Natural** basada en los resultados de la BD.
   - El **SQL Generado** (colapsable).
   - Los **Datos / Tabla de resultados** (colapsable).
2. **Soporte Multi-Proveedor**:
   - `mock`: Proveedor local sin costo para desarrollo y demos, responde con ejemplos fijos.
   - `openai`: Integración oficial con modelos GPT.
   - `deepseek`: Integración compatible con formato OpenAI para modelos DeepSeek.
   - `gemini`: Integración directa vía API REST a los modelos Gemini 2.5 de Google.
3. **API RESTful**: Endpoint `/api/query` enriquecido. Ahora devuelve `answer` y `row_count`.

## Instalación y Ejecución

1. Clona el repositorio.
2. Crea el archivo `.env` basándote en `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Configura tus claves de API (`OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`) en el archivo `.env`. Si no configuras ninguna, puedes seguir usando el proveedor **Mock**.
4. Levanta los contenedores:
   ```bash
   docker compose up --build -d
   ```
5. Abre en tu navegador web: [http://localhost:8000](http://localhost:8000)

## Seguridad

El sistema incorpora un mecanismo de seguridad (`sql_guard.py`) que bloquea las consultas de modificación (`INSERT`, `UPDATE`, `DELETE`, etc.), asegura que las sentencias sean de tipo `SELECT` y les inyecta por seguridad un `LIMIT 20`.

## Modelos Soportados

El archivo `config/providers.json` mantiene el catálogo actualizado. Algunos de los modelos clave son:
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`
- **DeepSeek**: `deepseek-v4-flash` (recomendado), `deepseek-chat`
- **Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`

## Próximos Pasos (Fase 3 - Futuro)
- Integración de RAG avanzado con la base vectorial.
- Metadatos expandidos para introspección compleja del esquema.
- Historial de consultas.
