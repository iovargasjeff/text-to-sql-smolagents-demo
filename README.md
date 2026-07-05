# Text-to-SQL AI Database Solutions

A bilingual Text-to-SQL lab that lets users ask questions in natural language, converts them into safe SQL, runs them on PostgreSQL, and returns both a conversational answer and the underlying query results.

## What this project does

This project is a reproducible environment for experimenting with Text-to-SQL architectures. It includes a lightweight chat interface in English and Spanish where users can ask questions about a database using natural language instead of writing SQL manually.

The backend translates the question into SQL, applies safety checks before execution, runs the query on PostgreSQL, and then generates a human-readable answer based on the returned rows. The app also stores query history and execution metadata so you can inspect previous requests, compare behavior across providers, and debug failures more easily.

## Why it exists

Text-to-SQL demos often stop at “generate a query and print the result.” This repository goes a step further by treating the system like a small product rather than a one-off experiment.

The project is designed to show the full lifecycle of a Text-to-SQL request:

- natural-language input
- schema-aware SQL generation
- SQL safety validation
- query execution on PostgreSQL
- natural-language answer synthesis
- query logging and history

That makes it useful both as a learning project and as a starting point for more serious internal tools.

## Main features

- Bilingual chat UI in English and Spanish
- PostgreSQL 16 as the SQL execution engine
- pgvector enabled as a foundation for future semantic retrieval
- FastAPI backend
- Multi-provider support:
  - `mock`
  - `openai`
  - `deepseek`
  - `gemini`
- SQL guard that restricts execution to safe read-only queries
- Natural-language answer synthesis from real query results
- Query history sidebar with status, latency, and metadata
- REST API endpoints for live queries and history inspection
- Docker Compose setup for reproducible local development

## Architecture

The system is split into a few clear layers:

- **Frontend**: lightweight chat UI built with HTML, CSS, and JavaScript
- **Backend API**: FastAPI service that orchestrates the full request pipeline
- **SQL generation**: provider-based LLM layer that converts user questions into SQL
- **Validation layer**: `sql_guard.py` ensures only safe read-only queries are executed
- **Database**: PostgreSQL 16 with pgvector enabled
- **Answer synthesis**: `answer_synthesizer.py` converts query results into natural-language responses
- **Observability**: `query_logs` table and history endpoints for request tracking

## How the request flow works

1. A user asks a question in the chat UI.
2. The backend reads the schema and builds a prompt.
3. The selected provider generates SQL.
4. The SQL guard validates and sanitizes the query.
5. PostgreSQL executes the query.
6. The backend generates a natural-language answer from the returned rows.
7. The request is stored in `query_logs`.
8. The frontend displays the answer, SQL, results, and metadata.

## Demo screenshots

### Chat UI

Add your main app screenshot here.

```md

```

### Architecture diagram

Add your high-level architecture image here.

```md

```

### Query history and observability

Add your history/logging screenshot here.

```md

```

## Project structure

```text
.
├── app/
│   ├── api/
│   ├── providers/
│   ├── sql_guard.py
│   ├── answer_synthesizer.py
│   └── ...
├── scripts/
│   └── run_migrations.py
├── sql/
│   └── migrations/
├── config/
│   └── providers.json
├── static/
│   └── chat UI assets
├── docker-compose.yml
├── .env.example
└── README.md
```

## Supported providers

The available model catalog is managed in `config/providers.json`.

Current provider groups include:

- **Mock**: local demo mode for development without API cost
- **OpenAI**: GPT-based models
- **DeepSeek**: OpenAI-compatible integration
- **Gemini**: direct REST API integration with Gemini models

Example models may include:

- OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`
- DeepSeek: `deepseek-v4-flash`, `deepseek-chat`
- Gemini: `gemini-2.5-flash`, `gemini-2.5-pro`

## Security model

The project includes a SQL safety layer in `sql_guard.py`.

By default, the guard is designed to:

- allow only `SELECT` queries
- block mutation statements such as `INSERT`, `UPDATE`, `DELETE`, `DROP`, and `ALTER`
- reject multiple statements
- inject a default `LIMIT` for safer execution

This is meant as a practical safety baseline for demos, experiments, and internal tools. It is not a replacement for production-grade access control or database-level security policies.

## Query history and observability

One of the goals of this repository is to make the system easier to inspect, not just easier to demo.

Each query can be recorded in the `query_logs` table with metadata such as:

- question
- provider
- model
- generated SQL
- natural-language answer
- row count
- latency
- status
- error message

The frontend history panel lets you review previous executions and quickly understand how the system behaved over time.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/iovargasjeff/text-to-sql-smolagents-demo.git
cd text-to-sql-smolagents-demo
```

### 2. Create your environment file

```bash
cp .env.example .env
```

### 3. Configure provider credentials

Set any provider keys you want to use in `.env`.

Examples:

```env
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
```

If you do not configure any provider keys, you can still use the `mock` provider for local demos.

### 4. Start the stack

```bash
docker compose up --build -d
```

### 5. Open the app

Open:

[http://localhost:8000](http://localhost:8000)

## API overview

### `POST /api/query`

Processes a natural-language question and returns the answer, SQL, rows, and metadata.

Example response:

```json
{
  "provider": "mock",
  "model": "demo-sql-v1",
  "question": "Which customer has the most completed orders?",
  "answer": "Ana Torres has the most completed orders, with 4 completed purchases.",
  "sql": "SELECT c.name, COUNT(*) AS total_orders FROM ... LIMIT 1",
  "rows": [
    {
      "name": "Ana Torres",
      "total_orders": 4
    }
  ],
  "row_count": 1,
  "error": null
}
```

### `GET /api/history`

Returns recent query log entries.

### `GET /api/history/{id}`

Returns the details of one past query execution.

## Example questions

You can test the app with questions like:

- Which customer has the most completed orders?
- How many critical tickets are still open?
- What is the total revenue by city?
- Which customers placed more than three orders this month?

## Local development notes

This repository is designed to be reproducible through Docker Compose so the app, database, and supporting services start in a consistent way.

That makes it easier to:
- share the project publicly
- demo it in videos or articles
- test different model providers
- experiment without manually rebuilding the environment every time

## Limitations

This project is intentionally focused on clarity and experimentation, so there are still important limitations:

- It is not a full production system
- It does not implement role-based access control
- SQL validation is rule-based
- Query quality still depends on prompt quality and schema clarity
- pgvector is present as a foundation, but advanced retrieval is still future work
- The current workflow is best suited for demos, local experimentation, and internal prototypes

## Roadmap

Possible next steps include:

- hybrid retrieval using pgvector
- richer schema metadata for better prompting
- automatic retries for malformed SQL
- provider benchmarking using query logs
- CSV export
- authentication for private deployments
- evaluation datasets and prompt benchmarking

## Tech stack

- **Backend**: Python, FastAPI
- **Frontend**: HTML, CSS, JavaScript
- **Database**: PostgreSQL 16, pgvector
- **Infra**: Docker Compose
- **LLM providers**: OpenAI, DeepSeek, Gemini, Mock mode

## Repository purpose

This repository is useful if you want to:

- learn how a Text-to-SQL pipeline works end to end
- study safe SQL execution patterns
- build a chat-based database assistant
- experiment with multiple LLM providers
- add observability to AI query workflows

## References

This project was inspired by the following resources:

- Hugging Face smolagents: [https://github.com/huggingface/smolagents](https://github.com/huggingface/smolagents)
- Hugging Face Text-to-SQL example: [https://github.com/huggingface/smolagents/blob/main/docs/source/en/examples/text_to_sql.md](https://github.com/huggingface/smolagents/blob/main/docs/source/en/examples/text_to_sql.md)
- Union.ai tutorial: [https://www.union.ai/docs/byoc/tutorials/compound-ai-systems/text_to_sql_agent/](https://www.union.ai/docs/byoc/tutorials/compound-ai-systems/text_to_sql_agent/)

## License

Add your license here, for example:

```md
MIT
```