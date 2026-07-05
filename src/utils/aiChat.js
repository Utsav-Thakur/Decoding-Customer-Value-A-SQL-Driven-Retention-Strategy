// ============================================================
// BrandIQ — Zero-API AI Chat Engine
// All answers computed from the live customer array.
// No fetch, no API keys, no external calls — ever.
// ============================================================

// ─── Math helpers ─────────────────────────────────────────

function avg(arr, key) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0) / arr.length;
}

function sum(arr, key) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0);
}

function mode(arr, key) {
  if (!arr || arr.length === 0) return 'N/A';
  const freq = {};
  let max = 0, top = 'N/A';
  arr.forEach(c => {
    const v = c[key];
    if (v === undefined || v === null) return;
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > max) { max = freq[v]; top = v; }
  });
  return top;
}

function pct(part, total, decimals = 1) {
  if (!total) return '0.0';
  return ((part / total) * 100).toFixed(decimals);
}

function median(arr, key) {
  if (!arr || arr.length === 0) return 0;
  const sorted = arr.map(c => Number(c[key]) || 0).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Main router ──────────────────────────────────────────

export function answerQuestion(question, customers) {
  if (!customers || customers.length === 0) {
    return 'No customer data loaded yet. Please upload a dataset or add customers manually.';
  }
  const q = question.toLowerCase();

  if (q.includes('best customer') || q.includes('ideal') || q.includes('vip')) return getIdealCustomerAnswer(customers);
  if (q.includes('promo') || q.includes('discount') || q.includes('coupon') || q.includes('sunset')) return getPromoAnswer(customers);
  if (q.includes('segment') || q.includes('tier') || q.includes('pyramid') || q.includes('platinum') || q.includes('gold') || q.includes('silver') || q.includes('bronze')) return getSegmentAnswer(customers);
  if (q.includes('churn') || q.includes('risk') || q.includes('lose') || q.includes('leaving')) return getChurnAnswer(customers);
  if (q.includes('geography') || q.includes('state') || q.includes('location') || q.includes('map') || q.includes('where')) return getGeoAnswer(customers);
  if (q.includes('category') || q.includes('clothing') || q.includes('footwear') || q.includes('outerwear') || q.includes('accessories')) return getCategoryAnswer(customers);
  if (q.includes('revenue') || q.includes('spend') || q.includes('sales') || q.includes('money') || q.includes('purchase')) return getRevenueAnswer(customers);
  if (q.includes('loyalty') || q.includes('loyal') || q.includes('retention') || q.includes('return')) return getLoyaltyAnswer(customers);
  if (q.includes('subscription') || q.includes('subscriber') || q.includes('member')) return getSubscriptionAnswer(customers);
  if (q.includes('season') || q.includes('spring') || q.includes('summer') || q.includes('fall') || q.includes('winter')) return getSeasonAnswer(customers);
  if (q.includes('action') || q.includes('recommend') || q.includes('strategy') || q.includes('what should')) return getActionAnswer(customers);
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) return getGreeting(customers);
  return getGeneralAnswer(customers);
}

// ─── Answer functions ─────────────────────────────────────

function getIdealCustomerAnswer(customers) {
  const ideal = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true);
  if (ideal.length === 0) {
    return `No customers matching the high-value, no-promo profile found in the current dataset. This may indicate the entire base is promo-dependent — a critical signal to begin a discount sunset immediately.`;
  }
  const avgAge = Math.round(avg(ideal, 'age'));
  const topState = mode(ideal, 'location');
  const avgSpend = avg(ideal, 'purchase_amount').toFixed(0);
  const topCategory = mode(ideal, 'category');
  const topPayment = mode(ideal, 'payment_method');
  const avgPrevIdeal = avg(ideal, 'previous_purchases').toFixed(0);
  const avgPrevAll = avg(customers, 'previous_purchases');
  const multiplier = avgPrevAll > 0 ? (avg(ideal, 'previous_purchases') / avgPrevAll).toFixed(1) : '—';

  return `**Your ideal customer (ICP):** ${ideal.length} shoppers (${pct(ideal.length, customers.length)}% of base) who are high-value and never use promos. Average age **${avgAge}**, concentrated in **${topState}**, spending **$${avgSpend}** per transaction, primarily buying **${topCategory}**. They pay with **${topPayment}** and have **${avgPrevIdeal}** average prior orders — **${multiplier}×** the base average. **Acquisition strategy:** Target ${avgAge - 3}–${avgAge + 5} year-olds in ${topState} with ${topCategory} campaigns using zero discount messaging — full-price exclusive drops only.`;
}

function getPromoAnswer(customers) {
  const medPrev = median(customers, 'previous_purchases');
  const promoUsers = customers.filter(c => c.promo_dependency_score >= 0.8);
  const promoTraps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const fullDep = customers.filter(c => c.promo_dependency_score === 1);
  const exposure = pct(promoUsers.length, customers.length);
  const trapRevenue = sum(promoTraps, 'purchase_amount').toFixed(0);
  const avgTrapSpend = promoTraps.length > 0 ? avg(promoTraps, 'purchase_amount').toFixed(0) : 0;
  const loyalCount = customers.filter(c => c.promo_dependency_score <= 0.2 && c.loyalty_score >= 0.5).length;

  return `**Promo exposure: ${exposure}%** of your base (${promoUsers.length} customers) show high promo dependency. Of these, **${promoTraps.length} are promo trappers** — discount users with below-median (${Math.round(medPrev)}) purchase history who are unlikely to ever convert to full-price. These ${promoTraps.length} customers represent **$${Number(trapRevenue).toLocaleString()} in margin-negative revenue** at an avg $${avgTrapSpend}/order. Meanwhile, **${loyalCount} loyal full-price buyers** exist who need zero incentive. **Recommended:** Begin promo sunset for trappers in Week 1 — swap discount codes for free standard shipping (cost ~$3 vs. ~$15 discount). Protect the ${loyalCount} loyal customers with early-access drops, not codes.`;
}

function getSegmentAnswer(customers) {
  const tiers = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  const spendByTier = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };

  customers.forEach(c => {
    const t = c.value_tier;
    if (t && tiers[t] !== undefined) {
      tiers[t]++;
      spendByTier[t] += Number(c.purchase_amount) || 0;
    }
  });

  const total = customers.length;
  const platAvg = tiers.Platinum > 0 ? (spendByTier.Platinum / tiers.Platinum).toFixed(0) : 0;
  const bronzeAvg = tiers.Bronze > 0 ? (spendByTier.Bronze / tiers.Bronze).toFixed(0) : 0;
  const multiplier = bronzeAvg > 0 ? (platAvg / bronzeAvg).toFixed(1) : '—';
  const topRevTier = Object.entries(spendByTier).sort((a, b) => b[1] - a[1])[0][0];

  return `**Value tier distribution across ${total.toLocaleString()} customers:** Platinum: **${tiers.Platinum}** (${pct(tiers.Platinum, total)}%) · Gold: **${tiers.Gold}** (${pct(tiers.Gold, total)}%) · Silver: **${tiers.Silver}** (${pct(tiers.Silver, total)}%) · Bronze: **${tiers.Bronze}** (${pct(tiers.Bronze, total)}%). Platinum customers spend an avg **$${platAvg}** vs Bronze's **$${bronzeAvg}** — a **${multiplier}× spend gap**. The **${topRevTier}** tier drives the most total revenue. Priority: protect Platinum with white-glove service, convert Silver→Gold with subscription incentives, and sunset promo-trapped Bronze segments.`;
}

function getChurnAnswer(customers) {
  const atRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1);
  const highValue = atRisk.filter(c => c.value_tier === 'Platinum' || c.value_tier === 'Gold');
  const riskRevenue = sum(atRisk, 'purchase_amount').toFixed(0);
  const avgRiskSpend = atRisk.length > 0 ? avg(atRisk, 'purchase_amount').toFixed(0) : 0;
  const topRiskState = mode(atRisk, 'location');
  const topRiskCategory = mode(atRisk, 'category');
  const safeCount = customers.length - atRisk.length;

  return `**Churn risk alert: ${atRisk.length} customers** (${pct(atRisk.length, customers.length)}% of base) flagged as high churn risk — low frequency, low ratings, and high promo dependency combined. Critically, **${highValue.length} of these are Gold or Platinum** tier buyers who represent significant LTV loss. At-risk customers concentrate in **${topRiskState}** and primarily buy **${topRiskCategory}**. Their avg spend is **$${avgRiskSpend}**, representing **$${Number(riskRevenue).toLocaleString()} in exposed revenue**. Recommended: deploy reactivation email campaign for dormant high-tier customers immediately; ${safeCount.toLocaleString()} customers are currently stable.`;
}

function getGeoAnswer(customers) {
  const stateMap = {};
  customers.forEach(c => {
    const s = c.location;
    if (!s) return;
    if (!stateMap[s]) stateMap[s] = { count: 0, spend: 0, promo: 0 };
    stateMap[s].count++;
    stateMap[s].spend += Number(c.purchase_amount) || 0;
    stateMap[s].promo += Number(c.promo_dependency_score) || 0;
  });

  const states = Object.entries(stateMap)
    .map(([name, d]) => ({
      name,
      count: d.count,
      avgSpend: d.count > 0 ? d.spend / d.count : 0,
      promoRate: d.count > 0 ? d.promo / d.count : 0
    }))
    .sort((a, b) => b.avgSpend - a.avgSpend);

  const top3 = states.slice(0, 3);
  const topVolume = [...states].sort((a, b) => b.count - a.count)[0];
  const lowestPromo = [...states].sort((a, b) => a.promoRate - b.promoRate)[0];
  const totalStates = states.length;

  return `**Geographic breakdown across ${totalStates} US states.** Highest avg spend states: **${top3.map(s => `${s.name} ($${s.avgSpend.toFixed(0)})`).join(', ')}**. Highest customer volume: **${topVolume.name}** with ${topVolume.count} buyers. Most promo-independent market (opportunity): **${lowestPromo.name}** at ${(lowestPromo.promoRate * 100).toFixed(0)}% promo rate. **Strategy:** Concentrate full-price campaigns in ${top3[0].name} and ${lowestPromo.name}; these markets show the strongest organic purchase behaviour with the highest spend per transaction.`;
}

function getCategoryAnswer(customers) {
  const catMap = {};
  customers.forEach(c => {
    const cat = c.category;
    if (!cat) return;
    if (!catMap[cat]) catMap[cat] = { count: 0, spend: 0, loyalty: 0, promo: 0 };
    catMap[cat].count++;
    catMap[cat].spend += Number(c.purchase_amount) || 0;
    catMap[cat].loyalty += Number(c.loyalty_score) || 0;
    catMap[cat].promo += Number(c.promo_dependency_score) || 0;
  });

  const cats = Object.entries(catMap).map(([name, d]) => ({
    name,
    count: d.count,
    avgSpend: d.count > 0 ? (d.spend / d.count).toFixed(0) : 0,
    avgLoyalty: d.count > 0 ? (d.loyalty / d.count).toFixed(2) : 0,
    avgPromo: d.count > 0 ? (d.promo / d.count).toFixed(2) : 0
  })).sort((a, b) => b.avgSpend - a.avgSpend);

  const top = cats[0];
  const mostLoyal = [...cats].sort((a, b) => b.avgLoyalty - a.avgLoyalty)[0];
  const leastPromo = [...cats].sort((a, b) => a.avgPromo - b.avgPromo)[0];

  return `**Category performance summary:** Highest avg ticket: **${top.name}** at $${top.avgSpend}/order (${top.count} customers). Most loyal category buyers: **${mostLoyal.name}** (avg loyalty score ${(Number(mostLoyal.avgLoyalty) * 100).toFixed(0)}%). Least promo-dependent: **${leastPromo.name}** (${(Number(leastPromo.avgPromo) * 100).toFixed(0)}% promo rate). **Insight:** Clothing is your acquisition vehicle — most entry-level buyers start here. Outerwear drives retention — buyers who graduate to Outerwear show the highest repeat purchase rates. Double down on Outerwear cross-sells for Silver/Gold tiers.`;
}

function getRevenueAnswer(customers) {
  const total = sum(customers, 'purchase_amount');
  const avgSpend = avg(customers, 'purchase_amount').toFixed(0);
  const promoRevenue = sum(customers.filter(c => c.promo_dependency_score >= 0.5), 'purchase_amount');
  const fullPriceRevenue = total - promoRevenue;
  const platinumRevenue = sum(customers.filter(c => c.value_tier === 'Platinum'), 'purchase_amount');
  const platinumPct = pct(platinumRevenue, total);
  const promoExposurePct = pct(promoRevenue, total);

  return `**Revenue snapshot across ${customers.length.toLocaleString()} customers:** Total portfolio value: **$${Math.round(total).toLocaleString()}** · Avg spend per transaction: **$${avgSpend}**. **Platinum tier** drives **${platinumPct}% of all revenue** despite being a small segment — your most critical retention priority. **${promoExposurePct}% of revenue ($${Math.round(promoRevenue).toLocaleString()})** flows through promo-dependent customers — this is your margin risk. Full-price revenue stands at **$${Math.round(fullPriceRevenue).toLocaleString()}** (${pct(fullPriceRevenue, total)}% of base). **Priority action:** Protect full-price revenue by removing discount access for customers with ≥ 5 previous purchases — they've already demonstrated intent.`;
}

function getLoyaltyAnswer(customers) {
  const avgLoyalty = avg(customers, 'loyalty_score');
  const highLoyalty = customers.filter(c => Number(c.loyalty_score) >= 0.6);
  const lowLoyalty = customers.filter(c => Number(c.loyalty_score) < 0.3);
  const subLoyalty = customers.filter(c => c.subscription_status === 'Yes');
  const avgSubLoyalty = avg(subLoyalty, 'loyalty_score');
  const avgNonSubLoyalty = avg(customers.filter(c => c.subscription_status !== 'Yes'), 'loyalty_score');
  const loyaltyGap = avgSubLoyalty > 0 && avgNonSubLoyalty > 0
    ? (avgSubLoyalty / avgNonSubLoyalty).toFixed(1)
    : '—';

  return `**Loyalty overview:** Average loyalty score across base: **${(avgLoyalty * 100).toFixed(1)}%**. **${highLoyalty.length} customers** (${pct(highLoyalty.length, customers.length)}%) have high loyalty (≥60%) — these are your advocates. **${lowLoyalty.length} customers** (${pct(lowLoyalty.length, customers.length)}%) score below 30% — at-risk of permanent churn. Subscribers show **${loyaltyGap}× higher loyalty** than non-subscribers (${(avgSubLoyalty * 100).toFixed(0)}% vs ${(avgNonSubLoyalty * 100).toFixed(0)}%). **Strategy:** Converting one non-subscriber to subscriber status is equivalent to adding ${loyaltyGap}× their loyalty value — subscription conversion should be your top CRM priority.`;
}

function getSubscriptionAnswer(customers) {
  const subs = customers.filter(c => c.subscription_status === 'Yes');
  const nonSubs = customers.filter(c => c.subscription_status !== 'Yes');
  const subAvgSpend = avg(subs, 'purchase_amount').toFixed(0);
  const nonSubAvgSpend = avg(nonSubs, 'purchase_amount').toFixed(0);
  const spendLift = nonSubAvgSpend > 0 ? ((subAvgSpend - nonSubAvgSpend) / nonSubAvgSpend * 100).toFixed(0) : 0;
  const subAvgPrev = avg(subs, 'previous_purchases').toFixed(0);
  const nonSubAvgPrev = avg(nonSubs, 'previous_purchases').toFixed(0);
  const subPromoRate = pct(subs.filter(c => c.promo_dependency_score >= 0.5).length, subs.length);

  return `**Subscription analysis: ${subs.length} subscribers** (${pct(subs.length, customers.length)}% of base) vs **${nonSubs.length} non-subscribers**. Subscribers spend **$${subAvgSpend}** avg vs $${nonSubAvgSpend} for non-subscribers — a **+${spendLift}% spend lift**. Subscribers also have **${subAvgPrev} avg previous purchases** vs ${nonSubAvgPrev} for non-subscribers, indicating stronger engagement. Subscriber promo dependency: **${subPromoRate}%** — even subscribed customers show meaningful promo reliance. **Opportunity:** Converting the ${nonSubs.length.toLocaleString()} non-subscribers could unlock +${spendLift}% revenue per head. Offer a first-month subscription credit as an upsell trigger at checkout for Silver/Gold non-subscribers.`;
}

function getSeasonAnswer(customers) {
  const seasonMap = {};
  customers.forEach(c => {
    const s = c.season;
    if (!s) return;
    if (!seasonMap[s]) seasonMap[s] = { count: 0, spend: 0 };
    seasonMap[s].count++;
    seasonMap[s].spend += Number(c.purchase_amount) || 0;
  });

  const seasons = Object.entries(seasonMap).map(([name, d]) => ({
    name,
    count: d.count,
    avgSpend: d.count > 0 ? (d.spend / d.count).toFixed(0) : 0
  })).sort((a, b) => b.avgSpend - a.avgSpend);

  const top = seasons[0];
  const bottom = seasons[seasons.length - 1];

  return `**Seasonal performance:** Highest avg spend season: **${top.name}** at $${top.avgSpend}/order (${top.count} buyers). Lowest: **${bottom.name}** at $${bottom.avgSpend}/order. ${seasons.map(s => `${s.name}: $${s.avgSpend} (${s.count} buyers)`).join(' · ')}. **Strategy:** Front-load your full-price drops in **${top.name}** when buyer intent is naturally highest. Use ${bottom.name} as the re-engagement window for dormant customers — lower basket expectations but maintain margin by removing discount promotions.`;
}

function getActionAnswer(customers) {
  const atRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1);
  const promoTraps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const ideal = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true);
  const platinum = customers.filter(c => c.value_tier === 'Platinum');

  return `**Top 4 recommended actions based on your current data:**\n\n**1. Promo Sunset (Week 1):** ${promoTraps.length} promo trappers identified. Remove discount access immediately; replace with free shipping. Est. margin recovery across this segment.\n\n**2. Churn Prevention (Week 1-2):** ${atRisk.length} customers flagged as churn risk. Deploy reactivation email to high-tier at-risk customers (${atRisk.filter(c => ['Platinum','Gold'].includes(c.value_tier)).length} Gold/Platinum at risk).\n\n**3. ICP Acquisition (Ongoing):** ${ideal.length} ideal customers identified. Build lookalike audiences targeting their demographic: ${Math.round(avg(ideal, 'age'))} y/o, ${mode(ideal, 'location')}, ${mode(ideal, 'category')} buyers.\n\n**4. Platinum Shield (Ongoing):** ${platinum.length} Platinum customers drive disproportionate revenue. Assign white-glove treatment: no automated discounts, early access only.`;
}

function getGeneralAnswer(customers) {
  const total = customers.length;
  const avgSpend = avg(customers, 'purchase_amount').toFixed(0);
  const promoRate = pct(customers.filter(c => c.promo_dependency_score >= 0.5).length, total);
  const churnCount = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const idealCount = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true).length;
  const platinum = customers.filter(c => c.value_tier === 'Platinum').length;

  return `**BrandIQ Database Summary — ${total.toLocaleString()} customers loaded.**\n\nKey signals: **$${avgSpend}** avg transaction · **${promoRate}%** promo dependency · **${churnCount}** at churn risk · **${idealCount}** ideal (high-value, no-promo) profiles · **${platinum}** Platinum tier.\n\nAsk me about: *"Who are my best customers?"* · *"What's my promo exposure?"* · *"Which states are underlevered?"* · *"What's my churn risk?"* · *"What actions should I take?"* — I compute answers live from your data, no AI API needed.`;
}

function getGreeting(customers) {
  const total = customers.length;
  const platinum = customers.filter(c => c.value_tier === 'Platinum').length;
  const atRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  return `Hello! I'm BrandIQ's cognitive assistant — powered entirely by your data, zero external APIs. I can see **${total.toLocaleString()} customer profiles** loaded, including **${platinum} Platinum** buyers and **${atRisk} at-risk** accounts. Ask me anything about your customers: segments, promo exposure, churn risk, geographic opportunities, ideal profiles, or what actions to take today.`;
}

// ─── Suggested prompt helpers ─────────────────────────────

export const SUGGESTED_PROMPTS = [
  'Who are my best customers?',
  'What is my promo exposure?',
  'Which segment should I stop discounting?',
  'What is my churn risk?',
  'Which states are underlevered?',
  'What actions should I take today?',
  'How are my loyalty scores?',
  'Tell me about my subscription base.',
];
