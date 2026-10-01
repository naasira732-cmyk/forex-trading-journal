import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { IconPlus, IconEye, IconTrash, IconEdit, IconBacktest } from '../components/Icons';

const Backtesting = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    pair: 'EUR/USD',
    timeframe: '15M',
    session: 'London',
    strategy_id: '',
    testing_start_date: '',
    testing_end_date: '',
    total_trades: 30,
    wins: 18,
    losses: 10,
    break_even: 2,
    win_rate: '60',
    total_r: '25.0',
    average_r: '0.83',
    starting_balance: '10000',
    ending_balance: '12500',
    max_drawdown: '4.5',
    notes: '',
    review: {
      what_worked: '',
      what_failed: '',
      common_mistakes: '',
      observations: '',
      improvements: '',
      conclusion: ''
    }
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const [sessRes, stratRes] = await Promise.all([
        api.getBacktestingSessions(),
        api.getStrategies()
      ]);
      if (sessRes.success) setSessions(sessRes.data);
      if (stratRes.success) setStrategies(stratRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load backtesting sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenCreate = () => {
    setEditingSession(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (session) => {
    setEditingSession(session);
    try {
      const res = await api.getBacktestingSessionById(session.id);
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          pair: d.pair,
          timeframe: d.timeframe,
          session: d.session || 'London',
          strategy_id: d.strategy_id || '',
          testing_start_date: d.testing_start_date ? String(d.testing_start_date).substring(0, 10) : '',
          testing_end_date: d.testing_end_date ? String(d.testing_end_date).substring(0, 10) : '',
          total_trades: d.total_trades,
          wins: d.wins,
          losses: d.losses,
          break_even: d.break_even,
          win_rate: d.win_rate,
          total_r: d.total_r,
          average_r: d.average_r,
          starting_balance: d.starting_balance,
          ending_balance: d.ending_balance,
          max_drawdown: d.max_drawdown,
          notes: d.notes || '',
          review: d.review || initialForm.review
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      alert(`Error fetching session: ${err.message}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-compute win rate
      if (name === 'total_trades' || name === 'wins') {
        const total = Number(name === 'total_trades' ? value : prev.total_trades);
        const wins = Number(name === 'wins' ? value : prev.wins);
        if (total > 0) {
          updated.win_rate = ((wins / total) * 100).toFixed(1);
        }
      }
      return updated;
    });
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      review: {
        ...prev.review,
        [name]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        strategy_id: formData.strategy_id ? Number(formData.strategy_id) : null,
        total_trades: Number(formData.total_trades),
        wins: Number(formData.wins),
        losses: Number(formData.losses),
        break_even: Number(formData.break_even),
        win_rate: Number(formData.win_rate),
        total_r: Number(formData.total_r),
        average_r: Number(formData.average_r),
        starting_balance: Number(formData.starting_balance),
        ending_balance: Number(formData.ending_balance),
        max_drawdown: Number(formData.max_drawdown)
      };

      if (editingSession) {
        await api.updateBacktestingSession(editingSession.id, payload);
      } else {
        await api.createBacktestingSession(payload);
      }

      setIsModalOpen(false);
      await fetchSessions();
    } catch (err) {
      alert(`Failed to save backtesting session: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await api.deleteBacktestingSession(sessionToDelete.id);
      setSessionToDelete(null);
      await fetchSessions();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Backtesting Laboratory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test and validate strategy expectancy, maximum drawdown, and rules before risking live capital.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          <span>New Backtesting Session</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading historical backtesting records...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <IconBacktest className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No backtesting sessions recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Collect quantitative evidence on historical charts to find your true mathematical edge.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
          >
            Create Your First Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((sess) => {
            const profit = Number(sess.ending_balance) - Number(sess.starting_balance);
            return (
              <div
                key={sess.id}
                className="bg-[#111723] border border-[#1f293d] hover:border-slate-600 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white font-mono text-base">{sess.pair}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {sess.timeframe}
                        </span>
                        {sess.session && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                            {sess.session}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium truncate max-w-[220px]">
                        {sess.strategy_name || <span className="text-slate-500 italic">Discretionary</span>}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(sess)}
                        title="Edit Session"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSessionToDelete(sess)}
                        title="Delete Session"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Testing period */}
                  {(sess.testing_start_date || sess.testing_end_date) && (
                    <div className="text-[11px] text-slate-500 font-mono mb-3">
                      Period: {sess.testing_start_date ? String(sess.testing_start_date).substring(0, 10) : 'Start'} &rarr; {sess.testing_end_date ? String(sess.testing_end_date).substring(0, 10) : 'End'}
                    </div>
                  )}

                  {/* Quantitative Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0a0d14] rounded-xl p-3 border border-[#182133] mb-3 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Trades</span>
                      <span className="text-xs font-bold text-slate-200">{sess.total_trades}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Win Rate</span>
                      <span className={`text-xs font-bold ${Number(sess.win_rate) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {sess.win_rate}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Total R</span>
                      <span className="text-xs font-bold text-amber-400">+{sess.total_r}R</span>
                    </div>
                    <div className="pt-2 border-t border-[#182133]">
                      <span className="block text-[10px] text-slate-500 uppercase">W / L / BE</span>
                      <span className="text-[11px] text-slate-300">{sess.wins} / {sess.losses} / {sess.break_even}</span>
                    </div>
                    <div className="pt-2 border-t border-[#182133]">
                      <span className="block text-[10px] text-slate-500 uppercase">Avg R</span>
                      <span className="text-[11px] text-slate-300">{sess.average_r}R</span>
                    </div>
                    <div className="pt-2 border-t border-[#182133]">
                      <span className="block text-[10px] text-slate-500 uppercase">Max DD</span>
                      <span className="text-[11px] text-rose-400">{sess.max_drawdown}%</span>
                    </div>
                  </div>

                  {sess.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic mb-3">
                      "{sess.notes}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onSelectSession(sess.id)}
                  className="w-full py-2 rounded-lg bg-[#1a2336] hover:bg-[#24314c] text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-[#2b3952]"
                >
                  <IconEye className="w-4 h-4" />
                  <span>View Review & Full Breakdown</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111723] border border-[#1f293d] rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingSession ? 'Edit Backtesting Session' : 'New Backtesting Session'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Record sample size, metrics, and quantitative rules tested.
            </p>

            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pair *</label>
                  <input
                    type="text"
                    name="pair"
                    required
                    value={formData.pair}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Timeframe *</label>
                  <input
                    type="text"
                    name="timeframe"
                    required
                    value={formData.timeframe}
                    onChange={handleFormChange}
                    placeholder="15M"
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Strategy</label>
                  <select
                    name="strategy_id"
                    value={formData.strategy_id}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="">No Strategy</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Session</label>
                  <input
                    type="text"
                    name="session"
                    placeholder="London"
                    value={formData.session}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Testing Start Date</label>
                  <input
                    type="date"
                    name="testing_start_date"
                    value={formData.testing_start_date}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Testing End Date</label>
                  <input
                    type="date"
                    name="testing_end_date"
                    value={formData.testing_end_date}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Total Trades</label>
                  <input
                    type="number"
                    name="total_trades"
                    value={formData.total_trades}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Wins</label>
                  <input
                    type="number"
                    name="wins"
                    value={formData.wins}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Losses</label>
                  <input
                    type="number"
                    name="losses"
                    value={formData.losses}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Break Even</label>
                  <input
                    type="number"
                    name="break_even"
                    value={formData.break_even}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Win Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="win_rate"
                    value={formData.win_rate}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Total R</label>
                  <input
                    type="number"
                    step="0.1"
                    name="total_r"
                    value={formData.total_r}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Average R</label>
                  <input
                    type="number"
                    step="0.01"
                    name="average_r"
                    value={formData.average_r}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max DD (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="max_drawdown"
                    value={formData.max_drawdown}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    name="starting_balance"
                    value={formData.starting_balance}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ending Balance ($)</label>
                  <input
                    type="number"
                    name="ending_balance"
                    value={formData.ending_balance}
                    onChange={handleFormChange}
                    className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">General Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Testing environment, sample assumptions..."
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>

              {/* Review inputs */}
              <div className="pt-3 border-t border-[#1f293d]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Qualitative Strategy Review
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-emerald-400 mb-0.5">What worked?</label>
                    <textarea
                      name="what_worked"
                      rows="2"
                      value={formData.review?.what_worked || ''}
                      onChange={handleReviewChange}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-rose-400 mb-0.5">What failed / Common mistakes?</label>
                    <textarea
                      name="what_failed"
                      rows="2"
                      value={formData.review?.what_failed || ''}
                      onChange={handleReviewChange}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-amber-400 mb-0.5">Improvements & Final Conclusion</label>
                    <textarea
                      name="conclusion"
                      rows="2"
                      value={formData.review?.conclusion || ''}
                      onChange={handleReviewChange}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                </div>
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
                  {isSaving ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!sessionToDelete}
        title="Delete Backtesting Session"
        message={`Are you sure you want to delete session #${sessionToDelete?.id} (${sessionToDelete?.pair} ${sessionToDelete?.timeframe})?`}
        onConfirm={handleDelete}
        onCancel={() => setSessionToDelete(null)}
        isDanger={true}
      />
    </div>
  );
};

export default Backtesting;
