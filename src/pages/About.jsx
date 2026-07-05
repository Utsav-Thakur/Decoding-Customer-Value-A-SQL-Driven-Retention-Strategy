import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { BookOpen, Server, Globe, Code, User } from 'lucide-react';

export default function About() {
  const { customers } = useData();

  const stats = useMemo(() => {
    return computeStats(customers);
  }, [customers]);

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
          Methodology &amp; Technology Stack
        </h1>
        <p className="text-sm text-text-secondary">
          Detailed project synopsis, database methodology, and cognitive features logic
        </p>
      </div>

      {/* Grid: Project Summary & Stats */}
      <div className="grid grid-cols-3 gap-6">
        {/* Project Summary */}
        <div className="premium-card p-6 col-span-2 flex flex-col gap-4">
          <h3 className="heading-serif text-lg font-semibold text-text-primary">Executive Summary</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            BrandIQ Customer Intelligence Platform is developed specifically for a high-end luxury D2C fashion brand. 
            The database comprises <strong>{stats.totalCustomers.toLocaleString()}</strong> customer records containing detailed transactional parameters. 
            By mapping purchasing behaviors to localized indicators, BrandIQ allows marketing teams to evaluate margins, optimize promotional strategies, and design custom outreach campaigns.
          </p>
          <div className="p-3.5 bg-bg-2 rounded-xl border border-border flex gap-3 text-xs leading-normal">
            <BookOpen size={20} className="text-burgundy flex-shrink-0" />
            <div>
              <strong>Privacy and Performance Rules:</strong> To ensure high security, customer data is held entirely in-memory inside React Context. No local or session browser storage APIs are used, allowing immediate data refreshes.
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-burgundy">Database Status</h3>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mt-0.5">Live Metrics Snapshot</p>
            <div className="h-0.5 w-full bg-border my-3" />
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span>Record Count:</span>
                <strong>{stats.totalCustomers.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Average AOV:</span>
                <strong>${stats.avgPurchase}</strong>
              </div>
              <div className="flex justify-between">
                <span>Subscriber Rate:</span>
                <strong>{stats.subscriberRate}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Promo Users:</span>
                <strong>{stats.promoRate}%</strong>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-text-secondary bg-bg-2 p-2 rounded text-center">
            Database Sync State: Active
          </div>
        </div>
      </div>

      {/* How the AI works (3 sections) */}
      <div className="flex flex-col gap-4">
        <h3 className="heading-serif text-xl font-semibold text-text-primary">How the AI Engine Works</h3>
        <div className="grid grid-cols-3 gap-6">
          {/* Section 1 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <h4 className="heading-serif text-base font-bold text-burgundy">1. Rule-Based Answers</h4>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              The AI Cognitive terminal analyzes user inputs client-side, matching queries to pre-computed reports (e.g. ideal profiles, promo traps, state opportunities). This guarantees zero API costs and instant replies.
            </p>
          </div>

          {/* Section 2 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <h4 className="heading-serif text-base font-bold text-gold">2. Live Feature Engineering</h4>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              Data cleaning and feature engineering equations (originally built in Python and Pandas) are compiled into pure JavaScript. Uploading or manually creating customer profiles runs feature calculations instantly.
            </p>
          </div>

          {/* Section 3 */}
          <div className="premium-card p-5 flex flex-col gap-2">
            <h4 className="heading-serif text-base font-bold text-text-secondary">3. Template Integration</h4>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              The platform utilizes pre-written marketing outreach templates designed for specific target groups. Re-engagement and sunset copy dynamically pulls and replaces tokens (e.g. counts, top category, spends) live from context.
            </p>
          </div>
        </div>
      </div>

      {/* Tech stack & bio */}
      <div className="premium-card p-6 flex justify-between items-center bg-bg-2 border-border">
        <div className="flex flex-col gap-1">
          <h4 className="heading-serif text-base font-bold text-text-primary">Technology Architecture</h4>
          <p className="text-xs text-text-secondary">
            Python · Pandas · Jupyter Notebook · SQL (SQLite) · React · Recharts · Tailwind CSS · Playfair Display
          </p>
        </div>
        
        {/* Creator Profile */}
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="text-xs">
            <span className="text-text-muted">Developed by:</span> <strong className="text-burgundy">Utsav Kumar Thakur</strong>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://github.com/Utsav-Thakur" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 bg-card border border-border rounded-full text-burgundy hover:bg-gold-light flex items-center justify-center"
              style={{ width: '28px', height: '28px' }}
            >
              <Code size={14} />
            </a>
            <a 
              href="https://www.linkedin.com/in/utsav-thakur-2b01871b7" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 bg-card border border-border rounded-full text-burgundy hover:bg-gold-light flex items-center justify-center"
              style={{ width: '28px', height: '28px' }}
            >
              <User size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
