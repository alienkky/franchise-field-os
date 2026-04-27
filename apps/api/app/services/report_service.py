from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.models import PropertyListing

ROOT = Path(__file__).resolve().parents[4]
REPORT_DIR = ROOT / "data" / "reports"


def create_candidate_report(db: Session) -> tuple[str, int]:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    listings = db.query(PropertyListing).order_by(PropertyListing.created_at.desc()).all()
    rows = [
        {
            "매물명": item.title,
            "지역": item.region,
            "주소": item.address,
            "보증금": item.deposit,
            "월세": item.monthly_rent,
            "권리금": item.premium,
            "면적": item.area_m2,
            "업종": item.business_type,
            "출처": item.source,
            "URL": item.source_url,
            "등록일": item.listed_at,
        }
        for item in listings
    ]
    output_path = REPORT_DIR / "candidate-report.xlsx"
    pd.DataFrame(rows).to_excel(output_path, index=False)
    return str(output_path), len(rows)
