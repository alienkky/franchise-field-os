from pydantic import BaseModel


class PropertyListingCreate(BaseModel):
    source: str = "manual"
    title: str
    address: str = ""
    region: str
    deposit: float = 0
    monthly_rent: float = 0
    premium: float = 0
    area_m2: float = 0
    business_type: str = ""
    source_url: str = ""
    listed_at: str = ""


class PropertyListingRead(PropertyListingCreate):
    id: int

    class Config:
        from_attributes = True


class ScoredCandidateRead(BaseModel):
    id: int
    property_id: int
    total_score: int
    status: str
    assignee: str
    memo: str

    class Config:
        from_attributes = True


class ImportResult(BaseModel):
    imported: int
    skipped: int
    message: str


class ReportResult(BaseModel):
    report_path: str
    row_count: int


class DashboardCandidate(BaseModel):
    id: int
    title: str
    region: str
    cost: str
    area: str
    owner: str
    status: str
    score: int
    fit: str
    memo: str
    type: str


class CandidateActionUpdate(BaseModel):
    status: str | None = None
    assignee: str | None = None
    memo: str | None = None


class SourceStat(BaseModel):
    count: int
    last_seen: str | None = None


class StrategyPayload(BaseModel):
    region: str = ""
    business_type: str = ""
    max_deposit: float | None = None
    max_rent: float | None = None
    preferred_area: float | None = None


class StrategyRead(StrategyPayload):
    updated_at: str | None = None


class BulkResultItem(BaseModel):
    title: str
    status: str  # "created" | "duplicate" | "invalid"
    id: int | None = None
    detail: str | None = None


class BulkCandidatePayload(BaseModel):
    items: list[PropertyListingCreate]


class BulkCandidateResult(BaseModel):
    imported: int
    skipped: int
    items: list[BulkResultItem]
