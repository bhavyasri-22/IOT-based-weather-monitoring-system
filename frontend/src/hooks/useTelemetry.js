import { useState, useEffect, useCallback } from 'react';
import { telemetryApi } from '../api/client';

/**
 * Manages current sensor telemetry state.
 * - Polls latest telemetry on mount from REST API.
 * - Exposes `updateFromWebSocket(data)` for real-time WS updates.
 * - Fetches historical chart data per metric and time range.
 */
export default function useTelemetry(deviceId) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ metric: 'temperature', range: '1h' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await telemetryApi.latest(deviceId);
      const raw = res?.data !== undefined ? res.data : res;
      const reading = Array.isArray(raw) ? (raw.length > 0 ? raw[0] : null) : raw;
      if (reading && typeof reading === 'object' && !Array.isArray(reading)) {
        setLatest(reading);
        setLastUpdated(reading.timestamp || reading.createdAt || new Date());
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const fetchHistory = useCallback(async (metric = 'temperature', range = '1h') => {
    if (!deviceId) return;
    try {
      const data = await telemetryApi.history(deviceId, metric, range, 200);
      const readings = data?.data || data || [];
      setHistory(Array.isArray(readings) ? readings : []);
      setHistoryMeta({ metric, range });
    } catch (err) {
      setHistory([]);
    }
  }, [deviceId]);

  // Poll latest on mount and every 15 seconds as fallback to WebSocket
  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 15000);
    return () => clearInterval(interval);
  }, [fetchLatest]);

  // Expose imperative update method for WebSocket events
  const updateFromWebSocket = useCallback((wsData) => {
    setLatest(wsData);
    setLastUpdated(new Date());
  }, []);

  return {
    latest,
    history,
    historyMeta,
    loading,
    error,
    lastUpdated,
    fetchHistory,
    updateFromWebSocket,
    refetch: fetchLatest,
  };
}
