from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class PropertyListing(Base):
    __tablename__ = "property_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(80), default="manual")
    title: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300), default="")
    region: Mapped[str] = mapped_column(String(100), index=True)
    deposit: Mapped[float] = mapped_column(Float, default=0)
    monthly_rent: Mapped[float] = mapped_column(Float, default=0)
    premium: Mapped[float] = mapped_column(Float, default=0)
    area_m2: Mapped[float] = mapped_column(Float, default=0)
    business_type: Mapped[str] = mapped_column(String(100), default="")
    source_url: Mapped[str] = mapped_column(String(500), default="")
    listed_at: Mapped[str] = mapped_column(String(40), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FranchiseBrand(Base):
    __tablename__ = "franchise_brands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    brand_name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    average_startup_cost: Mapped[float] = mapped_column(Float, default=0)
    preferred_area_m2: Mapped[float] = mapped_column(Float, default=0)
    target_region: Mapped[str] = mapped_column(String(160), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ScoredCandidate(Base):
    __tablename__ = "scored_candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("property_listings.id"))
    brand_id: Mapped[int | None] = mapped_column(ForeignKey("franchise_brands.id"), nullable=True)
    rent_score: Mapped[int] = mapped_column(Integer, default=0)
    area_score: Mapped[int] = mapped_column(Integer, default=0)
    region_score: Mapped[int] = mapped_column(Integer, default=0)
    business_type_score: Mapped[int] = mapped_column(Integer, default=0)
    brand_fit_score: Mapped[int] = mapped_column(Integer, default=0)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(40), default="pending")
    assignee: Mapped[str] = mapped_column(String(80), default="")
    memo: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    property: Mapped[PropertyListing] = relationship()
    brand: Mapped[FranchiseBrand | None] = relationship()


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(80), default="myfranchise")
    status: Mapped[str] = mapped_column(String(40), default="pending")
    message: Mapped[str] = mapped_column(Text, default="")
    screenshot_path: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
