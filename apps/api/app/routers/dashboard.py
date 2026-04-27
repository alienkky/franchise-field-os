from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import CandidateActionUpdate, DashboardCandidate, SourceStat
from app.services.dashboard_service import (
    list_dashboard_candidates,
    list_sources,
    upsert_candidate_action,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/candidates", response_model=list[DashboardCandidate])
def dashboard_candidates(
    db: Session = Depends(get_db),
    max_rent: float | None = Query(None, description="월세 상한 (만원)"),
    preferred_area: float | None = Query(None, description="선호 면적 (㎡)"),
    region: str | None = Query(None, description="목표 지역 키워드"),
    business_type: str | None = Query(None, description="목표 업종 키워드"),
):
    return list_dashboard_candidates(
        db,
        max_rent=max_rent,
        preferred_area=preferred_area,
        region=region,
        business_type=business_type,
    )


@router.get("/sources", response_model=dict[str, SourceStat])
def dashboard_sources(db: Session = Depends(get_db)):
    return list_sources(db)


@router.patch("/candidates/{property_id}", response_model=DashboardCandidate)
def update_candidate_action(
    property_id: int,
    payload: CandidateActionUpdate,
    db: Session = Depends(get_db),
):
    row = upsert_candidate_action(
        db,
        property_id,
        status=payload.status,
        assignee=payload.assignee,
        memo=payload.memo,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="후보 매물을 찾을 수 없습니다.")
    return row
