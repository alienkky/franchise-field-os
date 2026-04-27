from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ImportResult
from app.services.import_service import import_property_listings

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/listings", response_model=ImportResult)
async def upload_listings(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        imported, skipped = import_property_listings(db, file.filename or "", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ImportResult(
        imported=imported,
        skipped=skipped,
        message=f"{imported}건 등록, {skipped}건 제외",
    )
