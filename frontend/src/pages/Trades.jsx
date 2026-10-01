import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FilterBar from '../components/FilterBar';
import TradeTable from '../components/TradeTable';
import ConfirmModal from '../components/ConfirmModal';
import { IconPlus } from '../components/Icons';

const Trades = ({ onNavigate, onSelectTrade, externalSearch }) => {
  const { refreshUser } = useAuth();
  const [trades, setTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialFilters = {
    search: externalSearch || '',
    pair: '',
    direction: '',
    strategy_id: '',
    session: '',
    timeframe: '',
    result: '',
    startDate: '',
    endDate: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  // Sync external search from navbar
  useEffect(() => {
    if (externalSearch !== undefined && externalSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: externalSearch }));
    }
  }, [externalSearch]);

  // Modal deletion state
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch strategies for filter dropdown
  useEffect(() => {
    api.getStrategies()
      .then(res => {
        if (res.success) setStrategies(res.data);
      })
      .catch(console.error);
  }, []);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTrades(filters);
      if (res.success) {
        setTrades(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch trades.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleDeleteConfirm = async () => {
    if (!tradeToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTrade(tradeToDelete.id);
      setTradeToDelete(null);
      await fetchTrades();
      await refreshUser(); // updates navbar balance!
    } catch (err) {
      alert(`Failed to delete trade: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered summary calculations
  const totalCount = trades.length;
  const winsCount = trades.filter(t => t.result === 'WIN').length;
  const lossesCount = trades.filter(t => t.result === 'LOSS').length;
  const netPnl = trades.reduce((acc, t) => acc + Number(t.profit_loss), 0);
  const winRate = totalCount > 0 ? Math.round((winsCount / totalCount) * 1000) / 10 : 0;

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trade Journal Records</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log, filter, and audit every execution with complete trade details and psychology.
          </p>
        </div>

        <button
          onClick={() => onNavigate('add-trade')}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          <span>Record Trade</span>
        </button>
      </div>

      {/* Quick summary chips of filtered view */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111723] border border-[#1f293d] rounded-xl p-3 text-xs font-mono">
          <div className="text-center sm:text-left">
            <span className="text-slate-500 text-[10px] block uppercase">Matches</span>
            <span className="font-bold text-white">{totalCount} Trades</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-slate-500 text-[10px] block uppercase">Win Rate</span>
            <span className={`font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {winRate}% ({winsCount}W / {lossesCount}L)
            </span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-slate-500 text-[10px] block uppercase">Filtered Net P/L</span>
            <span className={`font-bold ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPnl >= 0 ? `+$${netPnl.toFixed(2)}` : `-$${Math.abs(netPnl).toFixed(2)}`}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-slate-500 text-[10px] block uppercase">Avg Trade</span>
            <span className="font-bold text-slate-300">
              ${(netPnl / totalCount).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Filter Component */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        strategies={strategies}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Trades Table */}
      <TradeTable
        trades={trades}
        isLoading={isLoading}
        onView={(trade) => onSelectTrade(trade)}
        onEdit={(trade) => onNavigate('add-trade', trade)}
        onDelete={(trade) => setTradeToDelete(trade)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!tradeToDelete}
        title="Delete Trade Entry"
        message={`Are you sure you want to delete Trade #${tradeToDelete?.id} (${tradeToDelete?.pair} on ${tradeToDelete?.trade_date ? String(tradeToDelete.trade_date).substring(0, 10) : ''})? This will update your equity curve and account statistics immediately.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Trade'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTradeToDelete(null)}
        isDanger={true}
      />
    </div>
  );
};

export default Trades;
