import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Custom hook that manages a persistent WebSocket connection to the backend.
 * Provides: connection status, last events for each type, and handler callbacks.
 */
export default function useWebSocket(onEvent) {
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | disconnected | error
  const [lastConnected, setLastConnected] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const onEventRef = useRef(onEvent);

  // Keep callback ref fresh so we don't need to re-create the WS on change
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setConnectionState('connecting');

      ws.onopen = () => {
        setConnectionState('connected');
        setLastConnected(new Date());
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event && onEventRef.current) {
            onEventRef.current(msg);
          }
        } catch (err) {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        setConnectionState('error');
      };

      ws.onclose = () => {
        setConnectionState('disconnected');
        wsRef.current = null;

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30000);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      setConnectionState('error');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // suppress reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { connectionState, lastConnected };
}
