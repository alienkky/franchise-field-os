from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PropertyListing
from app.schemas import PropertyListingCreate, PropertyListingRead

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=list[PropertyListingRead])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(PropertyListing).order_by(PropertyListing.id.desc()).all()


@router.post("", response_model=PropertyListingRead)
def create_candidate(payload: PropertyListingCreate, db: Session = Depends(get_db)):
    listing = PropertyListing(**payload.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing
