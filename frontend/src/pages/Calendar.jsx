import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IconCalendar, IconEye } from '../components/Icons';

const Calendar = ({ onSelectTrade }) => {
  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState([]);
  const [monthTrades, setMonthTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected day drill-down
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCalendar = async (year, month) => {
    setIsLoading(true);
    try {
      const res = await api.getCalendar(year, month);
      if (res.success && res.data) {
        setCalendarData(res.data.days || []);
        setMonthTrades(res.data.trades || []);
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDay(null);
  };

  // Month metadata
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Map calendar data to date string YYYY-MM-DD
  const dateMap = {};
  calendarData.forEach(d => {
    dateMap[d.date] = d;
  });

  // Calculate monthly totals
  const monthTotalTrades = calendarData.reduce((acc, d) => acc + d.total_trades, 0);
  const monthWins = calendarData.reduce((acc, d) => acc + d.wins, 0);
  const monthLosses = calendarData.reduce((acc, d) => acc + d.losses, 0);
  const monthNetPnl = calendarData.reduce((acc, d) => acc + d.net_profit, 0);
  const monthWinRate = monthTotalTrades > 0 ? Math.round((monthWins / monthTotalTrades) * 1000) / 10 : 0;

  // Selected day trades
  const selectedDayTrades = selectedDay
    ? monthTrades.filter(t => t.trade_date && String(t.trade_date).substring(0, 10) === selectedDay.date)
    : [];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header and month navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trading Activity Calendar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily P/L heatmap and execution frequency drill-down.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-[#111723] border border-[#1f293d] text-slate-300 hover:text-white hover:bg-[#1a2336] text-xs font-mono font-bold"
          >
            &larr; Prev
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 rounded-lg bg-[#111723] border border-[#1f293d] text-xs font-semibold text-slate-200 hover:bg-[#1a2336]"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-[#111723] border border-[#1f293d] text-slate-300 hover:text-white hover:bg-[#1a2336] text-xs font-mono font-bold"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Month Summary Bar */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <IconCalendar className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white font-mono">
            {monthNames[currentMonth - 1]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Month Trades</span>
            <span className="font-bold text-slate-200">{monthTotalTrades}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Win Rate</span>
            <span className={`font-bold ${monthWinRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {monthWinRate}% ({monthWins}W - {monthLosses}L)
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Month Net P/L</span>
            <span className={`font-bold text-sm ${monthNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthNetPnl >= 0 ? `+$${monthNetPnl.toFixed(2)}` : `-$${Math.abs(monthNetPnl).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-4 shadow-sm">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {daysOfWeek.map(d => (
            <div key={d} className="py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {d}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-2">
          {/* Leading blank slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`blank-${idx}`}
              className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-[#0c101a]/40 border border-[#161f30]/40 opacity-40"
            />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const data = dateMap[dateStr];
            const isSelected = selectedDay?.date === dateStr;

            const isProfitable = data && data.net_profit > 0;
            const isLoss = data && data.net_profit < 0;

            return (
              <div
                key={dateStr}
                onClick={() => data && setSelectedDay(data)}
                className={`min-h-[85px] sm:min-h-[105px] rounded-xl p-2 flex flex-col justify-between transition-all border text-left ${
                  data ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-[#151f30]'
                    : data
                    ? isProfitable
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                      : isLoss
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-[#101624] border-slate-700/40 hover:border-slate-500'
                    : 'bg-[#0c101a] border-[#182133] hover:border-[#222e47]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${data ? 'text-slate-100' : 'text-slate-600'}`}>
                    {dayNum}
                  </span>
                  {data && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {data.total_trades}T
                    </span>
                  )}
                </div>

                {data ? (
                  <div className="mt-1 space-y-0.5 font-mono">
                    <div className="text-[10px] text-slate-400">
                      {data.wins}W - {data.losses}L
                    </div>
                    <div className={`text-xs font-bold ${data.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data.net_profit >= 0 ? `+$${data.net_profit}` : `-$${Math.abs(data.net_profit)}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-700 font-mono italic">
                    No trades
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Drill Down Pane */}
      {selectedDay && (
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[#1f293d] mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Daily Trade Breakdown
              </span>
              <h3 className="text-lg font-bold text-white font-mono">
                {selectedDay.date} &bull; {selectedDay.total_trades} Trades ({selectedDay.wins}W / {selectedDay.losses}L / {selectedDay.break_even}BE)
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-base font-mono font-bold ${selectedDay.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedDay.net_profit >= 0 ? `+$${selectedDay.net_profit.toFixed(2)}` : `-$${Math.abs(selectedDay.net_profit).toFixed(2)}`}
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-[#0a0d14] rounded-xl border border-[#182133]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#182133] text-[10px] uppercase font-bold text-slate-400 bg-[#0e1420]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Pair</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Timeframe</th>
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3 text-right">Entry</th>
                  <th className="py-2.5 px-3 text-right">Exit</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                  <th className="py-2.5 px-3 text-right">P / L</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182133]">
                {selectedDayTrades.map((t) => {
                  const pnl = Number(t.profit_loss);
                  return (
                    <tr key={t.id} className="hover:bg-[#121927]">
                      <td className="py-2.5 px-3 text-slate-500">#{t.id}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{t.pair}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{t.timeframe}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.session}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans truncate max-w-[120px]">{t.strategy_name || 'Discretionary'}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{Number(t.entry_price).toFixed(t.pair?.includes('JPY') ? 3 : 5)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{t.exit_price ? Number(t.exit_price).toFixed(t.pair?.includes('JPY') ? 3 : 5) : '—'}</td>
                      <td className="py-2.5 px-3 text-center">
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
                          className="p-1 rounded text-slate-400 hover:text-emerald-400"
                          title="View Trade Report"
                        >
                          <IconEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
