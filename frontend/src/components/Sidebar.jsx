import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Cpu,
  Bell,
  Clock,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function Sidebar({
  isOpen,
  onClose,
  deviceStatus,
  wsState,
  user,
  onLogout,
  activeAlertCount = 0,
  lastUpdated,
}) {
  const isOnline = deviceStatus === 'online';
  const wsConnected = wsState === 'connected';

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Remove Admin Config for user/operator role
  const navItems = [
    { to: '/dashboard',           icon: LayoutDashboard, label: 'Overview',   end: true },
    { to: '/dashboard/live',      icon: Radio,           label: 'Live Monitor' },
    { to: '/dashboard/analytics', icon: BarChart3,       label: 'Analytics' },
    { to: '/dashboard/devices',   icon: Cpu,             label: 'Sensors' },
    { to: '/dashboard/alerts',    icon: Bell,            label: 'Alerts', badge: activeAlertCount > 0 ? activeAlertCount : null },
    { to: '/dashboard/history',   icon: Clock,           label: 'History' },
    ...(user?.role === 'admin' ? [{ to: '/dashboard/admin', icon: Settings, label: 'Admin Config' }] : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0D3563]/40 backdrop-blur-sm"
          />

          {/* Off-Canvas Navigation Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-[265px] max-w-[85vw] bg-white border-r border-slate-200 backdrop-blur-2xl shadow-2xl flex flex-col justify-between text-slate-800"
          >
            {/* Top Branding & Close Header */}
            <div>
              <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs border border-slate-200">
                    <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-widest uppercase">Atmos</h2>
                    <p className="text-[10px] text-slate-500 font-medium tracking-tight">Environmental Monitoring</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer shadow-xs"
                  aria-label="Close Sidebar"
                  title="Close Menu (Esc)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Links with Stagger */}
              <nav className="p-3 space-y-1 mt-2">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 border-l-blue-600 border-t border-r border-b border-transparent shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <Icon
                                size={16}
                                className={`transition-colors ${
                                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>

                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F87171] text-white shadow-xs">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Bottom Status & User */}
            <div className="p-4 border-t border-slate-200/80 space-y-3">
              {/* System Connection Health Badge */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline || wsConnected ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#EF4444]'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-slate-800">
                      {isOnline || wsConnected ? 'System Online' : 'System Offline'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-blue-600">v2.4</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-3.5">
                  Last sync: {formatRelativeTime(lastUpdated)}
                </p>
              </div>

              {/* User / Sign out */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                    {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {user?.username || (user?.email ? user.email.split('@')[0] : 'User')}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'operator'}</p>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
