from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import PropertyListing, ScoredCandidate
from app.services.scoring_service import score_candidate


def list_sources(db: Session) -> dict[str, dict]:
    rows = (
        db.query(
            PropertyListing.source,
            func.count(PropertyListing.id),
            func.max(PropertyListing.created_at),
        )
        .group_by(PropertyListing.source)
        .all()
    )
    return {
        (source or "manual"): {
            "count": int(count),
            "last_seen": last.isoformat() if last else None,
        }
        for source, count, last in rows
    }


def _format_cost(deposit: float, monthly_rent: float) -> str:
    if deposit >= 10000:
        deposit_text = f"{deposit / 10000:.1f}억".replace(".0억", "억")
    elif deposit > 0:
        deposit_text = f"{int(deposit / 1000)}천" if deposit >= 1000 else f"{int(deposit)}만"
    else:
        deposit_text = "보증금 미정"
    rent_text = f"월세 {int(monthly_rent)}만" if monthly_rent else "월세 협의"
    prefix = "보증금 " if deposit > 0 else ""
    return f"{prefix}{deposit_text} · {rent_text}"


def _format_area(area_m2: float) -> str:
    if not area_m2:
        return "면적 미정"
    return f"{area_m2:g}㎡"


def _fit_text(business_type: str) -> str:
    if not business_type:
        return "업종 미지정"
    if "카페" in business_type or "디저트" in business_type:
        return "카페/디저트 적합"
    if "외식" in business_type:
        return "외식 브랜드 적합"
    return f"{business_type} 적합"


def _filter_type(score: int, status: str) -> str:
    if score >= 85:
        return "hot"
    if status in {"대기", "pending"}:
        return "pending"
    return "all"


def _candidate_row(
    listing: PropertyListing,
    sc: ScoredCandidate | None,
    *,
    strategy: dict | None = None,
) -> dict:
    if strategy:
        scores = score_candidate(listing, **strategy)
        total_score = scores["total_score"]
    elif sc:
        total_score = sc.total_score
    else:
        total_score = score_candidate(listing)["total_score"]

    if sc:
        status = sc.status or "검토중"
        assignee = sc.assignee or "미배정"
        memo = sc.memo or ""
    else:
        status = "대기"
        assignee = "미배정"
        memo = ""

    return {
        "id": listing.id,
        "title": listing.title,
        "region": listing.region,
        "cost": _format_cost(listing.deposit, listing.monthly_rent),
        "area": _format_area(listing.area_m2),
        "owner": assignee,
        "status": status,
        "score": total_score,
        "fit": _fit_text(listing.business_type),
        "memo": memo or f"{listing.business_type or '업종 미지정'} 매물 — 추가 검토 필요",
        "type": _filter_type(total_score, status),
    }


def list_dashboard_candidates(
    db: Session,
    *,
    max_rent: float | None = None,
    preferred_area: float | None = None,
    region: str | None = None,
    business_type: str | None = None,
) -> list[dict]:
    listings = db.query(PropertyListing).order_by(PropertyListing.id.desc()).all()
    if not listings:
        return []
    scored_map = {
        sc.property_id: sc
        for sc in db.query(ScoredCandidate)
        .filter(ScoredCandidate.property_id.in_([listing.id for listing in listings]))
        .all()
    }

    strategy: dict | None = None
    if any(v is not None and v != "" for v in (max_rent, preferred_area, region, business_type)):
        strategy = {}
        if max_rent is not None:
            strategy["max_monthly_rent"] = max_rent
        if preferred_area is not None:
            strategy["preferred_area_m2"] = preferred_area
        if region:
            strategy["target_region"] = region
        if business_type:
            strategy["target_business_type"] = business_type

    return [_candidate_row(listing, scored_map.get(listing.id), strategy=strategy) for listing in listings]


def upsert_candidate_action(
    db: Session,
    property_id: int,
    *,
    status: str | None = None,
    assignee: str | None = None,
    memo: str | None = None,
) -> dict | None:
    listing = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if not listing:
        return None

    sc = (
        db.query(ScoredCandidate)
        .filter(ScoredCandidate.property_id == property_id)
        .first()
    )
    if sc is None:
        scores = score_candidate(listing)
        sc = ScoredCandidate(property_id=property_id, **scores)
        db.add(sc)

    if status is not None:
        sc.status = status
    if assignee is not None:
        sc.assignee = assignee
    if memo is not None:
        sc.memo = memo

    db.commit()
    db.refresh(sc)
    return _candidate_row(listing, sc)
