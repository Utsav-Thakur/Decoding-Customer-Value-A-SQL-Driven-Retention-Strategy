# ============================================================
# BrandIQ — Pydantic Schemas
# Response models for all FastAPI endpoints.
# ============================================================

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union

# ─── Shared primitives ────────────────────────────────────

class SegmentSummary(BaseModel):
    name: str
    count: int
    pct_of_base: float
    avg_spend: float
    avg_previous_purchases: float
    avg_loyalty_score: float
    avg_promo_dependency: float
    top_category: str
    top_location: str


class StateDetail(BaseModel):
    state: str
    customer_count: int
    total_spend: float
    avg_spend: float
    avg_loyalty: float
    avg_promo_dependency: float
    churn_risk_count: int
    platinum_count: int
    subscriber_count: int
    opportunity_score: float
    opportunity_tier: str  # "High" | "Medium" | "Low"


class CategoryDetail(BaseModel):
    category: str
    customer_count: int
    pct_of_base: float
    avg_spend: float
    total_spend: float
    avg_loyalty: float
    avg_promo_dependency: float
    avg_previous_purchases: float
    avg_rating: float
    churn_risk_count: int
    platinum_count: int
    repeat_buyer_index: float
    role: str  # "Retention Driver" | "Acquisition Channel"


class ComparisonRow(BaseModel):
    metric: str
    ideal_avg: float
    base_avg: float
    delta: float
    multiplier: float
    direction: str  # "higher" | "lower"


class RetentionAction(BaseModel):
    priority: int
    action: str
    segment: str
    segment_size: int
    timeline: str
    tactic: str
    trade_off: str
    projected_impact: str
    risk_level: str

# ─── Paginated customers ──────────────────────────────────

class PaginatedCustomers(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    data: List[Dict[str, Any]]

# ─── GET /api/stats ───────────────────────────────────────

class StatsResponse(BaseModel):
    total_customers: int
    avg_spend: float
    avg_loyalty_score: float
    avg_previous_purchases: float
    avg_review_rating: float
    avg_promo_dependency: float
    total_revenue: float
    subscriber_count: int
    subscriber_pct: float
    churn_risk_count: int
    churn_risk_pct: float
    promo_trap_count: int
    ideal_customer_count: int
    ideal_customer_pct: float
    tier_breakdown: Dict[str, int]
    gender_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]
    state_analysis: List[Dict[str, Any]]
    category_analysis: List[Dict[str, Any]]
    ideal_profile: Dict[str, Any]

# ─── GET /api/segments ────────────────────────────────────

class SegmentsResponse(BaseModel):
    total_customers: int
    loyal: SegmentSummary
    promo_trappers: SegmentSummary
    discount_dependent: SegmentSummary
    dormant: SegmentSummary
    churn_risk: SegmentSummary

# ─── GET /api/geographic ──────────────────────────────────

class GeographicResponse(BaseModel):
    total_states: int
    states: List[StateDetail]
    top_opportunity: List[StateDetail]
    national_avg_spend: float
    national_avg_promo: float

# ─── GET /api/categories ──────────────────────────────────

class CategoriesResponse(BaseModel):
    total_categories: int
    categories: List[CategoryDetail]
    entry_category: str
    retention_category: str

# ─── GET /api/ideal-profile ───────────────────────────────

class IdealProfileResponse(BaseModel):
    icp_count: int
    icp_pct_of_base: float
    avg_age: float
    top_gender: str
    top_category: str
    top_payment: str
    top_states: List[str]
    avg_spend: float
    avg_loyalty_score: float
    avg_previous_purchases: float
    avg_frequency_score: float
    avg_review_rating: float
    promo_dependency: float
    prev_purchase_multiplier: float
    comparison_table: List[ComparisonRow]
    acquisition_strategy: str

# ─── GET /api/retention-plan ──────────────────────────────

class RetentionPlanResponse(BaseModel):
    total_customers: int
    promo_trappers: int
    promo_trappers_revenue: float
    discount_dependent: int
    loyal_customers: int
    churn_at_risk: int
    high_value_churn_risk: int
    projected_margin_recovery: float
    actions: List[RetentionAction]

# ─── POST /api/upload ─────────────────────────────────────

class UploadResponse(BaseModel):
    rows_processed: int
    columns_detected: List[str]
    tier_breakdown: Dict[str, int]
    avg_spend: float
    avg_loyalty: float
    churn_risk_count: int
    promo_trap_count: int
    customers: List[Dict[str, Any]]

# ─── POST /api/predict — Request ─────────────────────────

class PredictRequest(BaseModel):
    age: int = Field(..., ge=18, le=100, description="Customer age in years")
    gender: str = Field(..., description="Male or Female")
    category: str = Field(..., description="Clothing, Footwear, Outerwear, Accessories")
    purchase_amount: float = Field(..., ge=0, description="Purchase amount in USD")
    review_rating: float = Field(..., ge=1.0, le=5.0, description="Review rating 1–5")
    previous_purchases: int = Field(..., ge=0, description="Number of prior orders")
    frequency_of_purchases: str = Field(
        "Monthly",
        description="Daily | Weekly | Fortnightly | Monthly | Quarterly | Bi-Annually | Annually"
    )
    discount_applied: bool = Field(False, description="Was a discount applied?")
    promo_code_used: bool = Field(False, description="Was a promo code used?")
    subscription_status: bool = Field(False, description="Is customer a subscriber?")
    item_purchased: Optional[str] = Field(None)
    location: Optional[str] = Field(None)
    size: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    season: Optional[str] = Field(None)
    shipping_type: Optional[str] = Field(None)
    payment_method: Optional[str] = Field(None)

# ─── POST /api/predict — Response ────────────────────────

class PredictResponse(BaseModel):
    value_tier: str = Field(..., description="Bronze | Silver | Gold | Platinum")
    composite_value: float = Field(..., description="Composite score 0.0–1.0")
    loyalty_score: float = Field(..., description="Loyalty score 0–100")
    promo_dependency: float = Field(..., description="Promo dependency 0.0–1.0")
    churn_risk: bool = Field(..., description="Is this customer at churn risk?")
    high_value_no_promo: bool = Field(..., description="Is this an ideal ICP customer?")
    promo_trap: bool = Field(..., description="Is this customer in the promo trap?")
    spend_efficiency: float = Field(..., description="Purchase amount / (previous_purchases + 1)")
    percentile: int = Field(..., description="Percentile rank vs existing base (0–100)")
    recommended_action: str = Field(..., description="Specific recommended CRM action")
    reasoning: str = Field(..., description="Plain-English explanation of the prediction")
