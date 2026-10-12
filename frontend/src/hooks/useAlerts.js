import { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../api/client';

/**
 * Manages active and resolved alert state and unread notification badge state.
 * - Fetches active alerts and unread count on mount and every 30 seconds.
 * - Exposes real-time event handlers: addAlert, resolveAlert, markAllAsRead, markAsRead.
 */
export default function useAlerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveAndUnread = useCallback(async () => {
    try {
      const [alertsRes, unreadRes] = await Promise.allSettled([
        alertsApi.active(),
        alertsApi.unreadCount()
      ]);

      if (alertsRes.status === 'fulfilled') {
        const data = alertsRes.value;
        const alerts = data?.data || data || [];
        setActiveAlerts(Array.isArray(alerts) ? alerts : []);
      }

      if (unreadRes.status === 'fulfilled') {
        const data = unreadRes.value;
        setUnreadCount(typeof data?.count === 'number' ? data.count : 0);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveAndUnread();
    const interval = setInterval(fetchActiveAndUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveAndUnread]);

  const addAlert = useCallback((alert) => {
    setActiveAlerts((prev) => {
      // Prevent duplicate alerts already in state
      const exists = prev.some((a) => (a._id || a.id) === (alert._id || alert.id));
      if (exists) return prev;
      return [alert, ...prev];
    });

    // If incoming alert is unread, immediately increment unread badge count
    if (!alert.is_read) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const resolveAlert = useCallback((alert) => {
    const alertId = alert._id || alert.id;
    setActiveAlerts((prev) => {
      const target = prev.find((a) => (a._id || a.id) === alertId);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((a) => (a._id || a.id) !== alertId);
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await alertsApi.markAllRead();
      setUnreadCount(0);
      setActiveAlerts((prev) =>
        prev.map((a) => ({ ...a, is_read: true, read_at: new Date() }))
      );
    } catch (err) {
      console.warn('[useAlerts] Failed to mark alerts as read on server:', err.message);
    }
  }, []);

  const markAsRead = useCallback(async (alertId) => {
    try {
      const res = await alertsApi.markRead(alertId);
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      } else {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setActiveAlerts((prev) =>
        prev.map((a) =>
          (a._id || a.id) === alertId ? { ...a, is_read: true, read_at: new Date() } : a
        )
      );
    } catch (err) {
      console.warn('[useAlerts] Failed to mark alert as read on server:', err.message);
    }
  }, []);

  const manualResolve = useCallback(async (alertId) => {
    try {
      await alertsApi.resolve(alertId);
      setActiveAlerts((prev) => {
        const target = prev.find((a) => (a._id || a.id) === alertId);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((a) => (a._id || a.id) !== alertId);
      });
    } catch (err) {
      // Silently fail - UI can show toast separately
    }
  }, []);

  return {
    activeAlerts,
    unreadCount,
    loading,
    error,
    addAlert,
    resolveAlert,
    markAllAsRead,
    markAsRead,
    manualResolve,
    refetch: fetchActiveAndUnread,
  };
}
