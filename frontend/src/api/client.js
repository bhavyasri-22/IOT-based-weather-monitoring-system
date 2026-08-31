const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || res.statusText), { status: res.status, data });
  return data;
}

// Auth
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
};

// Telemetry
export const telemetryApi = {
  latest: (deviceId) =>
    request(`/telemetry/latest${deviceId ? `?device_id=${deviceId}` : ''}`),
  history: (deviceId, metric, range = '1h', limit = 100) =>
    request(`/telemetry/history?device_id=${deviceId}&metric=${metric}&range=${range}&limit=${limit}`),
};

// Devices
export const devicesApi = {
  list: () => request('/devices/status'),
  health: () => request('/devices/health'),
  single: (deviceId) => request(`/devices/${deviceId}`),
};

// Alerts
export const alertsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ''}`);
  },
  active: () => request('/alerts/active'),
  resolve: (alertId) => request(`/alerts/${alertId}/resolve`, { method: 'PUT' }),
};

// Thresholds / Config
export const configApi = {
  thresholds: () => request('/config/thresholds'),
  updateThreshold: (parameter, updates) =>
    request(`/config/thresholds/${parameter}`, { method: 'PUT', body: JSON.stringify(updates) }),
};

// System Health
export const systemApi = {
  health: () => request('/health'),
};
