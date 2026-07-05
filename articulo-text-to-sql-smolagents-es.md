# Cómo construir un agente de IA que "habla" con tu base de datos SQL (con smolagents de Hugging Face)

*Por qué los agentes de IA que "piensan en código" son más seguros y confiables que un simple pipeline de prompt a consulta SQL.*

## Introducción

Escribir SQL a mano es una de esas habilidades que, sin querer, deja fuera a mucha gente de los datos: product managers, agentes de soporte e incluso desarrolladores junior muchas veces saben exactamente *qué* quieren preguntarle a una base de datos, pero no *cómo* expresarlo en SQL. Este es el problema que los sistemas **Text-to-SQL** intentan resolver: escribir una pregunta en lenguaje natural (inglés o español) y obtener datos reales de una base de datos real.

En este artículo construyo un pequeño pero completo **agente de IA Text-to-SQL** usando la librería [`smolagents` de Hugging Face](https://huggingface.co/docs/smolagents/examples/text_to_sql), explico por qué un *agente* es más confiable que un pipeline ingenuo de "el LLM escribe SQL y lo ejecutamos", recorro código real, y cubro las consideraciones de seguridad que necesitas antes de conectar algo así a una base de datos en producción.

El código fuente completo de este proyecto está disponible en el repositorio público enlazado al final de este artículo.

## ¿Por qué no simplemente pedirle el SQL a un LLM?

El pipeline Text-to-SQL más simple posible se ve así:

1. Enviar el esquema de la base de datos + la pregunta del usuario a un LLM.
2. Pedirle al LLM que devuelva una consulta SQL.
3. Ejecutar esa consulta y mostrar el resultado.

Esto funciona... hasta que deja de funcionar. El problema es que una sola llamada al LLM es **frágil**: el modelo puede generar una consulta sintácticamente válida pero semánticamente incorrecta (join equivocado, filtro equivocado, agregación equivocada), y aun así devolverá *un* resultado, solo que no el *correcto*. No hay ningún mecanismo integrado para verificar la respuesta o intentarlo de nuevo.

Esta es exactamente la "pregunta de oro" con la que abre la documentación de smolagents: ¿por qué no mantenerlo simple con un solo prompt? La respuesta es que un **agente** —algo capaz de razonar, invocar herramientas, observar el resultado y decidir si debe intentarlo de nuevo— es fundamentalmente más robusto para este tipo de tarea.

## ¿Qué es smolagents y qué significa "pensar en código"?

`smolagents` es un framework de agentes ligero de Hugging Face, descrito por sus propios mantenedores como "una librería minimalista para agentes que piensan en código". En lugar de forzar al modelo a producir llamadas a herramientas en JSON rígido, un `CodeAgent` escribe y ejecuta código Python real como parte de su ciclo de razonamiento:

1. **Pensar** — el modelo razona sobre qué hacer a continuación.
2. **Actuar** — escribe un fragmento de código Python que invoca una de las herramientas que le diste (en nuestro caso, una herramienta de ejecución SQL).
3. **Observar** — el resultado de ese código (la salida de la consulta) se reintegra al contexto del modelo.
4. **Repetir o responder** — el agente decide si tiene suficiente información para responder, o si necesita ajustar la consulta e intentar de nuevo.

Este ciclo es lo que hace que el agente sea autocorrectivo: si una consulta devuelve algo sospechoso (un resultado vacío, un número obviamente incorrecto), el modelo puede reescribir la consulta en lugar de devolver con confianza una respuesta equivocada.

## Construyendo el proyecto: una pequeña base de datos SQLite de "recibos"

Para mantener el ejemplo accesible, uso una base de datos SQLite en memoria con dos tablas pequeñas, la misma estructura usada en el ejemplo oficial de Text-to-SQL de smolagents.

### 1. Configurando la base de datos

```python
from sqlalchemy import (
    create_engine, MetaData, Table, Column,
    String, Integer, Float, insert, inspect, text
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
```

### 2. Describiendo el esquema para el agente

El agente necesita *saber* qué columnas existen antes de poder escribir SQL útil. Construimos esa descripción de forma dinámica en lugar de escribirla a mano:

```python
inspector = inspect(engine)
columns_info = [(col["name"], col["type"]) for col in inspector.get_columns("receipts")]

table_description = "Columns:\n"
for name, col_type in columns_info:
    table_description += f"  - {name}: {col_type}\n"

print(table_description)
```

### 3. Definiendo la herramienta SQL

Esta es la pieza central: una sola función de Python, decorada con `@tool`, que el agente tiene permitido invocar. Su docstring *es* la documentación que el modelo lee para entender cómo y cuándo usarla, así que debe ser precisa.

```python
from smolagents import tool

@tool
def sql_engine(query: str) -> str:
    """
    Permite realizar consultas SQL sobre la tabla 'receipts'.
    Devuelve una representación en texto del resultado.
    La tabla se llama 'receipts'. Su descripción es la siguiente:
        Columns:
        - receipt_id: INTEGER
        - customer_name: VARCHAR(16)
        - price: FLOAT
        - tip: FLOAT

    Args:
        query: La consulta SQL a ejecutar. Debe ser SQL válido.
    """
    output = ""
    with engine.connect() as con:
        rows = con.execute(text(query))
        for row in rows:
            output += "\n" + str(row)
    return output
```

### 4. Creando el agente

```python
from smolagents import CodeAgent, InferenceClientModel

agent = CodeAgent(
    tools=[sql_engine],
    model=InferenceClientModel(model_id="meta-llama/Llama-3.1-8B-Instruct"),
)

agent.run("¿Puedes darme el nombre del cliente con el recibo más caro?")
```

Por detrás, el agente escribe algo equivalente a:

```python
result = sql_engine(query="SELECT customer_name FROM receipts ORDER BY price DESC LIMIT 1")
print(result)
```

...observa el resultado, y solo entonces produce una respuesta en lenguaje natural: **"Woodrow Wilson tuvo el recibo más caro, de $53.43."**

### 5. Escalando: joins entre dos tablas

Una vez que introducimos una segunda tabla (`waiters`), simplemente extendemos el docstring de la herramienta para describir ambas tablas y cambiamos a un modelo de razonamiento más potente:

```python
updated_description = """Permite realizar consultas SQL sobre las tablas. Ten en cuenta que la salida de esta herramienta es una representación en texto de la ejecución.
Puede usar las siguientes tablas:"""

updated_description += table_description  # receipts

updated_description += """

Tabla 'waiters':
Columns:
  - receipt_id: INTEGER
  - waiter_name: VARCHAR(16)
"""

sql_engine.description = updated_description

agent = CodeAgent(
    tools=[sql_engine],
    model=InferenceClientModel(model_id="Qwen/Qwen3-Next-80B-A3B-Thinking"),
)

agent.run("¿Qué mesero recibió más dinero en propinas en total?")
```

Ahora el agente tiene que razonar sobre un join entre `receipts` y `waiters`, ejecutarlo e interpretar el resultado, todo sin que nosotros escribamos ese SQL manualmente.

## Prompt directo al LLM vs. agente que valida su trabajo

| | LLM directo → SQL | Agente con smolagents |
|---|---|---|
| Generación de consultas | Un solo intento, sin retroalimentación | Iterativa, puede reintentar |
| Manejo de errores | Puede devolver respuestas erróneas en silencio | Puede inspeccionar la salida y autocorregirse |
| Conocimiento del esquema | Inyectado de forma estática en el prompt | Docstring de la herramienta, actualizable dinámicamente |
| Razonamiento multi-paso (joins, agregaciones) | Débil, propenso a errores | Más sólido, especialmente con modelos grandes |
| Auditabilidad | La consulta suele quedar oculta dentro de un prompt/respuesta | La consulta es código explícito, fácil de registrar (log) |

La conclusión clave: un agente no elimina los errores, pero le da al sistema la oportunidad de *notarlos* y *reaccionar* ante ellos en lugar de devolver con confianza un número incorrecto.

## Seguridad: no te saltes esta sección

Permitir que un modelo de IA genere y ejecute SQL contra una base de datos real es poderoso, y peligroso si se deja sin control. Antes de lanzar algo así, hay que atender:

- **Acceso de solo lectura.** La herramienta solo debería poder ejecutar sentencias `SELECT`. Hay que bloquear o filtrar `DROP`, `DELETE`, `UPDATE`, `INSERT` y `ALTER` a nivel de la herramienta, no solo "pidiéndoselo amablemente" en el prompt.
- **Usuarios de base de datos con mínimo privilegio.** Conectar mediante un rol que solo pueda ver las vistas/tablas que realmente necesita, nunca el superusuario de producción.
- **Vistas en lugar de tablas crudas.** Exponer vistas curadas con solo las columnas relevantes para el caso de uso, ocultando por completo campos sensibles (datos personales, costos internos, etc.).
- **Límites en las consultas.** Forzar cláusulas `LIMIT` y timeouts para que una consulta mal formada o demasiado amplia no escanee millones de filas ni cuelgue la conexión.
- **Registro y auditoría.** Como la "acción" del agente es código literal y legible, conviene registrar cada consulta generada y su resultado; esto es más sencillo aquí que con llamadas a herramientas en JSON opaco.

## Casos de uso reales

- **Dashboards de analítica** — en lugar de construir un gráfico para cada pregunta posible, dejar que los usuarios pregunten "¿cuántos registros nuevos tuvimos la semana pasada por región?" y generar la consulta de agregación al vuelo.
- **Herramientas de soporte al cliente** — los agentes de soporte pueden preguntar "muéstrame los últimos 5 tickets de este usuario" sin necesidad de conocer el esquema del sistema de tickets.
- **Inteligencia de negocio interna** — personas no técnicas pueden explorar datos de ventas, inventario o uso de forma conversacional, dejando que el agente maneje los joins y las agregaciones.
- **Herramientas para desarrolladores** — exploración rápida de datos durante debugging, sin escribir scripts SQL desechables a mano.

## Conclusión

Text-to-SQL es un gran ejemplo de un caso donde "simplemente llamar a un LLM" no es suficiente: la diferencia entre un prompt de un solo intento y un verdadero ciclo de agente es la diferencia entre una demo y algo en lo que realmente confiarías con datos reales. El enfoque "código primero" de `smolagents` hace que ese ciclo sea transparente, inspeccionable y, con las protecciones adecuadas, genuinamente viable para producción.

**Repositorio:** el código completo y funcional de este proyecto (configuración de la base de datos, definición de la herramienta y configuración del agente) está disponible aquí: `github.com/<tu-usuario>/text-to-sql-smolagents-demo`

**Video demostrativo:** un video corto mostrando al agente respondiendo preguntas en lenguaje natural sobre la base de datos de ejemplo está enlazado arriba.

---

*Referencias: [Documentación de Hugging Face smolagents – Text-to-SQL](https://huggingface.co/docs/smolagents/examples/text_to_sql), [Repositorio de GitHub de smolagents](https://github.com/huggingface/smolagents)*
