require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mqttSubscriber = require('./mqtt/subscriber');
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
app.use(cors());
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

let server = null;

// Initialize Database, MQTT Consumer Pipeline & Scheduled Background Jobs
async function startServer() {
  await connectDB();
  mqttSubscriber.init();
  
  // Start scheduled background job for device offline detection (SRS F.11)
  startOfflineDetectionJob();

  server = app.listen(PORT, () => {
    console.log(`[Backend Ingestion Server] Server running on port ${PORT}`);
  });
}

function shutdown() {
  console.log('[Backend Ingestion Server] Gracefully shutting down...');
  stopOfflineDetectionJob();
  mqttSubscriber.disconnect();
  if (server) {
    server.close(() => {
      console.log('[Backend Ingestion Server] HTTP server closed.');
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

module.exports = { app, startServer, shutdown };
