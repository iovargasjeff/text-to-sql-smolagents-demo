# Text-to-SQL AI Database Solutions (Fase 3)

### 🇬🇧 English Overview
This project is a reproducible "Lab" environment for testing Text-to-SQL architectures. It features a modern, bilingual Chat UI (English/Spanish) where users can ask natural language questions about their database. The AI translates these questions into safe SQL queries, executes them against a PostgreSQL database, and generates a conversational response based on the actual data. It includes multi-provider support (OpenAI, DeepSeek, Gemini, and a Mock mode), robust SQL security guards, and a query history panel for observability.

---

Este proyecto es un entorno reproducible ("Laboratorio") para probar arquitecturas Text-to-SQL.
En la **Fase 3** hemos extendido el backend original incorporando una interfaz web ligera con soporte bilingüe (Español/Inglés) e historial de consultas.

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

## Novedades Fase 3 (Historial y Observabilidad)

1. **Tabla de Logs (`query_logs`)**: Se agregó una migración SQL para registrar todas las consultas, tanto exitosas como fallidas. Guarda métricas útiles como latencia (`latency_ms`), filas devueltas (`row_count`), error si falló, respuesta en lenguaje natural y modelo utilizado.
2. **Panel de Historial UI**: Una nueva barra lateral en la aplicación web permite:
   - Ver consultas recientes.
   - Filtrar por estado (Todos, Éxito, Error).
   - Ver indicadores visuales (badges verdes/rojos) y el tiempo de respuesta.
   - Hacer clic en un log anterior para revivir la consulta en el área de chat (mostrando la pregunta, la respuesta en lenguaje natural y el SQL generado).
3. **Nuevos Endpoints API**: `/api/history` y `/api/history/{id}` que permiten consultar de forma programática las consultas pasadas.
4. **Resiliencia**: Los datos tabulares reales no se guardan en el log por seguridad, pero sí se conserva el SQL y la cantidad de filas devueltas originalmente.

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
