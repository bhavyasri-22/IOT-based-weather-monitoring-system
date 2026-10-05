require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
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

// Middleware setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/config', configRouter);
app.use('/api/thresholds', configRouter);

// Health Check Endpoint (SRS F.9)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Weather Ingestion Backend Service',
    timestamp: new Date().toISOString()
  });
});

// Backward-compatible alias for /api/system/health
app.get('/api/system/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Weather Monitoring System',
    timestamp: new Date().toISOString()
  });
});

// Catch-all 404 & Centralized Error Handler Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// ── Embedded MQTT Broker (Aedes over WebSocket) for cloud deployment ──
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

// Initialize Database, MQTT Consumer Pipeline, WebSocket Gateway & Scheduled Background Jobs
async function startServer() {
  await connectDB();
  
  // Attach WebSocket Server to HTTP server (SRS F.10)
  wsGateway.init(server);

  mqttSubscriber.init();
  
  // Start scheduled background job for device offline detection (SRS F.11)
  startOfflineDetectionJob();

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Backend Ingestion Server] Server running on port ${PORT}`);
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
