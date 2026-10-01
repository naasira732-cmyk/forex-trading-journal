import React from 'react';
import {
  IconDashboard,
  IconJournal,
  IconPlus,
  IconBacktest,
  IconStrategy,
  IconAnalytics,
  IconCalendar,
  IconSettings,
  IconClose
} from './Icons';

const Sidebar = ({ currentTab, setCurrentTab, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'trades', label: 'Trade Journal', icon: IconJournal },
    { id: 'add-trade', label: 'Add Trade', icon: IconPlus },
    { id: 'backtesting', label: 'Backtesting', icon: IconBacktest },
    { id: 'strategies', label: 'Strategies', icon: IconStrategy },
    { id: 'analytics', label: 'Analytics', icon: IconAnalytics },
    { id: 'calendar', label: 'Calendar', icon: IconCalendar },
    { id: 'settings', label: 'Settings', icon: IconSettings }
  ];

  const handleSelect = (id) => {
    setCurrentTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d121c] border-r border-[#1f293d] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1f293d]">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleSelect('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
              FX
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">NaasirFx</span>
              <span className="text-[10px] block text-emerald-400 font-mono tracking-wider uppercase font-semibold"></span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileOpen(false)}
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Trading Desk
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:bg-[#141b29] hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'add-trade' && (
                  <span className="ml-auto text-[10px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Trading session indicator */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-[#111723] border border-[#1f293d]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Market Sessions</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-[11px] space-y-1 font-mono text-slate-400">
            <div className="flex justify-between">
              <span>London</span>
              <span className="text-emerald-400">Open</span>
            </div>
            <div className="flex justify-between">
              <span>New York</span>
              <span className="text-amber-400">Upcoming</span>
            </div>
            <div className="flex justify-between">
              <span>Tokyo / Asian</span>
              <span className="text-slate-500">Closed</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
