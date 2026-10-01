import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import EquityChart from '../components/EquityChart';
import TradeTable from '../components/TradeTable';
import {
  IconWallet,
  IconJournal,
  IconTrendingUp,
  IconTrendingDown,
  IconShield,
  IconPlus,
  IconBacktest
} from '../components/Icons';

const Dashboard = ({ onNavigate, onSelectTrade }) => {
  const [overview, setOverview] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, tradesRes] = await Promise.all([
        api.getOverview(),
        api.getTrades({ limit: 5 })
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
      if (tradesRes.success) {
        setRecentTrades(tradesRes.data.slice(0, 5));
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400 font-medium">Calculating trading statistics from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
        <p className="font-bold mb-1">Failed to load Dashboard:</p>
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasData = overview?.hasData;
  const currency = overview?.currency || 'USD';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Quick Action Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111723] border border-[#1f293d] rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trading Performance Desk</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time equity analytics, risk parameters, and execution discipline tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('add-trade')}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            <span>Record Trade</span>
          </button>
          <button
            onClick={() => onNavigate('backtesting')}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#1a2336] hover:bg-[#232f48] text-slate-200 text-xs font-semibold border border-[#2b3952] transition-colors"
          >
            <IconBacktest className="w-4 h-4" />
            <span>New Backtest</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <IconJournal className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No trading data yet.</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            You haven't recorded any trades in your journal yet. Once you log your closed trades,
            your win rate, profit factor, equity curve, and streaks will compute automatically.
          </p>
          <button
            onClick={() => onNavigate('add-trade')}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Record Your First Trade
          </button>
        </div>
      ) : (
        <>
          {/* Section 4: Account Statistics Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Account Statistics
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Data refreshed from MySQL
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <StatCard
                title="Current Balance"
                value={`$${Number(overview.currentBalance).toLocaleString()}`}
                subtext={`Start: $${Number(overview.startingBalance).toLocaleString()}`}
                type="accent"
                icon={IconWallet}
              />
              <StatCard
                title="Net Profit"
                value={overview.netProfit >= 0 ? `+$${overview.netProfit.toLocaleString()}` : `-$${Math.abs(overview.netProfit).toLocaleString()}`}
                subtext={`${overview.netProfit >= 0 ? 'Account Growth' : 'Account Drawdown'}`}
                type={overview.netProfit >= 0 ? 'win' : 'loss'}
                icon={overview.netProfit >= 0 ? IconTrendingUp : IconTrendingDown}
              />
              <StatCard
                title="Win Rate"
                value={`${overview.winRate}%`}
                subtext={`${overview.winningTrades}W - ${overview.losingTrades}L - ${overview.breakEvenTrades}BE`}
                type={overview.winRate >= 50 ? 'win' : 'amber'}
              />
              <StatCard
                title="Profit Factor"
                value={overview.profitFactor >= 999 ? '∞' : overview.profitFactor}
                subtext={`Gross W/L Ratio`}
                type={overview.profitFactor >= 1.5 ? 'win' : 'amber'}
              />
              <StatCard
                title="Total Trades"
                value={overview.totalTrades}
                subtext="Logged in journal"
                type="default"
                icon={IconJournal}
              />
              <StatCard
                title="Avg Win"
                value={`+$${overview.averageWin.toLocaleString()}`}
                subtext="Per winning trade"
                type="win"
              />
              <StatCard
                title="Avg Loss"
                value={`-$${overview.averageLoss.toLocaleString()}`}
                subtext="Per losing trade"
                type="loss"
              />
            </div>

            {/* Second row of statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              <StatCard
                title="Total Profit"
                value={`+$${overview.totalProfit.toLocaleString()}`}
                subtext="Gross winnings"
                type="win"
              />
              <StatCard
                title="Total Loss"
                value={`-$${overview.totalLoss.toLocaleString()}`}
                subtext="Gross losses"
                type="loss"
              />
              <StatCard
                title="Average R:R"
                value={overview.averageRR ? `1:${overview.averageRR}` : '—'}
                subtext="Realized reward/risk"
                type="amber"
              />
              <StatCard
                title="Max Drawdown"
                value={`${overview.maxDrawdownPercentage}%`}
                subtext={`-$${overview.maxDrawdownAmount.toLocaleString()}`}
                type="loss"
                icon={IconShield}
              />
              <StatCard
                title="Win Streak"
                value={`${overview.maxWinningStreak} trades`}
                subtext={`Current: ${overview.currentWinningStreak}`}
                type="win"
              />
              <StatCard
                title="Loss Streak"
                value={`${overview.maxLosingStreak} trades`}
                subtext={`Current: ${overview.currentLosingStreak}`}
                type="loss"
              />
            </div>
          </div>

          {/* Section 5: Equity Performance Section */}
          <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1f293d] gap-2">
              <div>
                <h3 className="text-base font-bold text-white">Equity Performance & Growth</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical balance progression plotted trade-by-trade from starting capital
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <span className="text-slate-400">
                  Peak Balance:{' '}
                  <strong className="text-emerald-400">
                    ${Math.max(...overview.equityCurve.map(p => Number(p.balance)), overview.startingBalance).toLocaleString()}
                  </strong>
                </span>
                <span className="text-slate-400">
                  Drawdown Limit:{' '}
                  <strong className="text-rose-400">
                    {overview.maxDrawdownPercentage}%
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-5">
              <EquityChart
                equityCurve={overview.equityCurve}
                startingBalance={overview.startingBalance}
                currency={currency}
              />
            </div>
          </div>

          {/* Recent Trades Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Closed Trades
              </h3>
              <button
                onClick={() => onNavigate('trades')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View All Journal Records &rarr;
              </button>
            </div>

            <TradeTable
              trades={recentTrades}
              onView={(trade) => onSelectTrade && onSelectTrade(trade)}
              onEdit={(trade) => onNavigate('add-trade', trade)}
              onDelete={fetchDashboardData}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
