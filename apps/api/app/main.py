from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import candidates, dashboard, health, reports, strategy, upload
from app.services.seed_service import seed_sample_listings_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Franchise Field OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _seed_on_startup() -> None:
    db = SessionLocal()
    try:
        seed_sample_listings_if_empty(db)
    finally:
        db.close()


app.include_router(health.router)
app.include_router(candidates.router)
app.include_router(dashboard.router)
app.include_router(strategy.router)
app.include_router(upload.router)
app.include_router(reports.router)
