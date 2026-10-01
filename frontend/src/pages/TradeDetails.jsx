import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { IconEdit, IconTrash } from '../components/Icons';

const TradeDetails = ({ tradeId, initialTrade, onBack, onEdit }) => {
  const { refreshUser } = useAuth();
  const [trade, setTrade] = useState(initialTrade || null);
  const [isLoading, setIsLoading] = useState(!initialTrade);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (tradeId) {
      setIsLoading(true);
      api.getTradeById(tradeId)
        .then(res => {
          if (res.success) setTrade(res.data);
        })
        .catch(err => setError(err.message || 'Failed to load trade.'))
        .finally(() => setIsLoading(false));
    }
  }, [tradeId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteTrade(trade.id);
      await refreshUser();
      setIsDeleteModalOpen(false);
      onBack();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-400">Loading trade report...</p>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="p-6 bg-[#111723] border border-[#1f293d] rounded-xl text-center">
        <p className="text-rose-400 text-sm font-semibold mb-3">{error || 'Trade not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#1a2336] text-slate-200 rounded-lg text-xs font-semibold"
        >
          &larr; Back to Journal
        </button>
      </div>
    );
  }

  const pnl = Number(trade.profit_loss);
  const isWin = trade.result === 'WIN' || pnl > 0;
  const isLoss = trade.result === 'LOSS' || pnl < 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>&larr;</span>
          <span>Back to Journal</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(trade)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1a2336] hover:bg-[#232f48] text-slate-200 text-xs font-semibold border border-[#2b3952] transition-colors"
          >
            <IconEdit className="w-4 h-4 text-emerald-400" />
            <span>Edit Trade</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <IconTrash className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Trade Header Card */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#1f293d] gap-4">
          <div className="flex items-center space-x-4">
            <span
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                trade.direction === 'BUY'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trade.direction}
            </span>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-2xl font-bold font-mono text-white tracking-tight">
                  {trade.pair}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Trade #{trade.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {trade.trade_date ? String(trade.trade_date).substring(0, 10) : ''} &bull; {trade.session} Session &bull; {trade.timeframe} Chart
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isWin
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isLoss
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600'
              }`}
            >
              {trade.result}
            </span>
            <div className={`text-2xl font-bold font-mono tracking-tight ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
              {pnl > 0 ? `+$${pnl.toFixed(2)}` : pnl < 0 ? `-$${Math.abs(pnl).toFixed(2)}` : '$0.00'}
            </div>
          </div>
        </div>

        {/* Execution Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-6 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Entry Price</span>
            <span className="font-bold text-slate-100 text-sm">
              {Number(trade.entry_price).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Stop Loss</span>
            <span className="font-bold text-rose-400 text-sm">
              {Number(trade.stop_loss).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Take Profit</span>
            <span className="font-bold text-emerald-400 text-sm">
              {Number(trade.take_profit).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Exit Price</span>
            <span className="font-bold text-slate-200 text-sm">
              {trade.exit_price ? Number(trade.exit_price).toFixed(trade.pair?.includes('JPY') ? 3 : 5) : '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Risk / Reward</span>
            <span className="font-bold text-amber-400 text-sm">
              {trade.risk_reward || '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Risk / Lot</span>
            <span className="font-bold text-slate-200 text-sm">
              {trade.risk_percentage ? `${trade.risk_percentage}%` : '—'} {trade.lot_size ? `(${trade.lot_size}L)` : ''}
            </span>
          </div>
        </div>
      </div>

      {trade.image_data && (
        <section className="bg-[#111723] border border-[#1f293d] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4">Trade Screenshot</h3>
          <a href={trade.image_data} target="_blank" rel="noreferrer" aria-label="Open trade screenshot in a new tab">
            <img src={trade.image_data} alt={`${trade.pair} trade chart screenshot`} loading="lazy" className="max-h-[680px] w-full rounded-lg border border-[#263247] bg-[#0a0d14] object-contain" />
          </a>
        </section>
      )}

      {/* Section 9: Trade Analysis Questionnaire */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 pb-3 border-b border-[#1f293d]">
          Post-Trade Analysis & Review
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strategy & Context */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                Strategy Applied
              </h4>
              <p className="text-sm font-medium text-slate-200">
                {trade.strategy_name || 'Discretionary / No Strategy'}
              </p>
              {trade.strategy_description && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  {trade.strategy_description}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                What was the setup?
              </h4>
              <div className="bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed min-h-[60px]">
                {trade.setup_description || <span className="text-slate-500 italic">No setup description logged.</span>}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Why did I enter? (Entry Reason)
              </h4>
              <div className="bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed min-h-[60px]">
                {trade.entry_reason || <span className="text-slate-500 italic">No entry rationale logged.</span>}
              </div>
            </div>
          </div>

          {/* Execution & Outcomes */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                What happened? (Exit Reason)
              </h4>
              <div className="bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed min-h-[60px]">
                {trade.exit_reason || <span className="text-slate-500 italic">No exit rationale logged.</span>}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                What mistake did I make?
              </h4>
              <div className="bg-[#0a0d14] border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-200 leading-relaxed min-h-[60px]">
                {trade.mistake || <span className="text-slate-500 italic">No mistake recorded. Execution followed plan.</span>}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                What did I learn? (Lesson Learned)
              </h4>
              <div className="bg-[#0a0d14] border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-200 leading-relaxed min-h-[60px]">
                {trade.lesson_learned || <span className="text-slate-500 italic">No lesson recorded.</span>}
              </div>
            </div>
          </div>
        </div>

        {trade.notes && (
          <div className="pt-4 border-t border-[#1f293d]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Additional Trader Notes
            </h4>
            <div className="bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3.5 text-xs text-slate-300">
              {trade.notes}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Trade Record"
        message={`Are you sure you want to permanently delete Trade #${trade.id}? Your balance and statistics will update automatically.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default TradeDetails;
