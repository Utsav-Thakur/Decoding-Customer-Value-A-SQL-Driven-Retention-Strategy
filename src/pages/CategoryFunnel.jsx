import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HelpCircle, Star, Sparkles } from 'lucide-react';

export default function CategoryFunnel() {
  const { customers, isLoading } = useData();

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Compute category statistics from DataContext
  const funnelMetrics = useMemo(() => {
    if (!customers || customers.length === 0) return {};
    
    const catMap = {
      Clothing: { count: 0, spend: 0, prev: 0, promo: 0 },
      Accessories: { count: 0, spend: 0, prev: 0, promo: 0 },
      Footwear: { count: 0, spend: 0, prev: 0, promo: 0 },
      Outerwear: { count: 0, spend: 0, prev: 0, promo: 0 }
    };

    customers.forEach(c => {
      const cat = catMap[c.category];
      if (cat) {
        cat.count++;
        cat.spend += c.purchase_amount;
        cat.prev += c.previous_purchases;
        cat.promo += c.promo_dependency_score;
      }
    });

    const out = {};
    Object.keys(catMap).forEach(key => {
      const g = catMap[key];
      const count = g.count || 1;
      out[key] = {
        name: key,
        count: g.count,
        avgSpend: Number((g.spend / count).toFixed(2)),
        avgPrev: Number((g.prev / count).toFixed(1)),
        promoRate: Number(((g.promo / count) * 100).toFixed(1))
      };
    });

    return out;
  }, [customers]);

  // Heatmap Data (Season x Category)
  const heatmapData = useMemo(() => {
    if (!customers || customers.length === 0) return { matrix: {}, maxPrev: 1 };
    
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const categories = ['Clothing', 'Accessories', 'Footwear', 'Outerwear'];
    const matrix = {};
    let maxPrev = 0;

    seasons.forEach(season => {
      matrix[season] = {};
      categories.forEach(cat => {
        const list = customers.filter(c => c.season === season && c.category === cat);
        const count = list.length;
        const spendSum = list.reduce((acc, c) => acc + c.purchase_amount, 0);
        const prevSum = list.reduce((acc, c) => acc + c.previous_purchases, 0);

        const avgPrev = count > 0 ? Number((prevSum / count).toFixed(1)) : 0;
        if (avgPrev > maxPrev) maxPrev = avgPrev;

        matrix[season][cat] = {
          count,
          avgSpend: count > 0 ? Math.round(spendSum / count) : 0,
          avgPrev
        };
      });
    });

    return { matrix, maxPrev };
  }, [customers]);

  // Recharts Chart Data: avg previous purchases by category
  const chartData1 = useMemo(() => {
    if (!funnelMetrics.Clothing) return [];
    return ['Clothing', 'Accessories', 'Footwear', 'Outerwear'].map(key => ({
      name: key,
      avgPrev: funnelMetrics[key]?.avgPrev || 0
    }));
  }, [funnelMetrics]);

  // Recharts Chart Data: avg spend x promo dependency by category
  const chartData2 = useMemo(() => {
    if (!funnelMetrics.Clothing) return [];
    return ['Clothing', 'Accessories', 'Footwear', 'Outerwear'].map(key => ({
      name: key,
      'Avg Spend ($)': funnelMetrics[key]?.avgSpend || 0,
      'Promo Dependency (%)': funnelMetrics[key]?.promoRate || 0
    }));
  }, [funnelMetrics]);

  if (isLoading || !funnelMetrics.Clothing) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-10 bg-bg-2 rounded w-48" />
        <div className="h-96 bg-bg-2 rounded-2xl" />
      </div>
    );
  }

  // Visual funnel layout mapping
  const funnelConfig = [
    { key: 'Clothing', label: '1. Entry: Clothing', width: '100%', bg: '#fffbf5', border: 'border-gold-2/40', textColor: 'text-burgundy' },
    { key: 'Accessories', label: '2. Entry: Accessories', width: '80%', bg: '#fbf7f0', border: 'border-gold/30', textColor: 'text-text-primary' },
    { key: 'Footwear', label: '3. Retention: Footwear', width: '60%', bg: '#f7f1eb', border: 'border-border-dark/40', textColor: 'text-text-primary' },
    { key: 'Outerwear', label: '4. Retention: Outerwear', width: '40%', bg: '#fdf5f6', border: 'border-burgundy/25', textColor: 'text-burgundy' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          Category Journey — Entry to Retention
        </h1>
        <p className="text-sm text-text-secondary">
          Garment metrics funnel and acquisition trajectories
        </p>
      </div>

      {/* Visual Funnel Stack (CSS Trapezoid Widths) */}
      <div className="premium-card p-6 flex flex-col gap-4">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-text-primary">Apparel Purchase Journey Funnel</h3>
          <p className="text-xs text-text-secondary">Comparing customer attributes across acquisition categories</p>
        </div>

        <div className="flex flex-col gap-3 items-center py-6 bg-bg-2 rounded-2xl">
          {funnelConfig.map((lvl) => {
            const data = funnelMetrics[lvl.key];
            return (
              <div 
                key={lvl.key}
                className="flex flex-col items-center justify-center p-3 text-center border transition-all duration-300 hover:scale-[1.01]"
                style={{
                  width: lvl.width,
                  background: lvl.bg,
                  borderColor: 'var(--border)',
                  borderRadius: '12px'
                }}
              >
                <span className={`heading-serif text-sm font-bold ${lvl.textColor}`}>{lvl.label}</span>
                <div className="flex gap-4 mt-1 text-[11px] text-text-secondary">
                  <span>Count: <strong>{data.count.toLocaleString()}</strong></span>
                  <span>Avg Ticket: <strong>${data.avgSpend}</strong></span>
                  <span>Prev Orders: <strong>{data.avgPrev}</strong></span>
                  <span>Discount Dependency: <strong>{data.promoRate}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Double Charts Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        <div className="premium-card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-base font-semibold text-text-primary">Customer Journey Position</h3>
              <p className="text-xs text-text-secondary">Average previous purchases by category (Retention levels show higher previous history)</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the entry category funnel chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData1} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <YAxis fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <Tooltip />
                <Bar dataKey="avgPrev" fill="var(--burgundy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="heading-serif text-base font-semibold text-text-primary">Spend vs Promo Reliance</h3>
              <p className="text-xs text-text-secondary">Comparing average spending values and promo dependency rates</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the category purchase frequency chart' } }))}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData2} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <YAxis fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Avg Spend ($)" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Promo Dependency (%)" fill="var(--burgundy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Season x Category Heatmap */}
      <div className="premium-card p-6 flex flex-col gap-4">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-text-primary">Season × Category Retention Heatmap</h3>
          <p className="text-xs text-text-secondary">Cell represents average previous purchases. Opacity scale matches customer brand tenure.</p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-5 gap-2 text-center" style={{ fontSize: '12px' }}>
          {/* Top headers */}
          <div />
          {['Clothing', 'Accessories', 'Footwear', 'Outerwear'].map(cat => (
            <div key={cat} className="font-semibold py-2 text-burgundy">{cat}</div>
          ))}

          {/* Rows */}
          {['Spring', 'Summer', 'Fall', 'Winter'].map(season => (
            <React.Fragment key={season}>
              <div className="font-semibold py-4 flex items-center justify-center bg-bg-2 border border-border rounded-lg">{season}</div>
              {['Clothing', 'Accessories', 'Footwear', 'Outerwear'].map(cat => {
                const cell = heatmapData.matrix[season]?.[cat] || { count: 0, avgSpend: 0, avgPrev: 0 };
                // Opacity formula: proportional to cell.avgPrev / maxPrev
                const ratio = heatmapData.maxPrev > 0 ? (cell.avgPrev / heatmapData.maxPrev) : 0;
                
                return (
                  <div
                    key={cat}
                    className="p-4 border border-border rounded-lg flex flex-col justify-center items-center transition-all group relative cursor-pointer"
                    style={{
                      background: `rgba(107, 29, 42, ${Math.max(0.04, ratio * 0.9)})`,
                      color: ratio > 0.5 ? '#ffffff' : 'var(--text-primary)'
                    }}
                  >
                    <span className="font-bold text-sm">{cell.avgPrev}</span>
                    <span className="text-[9px] opacity-75">orders</span>

                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 bg-text-primary text-[#ffffff] text-[10px] p-2 rounded shadow-lg z-50 pointer-events-none" style={{ minWidth: '110px' }}>
                      <p style={{ margin: 0 }}>Buyers: {cell.count}</p>
                      <p style={{ margin: '2px 0 0 0' }}>Avg. Spend: ${cell.avgSpend}</p>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
