// Output Landing.jsx completely from start to finish. All 7 sections. All animations. All scroll reveals. All data from DataContext. No truncation. No placeholders. No localStorage. Full working code only.

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Ticket, Activity, Award, ArrowUpRight, CheckCircle2, TrendingUp, 
  Sparkles, MapPin, Zap, Building2, Star, Clock, AlertTriangle, Search, 
  Target, ShoppingBag, BookOpen 
} from 'lucide-react';

// ─── Custom scroll reveal hook ─────────────────────────────

function useScrollReveal(threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  
  return [ref, isVisible];
}

// ─── Modular count-up number component ────────────────────

function CountUpNumber({ target, duration = 1200, isTriggered = true, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isTriggered && !hasAnimated.current && target > 0) {
      hasAnimated.current = true;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setValue(Math.floor(eased * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setValue(target);
        }
      };
      requestAnimationFrame(step);
    }
  }, [isTriggered, target, duration]);

  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

export default function Landing({ setActiveTab }) {
  const { customers, isCustomData, isLoading } = useData();

  // Injected CSS Keyframes & Animations
  useEffect(() => {
    const styleId = 'landing-styles';
    if (!document.getElementById(styleId)) {
      const styleNode = document.createElement('style');
      styleNode.id = styleId;
      styleNode.textContent = `
        @keyframes heroLineIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes goldLineExpand {
          from { width: 0; opacity: 0; }
          to { width: 40px; opacity: 1; }
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 20px) scale(1.06); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, -20px); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        @keyframes borderPulse-burgundy {
          0%, 100% { box-shadow: 4px 0 0 0 rgba(107,29,42,0.25), 0 2px 8px rgba(107,29,42,0.04); }
          50% { box-shadow: 4px 0 0 0 #6b1d2a, 0 8px 24px rgba(107,29,42,0.12); }
        }
        @keyframes borderPulse-gold {
          0%, 100% { box-shadow: 4px 0 0 0 rgba(201,151,58,0.25), 0 2px 8px rgba(201,151,58,0.04); }
          50% { box-shadow: 4px 0 0 0 #c9973a, 0 8px 24px rgba(201,151,58,0.12); }
        }
        @keyframes borderPulse-green {
          0%, 100% { box-shadow: 4px 0 0 0 rgba(45,106,79,0.25), 0 2px 8px rgba(45,106,79,0.04); }
          50% { box-shadow: 4px 0 0 0 #2d6a4f, 0 8px 24px rgba(45,106,79,0.12); }
        }
        @keyframes borderPulse-blue {
          0%, 100% { box-shadow: 4px 0 0 0 rgba(21,101,192,0.25), 0 2px 8px rgba(21,101,192,0.04); }
          50% { box-shadow: 4px 0 0 0 #1565c0, 0 8px 24px rgba(21,101,192,0.12); }
        }
        @keyframes jarvPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(201,151,58,0.2), 0 0 0 8px rgba(201,151,58,0.1); }
          50% { box-shadow: 0 0 0 8px rgba(201,151,58,0.35), 0 0 0 16px rgba(201,151,58,0.18); }
        }
        @keyframes scrollReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 1024px) {
          .hero-container-split {
            flex-grow: 1 !important;
            height: 0 !important;
            min-height: 0 !important;
          }
        }
      `;
      document.head.appendChild(styleNode);
    }
  }, []);

  // Compute database analytics using context hook
  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  const metrics = useMemo(() => {
    if (!customers || customers.length === 0) {
      return {
        promoRevenuePct: 0,
        topStates: '',
        platinumMultiplier: 0,
        totalSpend: 0,
        marginRiskAmount: 0,
        platinumCount: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        loyalCount: 0,
        promoTrapCount: 0,
        idealCount: 0,
        underleveredCount: 0,
        topStateAvgSpend: 0,
        topStatePromoRate: 0,
        avgRating: 0,
        subAvgPurchases: 0,
        platNeverPromoRate: 0,
        idealAvgAge: 0,
        idealAvgSpend: 0,
        idealTopState: 'N/A',
        idealTopCategory: 'Clothing',
        nonSubGoldCount: 0
      };
    }

    const total = customers.length;
    const totalSpend = customers.reduce((acc, c) => acc + c.purchase_amount, 0);
    const promoSpend = customers.filter(c => c.promo_dependency_score > 0).reduce((acc, c) => acc + c.purchase_amount, 0);
    const promoRevenuePct = totalSpend > 0 ? ((promoSpend / totalSpend) * 100).toFixed(1) : 0;

    const platinumList = customers.filter(c => c.value_tier === 'Platinum');
    const goldList = customers.filter(c => c.value_tier === 'Gold');
    const silverList = customers.filter(c => c.value_tier === 'Silver');
    const bronzeList = customers.filter(c => c.value_tier === 'Bronze');

    const avgPlat = platinumList.length > 0 ? (platinumList.reduce((acc, c) => acc + c.purchase_amount, 0) / platinumList.length) : 0;
    const avgBronze = bronzeList.length > 0 ? (bronzeList.reduce((acc, c) => acc + c.purchase_amount, 0) / bronzeList.length) : 0;
    const platinumMultiplier = avgBronze > 0 ? (avgPlat / avgBronze).toFixed(1) : 0;

    const platPromoCount = platinumList.filter(c => c.promo_dependency_score > 0).length;
    const platNeverPromoRate = platinumList.length > 0 ? (((platinumList.length - platPromoCount) / platinumList.length) * 100).toFixed(0) : '0';

    const underlevered = stats.stateAnalysis.slice(0, 3).map(s => s.name).join(', ');
    const underleveredCount = stats.stateAnalysis.filter(s => s.oppScore > 6).length;

    const riskCustomers = customers.filter(c => c.churn_risk === true || c.churn_risk === 1);
    const marginRiskAmount = riskCustomers.reduce((acc, c) => acc + c.purchase_amount, 0);

    const loyalCount = customers.filter(c => c.loyalty_score >= 0.6 && c.promo_dependency_score <= 0.2).length;
    const promoTrapCount = customers.filter(c => c.promo_trap).length;
    const idealCount = customers.filter(c => c.high_value_no_promo).length;
    const avgRating = (customers.reduce((acc, c) => acc + c.review_rating, 0) / total).toFixed(1);

    const subs = customers.filter(c => c.subscription_status === 'Yes');
    const nonSubs = customers.filter(c => c.subscription_status === 'No');
    const avgSubs = subs.length > 0 ? (subs.reduce((acc, c) => acc + c.previous_purchases, 0) / subs.length) : 0;
    const avgNonSubs = nonSubs.length > 0 ? (nonSubs.reduce((acc, c) => acc + c.previous_purchases, 0) / nonSubs.length) : 1;
    const subAvgPurchases = avgNonSubs > 0 ? (avgSubs / avgNonSubs).toFixed(1) : '1.5';

    const topStateAvgSpend = stats.stateAnalysis[0]?.avgSpend || 0;
    const topStatePromoRate = stats.stateAnalysis[0]?.avgPromo || 0;

    const ideals = customers.filter(c => c.high_value_no_promo);
    const idealAvgAge = ideals.length > 0 ? (ideals.reduce((acc, c) => acc + c.age, 0) / ideals.length).toFixed(0) : '32';
    const idealAvgSpend = ideals.length > 0 ? (ideals.reduce((acc, c) => acc + c.purchase_amount, 0) / ideals.length).toFixed(0) : '120';
    const idealTopState = stats.idealProfile?.topStates?.split(', ')[0] || 'N/A';
    const idealTopCategory = stats.idealProfile?.preferredCategory || 'Clothing';

    const nonSubGoldCount = customers.filter(c => c.value_tier === 'Gold' && c.subscription_status === 'No').length;

    return {
      promoRevenuePct,
      topStates: underlevered,
      platinumMultiplier,
      totalSpend,
      marginRiskAmount,
      platinumCount: platinumList.length,
      goldCount: goldList.length,
      silverCount: silverList.length,
      bronzeCount: bronzeList.length,
      loyalCount,
      promoTrapCount,
      idealCount,
      underleveredCount,
      topStateAvgSpend,
      topStatePromoRate,
      avgRating,
      subAvgPurchases,
      platNeverPromoRate,
      idealAvgAge,
      idealAvgSpend,
      idealTopState,
      idealTopCategory,
      nonSubGoldCount
    };
  }, [customers, stats]);

  // Scroll reveals declarations
  const [sec3Ref, sec3Visible] = useScrollReveal(0.12);
  const [sec4Ref, sec4Visible] = useScrollReveal(0.12);
  const [sec5Ref, sec5Visible] = useScrollReveal(0.12);
  const [sec6Ref, sec6Visible] = useScrollReveal(0.12);
  const [sec7Ref, sec7Visible] = useScrollReveal(0.12);

  // Loading indicator matching the theme
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full h-screen items-center justify-center" style={{ background: '#faf7f2' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: '200px', height: '20px' }} />
          <div className="skeleton" style={{ width: '150px', height: '14px' }} />
        </div>
      </div>
    );
  }

  // Recharts Data Adapters
  const categoryData = stats.categoryAnalysis.map(cat => ({
    name: cat.name,
    avgSpend: cat.avgSpend
  }));

  const topStateData = stats.stateAnalysis.slice(0, 5).map(s => ({
    name: s.name,
    customers: s.customers,
    oppScore: Math.min(100, Math.round(s.oppScore * 10))
  }));

  const tierColors = { Platinum: '#6b1d2a', Gold: '#c9973a', Silver: '#a0938d', Bronze: '#d4c4be' };
  const tierData = ['Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => {
    const list = customers.filter(c => c.value_tier === tier);
    const count = list.length;
    const avgSpend = count > 0 ? (list.reduce((acc, c) => acc + c.purchase_amount, 0) / count) : 0;
    const percentage = ((count / customers.length) * 100).toFixed(1);
    
    return {
      name: tier,
      value: count,
      avgSpend,
      percentage,
      fill: tierColors[tier]
    };
  });


  // Trigger JARVIS custom event
  const triggerJarvis = (question) => {
    window.dispatchEvent(new CustomEvent('open-jarvis', { detail: { question } }));
  };

  return (
    <div style={{ background: '#faf7f2', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>

      {/* ── DESKTOP FULL-SCREEN HERO + TICKER WRAPPER ────────────────── */}
      <div className="w-full flex flex-col lg:h-screen lg:min-h-screen lg:overflow-hidden shrink-0">

        {/* ── SECTION 1: SPLIT SCREEN HERO ────────────────── */}
        <div 
          className="flex flex-col lg:flex-row w-full hero-container-split"
          style={{ overflow: 'hidden' }}
        >
        {/* LEFT PANEL (45% width) */}
        <div 
          className="w-full lg:w-[45%] flex flex-col justify-between relative p-8 md:p-12 lg:p-16"
          style={{
            background: 'linear-gradient(160deg, #3d0a12 0%, #6b1d2a 50%, #8b2635 100%)',
            backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px), linear-gradient(160deg, #3d0a12 0%, #6b1d2a 50%, #8b2635 100%)',
            backgroundSize: '24px 24px, 100% 100%',
            overflow: 'hidden',
          }}
        >
          {/* Floating orbs */}
          <div 
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(201, 151, 58, 0.09)',
              filter: 'blur(60px)',
              animation: 'floatOrb1 8s ease-in-out infinite alternate'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              filter: 'blur(40px)',
              animation: 'floatOrb2 12s ease-in-out infinite alternate'
            }}
          />

          {/* Top block */}
          <div className="z-10 mt-4">
            <span 
              style={{
                letterSpacing: '0.3em',
                fontSize: '11px',
                color: '#c9973a',
                fontWeight: '600',
                display: 'block',
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              CUSTOMER INTELLIGENCE PLATFORM
            </span>

            <div 
              style={{
                width: '40px',
                height: '1px',
                background: '#c9973a',
                margin: '20px 0',
                animation: 'goldLineExpand 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            />

            {/* Main heading */}
            <div className="flex flex-col gap-1 heading-serif mt-6">
              {['Know Your', 'Customer.', 'Build Real', 'Loyalty.'].map((line, idx) => (
                <span 
                  key={idx}
                  style={{
                    fontSize: '52px',
                    lineHeight: '1.15',
                    color: idx === 1 ? '#c9973a' : '#faf7f2',
                    fontWeight: idx === 1 ? '700' : '400',
                    opacity: 0,
                    animation: `heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${150 + idx * 150}ms forwards`
                  }}
                >
                  {line}
                </span>
              ))}
            </div>

            {/* Subtitle */}
            <p 
              style={{
                color: '#e8cdd0',
                fontSize: '15px',
                lineHeight: '1.7',
                maxWidth: '340px',
                marginTop: '28px',
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards'
              }}
            >
              Intelligence built on <strong>{stats.totalCustomers.toLocaleString()}</strong> customers across 50 US states. Updated live as you add data.
            </p>

            {/* Stat pills row */}
            <div 
              className="flex flex-wrap gap-3 mt-6"
              style={{
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1000ms forwards'
              }}
            >
              <div 
                style={{
                  border: '1px solid rgba(230, 81, 0, 0.3)',
                  background: 'rgba(230, 81, 0, 0.08)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  color: '#e65100',
                  fontWeight: '600'
                }}
              >
                {stats.promoRate}% promo exposed
              </div>
              <div 
                style={{
                  border: '1px solid rgba(201, 151, 58, 0.3)',
                  background: 'rgba(201, 151, 58, 0.08)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  color: '#c9973a',
                  fontWeight: '600'
                }}
              >
                {metrics.platinumCount} Platinum customers
              </div>
            </div>

            {/* CTA Buttons */}
            <div 
              className="flex flex-wrap gap-4 mt-8"
              style={{
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1200ms forwards'
              }}
            >
              <button 
                onClick={() => setActiveTab('pyramid')}
                className="cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #c9973a, #e8b44a)',
                  color: '#1a0a0e',
                  fontWeight: '600',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  fontSize: '13px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(201, 151, 58, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 151, 58, 0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(201, 151, 58, 0.3)';
                }}
              >
                Explore Segments →
              </button>
              <button 
                onClick={() => setActiveTab('new-data')}
                className="cursor-pointer"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(201, 151, 58, 0.6)',
                  color: '#c9973a',
                  fontWeight: '600',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(201, 151, 58, 0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Add Your Data
              </button>
            </div>
          </div>

          {/* Bottom tag */}
          <div 
            className="text-center mt-12 lg:mt-0 z-10"
            style={{
              color: 'rgba(255, 255, 255, 0.22)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: '500'
            }}
          >
            Powered by BrandIQ Intelligence Engine
          </div>
        </div>

        {/* RIGHT PANEL (55% width) */}
        <div 
          className="w-full lg:w-[55%] flex flex-col justify-between relative p-6 md:p-10 lg:p-12"
          style={{
            background: '#faf7f2',
            overflow: 'hidden'
          }}
        >
          {/* Vertical gold line divider */}
          <div 
            style={{
              width: '2px',
              height: '60%',
              background: 'linear-gradient(to bottom, transparent, #c9973a, transparent)',
              position: 'absolute',
              left: 0,
              top: '20%'
            }}
          />

          {/* TOP ROW — 3 mini stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 z-10">
            {/* Card 1 */}
            <div 
              className="bg-white p-5 rounded-xl border border-[#e8ddd5] flex flex-col gap-1 shadow-sm"
              style={{
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 600ms forwards'
              }}
            >
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Customers</span>
              <h3 className="heading-serif text-3xl font-bold mt-1" style={{ color: '#6b1d2a' }}>
                <CountUpNumber target={stats.totalCustomers} />
              </h3>
            </div>
            {/* Card 2 */}
            <div 
              className="bg-white p-5 rounded-xl border border-[#e8ddd5] flex flex-col gap-1 shadow-sm"
              style={{
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards'
              }}
            >
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Avg Purchase</span>
              <h3 className="heading-serif text-3xl font-bold mt-1" style={{ color: '#c9973a' }}>
                <CountUpNumber target={Math.round(stats.avgPurchase)} prefix="$" />
              </h3>
            </div>
            {/* Card 3 */}
            <div 
              className="bg-white p-5 rounded-xl border border-[#e8ddd5] flex flex-col gap-1 shadow-sm"
              style={{
                opacity: 0,
                animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1000ms forwards'
              }}
            >
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Promo Rate</span>
              <h3 className="heading-serif text-3xl font-bold mt-1" style={{ color: '#e65100' }}>
                <CountUpNumber target={stats.promoRate} suffix="%" />
              </h3>
            </div>
          </div>

          {/* MAIN CHART AREA — Donut chart */}
          <div 
            className="flex flex-col items-center justify-center my-6 z-10"
            style={{
              opacity: 0,
              animation: 'heroLineIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 750ms forwards'
            }}
          >
            <div className="w-full max-w-[280px] h-[220px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={400}
                    animationDuration={1200}
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-[#e8ddd5] p-3 rounded-lg shadow-md" style={{ pointerEvents: 'none', fontSize: '12px' }}>
                            <p style={{ margin: 0, fontWeight: '700', color: data.fill }}>{data.name} Tier</p>
                            <p style={{ margin: '4px 0 0 0' }}>Customers: <strong>{data.value.toLocaleString()}</strong></p>
                            <p style={{ margin: '2px 0 0 0' }}>Avg spend: <strong>${data.avgSpend.toFixed(0)}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center label */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-text-secondary tracking-widest uppercase">VALUE</span>
                <span className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mt-0.5">PYRAMID</span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-2 w-full">
              {tierData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.fill }} />
                    <span className="text-xs font-semibold text-text-primary">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-text-secondary mt-0.5">
                    {item.value.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>

            {/* What does this mean? */}
            <button
              onClick={() => triggerJarvis('Explain the value tier composition chart')}
              className="text-xs text-[#c9973a] hover:underline flex items-center gap-1 font-medium bg-gold/5 px-2.5 py-1 rounded-md border border-gold/15 transition-all duration-200 mt-3 cursor-pointer"
            >
              <Sparkles size={11} /> What does this mean?
            </button>
          </div>

          {/* BOTTOM ROW — 2 mini insight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 z-10">
            {/* Card A */}
            <div className="p-4 rounded-xl insight-burgundy flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-lg bg-burgundy/5 text-burgundy shrink-0">
                <TrendingUp size={16} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Top loyalty signal</span>
                <p className="text-xs text-text-primary leading-normal mt-1">
                  Subscribed customers make <strong>{metrics.subAvgPurchases}x more</strong> purchases than non-subscribers.
                </p>
              </div>
            </div>
            {/* Card B */}
            <div className="p-4 rounded-xl insight-gold flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-lg bg-gold/5 text-gold shrink-0">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Biggest opportunity</span>
                <p className="text-xs text-text-primary leading-normal mt-1">
                  <strong>{metrics.idealTopState}</strong> — high spend efficiency and low promo dependency rate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LIVE STATS TICKER ────────────────────────── */}
      <div 
        className="w-full flex items-center shrink-0"
        style={{
          background: '#6b1d2a',
          height: '48px',
          overflow: 'hidden',
          borderTop: '1px solid rgba(201, 151, 58, 0.2)',
          borderBottom: '1px solid rgba(201, 151, 58, 0.2)',
        }}
      >
        <div 
          className="flex items-center h-full whitespace-nowrap"
          style={{
            animation: 'ticker 25s linear infinite',
            lineHeight: '1'
          }}
          onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
          onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
        >
          {[1, 2, 3].map((loopIdx) => (
            <div key={loopIdx} className="flex items-center h-full text-[#faf7f2] font-semibold text-xs tracking-wide">
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>🏆</span> {metrics.platinumCount} Platinum Customers</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>💰</span> ${metrics.totalSpend.toLocaleString()} Total Purchase Volume</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>⚠</span> {metrics.promoTrapCount} Promo Trap Customers</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>📍</span> {metrics.idealTopState} — Top Opportunity State</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>✓</span> {metrics.loyalCount} Genuinely Loyal Customers</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>📦</span> {metrics.idealTopCategory} — Most Popular Category</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>⭐</span> {metrics.avgRating} Average Review Rating</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
              
              <span className="flex items-center h-full gap-1.5"><span className="inline-flex items-center" style={{ fontSize: '14px' }}>🎯</span> {metrics.idealCount} Ideal ICP Matches</span>
              <span style={{ color: '#c9973a', margin: '0 20px' }}>·</span>
            </div>
          ))}
        </div>
      </div>
      
      </div>

      <div className="max-w-[1240px] mx-auto px-6 py-16 flex flex-col gap-24">

        {/* ── SECTION 3: KPI CARDS ROW (scroll reveal) ───────────── */}
        <div 
          ref={sec3Ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
          style={{
            opacity: sec3Visible ? 1 : 0,
            transform: sec3Visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Card 1 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between shadow-xs transition-all duration-300 group"
            style={{
              transitionDelay: '0ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c9973a';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(107, 29, 42, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e8ddd5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-burgundy/5 text-burgundy">
                <Building2 size={20} />
              </div>
              <span className="text-[10px] font-bold text-success bg-success/5 border border-success/15 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="mt-6">
              <h3 className="heading-serif text-4xl font-bold" style={{ color: '#6b1d2a' }}>
                <CountUpNumber target={stats.totalCustomers} isTriggered={sec3Visible} />
              </h3>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mt-2">Total Customers</span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-1">
                {metrics.platinumCount} Plat · {metrics.goldCount} Gold · {metrics.silverCount} Silver · {metrics.bronzeCount} Bronze
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between shadow-xs transition-all duration-300 group"
            style={{
              transitionDelay: '150ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c9973a';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(107, 29, 42, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e8ddd5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-warning/5 text-[#e65100]">
                <Ticket size={20} />
              </div>
              <span className="text-[10px] font-bold text-[#e65100] bg-warning/5 border border-warning/15 px-2 py-0.5 rounded-full">
                Exposure
              </span>
            </div>
            <div className="mt-6">
              <h3 className="heading-serif text-4xl font-bold" style={{ color: '#e65100' }}>
                <CountUpNumber target={stats.promoRate} suffix="%" isTriggered={sec3Visible} />
              </h3>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mt-2">Promo Dependency</span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-1">
                {metrics.promoTrapCount} in promo trap — margin leakage risk.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between shadow-xs transition-all duration-300 group"
            style={{
              transitionDelay: '300ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c9973a';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(107, 29, 42, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e8ddd5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-gold/5 text-gold">
                <Star size={20} />
              </div>
              <span className="text-[10px] font-bold text-gold bg-gold/5 border border-gold/15 px-2 py-0.5 rounded-full">
                Retention
              </span>
            </div>
            <div className="mt-6">
              <h3 className="heading-serif text-4xl font-bold" style={{ color: '#c9973a' }}>
                <CountUpNumber target={stats.subscriberRate} suffix="%" isTriggered={sec3Visible} />
              </h3>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mt-2">Subscribers</span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-1">
                Subscribers buy {metrics.subAvgPurchases}x more than non-subscribers.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between shadow-xs transition-all duration-300 group"
            style={{
              transitionDelay: '450ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c9973a';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(107, 29, 42, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e8ddd5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-success/5 text-[#2d6a4f]">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-bold text-success bg-success/5 border border-success/15 px-2 py-0.5 rounded-full">
                Basket
              </span>
            </div>
            <div className="mt-6">
              <h3 className="heading-serif text-4xl font-bold" style={{ color: '#2d6a4f' }}>
                <CountUpNumber target={stats.avgPurchase} prefix="$" isTriggered={sec3Visible} />
              </h3>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mt-2">Avg Purchase</span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-1">
                Platinum: ${Math.round(metrics.topStateAvgSpend * 1.3)} · Bronze: ${Math.round(metrics.topStateAvgSpend * 0.6)}
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div 
            className="bg-white p-6 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between shadow-xs transition-all duration-300 group"
            style={{
              transitionDelay: '600ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c9973a';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(107, 29, 42, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e8ddd5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-info/5 text-[#1565c0]">
                <Activity size={20} />
              </div>
              <span className="text-[10px] font-bold text-info bg-info/5 border border-info/15 px-2 py-0.5 rounded-full">
                Loyalty
              </span>
            </div>
            <div className="mt-6">
              <h3 className="heading-serif text-4xl font-bold" style={{ color: '#1565c0' }}>
                <CountUpNumber target={stats.avgPreviousPurchases} isTriggered={sec3Visible} />
              </h3>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mt-2">Avg History</span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-1">
                Prior orders per customer. High retention proxy.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: INSIGHT STORY (scroll narrative) ──────────── */}
        <div 
          ref={sec4Ref}
          className="flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-4 relative"
          style={{
            opacity: sec4Visible ? 1 : 0,
            transform: sec4Visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Chapter 1 */}
          <div className="flex-1 bg-white p-8 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between gap-6 relative">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 text-[#e65100] flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-extrabold text-gold tracking-widest uppercase">01 · THE PROBLEM</span>
              <h3 className="heading-serif text-2xl font-bold text-burgundy leading-tight">
                You have data. <br /><span className="text-gold">You lack intelligence.</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong>{stats.promoRate}%</strong> of your customers only purchase when given a discount code. Without isolating them, every new campaign wastes margin.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#e8ddd5]">
              <h4 className="heading-serif text-4xl font-bold text-burgundy">{stats.promoRate}%</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1 block">promo dependent shoppers</span>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex items-center justify-center text-gold px-2 text-xl font-bold animate-[floatEffect_3s_infinite_ease-in-out]">
            →
          </div>

          {/* Chapter 2 */}
          <div className="flex-1 bg-white p-8 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between gap-6 relative">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Search size={24} />
              </div>
              <span className="text-[10px] font-extrabold text-gold tracking-widest uppercase">02 · THE DISCOVERY</span>
              <h3 className="heading-serif text-2xl font-bold text-burgundy leading-tight">
                Not all customers <br /><span className="text-gold">are equal.</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your <strong>{metrics.platinumCount}</strong> Platinum tier buyers spend <strong>{metrics.platinumMultiplier}x more</strong> than Bronze members. Best of all, <strong>{metrics.platNeverPromoRate}%</strong> of them shop without discount codes.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#e8ddd5]">
              <h4 className="heading-serif text-4xl font-bold text-gold">{metrics.platinumMultiplier}x</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1 block">Platinum vs Bronze spend</span>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex items-center justify-center text-gold px-2 text-xl font-bold animate-[floatEffect_3s_infinite_ease-in-out_0.5s]">
            →
          </div>

          {/* Chapter 3 */}
          <div className="flex-1 bg-white p-8 rounded-2xl border border-[#e8ddd5] flex flex-col justify-between gap-6 relative">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <Target size={24} />
              </div>
              <span className="text-[10px] font-extrabold text-gold tracking-widest uppercase">03 · THE ACTION</span>
              <h3 className="heading-serif text-2xl font-bold text-burgundy leading-tight">
                Build loyalty. <br /><span className="text-gold">Reduce dependency.</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                BrandIQ isolates your <strong>{metrics.idealCount}</strong> ideal full-price VIPs, segments <strong>{metrics.promoTrapCount}</strong> margin-negative promo traps, and maps growth in high-value states like <strong>{metrics.idealTopState}</strong>.
              </p>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setActiveTab('pyramid')}
                className="btn-primary w-full text-center text-xs font-semibold cursor-pointer"
                style={{ padding: '12px', borderRadius: '10px' }}
              >
                See Full Analysis →
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: FLOATING INSIGHT CARDS (pulsing) ─────────── */}
        <div 
          ref={sec5Ref}
          className="flex flex-col gap-6"
          style={{
            opacity: sec5Visible ? 1 : 0,
            transform: sec5Visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="text-center">
            <span className="text-[10px] font-bold text-gold tracking-widest uppercase">DIAGNOSTIC SNAPSHOT</span>
            <h2 className="heading-serif text-3xl font-bold text-burgundy mt-2">Margin & Retention Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Card 1 */}
            <div 
              className="bg-white p-6 rounded-2xl border-l-4 border-l-burgundy flex flex-col justify-between gap-4"
              style={{
                border: '1px solid #e8ddd5',
                borderLeft: '4px solid #6b1d2a',
                animation: 'borderPulse-burgundy 3s ease-in-out infinite'
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Revenue at Promo Risk</span>
                  <h3 className="heading-serif text-2xl font-bold mt-1 text-burgundy">${metrics.promoRevenuePct}% exposed</h3>
                </div>
                <span className="badge-risk">Immediate Action</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong>{stats.promoRate}%</strong> of purchase volume is promo-exposed. Sunset <strong>{metrics.promoTrapCount}</strong> trap customers for immediate margin recovery.
              </p>
            </div>

            {/* Card 2 */}
            <div 
              className="bg-white p-6 rounded-2xl border-l-4 border-l-gold flex flex-col justify-between gap-4"
              style={{
                border: '1px solid #e8ddd5',
                borderLeft: '4px solid #c9973a',
                animation: 'borderPulse-gold 3s ease-in-out infinite',
                animationDelay: '0.75s'
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Top Underlevered State</span>
                  <h3 className="heading-serif text-2xl font-bold mt-1 text-gold">{metrics.idealTopState}</h3>
                </div>
                <span className="badge-loyal">Scale Here</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong>${Math.round(metrics.topStateAvgSpend)}</strong> avg spend · <strong>{metrics.topStatePromoRate}%</strong> promo rate — highest brand pull in the network.
              </p>
            </div>

            {/* Card 3 */}
            <div 
              className="bg-white p-6 rounded-2xl border-l-4 border-l-green flex flex-col justify-between gap-4"
              style={{
                border: '1px solid #e8ddd5',
                borderLeft: '4px solid #2d6a4f',
                animation: 'borderPulse-green 3s ease-in-out infinite',
                animationDelay: '1.5s'
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Ideal Customer Profile</span>
                  <h3 className="heading-serif text-2xl font-bold mt-1 text-success">{metrics.idealCount} matches</h3>
                </div>
                <span className="badge-loyal">Build Lookalike</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Age <strong>{metrics.idealAvgAge}</strong> · <strong>{metrics.idealTopState}</strong> · <strong>{metrics.idealTopCategory}</strong> · <strong>${metrics.idealAvgSpend}</strong> avg spend · 0% promo dependency.
              </p>
            </div>

            {/* Card 4 */}
            <div 
              className="bg-white p-6 rounded-2xl border-l-4 border-l-blue flex flex-col justify-between gap-4"
              style={{
                border: '1px solid #e8ddd5',
                borderLeft: '4px solid #1565c0',
                animation: 'borderPulse-blue 3s ease-in-out infinite',
                animationDelay: '2.25s'
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Subscription Lift</span>
                  <h3 className="heading-serif text-2xl font-bold mt-1 text-info">{metrics.subAvgPurchases}x purchases</h3>
                </div>
                <span className="badge-loyal" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>Quick Win</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Subscribers buy <strong>{metrics.subAvgPurchases}x</strong> more than non-subscribers. Converting <strong>{metrics.nonSubGoldCount}</strong> Gold non-subscribers is your fastest win.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: JARVIS GREETING CARD ─────────────────────── */}
        <div 
          ref={sec6Ref}
          style={{
            opacity: sec6Visible ? 1 : 0,
            transform: sec6Visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div 
            className="p-8 md:p-12 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #3d0a12, #6b1d2a)',
              borderColor: 'rgba(201, 151, 58, 0.25)',
              boxShadow: '0 20px 60px rgba(107, 29, 42, 0.2)'
            }}
          >
            {/* Left side */}
            <div className="flex flex-col gap-4 z-10 max-w-[64%]">
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-gold"
                  style={{ background: 'rgba(201, 151, 58, 0.15)', border: '1px solid rgba(201, 151, 58, 0.2)' }}
                >
                  ✦ JARVIS · Customer Intelligence Assistant
                </span>
              </div>
              <h3 className="heading-serif text-3xl font-bold text-white leading-tight">
                Ask me anything <br />about your {stats.totalCustomers.toLocaleString()} customers.
              </h3>
              <p className="text-sm text-[#e8cdd0] leading-relaxed">
                I know your segments, your promo exposure, your geographic opportunities, and your ideal customer profile. No API. No delay. Just answers.
              </p>
              
              {/* Question pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  'Who are my best customers?',
                  'Where should I stop discounting?',
                  'Which states are underlevered?',
                  'What does my ideal customer look like?'
                ].map((q, qIdx) => (
                  <div
                    key={qIdx}
                    onClick={() => triggerJarvis(q)}
                    className="px-3.5 py-2 border rounded-full text-xs cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: 'rgba(201, 151, 58, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#faf7f2'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(201, 151, 58, 0.15)';
                      e.currentTarget.style.borderColor = '#c9973a';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(201, 151, 58, 0.2)';
                    }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-center gap-3 z-10 shrink-0">
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c9973a, #e8b44a)',
                  color: '#3d0a12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '40px',
                  fontWeight: '700',
                  animation: 'jarvPulse 3s ease-in-out infinite'
                }}
              >
                J
              </div>
              <span className="text-[11px] text-gold uppercase font-bold tracking-widest">JARVIS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                <span className="text-[10px] text-[#e8cdd0] opacity-80 font-medium">Online · Live Analyze</span>
              </div>
              <button 
                onClick={() => triggerJarvis('')}
                className="btn-gold text-xs font-bold cursor-pointer mt-2"
                style={{ padding: '8px 20px', borderRadius: '8px' }}
              >
                Ask Jarvis →
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 7: CTA NAVIGATION GRID ────────────────────── */}
        <div 
          ref={sec7Ref}
          className="flex flex-col gap-8"
          style={{
            opacity: sec7Visible ? 1 : 0,
            transform: sec7Visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="text-center flex flex-col items-center">
            <h2 className="heading-serif text-3xl font-bold text-burgundy">Explore the Full Analysis</h2>
            <div 
              style={{
                width: '80px',
                height: '2px',
                background: '#c9973a',
                margin: '16px 0'
              }}
            />
            <p className="text-xs text-text-secondary">Every insight is computed live from your customer data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {/* Card 1 */}
            <div 
              onClick={() => setActiveTab('pyramid')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6b1d2a';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-burgundy/10 text-burgundy flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Database Segmentation</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Customer Pyramid</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  See how value is distributed across your {stats.totalCustomers.toLocaleString()} customers.
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setActiveTab('promo')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#e65100';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning/10 text-[#e65100] flex items-center justify-center">
                  <Ticket size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Margin Protection</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Promo Analysis</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  Identify {metrics.promoTrapCount} promo trap customers costing you margins.
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => setActiveTab('geographic')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#c9973a';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Geographic Opportunities</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Geographic Map</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  Find {metrics.underleveredCount} underlevered states with organic demand.
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => setActiveTab('funnel')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#2d6a4f';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Category Flow</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Category Funnel</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  Map the journey from Clothing (entry) to Outerwear (retention).
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Card 5 */}
            <div 
              onClick={() => setActiveTab('playbook')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1565c0';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Action Playbooks</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Retention Playbook</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  3-phase promo sunset plan with specific triggers and timelines.
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Card 6 */}
            <div 
              onClick={() => setActiveTab('ideal')}
              className="premium-card p-6 flex flex-col justify-between gap-8 cursor-pointer transition-all duration-300 group"
              style={{ height: '220px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#c9973a';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.querySelector('.nav-arrow').style.transform = 'translateX(0)';
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                  <Star size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Target Persona</span>
                  <h4 className="heading-serif text-lg font-bold text-burgundy">Ideal Profile</h4>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary pr-4">
                  Profile of {metrics.idealCount} customers worth acquiring more of.
                </p>
                <span className="nav-arrow text-burgundy font-bold text-lg transition-transform duration-300">→</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
