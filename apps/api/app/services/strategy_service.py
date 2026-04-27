from sqlalchemy.orm import Session

from app.models import Strategy

SINGLETON_ID = 1


def _serialize(strategy: Strategy | None) -> dict:
    if strategy is None:
        return {
            "region": "",
            "business_type": "",
            "max_deposit": None,
            "max_rent": None,
            "preferred_area": None,
            "updated_at": None,
        }
    return {
        "region": strategy.region,
        "business_type": strategy.business_type,
        "max_deposit": strategy.max_deposit,
        "max_rent": strategy.max_rent,
        "preferred_area": strategy.preferred_area,
        "updated_at": strategy.updated_at.isoformat() if strategy.updated_at else None,
    }


def get_strategy(db: Session) -> dict:
    strategy = db.query(Strategy).filter(Strategy.id == SINGLETON_ID).first()
    return _serialize(strategy)


def upsert_strategy(db: Session, payload: dict) -> dict:
    strategy = db.query(Strategy).filter(Strategy.id == SINGLETON_ID).first()
    if strategy is None:
        strategy = Strategy(id=SINGLETON_ID)
        db.add(strategy)

    strategy.region = payload.get("region") or ""
    strategy.business_type = payload.get("business_type") or ""
    strategy.max_deposit = payload.get("max_deposit")
    strategy.max_rent = payload.get("max_rent")
    strategy.preferred_area = payload.get("preferred_area")

    db.commit()
    db.refresh(strategy)
    return _serialize(strategy)
