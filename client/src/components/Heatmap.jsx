import React from 'react';

export default function Heatmap({ history = [] }) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/80">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>30-Day Activity</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700/60 inline-block" />
            Missed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50 inline-block" />
            Done
          </span>
        </div>
      </div>

      {/* Grid of 30 days */}
      <div className="grid grid-flow-col grid-rows-3 sm:grid-rows-2 md:grid-rows-1 gap-1.5 auto-cols-fr p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
        {history.map((day, idx) => {
          const isToday = day.isToday;
          const isChecked = day.checked;

          let bgClass = 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/40 text-slate-500';
          if (isChecked) {
            bgClass = 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-white shadow-sm shadow-emerald-500/30';
          }

          let ringClass = '';
          if (isToday) {
            ringClass = 'ring-2 ring-orange-500 ring-offset-1 ring-offset-slate-950 font-bold';
          }

          const tooltip = `${day.date} (${day.dayName || ''}): ${isChecked ? 'Completed' : 'Not completed'}${isToday ? ' [Today]' : ''}`;

          return (
            <div
              key={day.date || idx}
              title={tooltip}
              className={`h-6 sm:h-7 rounded-md border flex items-center justify-center text-[10px] transition-all duration-150 cursor-pointer select-none group relative ${bgClass} ${ringClass}`}
            >
              {isToday && (
                <span className={`text-[9px] ${isChecked ? 'text-white' : 'text-orange-400'}`}>
                  •
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
        <span>30 days ago</span>
        <span className="text-orange-400 font-medium">Today</span>
      </div>
    </div>
  );
}
