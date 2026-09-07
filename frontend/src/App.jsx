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
import History from './pages/History';
import AlertsPage from './pages/AlertsPage';
import DevicesPage from './pages/DevicesPage';
import AdminConfig from './pages/AdminConfig';

import useWebSocket from './hooks/useWebSocket';
import useTelemetry from './hooks/useTelemetry';
import useAlerts from './hooks/useAlerts';
import { devicesApi, authApi } from './api/client';

const ACTIVITY_MAX = 50;

// Generate unique IDs for activity events
let _eid = 0;
function nextId() { return ++_eid; }

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    const token = localStorage.getItem('auth_token');
    return token ? { email: 'operator', role: 'operator' } : null;
  });

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

  // Primary device context – picked from device list on mount
  const [deviceId, setDeviceId] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState('unknown');

  // Activity feed (newest-first, bounded list)
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
        pushActivity('telemetry', `Telemetry received`, `${data.device_id} · ${data.temperature != null ? `${Number(data.temperature).toFixed(1)}°C` : 'N/A'}`);
        // Update device status if recovered
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
        pushActivity('heartbeat', 'WebSocket connected', 'Real-time stream active');
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
        setDeviceStatus(primary.status || 'unknown');
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
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0B0F14' }}>
        {/* Sidebar */}
        <Sidebar deviceStatus={deviceStatus} wsState={wsState} user={user} onLogout={handleLogout} />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 228 }}>
          <TopHeader
            deviceId={deviceId}
            deviceStatus={deviceStatus}
            lastUpdated={lastUpdated}
            activeAlertCount={activeAlerts.length}
            user={user}
            onLogout={handleLogout}
          />

          {/* Page scrollable area */}
          <main className="flex-1 overflow-y-auto px-6 py-5">
            {/* WebSocket disconnected banner */}
            {wsState === 'disconnected' && (
              <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1A1200] border border-[#F59E0B33]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                <p className="text-xs text-[#F59E0B]">
                  LIVE CONNECTION LOST — Attempting to reconnect... Last data: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'none'}
                </p>
              </div>
            )}
            {wsState === 'error' && (
              <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1F0F0F] border border-[#EF444433]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <p className="text-xs text-[#EF4444]">WebSocket connection error. Real-time updates unavailable.</p>
              </div>
            )}

            <Routes>
              <Route path="/" element={<Dashboard {...sharedProps} />} />
              <Route path="/live" element={<LiveMonitor {...sharedProps} />} />
              <Route path="/history" element={<History deviceId={deviceId} />} />
              <Route path="/alerts" element={<AlertsPage user={user} onResolve={manualResolve} />} />
              <Route path="/devices" element={<DevicesPage user={user} />} />
              <Route path="/admin" element={<AdminConfig user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
