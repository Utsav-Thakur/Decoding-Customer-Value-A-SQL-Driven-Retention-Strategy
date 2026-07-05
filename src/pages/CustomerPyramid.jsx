import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell
} from 'recharts';
import { Award, UserCheck, X, Sparkles, AlertTriangle } from 'lucide-react';

export default function CustomerPyramid() {
  const { customers, isLoading } = useData();
  const [selectedTier, setSelectedTier] = useState(null);

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Overall database averages for 5 axes Radar
  const overallRadar = useMemo(() => {
    if (!customers || customers.length === 0) return {};
    const total = customers.length;
    const spendSum = customers.reduce((acc, c) => acc + c.purchase_amount, 0);
    const freqSum = customers.reduce((acc, c) => acc + c.frequency_score, 0);
    const loyaltySum = customers.reduce((acc, c) => acc + c.loyalty_score, 0);
    const satSum = customers.filter(c => c.satisfaction_flag).length;
    const promoFreeSum = customers.reduce((acc, c) => acc + (1 - c.promo_dependency_score), 0);

    return {
      spend: Number((spendSum / total).toFixed(2)),
      frequency: Number(((freqSum / total) / 7 * 100).toFixed(1)),
      loyalty: Number(((loyaltySum / total) * 100).toFixed(1)),
      satisfaction: Number(((satSum / total) * 100).toFixed(1)),
      promoFree: Number(((promoFreeSum / total) * 100).toFixed(1))
    };
  }, [customers]);

  // Compute stats per tier
  const pyramidData = useMemo(() => {
    if (!customers || customers.length === 0) return {};

    const tiers = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    const groups = {
      Platinum: { list: [], spend: 0, prev: 0, sub: 0, rating: 0, promo: 0, age: 0 },
      Gold: { list: [], spend: 0, prev: 0, sub: 0, rating: 0, promo: 0, age: 0 },
      Silver: { list: [], spend: 0, prev: 0, sub: 0, rating: 0, promo: 0, age: 0 },
      Bronze: { list: [], spend: 0, prev: 0, sub: 0, rating: 0, promo: 0, age: 0 }
    };

    customers.forEach(c => {
      if (groups[c.value_tier]) {
        groups[c.value_tier].list.push(c);
        groups[c.value_tier].spend += c.purchase_amount;
        groups[c.value_tier].prev += c.previous_purchases;
        groups[c.value_tier].sub += c.subscriber;
        groups[c.value_tier].rating += c.review_rating;
        groups[c.value_tier].promo += c.promo_dependency_score;
        groups[c.value_tier].age += c.age;
      }
    });

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

    const out = {};
    tiers.forEach(tier => {
      const g = groups[tier];
      const count = g.list.length || 1;
      
      const avgSpend = g.spend / count;
      const avgPrev = g.prev / count;
      const avgRating = g.rating / count;
      const avgPromo = g.promo / count;
      const avgAge = g.age / count;

      const loyaltySum = g.list.reduce((acc, c) => acc + c.loyalty_score, 0);
      const avgLoyalty = loyaltySum / count;

      const satisfactionCount = g.list.filter(c => c.satisfaction_flag).length;
      const satisfactionPct = (satisfactionCount / count) * 100;

      const churnRiskCount = g.list.filter(c => c.churn_risk).length;
      const churnRiskPct = (churnRiskCount / count) * 100;

      out[tier] = {
        name: tier,
        count: g.list.length,
        avgSpend: Number(avgSpend.toFixed(2)),
        avgLoyalty: Number(avgLoyalty.toFixed(3)),
        avgPrev: Number(avgPrev.toFixed(1)),
        avgAge: Number(avgAge.toFixed(1)),
        topGender: getMode(g.list.map(c => c.gender)),
        topCategory: getMode(g.list.map(c => c.category)),
        topPayment: getMode(g.list.map(c => c.payment_method)),
        avgFrequency: Number((g.list.reduce((acc, c) => acc + c.frequency_score, 0) / count).toFixed(1)),
        promoDependencyPct: Number((avgPromo * 100).toFixed(1)),
        satisfactionPct: Number(satisfactionPct.toFixed(1)),
        churnRiskPct: Number(churnRiskPct.toFixed(1)),
        radarData: [
          { subject: 'Spend', tierVal: Number((avgSpend).toFixed(1)), overallVal: overallRadar.spend },
          { subject: 'Frequency', tierVal: Number(((g.list.reduce((acc, c) => acc + c.frequency_score, 0) / count) / 7 * 100).toFixed(1)), overallVal: overallRadar.frequency },
          { subject: 'Loyalty', tierVal: Number((avgLoyalty * 100).toFixed(1)), overallVal: overallRadar.loyalty },
          { subject: 'Satisfaction', tierVal: Number(satisfactionPct.toFixed(1)), overallVal: overallRadar.satisfaction },
          { subject: 'Promo-Free', tierVal: Number(((1 - avgPromo) * 100).toFixed(1)), overallVal: overallRadar.promoFree }
        ]
      };
    });

    return out;
  }, [customers, overallRadar]);

  // Recharts Promo Dependency by Tier Chart Data
  const promoByTierData = useMemo(() => {
    if (!pyramidData.Platinum) return [];
    return ['Bronze', 'Silver', 'Gold', 'Platinum'].map(tier => ({
      name: tier,
      promoRate: pyramidData[tier]?.promoDependencyPct || 0,
      fill: tier === 'Platinum' ? '#6b1d2a' : tier === 'Gold' ? '#e8b44a' : tier === 'Silver' ? '#c9b8b0' : '#7a4a2a'
    }));
  }, [pyramidData]);

  // Recharts Overlaid 4-Tiers Radar Chart Data
  const allTiersRadarData = useMemo(() => {
    if (!pyramidData.Platinum) return [];
    const metricsList = [
      { subject: 'Spend Value', key: 'avgSpend' }, // scale spend between 0 and 100
      { subject: 'Frequency', key: 'avgFrequency' }, // score 1-7
      { subject: 'Loyalty', key: 'avgLoyalty' }, // 0 to 1
      { subject: 'Satisfaction', key: 'satisfactionPct' }, // 0 to 100
      { subject: 'Promo-Free', key: 'promoDependencyPct' } // 0 to 100 (will invert)
    ];

    return metricsList.map(m => {
      const getVal = (tier) => {
        const val = pyramidData[tier];
        if (!val) return 0;
        if (m.key === 'avgSpend') return Math.round(val.avgSpend);
        if (m.key === 'avgFrequency') return Math.round((val.avgFrequency / 7) * 100);
        if (m.key === 'avgLoyalty') return Math.round(val.avgLoyalty * 100);
        if (m.key === 'satisfactionPct') return Math.round(val.satisfactionPct);
        if (m.key === 'promoDependencyPct') return Math.round(100 - val.promoDependencyPct);
        return 0;
      };

      return {
        subject: m.subject,
        Bronze: getVal('Bronze'),
        Silver: getVal('Silver'),
        Gold: getVal('Gold'),
        Platinum: getVal('Platinum')
      };
    });
  }, [pyramidData]);

  const getRecommendedAction = (tier) => {
    switch (tier) {
      case 'Platinum':
        return {
          title: 'Shield and Monopolize',
          desc: 'Suppress all automated discount vouchers. Offer invitation-only early previews of collections and priority customer service access.'
        };
      case 'Gold':
        return {
          title: 'Upsell to Express',
          desc: 'Encourage basket values by offering complimentary express shipping updates. Focus on cross-selling accessories bundles.'
        };
      case 'Silver':
        return {
          title: 'Secure the Subscription',
          desc: 'Provide points or credits for writing review ratings. Incentivize subscription upgrades with a first-month coupon.'
        };
      default:
        return {
          title: 'Automated Retention',
          desc: 'Keep clear of manual service calls. Deploy low-cost emails featuring markdowns and clearance items.'
        };
    }
  };

  if (isLoading || !pyramidData.Platinum) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-10 bg-bg-2 rounded w-48" />
        <div className="h-96 bg-bg-2 rounded-2xl" />
      </div>
    );
  }

  const selectedStats = selectedTier ? pyramidData[selectedTier] : null;
  const recommendedAction = selectedTier ? getRecommendedAction(selectedTier) : null;

  return (
    <div className="flex flex-col gap-8 w-full fade-up relative">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          Customer Value Pyramid
        </h1>
        <p className="text-sm text-text-secondary">
          Quartile breakdown mapping composite customer value to dynamic playbooks
        </p>
      </div>

      {/* Main Layout containing Pyramid Graphic */}
      <div className="grid grid-cols-5 gap-6">
        {/* Pyramid Trapeziuds (Left, 3 Cols) */}
        <div className="premium-card p-6 col-span-3 flex flex-col gap-6 relative">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-lg font-semibold text-text-primary">Interactive Pyramid</h3>
              <p className="text-xs text-text-secondary">Click on any tier below to analyze segment details and view recomendations</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the value tier composition chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>

          <div className="flex flex-col gap-4 items-center py-8 bg-bg-2 rounded-2xl">
            {/* PLATINUM */}
            <div 
              onClick={() => setSelectedTier('Platinum')}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
              style={{
                width: '45%',
                height: '80px',
                clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                background: selectedTier === 'Platinum' ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : 'var(--gold-light)',
                color: 'var(--burgundy)',
                transform: selectedTier === 'Platinum' ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedTier === 'Platinum' ? '0 10px 20px rgba(107, 29, 42, 0.15)' : 'none'
              }}
            >
              <span className="heading-serif text-base font-bold">Platinum</span>
              <span className="text-[10px] font-semibold text-text-secondary">
                {pyramidData.Platinum.count.toLocaleString()} Buyers · AOV: ${pyramidData.Platinum.avgSpend}
              </span>
            </div>

            {/* GOLD */}
            <div 
              onClick={() => setSelectedTier('Gold')}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
              style={{
                width: '63%',
                height: '80px',
                clipPath: 'polygon(11% 0%, 89% 0%, 100% 100%, 0% 100%)',
                background: selectedTier === 'Gold' ? 'linear-gradient(135deg, var(--gold-2), var(--gold-light))' : 'rgba(245, 230, 200, 0.5)',
                color: 'var(--text-primary)',
                transform: selectedTier === 'Gold' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span className="heading-serif text-base font-bold">Gold</span>
              <span className="text-[10px] font-medium text-text-secondary">
                {pyramidData.Gold.count.toLocaleString()} Buyers · AOV: ${pyramidData.Gold.avgSpend}
              </span>
            </div>

            {/* SILVER */}
            <div 
              onClick={() => setSelectedTier('Silver')}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
              style={{
                width: '80%',
                height: '80px',
                clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
                background: selectedTier === 'Silver' ? '#c9b8b0' : '#e8ddd5',
                color: 'var(--text-primary)',
                transform: selectedTier === 'Silver' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span className="heading-serif text-base font-bold">Silver</span>
              <span className="text-[10px] font-medium text-text-secondary">
                {pyramidData.Silver.count.toLocaleString()} Buyers · AOV: ${pyramidData.Silver.avgSpend}
              </span>
            </div>

            {/* BRONZE */}
            <div 
              onClick={() => setSelectedTier('Bronze')}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
              style={{
                width: '95%',
                height: '80px',
                clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
                background: selectedTier === 'Bronze' ? '#7a4a2a' : '#f5ede6',
                color: selectedTier === 'Bronze' ? '#faf7f2' : '#7a4a2a',
                transform: selectedTier === 'Bronze' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span className="heading-serif text-base font-bold">Bronze</span>
              <span className="text-[10px] font-medium opacity-80">
                {pyramidData.Bronze.count.toLocaleString()} Buyers · AOV: ${pyramidData.Bronze.avgSpend}
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel Overlay / Details (Right, 2 Cols) */}
        <div className="premium-card p-6 col-span-2 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: '380px' }}>
          {selectedStats ? (
            <div className="flex flex-col gap-4 fade-up">
              <div className="flex justify-between items-center">
                <h3 className="heading-serif text-lg font-bold text-burgundy">{selectedTier} Profile</h3>
                <div onClick={() => setSelectedTier(null)} className="cursor-pointer p-1 text-text-muted hover:text-burgundy">
                  <X size={18} />
                </div>
              </div>

              {/* Behavior parameters */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-bg p-2 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block">Avg Age</span>
                  <strong className="text-text-primary mt-1 block">{selectedStats.avgAge} y/o</strong>
                </div>
                <div className="bg-bg p-2 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block">Top Gender</span>
                  <strong className="text-text-primary mt-1 block">{selectedStats.topGender}</strong>
                </div>
                <div className="bg-bg p-2 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block">Top Category</span>
                  <strong className="text-text-primary mt-1 block">{selectedStats.topCategory}</strong>
                </div>
                <div className="bg-bg p-2 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block">Top Payment</span>
                  <strong className="text-text-primary mt-1 block">{selectedStats.topPayment}</strong>
                </div>
                <div className="bg-bg p-2 rounded-lg col-span-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">Satisfaction</span>
                    <span className="text-[10px] font-bold text-success">{selectedStats.satisfactionPct}%</span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${selectedStats.satisfactionPct}%`, background: 'var(--success)' }} className="h-full" />
                  </div>
                </div>
                <div className="bg-bg p-2 rounded-lg col-span-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">Churn Risk</span>
                    <span className="text-[10px] font-bold text-danger">{selectedStats.churnRiskPct}%</span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${selectedStats.churnRiskPct}%`, background: 'var(--danger)' }} className="h-full" />
                  </div>
                </div>
              </div>

              {/* Radar comparisons */}
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={selectedStats.radarData}>
                    <PolarGrid stroke="#e8ddd5" />
                    <PolarAngleAxis dataKey="subject" fontSize={10} stroke="var(--text-secondary)" />
                    <Radar name={selectedTier} dataKey="tierVal" stroke="var(--burgundy)" fill="var(--burgundy)" fillOpacity={0.25} />
                    <Radar name="Overall" dataKey="overallVal" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.05} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Rule action card */}
              <div className="p-3 bg-gold-light border border-gold/30 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-burgundy font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={14} /> Action: {recommendedAction.title}
                </div>
                <p className="text-[11px] text-text-secondary leading-normal">{recommendedAction.desc}</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
              <Award size={36} color="var(--gold)" className="mb-2" />
              <h4 className="heading-serif text-sm font-semibold text-text-primary">No Segment Selected</h4>
              <p className="text-xs text-text-secondary mt-1">Click on a pyramid trapezoid block to view demographic profile and recommnedations</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle/Bottom: Promo dependency bar + all tiers Radar */}
      <div className="grid grid-cols-2 gap-6">
        {/* Promo dependency bar chart */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-lg font-semibold text-text-primary">Promo Dependency by Value Tier</h3>
              <p className="text-xs text-text-secondary">Comparing discount reliance rates across pyramid cohorts</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the promo rate by tier chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promoByTierData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <YAxis unit="%" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--burgundy)' }}>{payload[0].name}</p>
                          <p style={{ margin: '4px 0 0 0' }}>Promo Utilization: {payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="promoRate" radius={[6, 6, 0, 0]}>
                  {promoByTierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 Tiers overlaid radar chart */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-lg font-semibold text-text-primary">Segment Metric Overlay</h3>
              <p className="text-xs text-text-secondary">Comparing all 4 quartiles across spend, frequency, loyalty, satisfaction, and promo-free rates</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the pyramid radar chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={allTiersRadarData}>
                <PolarGrid stroke="#e8ddd5" />
                <PolarAngleAxis dataKey="subject" fontSize={11} stroke="var(--text-secondary)" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={9} />
                <Radar name="Platinum" dataKey="Platinum" stroke="#6b1d2a" fill="#6b1d2a" fillOpacity={0.05} />
                <Radar name="Gold" dataKey="Gold" stroke="#e8b44a" fill="#e8b44a" fillOpacity={0.05} />
                <Radar name="Silver" dataKey="Silver" stroke="#a89a9d" fill="#a89a9d" fillOpacity={0.05} />
                <Radar name="Bronze" dataKey="Bronze" stroke="#7a4a2a" fill="#7a4a2a" fillOpacity={0.05} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
