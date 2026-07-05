# Text-to-SQL con PostgreSQL y pgvector (Fase 1)

Este es un laboratorio backend sólido para demostrar soluciones de Text-to-SQL e Inteligencia Artificial usando **PostgreSQL**, la extensión **pgvector**, y una arquitectura agnóstica de proveedor de IA.

## Descripción de la Fase 1
El objetivo de la Fase 1 es crear una fundación sólida y reproducible usando contenedores Docker. Aún no cuenta con una interfaz web ni integra *smolagents* directamente, pero la arquitectura está preparada para que sea fácil extender en la **Fase 2**.

Se incluye:
- Backend funcional en Python.
- Ejecución completa vía `docker-compose`.
- PostgreSQL con `pgvector`.
- Migraciones y carga de datos automática.
- Integración de proveedores de modelos de lenguaje (OpenAI, DeepSeek, Gemini).
- Un modo "mock" para pruebas sin API keys.
- Scripts de validación de seguridad para bloquear comandos SQL destructivos.

## ¿Por qué PostgreSQL y pgvector?
PostgreSQL es un estándar en la industria por su confiabilidad y compatibilidad. Con la extensión `pgvector`, podemos almacenar y hacer búsquedas semánticas (búsqueda vectorial) directamente dentro de nuestra base de datos relacional. Esto nos permite unificar datos de negocio estructurados y búsquedas basadas en IA sin necesidad de un motor de base de datos vectorial externo (como Pinecone o Weaviate).

## Cómo Configurar
1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` para incluir tus API Keys. Si no tienes ninguna, puedes dejar `MODEL_PROVIDER=mock` para probar las consultas de demostración precargadas.

## Cómo Levantar el Proyecto
Asegúrate de tener Docker y Docker Compose instalados, y luego corre:
```bash
docker compose up --build
```
Esto levantará:
- Un contenedor con PostgreSQL y pgvector, aplicando migraciones e insertando datos de prueba.
- Un contenedor con la aplicación Python que esperará a la base de datos y quedará en espera.

## Cómo Correr Ejemplos (CLI)
Una vez que los contenedores estén corriendo, usa `docker exec` para interactuar con la aplicación:

### Ejemplos Text-to-SQL
```bash
docker exec -it text2sql_app python src/agent.py sql "¿Qué cliente tiene más órdenes completadas?"
docker exec -it text2sql_app python src/agent.py sql "¿Cuántos tickets críticos siguen abiertos?"
docker exec -it text2sql_app python src/agent.py sql "¿Qué clientes hicieron pedidos pendientes?"
```

### Ejemplo Vector Search
Para probar la búsqueda por similitud vectorial (usando un vector de prueba de 4 dimensiones):
```bash
docker exec -it text2sql_app python src/agent.py vector "0.1,0.2,0.3,0.4"
```

## Limitaciones de la Fase 1
- **Solo CLI**: No hay un frontend web.
- **Sin framework complejo de agentes**: Las integraciones de orquestación complejas se aplazaron para mantener el foco en la solidez del flujo básico de datos.
- **Vectores Dummy**: Se usa un modelo de 4 dimensiones para demostrar pgvector sin integrar un modelo de embeddings real aún.

## Plan para la Fase 2
En la siguiente fase se construirá:
- Una interfaz web interactiva.
- Integración nativa de `smolagents` para un flujo de agente autónomo, toma de decisiones y encadenamiento de herramientas más avanzado.
- Embeddings reales para los chunks de conocimiento.
