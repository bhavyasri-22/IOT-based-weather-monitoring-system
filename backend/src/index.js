require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Aedes = require('aedes');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const mqttSubscriber = require('./mqtt/subscriber');
const wsGateway = require('./ws/gateway');
const { startOfflineDetectionJob, stopOfflineDetectionJob } = require('./deviceHealth/offlineJob');
const devicesRouter = require('./api/devices.routes');
const telemetryRouter = require('./api/telemetry.routes');
const alertsRouter = require('./api/alerts.routes');
const configRouter = require('./api/config.routes');
const authRouter = require('./api/auth.routes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// ── CORS Configuration (Supports multi-origin production deployments) ────────
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';

const corsOptions = {
  origin: corsOrigins === '*' ? '*' : (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin '${origin}' not allowed by policy`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/config', configRouter);
app.use('/api/thresholds', configRouter);

// ── Health Check Endpoints (SRS F.9 & Production Monitoring) ─────────────────
function getHealthPayload() {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mqttStatus = mqttSubscriber.getStatus();

  const isHealthy = dbStatus === 'connected' || mqttStatus.status === 'connected';

  return {
    status: isHealthy ? 'ok' : 'degraded',
    service: 'Weather Ingestion Backend Service',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    mqtt: mqttStatus.status,
    websocket_clients: wsGateway.clients ? wsGateway.clients.size : 0,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };
}

app.get('/health', (req, res) => res.json(getHealthPayload()));
app.get('/api/health', (req, res) => res.json(getHealthPayload()));
app.get('/api/system/health', (req, res) => res.json(getHealthPayload()));

// ── Centralized 404 & Error Handler Middlewares ──────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// ── Embedded MQTT Broker (Optional single-host / testing fallback) ────────────
let aedesInstance = null;
if (process.env.ENABLE_EMBEDDED_BROKER === 'true') {
  aedesInstance = typeof Aedes === 'function' ? Aedes() : new Aedes();
  const mqttWsServer = new WebSocket.Server({ server, path: '/mqtt' });
  mqttWsServer.on('connection', (socket) => {
    const stream = WebSocket.createWebSocketStream(socket);
    aedesInstance.handle(stream);
  });
  aedesInstance.on('client', (client) => {
    console.log(`[Embedded MQTT] Client connected: ${client?.id}`);
  });
  aedesInstance.on('clientDisconnect', (client) => {
    console.log(`[Embedded MQTT] Client disconnected: ${client?.id}`);
  });
  console.log('[Embedded MQTT] Aedes broker attached to HTTP server on /mqtt');
}

// ── Server Bootstrap Pipeline ────────────────────────────────────────────────
async function startServer() {
  await connectDB();
  
  // Attach WebSocket Server to HTTP server on path /ws (SRS F.10)
  wsGateway.init(server);

  // Initialize MQTT Subscriber Pipeline (SRS F.3)
  mqttSubscriber.init();
  
  // Start scheduled background job for device offline detection (SRS F.11)
  startOfflineDetectionJob();

  return new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      console.log(`[Backend Ingestion Server] 🚀 Server running at http://${HOST}:${PORT}`);
      resolve(server);
    });
  });
}

function shutdown() {
  console.log('[Backend Ingestion Server] Gracefully shutting down...');
  stopOfflineDetectionJob();
  mqttSubscriber.disconnect();
  wsGateway.close();
  if (server && server.listening) {
    server.close(() => {
      console.log('[Backend Ingestion Server] HTTP & WebSocket server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer, shutdown, wsGateway };
