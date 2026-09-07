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
  CloudSun,
  LogOut,
  ShieldCheck,
  UserCheck
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

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/live', icon: Radio, label: 'Live Monitor' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/devices', icon: Cpu, label: 'Sensors' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: activeAlertCount > 0 ? activeAlertCount : null },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/admin', icon: Settings, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Dark Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Off-Canvas Navigation Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[260px] max-w-[85vw] bg-[#091525]/95 border-r border-white/[0.08] backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            {/* Top Branding & Close Header */}
            <div>
              <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                    <CloudSun size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase">Atmos</h2>
                    <p className="text-[10px] text-[#64748B] font-medium tracking-tight">Environmental Monitoring</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors"
                  aria-label="Close Sidebar"
                >
                  <X size={14} />
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
                              ? 'bg-[#60A5FA]/10 text-white font-semibold border-l-2 border-l-[#60A5FA] border-t border-r border-b border-transparent shadow-sm'
                              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <Icon
                                size={16}
                                className={`transition-colors ${
                                  isActive ? 'text-[#60A5FA]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>

                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F87171] text-white shadow-sm">
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
            <div className="p-4 border-t border-white/[0.08] space-y-3">
              {/* System Connection Health Badge */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline || wsConnected ? 'bg-[#34D399] shadow-[0_0_8px_#34D399]' : 'bg-[#F87171]'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-white">
                      {isOnline || wsConnected ? 'System Online' : 'System Offline'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#60A5FA]">v2.4</span>
                </div>
                <p className="text-[10px] text-[#64748B] pl-3.5">
                  Last sync: {formatRelativeTime(lastUpdated)}
                </p>
              </div>

              {/* User / Sign out */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-[#94A3B8] text-xs font-bold">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.email ? user.email.split('@')[0] : 'Operator'}
                    </p>
                    <p className="text-[10px] text-[#64748B] capitalize">{user?.role || 'operator'}</p>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#F87171]/20 hover:text-[#F87171] text-[#64748B] transition-colors"
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
