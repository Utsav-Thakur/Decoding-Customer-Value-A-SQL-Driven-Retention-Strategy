import React from 'react';
import { useData } from '../context/DataContext';
import { 
  LayoutDashboard, 
  Users, 
  Sliders, 
  MapPin, 
  Filter, 
  BookOpen, 
  UserCheck, 
  BrainCircuit, 
  PlusCircle,
  HelpCircle,
  Table2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { customers } = useData();

  const groups = [
    {
      title: 'Analytics',
      items: [
        { id: 'landing', label: 'Overview', icon: LayoutDashboard },
        { id: 'pyramid', label: 'Customer Pyramid', icon: Users },
        { id: 'directory', label: 'Customer Directory', icon: Table2 },
        { id: 'promo', label: 'Promo Analysis', icon: Sliders },
      ]
    },
    {
      title: 'Strategy',
      items: [
        { id: 'geographic', label: 'Geographic Map', icon: MapPin },
        { id: 'funnel', label: 'Category Funnel', icon: Filter },
        { id: 'playbook', label: 'Retention Playbook', icon: BookOpen },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'ideal', label: 'Ideal Profile', icon: UserCheck },
        { id: 'ai-center', label: 'AI Center', icon: BrainCircuit },
        { id: 'new-data', label: 'New Data', icon: PlusCircle },
        { id: 'about', label: 'About BrandIQ', icon: HelpCircle },
      ]
    }
  ];

  return (
    <div className="sidebar-container flex flex-col justify-between p-4" style={{ borderRight: '1px solid var(--border)' }}>
      {/* Top Brand Block */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2 p-2">
          {/* Logo B monogram in burgundy circle */}
          <div 
            className="flex items-center justify-center" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'var(--burgundy)', 
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '18px',
              fontFamily: "'Playfair Display', serif"
            }}
          >
            B
          </div>
          <div className="flex flex-col">
            <span className="heading-serif font-bold text-burgundy leading-none" style={{ fontSize: '18px' }}>
              BrandIQ
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Intelligence
            </span>
          </div>
        </div>

        {/* Gold divider */}
        <div className="gold-divider mb-4" />

        {/* Nav Links */}
        <div className="flex flex-col gap-4">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col">
              <span 
                className="mb-1 px-2" 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: '600', 
                  color: 'var(--text-muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em' 
                }}
              >
                {group.title}
              </span>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ${
                        isActive ? '' : 'hover:bg-[#fdf5f6] hover:text-[var(--burgundy)]'
                      }`}
                      style={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '500',
                        background: isActive ? 'var(--burgundy)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                        paddingLeft: isActive ? '9px' : '12px'
                      }}
                    >
                      <Icon 
                        size={16} 
                        style={{ 
                          color: isActive ? 'var(--gold)' : 'var(--burgundy)',
                          flexShrink: 0
                        }} 
                      />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Data Counter Card */}
      <div 
        className="p-3" 
        style={{ 
          background: 'var(--bg-2)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)',
          marginTop: 'auto'
        }}
      >
        <div className="flex items-center gap-2">
          {/* Gold dot */}
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: 'var(--gold)',
              boxShadow: '0 0 8px var(--gold)'
            }} 
          />
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Data: {customers.length.toLocaleString()} customers
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Database fully synced
        </div>
      </div>
    </div>
  );
}
