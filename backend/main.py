"""
: 3D ULPIN Generation and Vertical Property Mapping System
Main FastAPI Application Entrypoint with Lifespan Management
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from db.database import init_db, get_db
from api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and auto-seed if empty
    init_db()
    db = get_db()
    if db.count_parcels() == 0:
        from api.routes import seed_complex
        seed_complex()
    yield
    # Shutdown logic if needed

app = FastAPI(

    title="3D ULPIN & Volumetric Cadastral Mapping Engine ()",

    description="ISO 19152 (LADM) Compliant 3D Cadastral Spatial Engine for Vertical Property Mapping",

    version="2.0.0",

    lifespan=lifespan,

    docs_url=None,

    redoc_url=None,

    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API endpoints
app.include_router(api_router, prefix="/api", tags=["3D Cadastre API"])

# Frontend directory path
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
os.makedirs(FRONTEND_DIR, exist_ok=True)

# Mount static frontend assets
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

@app.get("/app.js")
def serve_app_js():
    js_path = os.path.join(FRONTEND_DIR, "app.js")
    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript")
    return {"error": "app.js not found"}

@app.get("/sample_blueprint.png")
def serve_sample_blueprint():
    img_path = os.path.join(FRONTEND_DIR, "sample_blueprint.png")
    if os.path.exists(img_path):
        return FileResponse(img_path, media_type="image/png")
    return {"error": "sample_blueprint.png not found"}

@app.get("/")
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "3D ULPIN Cadastral Engine API running. Navigate to /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
