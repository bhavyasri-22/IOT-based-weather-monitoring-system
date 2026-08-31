const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');

require('dotenv').config();

const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const Threshold = require('../models/Threshold');
const AlertLog = require('../models/AlertLog');
const User = require('../models/User');

const { app } = require('../index');
const { DEFAULT_SYSTEM_DEVICE_KEY } = require('../middlewares/apiKeyAuth');

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_test_phase6';
const TEST_API_PORT = 5057;

function logTestStep(stepNumber, title) {
  console.log(`\n========================================`);
  console.log(`[TEST STEP ${stepNumber}] ${title}`);
  console.log(`========================================`);
}

async function runPhase6Tests() {
  console.log('🚀 Starting Phase 6 REST API Integration Tests...');
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

  // Clear collections
  await SensorReading.deleteMany({});
  await DeviceHealth.deleteMany({});
  await Threshold.deleteMany({});
  await AlertLog.deleteMany({});
  await User.deleteMany({});
  console.log('🧹 Cleaned test database collections.');

  const apiServer = http.createServer(app);
  await new Promise(res => apiServer.listen(TEST_API_PORT, res));
  console.log(`[Test API Server] Listening on port ${TEST_API_PORT}`);

  const apiRequest = async (path, method = 'GET', body = null, headers = {}) => {
    const defaultHeaders = {};
    if (body) defaultHeaders['Content-Type'] = 'application/json';

    const response = await fetch(`http://127.0.0.1:${TEST_API_PORT}${path}`, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    return { status: response.status, data };
  };

  try {
    // ----------------------------------------------------
    // TEST 1: User Authentication API (Register, Login, Profile)
    // ----------------------------------------------------
    logTestStep(1, 'Verify User Authentication APIs (/api/auth)');

    // 1a. Register User
    const regRes = await apiRequest('/api/auth/register', 'POST', {
      username: 'admin_test_user',
      password: 'securePassword123',
      email: 'admin@weather.test',
      role: 'admin'
    });
    assert.strictEqual(regRes.status, 201, 'Registration should return HTTP 201');
    assert.strictEqual(regRes.data.success, true);
    assert.ok(regRes.data.data.token, 'Registration must return JWT token');
    assert.strictEqual(regRes.data.data.user.username, 'admin_test_user');
    const userToken = regRes.data.data.token;
    console.log('User registered successfully. JWT Token received.');

    // 1b. Duplicate Registration check
    const dupRegRes = await apiRequest('/api/auth/register', 'POST', {
      username: 'admin_test_user',
      password: 'securePassword123'
    });
    assert.strictEqual(dupRegRes.status, 400, 'Duplicate registration must return HTTP 400');
    assert.strictEqual(dupRegRes.data.success, false);

    // 1c. Login User
    const loginRes = await apiRequest('/api/auth/login', 'POST', {
      username: 'admin_test_user',
      password: 'securePassword123'
    });
    assert.strictEqual(loginRes.status, 200, 'Login should return HTTP 200');
    assert.ok(loginRes.data.data.token);

    // 1d. Invalid Password
    const badLoginRes = await apiRequest('/api/auth/login', 'POST', {
      username: 'admin_test_user',
      password: 'wrongPassword'
    });
    assert.strictEqual(badLoginRes.status, 401, 'Invalid login must return HTTP 401');

    // 1e. Get Profile /api/auth/me
    const meRes = await apiRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${userToken}` });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.username, 'admin_test_user');

    // 1f. Profile missing token
    const noTokenRes = await apiRequest('/api/auth/me');
    assert.strictEqual(noTokenRes.status, 401);

    console.log('✅ TEST 1 PASSED: Authentication APIs (register, login, me) verified.');

    // ----------------------------------------------------
    // TEST 2: HTTPS Telemetry Fallback Ingestion with API Key
    // ----------------------------------------------------
    logTestStep(2, 'Test HTTPS Fallback Ingestion (POST /api/telemetry/ingest)');

    const validTelemetry = {
      device_id: 'ESP32-HTTPS-NODE-01',
      timestamp: new Date().toISOString(),
      temperature: 29.2,
      humidity: 64.0,
      pressure: 1010.5,
      light_lux: 3200.0,
      rain_intensity: 0,
      gas_aqi: 115,
      wind_speed: 4.0
    };

    // 2a. Post with valid default x-api-key header
    const ingestRes1 = await apiRequest('/api/telemetry/ingest', 'POST', validTelemetry, {
      'x-api-key': DEFAULT_SYSTEM_DEVICE_KEY
    });
    assert.strictEqual(ingestRes1.status, 201, 'Ingest should return HTTP 201');
    assert.strictEqual(ingestRes1.data.success, true);
    assert.strictEqual(ingestRes1.data.data.temperature, 29.2);
    assert.ok(ingestRes1.data.data.derived.heat_index !== null, 'Heat index must be calculated via shared pipeline');
    console.log('Telemetry ingested successfully via HTTPS fallback.');

    // 2b. Ingest missing x-api-key
    const noKeyRes = await apiRequest('/api/telemetry/ingest', 'POST', validTelemetry);
    assert.strictEqual(noKeyRes.status, 401, 'Missing API key must return HTTP 401');

    // 2c. Ingest invalid x-api-key
    const badKeyRes = await apiRequest('/api/telemetry/ingest', 'POST', validTelemetry, {
      'x-api-key': 'invalid_api_key'
    });
    assert.strictEqual(badKeyRes.status, 401, 'Invalid API key must return HTTP 401');

    // 2d. Ingest malformed telemetry (non-numeric temp)
    const malformedTelemetry = {
      device_id: 'ESP32-HTTPS-NODE-01',
      temperature: 'invalid_temp'
    };
    const badDataRes = await apiRequest('/api/telemetry/ingest', 'POST', malformedTelemetry, {
      'x-api-key': DEFAULT_SYSTEM_DEVICE_KEY
    });
    assert.strictEqual(badDataRes.status, 400, 'Malformed telemetry must return HTTP 400');

    console.log('✅ TEST 2 PASSED: HTTPS fallback telemetry ingestion and API key verification completed.');

    // ----------------------------------------------------
    // TEST 3: Per-Device API Key Authentication
    // ----------------------------------------------------
    logTestStep(3, 'Test Per-Device Custom API Key Authentication');

    // Set custom API key for node
    const customKey = 'custom_device_secret_9999';
    const setKeyRes = await apiRequest('/api/devices/ESP32-CUSTOM-NODE/key', 'PUT', { apiKey: customKey });
    assert.strictEqual(setKeyRes.status, 200);

    const customTelemetry = {
      device_id: 'ESP32-CUSTOM-NODE',
      timestamp: new Date().toISOString(),
      temperature: 25.0,
      humidity: 50.0
    };

    // Ingest with custom API key -> Should succeed
    const customIngestRes = await apiRequest('/api/telemetry/ingest', 'POST', customTelemetry, {
      'x-api-key': customKey
    });
    assert.strictEqual(customIngestRes.status, 201);
    console.log('Custom per-device API key authenticated successfully.');

    // Ingest with default key for custom-configured device -> Should be rejected 401
    const rejectedIngestRes = await apiRequest('/api/telemetry/ingest', 'POST', customTelemetry, {
      'x-api-key': DEFAULT_SYSTEM_DEVICE_KEY
    });
    assert.strictEqual(rejectedIngestRes.status, 401);

    console.log('✅ TEST 3 PASSED: Per-device custom API key authentication verified.');

    // ----------------------------------------------------
    // TEST 4: Telemetry Query APIs (Latest & History)
    // ----------------------------------------------------
    logTestStep(4, 'Verify Telemetry Query APIs (/api/telemetry/latest, /api/telemetry/history)');

    const latestAllRes = await apiRequest('/api/telemetry/latest');
    assert.strictEqual(latestAllRes.status, 200);
    assert.ok(latestAllRes.data.data.length >= 2, 'Latest per device should return all unique device nodes');

    const latestSingleRes = await apiRequest('/api/telemetry/latest/ESP32-HTTPS-NODE-01');
    assert.strictEqual(latestSingleRes.status, 200);
    assert.strictEqual(latestSingleRes.data.data.device_id, 'ESP32-HTTPS-NODE-01');

    const historyRes = await apiRequest('/api/telemetry/history?deviceId=ESP32-HTTPS-NODE-01&limit=10');
    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyRes.data.data.length >= 1);

    console.log('✅ TEST 4 PASSED: Telemetry latest and historical query endpoints verified.');

    // ----------------------------------------------------
    // TEST 5: Device Status & Health APIs
    // ----------------------------------------------------
    logTestStep(5, 'Verify Device Status & Health Summary APIs (/api/devices)');

    const devStatusRes = await apiRequest('/api/devices/status');
    assert.strictEqual(devStatusRes.status, 200);
    assert.ok(devStatusRes.data.data.length >= 2);

    const devHealthRes = await apiRequest('/api/devices/health');
    assert.strictEqual(devHealthRes.status, 200);
    assert.ok(devHealthRes.data.data.total_devices >= 2);
    assert.strictEqual(devHealthRes.data.data.online_devices, 2);
    console.log(`Device Health Summary: Total=${devHealthRes.data.data.total_devices}, Online=${devHealthRes.data.data.online_devices}, Status=${devHealthRes.data.data.system_status}`);

    const singleDevRes = await apiRequest('/api/devices/ESP32-HTTPS-NODE-01');
    assert.strictEqual(singleDevRes.status, 200);

    console.log('✅ TEST 5 PASSED: Device status and health summary APIs verified.');

    // ----------------------------------------------------
    // TEST 6: Alerts & Threshold Config APIs
    // ----------------------------------------------------
    logTestStep(6, 'Verify Alert & Threshold Config APIs (/api/alerts, /api/config/thresholds)');

    const alertsRes = await apiRequest('/api/alerts');
    assert.strictEqual(alertsRes.status, 200);

    const activeAlertsRes = await apiRequest('/api/alerts/active');
    assert.strictEqual(activeAlertsRes.status, 200);

    const thresholdsRes = await apiRequest('/api/config/thresholds');
    assert.strictEqual(thresholdsRes.status, 200);
    assert.ok(thresholdsRes.data.data.length >= 7);

    const updateThresholdRes = await apiRequest('/api/config/thresholds/wind_speed', 'PUT', {
      warning_max: 18.0,
      critical_max: 28.0
    });
    assert.strictEqual(updateThresholdRes.status, 200);
    assert.strictEqual(updateThresholdRes.data.data.warning_max, 18.0);

    console.log('✅ TEST 6 PASSED: Alert logs and threshold config APIs verified.');

    // ----------------------------------------------------
    // TEST 7: Centralized Error Handler & 404 Verification
    // ----------------------------------------------------
    logTestStep(7, 'Verify Centralized 404 and Error Handler');

    const notFoundRes = await apiRequest('/api/non_existent_route');
    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.data.success, false);
    assert.ok(notFoundRes.data.error.includes('Resource not found'));

    console.log('✅ TEST 7 PASSED: Centralized error handling and 404 handler verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 6 REST API TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');

  } finally {
    await new Promise(res => apiServer.close(res));
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test MongoDB & closed server.');
  }
}

if (require.main === module) {
  runPhase6Tests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runPhase6Tests;
