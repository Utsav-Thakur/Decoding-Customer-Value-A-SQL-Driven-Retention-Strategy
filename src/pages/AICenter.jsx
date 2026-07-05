import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { answerQuestion, SUGGESTED_PROMPTS } from '../utils/aiChat';
import { getEmailTemplate, EMAIL_SEGMENTS } from '../utils/emailTemplates';
import { predictCustomer, getTierColor } from '../utils/customerPredictor';
import { Brain, Send, Sparkles, AlertTriangle, FileText, Clipboard, Star, Activity, Ticket, Award } from 'lucide-react';

export default function AICenter() {
  const { customers, isLoading } = useData();

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  // Median previous purchases calculation
  const medianPrev = useMemo(() => {
    if (!customers || customers.length === 0) return 0;
    const sorted = [...customers].map(c => c.previous_purchases).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [customers]);

  // ==========================================
  // SUB-SECTION 1: AI Chat Assistant
  // ==========================================
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings. I am the **BrandIQ Cognitive Assistant** — powered entirely by your data, zero external APIs. Ask me anything about your customers, promo exposure, churn risk, or what actions to take today.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const container = chatEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = (textToSend) => {
    const q = (textToSend || inputText).trim();
    if (!q) return;

    setMessages(prev => [...prev, { sender: 'user', text: q }]);
    setInputText('');
    setIsTyping(true);

    // Uses aiChat.js — pure JS analysis, zero API calls
    setTimeout(() => {
      const ans = answerQuestion(q, customers);
      setMessages(prev => [...prev, { sender: 'bot', text: ans }]);
      setIsTyping(false);
    }, 380);
  };

  // ==========================================
  // SUB-SECTION 2: Customer Profile Predictor
  // ==========================================
  const [predAge, setPredAge] = useState(30);
  const [predGender, setPredGender] = useState('Female');
  const [predCategory, setPredCategory] = useState('Clothing');
  const [predSpend, setPredSpend] = useState(75);
  const [predFreq, setPredFreq] = useState('Monthly');
  const [predDiscount, setPredDiscount] = useState(true);
  const [predPrev, setPredPrev] = useState(5);
  const [predRating, setPredRating] = useState(4.0);

  const [prediction, setPrediction] = useState(null);

  const handlePredict = () => {
    if (!customers || customers.length === 0) return;

    const inputData = {
      'Age': Number(predAge),
      'Gender': predGender,
      'Category': predCategory,
      'Purchase Amount (USD)': Number(predSpend),
      'Review Rating': Number(predRating),
      'Subscription Status': 'No',
      'Discount Applied': predDiscount ? 'Yes' : 'No',
      'Promo Code Used': predDiscount ? 'Yes' : 'No',
      'Previous Purchases': Number(predPrev),
      'Frequency of Purchases': predFreq
    };

    // Uses customerPredictor.js — Euclidean similarity + feature engineering, zero API
    const result = predictCustomer(inputData, customers);
    setPrediction(result);
  };

  // ==========================================
  // SUB-SECTION 3: Pre-Computed Insights Panel (6 cards)
  // ==========================================
  const computedInsights = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    const total = customers.length;
    // 1. Network Health (Overall Brand Health: pct of non-risk customers)
    const riskCount = customers.filter(c => c.churn_risk).length;
    const healthScore = (((total - riskCount) / total) * 100).toFixed(1);

    // 2. Promo exposure amount
    const promoCustomers = customers.filter(c => c.promo_dependency_score > 0);
    const promoSpendSum = promoCustomers.reduce((acc, c) => acc + c.purchase_amount, 0);

    // 3. Highest opportunity state
    const topState = stats.stateAnalysis?.[0]?.name || 'Kentucky';

    // 4. Largest Tier size
    const tierCounts = Object.keys(stats.tierBreakdown).map(k => ({ name: k, count: stats.tierBreakdown[k] }));
    tierCounts.sort((a, b) => b.count - a.count);
    const topTier = tierCounts[0]?.name || 'Platinum';

    return [
      { title: 'Network Portfolio Health', desc: `${healthScore}% non-risk profiles`, icon: Activity },
      { title: 'Coupon Exposure ($)', desc: `$${Math.round(promoSpendSum).toLocaleString()}`, icon: Ticket },
      { title: 'Top Demand Hub', desc: `${topState} State`, icon: Sparkles },
      { title: 'Fastest-growing Tier', desc: `${topTier} Quartile`, icon: Award },
      { title: 'At Churn Risk Size', desc: `${riskCount} Profiles`, icon: AlertTriangle },
      { title: 'Acquisition Goal', desc: `Target ${stats.idealProfile.preferredCategory} shoppers in ${stats.idealProfile.topStates}`, icon: Brain }
    ];
  }, [customers, stats]);

  // ==========================================
  // SUB-SECTION 4: Retention Email Templates
  // ==========================================
  const [selectedEmailSegment, setSelectedEmailSegment] = useState('Promo Trappers');

  // Uses emailTemplates.js — live token injection, zero API
  const activeEmail = useMemo(() => {
    if (!customers || customers.length === 0) return { subject: '', body: '' };
    return getEmailTemplate(selectedEmailSegment, customers) || { subject: '', body: '' };
  }, [selectedEmailSegment, customers]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${activeEmail.subject}\n\n${activeEmail.body}`);
    alert('Email copied to clipboard!');
  };

  const handleDownloadEmail = () => {
    const content = `Subject: ${activeEmail.subject}\n\n${activeEmail.body}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEmailSegment}_template.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          ✦ AI Intelligence Centre
        </h1>
        <p className="text-sm text-text-secondary">
          Pre-computed insights + embedded ML — zero API calls
        </p>
      </div>

      {/* Main Grid: Chat Assistant & Profile Predictor */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sub-section 1 — AI Chat Assistant */}
        <div className="premium-card p-6 flex flex-col justify-between" style={{ height: '420px' }}>
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Cognitive Assistant</h3>
            <p className="text-xs text-text-secondary mb-4">Pure client-side matching of customer statistics</p>

            {/* Chat Panel */}
            <div className="bg-bg border border-border rounded-xl p-4 flex flex-col gap-3 h-52 overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={msg.sender === 'user' ? 'ai-message-user p-2.5 w-fit max-w-[80%] ml-auto text-xs' : 'ai-message-bot p-2.5 w-fit max-w-[85%] text-xs'}
                  style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              ))}
              {isTyping && <span className="text-xs text-text-secondary italic">Typing stream...</span>}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Presets */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-[10px]">
              {SUGGESTED_PROMPTS.slice(0, 4).map((pill, pIdx) => (
                <div 
                  key={pIdx}
                  onClick={() => handleSend(pill)}
                  className="px-2.5 py-1 bg-bg-2 border border-border rounded-full cursor-pointer hover:bg-gold-light"
                >
                  {pill}
                </div>
              ))}
            </div>
            {/* Input box */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask agent details..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="form-input text-xs"
                style={{ borderRadius: '6px', padding: '8px 12px' }}
              />
              <div onClick={() => handleSend()} className="btn-primary p-2 flex items-center justify-center">
                <Send size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Sub-section 2 — Customer Profile Predictor */}
        <div className="premium-card p-6 flex flex-col justify-between" style={{ height: '420px' }}>
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Cognitive Customer Predictor</h3>
            <p className="text-xs text-text-secondary mb-4">Run featureEngineering.js on new client parameters</p>

            {/* Inputs grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Age ({predAge})</span>
                <input type="range" min="18" max="80" value={predAge} onChange={(e) => setPredAge(e.target.value)} className="w-full mt-1" />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Gender</span>
                <select value={predGender} onChange={(e) => setPredGender(e.target.value)} className="form-input p-1 mt-1 text-xs">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Category</span>
                <select value={predCategory} onChange={(e) => setPredCategory(e.target.value)} className="form-input p-1 mt-1 text-xs">
                  <option value="Clothing">Clothing</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Ticket Spend (${predSpend})</span>
                <input type="range" min="10" max="150" value={predSpend} onChange={(e) => setPredSpend(e.target.value)} className="w-full mt-1" />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Frequency</span>
                <select value={predFreq} onChange={(e) => setPredFreq(e.target.value)} className="form-input p-1 mt-1 text-xs">
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-semibold text-text-muted">Uses Discount?</span>
                <div 
                  onClick={() => setPredDiscount(!predDiscount)}
                  className={`mt-1 py-1 text-center font-bold border rounded cursor-pointer ${
                    predDiscount ? 'bg-gold-light text-burgundy border-gold' : 'bg-bg text-text-secondary border-border'
                  }`}
                >
                  {predDiscount ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Orders history ({predPrev})</span>
                <input type="range" min="0" max="50" value={predPrev} onChange={(e) => setPredPrev(e.target.value)} className="w-full mt-1" />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-text-muted">Rating (★ {predRating})</span>
                <input type="range" min="1.0" max="5.0" step="0.1" value={predRating} onChange={(e) => setPredRating(e.target.value)} className="w-full mt-1" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {prediction && (
              <div className="flex flex-col gap-1.5 p-2.5 bg-gold-light border border-gold/40 rounded-lg text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-burgundy block">Value Tier</span>
                    <strong style={{ color: getTierColor(prediction.value_tier) }}>{prediction.value_tier}</strong>
                    {' '}· {prediction.percentile}th percentile
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-semibold text-text-secondary block">Loyalty</span>
                    <strong>{prediction.loyalty_score}%</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-semibold text-text-secondary block">Churn Risk</span>
                    <strong className={prediction.churn_risk ? 'text-danger' : 'text-success'}>
                      {prediction.churn_risk ? 'High' : 'Low'}
                    </strong>
                  </div>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal border-t border-gold/30 pt-1">
                  {prediction.reasoning}
                </p>
                <p className="text-[10px] font-semibold text-burgundy">
                  ✦ {prediction.recommended_action}
                </p>
              </div>
            )}
            <div onClick={handlePredict} className="btn-primary w-full text-center">
              Predict Customer Value Tier
            </div>
          </div>
        </div>
      </div>

      {/* Sub-section 3 — Pre-Computed Insights Panel (6 cards) */}
      <div className="flex flex-col gap-4">
        <h3 className="heading-serif text-lg font-semibold text-text-primary">Cognitive Synthesis Dashboard Insights</h3>
        <div className="grid grid-cols-6 gap-4">
          {computedInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div key={idx} className="premium-card p-4 flex flex-col justify-between" style={{ minHeight: '110px' }}>
                <div style={{ color: 'var(--burgundy)' }}>
                  <Icon size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider block">{insight.title}</span>
                  <strong className="text-xs text-text-primary block mt-1">{insight.desc}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-section 4 — Retention Email Templates */}
      <div className="premium-card p-6 flex flex-col gap-4">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-text-primary">Personalized Email Campaign Templates</h3>
          <p className="text-xs text-text-secondary">Pre-written outreach campaigns dynamically injecting personalization tokens</p>
        </div>

        {/* Selector pills */}
        <div className="flex gap-2 flex-wrap">
          {EMAIL_SEGMENTS.map(seg => (
            <div
              key={seg}
              onClick={() => setSelectedEmailSegment(seg)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer border transition-all duration-200 ${
                selectedEmailSegment === seg 
                  ? 'bg-burgundy text-[#ffffff] border-burgundy' 
                  : 'bg-card text-text-secondary border-border hover:bg-bg-2'
              }`}
            >
              {seg}
            </div>
          ))}
        </div>

        {/* Template display */}
        <div className="bg-bg border border-border p-4 rounded-xl flex flex-col gap-3">
          <div className="text-xs">
            <strong>Subject:</strong> {activeEmail.subject}
          </div>
          <pre className="text-xs whitespace-pre-wrap leading-normal font-sans border-t border-border pt-3">
            {activeEmail.body}
          </pre>
          <div className="flex gap-2 mt-2 justify-end">
            <div onClick={handleCopyEmail} className="btn-ghost flex items-center gap-1.5 py-2 text-xs">
              <Clipboard size={14} /> Copy to Clipboard
            </div>
            <div onClick={handleDownloadEmail} className="btn-primary flex items-center gap-1.5 py-2 text-xs">
              <FileText size={14} /> Download as TXT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
