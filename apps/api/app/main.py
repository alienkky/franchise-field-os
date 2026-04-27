from fastapi import FastAPI

from app.database import Base, engine
from app.routers import candidates, health

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Franchise Field OS API")
app.include_router(health.router)
app.include_router(candidates.router)
