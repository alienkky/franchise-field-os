from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import StrategyPayload, StrategyRead
from app.services.strategy_service import get_strategy, upsert_strategy

router = APIRouter(prefix="/strategy", tags=["strategy"])


@router.get("", response_model=StrategyRead)
def read_strategy(db: Session = Depends(get_db)):
    return get_strategy(db)


@router.put("", response_model=StrategyRead)
def update_strategy(payload: StrategyPayload, db: Session = Depends(get_db)):
    return upsert_strategy(db, payload.model_dump())
