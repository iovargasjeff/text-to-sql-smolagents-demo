# Text-to-SQL Agent con smolagents de Hugging Face

📖 Artículo completo paso a paso: https://dev.to/iovargasjeff/como-construir-un-agente-de-ia-que-habla-con-tu-base-de-datos-sql-con-smolagents-de-hugging-face-hcj

Este proyecto implementa un agente de inteligencia artificial capaz de traducir consultas en lenguaje natural a código SQL y ejecutarlas sobre una base de datos. Utiliza la librería `smolagents` de Hugging Face, lo que permite que el agente "piense en código" de forma autónoma, validando sus resultados y autocorrigiéndose si comete errores.

## ¿Por qué un agente y no un LLM directo?

Un LLM directo puede generar consultas SQL en un solo intento, pero carece de un mecanismo para validar si la consulta fue exitosa. Al utilizar un agente con `smolagents`:
* **Generación Iterativa**: Puede reintentar y corregir el SQL si hay errores.
* **Manejo de Errores**: Inspecciona la salida y se autocorrige, evitando fallos silenciosos.
* **Esquema Dinámico**: Conoce el esquema de las tablas a través de descripciones inyectadas dinámicamente, facilitando los JOINs y agregaciones complejas.
* **Auditabilidad**: El SQL ejecutado queda explícito y se puede guardar o monitorear en registros.

## Requisitos
- Python 3.10 o superior
- Un token de Hugging Face (para usar los modelos con inferencia API)

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/iovargasjeff/text-to-sql-smolagents-demo.git
cd text-to-sql-smolagents-demo
```

2. Crea y activa un entorno virtual:
```bash
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

4. Configura tus variables de entorno:
```bash
cp .env.example .env
```
Luego edita el archivo `.env` y coloca tu token real en `HF_TOKEN`.

## Uso

Cada archivo puede ejecutarse de manera independiente para comprobar su funcionamiento:

### 1. Probar la base de datos
```bash
python database.py
```
**Salida de ejemplo (real):**
```
--- Receipts ---
(1, 'Alan Payne', 12.06, 1.2)
(2, 'Alex Mason', 23.86, 0.24)
(3, 'Woodrow Wilson', 53.43, 5.43)
(4, 'Margaret James', 21.11, 1.0)
--- Waiters ---
(1, 'Corey Johnson')
(2, 'Michael Watts')
(3, 'Michael Watts')
(4, 'Margaret James')
```

### 2. Probar la extracción del esquema
```bash
python schema_utils.py
```

### 3. Probar la herramienta SQL y su seguridad
```bash
python sql_tool.py
```
**Salida de ejemplo (real, validando bloqueo de keywords):**
```
--- Test SELECT ---
(1, 'Alan Payne', 12.06, 1.2)
(2, 'Alex Mason', 23.86, 0.24)
(3, 'Woodrow Wilson', 53.43, 5.43)
(4, 'Margaret James', 21.11, 1.0)

--- Test Security (DROP) ---
Excepción capturada correctamente: Error de seguridad: La consulta contiene una palabra clave no permitida: DROP
```

### 4. Ejecutar el Agente
Asegúrate de que el token está configurado en tu archivo `.env`.
```bash
python agent.py
```
El agente intentará responder a tres preguntas usando razonamiento lógico: 
1. ¿Puedes darme el nombre del cliente con el recibo más caro?
2. ¿Qué mesero recibió más dinero en propinas en total?
3. Dime el nombre del mesero que atendió al cliente Woodrow Wilson y cuánto dejó de propina. *(Tercera pregunta añadida)*

## Estructura del proyecto

| Archivo | Propósito |
|---------|-----------|
| `database.py` | Crea el motor SQLite en memoria y pobla las tablas `receipts` y `waiters`. |
| `schema_utils.py` | Proporciona herramientas dinámicas (`inspect`) para leer el esquema de las tablas. |
| `sql_tool.py` | Define la herramienta central `@tool` con su lógica de ejecución y validación de seguridad. |
| `agent.py` | Instancia a los agentes (Llama-3.1 para tareas simples, Qwen-3 para JOINs) y lanza las preguntas. |
| `.env.example` | Plantilla segura para configurar el `HF_TOKEN`. |

## Seguridad

El uso de bases de datos junto con IAs generativas requiere protección estricta. Este proyecto incluye:
- **Validación de Consultas**: Filtramos sentencias maliciosas a nivel del código de Python, evitando palabras como `DROP`, `DELETE`, `UPDATE`, `INSERT` y `ALTER`.
- **Privilegio Mínimo**: El agente solo puede realizar operaciones `SELECT`.
- **Recomendaciones para Producción**: En entornos reales, utiliza usuarios de BD de solo lectura, conecta el LLM a vistas resumidas que omitan campos sensibles y añade `LIMIT` para evitar colapsos.

## Casos de uso reales

1. **Dashboards de analítica**: Los usuarios pueden consultar métricas directamente escribiendo preguntas, como "¿cuántos usuarios activos tuvimos la semana pasada?".
2. **Soporte al cliente**: Permite a un agente de atención recuperar el historial de un usuario sin dominar SQL.
3. **Analítica de negocio**: Democratiza el acceso a la información empresarial (ventas, stock) a personal sin perfil técnico.

## Referencias
- [Documentación oficial de Hugging Face smolagents – Text-to-SQL](https://huggingface.co/docs/smolagents/examples/text_to_sql)
- [Artículo original en Dev.to](https://dev.to/iovargasjeff/como-construir-un-agente-de-ia-que-habla-con-tu-base-de-datos-sql-con-smolagents-de-hugging-face-hcj)

---
**Autor:** Jefferson Vargas - [github.com/iovargasjeff](https://github.com/iovargasjeff)
