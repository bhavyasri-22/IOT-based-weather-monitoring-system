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
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';
import { useTheme } from '../context/ThemeContext';
import useUserLocation from '../hooks/useUserLocation';

const PAGE_META = {
  '/dashboard':            { title: 'Weather Overview',        subtitle: 'Real-time environmental conditions' },
  '/dashboard/live':       { title: 'Live Sensor Monitor',     subtitle: 'High-frequency telemetry streams' },
  '/dashboard/analytics':  { title: 'Environmental Analytics', subtitle: 'Multi-sensor historical trend intelligence' },
  '/dashboard/history':    { title: 'Historical Archive',      subtitle: 'Time-series data logs and exports' },
  '/dashboard/devices':    { title: 'Sensors & Hardware',      subtitle: 'Node diagnostics, pinouts, and calibration' },
  '/dashboard/alerts':     { title: 'Environmental Alerts',    subtitle: 'Active system breaches and audit logs' },
  '/dashboard/admin':      { title: 'System Configuration',    subtitle: 'Alert threshold limits and node parameters' },
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
  const { theme, toggleTheme, isDark } = useTheme();
  const userLoc = useUserLocation();
  const meta = PAGE_META[pathname] || { title: 'Weather Overview', subtitle: 'Real-time environmental conditions' };

  const isOnline = deviceStatus === 'online';
  const isWsConnected = wsState === 'connected';

  // Filter out any bogus 4095 flood alerts
  const validAlerts = (activeAlerts || []).filter(
    (a) => (a.status === 'active' || !a.resolved) &&
      !(a.parameter === 'rain_intensity' && (a.trigger_value >= 100 || (a.message && a.message.includes('4095'))))
  );
  const validAlertCount = validAlerts.length;

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
    <header className="sticky top-0 z-40 h-16 w-full px-4 sm:px-6 bg-white/90 dark:bg-[#07111F]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between transition-colors shadow-sm dark:shadow-none">
      {/* Left side: Hamburger ☰ menu trigger + Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          aria-label="Toggle Navigation Drawer"
          title={isSidebarOpen ? "Close Menu" : "Open Menu"}
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
            IOT – Weather Monitoring System
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B] hidden sm:block leading-tight">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Location + Live Status + Theme Toggle + Clock + Notification Bell + Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Location Selector Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
          <MapPin size={13} className="text-blue-500 dark:text-[#60A5FA]" />
          <span className="text-xs font-semibold text-slate-800 dark:text-[#F1F5F9]">
            {userLoc.city || 'Detecting Location...'}
          </span>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
          {isWsConnected ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#34D399] shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-[#059669] dark:text-[#34D399]">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span className="text-xs font-bold tracking-wider text-[#D97706] dark:text-[#F59E0B]">Reconnecting...</span>
            </div>
          )}

          <span className="hidden sm:inline w-px h-3.5 bg-slate-300 dark:bg-white/[0.1]" />

          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-600 dark:text-[#94A3B8] font-mono">
            <Clock size={12} className="text-slate-400 dark:text-[#64748B]" />
            <span>{clockTime}</span>
          </div>
        </div>

        {/* Theme Toggle Button (Dark / Light Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] cursor-pointer shadow-sm"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark/Light Mode"
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={16} className="text-blue-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${showNotifications || validAlertCount > 0
                ? 'bg-blue-50 dark:bg-[#60A5FA]/15 border-blue-200 dark:border-[#60A5FA]/30 text-blue-600 dark:text-[#60A5FA]'
                : 'bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06]'
              }`}
            title="System Alerts & Notifications"
            aria-label="View notifications"
          >
            <Bell size={16} className={validAlertCount > 0 ? 'text-[#EF4444] dark:text-[#F87171] animate-bounce-subtle' : ''} />
            {validAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] dark:bg-[#F87171] flex items-center justify-center text-[9px] font-bold text-white shadow-md">
                {validAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-88 p-4 rounded-2xl bg-white dark:bg-[#0B1728]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-2xl z-50 space-y-3 text-slate-800 dark:text-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-blue-500 dark:text-[#60A5FA]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Alert Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-[#F87171]/20 text-rose-600 dark:text-[#F87171] font-bold border border-rose-200 dark:border-[#F87171]/30">
                    {validAlertCount} active
                  </span>
                  {/* Dedicated Close / Wrong (X) Button */}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-500 dark:text-[#94A3B8] flex items-center justify-center cursor-pointer transition-colors"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {validAlerts.length === 0 ? (
                <div className="py-6 text-center">
                  <Check size={20} className="text-[#10B981] dark:text-[#34D399] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">All Systems Normal</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#64748B]">No active breaches or anomalies</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {validAlerts.map((a) => (
                    <div
                      key={a._id || a.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs flex items-start gap-2.5"
                    >
                      <AlertTriangle size={14} className="text-rose-500 dark:text-[#F87171] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-[#F87171]">
                            {a.parameter} · {a.severity}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-[#64748B] font-mono">
                            {formatRelativeTime(a.triggered_at || a.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-[#E2E8F0] leading-snug">{a.message}</p>
                      </div>
                      {onResolveAlert && (a._id || a.id) && (
                        <button
                          type="button"
                          onClick={() => onResolveAlert(a._id || a.id)}
                          className="p-1 rounded bg-slate-200/80 hover:bg-emerald-100 dark:bg-white/[0.05] dark:hover:bg-[#34D399]/20 text-slate-600 hover:text-emerald-600 dark:text-[#94A3B8] dark:hover:text-[#34D399] transition-all cursor-pointer"
                          title="Resolve alert"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <Link
                  to="/dashboard/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-blue-600 dark:text-[#60A5FA] hover:underline flex items-center gap-1 font-semibold"
                >
                  View full logs <ChevronRight size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#94A3B8] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile / User Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
            {user?.role === 'admin' ? (
              <ShieldCheck size={14} className="text-blue-500 dark:text-[#60A5FA]" />
            ) : (
              <UserCheck size={14} className="text-[#059669] dark:text-[#34D399]" />
            )}
            <span className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[100px]">
              {user?.email ? user.email.split('@')[0] : 'Operator'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

