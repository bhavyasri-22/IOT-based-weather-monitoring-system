const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Global HTTP request wrapper with centralized 401/403/error handling
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const error = new Error('Network error: Unable to communicate with weather monitoring backend service.');
    error.status = 0;
    error.isNetworkError = true;
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 Unauthorized Handling
    if (res.status === 401) {
      // If it's the login endpoint, don't trigger session expiry flow
      if (path.startsWith('/auth/login')) {
        const error = new Error(data.error || 'Invalid username/email or password');
        error.status = 401;
        error.data = data;
        throw error;
      }

      // For any other protected endpoint, session is expired/invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Dispatch event so React router/App can catch and redirect cleanly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
      }

      const error = new Error('Your session has expired. Please log in again.');
      error.status = 401;
      error.isSessionExpired = true;
      throw error;
    }

    // 403 Forbidden Handling
    if (res.status === 403) {
      const error = new Error(data.error || 'You do not have permission to perform this action.');
      error.status = 403;
      error.data = data;
      throw error;
    }

    // Generic error handling
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth Endpoints ─────────────────────────────────────────────
export const authApi = {
  login: (identifier, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: identifier, email: identifier, password })
    }),
  register: (identifier, password, role = 'operator', email) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: identifier, email: email || identifier, password, role })
    }),
  me: () => request('/auth/me'),
  users: () => request('/auth/users'),
};

// ── Telemetry Endpoints ────────────────────────────────────────
export const telemetryApi = {
  latest: (deviceId) =>
    request(`/telemetry/latest${deviceId ? `?device_id=${deviceId}&deviceId=${deviceId}` : ''}`),
  history: (deviceId, metric, range = '1h', limit = 100) =>
    request(`/telemetry/history?device_id=${deviceId}&deviceId=${deviceId}&metric=${metric}&range=${range}&limit=${limit}`),
};

// ── Devices Endpoints ──────────────────────────────────────────
export const devicesApi = {
  list: () => request('/devices/status'),
  health: () => request('/devices/health'),
  single: (deviceId) => request(`/devices/${deviceId}`),
  create: (deviceData) => request('/devices', { method: 'POST', body: JSON.stringify(deviceData) }),
  delete: (deviceId) => request(`/devices/${deviceId}`, { method: 'DELETE' }),
  updateKey: (deviceId, apiKey) => request(`/devices/${deviceId}/key`, { method: 'PUT', body: JSON.stringify({ apiKey }) }),
};

// ── Alerts Endpoints ───────────────────────────────────────────
export const alertsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ''}`);
  },
  active: () => request('/alerts/active'),
  resolve: (alertId) => request(`/alerts/${alertId}/resolve`, { method: 'PUT' }),
};

// ── Configuration & Thresholds Endpoints ──────────────────────
export const configApi = {
  thresholds: () => request('/config/thresholds'),
  updateThreshold: (parameter, updates) =>
    request(`/config/thresholds/${parameter}`, { method: 'PUT', body: JSON.stringify(updates) }),
};

// ── System Health ──────────────────────────────────────────────
export const systemApi = {
  health: () => request('/health'),
};
