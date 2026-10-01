import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import {
  IconAnalytics,
  IconTrendingUp,
  IconTrendingDown,
  IconShield,
  IconJournal
} from '../components/Icons';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [pairData, setPairData] = useState([]);
  const [strategyData, setStrategyData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [timeframeData, setTimeframeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getOverview(),
      api.getPairPerformance(),
      api.getStrategyPerformance(),
      api.getSessionPerformance(),
      api.getTimeframePerformance()
    ])
      .then(([ovRes, pairRes, stratRes, sessRes, tfRes]) => {
        if (ovRes.success) setOverview(ovRes.data);
        if (pairRes.success) setPairData(pairRes.data);
        if (stratRes.success) setStrategyData(stratRes.data);
        if (sessRes.success) setSessionData(sessRes.data);
        if (tfRes.success) setTimeframeData(tfRes.data);
      })
      .catch(err => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400 font-medium">Aggregating multidimensional analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
        <p className="font-bold mb-1">Failed to compute analytics:</p>
        <p>{error}</p>
      </div>
    );
  }

  const hasData = overview?.hasData;

  if (!hasData) {
    return (
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
          <IconAnalytics className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No trading data yet.</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Record trades in your journal to unlock breakdowns across pairs, strategies, sessions, and timeframes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Performance Analytics Engine</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Data-driven edge analysis across currency pairs, session dynamics, and timeframes.
        </p>
      </div>

      {/* 1. Overall Performance Cards */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Overall Portfolio Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Trades"
            value={overview.totalTrades}
            subtext={`${overview.winningTrades}W / ${overview.losingTrades}L / ${overview.breakEvenTrades}BE`}
            type="default"
            icon={IconJournal}
          />
          <StatCard
            title="Win Rate"
            value={`${overview.winRate}%`}
            subtext="Realized rate"
            type={overview.winRate >= 50 ? 'win' : 'amber'}
          />
          <StatCard
            title="Net Profit"
            value={overview.netProfit >= 0 ? `+$${overview.netProfit.toLocaleString()}` : `-$${Math.abs(overview.netProfit).toLocaleString()}`}
            subtext="Net cumulative P/L"
            type={overview.netProfit >= 0 ? 'win' : 'loss'}
            icon={overview.netProfit >= 0 ? IconTrendingUp : IconTrendingDown}
          />
          <StatCard
            title="Profit Factor"
            value={overview.profitFactor >= 999 ? '∞' : overview.profitFactor}
            subtext="Gross Win / Loss"
            type={overview.profitFactor >= 1.5 ? 'win' : 'amber'}
          />
          <StatCard
            title="Average R"
            value={overview.averageRR ? `1:${overview.averageRR}` : '—'}
            subtext="Avg reward-to-risk"
            type="amber"
          />
          <StatCard
            title="Max Drawdown"
            value={`${overview.maxDrawdownPercentage}%`}
            subtext={`-$${overview.maxDrawdownAmount.toLocaleString()}`}
            type="loss"
            icon={IconShield}
          />
        </div>
      </div>

      {/* 2. Performance by Pair & 3. Performance by Strategy (2 Column layout on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Pair */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Performance By Pair
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{pairData.length} Pairs Traded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-[#182133]">
                    <th className="pb-2.5">Pair</th>
                    <th className="pb-2.5 text-center">Trades</th>
                    <th className="pb-2.5 text-center">W / L</th>
                    <th className="pb-2.5">Win Rate</th>
                    <th className="pb-2.5 text-right">Net Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182133] font-mono">
                  {pairData.map((item) => (
                    <tr key={item.pair} className="hover:bg-[#151c2b]">
                      <td className="py-2.5 font-bold text-white">{item.pair}</td>
                      <td className="py-2.5 text-center text-slate-300">{item.total_trades}</td>
                      <td className="py-2.5 text-center text-slate-400">{item.wins} / {item.losses}</td>
                      <td className="py-2.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-semibold w-9 ${item.win_rate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.win_rate}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(item.win_rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold">
                        <span className={item.net_result >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.net_result >= 0 ? `+$${item.net_result.toFixed(2)}` : `-$${Math.abs(item.net_result).toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance by Strategy */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Performance By Strategy
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{strategyData.length} Setups</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-[#182133]">
                    <th className="pb-2.5">Strategy</th>
                    <th className="pb-2.5 text-center">Trades</th>
                    <th className="pb-2.5 text-center">W / L</th>
                    <th className="pb-2.5">Win Rate</th>
                    <th className="pb-2.5 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182133] font-mono">
                  {strategyData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#151c2b]">
                      <td className="py-2.5 text-slate-200 font-sans font-medium truncate max-w-[140px]" title={item.strategy_name}>
                        {item.strategy_name}
                      </td>
                      <td className="py-2.5 text-center text-slate-300">{item.total_trades}</td>
                      <td className="py-2.5 text-center text-slate-400">{item.wins} / {item.losses}</td>
                      <td className="py-2.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-semibold w-9 ${item.win_rate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.win_rate}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(item.win_rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold">
                        <span className={item.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.net_profit >= 0 ? `+$${item.net_profit.toFixed(2)}` : `-$${Math.abs(item.net_profit).toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Performance by Session & 5. Performance by Timeframe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Session */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Performance By Trading Session
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Market Openings</span>
          </div>

          <div className="space-y-3">
            {sessionData.map((item) => (
              <div
                key={item.session}
                className="bg-[#0a0d14] border border-[#182133] rounded-xl p-3.5 flex items-center justify-between font-mono text-xs"
              >
                <div>
                  <span className="font-sans font-bold text-slate-100 block text-sm mb-0.5">
                    {item.session}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.total_trades} Trades &bull; {item.wins}W - {item.losses}L
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Win Rate</span>
                    <span className={`font-bold ${item.win_rate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.win_rate}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Profit / Loss</span>
                    <span className={`font-bold text-sm ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.net_profit >= 0 ? `+$${item.net_profit.toFixed(2)}` : `-$${Math.abs(item.net_profit).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance by Timeframe */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Performance By Timeframe
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Chart Granularity</span>
          </div>

          <div className="space-y-3">
            {timeframeData.map((item) => (
              <div
                key={item.timeframe}
                className="bg-[#0a0d14] border border-[#182133] rounded-xl p-3.5 flex items-center justify-between font-mono text-xs"
              >
                <div>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 text-xs inline-block mb-1">
                    {item.timeframe}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    {item.total_trades} Trades &bull; {item.wins} Wins / {item.losses} Losses
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Win Rate</span>
                    <span className={`font-bold ${item.win_rate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.win_rate}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Net Result</span>
                    <span className={`font-bold text-sm ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.net_profit >= 0 ? `+$${item.net_profit.toFixed(2)}` : `-$${Math.abs(item.net_profit).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
