import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Jarvis from './components/ai/Jarvis';

// Pages
import Landing from './pages/Landing';
import CustomerPyramid from './pages/CustomerPyramid';
import PromoAnalysis from './pages/PromoAnalysis';
import GeographicMap from './pages/GeographicMap';
import CategoryFunnel from './pages/CategoryFunnel';
import RetentionPlaybook from './pages/RetentionPlaybook';
import IdealProfile from './pages/IdealProfile';
import AICenter from './pages/AICenter';
import NewData from './pages/NewData';
import About from './pages/About';
import CustomerDirectory from './pages/CustomerDirectory';

// Initialize React Query client
const queryClient = new QueryClient();

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <Landing setActiveTab={setActiveTab} />;
      case 'pyramid':
        return <CustomerPyramid />;
      case 'promo':
        return <PromoAnalysis />;
      case 'geographic':
        return <GeographicMap />;
      case 'funnel':
        return <CategoryFunnel />;
      case 'playbook':
        return <RetentionPlaybook />;
      case 'ideal':
        return <IdealProfile />;
      case 'ai-center':
        return <AICenter />;
      case 'new-data':
        return <NewData />;
      case 'directory':
        return <CustomerDirectory />;
      case 'about':
        return <About />;
      default:
        return <Landing setActiveTab={setActiveTab} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <div className="app-container">
          {/* Sidebar Left Navigation */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Dashboard Panel */}
          <div className="content-container" style={{ padding: activeTab === 'landing' ? '0' : '40px' }}>
            {renderContent()}
          </div>

          {/* JARVIS — Customer Intelligence Assistant */}
          <Jarvis />
        </div>
      </DataProvider>
    </QueryClientProvider>
  );
}
