# ============================================================
# BrandIQ — Python Feature Engineering
# Mirrors the JS featureEngineering.js logic exactly.
# Used by both /api/upload and /api/predict endpoints.
# ============================================================

import pandas as pd
import numpy as np
from typing import Dict

# ─── Constants ────────────────────────────────────────────

FREQ_MAP: Dict[str, int] = {
    "Daily": 7,
    "Weekly": 6,
    "Fortnightly": 5,
    "Bi-Weekly": 5,
    "Monthly": 4,
    "Quarterly": 3,
    "Bi-Annually": 2,
    "Annually": 1,
}

REQUIRED_COLUMNS = [
    "Customer ID", "Age", "Gender", "Item Purchased", "Category",
    "Purchase Amount (USD)", "Location", "Size", "Color", "Season",
    "Review Rating", "Subscription Status", "Shipping Type",
    "Discount Applied", "Promo Code Used", "Previous Purchases",
    "Payment Method", "Frequency of Purchases",
]

# ─── Feature engineering ──────────────────────────────────

def engineer_features(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()

    # ── Rename columns to snake_case ────────────────────────
    col_map = {
        "Customer ID": "customer_id",
        "Age": "age",
        "Gender": "gender",
        "Item Purchased": "item_purchased",
        "Category": "category",
        "Purchase Amount (USD)": "purchase_amount",
        "Location": "location",
        "Size": "size",
        "Color": "color",
        "Season": "season",
        "Review Rating": "review_rating",
        "Subscription Status": "subscription_status",
        "Shipping Type": "shipping_type",
        "Discount Applied": "discount_applied",
        "Promo Code Used": "promo_code_used",
        "Previous Purchases": "previous_purchases",
        "Payment Method": "payment_method",
        "Frequency of Purchases": "frequency_of_purchases",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # ── Type coercion ────────────────────────────────────────
    df["age"] = pd.to_numeric(df.get("age", 30), errors="coerce").fillna(30).astype(int)
    df["purchase_amount"] = pd.to_numeric(df.get("purchase_amount", 0), errors="coerce").fillna(0).astype(float)
    df["previous_purchases"] = pd.to_numeric(df.get("previous_purchases", 0), errors="coerce").fillna(0).astype(int)
    df["review_rating"] = pd.to_numeric(df.get("review_rating", 3.0), errors="coerce").fillna(3.0).astype(float)

    # ── Boolean flag columns ─────────────────────────────────
    df["discount_applied"] = (df.get("discount_applied", "No").astype(str).str.strip().str.lower() == "yes").astype(int)
    df["promo_code_used"] = (df.get("promo_code_used", "No").astype(str).str.strip().str.lower() == "yes").astype(int)
    df["subscriber"] = (df.get("subscription_status", "No").astype(str).str.strip().str.lower() == "yes").astype(int)

    # ── Frequency score (1–7) ────────────────────────────────
    df["frequency_score"] = (
        df.get("frequency_of_purchases", pd.Series(["Monthly"] * len(df)))
        .astype(str)
        .str.strip()
        .map(FREQ_MAP)
        .fillna(4)
        .astype(int)
    )

    # ── Promo dependency score [0.0, 1.0] ───────────────────
    df["promo_dependency_score"] = ((df["discount_applied"] + df["promo_code_used"]) / 2).round(2)

    # ── Normalize for composite calculation ─────────────────
    prev_min = df["previous_purchases"].min()
    prev_max = df["previous_purchases"].max()
    spend_min = df["purchase_amount"].min()
    spend_max = df["purchase_amount"].max()

    prev_range = prev_max - prev_min if prev_max != prev_min else 1
    spend_range = spend_max - spend_min if spend_max != spend_min else 1

    prev_norm = (df["previous_purchases"] - prev_min) / prev_range
    spend_norm = (df["purchase_amount"] - spend_min) / spend_range
    freq_norm = df["frequency_score"] / 7.0

    # ── Loyalty score [0.0, 1.0] ────────────────────────────
    df["loyalty_score"] = (
        (prev_norm * 0.40) +
        (freq_norm * 0.40) +
        (df["subscriber"] * 0.20)
    ).clip(0, 1).round(3)

    # ── Composite value [0.0, 1.0] ──────────────────────────
    df["composite_value"] = (
        (spend_norm * 0.50) +
        (df["loyalty_score"] * 0.30) +
        ((1 - df["promo_dependency_score"]) * 0.20)
    ).clip(0, 1).round(3)

    # ── Value tier (quartile-based) ──────────────────────────
    q25 = df["composite_value"].quantile(0.25)
    q50 = df["composite_value"].quantile(0.50)
    q75 = df["composite_value"].quantile(0.75)

    def assign_tier(v):
        if v >= q75: return "Platinum"
        if v >= q50: return "Gold"
        if v >= q25: return "Silver"
        return "Bronze"

    df["value_tier"] = df["composite_value"].apply(assign_tier)

    # ── Derived flags ────────────────────────────────────────
    median_prev = df["previous_purchases"].median()
    df["satisfaction_flag"] = (df["review_rating"] >= 4.0).astype(int)
    df["high_value_no_promo"] = (
        (df["composite_value"] >= q50) & (df["promo_dependency_score"] < 0.5)
    ).astype(int)
    df["promo_trap"] = (
        (df["promo_dependency_score"] >= 0.5) & (df["previous_purchases"] < median_prev)
    ).astype(int)
    df["spend_efficiency"] = (df["purchase_amount"] / (df["previous_purchases"] + 1)).round(2)

    # ── Churn risk ───────────────────────────────────────────
    df["churn_risk"] = (
        (df["frequency_score"] <= 2) &
        (df["review_rating"] < 3.5) &
        (df["promo_dependency_score"] >= 0.5)
    )

    # ── Age group ────────────────────────────────────────────
    df["age_group"] = pd.cut(
        df["age"],
        bins=[0, 25, 35, 45, 55, 120],
        labels=["18-25", "26-35", "36-45", "46-55", "56+"],
        right=True
    ).astype(str)

    return df

# ─── Aggregate stats ──────────────────────────────────────

def compute_stats(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}

    total = len(df)
    ideal = df[df["high_value_no_promo"] == 1]

    tier_breakdown = df["value_tier"].value_counts().to_dict()
    gender_breakdown = df["gender"].value_counts().to_dict()
    category_breakdown = df["category"].value_counts().to_dict()

    state_analysis = (
        df.groupby("location")
        .agg(
            count=("customer_id", "count"),
            avg_spend=("purchase_amount", "mean"),
            avg_loyalty=("loyalty_score", "mean"),
            avg_promo=("promo_dependency_score", "mean"),
        )
        .reset_index()
        .sort_values("avg_spend", ascending=False)
        .head(10)
        .rename(columns={"location": "name", "count": "customer_count"})
        .round(2)
        .to_dict(orient="records")
    )

    category_analysis = (
        df.groupby("category")
        .agg(
            count=("customer_id", "count"),
            avg_spend=("purchase_amount", "mean"),
            avg_loyalty=("loyalty_score", "mean"),
        )
        .reset_index()
        .sort_values("avg_spend", ascending=False)
        .rename(columns={"category": "name", "count": "customer_count"})
        .round(2)
        .to_dict(orient="records")
    )

    ideal_profile = {}
    if len(ideal) > 0:
        ideal_profile = {
            "avg_age": round(float(ideal["age"].mean()), 1),
            "avg_spend": round(float(ideal["purchase_amount"].mean()), 2),
            "avg_previous_purchases": round(float(ideal["previous_purchases"].mean()), 1),
            "preferred_category": ideal["category"].mode().iloc[0],
            "preferred_gender": ideal["gender"].mode().iloc[0],
            "preferred_size": ideal["size"].mode().iloc[0] if "size" in ideal.columns else "M",
            "preferred_color": ideal["color"].mode().iloc[0] if "color" in ideal.columns else "Unknown",
            "top_states": ideal["location"].value_counts().head(3).index.tolist(),
        }

    return {
        "total_customers": total,
        "avg_spend": round(float(df["purchase_amount"].mean()), 2),
        "avg_loyalty_score": round(float(df["loyalty_score"].mean()), 3),
        "avg_previous_purchases": round(float(df["previous_purchases"].mean()), 1),
        "avg_review_rating": round(float(df["review_rating"].mean()), 2),
        "avg_promo_dependency": round(float(df["promo_dependency_score"].mean()), 3),
        "total_revenue": round(float(df["purchase_amount"].sum()), 2),
        "subscriber_count": int(df["subscriber"].sum()),
        "subscriber_pct": round(float(df["subscriber"].mean()) * 100, 1),
        "churn_risk_count": int(df["churn_risk"].sum()),
        "churn_risk_pct": round(float(df["churn_risk"].mean()) * 100, 1),
        "promo_trap_count": int(df["promo_trap"].sum()),
        "ideal_customer_count": len(ideal),
        "ideal_customer_pct": round(len(ideal) / total * 100, 1) if total > 0 else 0,
        "tier_breakdown": tier_breakdown,
        "gender_breakdown": gender_breakdown,
        "category_breakdown": category_breakdown,
        "state_analysis": state_analysis,
        "category_analysis": category_analysis,
        "ideal_profile": ideal_profile,
    }
