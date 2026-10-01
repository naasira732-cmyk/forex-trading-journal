import React, { useState } from 'react';

const EquityChart = ({ equityCurve = [], startingBalance = 10000, currency = 'USD' }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!equityCurve || equityCurve.length < 2) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-[#1f293d] rounded-xl">
        <p className="text-sm font-medium">Not enough trade history to plot equity curve.</p>
        <p className="text-xs mt-1 text-slate-600">Record closed trades to see balance growth over time.</p>
      </div>
    );
  }

  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const width = 800;
  const height = 280;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max balance for Y scale
  const balances = equityCurve.map(pt => Number(pt.balance));
  const rawMin = Math.min(...balances, startingBalance);
  const rawMax = Math.max(...balances, startingBalance);
  const margin = (rawMax - rawMin) * 0.15 || 500;
  const minY = Math.floor((rawMin - margin) / 100) * 100;
  const maxY = Math.ceil((rawMax + margin) / 100) * 100;
  const yRange = maxY - minY || 1;

  // Map data to SVG coordinates
  const points = equityCurve.map((pt, idx) => {
    const x = padding.left + (idx / (equityCurve.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((Number(pt.balance) - minY) / yRange) * chartHeight;
    return { ...pt, x, y };
  });

  // Starting balance line Y
  const startY = padding.top + chartHeight - ((startingBalance - minY) / yRange) * chartHeight;

  // Generate SVG path for line
  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');

  // Generate area path for gradient
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;

  // Current status
  const lastBalance = Number(equityCurve[equityCurve.length - 1].balance);
  const isOverallProfitable = lastBalance >= startingBalance;
  const strokeColor = isOverallProfitable ? '#97A87A' : '#f43f5e';
  const gradientId = isOverallProfitable ? 'equityGreen' : 'equityRed';

  // Y-axis ticks (4 ticks)
  const yTicks = [minY, minY + yRange * 0.33, minY + yRange * 0.66, maxY].map(v => Math.round(v));

  return (
    <div className="relative w-full">
      {/* Interactive Tooltip readout */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: strokeColor }}></span>
            <span className="text-slate-400">Equity Curve</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="w-4 border-b border-dashed border-slate-600"></span>
            <span>Starting: ${startingBalance.toLocaleString()}</span>
          </div>
        </div>

        {hoveredPoint ? (
          <div className="flex items-center space-x-3 bg-slate-800/90 px-3 py-1 rounded-md border border-slate-700 shadow-lg animate-fadeIn">
            <span className="text-slate-400 font-mono">Trade #{hoveredPoint.tradeIndex}</span>
            <span className="text-slate-300">{new Date(hoveredPoint.date).toLocaleDateString()}</span>
            <span className="font-mono font-semibold text-slate-100">${Number(hoveredPoint.balance).toLocaleString()}</span>
            <span className={`font-mono font-semibold ${hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hoveredPoint.pnl >= 0 ? `+$${hoveredPoint.pnl}` : `-$${Math.abs(hoveredPoint.pnl)}`}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 italic text-[11px]">Hover over curve to inspect trades</span>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '300px' }}
        >
          <defs>
            <linearGradient id="equityGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#97A87A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#97A87A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="equityRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y labels */}
          {yTicks.map((val, idx) => {
            const y = padding.top + chartHeight - ((val - minY) / yRange) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#D8DECE"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#707866"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end"
                >
                  ${val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Baseline (Starting Balance) */}
          <line
            x1={padding.left}
            y1={startY}
            x2={width - padding.right}
            y2={startY}
            stroke="#97A87A"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Gradient area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Main Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.tradeIndex === pt.tradeIndex ? 6 : 3.5}
                fill={strokeColor}
                stroke="#FCF9EA"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* Invisible large hit area */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="14"
                fill="transparent"
              />
            </g>
          ))}

          {/* X-axis labels (first, middle, last) */}
          {points.length > 0 && (
            <>
              <text
                x={points[0].x}
                y={height - 10}
                fill="#707866"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="start"
              >
                Trade #0 (Start)
              </text>
              {points.length > 2 && (
                <text
                  x={points[Math.floor(points.length / 2)].x}
                  y={height - 10}
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  Trade #{points[Math.floor(points.length / 2)].tradeIndex}
                </text>
              )}
              <text
                x={points[points.length - 1].x}
                y={height - 10}
                fill="#64748b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                Trade #{points[points.length - 1].tradeIndex} (Latest)
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

export default EquityChart;
