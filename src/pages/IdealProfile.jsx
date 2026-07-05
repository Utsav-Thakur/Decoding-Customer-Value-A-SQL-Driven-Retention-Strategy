import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, CheckCircle, Target, Sparkles } from 'lucide-react';

export default function IdealProfile() {
  const { customers, isLoading } = useData();

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Compute Ideal Customer (high_value_no_promo = true)
  const idealStats = useMemo(() => {
    if (!customers || customers.length === 0) return null;

    const idealList = customers.filter(c => c.high_value_no_promo);
    const totalIdeal = idealList.length || 1;

    // Helper for modes
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

    const spendSum = idealList.reduce((acc, c) => acc + c.purchase_amount, 0);
    const prevSum = idealList.reduce((acc, c) => acc + c.previous_purchases, 0);
    const ratingSum = idealList.reduce((acc, c) => acc + c.review_rating, 0);
    const satCount = idealList.filter(c => c.satisfaction_flag).length;
    const freqSum = idealList.reduce((acc, c) => acc + c.frequency_score, 0);

    // Calculate age range
    const ages = idealList.map(c => c.age);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const ageRange = ages.length > 0 ? `${minAge}-${maxAge}` : 'N/A';

    // Top states list
    const stateCounts = {};
    idealList.forEach(c => {
      stateCounts[c.location] = (stateCounts[c.location] || 0) + 1;
    });
    const topStates = Object.keys(stateCounts)
      .map(state => ({ name: state, count: stateCounts[state] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => s.name)
      .join(', ');

    return {
      count: idealList.length,
      pct: ((idealList.length / customers.length) * 100).toFixed(1),
      ageRange,
      topGender: getMode(idealList.map(c => c.gender)),
      topCategory: getMode(idealList.map(c => c.category)),
      topPayment: getMode(idealList.map(c => c.payment_method)),
      avgSpend: Number((spendSum / totalIdeal).toFixed(2)),
      avgPrev: Number((prevSum / totalIdeal).toFixed(1)),
      avgRating: Number((ratingSum / totalIdeal).toFixed(2)),
      avgFreq: Number((freqSum / totalIdeal).toFixed(1)),
      topStates,
      satisfactionPct: Number(((satCount / totalIdeal) * 100).toFixed(1)),
      radarData: [
        { subject: 'Spend', idealVal: Number((spendSum / totalIdeal).toFixed(1)), overallVal: stats.avgPurchase },
        { subject: 'Frequency', idealVal: Number(((freqSum / totalIdeal) / 7 * 100).toFixed(1)), overallVal: stats.idealProfile.avgFrequency || 50 },
        { subject: 'Loyalty', idealVal: Number(((idealList.reduce((acc, c) => acc + c.loyalty_score, 0) / totalIdeal) * 100).toFixed(1)), overallVal: 50 },
        { subject: 'Satisfaction', idealVal: Number(((satCount / totalIdeal) * 100).toFixed(1)), overallVal: 80 },
        { subject: 'Promo-Free', idealVal: 100, overallVal: 100 - stats.promoRate } // Ideal has 0 promo_dependency, so Promo-Free is 100
      ]
    };
  }, [customers, stats]);

  // Overall database averages for Comparison Table
  const comparisonData = useMemo(() => {
    if (!idealStats || !customers || customers.length === 0) return [];
    
    const overall = {
      avgSpend: stats.avgPurchase,
      avgPrev: stats.avgPreviousPurchases,
      satisfactionPct: stats.idealProfile.satisfactionPct || 85.0
    };

    const items = [
      {
        metric: 'Avg Spend Per Order',
        ideal: `$${idealStats.avgSpend}`,
        overall: `$${overall.avgSpend}`,
        diff: `+$${(idealStats.avgSpend - overall.avgSpend).toFixed(2)}`,
        direction: 'up'
      },
      {
        metric: 'Avg Lifetime Orders',
        ideal: `${idealStats.avgPrev}`,
        overall: `${overall.avgPrev}`,
        diff: `+${(idealStats.avgPrev - overall.avgPrev).toFixed(1)}`,
        direction: 'up'
      },
      {
        metric: 'Satisfaction Rating',
        ideal: `${idealStats.satisfactionPct}%`,
        overall: `${overall.satisfactionPct}%`,
        diff: `+${(idealStats.satisfactionPct - overall.satisfactionPct).toFixed(1)}%`,
        direction: 'up'
      }
    ];

    return items;
  }, [idealStats, customers, stats]);

  if (isLoading || !idealStats) {
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
          The Brand's Best Customer
        </h1>
        <p className="text-sm text-text-secondary">
          A data-backed profile specific enough for targeting decisions today
        </p>
      </div>

      {/* ICP Layout Split */}
      <div className="grid grid-cols-5 gap-6">
        {/* Large Profile Card (Left, 2 Cols) */}
        <div className="burgundy-card p-6 col-span-2 flex flex-col justify-between" style={{ minHeight: '400px' }}>
          <div>
            <div className="flex justify-between items-start">
              <span className="heading-serif text-2xl font-semibold text-bg">VIP Archetype</span>
              {/* Monogram ICP in gold circle */}
              <div 
                className="flex items-center justify-center font-bold text-sm" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--gold)', 
                  color: 'var(--burgundy)' 
                }}
              >
                ICP
              </div>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gold-light mt-1">
              Top Spenders (Gold/Plat) &amp; Zero Promos
            </p>

            <div className="h-0.5 w-full bg-gold-light/20 my-4" />

            {/* Profile specifications */}
            <div className="flex flex-col gap-3 text-xs text-bg-2">
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Demographic Ages:</span>
                <strong className="text-bg">{idealStats.ageRange} y/o</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Preferred Gender:</span>
                <strong className="text-bg">{idealStats.topGender}</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Primary Category:</span>
                <strong className="text-bg">{idealStats.topCategory}</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Payment Method:</span>
                <strong className="text-bg">{idealStats.topPayment}</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Aesthetic States:</span>
                <strong className="text-bg">{idealStats.topStates}</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Avg Ticket Spend:</span>
                <strong className="text-bg text-sm">${idealStats.avgSpend}</strong>
              </div>
              <div className="flex justify-between border-b border-bg-2/10 pb-1.5">
                <span className="opacity-75">Satisfaction Score:</span>
                <strong className="text-bg">{idealStats.satisfactionPct}%</strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-burgundy/40 border border-gold-light/10 rounded-xl text-[10px] text-gold-light leading-normal mt-4">
            This high-value non-discounted cohort represents <strong className="text-gold">{idealStats.pct}%</strong> of the database, yielding optimal customer lifetime value (LTV).
          </div>
        </div>

        {/* Live Comparisons & Action Strategy (Right, 3 Cols) */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Comparison Table */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Performance Comparisons</h3>
            <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-bg-2 text-burgundy border-b border-border">
                  <th className="p-2.5">Metric</th>
                  <th className="p-2.5">Ideal Customer</th>
                  <th className="p-2.5">Overall Average</th>
                  <th className="p-2.5">Difference</th>
                  <th className="p-2.5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="p-2.5 font-medium text-text-secondary">{item.metric}</td>
                    <td className="p-2.5 font-bold text-text-primary">{item.ideal}</td>
                    <td className="p-2.5 text-text-secondary">{item.overall}</td>
                    <td className="p-2.5 font-bold text-success">{item.diff}</td>
                    <td className="p-2.5 text-center text-success">▲</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Radar Chart Visual */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="heading-serif text-lg font-semibold text-text-primary">ICP vs Average Portfolio Radar</h3>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the icp comparison radar chart' } }))}
                className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
              >
                <Sparkles size={11} /> What does this mean?
              </button>
            </div>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={idealStats.radarData}>
                  <PolarGrid stroke="#e8ddd5" />
                  <PolarAngleAxis dataKey="subject" fontSize={10} stroke="var(--text-secondary)" />
                  <Radar name="Ideal Spender" dataKey="idealVal" stroke="var(--burgundy)" fill="var(--burgundy)" fillOpacity={0.2} />
                  <Radar name="Portfolio Average" dataKey="overallVal" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.05} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Target marketing cards "How to Acquire More" */}
      <div className="flex flex-col gap-4">
        <h3 className="heading-serif text-xl font-semibold text-text-primary">How to Acquire More Ideal Shoppers</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-burgundy font-bold text-xs uppercase tracking-wider">
              <Target size={16} /> Demographic Target
            </div>
            <p className="text-xs text-text-secondary leading-normal mt-1">
              Target digital marketing lookalikes within the <strong>{idealStats.ageRange} age range</strong> with a gender mix aligning with the primary <strong>{idealStats.topGender}</strong> buyer profile.
            </p>
          </div>

          {/* Card 2 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-gold font-bold text-xs uppercase tracking-wider">
              <Target size={16} /> Geographic Focus
            </div>
            <p className="text-xs text-text-secondary leading-normal mt-1">
              Direct geo-targeted social and search ad spending directly to the top performing states of <strong>{idealStats.topStates}</strong> to capture high premium purchasing power.
            </p>
          </div>

          {/* Card 3 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-success font-bold text-xs uppercase tracking-wider">
              <Target size={16} /> Behavioral Pattern
            </div>
            <p className="text-xs text-text-secondary leading-normal mt-1">
              Construct search campaigns around the <strong>{idealStats.topCategory}</strong> segment, optimized for users utilizing <strong>{idealStats.topPayment}</strong> payment configurations at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
