from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PropertyListing
from app.schemas import (
    BulkCandidatePayload,
    BulkCandidateResult,
    BulkResultItem,
    PropertyListingCreate,
    PropertyListingRead,
)

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=list[PropertyListingRead])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(PropertyListing).order_by(PropertyListing.id.desc()).all()


@router.post("", response_model=PropertyListingRead, status_code=201)
def create_candidate(payload: PropertyListingCreate, db: Session = Depends(get_db)):
    title = payload.title.strip()
    address = (payload.address or "").strip()
    if not title or not payload.region.strip():
        raise HTTPException(status_code=400, detail="title과 region은 필수입니다.")

    duplicate_query = db.query(PropertyListing).filter(PropertyListing.title == title)
    if payload.source_url:
        duplicate = duplicate_query.filter(PropertyListing.source_url == payload.source_url).first()
    else:
        duplicate = duplicate_query.filter(PropertyListing.address == address).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "이미 등록된 매물입니다.",
                "existing_id": duplicate.id,
            },
        )

    data = payload.model_dump()
    data["title"] = title
    data["address"] = address
    listing = PropertyListing(**data)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def _find_duplicate(db: Session, title: str, address: str, source_url: str) -> PropertyListing | None:
    q = db.query(PropertyListing).filter(PropertyListing.title == title)
    if source_url:
        return q.filter(PropertyListing.source_url == source_url).first()
    return q.filter(PropertyListing.address == address).first()


@router.post("/bulk", response_model=BulkCandidateResult, status_code=200)
def bulk_create_candidates(payload: BulkCandidatePayload, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="items가 비어있습니다.")

    imported = 0
    skipped = 0
    results: list[BulkResultItem] = []

    # 같은 페이로드 안에서의 중복도 차단
    seen_keys: set[tuple[str, str]] = set()

    for entry in payload.items:
        title = entry.title.strip()
        region = entry.region.strip()
        address = (entry.address or "").strip()
        source_url = entry.source_url or ""

        if not title or not region:
            skipped += 1
            results.append(BulkResultItem(title=title, status="invalid", detail="title/region 필수"))
            continue

        key = (title, source_url or address)
        if key in seen_keys:
            skipped += 1
            results.append(BulkResultItem(title=title, status="duplicate", detail="페이로드 내 중복"))
            continue
        seen_keys.add(key)

        duplicate = _find_duplicate(db, title, address, source_url)
        if duplicate:
            skipped += 1
            results.append(BulkResultItem(title=title, status="duplicate", id=duplicate.id))
            continue

        data = entry.model_dump()
        data["title"] = title
        data["address"] = address
        listing = PropertyListing(**data)
        db.add(listing)
        db.flush()
        imported += 1
        results.append(BulkResultItem(title=title, status="created", id=listing.id))

    db.commit()
    return BulkCandidateResult(imported=imported, skipped=skipped, items=results)
