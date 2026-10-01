import React from 'react';
import { useAuth } from '../context/AuthContext';
import { IconMenu, IconSearch, IconWallet, IconUser, IconLogout } from './Icons';

const Navbar = ({
  currentTab,
  onOpenMobile,
  globalSearch,
  setGlobalSearch,
  onPerformSearch
}) => {
  const { user, logout } = useAuth();

  const titleMap = {
    dashboard: 'Dashboard Overview',
    trades: 'Trade Journal',
    'add-trade': 'Record New Trade',
    backtesting: 'Backtesting Laboratory',
    'backtesting-details': 'Backtesting Session Review',
    strategies: 'Strategy Playbook',
    analytics: 'Performance Analytics',
    calendar: 'Trading Calendar',
    settings: 'Account & Preferences',
    'trade-details': 'Trade Review & Breakdown'
  };

  const currentBalance = user?.current_balance !== undefined
    ? Number(user.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '10,000.00';

  const currency = user?.currency || 'USD';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onPerformSearch) {
      onPerformSearch(globalSearch);
    }
  };

  return (
    <header className="h-16 bg-[#0d121c]/95 backdrop-blur-md border-b border-[#1f293d] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#151c2b] focus:outline-none"
        >
          <IconMenu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white capitalize">
          {titleMap[currentTab] || 'Forex Trading Journal'}
        </h1>
      </div>

      {/* Middle: Search input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search pair, setup, mistake, notes..."
            value={globalSearch || ''}
            onChange={(e) => setGlobalSearch && setGlobalSearch(e.target.value)}
            className="w-full bg-[#111723] border border-[#1f293d] rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </form>
      </div>

      {/* Right: Account Balance & Profile & Logout */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Account balance chip */}
        <div className="flex items-center space-x-2 bg-[#111723] border border-[#1f293d] px-3 py-1.5 rounded-lg">
          <IconWallet className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Balance
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-100">
              ${currentBalance} <span className="text-[10px] text-slate-400">{currency}</span>
            </span>
          </div>
        </div>

        {/* User profile button */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#1f293d]">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <span className="block text-xs font-medium text-slate-200 truncate max-w-[120px]">
              {user?.name || 'Trader'}
            </span>
            <span className="block text-[10px] text-slate-500 truncate max-w-[120px]">
              {user?.email || 'trader@fx.com'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Log out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <IconLogout className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
