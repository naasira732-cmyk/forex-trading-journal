import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { IconPlus, IconEye, IconEdit, IconTrash, IconStrategy } from '../components/Icons';

const Strategies = ({ onSelectTrade }) => {
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active viewed strategy (with its associated trades)
  const [viewingStrategy, setViewingStrategy] = useState(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    name: '',
    description: '',
    entry_rules: '',
    exit_rules: '',
    risk_rules: '',
    timeframes: '15M, 1H',
    sessions: 'London, New York',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchStrategies = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStrategies();
      if (res.success) setStrategies(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch strategies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleOpenCreate = () => {
    setEditingStrategy(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (strat) => {
    setEditingStrategy(strat);
    setFormData({
      name: strat.name || '',
      description: strat.description || '',
      entry_rules: strat.entry_rules || '',
      exit_rules: strat.exit_rules || '',
      risk_rules: strat.risk_rules || '',
      timeframes: strat.timeframes || '',
      sessions: strat.sessions || '',
      notes: strat.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleViewStrategy = async (strat) => {
    setIsLoadingTrades(true);
    try {
      const res = await api.getStrategyById(strat.id);
      if (res.success) {
        setViewingStrategy(res.data);
      }
    } catch (err) {
      alert(`Failed to load strategy details: ${err.message}`);
    } finally {
      setIsLoadingTrades(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      if (editingStrategy) {
        await api.updateStrategy(editingStrategy.id, formData);
      } else {
        await api.createStrategy(formData);
      }
      setIsModalOpen(false);
      await fetchStrategies();
      if (viewingStrategy && editingStrategy && viewingStrategy.id === editingStrategy.id) {
        await handleViewStrategy(editingStrategy);
      }
    } catch (err) {
      alert(`Failed to save strategy: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!strategyToDelete) return;
    try {
      await api.deleteStrategy(strategyToDelete.id);
      setStrategyToDelete(null);
      if (viewingStrategy?.id === strategyToDelete.id) {
        setViewingStrategy(null);
      }
      await fetchStrategies();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Strategy Playbook</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define, codify, and measure edge metrics for each setup in your arsenal.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          <span>New Strategy</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading strategies from database...</p>
        </div>
      ) : strategies.length === 0 ? (
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <IconStrategy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No strategies created yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Add your favorite trading setups (e.g. Liquidity Sweep, FVG, Order Block, Trend Breakout)
            and attach trades to evaluate their true expectancy.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
          >
            Create First Strategy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strat) => {
            const isSelected = viewingStrategy?.id === strat.id;
            return (
              <div
                key={strat.id}
                className={`bg-[#111723] border rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-[#1f293d] hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-bold text-white tracking-tight">{strat.name}</h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(strat)}
                        title="Edit Strategy"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStrategyToDelete(strat)}
                        title="Delete Strategy"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                    {strat.description || <span className="text-slate-500 italic">No description provided.</span>}
                  </p>

                  <div className="space-y-1.5 text-[11px] text-slate-400 mb-4">
                    {strat.timeframes && (
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Timeframes:</span>
                        <span className="text-slate-200 font-mono">{strat.timeframes}</span>
                      </div>
                    )}
                    {strat.sessions && (
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Sessions:</span>
                        <span className="text-slate-200">{strat.sessions}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantitative Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0a0d14] rounded-xl p-3 border border-[#182133] mb-4 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Trades</span>
                      <span className="text-xs font-bold text-slate-200">{strat.total_trades}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Win Rate</span>
                      <span className={`text-xs font-bold ${strat.win_rate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {strat.win_rate}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Net Profit</span>
                      <span className={`text-xs font-bold ${strat.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {strat.net_profit >= 0 ? `+$${strat.net_profit}` : `-$${Math.abs(strat.net_profit)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleViewStrategy(strat)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#1a2336] hover:bg-[#232f48] text-slate-200 border-[#2b3952]'
                  }`}
                >
                  <IconEye className="w-4 h-4" />
                  <span>{isSelected ? 'Viewing Rules & Trades' : 'View Rules & Trades'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Strategy Deep Dive: Rules & Associated Trades */}
      {viewingStrategy && (
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1f293d] gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strategy Details</span>
              <h3 className="text-lg font-bold text-white">{viewingStrategy.name}</h3>
            </div>
            <button
              onClick={() => setViewingStrategy(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕ Close Detail View
            </button>
          </div>

          {/* Strategy Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0d14] border border-[#182133] rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center space-x-1.5">
                <span>Entry Rules</span>
              </h4>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {viewingStrategy.entry_rules || <span className="text-slate-500 italic">No entry rules codified.</span>}
              </p>
            </div>

            <div className="bg-[#0a0d14] border border-[#182133] rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1.5">
                <span>Exit Rules</span>
              </h4>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {viewingStrategy.exit_rules || <span className="text-slate-500 italic">No exit rules codified.</span>}
              </p>
            </div>

            <div className="bg-[#0a0d14] border border-[#182133] rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center space-x-1.5">
                <span>Risk Management Rules</span>
              </h4>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {viewingStrategy.risk_rules || <span className="text-slate-500 italic">No risk parameters codified.</span>}
              </p>
            </div>
          </div>

          {/* Associated Trades Section */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Trades Associated with {viewingStrategy.name} ({viewingStrategy.trades?.length || 0})
            </h4>

            {viewingStrategy.trades?.length === 0 ? (
              <div className="p-8 text-center bg-[#0a0d14] rounded-xl border border-[#182133] text-slate-500 text-xs">
                No closed trades logged under this strategy yet.
              </div>
            ) : (
              <div className="overflow-x-auto bg-[#0a0d14] rounded-xl border border-[#182133]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#182133] text-[10px] uppercase font-bold text-slate-400 bg-[#0e1420]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Pair</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Timeframe</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3 text-right">Profit / Loss</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182133] font-mono">
                    {viewingStrategy.trades.map((t) => {
                      const pnl = Number(t.profit_loss);
                      return (
                        <tr key={t.id} className="hover:bg-[#121927]">
                          <td className="py-2.5 px-3 text-slate-500">#{t.id}</td>
                          <td className="py-2.5 px-3 text-slate-300">{String(t.trade_date).substring(0, 10)}</td>
                          <td className="py-2.5 px-3 text-white font-bold">{t.pair}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{t.timeframe}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.result === 'WIN' ? 'text-emerald-400' : t.result === 'LOSS' ? 'text-rose-400' : 'text-slate-400'}`}>
                              {t.result}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            <span className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => onSelectTrade && onSelectTrade(t)}
                              className="text-xs text-slate-400 hover:text-emerald-400 font-sans font-semibold underline"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111723] border border-[#1f293d] rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingStrategy ? 'Edit Strategy Playbook' : 'New Strategy Entry'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Formulate precise execution, exit, and risk management parameters.
            </p>

            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Strategy Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Liquidity Sweep + 15M FVG"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Core Edge</label>
                <textarea
                  name="description"
                  rows="2"
                  placeholder="The theoretical and institutional basis behind this trade setup..."
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">Entry Rules</label>
                <textarea
                  name="entry_rules"
                  rows="3"
                  placeholder="1. Sweep of session high/low&#10;2. Displacement creating FVG&#10;3. Market structure shift..."
                  value={formData.entry_rules}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">Exit Rules</label>
                <textarea
                  name="exit_rules"
                  rows="3"
                  placeholder="Take profit targets, trailing stop protocols, breakeven trigger rules..."
                  value={formData.exit_rules}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1">Risk Rules</label>
                <textarea
                  name="risk_rules"
                  rows="2"
                  placeholder="Max 1% risk per trade, avoid trading before high impact news..."
                  value={formData.risk_rules}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Suitable Timeframes</label>
                  <input
                    type="text"
                    name="timeframes"
                    placeholder="15M, 1H"
                    value={formData.timeframes}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Suitable Sessions</label>
                  <input
                    type="text"
                    name="sessions"
                    placeholder="London, New York"
                    value={formData.sessions}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Pairs with best win rate, seasonal tendencies..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1a2336] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  {isSaving ? 'Saving...' : 'Save Strategy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!strategyToDelete}
        title="Delete Strategy"
        message={`Are you sure you want to delete "${strategyToDelete?.name}"? Trades linked to this strategy will be preserved with discretionary status.`}
        onConfirm={handleDelete}
        onCancel={() => setStrategyToDelete(null)}
        isDanger={true}
      />
    </div>
  );
};

export default Strategies;
