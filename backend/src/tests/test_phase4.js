const mongoose = require('mongoose');
const aedes = require('aedes');
const net = require('net');
const mqtt = require('mqtt');
const assert = require('assert');

// Load environment variables
require('dotenv').config();

const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const { handleHeartbeat } = require('../deviceHealth/heartbeatHandler');
const { checkOfflineDevices, DEFAULT_OFFLINE_TIMEOUT_MS } = require('../deviceHealth/offlineJob');
const ingestionService = require('../ingestion/ingestionService');

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_test_phase4';
const TEST_MQTT_PORT = 18883;

// Helper to log test progress
function logTestStep(stepNumber, title) {
  console.log(`\n========================================`);
  console.log(`[TEST STEP ${stepNumber}] ${title}`);
  console.log(`========================================`);
}

async function runTests() {
  console.log('🚀 Starting Phase 4 Integration Tests...');
  console.log(`Target MongoDB: ${TEST_MONGO_URI}`);

  // 1. Connect to MongoDB
  try {
    await mongoose.connect(TEST_MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected successfully for testing.');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('Make sure mongod is running on the target port.');
    process.exit(1);
  }

  // Clear previous test collections
  await SensorReading.deleteMany({});
  await DeviceHealth.deleteMany({});
  console.log('🧹 Cleaned test database collections.');

  try {
    // ----------------------------------------------------
    // TEST 1: Collection Schemas and Index Verification
    // ----------------------------------------------------
    logTestStep(1, 'Verify MongoDB Schemas & Indexes');

    // Trigger index creation
    await SensorReading.init();
    await DeviceHealth.init();

    const readingIndexes = await SensorReading.collection.indexes();
    console.log('SensorReading Indexes:', readingIndexes.map(i => i.key));

    const healthIndexes = await DeviceHealth.collection.indexes();
    console.log('DeviceHealth Indexes:', healthIndexes.map(i => i.key));

    const hasCompoundReadingIndex = readingIndexes.some(i => i.key.device_id === 1 && i.key.timestamp === -1);
    assert.ok(hasCompoundReadingIndex, 'SensorReading must have compound index on { device_id: 1, timestamp: -1 }');

    const hasCompoundHealthIndex = healthIndexes.some(i => i.key.status === 1 && i.key.last_seen === 1);
    assert.ok(hasCompoundHealthIndex, 'DeviceHealth must have compound index on { status: 1, last_seen: 1 }');

    console.log('✅ TEST 1 PASSED: Schemas and indexes verified successfully.');

    // ----------------------------------------------------
    // TEST 2: Telemetry Ingestion & Database Persistence
    // ----------------------------------------------------
    logTestStep(2, 'Test Telemetry Ingestion & DB Persistence');

    const sampleTelemetry = {
      device_id: 'ESP32-TEST-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 28.5,
      humidity: 65.0,
      pressure: 1012.4,
      light_lux: 3500.0,
      rain_intensity: 0,
      gas_aqi: 110,
      wind_speed: 4.2
    };

    const telemetryResult = await ingestionService.processTelemetry(JSON.stringify(sampleTelemetry));
    assert.strictEqual(telemetryResult.success, true, 'Telemetry processing should succeed');

    // Verify document in SensorReading collection
    const savedReading = await SensorReading.findOne({ device_id: 'ESP32-TEST-NODE-01' });
    assert.ok(savedReading, 'Telemetry document must be saved in MongoDB');
    assert.strictEqual(savedReading.temperature, 28.5);
    assert.strictEqual(savedReading.humidity, 65.0);
    assert.ok(savedReading.derived && savedReading.derived.heat_index !== null, 'Heat index must be computed');
    console.log(`Saved Reading: Temp=${savedReading.temperature}°C, Hum=${savedReading.humidity}%, HeatIndex=${savedReading.derived.heat_index}°C`);

    // Verify DeviceHealth updated
    const deviceState1 = await DeviceHealth.findOne({ device_id: 'ESP32-TEST-NODE-01' });
    assert.ok(deviceState1, 'DeviceHealth document must exist');
    assert.strictEqual(deviceState1.status, 'online', 'Device status should be online');
    assert.ok(deviceState1.last_seen, 'Device last_seen must be populated');
    assert.ok(deviceState1.last_telemetry, 'Device last_telemetry must be populated');

    console.log('✅ TEST 2 PASSED: Telemetry persisted to MongoDB and DeviceHealth updated.');

    // ----------------------------------------------------
    // TEST 3: Heartbeat Tracking
    // ----------------------------------------------------
    logTestStep(3, 'Test Heartbeat Tracking (DFD 0.3.4)');

    const heartbeatData = {
      device_id: 'ESP32-TEST-NODE-02',
      heartbeat_timestamp: new Date().toISOString(),
      status: 'online'
    };

    await ingestionService.processHeartbeat(JSON.stringify(heartbeatData));

    const deviceState2 = await DeviceHealth.findOne({ device_id: 'ESP32-TEST-NODE-02' });
    assert.ok(deviceState2, 'DeviceHealth document for node 2 must exist');
    assert.strictEqual(deviceState2.status, 'online');
    assert.ok(deviceState2.last_heartbeat, 'last_heartbeat must be recorded');
    assert.ok(deviceState2.last_seen, 'last_seen must be updated');

    console.log('✅ TEST 3 PASSED: Heartbeat ping tracked and persisted.');

    // ----------------------------------------------------
    // TEST 4: Device Offline Detection (SRS F.11, 2-minute timeout)
    // ----------------------------------------------------
    logTestStep(4, 'Test Device Offline Detection (2-Minute Inactivity Threshold)');

    // Create a device that has been inactive for 2.5 minutes (> 120,000 ms)
    const twoAndHalfMinutesAgo = new Date(Date.now() - (2.5 * 60 * 1000));
    await DeviceHealth.create({
      device_id: 'ESP32-STALE-DEVICE',
      status: 'online',
      last_seen: twoAndHalfMinutesAgo,
      last_seen_timestamp: twoAndHalfMinutesAgo,
      last_telemetry: twoAndHalfMinutesAgo,
      firmware_version: '1.0.0'
    });

    console.log('Created stale device ESP32-STALE-DEVICE with last_seen 2.5m ago');

    // Run offline detection check with standard 2-minute timeout (120,000ms)
    const transitioned = await checkOfflineDevices(DEFAULT_OFFLINE_TIMEOUT_MS);
    assert.ok(transitioned.some(d => d.device_id === 'ESP32-STALE-DEVICE'), 'Stale device should be transitioned to offline');

    const staleDeviceAfter = await DeviceHealth.findOne({ device_id: 'ESP32-STALE-DEVICE' });
    assert.strictEqual(staleDeviceAfter.status, 'offline', 'Stale device status must now be offline');

    // Active device should still be online
    const activeDeviceAfter = await DeviceHealth.findOne({ device_id: 'ESP32-TEST-NODE-01' });
    assert.strictEqual(activeDeviceAfter.status, 'online', 'Active device should remain online');

    console.log('✅ TEST 4 PASSED: Device successfully marked OFFLINE after 2 minutes inactivity.');

    // ----------------------------------------------------
    // TEST 5: Online Recovery on New Telemetry / Heartbeat
    // ----------------------------------------------------
    logTestStep(5, 'Test Device Online Recovery');

    console.log('Simulating offline device ESP32-STALE-DEVICE sending new telemetry...');
    const recoveryTelemetry = {
      device_id: 'ESP32-STALE-DEVICE',
      timestamp: new Date().toISOString(),
      temperature: 26.0,
      humidity: 55.0,
      pressure: 1013.0,
      light_lux: 2500.0,
      rain_intensity: 0,
      gas_aqi: 90,
      wind_speed: 2.1
    };

    await ingestionService.processTelemetry(JSON.stringify(recoveryTelemetry));

    const recoveredDevice = await DeviceHealth.findOne({ device_id: 'ESP32-STALE-DEVICE' });
    assert.strictEqual(recoveredDevice.status, 'online', 'Device must transition back to online status');
    console.log(`Device '${recoveredDevice.device_id}' status after recovery: ${recoveredDevice.status}`);

    console.log('✅ TEST 5 PASSED: Offline device recovered back to ONLINE upon receiving new data.');

    // ----------------------------------------------------
    // TEST 6: End-to-End Pipeline (Mock ESP32 -> MQTT Broker -> Backend -> MongoDB)
    // ----------------------------------------------------
    logTestStep(6, 'End-to-End Integration: Mock ESP32 -> MQTT Broker -> Ingestion -> MongoDB');

    // Start in-memory / local Aedes MQTT Broker on test port
    const aedesBroker = require('aedes')();
    const brokerServer = net.createServer(aedesBroker.handle);



    await new Promise((resolve) => {
      brokerServer.listen(TEST_MQTT_PORT, () => {
        console.log(`[Test MQTT Broker] Running on port ${TEST_MQTT_PORT}`);
        resolve();
      });
    });

    // Connect backend MQTT subscriber to test broker
    const subscriberClient = mqtt.connect(`mqtt://127.0.0.1:${TEST_MQTT_PORT}`);
    
    await new Promise((resolve) => {
      subscriberClient.on('connect', () => {
        subscriberClient.subscribe(['weather/telemetry', 'weather/heartbeat'], () => {
          console.log('[Test Subscriber] Subscribed to test MQTT topics');
          resolve();
        });
      });
    });

    subscriberClient.on('message', async (topic, payload) => {
      if (topic === 'weather/telemetry') {
        await ingestionService.processTelemetry(payload);
      } else if (topic === 'weather/heartbeat') {
        await ingestionService.processHeartbeat(payload);
      }
    });

    // Mock ESP32 Publisher
    const mockEsp32Client = mqtt.connect(`mqtt://127.0.0.1:${TEST_MQTT_PORT}`);
    await new Promise((resolve) => mockEsp32Client.on('connect', resolve));
    console.log('[Mock ESP32] Connected to test broker');

    // 6a. Publish telemetry from Mock ESP32
    const e2eTelemetry = {
      device_id: 'ESP32-E2E-LIVE',
      timestamp: new Date().toISOString(),
      temperature: 30.1,
      humidity: 72.0,
      pressure: 1009.5,
      light_lux: 4500.0,
      rain_intensity: 10,
      gas_aqi: 130,
      wind_speed: 6.8
    };

    mockEsp32Client.publish('weather/telemetry', JSON.stringify(e2eTelemetry), { qos: 1 });

    // Wait 500ms for ingestion
    await new Promise(r => setTimeout(r, 500));

    // Verify persisted in MongoDB
    const e2eReading = await SensorReading.findOne({ device_id: 'ESP32-E2E-LIVE' });
    assert.ok(e2eReading, 'E2E telemetry must be saved in MongoDB');
    assert.strictEqual(e2eReading.temperature, 30.1);

    const e2eDevice = await DeviceHealth.findOne({ device_id: 'ESP32-E2E-LIVE' });
    assert.ok(e2eDevice, 'E2E device health must exist');
    assert.strictEqual(e2eDevice.status, 'online');
    console.log('Telemetry received and verified in MongoDB via MQTT pipeline.');

    // 6b. Test device going offline in E2E
    console.log('Simulating device going offline (fast-forwarding last_seen by > 2 minutes)...');
    e2eDevice.last_seen = new Date(Date.now() - (130 * 1000)); // 130 seconds ago
    await e2eDevice.save();

    await checkOfflineDevices(DEFAULT_OFFLINE_TIMEOUT_MS);

    const offlineCheck = await DeviceHealth.findOne({ device_id: 'ESP32-E2E-LIVE' });
    assert.strictEqual(offlineCheck.status, 'offline', 'E2E device should be marked offline');
    console.log('Device successfully timed out and marked OFFLINE.');

    // 6c. Mock ESP32 comes back online and sends heartbeat
    console.log('Mock ESP32 reconnects and publishes heartbeat...');
    const e2eHeartbeat = {
      device_id: 'ESP32-E2E-LIVE',
      heartbeat_timestamp: new Date().toISOString(),
      status: 'online'
    };

    mockEsp32Client.publish('weather/heartbeat', JSON.stringify(e2eHeartbeat), { qos: 0 });

    await new Promise(r => setTimeout(r, 500));

    const onlineCheck = await DeviceHealth.findOne({ device_id: 'ESP32-E2E-LIVE' });
    assert.strictEqual(onlineCheck.status, 'online', 'E2E device should recover back to online');
    console.log('Device successfully recovered back to ONLINE in MongoDB.');

    // Clean up MQTT connections
    mockEsp32Client.end(true);
    subscriberClient.end(true);
    await new Promise(resolve => brokerServer.close(resolve));
    aedesBroker.close();

    console.log('✅ TEST 6 PASSED: End-to-end Mock ESP32 -> MQTT -> Backend -> MongoDB pipeline verified.');

    // ----------------------------------------------------
    // TEST 7: REST API Endpoints Verification
    // ----------------------------------------------------
    logTestStep(7, 'Verify REST API Endpoints (/api/devices, /api/telemetry)');

    const { app } = require('../index');
    const http = require('http');
    const apiServer = http.createServer(app);
    const TEST_API_PORT = 5055;

    await new Promise(resolve => apiServer.listen(TEST_API_PORT, resolve));
    console.log(`[Test API Server] Listening on port ${TEST_API_PORT}`);

    // Helper for HTTP GET / POST
    const apiRequest = async (path, method = 'GET', body = null) => {
      const response = await fetch(`http://127.0.0.1:${TEST_API_PORT}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json();
      return { status: response.status, data };
    };

    // 7a. Test GET /api/devices/status
    const devStatusRes = await apiRequest('/api/devices/status');
    assert.strictEqual(devStatusRes.status, 200);
    assert.strictEqual(devStatusRes.data.success, true);
    assert.ok(Array.isArray(devStatusRes.data.data), 'Devices status must return array');
    console.log(`GET /api/devices/status returned ${devStatusRes.data.data.length} devices.`);

    // 7b. Test GET /api/devices/:deviceId
    const singleDevRes = await apiRequest('/api/devices/ESP32-E2E-LIVE');
    assert.strictEqual(singleDevRes.status, 200);
    assert.strictEqual(singleDevRes.data.data.device_id, 'ESP32-E2E-LIVE');
    console.log(`GET /api/devices/ESP32-E2E-LIVE verified: status = ${singleDevRes.data.data.status}`);

    // 7c. Test GET /api/telemetry/latest
    const latestRes = await apiRequest('/api/telemetry/latest');
    assert.strictEqual(latestRes.status, 200);
    assert.ok(latestRes.data.data.length > 0, 'Latest telemetry must return items');
    console.log(`GET /api/telemetry/latest returned ${latestRes.data.data.length} latest device telemetry readings.`);

    // 7d. Test GET /api/telemetry/history
    const historyRes = await apiRequest('/api/telemetry/history?deviceId=ESP32-E2E-LIVE');
    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyRes.data.data.length > 0);
    console.log(`GET /api/telemetry/history returned ${historyRes.data.count} records for ESP32-E2E-LIVE.`);

    // 7e. Test POST /api/telemetry/ingest (HTTPS Fallback Ingestion)
    const fallbackPayload = {
      device_id: 'ESP32-REST-FALLBACK',
      timestamp: new Date().toISOString(),
      temperature: 24.8,
      humidity: 50.0,
      pressure: 1014.2,
      light_lux: 1800.0,
      rain_intensity: 0,
      gas_aqi: 75,
      wind_speed: 1.5
    };
    const ingestRes = await apiRequest('/api/telemetry/ingest', 'POST', fallbackPayload);
    assert.strictEqual(ingestRes.status, 201);
    assert.strictEqual(ingestRes.data.success, true);
    assert.strictEqual(ingestRes.data.data.device_id, 'ESP32-REST-FALLBACK');
    console.log(`POST /api/telemetry/ingest successfully processed and persisted reading.`);

    // Close API server
    await new Promise(resolve => apiServer.close(resolve));
    console.log('✅ TEST 7 PASSED: REST API endpoints for devices and telemetry verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');


  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test MongoDB.');
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
