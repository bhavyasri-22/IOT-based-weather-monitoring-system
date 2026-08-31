import { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../api/client';

/**
 * Manages active and resolved alert state.
 * - Fetches active alerts on mount and every 30 seconds.
 * - Exposes `addAlert(alert)` and `resolveAlert(alert)` for real-time WS updates.
 */
export default function useAlerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActive = useCallback(async () => {
    try {
      const data = await alertsApi.active();
      const alerts = data?.data || data || [];
      setActiveAlerts(Array.isArray(alerts) ? alerts : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const addAlert = useCallback((alert) => {
    setActiveAlerts((prev) => {
      // Prevent duplicate alerts already in state
      const exists = prev.some((a) => a._id === alert._id);
      if (exists) return prev;
      return [alert, ...prev];
    });
  }, []);

  const resolveAlert = useCallback((alert) => {
    setActiveAlerts((prev) => prev.filter((a) => a._id !== alert._id));
  }, []);

  const manualResolve = useCallback(async (alertId) => {
    try {
      await alertsApi.resolve(alertId);
      setActiveAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      // Silently fail - UI can show toast separately
    }
  }, []);

  return {
    activeAlerts,
    loading,
    error,
    addAlert,
    resolveAlert,
    manualResolve,
    refetch: fetchActive,
  };
}
