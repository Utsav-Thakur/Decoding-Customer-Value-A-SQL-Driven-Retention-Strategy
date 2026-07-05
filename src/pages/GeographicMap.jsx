import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, Sparkles, Filter, Award } from 'lucide-react';

export default function GeographicMap() {
  const { customers, isLoading } = useData();
  const [filterPill, setFilterPill] = useState('All');

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Classify states dynamically
  const classifiedStates = useMemo(() => {
    if (!stats || !stats.stateAnalysis) return [];
    
    return stats.stateAnalysis.map(state => {
      let classification = 'Standard';
      
      // High Opportunity: high spend and low promo dependency
      if (state.oppScore >= 6.0) {
        classification = 'High Opportunity';
      }
      // Underlevered: high reviews (rating >= 4.0) but lower customer count (< 80)
      else if (state.avgRating >= 4.0 && state.customers < 80) {
        classification = 'Underlevered';
      }
      // Discount-driven: promo rate >= 40%
      else if (state.avgPromo >= 40.0) {
        classification = 'Discount-Driven';
      }

      return {
        ...state,
        classification
      };
    });
  }, [stats]);

  // Filtered states for the Top 12 Cards Grid
  const filteredCards = useMemo(() => {
    if (filterPill === 'All') return classifiedStates.slice(0, 12);
    return classifiedStates.filter(s => s.classification === filterPill).slice(0, 12);
  }, [classifiedStates, filterPill]);

  // Top 20 states for horizontal chart
  const chartData = useMemo(() => {
    return classifiedStates.slice(0, 20);
  }, [classifiedStates]);

  // Compute highest brand pull state names dynamically (oppScore >= 6.5)
  const brandPullStates = useMemo(() => {
    const pulled = classifiedStates.filter(s => s.oppScore >= 6.2).map(s => s.name);
    return {
      count: pulled.length,
      names: pulled.slice(0, 5).join(', ') + (pulled.length > 5 ? ' and others' : '')
    };
  }, [classifiedStates]);

  const getBarColor = (oppScore, avgPromo) => {
    if (avgPromo < 35 && oppScore >= 6.0) return '#2d6a4f'; // Green
    if (avgPromo >= 45) return '#c62828'; // Red
    return '#e65100'; // Orange
  };

  const getClassificationBadge = (cls) => {
    switch (cls) {
      case 'High Opportunity':
        return <span className="badge-loyal" style={{ background: '#d4edda', color: '#2d6a4f' }}>High Opportunity</span>;
      case 'Underlevered':
        return <span className="badge-gold">Underlevered</span>;
      case 'Discount-Driven':
        return <span className="badge-promo">Discount-Driven</span>;
      default:
        return <span className="badge-silver">Stable</span>;
    }
  };

  if (isLoading || !stats.stateAnalysis) {
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
          Geographic Opportunity Map
        </h1>
        <p className="text-sm text-text-secondary">
          States with high spend + low promo dependency = organic brand pull
        </p>
      </div>

      {/* Insight banner */}
      <div className="p-4 rounded-2xl insight-green flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-success tracking-wider block mb-0.5">Brand Pull Diagnostics</span>
          <p className="text-sm text-text-primary leading-normal">
            These <strong>{brandPullStates.count}</strong> states show the highest organic brand pull: <strong className="text-burgundy">{brandPullStates.names}</strong>. Target them for premium boutique pop-ups.
          </p>
        </div>
        <Award size={32} className="text-success opacity-85" />
      </div>

      {/* Horizontal Bar Chart (Top 20 States) */}
      <div className="premium-card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Top 20 Regional Opportunities</h3>
            <p className="text-xs text-text-secondary">Opportunity Score: derived from Spend Volume x (1 - Promo Rate). Colors map to discount vulnerabilities.</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question: 'Explain the geographic state distribution chart' } }))}
            className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2 py-0.5 rounded-md border border-gold/15 transition-all duration-200 cursor-pointer shrink-0"
          >
            <Sparkles size={11} /> What does this mean?
          </button>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--burgundy)' }}>{data.name}</p>
                        <p style={{ margin: '4px 0 0 0' }}>Opportunity Score: {data.oppScore}</p>
                        <p style={{ margin: '2px 0 0 0' }}>Promo Utilization: {data.avgPromo}%</p>
                        <p style={{ margin: '2px 0 0 0' }}>Avg. Order Spend: ${data.avgSpend}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="oppScore" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.oppScore, entry.avgPromo)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Opportunity filter pills */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="heading-serif text-lg font-semibold text-text-primary">Regional Opportunistic Breakdown</h3>
          <div className="flex gap-2">
            {['All', 'High Opportunity', 'Underlevered', 'Discount-Driven'].map(pill => (
              <div
                key={pill}
                onClick={() => setFilterPill(pill)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 border ${
                  filterPill === pill 
                    ? 'bg-burgundy text-[#ffffff] border-burgundy' 
                    : 'bg-card text-text-secondary border-border hover:bg-bg-2'
                }`}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>

        {/* State cards grid (top 12) */}
        {filteredCards.length === 0 ? (
          <div className="p-8 text-center text-text-muted heading-serif">
            No regional units found matching the opportunity filter.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredCards.map((state, idx) => (
              <div key={idx} className="premium-card p-4 flex flex-col justify-between" style={{ minHeight: '130px' }}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 text-burgundy font-semibold text-sm">
                    <MapPin size={14} />
                    {state.name}
                  </div>
                  {getClassificationBadge(state.classification)}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div>
                    <span className="text-[9px] text-text-muted uppercase font-bold">Buyers count</span>
                    <strong className="text-text-primary block mt-0.5">{state.customers}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted uppercase font-bold">Avg Spend</span>
                    <strong className="text-text-primary block mt-0.5">${state.avgSpend}</strong>
                  </div>
                  <div className="col-span-2 flex justify-between border-t border-border pt-1.5 mt-1 text-[11px] text-text-secondary">
                    <span>Discount Rate:</span>
                    <span className="font-semibold">{state.avgPromo}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
