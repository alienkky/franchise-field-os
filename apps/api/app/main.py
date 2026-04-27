from fastapi import FastAPI

from app.database import Base, engine
from app.routers import candidates, health, reports, upload

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Franchise Field OS API")
app.include_router(health.router)
app.include_router(candidates.router)
app.include_router(upload.router)
app.include_router(reports.router)
