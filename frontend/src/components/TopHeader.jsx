import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Clock,
  MapPin,
  LogOut,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  AlertTriangle,
  Check,
  LogIn
} from 'lucide-react';
import useUserLocation from '../hooks/useUserLocation';
import { formatRelativeTime } from '../utils/weatherUtils';

const PAGE_TITLES = {
  '/dashboard':           { title: 'Environmental Overview',              subtitle: 'Live Weather Station Gateway' },
  '/dashboard/live':      { title: 'Real-time Telemetry Monitor',         subtitle: 'Direct Node Data Ingestion' },
  '/dashboard/analytics': { title: 'Historical Environmental Analytics',  subtitle: 'Longitudinal Trend Correlator' },
  '/dashboard/devices':   { title: 'Hardware Node Registry',              subtitle: 'Sensor Infrastructure Health' },
  '/dashboard/alerts':    { title: 'Safety Alerts & Incidents',           subtitle: 'Automated Threshold System' },
  '/dashboard/history':   { title: 'Telemetry Logs Archive',              subtitle: 'Historical Weather Observations' },
  '/dashboard/admin':     { title: 'Administrator Control Panel',         subtitle: 'System & Parameter Calibration' },
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
  unreadCount = 0,
  onMarkAllAsRead,
  onResolveAlert,
  user,
  onLogout,
}) {
  const location = useLocation();
  const userLoc = useUserLocation();
  const [clockTime, setClockTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const isWsConnected = wsState === 'connected';

  // Live system clock updater
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = PAGE_TITLES[location.pathname] || {
    title: 'IoT Weather Console',
    subtitle: 'Real-time Environmental Monitoring',
  };

  const handleToggleNotifications = () => {
    if (!showNotifications && typeof onMarkAllAsRead === 'function') {
      onMarkAllAsRead();
    }
    setShowNotifications((prev) => !prev);
  };

  // Close flyout when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validAlerts = Array.isArray(activeAlerts) ? activeAlerts : [];
  const validAlertCount = validAlerts.length;

  return (
    <header
      className="sticky top-0 z-40 w-full px-5 sm:px-8 py-3 bg-white/97 backdrop-blur-2xl border-b border-slate-200 shadow-sm transition-colors"
    >
      <div className="flex items-center justify-between gap-4">

        {/* ── LEFT: Hamburger + Title block ── */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Hamburger */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
            aria-label="Toggle Navigation Drawer"
            title={isSidebarOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isSidebarOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          {/* Title + subtitle + last login pill */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              IOT – Weather Monitoring System
            </h1>

            <p className="text-sm text-slate-500 hidden sm:block leading-tight font-medium">
              {meta.subtitle}
            </p>

            {/* Last login highlighted pill — own row, never overflows */}
            {user?.previous_login_at && (
              <div className="hidden sm:inline-flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 shadow-sm w-fit">
                <LogIn size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
                  Last login:&nbsp;
                  <time
                    dateTime={user.previous_login_at}
                    title={new Date(user.previous_login_at).toLocaleString()}
                    className="font-bold text-blue-900"
                  >
                    {new Date(user.previous_login_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </time>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Status pills + actions ── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* Location */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            <MapPin size={15} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
              {userLoc.city || 'Detecting...'}
            </span>
          </div>

          {/* Live status + clock */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            {isWsConnected ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse flex-shrink-0" />
                <span className="text-sm font-bold tracking-wider text-emerald-600">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                <span className="text-sm font-bold tracking-wider text-amber-600 whitespace-nowrap">Reconnecting...</span>
              </div>
            )}

            <span className="hidden sm:inline w-px h-4 bg-slate-300 mx-1" />

            <div className="hidden sm:flex items-center gap-1.5 font-mono">
              <Clock size={14} className="text-slate-400" />
              <span className="text-sm text-slate-600 tabular-nums">{clockTime}</span>
            </div>
          </div>

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                showNotifications || unreadCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="System Alerts & Notifications"
              aria-label="View notifications"
            >
              <Bell size={18} className={unreadCount > 0 ? 'text-rose-500' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
            {showNotifications && (
              <div
                className="absolute right-0 w-80 sm:w-96 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl backdrop-blur-2xl z-50 space-y-3 text-slate-800"
                style={{ top: 'calc(100% + 8px)' }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Alert Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                      {validAlertCount} total
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Close"
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {validAlerts.length === 0 ? (
                  <div className="py-6 text-center">
                    <Check size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-900">You're all caught up!</p>
                    <p className="text-xs text-slate-500 mt-0.5">No active alerts or sensor warnings</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {validAlerts.map((a) => (
                      <div
                        key={a._id || a.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                      >
                        <AlertTriangle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold uppercase text-rose-600">
                              {a.parameter} · {a.severity}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {formatRelativeTime(a.triggered_at || a.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-snug">{a.message}</p>
                        </div>
                        {user?.role === 'admin' && onResolveAlert && (a._id || a.id) && (
                          <button
                            type="button"
                            onClick={() => onResolveAlert(a._id || a.id)}
                            className="p-1.5 rounded bg-slate-200 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 transition-all cursor-pointer flex-shrink-0"
                            title="Resolve alert"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <Link
                    to="/dashboard/alerts"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View full logs <ChevronRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            {user?.role === 'admin' ? (
              <ShieldCheck size={17} className="text-blue-500" />
            ) : (
              <UserCheck size={17} className="text-emerald-600" />
            )}
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[130px]">
              {user?.username || (user?.email ? user.email.split('@')[0] : 'User')}
            </span>
          </div>

          {/* Logout */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
