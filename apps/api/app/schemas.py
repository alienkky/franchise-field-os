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
