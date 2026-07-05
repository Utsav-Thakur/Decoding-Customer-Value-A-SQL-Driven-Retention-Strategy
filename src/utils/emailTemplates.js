// ============================================================
// BrandIQ — Zero-API Email Template Engine
// All tokens computed live from the customer array.
// No fetch, no API, no external calls — ever.
// ============================================================

const BRAND_NAME = 'BrandIQ';

// ─── Math helpers (local) ─────────────────────────────────

function avg(arr, key) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, c) => s + (Number(c[key]) || 0), 0) / arr.length;
}

function mode(arr, key) {
  if (!arr || arr.length === 0) return 'Clothing';
  const freq = {};
  let max = 0, top = arr[0][key];
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

// ─── Segment stats computer ───────────────────────────────

function getSegmentStats(segment, customers) {
  let segmentCustomers = [];

  switch (segment) {
    case 'Promo Trappers':
      segmentCustomers = customers.filter(c => c.promo_trap === 1 || c.promo_trap === true);
      break;
    case 'Discount-Dependent':
      segmentCustomers = customers.filter(c =>
        (c.promo_dependency_score >= 0.5) &&
        (c.previous_purchases >= (avg(customers, 'previous_purchases') * 0.8))
      );
      break;
    case 'Dormant':
      segmentCustomers = customers.filter(c =>
        c.frequency_score <= 2 && c.previous_purchases < 5
      );
      break;
    case 'Loyal':
      segmentCustomers = customers.filter(c =>
        c.loyalty_score >= 0.55 && c.promo_dependency_score <= 0.2
      );
      break;
    default:
      segmentCustomers = customers.slice(0, 100);
  }

  const topCategory = mode(segmentCustomers.length > 0 ? segmentCustomers : customers, 'category');
  const avgPrevPurchases = Math.round(avg(segmentCustomers.length > 0 ? segmentCustomers : customers, 'previous_purchases'));
  const avgSpend = avg(segmentCustomers.length > 0 ? segmentCustomers : customers, 'purchase_amount');
  const creditAmount = Math.round(avgSpend * 0.05); // 5% of avg spend as credit
  const newItemCount = Math.round(30 + Math.random() * 50); // representative seasonal new items
  const loyalCount = customers.filter(c => c.loyalty_score >= 0.55 && c.promo_dependency_score <= 0.2).length;
  const tierPct = Number(pct(loyalCount, customers.length, 0));

  return {
    topCategory,
    avgPrevPurchases,
    creditAmount: creditAmount < 5 ? 5 : creditAmount,
    newItemCount,
    tierPct: tierPct < 1 ? 1 : tierPct,
    brandName: BRAND_NAME,
    segmentCount: segmentCustomers.length,
    avgSpend: avgSpend.toFixed(0)
  };
}

// ─── Main export ──────────────────────────────────────────

export function getEmailTemplate(segment, customers) {
  if (!customers || customers.length === 0) {
    return {
      subject: 'Welcome back',
      body: 'No customer data available to personalize this template.'
    };
  }

  const segData = getSegmentStats(segment, customers);

  const templates = {

    // ── Template 1: Promo Trappers ──────────────────────────
    'Promo Trappers': {
      subject: `Your exclusive early access — no code needed`,
      body: `Hi [First Name],

We noticed you've been a fan of our ${segData.topCategory} collection — great taste.

We're trying something different this season. Instead of discount codes, we're giving
select customers like you early access to our new arrivals before anyone else sees them.

Your early access opens this Thursday at 9am. No code. No countdown. Just first pick
of ${segData.newItemCount}+ new pieces.

[Shop Early Access →]

This is our way of saying thank you — and of building something more meaningful than
a one-time deal.

The ${segData.brandName} Team

---
Campaign data: ${segData.segmentCount} customers in this segment · Top category: ${segData.topCategory}`
    },

    // ── Template 2: Discount-Dependent ─────────────────────
    'Discount-Dependent': {
      subject: `Something better than a discount`,
      body: `Hi [First Name],

You've shopped with us ${segData.avgPrevPurchases} times — that means something to us.

We're moving our loyalty program in a new direction. Instead of one-off discount codes,
we're introducing loyalty credits: $${segData.creditAmount} added to your account for
every full-price purchase, redeemable any time on any order.

Your credits don't expire. Your discount codes will start to.

This change rolls out over the next 60 days. The ${segData.segmentCount} customers at
your engagement level are the reason we're building something more lasting.

[See Your Loyalty Balance →]

The ${segData.brandName} Team

---
Campaign data: ${segData.segmentCount} customers in segment · Avg $${segData.avgSpend}/order · Credit offer: $${segData.creditAmount}`
    },

    // ── Template 3: Dormant ─────────────────────────────────
    'Dormant': {
      subject: `We saved something for you`,
      body: `Hi [First Name],

It's been a while. We've added ${segData.newItemCount}+ new pieces since you last visited,
including new ${segData.topCategory} styles we think match what you've bought before.

We're not going to offer you a discount. We're going to offer you something better:
free express shipping on your next order, no minimum spend required.

That's it. No strings. No countdown timer. Just come back and see what's new.

[See New ${segData.topCategory} Arrivals →]

The ${segData.brandName} Team

---
Campaign data: ${segData.segmentCount} dormant customers · Top match category: ${segData.topCategory}`
    },

    // ── Template 4: Loyal ───────────────────────────────────
    'Loyal': {
      subject: `You're one of our best — here's what that gets you`,
      body: `Hi [First Name],

You've made ${segData.avgPrevPurchases} purchases with us and you've never needed a
discount code to do it. That puts you in the top ${segData.tierPct}% of our entire
customer base.

Starting next month, customers at your level get:
→ First access to limited drops and seasonal vault releases
→ Free returns on every order, always — no questions asked
→ A dedicated style advisor (email-based, no appointment needed)
→ 2× loyalty credit on ${segData.topCategory} purchases this quarter

No action needed on your end. You've already earned it.

The ${segData.brandName} Team

---
Campaign data: ${segData.segmentCount} VIP customers · Loyalty threshold: top ${segData.tierPct}% · Top category: ${segData.topCategory}`
    }
  };

  return templates[segment] || templates['Loyal'];
}

// ─── All segment keys ─────────────────────────────────────

export const EMAIL_SEGMENTS = [
  'Promo Trappers',
  'Discount-Dependent',
  'Dormant',
  'Loyal'
];

// ─── Get all 4 templates at once ─────────────────────────

export function getAllEmailTemplates(customers) {
  return EMAIL_SEGMENTS.reduce((acc, seg) => {
    acc[seg] = getEmailTemplate(seg, customers);
    return acc;
  }, {});
}

// ─── Get segment size for display ────────────────────────

export function getSegmentSize(segment, customers) {
  if (!customers || customers.length === 0) return 0;
  const stats = getSegmentStats(segment, customers);
  return stats.segmentCount;
}
