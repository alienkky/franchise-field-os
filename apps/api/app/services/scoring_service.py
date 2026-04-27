from app.models import FranchiseBrand, PropertyListing


def clamp_score(value: int, maximum: int) -> int:
    return max(0, min(value, maximum))


def score_candidate(
    listing: PropertyListing,
    brand: FranchiseBrand | None = None,
    max_monthly_rent: float = 600,
    preferred_area_m2: float = 45,
    target_region: str = "",
    target_business_type: str = "",
) -> dict[str, int]:
    rent_score = 25 if listing.monthly_rent <= max_monthly_rent else 12
    area_gap = abs(listing.area_m2 - (brand.preferred_area_m2 if brand else preferred_area_m2))
    area_score = clamp_score(20 - int(area_gap // 5) * 3, 20)
    region_source = brand.target_region if brand and brand.target_region else target_region
    region_score = 20 if region_source and region_source in listing.region else 10
    type_score = 15 if target_business_type and target_business_type in listing.business_type else 8
    brand_fit_score = 20 if brand and brand.category in listing.business_type else 12
    total_score = rent_score + area_score + region_score + type_score + brand_fit_score

    return {
        "rent_score": rent_score,
        "area_score": area_score,
        "region_score": region_score,
        "business_type_score": type_score,
        "brand_fit_score": brand_fit_score,
        "total_score": total_score,
    }
