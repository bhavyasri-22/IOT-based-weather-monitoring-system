import React, { useEffect, useRef } from 'react';
import { Activity, AlertTriangle, Cpu, Radio, Zap } from 'lucide-react';

const MAX_EVENTS = 50;

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const EVENT_DOT = {
  telemetry: 'bg-sky-500',
  alert: 'bg-rose-500',
  alert_resolved: 'bg-emerald-500',
  heartbeat: 'bg-slate-400',
  device: 'bg-amber-500',
};

export default function ActivityFeed({ events = [] }) {
  const containerRef = useRef(null);
  const displayed = events.slice(0, MAX_EVENTS);

  // Auto-scroll to top on new events (newest first)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className="bg-white/95 border border-sky-200/80 rounded-2xl p-4 shadow-xs flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Activity size={13} className="text-slate-500" />
        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">RECENT ACTIVITY</p>
      </div>

      <div
        ref={containerRef}
        className="flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: 280 }}
      >
        {displayed.length === 0 ? (
          <div className="py-6 text-center">
            <Radio size={18} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Waiting for events...</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time activity will appear here</p>
          </div>
        ) : (
          displayed.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2.5 group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${EVENT_DOT[evt.type] || 'bg-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-800 leading-snug">{evt.title}</p>
                {evt.subtitle && (
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{evt.subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap group-hover:text-slate-600 transition-colors">
                {formatRelativeTime(evt.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
