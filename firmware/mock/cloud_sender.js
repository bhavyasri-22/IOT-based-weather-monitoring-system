/**
 * Cloud Mock Telemetry Sender
 * 
 * Sends simulated weather telemetry to the deployed Render backend
 * via MQTT over WebSocket. Use this to demo the system without real ESP32 hardware.
 * 
 * Usage:
 *   1. npm install mqtt
 *   2. Set MQTT_URL and DEVICE_API_KEY below (or via env vars)
 *   3. node cloud_sender.js
 */

const mqtt = require('mqtt');

// ── Configuration ──────────────────────────────────────────────
// Replace with your actual Render URL after deployment
const MQTT_URL = process.env.MQTT_URL || 'wss://iot-weather-backend.onrender.com/mqtt';
const DEVICE_ID = process.env.DEVICE_ID || 'ESP32-NODE-01';
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || 'iot-weather-key-2026';
const TELEMETRY_INTERVAL_MS = 5000;   // Send every 5 seconds
const HEARTBEAT_INTERVAL_MS = 30000;  // Heartbeat every 30 seconds

// ── Helpers ────────────────────────────────────────────────────
function randomBetween(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function generateTelemetry() {
  return {
    device_id: DEVICE_ID,
    temperature: randomBetween(20, 40),
    humidity: randomBetween(30, 90),
    pressure: randomBetween(990, 1020),
    light: randomBetween(100, 50000),
    uv_index: randomBetween(0, 11),
    wind_speed: randomBetween(0, 25),
    wind_direction: randomBetween(0, 360),
    rainfall: randomBetween(0, 5),
    air_quality_index: Math.floor(randomBetween(20, 300)),
    gas_resistance: randomBetween(10000, 500000),
    altitude: randomBetween(300, 350),
    api_key: DEVICE_API_KEY,
    timestamp: new Date().toISOString()
  };
}

function generateHeartbeat() {
  return {
    device_id: DEVICE_ID,
    status: 'online',
    uptime_ms: Date.now(),
    free_heap: Math.floor(randomBetween(150000, 200000)),
    wifi_rssi: Math.floor(randomBetween(-70, -30))
  };
}

// ── MQTT Connection ────────────────────────────────────────────
console.log(`\n🌐 Connecting to MQTT broker at: ${MQTT_URL}`);
console.log(`📟 Device ID: ${DEVICE_ID}\n`);

const client = mqtt.connect(MQTT_URL, {
  clientId: `mock_${DEVICE_ID}_${Math.random().toString(16).substring(2, 8)}`,
  reconnectPeriod: 5000,
  connectTimeout: 15000
});

let telemetryCount = 0;

client.on('connect', () => {
  console.log('✅ Connected to cloud MQTT broker!\n');

  // Send telemetry at regular intervals
  setInterval(() => {
    const data = generateTelemetry();
    client.publish('weather/telemetry', JSON.stringify(data));
    telemetryCount++;
    console.log(
      `📡 [#${telemetryCount}] Sent: ` +
      `${data.temperature}°C | ${data.humidity}%RH | ` +
      `${data.pressure}hPa | AQI ${data.air_quality_index} | ` +
      `Wind ${data.wind_speed}km/h`
    );
  }, TELEMETRY_INTERVAL_MS);

  // Send heartbeat at regular intervals
  setInterval(() => {
    const hb = generateHeartbeat();
    client.publish('weather/heartbeat', JSON.stringify(hb));
    console.log(`💓 Heartbeat sent (RSSI: ${hb.wifi_rssi}dBm, Heap: ${hb.free_heap}B)`);
  }, HEARTBEAT_INTERVAL_MS);

  // Send initial heartbeat immediately
  const initHb = generateHeartbeat();
  client.publish('weather/heartbeat', JSON.stringify(initHb));
  console.log('💓 Initial heartbeat sent\n');
});

client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT broker...');
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
});

client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down mock sender...');
  client.end(false, () => {
    console.log(`📊 Total telemetry packets sent: ${telemetryCount}`);
    process.exit(0);
  });
});
