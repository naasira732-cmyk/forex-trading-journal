import React, { useState } from 'react';
import { IconFilter, IconSearch, IconClose } from './Icons';

const FilterBar = ({
  filters,
  setFilters,
  strategies = [],
  onApply,
  onReset
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD',
    'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'
  ];

  const sessions = ['London', 'New York', 'Asian', 'Sydney', 'Other'];
  const timeframes = ['1M', '5M', '15M', '30M', '1H', '4H', 'Daily', 'Weekly'];
  const results = ['WIN', 'LOSS', 'BREAK EVEN'];

  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="bg-[#111723] border border-[#1f293d] rounded-xl p-4 mb-6 shadow-sm">
      {/* Primary search & quick toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by pair, strategy, setup notes, mistakes..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {filters.search && (
            <button
              onClick={() => handleChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <IconClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              isExpanded || hasActiveFilters
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[#151c2b] border-[#1f293d] text-slate-300 hover:bg-[#1a2336]'
            }`}
          >
            <IconFilter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Drawer */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#1f293d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
          {/* Pair */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Currency Pair
            </label>
            <select
              value={filters.pair || ''}
              onChange={(e) => handleChange('pair', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Pairs</option>
              {pairs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Direction
            </label>
            <select
              value={filters.direction || ''}
              onChange={(e) => handleChange('direction', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Directions</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Strategy
            </label>
            <select
              value={filters.strategy_id || ''}
              onChange={(e) => handleChange('strategy_id', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Strategies</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Result */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Result
            </label>
            <select
              value={filters.result || ''}
              onChange={(e) => handleChange('result', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Results</option>
              {results.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Trading Session
            </label>
            <select
              value={filters.session || ''}
              onChange={(e) => handleChange('session', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Sessions</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Timeframe
            </label>
            <select
              value={filters.timeframe || ''}
              onChange={(e) => handleChange('timeframe', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Timeframes</option>
              {timeframes.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
            </input>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
            </input>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
