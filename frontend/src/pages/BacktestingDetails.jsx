import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const BacktestingDetails = ({ sessionId, onBack }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [review, setReview] = useState({
    what_worked: '',
    what_failed: '',
    common_mistakes: '',
    observations: '',
    improvements: '',
    conclusion: ''
  });

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBacktestingSessionById(sessionId);
      if (res.success && res.data) {
        setSession(res.data);
        if (res.data.review) {
          setReview({
            what_worked: res.data.review.what_worked || '',
            what_failed: res.data.review.what_failed || '',
            common_mistakes: res.data.review.common_mistakes || '',
            observations: res.data.review.observations || '',
            improvements: res.data.review.improvements || '',
            conclusion: res.data.review.conclusion || ''
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load session details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setIsSavingReview(true);
    setSaveSuccess(false);
    try {
      await api.updateBacktestingSession(sessionId, {
        ...session,
        review
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save review: ${err.message}`);
    } finally {
      setIsSavingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-400">Loading backtesting report...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 bg-[#111723] border border-[#1f293d] rounded-xl text-center">
        <p className="text-rose-400 text-sm font-semibold mb-3">{error || 'Session not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#1a2336] text-slate-200 rounded-lg text-xs font-semibold"
        >
          &larr; Back to Sessions
        </button>
      </div>
    );
  }

  const profit = Number(session.ending_balance) - Number(session.starting_balance);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>&larr;</span>
        <span>Back to Backtesting Laboratory</span>
      </button>

      {/* Session Overview Card */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#1f293d] gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {session.pair}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {session.timeframe}
              </span>
              {session.session && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {session.session}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Strategy: <strong className="text-slate-200">{session.strategy_name || 'Discretionary'}</strong>
              {session.testing_start_date && (
                <span> &bull; Testing Window: {String(session.testing_start_date).substring(0, 10)} to {String(session.testing_end_date).substring(0, 10)}</span>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] block uppercase font-bold text-slate-400">Net Simulated Result</span>
            <div className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              ${Number(session.starting_balance).toLocaleString()} &rarr; ${Number(session.ending_balance).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Results Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-6 text-center font-mono">
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Trades</span>
            <span className="font-bold text-slate-100 text-sm">{session.total_trades}</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Wins</span>
            <span className="font-bold text-emerald-400 text-sm">{session.wins}</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Losses</span>
            <span className="font-bold text-rose-400 text-sm">{session.losses}</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Break Even</span>
            <span className="font-bold text-slate-300 text-sm">{session.break_even}</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Win Rate</span>
            <span className="font-bold text-emerald-400 text-sm">{session.win_rate}%</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Total R</span>
            <span className="font-bold text-amber-400 text-sm">+{session.total_r}R</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Avg R</span>
            <span className="font-bold text-slate-200 text-sm">{session.average_r}R</span>
          </div>
          <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#182133]">
            <span className="text-slate-500 text-[10px] block uppercase">Max DD</span>
            <span className="font-bold text-rose-400 text-sm">{session.max_drawdown}%</span>
          </div>
        </div>

        {session.notes && (
          <div className="mt-5 p-3.5 rounded-xl bg-[#0a0d14] border border-[#182133] text-xs text-slate-300">
            <span className="text-slate-500 font-semibold block mb-0.5 text-[10px] uppercase">Session Hypothesis:</span>
            {session.notes}
          </div>
        )}
      </div>

      {/* Section 11: Review Form */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f293d] mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Backtesting Review & Strategic Takeaways
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Document edge mechanics, failure modes, and required rule improvements.
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 animate-fadeIn">
              ✓ Review saved successfully
            </span>
          )}
        </div>

        <form onSubmit={handleSaveReview} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                What worked?
              </label>
              <textarea
                name="what_worked"
                rows="4"
                value={review.what_worked}
                onChange={handleReviewChange}
                placeholder="High probability patterns, optimal sessions, target confluences..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                What failed?
              </label>
              <textarea
                name="what_failed"
                rows="4"
                value={review.what_failed}
                onChange={handleReviewChange}
                placeholder="Conditions where the strategy consistently broke down..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-rose-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                Common Mistakes Observed
              </label>
              <textarea
                name="common_mistakes"
                rows="4"
                value={review.common_mistakes}
                onChange={handleReviewChange}
                placeholder="Early execution, wide invalidation, ignoring HTF structure..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-amber-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Strategy Observations
              </label>
              <textarea
                name="observations"
                rows="4"
                value={review.observations}
                onChange={handleReviewChange}
                placeholder="Day of week nuances, time-of-day momentum spikes..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
                Improvements & Rule Refinements
              </label>
              <textarea
                name="improvements"
                rows="4"
                value={review.improvements}
                onChange={handleReviewChange}
                placeholder="Specific adjustments to add to entry/exit rules..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-blue-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                Final Conclusion
              </label>
              <textarea
                name="conclusion"
                rows="4"
                value={review.conclusion}
                onChange={handleReviewChange}
                placeholder="Is this strategy approved for live capital? Key execution guideline..."
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSavingReview}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors disabled:opacity-50"
            >
              {isSavingReview ? 'Saving Changes...' : 'Save Strategy Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BacktestingDetails;
