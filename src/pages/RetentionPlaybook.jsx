import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertOctagon, HelpCircle, Activity, Award, Sparkles } from 'lucide-react';

export default function RetentionPlaybook() {
  const { customers, isLoading } = useData();

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Compute median previous purchases
  const medianPrev = useMemo(() => {
    if (!customers || customers.length === 0) return 0;
    const sorted = [...customers].map(c => c.previous_purchases).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [customers]);

  // Live segmentation sizes & values
  const playbookData = useMemo(() => {
    if (!customers || customers.length === 0) return { trappersCount: 0, dependentCount: 0, loyalCount: 0, dependentSpend: 0, matrix: {} };

    // Promo Trappers
    const trappers = customers.filter(c => c.promo_dependency_score === 1 && c.previous_purchases < medianPrev);
    // Discount Dependent
    const dependent = customers.filter(c => c.promo_dependency_score >= 0.5 && c.previous_purchases >= medianPrev);
    // Loyalists
    const loyal = customers.filter(c => c.loyalty_score >= 0.55 && c.promo_dependency_score <= 0.2);

    const dependentSpendSum = dependent.reduce((acc, c) => acc + c.purchase_amount, 0);

    // Matrix counts (2x2 Grid)
    // 1. Reward Loyalty (High Value, Low Promo)
    const rewardLoyalty = customers.filter(c => (c.value_tier === 'Platinum' || c.value_tier === 'Gold') && c.promo_dependency_score <= 0.2).length;
    // 2. Convert Gradually (Low Value, Low Promo)
    const convertGradually = customers.filter(c => (c.value_tier === 'Silver' || c.value_tier === 'Bronze') && c.promo_dependency_score <= 0.2).length;
    // 3. Deprioritise (High Value, High Promo)
    const deprioritise = customers.filter(c => (c.value_tier === 'Platinum' || c.value_tier === 'Gold') && c.promo_dependency_score >= 0.5).length;
    // 4. Urgent Sunset (Low Value, High Promo)
    const urgentSunset = customers.filter(c => (c.value_tier === 'Silver' || c.value_tier === 'Bronze') && c.promo_dependency_score >= 0.5).length;

    // Projected Margin Recovery Chart data
    // Assuming $12 recovery on Trappers, $6 recovery on Discount Dependent
    const recoveryChart = [
      { name: 'Promo Trappers Sunset', recovery: trappers.length * 12 },
      { name: 'Discount Dependent Phase', recovery: Math.round(dependent.length * 6) }
    ];

    return {
      trappersCount: trappers.length,
      dependentCount: dependent.length,
      loyalCount: loyal.length,
      dependentSpend: Math.round(dependentSpendSum * 0.5), // estimated revenue dip of 50% spend
      rewardLoyalty,
      convertGradually,
      deprioritise,
      urgentSunset,
      recoveryChart
    };
  }, [customers, medianPrev]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-10 bg-bg-2 rounded w-48" />
        <div className="h-96 bg-bg-2 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          Promotional Sunset Plan
        </h1>
        <p className="text-sm text-text-secondary">
          What to stop, when to stop it, and what you risk
        </p>
      </div>

      {/* 3 Action Tier Cards (large, premium-card style) */}
      <div className="flex flex-col gap-4">
        {/* Card 1: Stop Now */}
        <div className="premium-card p-6 flex flex-col gap-4" style={{ borderLeft: '5px solid var(--danger)' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-danger uppercase font-bold tracking-wider block mb-1">Immediate action</span>
              <h3 className="heading-serif text-xl font-bold text-text-primary">Tier 1 — Stop Now</h3>
            </div>
            <span className="px-3 py-1 bg-danger/10 border border-danger/30 rounded-full text-[11px] font-bold text-danger uppercase">
              Segment: Promo Trappers
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs mt-2">
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Trapped cohort size</span>
              <strong className="text-text-primary block text-base mt-1">{playbookData.trappersCount.toLocaleString()} buyers</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Timeline target</span>
              <strong className="text-text-primary block mt-1">Begin Week 1 — De-auth discount promo codes</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Value-Add replacement</span>
              <strong className="text-text-primary block mt-1">Free standard shipping upgrade (Cost: ~$3 vs ~$15 discount)</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Tenure tracking</span>
              <strong className="text-text-primary block mt-1">Repeat purchase rate at 60 days post-sunset</strong>
            </div>
          </div>
          <div className="p-3 bg-danger/5 border border-danger/10 rounded-lg text-xs text-text-primary mt-2">
            <strong>Revenue Trade-Off Alert:</strong> Risk losing up to <strong className="text-danger">{playbookData.trappersCount} customers</strong> in this segment who may exhibit low conversion rates when offered full price options.
          </div>
        </div>

        {/* Card 2: Reduce Gradually */}
        <div className="premium-card p-6 flex flex-col gap-4" style={{ borderLeft: '5px solid var(--warning)' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-warning uppercase font-bold tracking-wider block mb-1">Phased transition</span>
              <h3 className="heading-serif text-xl font-bold text-text-primary">Tier 2 — Reduce Gradually</h3>
            </div>
            <span className="px-3 py-1 bg-warning/10 border border-warning/30 rounded-full text-[11px] font-bold text-warning uppercase">
              Segment: Discount-Dependent
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs mt-2">
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Dependent cohort size</span>
              <strong className="text-text-primary block text-base mt-1">{playbookData.dependentCount.toLocaleString()} buyers</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Timeline target</span>
              <strong className="text-text-primary block mt-1">Begin Week 4 — Reduce coupon frequency by 50%</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Value-Add replacement</span>
              <strong className="text-text-primary block mt-1">Gated loyalty points campaigns (Double Points on collection drops)</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Tenure tracking</span>
              <strong className="text-text-primary block mt-1">AOV margin recovery index and net spend totals</strong>
            </div>
          </div>
          <div className="p-3 bg-warning/5 border border-warning/10 rounded-lg text-xs text-text-primary mt-2">
            <strong>Revenue Trade-Off Alert:</strong> Temporary revenue dip of approximately <strong className="text-warning">${playbookData.dependentSpend.toLocaleString()}</strong> estimated in the first 30 days of phasing.
          </div>
        </div>

        {/* Card 3: Maintain & Reward */}
        <div className="premium-card p-6 flex flex-col gap-4" style={{ borderLeft: '5px solid var(--success)' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-success uppercase font-bold tracking-wider block mb-1">Nurture campaigns</span>
              <h3 className="heading-serif text-xl font-bold text-text-primary">Tier 3 — Maintain & Reward</h3>
            </div>
            <span className="px-3 py-1 bg-success/10 border border-success/30 rounded-full text-[11px] font-bold text-success uppercase">
              Segment: VIP Loyalists
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs mt-2">
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Loyalist cohort size</span>
              <strong className="text-text-primary block text-base mt-1">{playbookData.loyalCount.toLocaleString()} buyers</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Timeline target</span>
              <strong className="text-text-primary block mt-1">Ongoing — Suppress all markdowns; utilize VIP rewards</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Value-Add replacement</span>
              <strong className="text-text-primary block mt-1">Complimentary luxury gifts & private preview collection events</strong>
            </div>
            <div>
              <span className="text-text-muted font-semibold uppercase text-[10px]">Tenure tracking</span>
              <strong className="text-text-primary block mt-1">Net promoter score (NPS) and repeat order frequency</strong>
            </div>
          </div>
          <div className="p-3 bg-success/5 border border-success/10 rounded-lg text-xs text-text-primary mt-2">
            <strong>Risk Matrix Diagnostic:</strong> Lowest risk retention segment. These customers purchase items at full price without markdown codes already.
          </div>
        </div>
      </div>

      {/* Split: 2x2 Risk Matrix Grid (Left) & Margin Recovery Potential Recharts (Right) */}
      <div className="grid grid-cols-2 gap-6">
        {/* 2x2 Matrix */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Customer Risk Quadrants Matrix</h3>
            <p className="text-xs text-text-secondary">Comparing total customer counts across promotional vulnerability and value tiers</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2 relative border border-border p-2 rounded-xl bg-bg-2">
            {/* Top Left: Reward Loyalty */}
            <div className="p-6 bg-[#ffffff] border border-border rounded-lg flex flex-col items-center justify-center">
              <span className="font-bold text-burgundy text-sm block">Reward Loyalty</span>
              <span className="text-[10px] text-text-muted uppercase font-semibold mt-1">High Value, Low Promo</span>
              <h2 className="heading-serif text-2xl font-bold mt-2">{playbookData.rewardLoyalty.toLocaleString()}</h2>
            </div>

            {/* Top Right: Convert Gradually */}
            <div className="p-6 bg-[#ffffff] border border-border rounded-lg flex flex-col items-center justify-center">
              <span className="font-bold text-gold text-sm block">Convert Gradually</span>
              <span className="text-[10px] text-text-muted uppercase font-semibold mt-1">High Value, High Promo</span>
              <h2 className="heading-serif text-2xl font-bold mt-2">{playbookData.deprioritise.toLocaleString()}</h2>
            </div>

            {/* Bottom Left: Deprioritise */}
            <div className="p-6 bg-[#ffffff] border border-border rounded-lg flex flex-col items-center justify-center">
              <span className="font-bold text-text-secondary text-sm block">Deprioritise</span>
              <span className="text-[10px] text-text-muted uppercase font-semibold mt-1">Low Value, Low Promo</span>
              <h2 className="heading-serif text-2xl font-bold mt-2">{playbookData.convertGradually.toLocaleString()}</h2>
            </div>

            {/* Bottom Right: Urgent Sunset */}
            <div className="p-6 bg-danger/5 border border-danger/25 rounded-lg flex flex-col items-center justify-center">
              <span className="font-bold text-danger text-sm block">Urgent Sunset</span>
              <span className="text-[10px] text-text-muted uppercase font-semibold mt-1">Low Value, High Promo</span>
              <h2 className="heading-serif text-2xl font-bold mt-2">{playbookData.urgentSunset.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Projected Margin Recovery Recharts BarChart */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-lg font-semibold text-text-primary">Projected Margin Recovery Potential</h3>
              <p className="text-xs text-text-secondary">Expected cost recovery (USD) if coupon sunsetting campaigns are executed</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the recovery opportunity chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playbookData.recoveryChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <YAxis unit="$" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--burgundy)' }}>{payload[0].name}</p>
                          <p style={{ margin: '4px 0 0 0' }}>Estimated Recovery: ${payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="recovery" fill="var(--burgundy)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
