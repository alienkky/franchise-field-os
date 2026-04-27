from pathlib import Path

from sqlalchemy.orm import Session

from app.models import PropertyListing
from app.services.import_service import import_property_listings

ROOT = Path(__file__).resolve().parents[4]
SAMPLE_CSV = ROOT / "sample-data" / "property-listings.csv"


def seed_sample_listings_if_empty(db: Session) -> int:
    if db.query(PropertyListing).count() > 0:
        return 0
    if not SAMPLE_CSV.exists():
        return 0
    imported, _ = import_property_listings(db, SAMPLE_CSV.name, SAMPLE_CSV.read_bytes())
    return imported
