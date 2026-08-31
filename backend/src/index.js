require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mqttSubscriber = require('./mqtt/subscriber');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware setup
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Weather Ingestion Backend Service',
    timestamp: new Date().toISOString()
  });
});

// Initialize Database & MQTT Consumer Pipeline
async function startServer() {
  await connectDB();
  mqttSubscriber.init();

  app.listen(PORT, () => {
    console.log(`[Backend Ingestion Server] Server running on port ${PORT}`);
  });
}

startServer();
