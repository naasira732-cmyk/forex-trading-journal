import React from 'react';
import { IconEye, IconEdit, IconTrash } from './Icons';

const TradeTable = ({
  trades = [],
  onView,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#111723] border border-[#1f293d] rounded-xl p-12 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading trades...</p>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-[#111723] border border-[#1f293d] rounded-xl p-12 text-center text-slate-400">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">No trading data yet.</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No trade records found matching your filters. Record a new trade to begin tracking your edge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111723] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0c111a] border-b border-[#1f293d] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Pair</th>
              <th className="py-3 px-3">Dir</th>
              <th className="py-3 px-3">TF</th>
              <th className="py-3 px-3">Session</th>
              <th className="py-3 px-3">Strategy</th>
              <th className="py-3 px-3 text-right">Entry</th>
              <th className="py-3 px-3 text-right">SL</th>
              <th className="py-3 px-3 text-right">TP</th>
              <th className="py-3 px-3 text-right">Exit</th>
              <th className="py-3 px-3 text-center">Risk%</th>
              <th className="py-3 px-3 text-center">R:R</th>
              <th className="py-3 px-3 text-center">Result</th>
              <th className="py-3 px-3 text-right">P / L</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#182133] text-xs">
            {trades.map((trade) => {
              const pnl = Number(trade.profit_loss);
              const isWin = trade.result === 'WIN' || pnl > 0;
              const isLoss = trade.result === 'LOSS' || pnl < 0;

              return (
                <tr
                  key={trade.id}
                  className="hover:bg-[#151c2b] transition-colors group cursor-default"
                >
                  <td className="py-3 px-3 font-mono text-slate-500">
                    #{trade.id}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono whitespace-nowrap">
                    {trade.trade_date ? String(trade.trade_date).substring(0, 10) : '—'}
                  </td>
                  <td className="py-3 px-3 font-bold text-white font-mono whitespace-nowrap">
                    {trade.pair}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        trade.direction === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {trade.timeframe}
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {trade.session}
                  </td>
                  <td className="py-3 px-3 text-slate-300 truncate max-w-[130px]" title={trade.strategy_name || 'Discretionary'}>
                    {trade.strategy_name || <span className="text-slate-500 italic">Discretionary</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    {Number(trade.entry_price).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-300/80">
                    {Number(trade.stop_loss).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300/80">
                    {Number(trade.take_profit).toFixed(trade.pair?.includes('JPY') ? 3 : 5)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {trade.exit_price ? Number(trade.exit_price).toFixed(trade.pair?.includes('JPY') ? 3 : 5) : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {trade.risk_percentage ? `${Number(trade.risk_percentage)}%` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-amber-400 font-medium">
                    {trade.risk_reward || '—'}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isWin
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {trade.result}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                    <span className={isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}>
                      {pnl > 0 ? `+$${pnl.toFixed(2)}` : pnl < 0 ? `-$${Math.abs(pnl).toFixed(2)}` : '$0.00'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onView && onView(trade)}
                        title="View Trade Report"
                        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(trade)}
                        title="Edit Trade"
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(trade)}
                        title="Delete Trade"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeTable;
