import React, { useState, useCallback, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import LandingPage    from './pages/LandingPage';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import LiveMonitor    from './pages/LiveMonitor';
import Analytics      from './pages/Analytics';
import History        from './pages/History';
import AlertsPage     from './pages/AlertsPage';
import DevicesPage    from './pages/DevicesPage';
import AdminConfig    from './pages/AdminConfig';
import Sidebar        from './components/Sidebar';
import TopHeader      from './components/TopHeader';
import Footer         from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';

import useWebSocket  from './hooks/useWebSocket';
import useTelemetry  from './hooks/useTelemetry';
import useAlerts     from './hooks/useAlerts';
import { devicesApi, authApi } from './api/client';

const ACTIVITY_MAX = 50;
let _eid = 0;
function nextId() { return ++_eid; }

// ─── Protected dashboard shell ────────────────────────────────
function DashboardShell({ user, onLogout }) {
  const [deviceId, setDeviceId]       = useState(import.meta.env.VITE_DEFAULT_DEVICE_ID || 'ESP32-NODE-01');
  const [deviceStatus, setDeviceStatus] = useState('online');
  const [activityFeed, setActivityFeed] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pushActivity = useCallback((type, title, subtitle = '') => {
    setActivityFeed((prev) => [
      { id: nextId(), type, title, subtitle, timestamp: new Date() },
      ...prev.slice(0, ACTIVITY_MAX - 1),
    ]);
  }, []);

  const {
    latest: telemetry,
    lastUpdated,
    updateFromWebSocket: updateTelemetry,
  } = useTelemetry(deviceId);

  const { activeAlerts, addAlert, resolveAlert, manualResolve } = useAlerts();

  const handleWsEvent = useCallback((msg) => {
    const { event, data } = msg;
    switch (event) {
      case 'telemetry:new':
        updateTelemetry(data);
        pushActivity(
          'telemetry',
          'Telemetry ingested',
          `${data.device_id || 'Node'} · ${data.temperature != null ? `${Number(data.temperature).toFixed(1)}°C` : ''}`
        );
        if (data.device_id && deviceId === data.device_id) setDeviceStatus('online');
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
        if (data.device_id === deviceId) setDeviceStatus(data.status);
        pushActivity('device', `Device ${data.status}: ${data.device_id}`, '');
        break;
      case 'connection:established':
        pushActivity('heartbeat', 'WebSocket synchronized', 'Real-time telemetry channel established');
        break;
      default: break;
    }
  }, [deviceId, updateTelemetry, addAlert, resolveAlert, pushActivity]);

  const { connectionState: wsState } = useWebSocket(handleWsEvent);

  useEffect(() => {
    devicesApi.list().then((data) => {
      const nodes = data?.data || data || [];
      if (Array.isArray(nodes) && nodes.length > 0) {
        const primary = nodes[0];
        setDeviceId(primary.device_id);
        setDeviceStatus(primary.status || 'online');
      }
    }).catch(() => {});
  }, []);

  const sharedProps = {
    telemetry, deviceId, deviceStatus, wsState,
    lastUpdated, activeAlerts, onResolveAlert: manualResolve,
    activityFeed, user,
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #F5FAFF 0%, #EAF4FF 50%, #E0EFFF 100%)',
        color: '#123B5D',
      }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        deviceStatus={deviceStatus}
        wsState={wsState}
        user={user}
        onLogout={onLogout}
        activeAlertCount={activeAlerts.length}
        lastUpdated={lastUpdated}
      />

      <TopHeader
        onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
        isSidebarOpen={isSidebarOpen}
        deviceId={deviceId}
        deviceStatus={deviceStatus}
        wsState={wsState}
        lastUpdated={lastUpdated}
        activeAlertCount={activeAlerts.length}
        activeAlerts={activeAlerts}
        onResolveAlert={manualResolve}
        user={user}
        onLogout={onLogout}
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/"         element={<Dashboard   {...sharedProps} />} />
          <Route path="/live"     element={<LiveMonitor  {...sharedProps} />} />
          <Route path="/analytics" element={<Analytics   {...sharedProps} />} />
          <Route path="/devices"  element={<DevicesPage user={user} />} />
          <Route path="/alerts"   element={<AlertsPage  user={user} onResolve={manualResolve} />} />
          <Route path="/history"  element={<History      deviceId={deviceId} />} />
          <Route
            path="/admin"
            element={user?.role === 'admin' ? <AdminConfig user={user} /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

// ─── Root app with routing ────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Verify JWT session on startup
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.me()
        .then((res) => {
          const u = res?.data || res;
          if (u && (u.username || u.role)) {
            setUser(u);
            localStorage.setItem('auth_user', JSON.stringify(u));
          }
        })
        .catch((err) => {
          if (err.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        });
    }

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogin = useCallback((u) => {
    setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/"     element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              user
                ? <Navigate to="/dashboard" replace />
                : <Login onLogin={handleLogin} />
            }
          />

          {/* Protected dashboard routes — redirect to /auth if not logged in */}
          <Route
            path="/dashboard/*"
            element={
              user
                ? <DashboardShell user={user} onLogout={handleLogout} />
                : <Navigate to="/auth" replace />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
