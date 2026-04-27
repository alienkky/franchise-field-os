from io import BytesIO

import pandas as pd
from sqlalchemy.orm import Session

from app.models import PropertyListing

COLUMN_MAP = {
    "source": "source",
    "title": "title",
    "address": "address",
    "region": "region",
    "deposit": "deposit",
    "monthly_rent": "monthly_rent",
    "premium": "premium",
    "area_m2": "area_m2",
    "business_type": "business_type",
    "source_url": "source_url",
    "listed_at": "listed_at",
    "출처": "source",
    "매물명": "title",
    "주소": "address",
    "지역": "region",
    "보증금": "deposit",
    "월세": "monthly_rent",
    "권리금": "premium",
    "면적": "area_m2",
    "업종": "business_type",
    "URL": "source_url",
    "등록일": "listed_at",
}


def load_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    if filename.endswith(".csv"):
        return pd.read_csv(BytesIO(content))
    if filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(BytesIO(content))
    raise ValueError("CSV 또는 Excel 파일만 업로드할 수 있습니다.")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {column: COLUMN_MAP.get(str(column).strip(), column) for column in df.columns}
    df = df.rename(columns=renamed)
    required = {"title", "region"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"필수 컬럼이 없습니다: {', '.join(sorted(missing))}")

    for column in ["source", "address", "business_type", "source_url", "listed_at"]:
        if column not in df.columns:
            df[column] = ""
    for column in ["deposit", "monthly_rent", "premium", "area_m2"]:
        if column not in df.columns:
            df[column] = 0
        df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0)

    return df


def import_property_listings(db: Session, filename: str, content: bytes) -> tuple[int, int]:
    df = normalize_columns(load_dataframe(filename, content))
    imported = 0
    skipped = 0

    for _, row in df.iterrows():
        title = str(row.get("title", "")).strip()
        region = str(row.get("region", "")).strip()
        address = str(row.get("address", "")).strip()
        if not title or not region:
            skipped += 1
            continue

        duplicate = (
            db.query(PropertyListing)
            .filter(PropertyListing.title == title, PropertyListing.address == address)
            .first()
        )
        if duplicate:
            skipped += 1
            continue

        db.add(
            PropertyListing(
                source=str(row.get("source", "manual") or "manual"),
                title=title,
                address=address,
                region=region,
                deposit=float(row.get("deposit", 0) or 0),
                monthly_rent=float(row.get("monthly_rent", 0) or 0),
                premium=float(row.get("premium", 0) or 0),
                area_m2=float(row.get("area_m2", 0) or 0),
                business_type=str(row.get("business_type", "") or ""),
                source_url=str(row.get("source_url", "") or ""),
                listed_at=str(row.get("listed_at", "") or ""),
            )
        )
        imported += 1

    db.commit()
    return imported, skipped
