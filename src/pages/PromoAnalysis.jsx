import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Percent, Award, Ticket, EyeOff, Sparkles } from 'lucide-react';

export default function PromoAnalysis() {
  const { customers, isLoading } = useData();

  // Median previous purchases calculation
  const medianPrev = useMemo(() => {
    if (!customers || customers.length === 0) return 0;
    const sorted = [...customers].map(c => c.previous_purchases).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [customers]);

  // Compute metrics for the 4 segments
  const segmentStats = useMemo(() => {
    if (!customers || customers.length === 0) return {};

    const lists = {
      Loyal: [],
      DiscountDependent: [],
      PromoTrappers: [],
      Dormant: []
    };

    customers.forEach(c => {
      // Loyal: high loyalty + low promo
      if (c.loyalty_score >= 0.55 && c.promo_dependency_score <= 0.2) {
        lists.Loyal.push(c);
      }
      // Discount-Dependent: high promo + high history (>= median)
      else if (c.promo_dependency_score >= 0.5 && c.previous_purchases >= medianPrev) {
        lists.DiscountDependent.push(c);
      }
      // Promo Trappers: high promo + low history (< median)
      else if (c.promo_dependency_score === 1 && c.previous_purchases < medianPrev) {
        lists.PromoTrappers.push(c);
      }
      // Dormant: low frequency + low history
      else if (c.frequency_score <= 2 && c.previous_purchases < 5) {
        lists.Dormant.push(c);
      }
    });

    const getMetrics = (list) => {
      const count = list.length || 1;
      const spend = list.reduce((acc, c) => acc + c.purchase_amount, 0);
      const prev = list.reduce((acc, c) => acc + c.previous_purchases, 0);
      const promo = list.reduce((acc, c) => acc + c.promo_dependency_score, 0);

      return {
        count: list.length,
        avgSpend: Number((spend / count).toFixed(2)),
        avgPrev: Number((prev / count).toFixed(1)),
        avgPromoRate: Number(((promo / count) * 100).toFixed(1))
      };
    };

    return {
      Loyal: getMetrics(lists.Loyal),
      DiscountDependent: getMetrics(lists.DiscountDependent),
      PromoTrappers: getMetrics(lists.PromoTrappers),
      Dormant: getMetrics(lists.Dormant)
    };
  }, [customers, medianPrev]);

  // Scatter Chart data mapping
  const scatterData = useMemo(() => {
    if (!customers) return [];
    // We map a sample of 250 items to prevent chart lag while representing correct trends
    const sampleSize = 250;
    const sampled = [...customers].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
    
    return sampled.map(c => ({
      x: c.previous_purchases,
      y: c.promo_dependency_score,
      id: c.customer_id,
      tier: c.value_tier,
      color: c.value_tier === 'Platinum' ? '#6b1d2a' : c.value_tier === 'Gold' ? '#e8b44a' : c.value_tier === 'Silver' ? '#c9b8b0' : '#7a4a2a'
    }));
  }, [customers]);

  // Grouped Bar chart: avg purchase with vs without promo by tier
  const avgSpendGroupedData = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const groups = {
      Platinum: { promoSpend: 0, promoCount: 0, fullSpend: 0, fullCount: 0 },
      Gold: { promoSpend: 0, promoCount: 0, fullSpend: 0, fullCount: 0 },
      Silver: { promoSpend: 0, promoCount: 0, fullSpend: 0, fullCount: 0 },
      Bronze: { promoSpend: 0, promoCount: 0, fullSpend: 0, fullCount: 0 }
    };

    customers.forEach(c => {
      const g = groups[c.value_tier];
      if (g) {
        if (c.promo_dependency_score > 0) {
          g.promoSpend += c.purchase_amount;
          g.promoCount++;
        } else {
          g.fullSpend += c.purchase_amount;
          g.fullCount++;
        }
      }
    });

    return tiers.map(tier => {
      const g = groups[tier];
      const pCount = g.promoCount || 1;
      const fCount = g.fullCount || 1;
      return {
        name: tier,
        'With Promo': Number((g.promoSpend / pCount).toFixed(2)),
        'Full-Price': Number((g.fullSpend / fCount).toFixed(2))
      };
    });
  }, [customers]);

  if (isLoading || !segmentStats.Loyal) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-10 bg-bg-2 rounded w-48" />
        <div className="h-40 bg-bg-2 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          Promo Dependency vs True Loyalty
        </h1>
        <p className="text-sm text-text-secondary">
          Analyze customer sensitivity, discount dependency, and strategic Sunset Playbooks
        </p>
      </div>

      {/* 4 Loyalty Segment Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Loyal */}
        <div className="premium-card p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid var(--success)' }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="badge-loyal">Loyal</span>
              <span className="text-[10px] text-success font-bold uppercase tracking-wider">Sunset: Low</span>
            </div>
            <h2 className="heading-serif text-3xl font-bold mt-4">{segmentStats.Loyal.count}</h2>
            <p className="text-[11px] text-text-secondary mt-1">Avg Ticket: ${segmentStats.Loyal.avgSpend} · Orders: {segmentStats.Loyal.avgPrev}</p>
          </div>
          <span className="text-[11px] text-text-muted mt-3">Promo utilization: {segmentStats.Loyal.avgPromoRate}%</span>
        </div>

        {/* Discount Dependent */}
        <div className="premium-card p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="badge-promo">Discount-Dependent</span>
              <span className="text-[10px] text-gold font-bold uppercase tracking-wider">Sunset: Medium</span>
            </div>
            <h2 className="heading-serif text-3xl font-bold mt-4">{segmentStats.DiscountDependent.count}</h2>
            <p className="text-[11px] text-text-secondary mt-1">Avg Ticket: ${segmentStats.DiscountDependent.avgSpend} · Orders: {segmentStats.DiscountDependent.avgPrev}</p>
          </div>
          <span className="text-[11px] text-text-muted mt-3">Promo utilization: {segmentStats.DiscountDependent.avgPromoRate}%</span>
        </div>

        {/* Promo Trappers */}
        <div className="premium-card p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="badge-risk">Promo Trappers</span>
              <span className="text-[10px] text-danger font-bold uppercase tracking-wider">Sunset: Urgent</span>
            </div>
            <h2 className="heading-serif text-3xl font-bold mt-4">{segmentStats.PromoTrappers.count}</h2>
            <p className="text-[11px] text-text-secondary mt-1">Avg Ticket: ${segmentStats.PromoTrappers.avgSpend} · Orders: {segmentStats.PromoTrappers.avgPrev}</p>
          </div>
          <span className="text-[11px] text-text-muted mt-3">Promo utilization: {segmentStats.PromoTrappers.avgPromoRate}%</span>
        </div>

        {/* Dormant */}
        <div className="premium-card p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid var(--info)' }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="badge-dormant">Dormant</span>
              <span className="text-[10px] text-info font-bold uppercase tracking-wider">Sunset: High</span>
            </div>
            <h2 className="heading-serif text-3xl font-bold mt-4">{segmentStats.Dormant.count}</h2>
            <p className="text-[11px] text-text-secondary mt-1">Avg Ticket: ${segmentStats.Dormant.avgSpend} · Orders: {segmentStats.Dormant.avgPrev}</p>
          </div>
          <span className="text-[11px] text-text-muted mt-3">Promo utilization: {segmentStats.Dormant.avgPromoRate}%</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Scatter chart */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-start gap-4">
              <h3 className="heading-serif text-lg font-semibold text-text-primary">Promo Dependency vs Purchases</h3>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the promo scatter chart' } }))}
                className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer"
              >
                <Sparkles size={11} /> What does this mean?
              </button>
            </div>
            <p className="text-xs text-text-secondary">Correlating order frequency against discount utilization (sampled)</p>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis type="number" dataKey="x" name="Previous Purchases" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis type="number" dataKey="y" name="Promo Dependency" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Customers" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-start gap-4">
              <h3 className="heading-serif text-lg font-semibold text-text-primary">AOV: Promo vs Full-Price</h3>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the promo rate by tier chart' } }))}
                className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer"
              >
                <Sparkles size={11} /> What does this mean?
              </button>
            </div>
            <p className="text-xs text-text-secondary">Comparing average orders spend between promotion and full price purchasers</p>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgSpendGroupedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <YAxis unit="$" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="With Promo" fill="var(--burgundy)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Full-Price" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Promo Sunset Plan Table */}
      <div className="premium-card p-6 flex flex-col gap-4">
        <h3 className="heading-serif text-lg font-semibold text-text-primary">Promo Sunset Mitigation Plan</h3>
        <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-bg-2 text-burgundy border-b border-border">
              <th className="p-3">Segment</th>
              <th className="p-3">Sunset Priority</th>
              <th className="p-3">Trigger</th>
              <th className="p-3">Timeline</th>
              <th className="p-3">Replace With</th>
              <th className="p-3">Track</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Promo Trappers</td>
              <td className="p-3"><span className="badge-risk">Urgent</span></td>
              <td className="p-3 font-mono">promo_dep = 1.0 &amp; orders &lt; median</td>
              <td className="p-3">Immediate (Week 1)</td>
              <td className="p-3">Standard Express Shipping Upgrade</td>
              <td className="p-3">Purchase retention at 60 days</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Dormant Accounts</td>
              <td className="p-3"><span className="badge-risk" style={{ background: 'var(--bg-2)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>High</span></td>
              <td className="p-3 font-mono">frequency &lt;= 2 &amp; orders &lt; 5</td>
              <td className="p-3">Gradual (Week 2)</td>
              <td className="p-3">Seasonal collection catalog previews</td>
              <td className="p-3">Re-engagement click rates</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Discount-Dependent</td>
              <td className="p-3"><span className="badge-promo" style={{ background: '#fffbf5', color: 'var(--gold)', borderColor: 'var(--gold)' }}>Medium</span></td>
              <td className="p-3 font-mono">promo_dep &gt;= 0.5 &amp; orders &gt;= median</td>
              <td className="p-3">Phase-out (Week 4)</td>
              <td className="p-3">Gated loyalty points multiplier campaigns</td>
              <td className="p-3">AOV margin recovery index</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">VIP Loyalists</td>
              <td className="p-3"><span className="badge-loyal">Low</span></td>
              <td className="p-3 font-mono">loyalty &gt;= 0.55 &amp; promo_dep &lt;= 0.2</td>
              <td className="p-3">Ongoing (Monitor)</td>
              <td className="p-3">Private collection access / custom styling</td>
              <td className="p-3">Net promoter score (NPS)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
