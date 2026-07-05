export const FREQ_MAP = {
  'Weekly': 7,
  'Fortnightly': 6,
  'Bi-Weekly': 5,
  'Monthly': 4,
  'Quarterly': 3,
  'Every 3 Months': 2,
  'Annually': 1
};

export function engineerFeatures(rawCustomers) {
  if (!rawCustomers || rawCustomers.length === 0) return [];

  // Helper to parse numerical values
  const getNum = (val) => {
    if (val === undefined || val === null) return 0;
    const n = Number(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // 1. Standardize keys and read raw properties
  const customers = rawCustomers.map((c, idx) => {
    const rawId = c['Customer ID'] || c['customer_id'] || c['customerId'] || (idx + 1);
    const age = getNum(c['Age'] || c['age']);
    const gender = c['Gender'] || c['gender'] || 'Unspecified';
    const item = c['Item Purchased'] || c['item_purchased'] || c['itemPurchased'] || 'Unknown';
    const category = c['Category'] || c['category'] || 'Other';
    const spend = getNum(c['Purchase Amount (USD)'] || c['purchase_amount'] || c['purchaseAmount'] || c['spend']);
    const location = c['Location'] || c['location'] || 'Unknown';
    const size = c['Size'] || c['size'] || 'M';
    const color = c['Color'] || c['color'] || 'Unknown';
    const season = c['Season'] || c['season'] || 'All';
    const rating = getNum(c['Review Rating'] || c['review_rating'] || c['reviewRating'] || c['rating']);
    const subStatus = c['Subscription Status'] || c['subscription_status'] || c['subscriptionStatus'] || 'No';
    const shippingType = c['Shipping Type'] || c['shipping_type'] || c['shippingType'] || 'Standard';
    
    const discountApplied = c['Discount Applied'] || c['discount_applied'] || c['discountApplied'] || 'No';
    const promoUsed = c['Promo Code Used'] || c['promo_code_used'] || c['promoCodeUsed'] || 'No';
    const prevPurchases = getNum(c['Previous Purchases'] || c['previous_purchases'] || c['previousPurchases'] || 0);
    const paymentMethod = c['Payment Method'] || c['payment_method'] || c['paymentMethod'] || 'Credit Card';
    const frequency = c['Frequency of Purchases'] || c['frequency_of_purchases'] || c['frequencyOfPurchases'] || 'Monthly';

    // frequency score
    const freqScore = FREQ_MAP[frequency] || 4;

    // promo dependency
    const discount_used = (String(discountApplied).toLowerCase() === 'yes' || discountApplied === true || discountApplied === 1) ? 1 : 0;
    const promo_used = (String(promoUsed).toLowerCase() === 'yes' || promoUsed === true || promoUsed === 1) ? 1 : 0;
    const promo_dependency_score = (discount_used + promo_used) / 2;

    const subscriber = (String(subStatus).toLowerCase() === 'yes' || subStatus === true || subStatus === 1) ? 1 : 0;

    let age_group = '56+';
    if (age <= 25) age_group = '18-25';
    else if (age <= 35) age_group = '26-35';
    else if (age <= 45) age_group = '36-45';
    else if (age <= 55) age_group = '46-55';

    return {
      customer_id: getNum(rawId),
      age,
      gender,
      item_purchased: item,
      category,
      purchase_amount: spend,
      location,
      size,
      color,
      season,
      review_rating: rating,
      subscription_status: subStatus,
      shipping_type: shippingType,
      discount_applied: discountApplied,
      promo_code_used: promoUsed,
      previous_purchases: prevPurchases,
      payment_method: paymentMethod,
      frequency_of_purchases: frequency,
      frequency_score: freqScore,
      promo_dependency_score,
      subscriber,
      age_group
    };
  });

  // 2. Compute min/max/median for normalization
  let maxPrev = 1;
  let minPrev = 0;
  let maxSpend = 1;
  let minSpend = 0;
  let maxRating = 5;
  let minRating = 1;

  if (customers.length > 0) {
    const prevs = customers.map(c => c.previous_purchases);
    const spends = customers.map(c => c.purchase_amount);
    const ratings = customers.map(c => c.review_rating);

    maxPrev = Math.max(...prevs);
    minPrev = Math.min(...prevs);
    maxSpend = Math.max(...spends);
    minSpend = Math.min(...spends);
    maxRating = Math.max(...ratings);
    minRating = Math.min(...ratings);
  }

  // Helper for median
  const getMedian = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const medianPrev = getMedian(customers.map(c => c.previous_purchases));

  // 3. Apply V1, V2 calculations
  const enriched = customers.map(c => {
    const previous_purchases_norm = maxPrev === minPrev ? 1 : (c.previous_purchases - minPrev) / (maxPrev - minPrev);
    const spend_norm = maxSpend === minSpend ? 1 : (c.purchase_amount - minSpend) / (maxSpend - minSpend);
    const rating_norm = maxRating === minRating ? 1 : (c.review_rating - minRating) / (maxRating - minRating);
    const promo_free = 1 - c.promo_dependency_score;

    const freqNorm = c.frequency_score / 7;
    const loyalty_v1 = freqNorm * 0.4 + previous_purchases_norm * 0.4 + c.subscriber * 0.2;
    const loyalty_v2 = spend_norm * 0.35 + previous_purchases_norm * 0.35 + rating_norm * 0.2 + promo_free * 0.1;

    const loyalty_score = loyalty_v1;
    const composite_value = loyalty_score + spend_norm;

    const satisfaction_flag = c.review_rating >= 4.0;
    const spend_efficiency = c.purchase_amount / (c.previous_purchases + 1);
    const churn_risk = c.frequency_score <= 2 && c.review_rating < 3.5 && c.promo_dependency_score >= 0.5;

    return {
      ...c,
      loyalty_score,
      loyalty_v1,
      loyalty_v2,
      composite_value,
      satisfaction_flag,
      spend_efficiency,
      churn_risk
    };
  });

  // 4. Compute quartiles for value_tier assignment
  const sortedByComposite = [...enriched].sort((a, b) => a.composite_value - b.composite_value);
  const n = sortedByComposite.length;

  const enrichedWithTiers = enriched.map(c => {
    const idx = sortedByComposite.findIndex(s => s.customer_id === c.customer_id);
    const percentile = (idx / n) * 100;

    let value_tier = 'Bronze';
    if (percentile > 75) {
      value_tier = 'Platinum';
    } else if (percentile > 50) {
      value_tier = 'Gold';
    } else if (percentile > 25) {
      value_tier = 'Silver';
    }

    const high_value_no_promo = (value_tier === 'Gold' || value_tier === 'Platinum') && c.promo_dependency_score === 0;
    const promo_trap = c.promo_dependency_score === 1 && c.previous_purchases < medianPrev;

    return {
      ...c,
      value_tier,
      high_value_no_promo,
      promo_trap
    };
  });

  return enrichedWithTiers;
}

export function computeStats(customers) {
  if (!customers || customers.length === 0) {
    return {
      totalCustomers: 0,
      promoRate: 0,
      subscriberRate: 0,
      avgPurchase: 0,
      avgPreviousPurchases: 0,
      tierBreakdown: { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 },
      segmentBreakdown: { Loyal: 0, ChurnRisk: 0, PromoTrap: 0, Dormant: 0 },
      categoryAnalysis: [],
      stateAnalysis: [],
      idealProfile: {}
    };
  }

  const total = customers.length;
  let promoCount = 0;
  let subCount = 0;
  let totalSpend = 0;
  let totalPrev = 0;

  const tiers = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  const segments = { Loyal: 0, ChurnRisk: 0, PromoTrap: 0, Dormant: 0 };

  const categories = {};
  const states = {};

  customers.forEach(c => {
    if (c.promo_dependency_score > 0) promoCount++;
    if (c.subscriber === 1) subCount++;
    totalSpend += c.purchase_amount;
    totalPrev += c.previous_purchases;

    // Tiers
    if (tiers[c.value_tier] !== undefined) {
      tiers[c.value_tier]++;
    }

    // Segments
    if (c.loyalty_score >= 0.6 && c.promo_dependency_score <= 0.2) segments.Loyal++;
    if (c.churn_risk) segments.ChurnRisk++;
    if (c.promo_trap) segments.PromoTrap++;
    if (c.frequency_score <= 2 && c.subscriber === 0) segments.Dormant++;

    // Categories
    if (!categories[c.category]) {
      categories[c.category] = { count: 0, spend: 0, prevSum: 0, items: {} };
    }
    categories[c.category].count++;
    categories[c.category].spend += c.purchase_amount;
    categories[c.category].prevSum += c.previous_purchases;
    categories[c.category].items[c.item_purchased] = (categories[c.category].items[c.item_purchased] || 0) + 1;

    // States
    if (!states[c.location]) {
      states[c.location] = { count: 0, spend: 0, ratingSum: 0, promoSum: 0 };
    }
    states[c.location].count++;
    states[c.location].spend += c.purchase_amount;
    states[c.location].ratingSum += c.review_rating;
    states[c.location].promoSum += c.promo_dependency_score;
  });

  // Compute average rating and opportunity score for states
  const stateAnalysisList = Object.keys(states).map(name => {
    const count = states[name].count;
    const avgSpend = states[name].spend / count;
    const avgPromo = states[name].promoSum / count;
    // Opportunity score: high spend + low promo = organic pull
    // we can scale spend/100 * (1 - avgPromo)
    const oppScore = Number(((avgSpend / 100) * (1 - avgPromo) * 10).toFixed(2));
    
    return {
      name,
      customers: count,
      spend: states[name].spend,
      avgSpend: Number(avgSpend.toFixed(2)),
      avgPromo: Number((avgPromo * 100).toFixed(1)),
      avgRating: Number((states[name].ratingSum / count).toFixed(2)),
      oppScore
    };
  }).sort((a, b) => b.oppScore - a.oppScore);

  const categoryAnalysisList = Object.keys(categories).map(name => ({
    name,
    customers: categories[name].count,
    spend: categories[name].spend,
    avgSpend: Number((categories[name].spend / categories[name].count).toFixed(2)),
    avgPrev: Number((categories[name].prevSum / categories[name].count).toFixed(1)),
    topItems: Object.keys(categories[name].items)
      .map(item => ({ item, count: categories[name].items[item] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }));

  // Ideal Profile computation (Top 10% by composite_value)
  const sorted = [...customers].sort((a, b) => b.composite_value - a.composite_value);
  const top10PercentCount = Math.max(1, Math.floor(total * 0.1));
  const top10 = sorted.slice(0, top10PercentCount);

  // Find mode for categorical fields in top 10
  const getMode = (arr) => {
    if (arr.length === 0) return 'N/A';
    const counts = {};
    let max = 0;
    let mode = arr[0];
    arr.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > max) {
        max = counts[val];
        mode = val;
      }
    });
    return mode;
  };

  const getTopStates = (list) => {
    const counts = {};
    list.forEach(c => {
      counts[c.location] = (counts[c.location] || 0) + 1;
    });
    return Object.keys(counts)
      .map(state => ({ state, count: counts[state] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => s.state)
      .join(', ');
  };

  const idealProfile = {
    avgAge: Number((top10.reduce((acc, c) => acc + c.age, 0) / top10PercentCount).toFixed(1)),
    preferredCategory: getMode(top10.map(c => c.category)),
    preferredColor: getMode(top10.map(c => c.color)),
    preferredSize: getMode(top10.map(c => c.size)),
    preferredSeason: getMode(top10.map(c => c.season)),
    preferredPayment: getMode(top10.map(c => c.payment_method)),
    avgSpend: Number((top10.reduce((acc, c) => acc + c.purchase_amount, 0) / top10PercentCount).toFixed(1)),
    avgPreviousPurchases: Number((top10.reduce((acc, c) => acc + c.previous_purchases, 0) / top10PercentCount).toFixed(1)),
    topStates: getTopStates(top10),
    satisfactionPct: Number(((top10.filter(c => c.satisfaction_flag).length / top10PercentCount) * 100).toFixed(1))
  };

  return {
    totalCustomers: total,
    promoRate: Number(((promoCount / total) * 100).toFixed(1)),
    subscriberRate: Number(((subCount / total) * 100).toFixed(1)),
    avgPurchase: Number((totalSpend / total).toFixed(2)),
    avgPreviousPurchases: Number((totalPrev / total).toFixed(1)),
    tierBreakdown: tiers,
    segmentBreakdown: segments,
    categoryAnalysis: categoryAnalysisList,
    stateAnalysis: stateAnalysisList,
    idealProfile
  };
}
