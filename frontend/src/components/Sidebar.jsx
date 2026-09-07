import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  History,
  BellRing,
  Cpu,
  Settings,
  CloudSun,
  Radio,
  LogOut,
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
        isActive
          ? 'bg-[#1A212B] text-[#F1F5F9] border border-[#2D3947]'
          : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#151B23]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#38BDF8] rounded-r-full" />
        )}
        <Icon size={15} strokeWidth={1.8} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

const NavSection = ({ title, children }) => (
  <div className="mb-1">
    <p className="px-3 py-2 text-[10px] font-semibold tracking-widest text-[#3A4654] uppercase">
      {title}
    </p>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

export default function Sidebar({ deviceStatus, wsState, user, onLogout }) {
  const isOnline = deviceStatus === 'online';
  const wsConnected = wsState === 'connected';

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col border-r border-[#1A212B] z-30"
      style={{ width: 228, backgroundColor: '#0D1117' }}
    >
      {/* Branding */}
      <div className="px-4 py-5 border-b border-[#1A212B]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-md bg-[#1A212B] border border-[#26303B] flex items-center justify-center flex-shrink-0">
            <CloudSun size={14} className="text-[#38BDF8]" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#F1F5F9] tracking-wide leading-tight">WEATHER</div>
            <div className="text-xs font-semibold text-[#F1F5F9] tracking-wide leading-tight">STATION</div>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#151B23] border border-[#26303B]">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
            style={
              isOnline
                ? { boxShadow: '0 0 6px #22C55E88' }
                : { boxShadow: '0 0 6px #EF444488' }
            }
          />
          <span className={`text-[10px] font-semibold tracking-wider ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            SYSTEM {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* WS Connection */}
        <div className="flex items-center gap-2 mt-1.5 px-2.5 py-1 rounded-md bg-[#0B0F14]">
          <Radio size={10} className={wsConnected ? 'text-[#22C55E]' : 'text-[#64748B]'} />
          <span className={`text-[10px] tracking-wider font-medium ${wsConnected ? 'text-[#22C55E]' : 'text-[#64748B]'}`}>
            {wsConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <NavSection title="Overview">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
        </NavSection>

        <NavSection title="Monitoring">
          <NavItem to="/live" icon={Activity} label="Live Monitor" />
          <NavItem to="/history" icon={History} label="History" />
        </NavSection>

        <NavSection title="System">
          <NavItem to="/alerts" icon={BellRing} label="Alerts" />
          <NavItem to="/devices" icon={Cpu} label="Devices" />
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-[#1A212B] pt-3 space-y-1">
        <NavItem to="/admin" icon={Settings} label="Admin Config" />
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#EF4444] hover:bg-[#151B23] transition-colors"
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>
        )}
        <p className="mt-2 px-2 text-[10px] text-[#3A4654]">
          ESP32 IoT Weather Station
        </p>
      </div>
    </aside>
  );
}
