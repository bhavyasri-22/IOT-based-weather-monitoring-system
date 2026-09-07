import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  MapPin, 
  Bell, 
  Clock, 
  Radio, 
  ShieldCheck, 
  UserCheck, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';

const PAGE_META = {
  '/': { title: 'Weather Overview', subtitle: 'Real-time environmental conditions' },
  '/live': { title: 'Live Sensor Monitor', subtitle: 'High-frequency telemetry streams' },
  '/analytics': { title: 'Environmental Analytics', subtitle: 'Multi-sensor historical trend intelligence' },
  '/history': { title: 'Historical Archive', subtitle: 'Time-series data logs and exports' },
  '/devices': { title: 'Sensors & Hardware', subtitle: 'Node diagnostics, pinouts, and calibration' },
  '/alerts': { title: 'Environmental Alerts', subtitle: 'Active system breaches and audit logs' },
  '/admin': { title: 'System Configuration', subtitle: 'Alert threshold limits and node parameters' },
};

export default function TopHeader({
  onToggleSidebar,
  isSidebarOpen,
  deviceId,
  deviceStatus,
  wsState,
  lastUpdated,
  activeAlertCount = 0,
  activeAlerts = [],
  onResolveAlert,
  user,
  onLogout,
}) {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: 'Weather Overview', subtitle: 'Real-time environmental conditions' };

  const isOnline = deviceStatus === 'online';
  const isWsConnected = wsState === 'connected';

  // Live wall clock
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications popup
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 w-full px-4 sm:px-6 bg-[#07111F]/80 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between transition-colors">
      {/* Left side: Hamburger ☰ menu trigger + Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          aria-label="Toggle Navigation Drawer"
          title="Open Menu"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-tight">
            {meta.title}
          </h1>
          <p className="text-[11px] text-[#64748B] hidden sm:block leading-tight">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Location Selector + Live Status + Clock + Notification Bell + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Location Selector Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <MapPin size={13} className="text-[#60A5FA]" />
          <span className="text-xs font-semibold text-[#F1F5F9]">NITK Surathkal</span>
        </div>

        {/* Live Status Indicator (Section 6) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {isWsConnected ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-[#34D399]">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span className="text-xs font-bold tracking-wider text-[#F59E0B]">Reconnecting...</span>
            </div>
          )}

          <span className="hidden sm:inline w-px h-3.5 bg-white/[0.1]" />

          <div className="hidden sm:flex items-center gap-1 text-xs text-[#94A3B8] font-mono">
            <Clock size={12} className="text-[#64748B]" />
            <span>{clockTime}</span>
          </div>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              showNotifications || activeAlertCount > 0
                ? 'bg-[#60A5FA]/15 border-[#60A5FA]/30 text-[#60A5FA]'
                : 'bg-white/[0.03] border-white/[0.06] text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
            }`}
            title="System Alerts"
          >
            <Bell size={16} className={activeAlertCount > 0 ? 'text-[#F87171] animate-bounce-subtle' : ''} />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F87171] flex items-center justify-center text-[9px] font-bold text-white shadow-md">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-88 p-4 rounded-2xl bg-[#0B1728]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[#60A5FA]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alert Center</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F87171]/20 text-[#F87171] font-bold border border-[#F87171]/30">
                  {activeAlertCount} active
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center">
                  <Check size={20} className="text-[#34D399] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-white">All Systems Normal</p>
                  <p className="text-[10px] text-[#64748B]">No active breaches or anomalies</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeAlerts.map((a) => (
                    <div
                      key={a._id || a.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs flex items-start gap-2.5"
                    >
                      <AlertTriangle size={14} className="text-[#F87171] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[9px] font-bold uppercase text-[#F87171]">
                            {a.parameter} · {a.severity}
                          </span>
                          <span className="text-[9px] text-[#64748B] font-mono">
                            {formatRelativeTime(a.triggered_at || a.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#E2E8F0] leading-snug">{a.message}</p>
                      </div>
                      {onResolveAlert && a._id && (
                        <button
                          onClick={() => onResolveAlert(a._id)}
                          className="p-1 rounded bg-white/[0.05] hover:bg-[#34D399]/20 text-[#94A3B8] hover:text-[#34D399] transition-all"
                          title="Resolve"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1 font-semibold"
                >
                  View full logs <ChevronRight size={12} />
                </Link>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#64748B] hover:text-[#94A3B8]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile / User Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {user?.role === 'admin' ? (
              <ShieldCheck size={14} className="text-[#60A5FA]" />
            ) : (
              <UserCheck size={14} className="text-[#34D399]" />
            )}
            <span className="text-xs font-semibold text-white truncate max-w-[100px]">
              {user?.email ? user.email.split('@')[0] : 'Operator'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
