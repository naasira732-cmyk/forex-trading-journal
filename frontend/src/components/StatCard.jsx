import React from 'react';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  type = 'default',
  badgeText = null
}) => {
  const colorMap = {
    default: {
      border: 'border-[#1f293d]',
      text: 'text-slate-100',
      iconBg: 'bg-slate-800/60 text-slate-300'
    },
    win: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400'
    },
    loss: {
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400'
    },
    amber: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400'
    },
    accent: {
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/10 text-blue-400'
    }
  };

  const style = colorMap[type] || colorMap.default;

  return (
    <div className={`bg-[#111723] rounded-xl p-5 border ${style.border} transition-all duration-200 hover:border-slate-600 shadow-sm relative overflow-hidden group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${style.iconBg} transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className={`text-2xl font-bold font-mono tracking-tight ${style.text}`}>
          {value !== null && value !== undefined ? value : '—'}
        </div>
        {badgeText && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-400 font-normal truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
