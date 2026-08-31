const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');
const WebSocket = require('ws');

require('dotenv').config();

const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const Threshold = require('../models/Threshold');
const AlertLog = require('../models/AlertLog');

const wsGateway = require('../ws/gateway');
const ingestionService = require('../ingestion/ingestionService');
const { checkOfflineDevices, DEFAULT_OFFLINE_TIMEOUT_MS } = require('../deviceHealth/offlineJob');
const { app } = require('../index');

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_test_phase7';
const TEST_PORT = 5058;
const WS_URL = `ws://127.0.0.1:${TEST_PORT}`;

function logTestStep(stepNumber, title) {
  console.log(`\n========================================`);
  console.log(`[TEST STEP ${stepNumber}] ${title}`);
  console.log(`========================================`);
}

async function runPhase7Tests() {
  console.log('🚀 Starting Phase 7 Real-Time WebSocket Integration Tests...');
  console.log(`Target MongoDB: ${TEST_MONGO_URI}`);

  try {
    await mongoose.connect(TEST_MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected successfully for testing.');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Clear test database collections
  await SensorReading.deleteMany({});
  await DeviceHealth.deleteMany({});
  await Threshold.deleteMany({});
  await AlertLog.deleteMany({});
  console.log('🧹 Cleaned test database collections.');

  // Create HTTP server and initialize WebSocket Gateway
  const httpServer = http.createServer(app);
  wsGateway.init(httpServer);

  await new Promise((resolve) => httpServer.listen(TEST_PORT, resolve));
  console.log(`[Test Server] HTTP & WebSocket Server running on port ${TEST_PORT}`);

  let wsClient = null;
  const receivedMessages = [];

  try {
    // ----------------------------------------------------
    // TEST 1: WebSocket Handshake & Client Connection
    // ----------------------------------------------------
    logTestStep(1, 'Verify WebSocket Client Connection & Handshake');

    wsClient = new WebSocket(WS_URL);

    wsClient.on('message', (rawMsg) => {
      try {
        const parsed = JSON.parse(rawMsg.toString());
        receivedMessages.push(parsed);
      } catch (err) {
        console.error('WS client message parse error:', err.message);
      }
    });

    await new Promise((resolve, reject) => {
      wsClient.on('open', resolve);
      wsClient.on('error', reject);
    });

    // Wait 300ms for connection handshake event
    await new Promise((res) => setTimeout(res, 300));

    const connMsg = receivedMessages.find((m) => m.event === 'connection:established');
    assert.ok(connMsg, 'Client must receive connection:established event upon connecting');
    assert.strictEqual(connMsg.data.connected_clients, 1);
    console.log(`Handshake Received: ${connMsg.data.message}`);

    console.log('✅ TEST 1 PASSED: WebSocket client connected and handshake verified.');

    // ----------------------------------------------------
    // TEST 2: Real-Time Telemetry Event Broadcast (telemetry:new)
    // ----------------------------------------------------
    logTestStep(2, 'Test Real-Time Telemetry Event Broadcast (telemetry:new)');

    receivedMessages.length = 0; // Clear received messages buffer

    const telemetryPayload = {
      device_id: 'ESP32-WS-LIVE-NODE',
      timestamp: new Date().toISOString(),
      temperature: 28.4,
      humidity: 62.0,
      pressure: 1011.2,
      light_lux: 3400.0,
      rain_intensity: 0,
      gas_aqi: 110,
      wind_speed: 4.5
    };

    const startTime = Date.now();
    await ingestionService.processTelemetry(JSON.stringify(telemetryPayload));

    // Wait up to 500ms for WebSocket broadcast receipt
    await new Promise((res) => setTimeout(res, 300));
    const latency = Date.now() - startTime;

    const telemetryEvent = receivedMessages.find((m) => m.event === 'telemetry:new');
    assert.ok(telemetryEvent, 'WS Client must receive telemetry:new broadcast event');
    assert.strictEqual(telemetryEvent.data.device_id, 'ESP32-WS-LIVE-NODE');
    assert.strictEqual(telemetryEvent.data.temperature, 28.4);
    assert.ok(telemetryEvent.data.derived && telemetryEvent.data.derived.heat_index !== null);

    console.log(`Received Event: [${telemetryEvent.event}] Temp=${telemetryEvent.data.temperature}°C, HeatIndex=${telemetryEvent.data.derived.heat_index}°C (Latency: ${latency}ms)`);

    console.log('✅ TEST 2 PASSED: Real-time telemetry broadcast verified.');

    // ----------------------------------------------------
    // TEST 3: Real-Time Alert Broadcast (alert:new)
    // ----------------------------------------------------
    logTestStep(3, 'Test Real-Time Alert Event Broadcast (alert:new)');

    receivedMessages.length = 0;

    const highTempTelemetry = {
      device_id: 'ESP32-WS-LIVE-NODE',
      timestamp: new Date().toISOString(),
      temperature: 37.8, // > warning_max (35)
      humidity: 30.0,
      pressure: 1011.0,
      light_lux: 3500.0,
      rain_intensity: 0,
      gas_aqi: 115,
      wind_speed: 4.8
    };

    await ingestionService.processTelemetry(JSON.stringify(highTempTelemetry));
    await new Promise((res) => setTimeout(res, 300));

    const alertEvent = receivedMessages.find((m) => m.event === 'alert:new' && m.data.parameter === 'temperature');
    assert.ok(alertEvent, 'WS Client must receive alert:new broadcast event for temperature threshold violation');
    assert.strictEqual(alertEvent.data.severity, 'warning');
    assert.strictEqual(alertEvent.data.trigger_value, 37.8);

    console.log(`Received Alert Event: [${alertEvent.event}] ${alertEvent.data.message}`);

    console.log('✅ TEST 3 PASSED: Real-time alert creation broadcast verified.');

    // ----------------------------------------------------
    // TEST 4: Real-Time Alert Resolution Broadcast (alert:resolved)
    // ----------------------------------------------------
    logTestStep(4, 'Test Real-Time Alert Resolution Broadcast (alert:resolved)');

    receivedMessages.length = 0;

    const normalTempTelemetry = {
      device_id: 'ESP32-WS-LIVE-NODE',
      timestamp: new Date().toISOString(),
      temperature: 26.0, // Normal
      humidity: 45.0,
      pressure: 1012.0,
      light_lux: 3000.0,
      rain_intensity: 0,
      gas_aqi: 100,
      wind_speed: 3.0
    };

    await ingestionService.processTelemetry(JSON.stringify(normalTempTelemetry));
    await new Promise((res) => setTimeout(res, 300));

    const resolveEvent = receivedMessages.find((m) => m.event === 'alert:resolved' && m.data.parameter === 'temperature');
    assert.ok(resolveEvent, 'WS Client must receive alert:resolved broadcast event');
    assert.strictEqual(resolveEvent.data.status, 'resolved');

    console.log(`Received Resolution Event: [${resolveEvent.event}] Parameter '${resolveEvent.data.parameter}' resolved.`);

    console.log('✅ TEST 4 PASSED: Real-time alert resolution broadcast verified.');

    // ----------------------------------------------------
    // TEST 5: Device Status & Offline Alert Broadcast (device:status)
    // ----------------------------------------------------
    logTestStep(5, 'Test Device Offline Status & Recovery Broadcasts');

    receivedMessages.length = 0;

    // Create a device inactive for 3 minutes
    const threeMinutesAgo = new Date(Date.now() - (3 * 60 * 1000));
    await DeviceHealth.create({
      device_id: 'ESP32-WS-OFFLINE-NODE',
      status: 'online',
      last_seen: threeMinutesAgo,
      last_seen_timestamp: threeMinutesAgo,
      last_telemetry: threeMinutesAgo,
      firmware_version: '1.0.0'
    });

    await checkOfflineDevices(DEFAULT_OFFLINE_TIMEOUT_MS);
    await new Promise((res) => setTimeout(res, 300));

    const statusOfflineEvent = receivedMessages.find((m) => m.event === 'device:status' && m.data.status === 'offline');
    assert.ok(statusOfflineEvent, 'WS Client must receive device:status offline event');
    assert.strictEqual(statusOfflineEvent.data.device_id, 'ESP32-WS-OFFLINE-NODE');

    const offlineAlertEvent = receivedMessages.find((m) => m.event === 'alert:new' && m.data.alert_type === 'device_offline');
    assert.ok(offlineAlertEvent, 'WS Client must receive alert:new device_offline event');

    console.log(`Device Offline Status Received: ${statusOfflineEvent.data.device_id} is ${statusOfflineEvent.data.status}`);

    // Now send heartbeat to trigger online recovery
    receivedMessages.length = 0;

    await ingestionService.processHeartbeat(JSON.stringify({
      device_id: 'ESP32-WS-OFFLINE-NODE',
      heartbeat_timestamp: new Date().toISOString(),
      status: 'online'
    }));

    await new Promise((res) => setTimeout(res, 300));

    const statusOnlineEvent = receivedMessages.find((m) => m.event === 'device:status' && m.data.status === 'online');
    assert.ok(statusOnlineEvent, 'WS Client must receive device:status online event upon node recovery');

    console.log(`Device Recovery Status Received: ${statusOnlineEvent.data.device_id} is ${statusOnlineEvent.data.status}`);

    console.log('✅ TEST 5 PASSED: Device offline status and recovery broadcasts verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 7 WEBSOCKET TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');

  } finally {
    if (wsClient) wsClient.close();
    wsGateway.close();
    await new Promise((res) => httpServer.close(res));
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test MongoDB & closed WebSocket server.');
  }
}

if (require.main === module) {
  runPhase7Tests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runPhase7Tests;
