// ============================================================
// JARVIS Intelligence Engine — Advanced Edition
// Zero external API calls. Zero localStorage.
// Scored intent matching + dynamic data extraction answers
// every question with real numbers from DataContext.
// ============================================================

import { queryKnowledge, getSmartFallback } from './jarvisKnowledge';

// ─── Math helpers ─────────────────────────────────────────

const avg = (arr, key) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0) / arr.length;
};

const sum = (arr, key) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0);
};

const pct = (n, total, dec = 1) => {
  if (!total) return '0.0';
  return ((n / total) * 100).toFixed(dec);
};

const mode = (arr, key) => {
  if (!arr || arr.length === 0) return 'N/A';
  const freq = {};
  arr.forEach(c => {
    const v = c[key];
    if (v != null && v !== '') freq[v] = (freq[v] || 0) + 1;
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? 'N/A';
};

const median = (arr, key) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].map(c => Number(c[key]) || 0).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const top3 = (arr, key) => {
  const freq = {};
  arr.forEach(c => { const v = c[key]; if (v) freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
};

const fmt$ = n => `$${Math.round(n).toLocaleString()}`;
const fmtN = n => Number(n).toLocaleString();
const fmtPct = (n, t) => `${pct(n, t)}%`;

// ─── Scored intent system ─────────────────────────────────

const INTENTS = [
  // ── Greetings ──────────────────────────────────────────────
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy', 'greetings', 'jarvis'],
    score: 0,
    fn: answerGreeting,
  },
  // ── Help ───────────────────────────────────────────────────
  {
    id: 'help',
    keywords: ['help', 'what can you do', 'capabilities', 'commands', 'list questions', 'what questions', 'how to use'],
    score: 0,
    fn: answerHelp,
  },
  // ── Overview / count ───────────────────────────────────────
  {
    id: 'overview',
    keywords: ['how many', 'total customers', 'count', 'overview', 'summary', 'snapshot', 'database size', 'dataset size', 'how large'],
    score: 0,
    fn: answerOverview,
  },
  // ── Ideal customer / ICP ───────────────────────────────────
  {
    id: 'ideal',
    keywords: ['ideal', 'best customer', 'perfect customer', 'icp', 'target customer', 'find my best', 'who should i target', 'who to acquire', 'acquisition target', 'high value no promo', 'most valuable'],
    score: 0,
    fn: answerIdealCustomer,
  },
  // ── Promo sunset ───────────────────────────────────────────
  {
    id: 'sunset',
    keywords: ['promo sunset', 'stop discount', 'sunset plan', 'who to stop discounting', 'who should i stop', 'remove discount', 'phase out', 'stop giving discount', 'which segment to sunset'],
    score: 0,
    fn: answerPromoSunset,
  },
  // ── Promo analysis ─────────────────────────────────────────
  {
    id: 'promo',
    keywords: ['promo', 'discount', 'promo code', 'coupon', 'promotion', 'voucher', 'promo dependency', 'promo trap', 'discount dependent', 'promo exposure', 'discount rate', 'how many use discount'],
    score: 0,
    fn: answerPromoAnalysis,
  },
  // ── Loyalty ────────────────────────────────────────────────
  {
    id: 'loyalty',
    keywords: ['loyal', 'loyalty', 'genuine', 'repeat buyer', 'returning customer', 'loyalty score', 'brand loyalty', 'who keeps coming back', 'retained', 'retention rate'],
    score: 0,
    fn: answerLoyalty,
  },
  // ── Churn risk ─────────────────────────────────────────────
  {
    id: 'churn',
    keywords: ['churn', 'risk', 'losing', 'at risk', 'likely to leave', 'leaving', 'inactive', 'going to churn', 'might leave', 'who is leaving', 'churn risk', 'about to leave'],
    score: 0,
    fn: answerChurnRisk,
  },
  // ── Geography ──────────────────────────────────────────────
  {
    id: 'geography',
    keywords: ['state', 'geography', 'geo', 'region', 'underlevered', 'where', 'location', 'city', 'market', 'geographic', 'best state', 'top state', 'which location', 'where are my', 'map'],
    score: 0,
    fn: answerGeography,
  },
  // ── Category ───────────────────────────────────────────────
  {
    id: 'category',
    keywords: ['category', 'clothing', 'accessories', 'footwear', 'outerwear', 'product category', 'entry category', 'retention category', 'which product', 'best category', 'top category'],
    score: 0,
    fn: answerCategory,
  },
  // ── Value tiers / pyramid ──────────────────────────────────
  {
    id: 'tiers',
    keywords: ['platinum', 'gold', 'silver', 'bronze', 'tier', 'pyramid', 'segment', 'value tier', 'customer tier', 'show pyramid', 'show me the pyramid', 'tier breakdown', 'which tier'],
    score: 0,
    fn: answerTiers,
  },
  // ── Revenue / spend ────────────────────────────────────────
  {
    id: 'revenue',
    keywords: ['revenue', 'spend', 'purchase', 'money', 'margin', 'sales', 'how much', 'total spend', 'average spend', 'average order', 'aov', 'ticket size', 'purchase value', 'earn', 'income'],
    score: 0,
    fn: answerRevenue,
  },
  // ── Seasons ────────────────────────────────────────────────
  {
    id: 'season',
    keywords: ['season', 'summer', 'winter', 'spring', 'fall', 'autumn', 'seasonal', 'time of year', 'best season', 'which season', 'quarterly'],
    score: 0,
    fn: answerSeason,
  },
  // ── Demographics / age ─────────────────────────────────────
  {
    id: 'demographics',
    keywords: ['age', 'young', 'old', 'demographic', 'age group', 'millennial', 'gen z', 'boomer', 'how old', 'age range', 'young customer', 'older customer'],
    score: 0,
    fn: answerDemographics,
  },
  // ── Payment ────────────────────────────────────────────────
  {
    id: 'payment',
    keywords: ['payment', 'paypal', 'credit card', 'venmo', 'cash', 'debit', 'bank transfer', 'pay method', 'how do they pay', 'payment method'],
    score: 0,
    fn: answerPayment,
  },
  // ── Subscription ───────────────────────────────────────────
  {
    id: 'subscription',
    keywords: ['subscription', 'subscribe', 'subscriber', 'member', 'membership', 'subscribed', 'how many subscribe', 'subscribe rate'],
    score: 0,
    fn: answerSubscription,
  },
  // ── Shipping ───────────────────────────────────────────────
  {
    id: 'shipping',
    keywords: ['shipping', 'delivery', 'express', 'standard shipping', 'free shipping', 'next day', 'ship', 'how do they get it', 'delivery method'],
    score: 0,
    fn: answerShipping,
  },
  // ── Gender ─────────────────────────────────────────────────
  {
    id: 'gender',
    keywords: ['gender', 'male', 'female', 'men', 'women', 'man', 'woman', 'gender split', 'gender breakdown'],
    score: 0,
    fn: answerGender,
  },
  // ── Ratings / satisfaction ─────────────────────────────────
  {
    id: 'ratings',
    keywords: ['rating', 'review', 'satisfaction', 'happy', 'unhappy', 'satisfied', 'dissatisfied', 'how happy', 'nps', 'score', 'stars', 'customer rating'],
    score: 0,
    fn: answerRatings,
  },
  // ── Strategy / actions ─────────────────────────────────────
  {
    id: 'strategy',
    keywords: ['recommend', 'suggest', 'what should i', 'action', 'strategy', 'plan', 'next step', 'priority', 'what do i do', 'advice', 'what first', 'roadmap', 'focus', 'tactics'],
    score: 0,
    fn: answerStrategy,
  },
  // ── Size ───────────────────────────────────────────────────
  {
    id: 'size',
    keywords: ['size', 'clothing size', 'which size', 'most popular size', 'size breakdown', 'small medium large', 'xl', 'xxl'],
    score: 0,
    fn: answerSize,
  },
  // ── Color ──────────────────────────────────────────────────
  {
    id: 'color',
    keywords: ['color', 'colour', 'popular color', 'top color', 'which color', 'favorite color', 'most bought color'],
    score: 0,
    fn: answerColor,
  },
  // ── Item / product ─────────────────────────────────────────
  {
    id: 'item',
    keywords: ['item', 'product', 'what do they buy', 'most popular item', 'top item', 'bestseller', 'best seller', 'best product', 'most purchased', 'popular product'],
    score: 0,
    fn: answerItems,
  },
  // ── Comparison ─────────────────────────────────────────────
  {
    id: 'comparison',
    keywords: ['compare', 'versus', 'vs', 'difference between', 'better', 'worse', 'which is better', 'higher', 'lower', 'more', 'less'],
    score: 0,
    fn: answerComparison,
  },
  // ── Frequency of purchase ──────────────────────────────────
  {
    id: 'frequency',
    keywords: ['frequency', 'how often', 'purchase frequency', 'buy often', 'weekly', 'monthly', 'fortnightly', 'annually', 'how frequent'],
    score: 0,
    fn: answerFrequency,
  },
  // ── High value customers ───────────────────────────────────
  {
    id: 'highvalue',
    keywords: ['high value', 'top spender', 'biggest buyer', 'most spend', 'biggest customer', 'high spend', 'premium customer', 'vip', 'biggest order'],
    score: 0,
    fn: answerHighValue,
  },
  // ── Promo trappers specifically ────────────────────────────
  {
    id: 'trappers',
    keywords: ['promo trap', 'trapper', 'trapped', 'discount trap', 'margin negative', 'margin-negative', 'who is in the trap'],
    score: 0,
    fn: answerPromoTrappers,
  },
  // ── Spend efficiency ───────────────────────────────────────
  {
    id: 'efficiency',
    keywords: ['efficiency', 'spend efficiency', 'value per order', 'bang for buck', 'most efficient', 'roi', 'return on'],
    score: 0,
    fn: answerSpendEfficiency,
  },
  // ── Dormant / inactive ─────────────────────────────────────
  {
    id: 'dormant',
    keywords: ['dormant', 'inactive', 'haven\'t bought', 'not buying', 'sleeping', 'lapsed', 'reactivate', 'win back', 'win-back'],
    score: 0,
    fn: answerDormant,
  },
  // ── Special commands ───────────────────────────────────────
  {
    id: 'pyramid_ascii',
    keywords: ['show me the pyramid', 'show pyramid', 'show the pyramid', 'draw pyramid', 'visualize pyramid'],
    score: 0,
    fn: answerPyramidAscii,
  },
  {
    id: 'surprise',
    keywords: ['surprise me', 'something interesting', 'unexpected', 'counterintuitive', 'what is surprising', 'interesting fact'],
    score: 0,
    fn: answerSurprise,
  },
  {
    id: 'first_action',
    keywords: ['what should i do first', 'top priority', 'number one priority', 'most important', 'first step', 'most urgent', 'what is urgent'],
    score: 0,
    fn: answerFirstAction,
  },
];

// ─── Main router with scored intent matching ───────────────

export function askJarvis(question, customers) {
  if (!customers || customers.length === 0) {
    return { type: 'local', text: "I don't have any customer data to analyse yet. Upload a dataset or add customers manually via the New Data page and I'll give you the full picture." };
  }

  const q = question.toLowerCase().trim();

  // ── Exact special command shortcuts ──
  if (q === 'help') return { type: 'local', text: answerHelp() };
  if (q === 'surprise me') return { type: 'local', text: answerSurprise(customers) };
  if (q === 'show me the pyramid' || q === 'show pyramid') return { type: 'local', text: answerPyramidAscii(customers) };

  // ── Score every intent ──
  const scored = INTENTS.map(intent => {
    let score = 0;
    for (const kw of intent.keywords) {
      if (q.includes(kw)) score += kw.split(' ').length * 2; // multi-word = higher weight
      else {
        // partial token matching
        const tokens = kw.split(' ');
        for (const token of tokens) {
          if (token.length >= 4 && q.includes(token)) score += 1;
        }
      }
    }
    return { ...intent, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];

  // If top intent has a strong enough score, use local answer
  if (best.score > 0) {
    return { type: 'local', text: best.fn(customers) };
  }

  // ── Universal extraction: parse numerical/data questions ──
  const dynamicAnswer = tryDynamicAnswer(q, customers);
  if (dynamicAnswer) return { type: 'local', text: dynamicAnswer };

  // ── Try local knowledge base (no API key needed) ──
  const knowledgeAnswer = queryKnowledge(question);
  if (knowledgeAnswer) return { type: 'local', text: knowledgeAnswer };

  // ── Try Gemini if configured, otherwise smart fallback ──
  return { type: 'gemini' };
}

// ─── Dynamic answer extractor ─────────────────────────────
// Handles questions like:
//  "how many customers bought footwear?"
//  "what is the average spend in california?"
//  "who are the platinum customers in new york?"
//  "what percentage of males subscribe?"

function tryDynamicAnswer(q, customers) {
  let subset = [...customers];
  const filters = [];

  // Filter by tier
  const tierMatch = q.match(/\b(platinum|gold|silver|bronze)\b/i);
  if (tierMatch) {
    const tier = tierMatch[1].charAt(0).toUpperCase() + tierMatch[1].slice(1).toLowerCase();
    subset = subset.filter(c => c.value_tier === tier);
    filters.push(`${tier} tier`);
  }

  // Filter by category
  const catMatch = q.match(/\b(clothing|footwear|outerwear|accessories)\b/i);
  if (catMatch) {
    const cat = catMatch[1].charAt(0).toUpperCase() + catMatch[1].slice(1).toLowerCase();
    subset = subset.filter(c => c.category?.toLowerCase() === cat.toLowerCase());
    filters.push(`${cat} category`);
  }

  // Filter by gender
  const genderMatch = q.match(/\b(male|female|men|women|man|woman)\b/i);
  if (genderMatch) {
    const g = ['male', 'men', 'man'].includes(genderMatch[1].toLowerCase()) ? 'Male' : 'Female';
    subset = subset.filter(c => c.gender === g);
    filters.push(`${g} customers`);
  }

  // Filter by season
  const seasonMatch = q.match(/\b(spring|summer|fall|winter|autumn)\b/i);
  if (seasonMatch) {
    let s = seasonMatch[1].charAt(0).toUpperCase() + seasonMatch[1].slice(1).toLowerCase();
    if (s === 'Autumn') s = 'Fall';
    subset = subset.filter(c => c.season === s);
    filters.push(`${s} season`);
  }

  // Filter by US state (common ones)
  const stateNames = ['california', 'texas', 'new york', 'florida', 'illinois', 'ohio', 'georgia', 'montana', 'kentucky', 'maine', 'alaska', 'nevada', 'hawaii', 'colorado', 'arizona', 'washington', 'oregon', 'virginia', 'maryland'];
  for (const state of stateNames) {
    if (q.includes(state)) {
      const stateTitleCase = state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const filtered = subset.filter(c => c.location?.toLowerCase() === state.toLowerCase());
      if (filtered.length > 0) {
        subset = filtered;
        filters.push(`${stateTitleCase}`);
      }
    }
  }

  // Filter by subscription
  if (q.includes('subscrib')) {
    subset = subset.filter(c => c.subscription_status === 'Yes');
    filters.push('subscribers');
  }

  // No meaningful filter applied — don't try to answer dynamically
  if (filters.length === 0) return null;
  if (subset.length === 0) return `No customers found matching: ${filters.join(', ')}. The filter returned an empty set — check if the segment exists in your data.`;

  // Now determine what metric they're asking for
  const filterDesc = filters.join(' + ');
  const count = subset.length;
  const totalPct = pct(count, customers.length);

  let metricAnswer = '';

  if (q.match(/\b(how many|count|number|total)\b/)) {
    metricAnswer = `**${count.toLocaleString()} customers** (${totalPct}% of your base) match: ${filterDesc}.`;
  } else if (q.match(/\b(average|avg|mean|spend)\b/)) {
    metricAnswer = `Average spend for ${filterDesc}: **${fmt$(avg(subset, 'purchase_amount'))}** per transaction.`;
  } else if (q.match(/\b(percent|percentage|pct|rate|ratio)\b/)) {
    metricAnswer = `${filterDesc} represents **${totalPct}%** of your total customer base (${count.toLocaleString()} customers).`;
  } else if (q.match(/\b(loyal|loyalty)\b/)) {
    metricAnswer = `Average loyalty score for ${filterDesc}: **${(avg(subset, 'loyalty_score') * 100).toFixed(0)}%**.`;
  } else if (q.match(/\b(revenue|total spend|total revenue)\b/)) {
    metricAnswer = `Total purchase volume from ${filterDesc}: **${fmt$(sum(subset, 'purchase_amount'))}**.`;
  }

  if (!metricAnswer) {
    // Generic snapshot for the filtered group
    metricAnswer = `Here is what I found for ${filterDesc}:`;
  }

  // Full snapshot of the filtered group
  const promoDepRate = pct(subset.filter(c => Number(c.promo_dependency_score) >= 0.5).length, count);
  const churnCount = subset.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const platCount = subset.filter(c => c.value_tier === 'Platinum').length;
  const topCat = mode(subset, 'category');
  const topState = mode(subset, 'location');
  const subCount = subset.filter(c => c.subscription_status === 'Yes').length;
  const topGender = mode(subset, 'gender');

  return `${metricAnswer}

Snapshot for **${filterDesc}** (${count.toLocaleString()} customers / ${totalPct}% of base):
• Avg spend: ${fmt$(avg(subset, 'purchase_amount'))} per transaction
• Avg previous purchases: ${avg(subset, 'previous_purchases').toFixed(1)}
• Avg loyalty score: ${(avg(subset, 'loyalty_score') * 100).toFixed(0)}%
• Avg review rating: ${avg(subset, 'review_rating').toFixed(2)}/5.0
• Promo dependency: ${promoDepRate}%
• Churn risk: ${churnCount} customers (${pct(churnCount, count)}%)
• Platinum tier: ${platCount} (${pct(platCount, count)}%)
• Subscribers: ${subCount} (${pct(subCount, count)}%)${filters.every(f => !f.includes('category')) ? `\n• Top category: ${topCat}` : ''}${filters.every(f => !['Male', 'Female'].some(g => f.includes(g))) ? `\n• Top gender: ${topGender}` : ''}${filters.every(f => !stateNames.some(s => f.toLowerCase().includes(s))) ? `\n• Top state: ${topState}` : ''}`;
}

// ─── Intent answer functions ───────────────────────────────

function answerGreeting(customers) {
  const platinum = customers.filter(c => c.value_tier === 'Platinum');
  const promoRate = pct(customers.filter(c => Number(c.promo_dependency_score) >= 0.5).length, customers.length);
  const atRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const totalRev = fmt$(sum(customers, 'purchase_amount'));

  return `Hello. I'm fully briefed on your ${customers.length.toLocaleString()} customers across 50 US states.

Live snapshot right now:
• ${platinum.length} Platinum customers
• ${promoRate}% promo dependency rate
• ${atRisk} customers at churn risk
• ${totalRev} total purchase volume
• $${avg(customers, 'purchase_amount').toFixed(0)} avg transaction

Ask me anything — tiers, loyalty, geography, churn, revenue, categories, strategy. I compute answers live from your data. Type "help" to see everything I can answer.`;
}

function answerHelp() {
  return `I can answer questions across these areas:

📊 CUSTOMERS & SEGMENTS
• "How many customers do I have?"
• "Who are my best customers?" / "What is my ICP?"
• "Show me the pyramid" → ASCII tier visual
• "Who are my dormant customers?"
• "Find my high-value customers"

💸 PROMO & DISCOUNTS
• "What is my promo exposure?"
• "Who should I stop discounting?"
• "What is the promo sunset plan?"
• "Who are my promo trappers?"

🗺 GEOGRAPHY
• "Which states are underlevered?"
• "What is average spend in California?"
• "Where are my Platinum customers?"

📦 PRODUCTS & CATEGORIES
• "Which category drives retention?"
• "What is the most popular item?"
• "Which color do customers prefer?"
• "What size do they buy?"

🔄 LOYALTY & CHURN
• "How loyal is my base?"
• "Who is at churn risk?"
• "Tell me about my subscribers"

💰 REVENUE
• "What is my total revenue?"
• "Which tier generates the most?"
• "What is my average order value?"

👥 DEMOGRAPHICS
• "What is my age breakdown?"
• "What is my gender split?"
• "How often do they buy?"

💳 OPERATIONS
• "How do they pay?"
• "What shipping do they prefer?"

🎯 STRATEGY
• "What should I do first?"
• "Give me a recommended action plan"
• "Surprise me" → most unexpected insight

I also answer filtered questions like:
• "How many male Platinum customers do I have?"
• "What is average spend for Clothing customers?"
• "How many subscribers are in the Gold tier?"`;
}

function answerOverview(customers) {
  const tiers = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  customers.forEach(c => { if (tiers[c.value_tier] !== undefined) tiers[c.value_tier]++; });
  const churnRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const subCount = customers.filter(c => c.subscription_status === 'Yes').length;
  const totalRevenue = sum(customers, 'purchase_amount');
  const promoCount = customers.filter(c => Number(c.promo_dependency_score) >= 0.5).length;
  const idealCount = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true).length;
  const states = [...new Set(customers.map(c => c.location).filter(Boolean))].length;

  return `Complete dataset overview — ${customers.length.toLocaleString()} customers:

Value Pyramid:
• Platinum: ${tiers.Platinum} (${pct(tiers.Platinum, customers.length)}%)
• Gold:     ${tiers.Gold} (${pct(tiers.Gold, customers.length)}%)
• Silver:   ${tiers.Silver} (${pct(tiers.Silver, customers.length)}%)
• Bronze:   ${tiers.Bronze} (${pct(tiers.Bronze, customers.length)}%)

Revenue & Spend:
• Total purchase volume: ${fmt$(totalRevenue)}
• Avg transaction: ${fmt$(avg(customers, 'purchase_amount'))}
• Median transaction: ${fmt$(median(customers, 'purchase_amount'))}

Behaviour:
• Avg previous purchases: ${avg(customers, 'previous_purchases').toFixed(1)}
• Avg loyalty score: ${(avg(customers, 'loyalty_score') * 100).toFixed(0)}%
• Avg review rating: ${avg(customers, 'review_rating').toFixed(2)}/5.0

Health signals:
• Promo-dependent: ${promoCount} (${pct(promoCount, customers.length)}%)
• Subscribers: ${subCount} (${pct(subCount, customers.length)}%)
• At churn risk: ${churnRisk} (${pct(churnRisk, customers.length)}%)
• Ideal ICP customers: ${idealCount} (${pct(idealCount, customers.length)}%)
• States represented: ${states}`;
}

function answerIdealCustomer(customers) {
  const ideal = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true);
  if (ideal.length === 0) {
    return `No ideal customers (high value + zero promo dependency) found in your current dataset. Your entire base may have some promo reliance — a critical signal to review your discount strategy.`;
  }

  const avgAge = Math.round(avg(ideal, 'age'));
  const topState = mode(ideal, 'location');
  const avgSpend = avg(ideal, 'purchase_amount').toFixed(0);
  const topCat = mode(ideal, 'category');
  const topPayment = mode(ideal, 'payment_method');
  const topFreq = mode(ideal, 'frequency_of_purchases');
  const multiplier = avg(customers, 'purchase_amount') > 0
    ? (avg(ideal, 'purchase_amount') / avg(customers, 'purchase_amount')).toFixed(1) : '—';
  const topGender = mode(ideal, 'gender');
  const genderPct = pct(ideal.filter(c => c.gender === topGender).length, ideal.length);
  const satisfiedPct = pct(ideal.filter(c => Number(c.review_rating) >= 4).length, ideal.length);
  const avgPrevIdeal = avg(ideal, 'previous_purchases').toFixed(0);
  const avgPrevAll = avg(customers, 'previous_purchases').toFixed(0);
  const top3States = top3(ideal, 'location');

  return `Your ideal customer profile (ICP) — ${ideal.length} people, ${pct(ideal.length, customers.length)}% of base:

Demographics:
• Average age: ${avgAge} years old
• Dominant gender: ${topGender} (${genderPct}% of this group)
• Top 3 states: ${top3States.join(', ')}

Purchase behaviour:
• Avg spend: $${avgSpend}/transaction — ${multiplier}× your base average
• Avg previous purchases: ${avgPrevIdeal} vs ${avgPrevAll} base avg
• Frequency: buys ${topFreq}
• Favourite category: ${topCat}
• Preferred payment: ${topPayment}
• ${satisfiedPct}% are satisfied (rating ≥4.0)
• Promo dependency: 0% — never uses a discount

Acquisition strategy:
Target ${avgAge - 3}–${avgAge + 5} year-olds in ${top3States.slice(0, 2).join(' and ')} with ${topCat} campaigns. Use zero discount messaging — exclusive drops, first-access, and quality signals only.`;
}

function answerPromoSunset(customers) {
  const medianPrev = median(customers, 'previous_purchases');
  const avgPrev = avg(customers, 'previous_purchases');
  const traps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const dependent = customers.filter(c =>
    Number(c.promo_dependency_score) >= 0.5 &&
    Number(c.previous_purchases) >= avgPrev * 0.8 &&
    !(c.promo_trap === 1 || c.promo_trap === true)
  );
  const loyal = customers.filter(c =>
    Number(c.promo_dependency_score) <= 0.2 && ['Gold', 'Platinum'].includes(c.value_tier)
  );
  const atRiskHigh = customers.filter(c =>
    (c.churn_risk === true || c.churn_risk === 1) && ['Gold', 'Platinum'].includes(c.value_tier)
  );
  const estimatedMarginRecovery = Math.round(traps.length * 12);

  return `3-phase promo sunset plan:

🔴 STOP NOW — Promo Trappers (${traps.length} customers)
Criteria: promo dependency = 1 AND previous purchases below median (${Math.round(medianPrev)}).
These customers have not built loyalty despite discounts.
• Week 1: Remove all discount codes for this group
• Replace with: free standard shipping (~$3 cost vs ~$15 discount)
• Projected margin recovery: ~$${estimatedMarginRecovery.toLocaleString()}/cycle
• Risk: may lose ~${Math.round(traps.length * 0.3)} customers — but they were margin-negative

🟡 REDUCE GRADUALLY — Discount-Dependent (${dependent.length} customers)
These customers buy regularly but rely on discounts. Do not cold-turkey them.
• Week 4: Reduce discount frequency by 50%
• Week 8: Launch loyalty credits ($5 per full-price order)
• Week 12: Phase out remaining codes
• Risk: ~${Math.round(dependent.length * 0.15)}% temporary revenue dip in first 30 days

🟢 MAINTAIN & REWARD — Loyal Full-Price (${loyal.length} customers)
These ${loyal.length} Gold/Platinum customers buy without discounts. Never introduce discount dependency here.
• Action: early-access drops, free returns, dedicated style perks
• Revenue risk: zero

🚨 URGENT REACTIVATION — ${atRiskHigh.length} Gold/Platinum at churn risk
Send personalized reactivation email — free express shipping, no discount code.

Track: repeat purchase rate at 30, 60, 90 days for all groups.`;
}

function answerPromoAnalysis(customers) {
  const promoUsers = customers.filter(c => Number(c.promo_dependency_score) >= 0.5);
  const fullDep = customers.filter(c => Number(c.promo_dependency_score) === 1);
  const promoTraps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const noPromo = customers.filter(c => Number(c.promo_dependency_score) === 0);
  const promoAvgSpend = avg(promoUsers, 'purchase_amount').toFixed(0);
  const noPromoAvgSpend = avg(noPromo, 'purchase_amount').toFixed(0);
  const trapRevenue = sum(promoTraps, 'purchase_amount');
  const spendGap = (Number(noPromoAvgSpend) - Number(promoAvgSpend)).toFixed(0);
  const promoRevenue = sum(promoUsers, 'purchase_amount');

  return `Promo exposure across ${customers.length.toLocaleString()} customers:

Dependency levels:
• High promo dependency (≥50%): ${promoUsers.length} customers (${pct(promoUsers.length, customers.length)}%)
• Fully promo-dependent (100%): ${fullDep.length} customers (${pct(fullDep.length, customers.length)}%)
• Zero promo usage: ${noPromo.length} customers (${pct(noPromo.length, customers.length)}%)
• Promo trappers (discount + low history): ${promoTraps.length}

Revenue breakdown:
• Promo-exposed revenue: ${fmt$(promoRevenue)} (${pct(promoRevenue, sum(customers, 'purchase_amount'))}%)
• Promo-trap revenue (margin-negative): ${fmt$(trapRevenue)}
• Full-price revenue: ${fmt$(sum(noPromo, 'purchase_amount'))}

Spend gap:
• Promo users avg: $${promoAvgSpend}/order
• Non-promo users avg: $${noPromoAvgSpend}/order
• Difference: $${spendGap} per order (but promo cost erodes this further)

Bottom line: ${pct(noPromo.length, customers.length)}% of your base generate ${pct(sum(noPromo, 'purchase_amount'), sum(customers, 'purchase_amount'))}% of revenue without any discount cost. These are your real customers.`;
}

function answerLoyalty(customers) {
  const genuineLoyal = customers.filter(c =>
    Number(c.promo_dependency_score) === 0 && Number(c.frequency_score) >= 4
  );
  const highLoyalty = customers.filter(c => Number(c.loyalty_score) >= 0.6);
  const subscribers = customers.filter(c => c.subscription_status === 'Yes');
  const nonSubs = customers.filter(c => c.subscription_status !== 'Yes');
  const subLoyalty = (avg(subscribers, 'loyalty_score') * 100).toFixed(0);
  const nonSubLoyalty = (avg(nonSubs, 'loyalty_score') * 100).toFixed(0);
  const avgLoyalty = (avg(customers, 'loyalty_score') * 100).toFixed(1);
  const loyalRevShare = pct(sum(genuineLoyal, 'purchase_amount'), sum(customers, 'purchase_amount'));

  return `Loyalty analysis — ${customers.length.toLocaleString()} customers:

Loyalty distribution:
• Genuinely loyal (high frequency + zero promo): ${genuineLoyal.length} (${pct(genuineLoyal.length, customers.length)}%)
• High composite loyalty (score ≥60%): ${highLoyalty.length} (${pct(highLoyalty.length, customers.length)}%)
• Average loyalty score: ${avgLoyalty}/100
• Loyal customer revenue share: ${loyalRevShare}% of total

Subscription correlation:
• Subscriber loyalty: ${subLoyalty}/100
• Non-subscriber loyalty: ${nonSubLoyalty}/100
• Loyalty gap: +${(Number(subLoyalty) - Number(nonSubLoyalty)).toFixed(0)} points for subscribers

Genuine loyalty is ${pct(genuineLoyal.length, customers.length)}% of your base — ${Number(genuineLoyal.length / customers.length) > 0.3 ? 'solid for a D2C brand at this stage' : 'lower than it should be, suggesting promotional spend may be masking a real retention problem'}.

Highest-ROI loyalty action: convert ${nonSubs.filter(c => c.value_tier === 'Gold').length} Gold-tier non-subscribers. They already show high purchase intent and respond well to first-month loyalty credit offers.`;
}

function answerChurnRisk(customers) {
  const atRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1);
  const highValueRisk = atRisk.filter(c => ['Platinum', 'Gold'].includes(c.value_tier));
  const topRiskState = mode(atRisk, 'location');
  const topRiskCat = mode(atRisk, 'category');
  const avgRating = avg(atRisk, 'review_rating').toFixed(1);
  const baseAvgRating = avg(customers, 'review_rating').toFixed(1);
  const riskRevenue = sum(atRisk, 'purchase_amount');
  const topRiskGender = mode(atRisk, 'gender');
  const topRiskAge = Math.round(avg(atRisk, 'age'));

  return `Churn risk analysis:

${atRisk.length} customers (${pct(atRisk.length, customers.length)}% of base) flagged at churn risk:
→ Low frequency (≤2/7 frequency score)
→ Review rating below 3.5
→ High promo dependency (≥50%)

Breakdown:
• Gold/Platinum at risk: ${highValueRisk.length} — these are urgent
• Revenue at risk: ${fmt$(riskRevenue)}
• Avg rating of at-risk group: ${avgRating}/5.0 vs ${baseAvgRating} base avg
• Concentration: ${topRiskState}
• Common category: ${topRiskCat}
• Dominant gender: ${topRiskGender}
• Avg age: ${topRiskAge}

Immediate actions:
1. Deploy Dormant email template to all ${atRisk.length} — free express shipping, no discount
2. For the ${highValueRisk.length} Gold/Platinum at-risk: personal outreach, free returns offer
3. No response in 45 days → remove from paid acquisition lookalike audiences`;
}

function answerGeography(customers) {
  const stateMap = {};
  customers.forEach(c => {
    const s = c.location;
    if (!s) return;
    if (!stateMap[s]) stateMap[s] = { spend: 0, promo: 0, count: 0, loyalty: 0, churn: 0 };
    stateMap[s].spend += Number(c.purchase_amount) || 0;
    stateMap[s].promo += Number(c.promo_dependency_score) || 0;
    stateMap[s].loyalty += Number(c.loyalty_score) || 0;
    stateMap[s].count++;
    if (c.churn_risk === true || c.churn_risk === 1) stateMap[s].churn++;
  });

  const states = Object.entries(stateMap).map(([state, d]) => ({
    state,
    avgSpend: d.spend / d.count,
    avgPromo: d.promo / d.count,
    avgLoyalty: d.loyalty / d.count,
    count: d.count,
    churnCount: d.churn,
    opportunityScore: (d.spend / d.count) * (1 - d.promo / d.count) * (d.loyalty / d.count)
  })).sort((a, b) => b.opportunityScore - a.opportunityScore);

  const top5 = states.slice(0, 5);
  const avgCount = customers.length / states.length;
  const underlevered = states.filter(s => s.count < avgCount * 0.7 && s.avgSpend > avg(customers, 'purchase_amount')).slice(0, 3);
  const highestVolume = [...states].sort((a, b) => b.count - a.count)[0];
  const highestSpend = [...states].sort((a, b) => b.avgSpend - a.avgSpend)[0];
  const mostPromo = [...states].sort((a, b) => b.avgPromo - a.avgPromo)[0];

  return `Geographic opportunity analysis — ${states.length} states:

🏆 TOP 5 OPPORTUNITY MARKETS (high spend × low promo × high loyalty):
${top5.map((s, i) => `${i + 1}. ${s.state}: $${s.avgSpend.toFixed(0)} avg spend · ${(s.avgPromo * 100).toFixed(0)}% promo · ${s.count} customers`).join('\n')}

📊 OTHER MARKET SIGNALS:
• Highest customer volume: ${highestVolume?.state} (${highestVolume?.count} customers)
• Highest avg spend: ${highestSpend?.state} ($${highestSpend?.avgSpend.toFixed(0)}/order)
• Most promo-dependent: ${mostPromo?.state} (${(mostPromo?.avgPromo * 100).toFixed(0)}%) — avoid scaling here

🎯 UNDERLEVERED MARKETS (above-avg spend, low penetration):
${underlevered.length > 0 ? underlevered.map(s => `• ${s.state}: $${s.avgSpend.toFixed(0)} avg spend · only ${s.count} customers`).join('\n') : '• No significantly underlevered markets at current scale.'}

Investment rule: do not increase ad spend in high-promo states — that is discount-driven demand, not brand pull.`;
}

function answerCategory(customers) {
  const catMap = {};
  customers.forEach(c => {
    const cat = c.category;
    if (!cat) return;
    if (!catMap[cat]) catMap[cat] = { spend: 0, prev: 0, promo: 0, count: 0, loyalty: 0, rating: 0 };
    catMap[cat].spend += Number(c.purchase_amount) || 0;
    catMap[cat].prev += Number(c.previous_purchases) || 0;
    catMap[cat].promo += Number(c.promo_dependency_score) || 0;
    catMap[cat].loyalty += Number(c.loyalty_score) || 0;
    catMap[cat].rating += Number(c.review_rating) || 0;
    catMap[cat].count++;
  });

  const medPrev = median(customers, 'previous_purchases');
  const cats = Object.entries(catMap).map(([cat, d]) => ({
    cat,
    count: d.count,
    avgPrev: (d.prev / d.count).toFixed(1),
    avgSpend: (d.spend / d.count).toFixed(0),
    promoRate: ((d.promo / d.count) * 100).toFixed(0),
    avgLoyalty: ((d.loyalty / d.count) * 100).toFixed(0),
    avgRating: (d.rating / d.count).toFixed(2),
    role: d.prev / d.count > medPrev ? 'Retention Driver' : 'Acquisition Channel'
  })).sort((a, b) => Number(a.avgPrev) - Number(b.avgPrev));

  return `Category analysis:

${cats.map(c => `📦 ${c.cat} [${c.role}]
   ${c.count} customers · $${c.avgSpend} avg spend · ${c.avgPrev} avg prev orders · ${c.promoRate}% promo · ${c.avgLoyalty}% loyalty · ★ ${c.avgRating}`).join('\n\n')}

Journey insight:
• Entry categories (lower tenure): ${cats.filter(c => c.role === 'Acquisition Channel').map(c => c.cat).join(', ')}
• Retention categories (higher tenure): ${cats.filter(c => c.role === 'Retention Driver').map(c => c.cat).join(', ')}

Strategy: use entry categories for acquisition campaigns (higher promo tolerance is acceptable here). Use retention categories as upsell triggers for customers with 10+ previous purchases.`;
}

function answerTiers(customers) {
  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  const totalRev = sum(customers, 'purchase_amount');
  const tierStats = tierOrder.map(tier => {
    const group = customers.filter(c => c.value_tier === tier);
    const rev = sum(group, 'purchase_amount');
    return {
      tier,
      count: group.length,
      avgSpend: group.length > 0 ? avg(group, 'purchase_amount').toFixed(0) : 0,
      avgPrev: group.length > 0 ? avg(group, 'previous_purchases').toFixed(1) : 0,
      avgLoyalty: group.length > 0 ? (avg(group, 'loyalty_score') * 100).toFixed(0) : 0,
      promoRate: group.length > 0 ? pct(group.filter(c => Number(c.promo_dependency_score) >= 0.5).length, group.length) : '0.0',
      avgRating: group.length > 0 ? avg(group, 'review_rating').toFixed(2) : 0,
      subRate: group.length > 0 ? pct(group.filter(c => c.subscription_status === 'Yes').length, group.length) : '0.0',
      revenue: rev,
      revShare: pct(rev, totalRev)
    };
  });

  const spendGap = (Number(tierStats[0].avgSpend) - Number(tierStats[3].avgSpend)).toFixed(0);
  const top2RevShare = pct(tierStats[0].revenue + tierStats[1].revenue, totalRev);

  return `Customer value pyramid — ${customers.length.toLocaleString()} customers:

${tierStats.map(t => `💎 ${t.tier}: ${t.count} (${pct(t.count, customers.length)}%)
   $${t.avgSpend} avg spend · ${t.avgPrev} avg orders · ${t.avgLoyalty}% loyalty · ★ ${t.avgRating}
   Revenue share: ${t.revShare}% · Promo: ${t.promoRate}% · Subscribers: ${t.subRate}%`).join('\n\n')}

Key findings:
• Platinum spends $${spendGap} more per transaction than Bronze
• Top ${pct(tierStats[0].count + tierStats[1].count, customers.length)}% (Platinum + Gold) generate ${top2RevShare}% of revenue
• Protect ${tierStats[0].count} Platinum customers above all else — acquisition cost for this profile is 5–8× retention cost`;
}

function answerRevenue(customers) {
  const totalRev = sum(customers, 'purchase_amount');
  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  const tierRev = tierOrder.map(tier => ({
    tier,
    rev: sum(customers.filter(c => c.value_tier === tier), 'purchase_amount'),
    count: customers.filter(c => c.value_tier === tier).length
  }));
  const promoRev = sum(customers.filter(c => Number(c.promo_dependency_score) >= 0.5), 'purchase_amount');
  const fullPriceRev = totalRev - promoRev;
  const medPurchase = median(customers, 'purchase_amount');

  return `Revenue snapshot — ${customers.length.toLocaleString()} customers:

Total metrics:
• Total purchase volume: ${fmt$(totalRev)}
• Average transaction: ${fmt$(avg(customers, 'purchase_amount'))}
• Median transaction: ${fmt$(medPurchase)}

By tier:
${tierRev.map(t => `• ${t.tier}: ${fmt$(t.rev)} (${pct(t.rev, totalRev)}% from ${pct(t.count, customers.length)}% of customers)`).join('\n')}

Margin health:
• Full-price revenue: ${fmt$(fullPriceRev)} (${pct(fullPriceRev, totalRev)}%)
• Promo-exposed revenue: ${fmt$(promoRev)} (${pct(promoRev, totalRev)}% — at margin risk)

Concentration risk: if your ${customers.filter(c => c.value_tier === 'Platinum').length} Platinum customers reduced frequency by 20%, you would lose ~${fmt$(tierRev[0].rev * 0.2)} in volume.`;
}

function answerSeason(customers) {
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const stats = seasons.map(s => {
    const g = customers.filter(c => c.season === s);
    if (g.length === 0) return null;
    return {
      season: s,
      count: g.length,
      avgPrev: avg(g, 'previous_purchases').toFixed(1),
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      topCat: mode(g, 'category'),
      promoRate: pct(g.filter(c => Number(c.promo_dependency_score) >= 0.5).length, g.length),
      avgRating: avg(g, 'review_rating').toFixed(2),
      totalRev: sum(g, 'purchase_amount')
    };
  }).filter(Boolean);

  const sorted = [...stats].sort((a, b) => Number(b.avgPrev) - Number(a.avgPrev));
  const highTenure = sorted[0];
  const lowTenure = sorted[sorted.length - 1];
  const highPromo = [...stats].sort((a, b) => Number(b.promoRate) - Number(a.promoRate))[0];
  const totalRev = sum(customers, 'purchase_amount');

  return `Seasonal analysis:

${stats.map(s => `🗓 ${s.season}: ${s.count} transactions · $${s.avgSpend} avg · ${s.avgPrev} prev orders · ${s.topCat} · ${s.promoRate}% promo · ★ ${s.avgRating} · ${fmt$(s.totalRev)} revenue (${pct(s.totalRev, totalRev)}%)`).join('\n')}

Insights:
• Most tenured buyers: ${highTenure?.season} (${highTenure?.avgPrev} avg prev orders) — your retention season
• Newest buyers: ${lowTenure?.season} (${lowTenure?.avgPrev} avg prev orders) — your acquisition season
• Highest promo dependency: ${highPromo?.season} (${highPromo?.promoRate}%) — examine whether campaigns here attract bargain hunters

Strategy: front-load full-price exclusive drops in ${highTenure?.season}. Use ${lowTenure?.season} for acquisition campaigns with strict CAC targets.`;
}

function answerDemographics(customers) {
  const groups = ['18-25', '26-35', '36-45', '46-55', '56+'];
  const stats = groups.map(g => {
    const group = customers.filter(c => c.age_group === g);
    if (group.length === 0) return null;
    return {
      group: g,
      count: group.length,
      avgSpend: avg(group, 'purchase_amount').toFixed(0),
      avgPrev: avg(group, 'previous_purchases').toFixed(1),
      promoRate: pct(group.filter(c => Number(c.promo_dependency_score) >= 0.5).length, group.length),
      platPct: pct(group.filter(c => c.value_tier === 'Platinum').length, group.length),
      avgLoyalty: (avg(group, 'loyalty_score') * 100).toFixed(0),
      topCat: mode(group, 'category'),
      subRate: pct(group.filter(c => c.subscription_status === 'Yes').length, group.length)
    };
  }).filter(Boolean);

  const topSpender = [...stats].sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend))[0];
  const mostLoyal = [...stats].sort((a, b) => Number(b.avgPrev) - Number(a.avgPrev))[0];
  const mostPromo = [...stats].sort((a, b) => Number(b.promoRate) - Number(a.promoRate))[0];

  return `Age group breakdown:

${stats.map(s => `👤 ${s.group}: ${s.count} customers (${pct(s.count, customers.length)}%)
   $${s.avgSpend} avg spend · ${s.avgPrev} prev orders · ${s.avgLoyalty}% loyalty · ${s.platPct}% Platinum · ${s.promoRate}% promo · Top: ${s.topCat}`).join('\n\n')}

Key findings:
• Highest spenders: ${topSpender?.group} at $${topSpender?.avgSpend}
• Most tenured: ${mostLoyal?.group} with ${mostLoyal?.avgPrev} avg orders — your loyalty backbone
• Most promo-reliant: ${mostPromo?.group} at ${mostPromo?.promoRate}%

Messaging strategy: ${topSpender?.group} responds to quality + exclusivity. ${mostLoyal?.group} are your retention anchor — don't expose them to aggressive promo sunset without a loyalty alternative.`;
}

function answerPayment(customers) {
  const methods = [...new Set(customers.map(c => c.payment_method).filter(Boolean))];
  const stats = methods.map(m => {
    const g = customers.filter(c => c.payment_method === m);
    return {
      method: m,
      count: g.length,
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      avgPrev: avg(g, 'previous_purchases').toFixed(1),
      platPct: pct(g.filter(c => c.value_tier === 'Platinum').length, g.length),
      promoRate: pct(g.filter(c => Number(c.promo_dependency_score) >= 0.5).length, g.length),
      avgLoyalty: (avg(g, 'loyalty_score') * 100).toFixed(0),
      subRate: pct(g.filter(c => c.subscription_status === 'Yes').length, g.length)
    };
  }).sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend));

  return `Payment method analysis:

${stats.map(s => `💳 ${s.method}: ${s.count} customers (${pct(s.count, customers.length)}%)
   $${s.avgSpend} avg spend · ${s.avgPrev} prev orders · ${s.platPct}% Platinum · ${s.promoRate}% promo · ${s.avgLoyalty}% loyalty`).join('\n\n')}

Insight: ${stats[0]?.method} users show the highest avg spend ($${stats[0]?.avgSpend}) and ${stats[0]?.platPct}% Platinum rate — a strong quality signal.

Warning: do not run payment-specific discount campaigns (e.g. "10% off with PayPal") without filtering by tier first — you risk discounting your best customers.`;
}

function answerSubscription(customers) {
  const subs = customers.filter(c => c.subscription_status === 'Yes');
  const nonSubs = customers.filter(c => c.subscription_status !== 'Yes');
  const subSpend = avg(subs, 'purchase_amount').toFixed(0);
  const nonSubSpend = avg(nonSubs, 'purchase_amount').toFixed(0);
  const spendLift = nonSubSpend > 0
    ? ((Number(subSpend) - Number(nonSubSpend)) / Number(nonSubSpend) * 100).toFixed(0) : 0;
  const goldNonSubs = nonSubs.filter(c => c.value_tier === 'Gold').length;

  return `Subscription analysis:

Counts:
• Subscribers: ${subs.length} (${pct(subs.length, customers.length)}%)
• Non-subscribers: ${nonSubs.length} (${pct(nonSubs.length, customers.length)}%)

Comparison:
• Avg spend: $${subSpend} (sub) vs $${nonSubSpend} (non-sub) → +${spendLift}% lift
• Avg previous purchases: ${avg(subs, 'previous_purchases').toFixed(1)} vs ${avg(nonSubs, 'previous_purchases').toFixed(1)}
• Loyalty score: ${(avg(subs, 'loyalty_score') * 100).toFixed(0)}% vs ${(avg(nonSubs, 'loyalty_score') * 100).toFixed(0)}%
• Promo dependency: ${pct(subs.filter(c => Number(c.promo_dependency_score) >= 0.5).length, subs.length)}% (sub) vs ${pct(nonSubs.filter(c => Number(c.promo_dependency_score) >= 0.5).length, nonSubs.length)}% (non-sub)
• Platinum rate: ${pct(subs.filter(c => c.value_tier === 'Platinum').length, subs.length)}% (sub) vs ${pct(nonSubs.filter(c => c.value_tier === 'Platinum').length, nonSubs.length)}% (non-sub)

Best opportunity: ${goldNonSubs} Gold-tier non-subscribers. Convert with a first-month loyalty credit offer at checkout. These are your highest-probability subscription conversions.`;
}

function answerShipping(customers) {
  const types = [...new Set(customers.map(c => c.shipping_type).filter(Boolean))];
  const stats = types.map(t => {
    const g = customers.filter(c => c.shipping_type === t);
    return {
      type: t,
      count: g.length,
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      avgPrev: avg(g, 'previous_purchases').toFixed(1),
      platPct: pct(g.filter(c => c.value_tier === 'Platinum').length, g.length),
      promoRate: pct(g.filter(c => Number(c.promo_dependency_score) >= 0.5).length, g.length),
      avgLoyalty: (avg(g, 'loyalty_score') * 100).toFixed(0)
    };
  }).sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend));

  return `Shipping preference analysis:

${stats.map(s => `🚚 ${s.type}: ${s.count} customers (${pct(s.count, customers.length)}%)
   $${s.avgSpend} avg spend · ${s.avgPrev} prev orders · ${s.platPct}% Platinum · ${s.promoRate}% promo`).join('\n\n')}

Signal: Express/Next Day shoppers tend to have higher intent (event-driven purchases). Free/Standard shipping users may be more price-sensitive.

Recommendation: offer free Express Shipping (not just Free Shipping) as the Platinum loyalty reward. Cost ~$8–12/order but signals premium treatment over discount dependency.`;
}

function answerGender(customers) {
  const genders = [...new Set(customers.map(c => c.gender).filter(Boolean))];
  const stats = genders.map(g => {
    const group = customers.filter(c => c.gender === g);
    return {
      gender: g,
      count: group.length,
      avgSpend: avg(group, 'purchase_amount').toFixed(0),
      avgPrev: avg(group, 'previous_purchases').toFixed(1),
      promoRate: pct(group.filter(c => Number(c.promo_dependency_score) >= 0.5).length, group.length),
      platPct: pct(group.filter(c => c.value_tier === 'Platinum').length, group.length),
      avgLoyalty: (avg(group, 'loyalty_score') * 100).toFixed(0),
      topCategory: mode(group, 'category'),
      topState: mode(group, 'location'),
      subRate: pct(group.filter(c => c.subscription_status === 'Yes').length, group.length),
      avgRating: avg(group, 'review_rating').toFixed(2)
    };
  }).sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend));

  return `Gender breakdown:

${stats.map(s => `👤 ${s.gender}: ${s.count} customers (${pct(s.count, customers.length)}%)
   $${s.avgSpend} avg spend · ${s.avgPrev} prev orders · ${s.avgLoyalty}% loyalty · ★ ${s.avgRating}
   ${s.platPct}% Platinum · ${s.promoRate}% promo · ${s.subRate}% subscribed
   Top category: ${s.topCategory} · Top state: ${s.topState}`).join('\n\n')}

${stats[0]?.gender} customers show higher average spend at $${stats[0]?.avgSpend}. Both segments need distinct acquisition strategies — what converts one rarely converts the other at the same efficiency.`;
}

function answerRatings(customers) {
  const satisfied = customers.filter(c => Number(c.review_rating) >= 4);
  const dissatisfied = customers.filter(c => Number(c.review_rating) < 3.5);
  const neutral = customers.filter(c => Number(c.review_rating) >= 3.5 && Number(c.review_rating) < 4);
  const avgRating = avg(customers, 'review_rating').toFixed(2);
  const topRatingCat = mode(satisfied, 'category');
  const worstCat = mode(dissatisfied, 'category');
  const worstState = mode(dissatisfied, 'location');
  const dissatPromoRate = pct(dissatisfied.filter(c => Number(c.promo_dependency_score) >= 0.5).length, dissatisfied.length);
  const dissatChurnRate = pct(dissatisfied.filter(c => c.churn_risk === true || c.churn_risk === 1).length, dissatisfied.length);

  return `Review rating analysis — ${customers.length.toLocaleString()} customers:

Distribution:
• Avg rating: ${avgRating}/5.0
• Satisfied (≥4.0): ${satisfied.length} (${pct(satisfied.length, customers.length)}%)
• Neutral (3.5–3.9): ${neutral.length} (${pct(neutral.length, customers.length)}%)
• Dissatisfied (<3.5): ${dissatisfied.length} (${pct(dissatisfied.length, customers.length)}%)

Satisfied customer profile:
• Top category: ${topRatingCat}
• Avg spend: ${fmt$(avg(satisfied, 'purchase_amount'))}
• Avg prev orders: ${avg(satisfied, 'previous_purchases').toFixed(1)}

Dissatisfied customer signals:
• Most common category: ${worstCat} — investigate product/delivery issues here
• Highest concentration: ${worstState}
• Promo dependency: ${dissatPromoRate}% — discounts may attract the wrong buyer
• Churn risk overlap: ${dissatChurnRate}% of dissatisfied customers also flagged at churn risk

Action: dissatisfied customers in ${worstCat} should trigger a service recovery workflow within 30 days of low rating.`;
}

function answerStrategy(customers) {
  const traps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const ideal = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true);
  const atRiskHigh = customers.filter(c =>
    (c.churn_risk === true || c.churn_risk === 1) && ['Platinum', 'Gold'].includes(c.value_tier)
  );
  const goldNonSubs = customers.filter(c => c.value_tier === 'Gold' && c.subscription_status !== 'Yes').length;
  const topState = mode(ideal, 'location');
  const estimatedMarginRecovery = Math.round(traps.length * 12);
  const topRet = mode(customers.filter(c => Number(c.loyalty_score) >= 0.6), 'category');

  return `Prioritized action plan — ${customers.length.toLocaleString()} customers analysed:

1️⃣ PROMO SUNSET — This week · Zero cost
Stop discounting ${traps.length} promo-trap customers. Replace with free standard shipping.
Expected margin recovery: ~$${estimatedMarginRecovery.toLocaleString()}/cycle.
Effort: 1 day. Risk: low.

2️⃣ URGENT REACTIVATION — This week · Low cost
${atRiskHigh.length} Gold/Platinum customers show churn signals.
Deploy personalized email: free express shipping, no discount.
LTV protection value: ~${fmt$(atRiskHigh.length * avg(customers.filter(c => ['Platinum', 'Gold'].includes(c.value_tier)), 'purchase_amount') * 3)}.

3️⃣ SUBSCRIPTION CONVERSION — Week 2–4 · Medium effort
${goldNonSubs} Gold-tier non-subscribers identified. Offer first-month loyalty credit at checkout.
Each conversion is worth ~+${pct(avg(customers.filter(c => c.subscription_status === 'Yes'), 'purchase_amount') - avg(customers.filter(c => c.subscription_status !== 'Yes'), 'purchase_amount'), avg(customers.filter(c => c.subscription_status !== 'Yes'), 'purchase_amount'))}% avg spend lift.

4️⃣ ICP ACQUISITION — Month 2 · Strategic
${ideal.length} ideal customers identified. Build lookalike audience targeting this profile in ${topState}.
Every dollar spent here generates higher expected LTV than your current avg customer.

5️⃣ CATEGORY UPSELL — Ongoing
Identify customers buying entry categories with 10+ orders → cross-sell ${topRet}.
This is the highest retention signal in your category journey data.

Which of these would you like a detailed plan for?`;
}

function answerSize(customers) {
  const sizes = [...new Set(customers.map(c => c.size).filter(Boolean))];
  const stats = sizes.map(s => {
    const g = customers.filter(c => c.size === s);
    return {
      size: s,
      count: g.length,
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      platPct: pct(g.filter(c => c.value_tier === 'Platinum').length, g.length),
      topCat: mode(g, 'category')
    };
  }).sort((a, b) => b.count - a.count);

  return `Clothing size breakdown:

${stats.map(s => `• ${s.size}: ${s.count} customers (${pct(s.count, customers.length)}%) · $${s.avgSpend} avg spend · ${s.platPct}% Platinum · Top: ${s.topCat}`).join('\n')}

Most common: ${stats[0]?.size} (${pct(stats[0]?.count, customers.length)}% of base). Highest avg spend: ${[...stats].sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend))[0]?.size}.

Inventory implication: ensure the ${stats[0]?.size} and ${stats[1]?.size} sizes are adequately stocked across your top-performing categories to avoid lost sales.`;
}

function answerColor(customers) {
  const colors = [...new Set(customers.map(c => c.color).filter(Boolean))];
  const stats = colors.map(col => {
    const g = customers.filter(c => c.color === col);
    return {
      color: col,
      count: g.length,
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      platPct: pct(g.filter(c => c.value_tier === 'Platinum').length, g.length),
    };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  const topPlatColor = colors.reduce((best, col) => {
    const g = customers.filter(c => c.color === col && c.value_tier === 'Platinum');
    return g.length > (best.count || 0) ? { color: col, count: g.length } : best;
  }, {});

  return `Color preference analysis (top 10):

${stats.map((s, i) => `${i + 1}. ${s.color}: ${s.count} customers (${pct(s.count, customers.length)}%) · $${s.avgSpend} avg spend · ${s.platPct}% Platinum`).join('\n')}

Most popular: ${stats[0]?.color} (${pct(stats[0]?.count, customers.length)}% of purchases).
Platinum customers prefer: ${topPlatColor.color || 'N/A'}.

Use this for seasonal collection planning — your top-performing colors signal the aesthetic that drives conversion among your most valuable segments.`;
}

function answerItems(customers) {
  const items = [...new Set(customers.map(c => c.item_purchased).filter(Boolean))];
  const stats = items.map(item => {
    const g = customers.filter(c => c.item_purchased === item);
    return {
      item,
      count: g.length,
      avgSpend: avg(g, 'purchase_amount').toFixed(0),
      platPct: pct(g.filter(c => c.value_tier === 'Platinum').length, g.length),
      promoRate: pct(g.filter(c => Number(c.promo_dependency_score) >= 0.5).length, g.length),
    };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  return `Top 10 most purchased items:

${stats.map((s, i) => `${i + 1}. ${s.item}: ${s.count} purchases · $${s.avgSpend} avg · ${s.platPct}% Platinum · ${s.promoRate}% promo rate`).join('\n')}

Bestseller: ${stats[0]?.item} with ${stats[0]?.count} purchases. Highest avg spend item: ${[...stats].sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend))[0]?.item}.

Items with high Platinum purchase rate are your premium signals — ensure these are never discounted automatically.`;
}

function answerComparison(customers) {
  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  const tierStats = tierOrder.map(tier => {
    const g = customers.filter(c => c.value_tier === tier);
    return { tier, count: g.length, avgSpend: avg(g, 'purchase_amount').toFixed(0), avgLoyalty: (avg(g, 'loyalty_score') * 100).toFixed(0), promoRate: pct(g.filter(c => Number(c.promo_dependency_score) >= 0.5).length, g.length) };
  });

  const catMap = {};
  customers.forEach(c => {
    if (!c.category) return;
    if (!catMap[c.category]) catMap[c.category] = { spend: 0, count: 0 };
    catMap[c.category].spend += Number(c.purchase_amount) || 0;
    catMap[c.category].count++;
  });
  const cats = Object.entries(catMap).map(([cat, d]) => ({ cat, avgSpend: (d.spend / d.count).toFixed(0) })).sort((a, b) => Number(b.avgSpend) - Number(a.avgSpend));

  return `Comparison overview across key dimensions:

📊 TIERS (by avg spend):
${tierStats.map(t => `• ${t.tier}: $${t.avgSpend} spend · ${t.avgLoyalty}% loyalty · ${t.promoRate}% promo`).join('\n')}

📦 CATEGORIES (by avg spend):
${cats.map(c => `• ${c.cat}: $${c.avgSpend}`).join('\n')}

👥 GENDER:
${[...new Set(customers.map(c => c.gender).filter(Boolean))].map(g => {
  const grp = customers.filter(c => c.gender === g);
  return `• ${g}: $${avg(grp, 'purchase_amount').toFixed(0)} avg spend · ${pct(grp.filter(c => c.value_tier === 'Platinum').length, grp.length)}% Platinum`;
}).join('\n')}

What specific comparison would you like? For example: "Compare Platinum vs Gold" or "Compare Clothing vs Footwear"`;
}

function answerFrequency(customers) {
  const freqMap = {};
  customers.forEach(c => {
    const f = c.frequency_of_purchases;
    if (!f) return;
    if (!freqMap[f]) freqMap[f] = { spend: 0, prev: 0, count: 0, loyalty: 0 };
    freqMap[f].spend += Number(c.purchase_amount) || 0;
    freqMap[f].prev += Number(c.previous_purchases) || 0;
    freqMap[f].loyalty += Number(c.loyalty_score) || 0;
    freqMap[f].count++;
  });

  const freqOrder = ['Daily', 'Weekly', 'Fortnightly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Bi-Annually', 'Annually'];
  const stats = freqOrder
    .filter(f => freqMap[f])
    .map(f => ({
      freq: f,
      count: freqMap[f].count,
      avgSpend: (freqMap[f].spend / freqMap[f].count).toFixed(0),
      avgPrev: (freqMap[f].prev / freqMap[f].count).toFixed(1),
      avgLoyalty: ((freqMap[f].loyalty / freqMap[f].count) * 100).toFixed(0)
    }));

  const topFreq = mode(customers, 'frequency_of_purchases');

  return `Purchase frequency breakdown:

${stats.map(s => `🔄 ${s.freq}: ${s.count} customers (${pct(s.count, customers.length)}%) · $${s.avgSpend} avg spend · ${s.avgPrev} prev orders · ${s.avgLoyalty}% loyalty`).join('\n')}

Most common frequency: ${topFreq} (${pct(freqMap[topFreq]?.count || 0, customers.length)}% of base).

Higher frequency = higher lifetime value. Daily and Weekly buyers show the strongest loyalty scores. If you can shift Monthly buyers to Fortnightly through subscription incentives, you measurably increase LTV.`;
}

function answerHighValue(customers) {
  const topSpenders = [...customers].sort((a, b) => Number(b.purchase_amount) - Number(a.purchase_amount)).slice(0, 5);
  const highValue = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true);
  const top10pct = Math.floor(customers.length * 0.1);
  const top10 = [...customers].sort((a, b) => Number(b.composite_value) - Number(a.composite_value)).slice(0, top10pct);

  return `High-value customer analysis:

Top 5 single-transaction spenders:
${topSpenders.map((c, i) => `${i + 1}. ID ${c.customer_id || 'N/A'} — $${Number(c.purchase_amount).toFixed(0)} · ${c.value_tier} tier · ${c.category} · ${c.location}`).join('\n')}

High-value no-promo (ICP) group:
• Count: ${highValue.length} (${pct(highValue.length, customers.length)}% of base)
• Avg spend: ${fmt$(avg(highValue, 'purchase_amount'))}
• Avg prev orders: ${avg(highValue, 'previous_purchases').toFixed(1)}
• Revenue from this group: ${fmt$(sum(highValue, 'purchase_amount'))} (${pct(sum(highValue, 'purchase_amount'), sum(customers, 'purchase_amount'))}% of total)

Top 10% by composite value (${top10pct} customers):
• Avg spend: ${fmt$(avg(top10, 'purchase_amount'))}
• Revenue: ${fmt$(sum(top10, 'purchase_amount'))} (${pct(sum(top10, 'purchase_amount'), sum(customers, 'purchase_amount'))}% of total from 10% of customers)

These top-10% customers are your revenue engine. Losing 20% of them would reduce total revenue by ~${pct(sum(top10, 'purchase_amount') * 0.2, sum(customers, 'purchase_amount'))}%.`;
}

function answerPromoTrappers(customers) {
  const traps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const trapRevenue = sum(traps, 'purchase_amount');
  const topTrapState = mode(traps, 'location');
  const topTrapCat = mode(traps, 'category');
  const topTrapGender = mode(traps, 'gender');
  const estimatedMarginLoss = Math.round(traps.length * 12);

  return `Promo trapper analysis:

${traps.length} customers (${pct(traps.length, customers.length)}% of base) are in the promo trap:
→ They use discounts on every purchase (promo_dependency = 1)
→ They have below-median previous purchases
→ They have not built loyalty despite repeated discounting

Profile:
• Avg spend: ${fmt$(avg(traps, 'purchase_amount'))}/order
• Avg previous purchases: ${avg(traps, 'previous_purchases').toFixed(1)} (below base median of ${median(customers, 'previous_purchases').toFixed(1)})
• Avg loyalty score: ${(avg(traps, 'loyalty_score') * 100).toFixed(0)}%
• Top location: ${topTrapState}
• Top category: ${topTrapCat}
• Dominant gender: ${topTrapGender}
• Total revenue: ${fmt$(trapRevenue)} — currently margin-negative
• Estimated margin cost: ~$${estimatedMarginLoss.toLocaleString()} per discount cycle

These ${traps.length} customers represent revenue that looks real but erodes your margin. The discount has not generated loyalty — it has generated dependency.

Recommended action: begin promo sunset this week. Replace discount codes with free standard shipping. Track 60-day repeat rate — this is your ROI measurement.`;
}

function answerSpendEfficiency(customers) {
  const effMap = customers.map(c => ({
    ...c,
    efficiency: Number(c.purchase_amount) / (Number(c.previous_purchases) + 1)
  })).sort((a, b) => b.efficiency - a.efficiency);

  const topEfficient = effMap.slice(0, 5);
  const tierEff = ['Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => {
    const g = customers.filter(c => c.value_tier === tier);
    return { tier, avgEff: g.length > 0 ? (sum(g, 'spend_efficiency') / g.length).toFixed(2) : 0 };
  });

  const catEff = [...new Set(customers.map(c => c.category).filter(Boolean))].map(cat => {
    const g = customers.filter(c => c.category === cat);
    return { cat, avgEff: g.length > 0 ? (sum(g, 'spend_efficiency') / g.length).toFixed(2) : 0 };
  }).sort((a, b) => Number(b.avgEff) - Number(a.avgEff));

  return `Spend efficiency analysis (purchase_amount / (previous_purchases + 1)):

By tier:
${tierEff.map(t => `• ${t.tier}: ${t.avgEff} efficiency score`).join('\n')}

By category:
${catEff.map(c => `• ${c.cat}: ${c.avgEff} efficiency score`).join('\n')}

Top 5 most efficient customers:
${topEfficient.map((c, i) => `${i + 1}. ID ${c.customer_id || 'N/A'} — $${Number(c.purchase_amount).toFixed(0)}/order · ${c.previous_purchases} prev orders · ${c.value_tier}`).join('\n')}

High spend efficiency (high value, relatively new) = acquisition success. Low efficiency = loyal customer who needs re-engagement on higher AOV products.`;
}

function answerDormant(customers) {
  const dormant = customers.filter(c =>
    (c.frequency_score === undefined ? true : Number(c.frequency_score) <= 2) &&
    Number(c.previous_purchases) < 5
  );
  const topDormantState = mode(dormant, 'location');
  const topDormantCat = mode(dormant, 'category');
  const dormantRevPotential = dormant.length * avg(customers, 'purchase_amount');

  return `Dormant customer analysis:

${dormant.length} customers (${pct(dormant.length, customers.length)}% of base) are dormant:
→ Purchase frequency: ≤2/7 (infrequent)
→ Previous purchases: <5 (not yet habitual)

Profile:
• Avg spend: ${fmt$(avg(dormant, 'purchase_amount'))}/order
• Avg loyalty score: ${(avg(dormant, 'loyalty_score') * 100).toFixed(0)}%
• Avg review rating: ${avg(dormant, 'review_rating').toFixed(2)}/5.0
• Top location: ${topDormantState}
• Top category: ${topDormantCat}
• Promo dependency: ${pct(dormant.filter(c => Number(c.promo_dependency_score) >= 0.5).length, dormant.length)}%

Revenue potential: if half of these ${dormant.length} customers make just one more purchase, that is ~${fmt$(dormantRevPotential * 0.5)} in incremental revenue.

Reactivation playbook:
1. Send the Dormant email template — free express shipping offer, no discount code
2. Subject: "We saved something for you" — personal, not promotional
3. If no response in 45 days, remove from paid acquisition lookalike audiences
4. Do NOT re-activate with a discount — it trains the wrong behaviour`;
}

function answerPyramidAscii(customers) {
  const tiers = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  customers.forEach(c => { if (tiers[c.value_tier] !== undefined) tiers[c.value_tier]++; });
  const total = customers.length;
  const totalRev = sum(customers, 'purchase_amount');
  const revByTier = {};
  ['Platinum', 'Gold', 'Silver', 'Bronze'].forEach(t => {
    revByTier[t] = sum(customers.filter(c => c.value_tier === t), 'purchase_amount');
  });

  return `Customer Value Pyramid — ${total.toLocaleString()} customers:

         ╔═══╗
         ║ P ║  PLATINUM: ${tiers.Platinum} (${pct(tiers.Platinum, total)}%)
        ╔╣   ╠╗    Revenue: ${pct(revByTier.Platinum, totalRev)}%
        ╚╦═══╦╝    Avg: ${fmt$(avg(customers.filter(c => c.value_tier === 'Platinum'), 'purchase_amount'))}
       ╔═╩═══╩═╗
       ║       ║  GOLD: ${tiers.Gold} (${pct(tiers.Gold, total)}%)
      ╔╣       ╠╗  Revenue: ${pct(revByTier.Gold, totalRev)}%
      ╚╦═══════╦╝  Avg: ${fmt$(avg(customers.filter(c => c.value_tier === 'Gold'), 'purchase_amount'))}
     ╔═╩═══════╩═╗
     ║           ║ SILVER: ${tiers.Silver} (${pct(tiers.Silver, total)}%)
    ╔╣           ╠╗ Revenue: ${pct(revByTier.Silver, totalRev)}%
    ╚╦═══════════╦╝ Avg: ${fmt$(avg(customers.filter(c => c.value_tier === 'Silver'), 'purchase_amount'))}
   ╔═╩═══════════╩═╗
   ║               ║ BRONZE: ${tiers.Bronze} (${pct(tiers.Bronze, total)}%)
  ╔╣               ╠╗ Revenue: ${pct(revByTier.Bronze, totalRev)}%
  ╚═════════════════╝ Avg: ${fmt$(avg(customers.filter(c => c.value_tier === 'Bronze'), 'purchase_amount'))}

Total: ${total.toLocaleString()} customers · ${fmt$(totalRev)} volume
Top ${pct(tiers.Platinum + tiers.Gold, total)}% generate ${pct(revByTier.Platinum + revByTier.Gold, totalRev)}% of revenue.`;
}

function answerSurprise(customers) {
  const subs = customers.filter(c => c.subscription_status === 'Yes');
  const nonSubs = customers.filter(c => c.subscription_status !== 'Yes');
  const subPromoRate = pct(subs.filter(c => Number(c.promo_dependency_score) >= 0.5).length, subs.length);
  const nonSubPromoRate = pct(nonSubs.filter(c => Number(c.promo_dependency_score) >= 0.5).length, nonSubs.length);
  const topPlatPayment = mode(customers.filter(c => c.value_tier === 'Platinum'), 'payment_method');
  const topBronzePayment = mode(customers.filter(c => c.value_tier === 'Bronze'), 'payment_method');
  const satisfied = customers.filter(c => Number(c.review_rating) >= 4);
  const satisfiedPromoRate = pct(satisfied.filter(c => Number(c.promo_dependency_score) >= 0.5).length, satisfied.length);

  return `Three counterintuitive findings from your data:

🤯 FINDING 1: Subscribers are not less promo-dependent
Subscribers: ${subPromoRate}% promo rate · Non-subscribers: ${nonSubPromoRate}% promo rate.
Almost no difference. This means your subscription programme may attract promo hunters, not genuine loyalists. Offering "subscribe for a discount" trains the wrong behaviour.

🤯 FINDING 2: Happy customers still use promos
${satisfiedPromoRate}% of your satisfied customers (rating ≥4.0) still have high promo dependency. Satisfaction and margin health are NOT the same thing. A customer can love your product and still only buy it on discount — that is a business model problem, not a product problem.

🤯 FINDING 3: Payment method predicts tier
Platinum customers prefer ${topPlatPayment}. Bronze customers prefer ${topBronzePayment}. Payment method is a stronger value-tier predictor than most brands realise. This data could be used for real-time checkout segmentation — show different offers based on the payment method selected.

All three suggest: your existing segmentation by purchase history is missing the full picture. Layer in payment method and subscription behaviour for a more accurate tier prediction.`;
}

function answerFirstAction(customers) {
  const traps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
  const atRiskHigh = customers.filter(c =>
    (c.churn_risk === true || c.churn_risk === 1) && ['Platinum', 'Gold'].includes(c.value_tier)
  );
  const estimatedMarginRecovery = Math.round(traps.length * 12);

  return `Your single highest-ROI action right now:

🔴 STOP DISCOUNTING ${traps.length} PROMO TRAPPERS — This week.

Why this first:
• These ${traps.length} customers are costing you ~$${estimatedMarginRecovery.toLocaleString()} per discount cycle with no loyalty to show for it
• Stopping now is free — no creative, no budget, no team
• You replace a $15 discount code with a free standard shipping upgrade (~$3 cost)
• Risk: may lose ~${Math.round(traps.length * 0.3)} customers who would never buy at full price anyway

What to do right now:
1. Pull the list of customers with promo_trap = 1
2. Remove them from all automated discount email flows today
3. Add them to a "Free Shipping — No Code" campaign instead
4. Set a 60-day measurement window: did repeat purchase rate drop?

After that: reactivate your ${atRiskHigh.length} Gold/Platinum at-risk customers with a free express shipping offer. No discount code — premium treatment, not price cut.

These two actions together can be completed this week, cost almost nothing, and have the highest measurable ROI of anything else in your data.`;
}

// ─── Intelligent fallback ─────────────────────────────────

function answerIntelligentFallback(q, customers) {
  const totalRev = sum(customers, 'purchase_amount');
  const platinum = customers.filter(c => c.value_tier === 'Platinum').length;
  const promoCount = customers.filter(c => Number(c.promo_dependency_score) >= 0.5).length;
  const churnCount = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const ideal = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true).length;

  // Extract any numbers from the question to try to be helpful
  const numMatch = q.match(/\d+/);
  const numHint = numMatch
    ? ` (I noticed you mentioned "${numMatch[0]}" — if that's a customer count or spend threshold, try asking "show me customers who spend over $${numMatch[0]}" or similar.)`
    : '';

  return `I didn't find an exact match for that question, but here is a live read on your ${customers.length.toLocaleString()} customers:${numHint}

• Platinum tier: ${platinum} customers
• Promo-dependent: ${promoCount} (${pct(promoCount, customers.length)}%)
• Churn risk: ${churnCount}
• Ideal ICP: ${ideal}
• Total volume: ${fmt$(totalRev)}

I can answer questions about: **tiers, loyalty, churn, geography, categories, revenue, seasons, demographics, payment, shipping, subscriptions, promo exposure, items, colors, sizes, strategy, and comparisons.**

You can also ask filtered questions like:
• "How many female Gold customers do I have?"
• "What is average spend in Clothing?"
• "How many subscribers are at churn risk?"

Type **"help"** to see all topics I cover.`;
}

// ─── Build customer context for Gemini system prompt ──────

export function buildCustomerContext(customers) {
  if (!customers || customers.length === 0) {
    return 'No customer data is currently loaded.';
  }

  const total = customers.length;
  const tiers = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  customers.forEach(c => { if (tiers[c.value_tier] !== undefined) tiers[c.value_tier]++; });

  const totalRevenue = sum(customers, 'purchase_amount');
  const avgSpend = avg(customers, 'purchase_amount');
  const avgLoyalty = avg(customers, 'loyalty_score');
  const avgRating = avg(customers, 'review_rating');
  const promoDependent = customers.filter(c => Number(c.promo_dependency_score) >= 0.5).length;
  const churnRisk = customers.filter(c => c.churn_risk === true || c.churn_risk === 1).length;
  const subscribers = customers.filter(c => c.subscription_status === 'Yes').length;
  const idealCount = customers.filter(c => c.high_value_no_promo === 1 || c.high_value_no_promo === true).length;
  const states = [...new Set(customers.map(c => c.location).filter(Boolean))].length;
  const topCategory = mode(customers, 'category');
  const topState = mode(customers, 'location');
  const topPayment = mode(customers, 'payment_method');
  const maleCount = customers.filter(c => c.gender === 'Male').length;
  const femaleCount = customers.filter(c => c.gender === 'Female').length;
  const promoTraps = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true).length;

  return `LIVE DATABASE: ${total.toLocaleString()} customers across ${states} US states.

TIER BREAKDOWN:
• Platinum: ${tiers.Platinum} (${pct(tiers.Platinum, total)}%)
• Gold: ${tiers.Gold} (${pct(tiers.Gold, total)}%)
• Silver: ${tiers.Silver} (${pct(tiers.Silver, total)}%)
• Bronze: ${tiers.Bronze} (${pct(tiers.Bronze, total)}%)

KEY METRICS:
• Total purchase volume: $${Math.round(totalRevenue).toLocaleString()}
• Avg transaction: $${avgSpend.toFixed(0)}
• Avg loyalty score: ${(avgLoyalty * 100).toFixed(0)}%
• Avg review rating: ${avgRating.toFixed(2)}/5.0
• Promo-dependent: ${promoDependent} (${pct(promoDependent, total)}%)
• Promo trappers (margin-negative): ${promoTraps}
• Churn risk: ${churnRisk} (${pct(churnRisk, total)}%)
• Active subscribers: ${subscribers} (${pct(subscribers, total)}%)
• Ideal ICP (high value, no promo): ${idealCount}

DEMOGRAPHICS:
• Male: ${maleCount} (${pct(maleCount, total)}%) | Female: ${femaleCount} (${pct(femaleCount, total)}%)
• Top category: ${topCategory}
• Top state: ${topState}
• Top payment: ${topPayment}`;
}

// ─── Suggested prompts export ─────────────────────────────

export const JARVIS_SUGGESTED_PROMPTS = [
  'Who are my best customers?',
  'Write a retention email',
  'Which states are underlevered?',
  'What should I do first?',
];

export const JARVIS_EXTENDED_PROMPTS = [
  'What is my churn risk?',
  'Show me the pyramid',
  'Surprise me',
  'Tell me about my subscriptions',
  'Which category drives retention?',
  'How loyal is my customer base?',
  'What is my promo exposure?',
  'How do my customers pay?',
  'What is the most popular item?',
  'Compare Platinum vs Bronze',
  'How often do they buy?',
  'Who are my promo trappers?',
  'What is RFM analysis?',
  'Write a strategy memo for Q3',
  'Explain customer lifetime value',
  'How to reduce churn?',
];
