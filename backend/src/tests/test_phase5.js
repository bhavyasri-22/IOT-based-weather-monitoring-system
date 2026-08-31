const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');

require('dotenv').config();

const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const Threshold = require('../models/Threshold');
const AlertLog = require('../models/AlertLog');

const { seedDefaultThresholds, evaluateTelemetryAlerts, evaluateDeviceOfflineAlert, resolveDeviceOfflineAlert } = require('../alerts/thresholdEngine');
const { checkOfflineDevices, DEFAULT_OFFLINE_TIMEOUT_MS } = require('../deviceHealth/offlineJob');
const ingestionService = require('../ingestion/ingestionService');
const { app } = require('../index');

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_test_phase5';
const TEST_API_PORT = 5056;

function logTestStep(stepNumber, title) {
  console.log(`\n========================================`);
  console.log(`[TEST STEP ${stepNumber}] ${title}`);
  console.log(`========================================`);
}

async function runPhase5Tests() {
  console.log('🚀 Starting Phase 5 Integration Tests...');
  console.log(`Target MongoDB: ${TEST_MONGO_URI}`);

  // Connect to MongoDB
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

  try {
    // ----------------------------------------------------
    // TEST 1: Default Threshold Initialization
    // ----------------------------------------------------
    logTestStep(1, 'Verify System Default Threshold Initialization');

    await seedDefaultThresholds();
    const thresholds = await Threshold.find();
    console.log(`Initialized ${thresholds.length} system default thresholds.`);
    assert.ok(thresholds.length >= 7, 'System must have at least 7 default threshold rules');

    const tempRule = await Threshold.findOne({ parameter: 'temperature' });
    assert.strictEqual(tempRule.warning_max, 35);
    assert.strictEqual(tempRule.critical_max, 40);

    const aqiRule = await Threshold.findOne({ parameter: 'gas_aqi' });
    assert.ok(aqiRule.description.includes('MQ135'), 'AQI proxy description must explicitly note MQ135');

    console.log('✅ TEST 1 PASSED: Default thresholds seeded and verified.');

    // ----------------------------------------------------
    // TEST 2: Threshold Violation & Alert Creation
    // ----------------------------------------------------
    logTestStep(2, 'Test Threshold Violation & Alert Creation (Crossing Limits)');

    const warningTelemetry = {
      device_id: 'ESP32-ALERT-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 37.5, // > warning_max (35)
      humidity: 30.0,    // Lower humidity so Heat Index stays normal
      pressure: 1012.0,
      light_lux: 3000.0,
      rain_intensity: 0,
      gas_aqi: 100,
      wind_speed: 3.5
    };

    await ingestionService.processTelemetry(JSON.stringify(warningTelemetry));

    const tempAlert = await AlertLog.findOne({ device_id: 'ESP32-ALERT-NODE-01', parameter: 'temperature', status: 'active' });
    assert.ok(tempAlert, 'Active warning alert for temperature must exist');
    assert.strictEqual(tempAlert.severity, 'warning');
    assert.strictEqual(tempAlert.trigger_value, 37.5);
    console.log(`Alert Created: [${tempAlert.severity.toUpperCase()}] ${tempAlert.message}`);

    console.log('✅ TEST 2 PASSED: Warning alert created when threshold was crossed.');

    // ----------------------------------------------------
    // TEST 3: Prevent Duplicate Active Alerts
    // ----------------------------------------------------
    logTestStep(3, 'Test Duplicate Active Alert Prevention');

    const repeatWarningTelemetry = {
      device_id: 'ESP32-ALERT-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 38.2, // Still > 35, < 40
      humidity: 32.0,
      pressure: 1011.8,
      light_lux: 3100.0,
      rain_intensity: 0,
      gas_aqi: 105,
      wind_speed: 3.8
    };

    await ingestionService.processTelemetry(JSON.stringify(repeatWarningTelemetry));

    const activeTempAlerts = await AlertLog.find({ device_id: 'ESP32-ALERT-NODE-01', parameter: 'temperature', status: 'active' });
    assert.strictEqual(activeTempAlerts.length, 1, 'Must NOT create duplicate active alert for same parameter & severity');
    console.log('Active temperature alert count remained 1 (Duplicate active alert prevented).');

    console.log('✅ TEST 3 PASSED: Duplicate active alerts prevented.');

    // ----------------------------------------------------
    // TEST 4: Automatic Alert Resolution (Values Returning Below Threshold)
    // ----------------------------------------------------
    logTestStep(4, 'Test Automatic Alert Resolution (Return to Safe Levels)');

    const normalTelemetry = {
      device_id: 'ESP32-ALERT-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 27.0, // <= 35 (Normal)
      humidity: 50.0,
      pressure: 1012.0,
      light_lux: 3000.0,
      rain_intensity: 0,
      gas_aqi: 100,
      wind_speed: 3.5
    };

    await ingestionService.processTelemetry(JSON.stringify(normalTelemetry));

    const activeTempAlerts2 = await AlertLog.find({ device_id: 'ESP32-ALERT-NODE-01', parameter: 'temperature', status: 'active' });
    assert.strictEqual(activeTempAlerts2.length, 0, 'Active temperature alerts should be 0 after returning to normal');

    const resolvedAlert = await AlertLog.findOne({ device_id: 'ESP32-ALERT-NODE-01', parameter: 'temperature' });
    assert.strictEqual(resolvedAlert.status, 'resolved', 'Alert status must transition to resolved');
    assert.ok(resolvedAlert.resolved_at, 'resolved_at timestamp must be set');
    console.log(`Alert Status: ${resolvedAlert.status}, Resolved At: ${resolvedAlert.resolved_at.toISOString()}`);

    console.log('✅ TEST 4 PASSED: Active alert automatically resolved when values returned below threshold.');

    // ----------------------------------------------------
    // TEST 5: Sensor Fault Handling (Null / Unavailable Representation)
    // ----------------------------------------------------
    logTestStep(5, 'Test Sensor Fault Handling (Null Representation & Resolution)');

    const faultTelemetry = {
      device_id: 'ESP32-ALERT-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: null, // Sensor fault!
      humidity: 50.0,
      pressure: 1012.0,
      light_lux: 3000.0,
      rain_intensity: 0,
      gas_aqi: 100,
      wind_speed: 3.5
    };

    await ingestionService.processTelemetry(JSON.stringify(faultTelemetry));

    const faultAlert = await AlertLog.findOne({
      device_id: 'ESP32-ALERT-NODE-01',
      parameter: 'temperature',
      alert_type: 'sensor_fault',
      status: 'active'
    });
    assert.ok(faultAlert, 'Sensor fault active alert must be created');
    assert.strictEqual(faultAlert.trigger_value, null, 'Trigger value for sensor fault must be null (not 0)');
    console.log(`Sensor Fault Alert: ${faultAlert.message}`);

    // Now recovery telemetry with valid temperature
    const recoveryTelemetry = {
      device_id: 'ESP32-ALERT-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 26.5, // Sensor restored!
      humidity: 50.0,
      pressure: 1012.0,
      light_lux: 3000.0,
      rain_intensity: 0,
      gas_aqi: 100,
      wind_speed: 3.5
    };

    await ingestionService.processTelemetry(JSON.stringify(recoveryTelemetry));

    const faultAlertAfter = await AlertLog.findById(faultAlert._id);
    assert.strictEqual(faultAlertAfter.status, 'resolved', 'Sensor fault alert must resolve when valid reading returns');

    console.log('✅ TEST 5 PASSED: Sensor null fault alert created and automatically resolved upon recovery.');

    // ----------------------------------------------------
    // TEST 6: Device Offline Alert Creation & Resolution
    // ----------------------------------------------------
    logTestStep(6, 'Test Device Offline Alert Creation & Online Recovery Resolution');

    // Create a device inactive for 3 minutes
    const threeMinutesAgo = new Date(Date.now() - (3 * 60 * 1000));
    await DeviceHealth.create({
      device_id: 'ESP32-OFFLINE-TEST-NODE',
      status: 'online',
      last_seen: threeMinutesAgo,
      last_seen_timestamp: threeMinutesAgo,
      last_telemetry: threeMinutesAgo,
      firmware_version: '1.0.0'
    });

    await checkOfflineDevices(DEFAULT_OFFLINE_TIMEOUT_MS);

    const offlineAlert = await AlertLog.findOne({
      device_id: 'ESP32-OFFLINE-TEST-NODE',
      alert_type: 'device_offline',
      status: 'active'
    });
    assert.ok(offlineAlert, 'Device offline critical alert must be created');
    assert.strictEqual(offlineAlert.severity, 'critical');
    console.log(`Device Offline Alert: ${offlineAlert.message}`);

    // Send heartbeat to recover online
    await ingestionService.processHeartbeat(JSON.stringify({
      device_id: 'ESP32-OFFLINE-TEST-NODE',
      heartbeat_timestamp: new Date().toISOString(),
      status: 'online'
    }));

    const offlineAlertAfter = await AlertLog.findById(offlineAlert._id);
    assert.strictEqual(offlineAlertAfter.status, 'resolved', 'Device offline alert must resolve when device recovers online');

    console.log('✅ TEST 6 PASSED: Device offline alert triggered and resolved on recovery.');

    // ----------------------------------------------------
    // TEST 7: REST API Verification for Alerts & Threshold Config
    // ----------------------------------------------------
    logTestStep(7, 'Verify REST API Endpoints (/api/alerts, /api/config/thresholds)');

    const apiServer = http.createServer(app);
    await new Promise(res => apiServer.listen(TEST_API_PORT, res));
    console.log(`[Test API Server] Listening on port ${TEST_API_PORT}`);

    const apiRequest = async (path, method = 'GET', body = null) => {
      const response = await fetch(`http://127.0.0.1:${TEST_API_PORT}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json();
      return { status: response.status, data };
    };

    // 7a. Test GET /api/alerts
    const getAlertsRes = await apiRequest('/api/alerts');
    assert.strictEqual(getAlertsRes.status, 200);
    assert.strictEqual(getAlertsRes.data.success, true);
    assert.ok(Array.isArray(getAlertsRes.data.data));
    console.log(`GET /api/alerts returned ${getAlertsRes.data.count} alert log records.`);

    // 7b. Test GET /api/alerts/active
    const getActiveRes = await apiRequest('/api/alerts/active');
    assert.strictEqual(getActiveRes.status, 200);
    console.log(`GET /api/alerts/active returned ${getActiveRes.data.count} active alerts.`);

    // 7c. Test GET /api/config/thresholds
    const getThresholdsRes = await apiRequest('/api/config/thresholds');
    assert.strictEqual(getThresholdsRes.status, 200);
    assert.ok(getThresholdsRes.data.data.length >= 7);
    console.log(`GET /api/config/thresholds returned ${getThresholdsRes.data.data.length} threshold rules.`);

    // 7d. Test PUT /api/config/thresholds/temperature (Admin threshold update)
    const updateRes = await apiRequest('/api/config/thresholds/temperature', 'PUT', {
      warning_max: 32.0,
      critical_max: 38.0
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.data.warning_max, 32.0);
    assert.strictEqual(updateRes.data.data.critical_max, 38.0);
    console.log(`PUT /api/config/thresholds/temperature updated warning_max to 32°C.`);

    await new Promise(res => apiServer.close(res));
    console.log('✅ TEST 7 PASSED: REST API endpoints for alerts and thresholds verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 5 TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');

  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test MongoDB.');
  }
}

if (require.main === module) {
  runPhase5Tests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runPhase5Tests;
