from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ReportResult
from app.services.report_service import create_candidate_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/candidate-report", response_model=ReportResult)
def generate_candidate_report(db: Session = Depends(get_db)):
    report_path, row_count = create_candidate_report(db)
    return ReportResult(report_path=report_path, row_count=row_count)
