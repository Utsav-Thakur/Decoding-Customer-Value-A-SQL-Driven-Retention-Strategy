# ============================================================
# BrandIQ FastAPI Backend
# Serves pre-computed customer intelligence data.
# AI logic lives entirely in React — no AI endpoints here.
# ============================================================

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
from typing import Optional, List

from feature_engineering import engineer_features, compute_stats
from schemas import (
    CustomerResponse, StatsResponse, SegmentsResponse,
    GeographicResponse, CategoriesResponse, IdealProfileResponse,
    RetentionPlanResponse, UploadResponse, PredictRequest, PredictResponse,
    PaginatedCustomers
)

# ─── App init ─────────────────────────────────────────────

app = FastAPI(
    title="BrandIQ Customer Intelligence API",
    description="Zero-AI backend serving pre-computed customer analytics for BrandIQ.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup: load & engineer base dataset ────────────────

CUSTOMERS_DF: pd.DataFrame = pd.DataFrame()

@app.on_event("startup")
async def load_data():
    global CUSTOMERS_DF
    try:
        raw = pd.read_csv("Dataset.csv")
        CUSTOMERS_DF = engineer_features(raw)
        print(f"[BrandIQ] Loaded {len(CUSTOMERS_DF)} customers from Dataset.csv")
    except FileNotFoundError:
        print("[BrandIQ] WARNING: Dataset.csv not found. Endpoints will return empty data.")
        CUSTOMERS_DF = pd.DataFrame()

# ─── Helper: safe df to records ───────────────────────────

def df_to_records(df: pd.DataFrame) -> list:
    """Convert DataFrame to JSON-serializable list of dicts."""
    return df.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")

# ─── GET /api/customers ───────────────────────────────────

@app.get("/api/customers", response_model=PaginatedCustomers)
async def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    tier: Optional[str] = Query(None, description="Filter by value_tier: Platinum, Gold, Silver, Bronze"),
    segment: Optional[str] = Query(None, description="Filter by segment: promo_trap, churn_risk, high_value, dormant"),
    gender: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_spend: Optional[float] = Query(None),
    max_spend: Optional[float] = Query(None),
):
    if CUSTOMERS_DF.empty:
        return PaginatedCustomers(total=0, page=page, limit=limit, pages=0, data=[])

    df = CUSTOMERS_DF.copy()

    # Apply filters
    if tier:
        df = df[df["value_tier"] == tier]
    if segment == "promo_trap":
        df = df[df["promo_trap"] == 1]
    elif segment == "churn_risk":
        df = df[df["churn_risk"] == True]
    elif segment == "high_value":
        df = df[df["high_value_no_promo"] == 1]
    elif segment == "dormant":
        df = df[(df["frequency_score"] <= 2) & (df["previous_purchases"] < 5)]
    elif segment == "loyal":
        df = df[(df["loyalty_score"] >= 0.55) & (df["promo_dependency_score"] <= 0.2)]
    if gender:
        df = df[df["gender"].str.lower() == gender.lower()]
    if category:
        df = df[df["category"].str.lower() == category.lower()]
    if location:
        df = df[df["location"].str.lower().str.contains(location.lower())]
    if min_spend is not None:
        df = df[df["purchase_amount"] >= min_spend]
    if max_spend is not None:
        df = df[df["purchase_amount"] <= max_spend]

    total = len(df)
    pages = max(1, int(np.ceil(total / limit)))
    offset = (page - 1) * limit
    page_df = df.iloc[offset: offset + limit]

    return PaginatedCustomers(
        total=total, page=page, limit=limit, pages=pages,
        data=df_to_records(page_df)
    )

# ─── GET /api/stats ───────────────────────────────────────

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    stats = compute_stats(CUSTOMERS_DF)
    return StatsResponse(**stats)

# ─── GET /api/segments ────────────────────────────────────

@app.get("/api/segments", response_model=SegmentsResponse)
async def get_segments():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    df = CUSTOMERS_DF
    total = len(df)
    median_prev = float(df["previous_purchases"].median())
    avg_prev = float(df["previous_purchases"].mean())

    loyal = df[(df["loyalty_score"] >= 0.55) & (df["promo_dependency_score"] <= 0.2)]
    promo_trap = df[df["promo_trap"] == 1]
    discount_dep = df[(df["promo_dependency_score"] >= 0.5) & (df["previous_purchases"] >= avg_prev * 0.8)]
    dormant = df[(df["frequency_score"] <= 2) & (df["previous_purchases"] < 5)]
    churn_risk_seg = df[df["churn_risk"] == True]

    def seg_summary(seg_df, name):
        if len(seg_df) == 0:
            return {
                "name": name, "count": 0, "pct_of_base": 0.0,
                "avg_spend": 0.0, "avg_previous_purchases": 0.0,
                "avg_loyalty_score": 0.0, "avg_promo_dependency": 0.0,
                "top_category": "N/A", "top_location": "N/A"
            }
        return {
            "name": name,
            "count": len(seg_df),
            "pct_of_base": round(len(seg_df) / total * 100, 1),
            "avg_spend": round(float(seg_df["purchase_amount"].mean()), 2),
            "avg_previous_purchases": round(float(seg_df["previous_purchases"].mean()), 1),
            "avg_loyalty_score": round(float(seg_df["loyalty_score"].mean()), 3),
            "avg_promo_dependency": round(float(seg_df["promo_dependency_score"].mean()), 3),
            "top_category": seg_df["category"].mode().iloc[0] if len(seg_df) > 0 else "N/A",
            "top_location": seg_df["location"].mode().iloc[0] if len(seg_df) > 0 else "N/A",
        }

    return SegmentsResponse(
        total_customers=total,
        loyal=seg_summary(loyal, "Loyal"),
        promo_trappers=seg_summary(promo_trap, "Promo Trappers"),
        discount_dependent=seg_summary(discount_dep, "Discount-Dependent"),
        dormant=seg_summary(dormant, "Dormant"),
        churn_risk=seg_summary(churn_risk_seg, "Churn Risk")
    )

# ─── GET /api/geographic ──────────────────────────────────

@app.get("/api/geographic", response_model=GeographicResponse)
async def get_geographic():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    df = CUSTOMERS_DF
    grouped = df.groupby("location").agg(
        customer_count=("customer_id", "count"),
        total_spend=("purchase_amount", "sum"),
        avg_spend=("purchase_amount", "mean"),
        avg_loyalty=("loyalty_score", "mean"),
        avg_promo_dependency=("promo_dependency_score", "mean"),
        churn_risk_count=("churn_risk", "sum"),
        platinum_count=("value_tier", lambda x: (x == "Platinum").sum()),
        subscriber_count=("subscriber", "sum"),
    ).reset_index()

    grouped["opportunity_score"] = (
        (grouped["avg_spend"] / df["purchase_amount"].max()) * 0.4 +
        (grouped["avg_loyalty"] * 0.35) +
        ((1 - grouped["avg_promo_dependency"]) * 0.25)
    ).round(3)

    grouped = grouped.sort_values("opportunity_score", ascending=False)

    states = []
    for _, row in grouped.iterrows():
        states.append({
            "state": row["location"],
            "customer_count": int(row["customer_count"]),
            "total_spend": round(float(row["total_spend"]), 2),
            "avg_spend": round(float(row["avg_spend"]), 2),
            "avg_loyalty": round(float(row["avg_loyalty"]), 3),
            "avg_promo_dependency": round(float(row["avg_promo_dependency"]), 3),
            "churn_risk_count": int(row["churn_risk_count"]),
            "platinum_count": int(row["platinum_count"]),
            "subscriber_count": int(row["subscriber_count"]),
            "opportunity_score": float(row["opportunity_score"]),
            "opportunity_tier": (
                "High" if row["opportunity_score"] >= 0.65 else
                "Medium" if row["opportunity_score"] >= 0.45 else "Low"
            )
        })

    return GeographicResponse(
        total_states=len(states),
        states=states,
        top_opportunity=states[:5] if states else [],
        national_avg_spend=round(float(df["purchase_amount"].mean()), 2),
        national_avg_promo=round(float(df["promo_dependency_score"].mean()), 3),
    )

# ─── GET /api/categories ──────────────────────────────────

@app.get("/api/categories", response_model=CategoriesResponse)
async def get_categories():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    df = CUSTOMERS_DF
    grouped = df.groupby("category").agg(
        customer_count=("customer_id", "count"),
        avg_spend=("purchase_amount", "mean"),
        total_spend=("purchase_amount", "sum"),
        avg_loyalty=("loyalty_score", "mean"),
        avg_promo_dependency=("promo_dependency_score", "mean"),
        avg_previous_purchases=("previous_purchases", "mean"),
        avg_rating=("review_rating", "mean"),
        churn_risk_count=("churn_risk", "sum"),
        platinum_count=("value_tier", lambda x: (x == "Platinum").sum()),
    ).reset_index()

    total = len(df)
    categories = []
    for _, row in grouped.iterrows():
        avg_prev_all = float(df["previous_purchases"].mean())
        categories.append({
            "category": row["category"],
            "customer_count": int(row["customer_count"]),
            "pct_of_base": round(int(row["customer_count"]) / total * 100, 1),
            "avg_spend": round(float(row["avg_spend"]), 2),
            "total_spend": round(float(row["total_spend"]), 2),
            "avg_loyalty": round(float(row["avg_loyalty"]), 3),
            "avg_promo_dependency": round(float(row["avg_promo_dependency"]), 3),
            "avg_previous_purchases": round(float(row["avg_previous_purchases"]), 1),
            "avg_rating": round(float(row["avg_rating"]), 2),
            "churn_risk_count": int(row["churn_risk_count"]),
            "platinum_count": int(row["platinum_count"]),
            "repeat_buyer_index": round(float(row["avg_previous_purchases"]) / avg_prev_all, 2),
            "role": (
                "Retention Driver" if float(row["avg_previous_purchases"]) > avg_prev_all * 1.1
                else "Acquisition Channel"
            )
        })

    categories.sort(key=lambda x: x["avg_spend"], reverse=True)

    return CategoriesResponse(
        total_categories=len(categories),
        categories=categories,
        entry_category=max(categories, key=lambda x: x["customer_count"])["category"] if categories else "Clothing",
        retention_category=max(categories, key=lambda x: x["avg_previous_purchases"])["category"] if categories else "Outerwear",
    )

# ─── GET /api/ideal-profile ───────────────────────────────

@app.get("/api/ideal-profile", response_model=IdealProfileResponse)
async def get_ideal_profile():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    df = CUSTOMERS_DF
    ideal = df[df["high_value_no_promo"] == 1]
    all_avg_prev = float(df["previous_purchases"].mean())

    if len(ideal) == 0:
        raise HTTPException(status_code=404, detail="No ideal customer profiles found in dataset")

    top_states = ideal["location"].value_counts().head(5).index.tolist()

    comparison = []
    for metric in ["purchase_amount", "loyalty_score", "promo_dependency_score",
                   "previous_purchases", "review_rating", "frequency_score"]:
        ideal_val = float(ideal[metric].mean())
        all_val = float(df[metric].mean())
        comparison.append({
            "metric": metric,
            "ideal_avg": round(ideal_val, 3),
            "base_avg": round(all_val, 3),
            "delta": round(ideal_val - all_val, 3),
            "multiplier": round(ideal_val / all_val, 2) if all_val > 0 else 0,
            "direction": "higher" if ideal_val > all_val else "lower"
        })

    return IdealProfileResponse(
        icp_count=len(ideal),
        icp_pct_of_base=round(len(ideal) / len(df) * 100, 1),
        avg_age=round(float(ideal["age"].mean()), 1),
        top_gender=ideal["gender"].mode().iloc[0] if len(ideal) > 0 else "Female",
        top_category=ideal["category"].mode().iloc[0] if len(ideal) > 0 else "Clothing",
        top_payment=ideal["payment_method"].mode().iloc[0] if len(ideal) > 0 else "Credit Card",
        top_states=top_states,
        avg_spend=round(float(ideal["purchase_amount"].mean()), 2),
        avg_loyalty_score=round(float(ideal["loyalty_score"].mean()), 3),
        avg_previous_purchases=round(float(ideal["previous_purchases"].mean()), 1),
        avg_frequency_score=round(float(ideal["frequency_score"].mean()), 2),
        avg_review_rating=round(float(ideal["review_rating"].mean()), 2),
        promo_dependency=round(float(ideal["promo_dependency_score"].mean()), 3),
        prev_purchase_multiplier=round(float(ideal["previous_purchases"].mean()) / all_avg_prev, 2) if all_avg_prev > 0 else 0,
        comparison_table=comparison,
        acquisition_strategy=(
            f"Target {int(float(ideal['age'].mean()) - 3)}–{int(float(ideal['age'].mean()) + 5)} year olds "
            f"in {', '.join(top_states[:2])} "
            f"with {ideal['category'].mode().iloc[0]} campaigns — "
            f"zero discount messaging, full-price exclusive drops only."
        )
    )

# ─── GET /api/retention-plan ──────────────────────────────

@app.get("/api/retention-plan", response_model=RetentionPlanResponse)
async def get_retention_plan():
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded")

    df = CUSTOMERS_DF
    total = len(df)
    median_prev = float(df["previous_purchases"].median())

    promo_trap = df[df["promo_trap"] == 1]
    discount_dep = df[(df["promo_dependency_score"] >= 0.5) & (df["previous_purchases"] >= median_prev)]
    loyal = df[(df["loyalty_score"] >= 0.55) & (df["promo_dependency_score"] <= 0.2)]
    churn_at_risk = df[df["churn_risk"] == True]
    high_val_risk = churn_at_risk[churn_at_risk["value_tier"].isin(["Platinum", "Gold"])]

    trap_revenue = float(promo_trap["purchase_amount"].sum())
    avg_discount_saving = 15.0
    projected_margin_recovery = round(len(promo_trap) * avg_discount_saving, 2)

    return RetentionPlanResponse(
        total_customers=total,
        promo_trappers=len(promo_trap),
        promo_trappers_revenue=round(trap_revenue, 2),
        discount_dependent=len(discount_dep),
        loyal_customers=len(loyal),
        churn_at_risk=len(churn_at_risk),
        high_value_churn_risk=len(high_val_risk),
        projected_margin_recovery=projected_margin_recovery,
        actions=[
            {
                "priority": 1,
                "action": "Stop Now — Promo Sunset",
                "segment": "Promo Trappers",
                "segment_size": len(promo_trap),
                "timeline": "Week 1",
                "tactic": "Remove all automated discount codes. Replace with free standard shipping upgrade ($3 cost vs $15 discount).",
                "trade_off": f"Risk losing {len(promo_trap)} customers who may never buy at full price anyway.",
                "projected_impact": f"Recover ~${projected_margin_recovery:,.0f} in margin across trapped segment.",
                "risk_level": "Low"
            },
            {
                "priority": 2,
                "action": "Reduce Gradually — Points Migration",
                "segment": "Discount-Dependent",
                "segment_size": len(discount_dep),
                "timeline": "Week 4–8",
                "tactic": "Reduce discount frequency by 50%. Introduce loyalty credits ($5 per full-price order). Communicate points program value.",
                "trade_off": f"Revenue dip of ~${round(len(discount_dep) * float(df['purchase_amount'].mean()) * 0.05, 0):,.0f} estimated in first 30 days.",
                "projected_impact": "Gradual shift from discount to loyalty behaviour over 60 days.",
                "risk_level": "Medium"
            },
            {
                "priority": 3,
                "action": "Maintain & Reward — VIP Shield",
                "segment": "Loyal",
                "segment_size": len(loyal),
                "timeline": "Ongoing",
                "tactic": "Eliminate all automated discounts. Offer invite-only early access drops, free returns, and dedicated style advisor access.",
                "trade_off": "Lowest risk — these customers buy without discounts already.",
                "projected_impact": "Sustained LTV protection and NPS improvement.",
                "risk_level": "Very Low"
            },
            {
                "priority": 4,
                "action": "Urgent Reactivation — High-Value Churn Risk",
                "segment": "Gold/Platinum At Risk",
                "segment_size": len(high_val_risk),
                "timeline": "Week 1–2",
                "tactic": "Deploy personalized reactivation email to Gold/Platinum customers showing churn signals. Free express shipping, no discount.",
                "trade_off": "Small campaign cost vs high LTV preservation value.",
                "projected_impact": f"Retain {len(high_val_risk)} high-value customers from churning.",
                "risk_level": "Low"
            }
        ]
    )

# ─── POST /api/upload ─────────────────────────────────────

@app.post("/api/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    try:
        contents = await file.read()
        raw = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Validate required columns
    required = [
        "Age", "Purchase Amount (USD)", "Location",
        "Item Purchased", "Category"
    ]
    missing = [col for col in required if col not in raw.columns]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"CSV missing required columns: {', '.join(missing)}"
        )

    try:
        enriched = engineer_features(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature engineering failed: {str(e)}")

    tier_breakdown = enriched["value_tier"].value_counts().to_dict()

    return UploadResponse(
        rows_processed=len(enriched),
        columns_detected=list(raw.columns),
        tier_breakdown=tier_breakdown,
        avg_spend=round(float(enriched["purchase_amount"].mean()), 2),
        avg_loyalty=round(float(enriched["loyalty_score"].mean()), 3),
        churn_risk_count=int(enriched["churn_risk"].sum()),
        promo_trap_count=int(enriched["promo_trap"].sum()),
        customers=df_to_records(enriched)
    )

# ─── POST /api/predict ────────────────────────────────────

@app.post("/api/predict", response_model=PredictResponse)
async def predict_customer(customer: PredictRequest):
    if CUSTOMERS_DF.empty:
        raise HTTPException(status_code=503, detail="Customer data not loaded — cannot compute percentile")

    # Build single-row DataFrame matching raw CSV format
    single = pd.DataFrame([{
        "Customer ID": 99999,
        "Age": customer.age,
        "Gender": customer.gender,
        "Item Purchased": customer.item_purchased or "Unknown",
        "Category": customer.category,
        "Purchase Amount (USD)": customer.purchase_amount,
        "Location": customer.location or "Unknown",
        "Size": customer.size or "M",
        "Color": customer.color or "Unknown",
        "Season": customer.season or "Spring",
        "Review Rating": customer.review_rating,
        "Subscription Status": "Yes" if customer.subscription_status else "No",
        "Shipping Type": customer.shipping_type or "Standard",
        "Discount Applied": "Yes" if customer.discount_applied else "No",
        "Promo Code Used": "Yes" if customer.promo_code_used else "No",
        "Previous Purchases": customer.previous_purchases,
        "Payment Method": customer.payment_method or "Credit Card",
        "Frequency of Purchases": customer.frequency_of_purchases or "Monthly",
    }])

    # Combine with base to compute proper percentile-based tiers
    combined = pd.concat([CUSTOMERS_DF.rename(columns={
        "customer_id": "Customer ID",
        "age": "Age",
        "gender": "Gender",
        "item_purchased": "Item Purchased",
        "category": "Category",
        "purchase_amount": "Purchase Amount (USD)",
        "location": "Location",
        "size": "Size",
        "color": "Color",
        "season": "Season",
        "review_rating": "Review Rating",
        "subscription_status": "Subscription Status",
        "shipping_type": "Shipping Type",
        "discount_applied": "Discount Applied",
        "promo_code_used": "Promo Code Used",
        "previous_purchases": "Previous Purchases",
        "payment_method": "Payment Method",
        "frequency_of_purchases": "Frequency of Purchases",
    })[[
        "Customer ID", "Age", "Gender", "Item Purchased", "Category",
        "Purchase Amount (USD)", "Location", "Size", "Color", "Season",
        "Review Rating", "Subscription Status", "Shipping Type",
        "Discount Applied", "Promo Code Used", "Previous Purchases",
        "Payment Method", "Frequency of Purchases"
    ]], single], ignore_index=True)

    enriched = engineer_features(combined)
    result = enriched[enriched["customer_id"] == 99999].iloc[0]

    # Percentile of composite_value vs existing base
    base_composites = CUSTOMERS_DF["composite_value"].values
    percentile = int(np.mean(base_composites <= result["composite_value"]) * 100)

    # Recommendation
    def get_action(row):
        if row["churn_risk"]:
            return "Deploy immediate reactivation campaign — free express shipping, no discount code."
        if row["promo_trap"] == 1:
            return "Begin promo sunset: swap discount code for loyalty credits. Monitor 60-day repeat rate."
        if row["value_tier"] == "Platinum" or row["high_value_no_promo"] == 1:
            return "Shield from automated discounts. Offer invite-only early-access drops and VIP service."
        if row["value_tier"] == "Gold":
            return "Upsell to Platinum: complimentary express shipping + accessories cross-sell bundles."
        if row["value_tier"] == "Silver":
            return "Convert to subscriber: first-month loyalty credit + review incentive for points."
        return "Standard CRM nurture flow — monitor frequency and upsell at next seasonal drop."

    reasoning_parts = [
        f"Tier: {result['value_tier']} ({percentile}th percentile by composite value).",
        f"Loyalty score {round(result['loyalty_score'] * 100, 0):.0f}% driven by {customer.frequency_of_purchases} frequency, {customer.previous_purchases} prior orders.",
        f"Promo dependency: {round(result['promo_dependency_score'] * 100, 0):.0f}% — {'high risk, candidate for sunset' if result['promo_dependency_score'] >= 0.5 else 'low reliance, healthy behaviour'}.",
        f"{'Churn risk FLAGGED — low frequency + low rating + high promo dependency.' if result['churn_risk'] else 'No churn risk detected.'}",
    ]

    return PredictResponse(
        value_tier=result["value_tier"],
        composite_value=round(float(result["composite_value"]), 3),
        loyalty_score=round(float(result["loyalty_score"]) * 100, 1),
        promo_dependency=round(float(result["promo_dependency_score"]), 3),
        churn_risk=bool(result["churn_risk"]),
        high_value_no_promo=bool(result["high_value_no_promo"] == 1),
        promo_trap=bool(result["promo_trap"] == 1),
        spend_efficiency=round(float(result["spend_efficiency"]), 2),
        percentile=percentile,
        recommended_action=get_action(result),
        reasoning=" ".join(reasoning_parts)
    )

# ─── Health check ─────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "BrandIQ Customer Intelligence API",
        "status": "running",
        "customers_loaded": len(CUSTOMERS_DF),
        "endpoints": [
            "GET /api/customers",
            "GET /api/stats",
            "GET /api/segments",
            "GET /api/geographic",
            "GET /api/categories",
            "GET /api/ideal-profile",
            "GET /api/retention-plan",
            "POST /api/upload",
            "POST /api/predict",
        ]
    }

# ─── Utility ──────────────────────────────────────────────

def avg(series):
    return float(series.mean()) if len(series) > 0 else 0.0
