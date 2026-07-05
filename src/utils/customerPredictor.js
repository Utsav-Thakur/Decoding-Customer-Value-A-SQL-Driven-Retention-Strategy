// ============================================================
// BrandIQ — Zero-API Customer Predictor Engine
// Runs the same feature engineering logic on a single new
// customer input, compares against the existing customer
// distribution, and returns a full prediction.
// No fetch, no API, no external calls — ever.
// ============================================================

import { FREQ_MAP } from './featureEngineering.js';

// ─── Math helpers (local) ─────────────────────────────────

function avg(arr, key) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0) / arr.length;
}

function stdDev(arr, key) {
  if (!arr || arr.length < 2) return 1;
  const mean = avg(arr, key);
  const variance = arr.reduce((s, c) => s + Math.pow((Number(c[key]) || 0) - mean, 2), 0) / arr.length;
  return Math.sqrt(variance) || 1;
}

function clamp(val, min = 0, max = 1) {
  return Math.min(max, Math.max(min, val));
}

function minVal(arr, key) {
  return Math.min(...arr.map(c => Number(c[key]) || 0));
}

function maxVal(arr, key) {
  const vals = arr.map(c => Number(c[key]) || 0);
  return Math.max(...vals) || 1;
}

function normalize(val, min, max) {
  if (max === min) return 0;
  return clamp((val - min) / (max - min));
}

function percentileRank(arr, key, value) {
  if (!arr || arr.length === 0) return 50;
  const sorted = arr.map(c => Number(c[key]) || 0).sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v <= value) count++;
    else break;
  }
  return Math.round((count / sorted.length) * 100);
}

// ─── Single-customer feature engineering ─────────────────

function engineerSingle(inputData, existingCustomers) {
  // Parse inputs — accept both raw CSV keys and camelCase keys
  const freqStr = inputData['Frequency of Purchases'] || inputData.frequency_of_purchases || 'Monthly';
  const frequency_score = FREQ_MAP[freqStr] || 3;

  const purchase_amount = Number(
    inputData['Purchase Amount (USD)'] || inputData.purchase_amount || 0
  );
  const previous_purchases = Number(
    inputData['Previous Purchases'] || inputData.previous_purchases || 0
  );
  const review_rating = Number(
    inputData['Review Rating'] || inputData.review_rating || 3
  );
  const discountRaw = inputData['Discount Applied'] || inputData.discount_applied || 'No';
  const promoRaw = inputData['Promo Code Used'] || inputData.promo_code_used || 'No';
  const subRaw = inputData['Subscription Status'] || inputData.subscription_status || 'No';

  const discount_applied = discountRaw === 'Yes' || discountRaw === true ? 1 : 0;
  const promo_code_used = promoRaw === 'Yes' || promoRaw === true ? 1 : 0;
  const subscriber = subRaw === 'Yes' || subRaw === true ? 1 : 0;

  // Compute distribution stats from existing customers
  const minPrev = minVal(existingCustomers, 'previous_purchases');
  const maxPrev = maxVal(existingCustomers, 'previous_purchases');
  const minSpend = minVal(existingCustomers, 'purchase_amount');
  const maxSpend = maxVal(existingCustomers, 'purchase_amount');

  // Feature scores
  const promo_dependency_score = (discount_applied + promo_code_used) / 2;

  const prev_norm = normalize(previous_purchases, minPrev, maxPrev);
  const freq_norm = frequency_score / 7;
  const loyalty_score = clamp(
    (prev_norm * 0.4) + (freq_norm * 0.4) + (subscriber * 0.2)
  );

  const composite_value = clamp(
    (normalize(purchase_amount, minSpend, maxSpend) * 0.5) +
    (loyalty_score * 0.3) +
    ((1 - promo_dependency_score) * 0.2)
  );

  // Determine existing composite quartiles
  const existingComposites = existingCustomers.map(c => Number(c.composite_value) || 0).sort((a, b) => a - b);
  const len = existingComposites.length;
  const q1 = existingComposites[Math.floor(len * 0.25)] || 0;
  const q2 = existingComposites[Math.floor(len * 0.5)] || 0;
  const q3 = existingComposites[Math.floor(len * 0.75)] || 0;

  let value_tier;
  if (composite_value >= q3) value_tier = 'Platinum';
  else if (composite_value >= q2) value_tier = 'Gold';
  else if (composite_value >= q1) value_tier = 'Silver';
  else value_tier = 'Bronze';

  const medPrev = len > 0 ? existingComposites[Math.floor(len / 2)] : 0;
  const satisfaction_flag = review_rating >= 4;
  const high_value_no_promo = composite_value >= q2 && promo_dependency_score < 0.5 ? 1 : 0;
  const promo_trap = promo_dependency_score >= 0.5 && previous_purchases < avg(existingCustomers, 'previous_purchases') ? 1 : 0;
  const spend_efficiency = purchase_amount / (previous_purchases + 1);
  const churn_risk = frequency_score <= 2 && review_rating < 3.5 && promo_dependency_score >= 0.5;

  const age = Number(inputData['Age'] || inputData.age || 30);
  const age_group = age < 26 ? '18-25' : age < 36 ? '26-35' : age < 46 ? '36-45' : age < 56 ? '46-55' : '56+';

  return {
    purchase_amount,
    previous_purchases,
    review_rating,
    frequency_score,
    loyalty_score: Number(loyalty_score.toFixed(3)),
    promo_dependency_score: Number(promo_dependency_score.toFixed(2)),
    composite_value: Number(composite_value.toFixed(3)),
    value_tier,
    satisfaction_flag,
    high_value_no_promo,
    promo_trap,
    spend_efficiency: Number(spend_efficiency.toFixed(2)),
    churn_risk,
    age,
    age_group,
    subscriber,
    discount_applied,
    promo_code_used,
    gender: inputData['Gender'] || inputData.gender || 'Unknown',
    category: inputData['Category'] || inputData.category || 'Clothing',
    location: inputData['Location'] || inputData.location || 'Unknown',
    frequency_of_purchases: freqStr,
    payment_method: inputData['Payment Method'] || inputData.payment_method || 'Credit Card',
    subscription_status: subRaw === 'Yes' ? 'Yes' : 'No',
  };
}

// ─── Similarity scoring ───────────────────────────────────

function euclideanSimilarity(a, b) {
  // Normalized distance across key behavioral dimensions
  const dims = [
    { key: 'purchase_amount', weight: 0.25 },
    { key: 'previous_purchases', weight: 0.20 },
    { key: 'loyalty_score', weight: 0.20 },
    { key: 'promo_dependency_score', weight: 0.15 },
    { key: 'frequency_score', weight: 0.12 },
    { key: 'review_rating', weight: 0.08 },
  ];

  let distSq = 0;
  dims.forEach(({ key, weight }) => {
    const va = Number(a[key]) || 0;
    const vb = Number(b[key]) || 0;
    // Normalize roughly to 0-1 range for comparison
    const scale = key === 'purchase_amount' ? 150 :
                  key === 'previous_purchases' ? 50 :
                  key === 'frequency_score' ? 7 :
                  key === 'review_rating' ? 5 : 1;
    distSq += weight * Math.pow((va - vb) / scale, 2);
  });

  return 1 - Math.sqrt(distSq); // Higher = more similar
}

// ─── Recommended action logic ─────────────────────────────

function getRecommendedAction(features) {
  if (features.churn_risk) {
    return 'Deploy immediate reactivation campaign — free express shipping offer, no discount code.';
  }
  if (features.promo_trap === 1) {
    return 'Begin promo sunset: replace discount codes with loyalty credits. Monitor 60-day repeat rate.';
  }
  if (features.value_tier === 'Platinum' || features.high_value_no_promo === 1) {
    return 'Shield from all automated discounts. Offer invite-only early-access drops and VIP service tier.';
  }
  if (features.value_tier === 'Gold') {
    return 'Upsell to Platinum: offer complimentary express shipping upgrade and cross-sell accessories bundles.';
  }
  if (features.value_tier === 'Silver') {
    return 'Convert to subscriber: offer first-month loyalty credit. Incentivize review submissions for points.';
  }
  if (features.loyalty_score < 0.3) {
    return 'Low-loyalty bronze: add to low-cost automated email nurture. Avoid manual outreach resources.';
  }
  return 'Standard CRM flow: monitor purchase frequency and upsell when next seasonal drop launches.';
}

// ─── Reasoning generator ─────────────────────────────────

function buildReasoning(features, percentileRankVal, similarCount) {
  const tierEmoji = { Platinum: '✦', Gold: '★', Silver: '◆', Bronze: '●' }[features.value_tier] || '';
  const loyaltyPct = (features.loyalty_score * 100).toFixed(0);
  const promoPct = (features.promo_dependency_score * 100).toFixed(0);

  let reasoning = `${tierEmoji} **Tier: ${features.value_tier}** (${percentileRankVal}th percentile by composite value). `;

  reasoning += `Loyalty score: **${loyaltyPct}%** — driven by ${features.frequency_of_purchases.toLowerCase()} purchase frequency (score ${features.frequency_score}/7), ${features.previous_purchases} prior orders, and ${features.subscription_status === 'Yes' ? 'active' : 'no'} subscription. `;

  reasoning += `Promo dependency: **${promoPct}%** — `;
  if (features.promo_dependency_score === 0) reasoning += 'no promo usage detected, ideal profile. ';
  else if (features.promo_dependency_score <= 0.3) reasoning += 'low reliance, healthy purchase behaviour. ';
  else if (features.promo_dependency_score <= 0.7) reasoning += 'moderate discount reliance — watch closely. ';
  else reasoning += 'high promo dependency — candidate for sunset programme. ';

  if (features.churn_risk) {
    reasoning += `**Churn risk: HIGH** — low frequency + rating ${features.review_rating} + high promo dependency form a risk cluster. `;
  } else {
    reasoning += `Churn risk: low. `;
  }

  reasoning += `Found ${similarCount} similar existing customers in base — behaviour pattern is well-represented in current data.`;
  return reasoning;
}

// ─── Main export ──────────────────────────────────────────

export function predictCustomer(inputData, existingCustomers) {
  if (!existingCustomers || existingCustomers.length === 0) {
    return {
      value_tier: 'Silver',
      loyalty_score: 50,
      promo_dependency: 0.5,
      churn_risk: false,
      recommended_action: 'Upload customer data to enable accurate predictions.',
      percentile: 50,
      similar_customers: [],
      reasoning: 'No existing customer data available for comparison. Please load the base dataset.'
    };
  }

  // Step 1: Engineer features for this new customer
  const features = engineerSingle(inputData, existingCustomers);

  // Step 2: Compute percentile rank vs existing base
  const compPercentile = percentileRank(existingCustomers, 'composite_value', features.composite_value);
  const loyaltyPercentile = percentileRank(existingCustomers, 'loyalty_score', features.loyalty_score);

  // Step 3: Find top 3 most similar customers
  const scored = existingCustomers.map(c => ({
    customer: c,
    similarity: euclideanSimilarity(features, c)
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  const similar_customers = scored.slice(0, 3).map(s => ({
    customer_id: s.customer.customer_id || s.customer.customerId || '—',
    value_tier: s.customer.value_tier || '—',
    purchase_amount: s.customer.purchase_amount,
    loyalty_score: Number((s.customer.loyalty_score * 100).toFixed(0)),
    location: s.customer.location,
    category: s.customer.category,
    similarity_pct: Number((s.similarity * 100).toFixed(0))
  }));

  // Step 4: Count similar (>70% similarity) customers for context
  const similarCount = scored.filter(s => s.similarity >= 0.7).length;

  // Step 5: Build reasoning
  const reasoning = buildReasoning(features, compPercentile, similarCount);

  // Step 6: Get recommended action
  const recommended_action = getRecommendedAction(features);

  return {
    value_tier: features.value_tier,
    loyalty_score: Number((features.loyalty_score * 100).toFixed(0)),
    promo_dependency: features.promo_dependency_score,
    churn_risk: features.churn_risk,
    recommended_action,
    percentile: compPercentile,
    loyalty_percentile: loyaltyPercentile,
    composite_value: features.composite_value,
    high_value_no_promo: features.high_value_no_promo === 1,
    promo_trap: features.promo_trap === 1,
    similar_customers,
    reasoning,
    // Raw engineered features for display
    raw: {
      frequency_score: features.frequency_score,
      spend_efficiency: features.spend_efficiency,
      satisfaction_flag: features.satisfaction_flag,
      age_group: features.age_group,
      subscriber: features.subscriber === 1
    }
  };
}

// ─── Batch predict for segment analysis ──────────────────

export function predictBatch(inputArray, existingCustomers) {
  return inputArray.map(inp => predictCustomer(inp, existingCustomers));
}

// ─── Tier badge helper ────────────────────────────────────

export function getTierColor(tier) {
  switch (tier) {
    case 'Platinum': return '#6b1d2a';
    case 'Gold': return '#c9973a';
    case 'Silver': return '#a89a9d';
    case 'Bronze': return '#7a4a2a';
    default: return '#6b5b5e';
  }
}
