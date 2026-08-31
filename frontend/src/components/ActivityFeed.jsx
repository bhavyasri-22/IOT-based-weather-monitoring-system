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

function EventIcon({ type }) {
  switch (type) {
    case 'telemetry':
      return <Activity size={11} className="text-[#38BDF8]" />;
    case 'alert':
      return <AlertTriangle size={11} className="text-[#EF4444]" />;
    case 'alert_resolved':
      return <Zap size={11} className="text-[#22C55E]" />;
    case 'heartbeat':
      return <Radio size={11} className="text-[#94A3B8]" />;
    case 'device':
      return <Cpu size={11} className="text-[#F59E0B]" />;
    default:
      return <Activity size={11} className="text-[#64748B]" />;
  }
}

const EVENT_DOT = {
  telemetry: 'bg-[#38BDF8]',
  alert: 'bg-[#EF4444]',
  alert_resolved: 'bg-[#22C55E]',
  heartbeat: 'bg-[#94A3B8]',
  device: 'bg-[#F59E0B]',
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
    <div className="panel-card border border-[#26303B] p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Activity size={13} className="text-[#64748B]" />
        <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">RECENT ACTIVITY</p>
      </div>

      <div
        ref={containerRef}
        className="flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: 280 }}
      >
        {displayed.length === 0 ? (
          <div className="py-6 text-center">
            <Radio size={18} className="text-[#3A4654] mx-auto mb-2" />
            <p className="text-xs text-[#64748B]">Waiting for events...</p>
            <p className="text-[10px] text-[#3A4654] mt-0.5">Real-time activity will appear here</p>
          </div>
        ) : (
          displayed.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2.5 group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${EVENT_DOT[evt.type] || 'bg-[#64748B]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#94A3B8] leading-snug">{evt.title}</p>
                {evt.subtitle && (
                  <p className="text-[10px] text-[#64748B] mt-0.5 truncate">{evt.subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-[#3A4654] flex-shrink-0 whitespace-nowrap group-hover:text-[#64748B] transition-colors">
                {formatRelativeTime(evt.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
