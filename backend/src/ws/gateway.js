const WebSocket = require('ws');

class WebSocketGateway {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.pingInterval = null;
  }

  /**
   * Initializes WebSocket server attached to Express/HTTP server instance
   * @param {Object} server - Node http.Server instance
   */
  init(server) {
    if (this.wss) {
      console.log('[WebSocket Gateway] Already initialized.');
      return;
    }

    console.log('[WebSocket Gateway] Initializing WebSocket Server...');

    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      ws.isAlive = true;
      this.clients.add(ws);

      const clientIp = req.socket.remoteAddress;
      console.log(`[WebSocket Gateway] 🔌 Client connected from ${clientIp}. Total connected clients: ${this.clients.size}`);

      // Handle ping-pong heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send connection acknowledgement
      this.sendToClient(ws, 'connection:established', {
        message: 'Connected to Weather Station Real-Time Event Gateway',
        connected_clients: this.clients.size
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket Gateway] 🔌 Client disconnected. Remaining connected clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error(`[WebSocket Gateway] Client socket error: ${err.message}`);
        this.clients.delete(ws);
      });
    });

    // 30s Heartbeat ping to clear stale/dead connection sockets (SRS F.10)
    this.pingInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    if (this.pingInterval && typeof this.pingInterval.unref === 'function') {
      this.pingInterval.unref();
    }
  }

  /**
   * Helper to send event envelope to single client
   */
  sendToClient(ws, event, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data
      });
      ws.send(payload);
    }
  }

  /**
   * Broadcasts JSON event envelope to all connected WebSocket clients
   * @param {string} event - Event name ('telemetry:new', 'alert:new', 'alert:resolved', 'device:status')
   * @param {Object} data - Event payload payload
   */
  broadcast(event, data) {
    if (!this.clients || this.clients.size === 0) {
      return;
    }

    const payloadStr = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data
    });

    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadStr);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`[WebSocket Gateway] 📡 Broadcast event '${event}' to ${sentCount} client(s).`);
    }
  }

  /** Broadcast new valid telemetry ingest event */
  broadcastTelemetry(telemetryData) {
    this.broadcast('telemetry:new', telemetryData);
  }

  /** Broadcast new active alert event */
  broadcastAlert(alertData) {
    this.broadcast('alert:new', alertData);
  }

  /** Broadcast alert resolution event */
  broadcastAlertResolved(alertData) {
    this.broadcast('alert:resolved', alertData);
  }

  /** Broadcast node health/connectivity status change */
  broadcastDeviceStatus(deviceId, status, metadata = {}) {
    this.broadcast('device:status', {
      device_id: deviceId,
      status,
      last_seen: new Date().toISOString(),
      ...metadata
    });
  }

  /** Closes WebSocket Server */
  close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      console.log('[WebSocket Gateway] Gateway server closed.');
    }
  }
}

module.exports = new WebSocketGateway();
