import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import AddTrade from './pages/AddTrade';
import TradeDetails from './pages/TradeDetails';
import Backtesting from './pages/Backtesting';
import BacktestingDetails from './pages/BacktestingDetails';
import Strategies from './pages/Strategies';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Navigation state
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Cross-page state transfers
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
          Loading Forex Journal Desk...
        </p>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    if (authMode === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <Login onSwitchToSignup={() => setAuthMode('signup')} />;
  }

  // Navigation handler
  const handleNavigate = (tab, payload = null) => {
    if (tab === 'add-trade') {
      setEditingTrade(payload);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTrade = (trade) => {
    setSelectedTrade(trade);
    setCurrentTab('trade-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentTab('backtesting-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (term) => {
    setGlobalSearch(term);
    setCurrentTab('trades');
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main content wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Navbar
          currentTab={currentTab}
          onOpenMobile={() => setIsMobileOpen(true)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onPerformSearch={handleGlobalSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onSelectTrade={handleSelectTrade}
            />
          )}

          {currentTab === 'trades' && (
            <Trades
              onNavigate={handleNavigate}
              onSelectTrade={handleSelectTrade}
              externalSearch={globalSearch}
            />
          )}

          {currentTab === 'add-trade' && (
            <AddTrade
              editingTrade={editingTrade}
              onComplete={() => {
                setEditingTrade(null);
                setCurrentTab('trades');
              }}
              onCancel={() => {
                setEditingTrade(null);
                setCurrentTab('trades');
              }}
            />
          )}

          {currentTab === 'trade-details' && (
            <TradeDetails
              tradeId={selectedTrade?.id}
              initialTrade={selectedTrade}
              onBack={() => setCurrentTab('trades')}
              onEdit={(trade) => handleNavigate('add-trade', trade)}
            />
          )}

          {currentTab === 'backtesting' && (
            <Backtesting
              onSelectSession={handleSelectSession}
            />
          )}

          {currentTab === 'backtesting-details' && (
            <BacktestingDetails
              sessionId={selectedSessionId}
              onBack={() => setCurrentTab('backtesting')}
            />
          )}

          {currentTab === 'strategies' && (
            <Strategies
              onSelectTrade={handleSelectTrade}
            />
          )}

          {currentTab === 'analytics' && (
            <Analytics />
          )}

          {currentTab === 'calendar' && (
            <Calendar
              onSelectTrade={handleSelectTrade}
            />
          )}

          {currentTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
