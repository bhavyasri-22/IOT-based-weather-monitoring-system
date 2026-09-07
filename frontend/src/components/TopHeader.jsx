import React from 'react';
import { Bell, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: 'Live environmental monitoring console' },
  '/live': { title: 'Live Monitor', subtitle: 'Real-time sensor telemetry feed' },
  '/history': { title: 'Historical Data', subtitle: 'Sensor data analysis and trend view' },
  '/alerts': { title: 'Alerts', subtitle: 'Active and resolved system alerts' },
  '/devices': { title: 'Devices', subtitle: 'Registered hardware nodes and diagnostics' },
  '/admin': { title: 'Admin Config', subtitle: 'Alert thresholds and system configuration' },
};

function formatLastSeen(lastUpdated) {
  if (!lastUpdated) return 'No data';
  const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function TopHeader({ deviceId, deviceStatus, lastUpdated, activeAlertCount = 0, user, onLogout }) {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: 'Weather Station', subtitle: 'IoT monitoring system' };
  const isOnline = deviceStatus === 'online';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#1A212B] bg-[#0D1117] flex-shrink-0">
      {/* Left: Page title */}
      <div>
        <h1 className="text-sm font-semibold text-[#F1F5F9] leading-tight">{meta.title}</h1>
        <p className="text-xs text-[#64748B] leading-tight mt-0.5">{meta.subtitle}</p>
      </div>

      {/* Right: Device status + alerts + role badge + logout */}
      <div className="flex items-center gap-3">
        {/* Device status pill */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#151B23] border border-[#26303B]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
              style={isOnline ? { boxShadow: '0 0 5px #22C55E88' } : {}}
            />
            <span className={`text-[11px] font-semibold tracking-wider ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          {deviceId && (
            <>
              <span className="w-px h-3.5 bg-[#26303B]" />
              <span className="text-[11px] text-[#94A3B8] font-mono">{deviceId}</span>
            </>
          )}
          {lastUpdated && (
            <>
              <span className="w-px h-3.5 bg-[#26303B]" />
              <span className="text-[11px] text-[#64748B]">
                {formatLastSeen(lastUpdated)}
              </span>
            </>
          )}
        </div>

        {/* Alert bell */}
        <button
          className="relative w-8 h-8 rounded-lg bg-[#151B23] border border-[#26303B] flex items-center justify-center hover:bg-[#1A212B] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={14} className="text-[#64748B]" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] flex items-center justify-center text-[9px] font-bold text-white">
              {activeAlertCount > 9 ? '9+' : activeAlertCount}
            </span>
          )}
        </button>

        {/* Role & User Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#151B23] border border-[#26303B]">
          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0E2A3A] text-[#38BDF8] border border-[#38BDF844]">
                <ShieldCheck size={10} />
                Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0F2B1D] text-[#22C55E] border border-[#22C55E44]">
                <UserCheck size={10} />
                Operator
              </span>
            )}
            <span className="text-[11px] text-[#CBD5E1] font-medium truncate max-w-[120px]">
              {user?.email ? user.email.split('@')[0] : 'user'}
            </span>
          </div>

          {onLogout && (
            <>
              <span className="w-px h-3.5 bg-[#26303B]" />
              <button
                onClick={onLogout}
                title="Sign Out"
                className="text-[#64748B] hover:text-[#EF4444] transition-colors p-0.5"
              >
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
