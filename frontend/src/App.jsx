import React, { useState, useCallback, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import Analytics from './pages/Analytics';
import History from './pages/History';
import AlertsPage from './pages/AlertsPage';
import DevicesPage from './pages/DevicesPage';
import AdminConfig from './pages/AdminConfig';

import useWebSocket from './hooks/useWebSocket';
import useTelemetry from './hooks/useTelemetry';
import useAlerts from './hooks/useAlerts';
import { devicesApi, authApi } from './api/client';

const ACTIVITY_MAX = 50;
let _eid = 0;
function nextId() { return ++_eid; }

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    const token = localStorage.getItem('auth_token');
    return token ? { email: 'operator@station.local', role: 'operator' } : null;
  });

  // Off-canvas sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Verify and refresh user role on startup
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.me().then((res) => {
        const u = res?.data || res;
        if (u && u.role) {
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
        }
      }).catch(() => {});
    }
  }, []);

  // Primary device context
  const [deviceId, setDeviceId] = useState('ESP32_SURATHKAL_01');
  const [deviceStatus, setDeviceStatus] = useState('online');

  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);

  const pushActivity = useCallback((type, title, subtitle = '') => {
    setActivityFeed((prev) => [
      { id: nextId(), type, title, subtitle, timestamp: new Date() },
      ...prev.slice(0, ACTIVITY_MAX - 1),
    ]);
  }, []);

  // Telemetry hook
  const {
    latest: telemetry,
    lastUpdated,
    updateFromWebSocket: updateTelemetry,
  } = useTelemetry(deviceId);

  // Alerts hook
  const {
    activeAlerts,
    addAlert,
    resolveAlert,
    manualResolve,
  } = useAlerts();

  // WebSocket event handler
  const handleWsEvent = useCallback((msg) => {
    const { event, data } = msg;
    switch (event) {
      case 'telemetry:new':
        updateTelemetry(data);
        pushActivity('telemetry', 'Telemetry ingested', `${data.device_id || 'Node'} · ${data.temperature != null ? `${Number(data.temperature).toFixed(1)}°C` : ''}`);
        if (data.device_id && deviceId === data.device_id) {
          setDeviceStatus('online');
        }
        break;
      case 'alert:new':
        addAlert(data);
        pushActivity('alert', data.message, `${data.device_id} · ${data.severity?.toUpperCase()}`);
        break;
      case 'alert:resolved':
        resolveAlert(data);
        pushActivity('alert_resolved', `Alert resolved: ${data.parameter}`, data.device_id);
        break;
      case 'device:status':
        if (data.device_id === deviceId) {
          setDeviceStatus(data.status);
        }
        pushActivity('device', `Device ${data.status}: ${data.device_id}`, '');
        break;
      case 'connection:established':
        pushActivity('heartbeat', 'WebSocket synchronized', 'Real-time telemetry channel established');
        break;
      default:
        break;
    }
  }, [deviceId, updateTelemetry, addAlert, resolveAlert, pushActivity]);

  const { connectionState: wsState } = useWebSocket(user ? handleWsEvent : null);

  // Fetch primary device on login
  useEffect(() => {
    if (!user) return;
    devicesApi.list().then((data) => {
      const nodes = data?.data || data || [];
      if (Array.isArray(nodes) && nodes.length > 0) {
        const primary = nodes[0];
        setDeviceId(primary.device_id);
        setDeviceStatus(primary.status || 'online');
      }
    }).catch(() => {});
  }, [user]);

  const handleLogin = useCallback((u) => setUser(u), []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const sharedProps = {
    telemetry,
    deviceId,
    deviceStatus,
    wsState,
    lastUpdated,
    activeAlerts,
    onResolveAlert: manualResolve,
    activityFeed,
    user,
  };

  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col bg-[#07111F] text-[#F1F5F9] relative selection:bg-[#60A5FA]/20 selection:text-white">
        {/* Off-Canvas Navigation Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          deviceStatus={deviceStatus}
          wsState={wsState}
          user={user}
          onLogout={handleLogout}
          activeAlertCount={activeAlerts.length}
          lastUpdated={lastUpdated}
        />

        {/* Top Header with Hamburger ☰ trigger */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          deviceId={deviceId}
          deviceStatus={deviceStatus}
          wsState={wsState}
          lastUpdated={lastUpdated}
          activeAlertCount={activeAlerts.length}
          activeAlerts={activeAlerts}
          onResolveAlert={manualResolve}
          user={user}
          onLogout={handleLogout}
        />

        {/* Full-Width Main Viewport */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard {...sharedProps} />} />
            <Route path="/live" element={<LiveMonitor {...sharedProps} />} />
            <Route path="/analytics" element={<Analytics {...sharedProps} />} />
            <Route path="/devices" element={<DevicesPage user={user} />} />
            <Route path="/alerts" element={<AlertsPage user={user} onResolve={manualResolve} />} />
            <Route path="/history" element={<History deviceId={deviceId} />} />
            <Route path="/admin" element={<AdminConfig user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
