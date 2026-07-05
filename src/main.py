import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.api import router
from src import config

app = FastAPI(title="Text-to-SQL Lab FASE 2")

# Incluir las rutas de la API
app.include_router(router)

# Servir Frontend Estático
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

app.mount("/", StaticFiles(directory=frontend_dir), name="frontend")

def main():
    print(f"Iniciando servidor en el puerto {config.APP_PORT}...")
    uvicorn.run("src.main:app", host="0.0.0.0", port=config.APP_PORT, reload=(config.APP_ENV == "development"))

if __name__ == "__main__":
    main()
