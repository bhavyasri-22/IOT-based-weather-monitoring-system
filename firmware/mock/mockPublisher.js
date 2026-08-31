const mqtt = require('mqtt');
const config = require('./config');
const simulator = require('./sensorSimulator');

console.log(`[Mock ESP32] Initializing publisher...`);
console.log(`[Mock ESP32] Broker Target: ${config.BROKER_URL}`);
console.log(`[Mock ESP32] Device ID: ${config.DEVICE_ID}`);

const client = mqtt.connect(config.BROKER_URL, {
  clientId: `mock_esp32_${config.DEVICE_ID}_${Math.random().toString(16).substring(2, 8)}`,
  reconnectPeriod: 2000, // Automatic reconnect if MQTT connection is lost
  connectTimeout: 10000
});

let telemetryTimer = null;
let heartbeatTimer = null;

client.on('connect', () => {
  console.log(`[Mock ESP32] Connected successfully to MQTT broker at ${config.BROKER_URL}`);

  // Clear existing timers if reconnecting
  if (telemetryTimer) clearInterval(telemetryTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  // Send initial readings & pings immediately upon connection
  sendTelemetry();
  sendHeartbeat();

  // Schedule regular telemetry publishing (Default: every 5 seconds per F.1)
  telemetryTimer = setInterval(sendTelemetry, config.TELEMETRY_INTERVAL_MS);

  // Schedule regular heartbeat publishing (Default: every 5 seconds per F.5)
  heartbeatTimer = setInterval(sendHeartbeat, config.HEARTBEAT_INTERVAL_MS);
});

client.on('reconnect', () => {
  console.log(`[Mock ESP32] Connection lost. Attempting to reconnect to ${config.BROKER_URL}...`);
});

client.on('error', (err) => {
  console.error(`[Mock ESP32] MQTT Error: ${err.message}`);
});

client.on('close', () => {
  console.log(`[Mock ESP32] Connection closed.`);
});

function sendTelemetry() {
  const telemetry = simulator.getNextReading(config.DEVICE_ID);
  const payloadStr = JSON.stringify(telemetry);

  client.publish(config.TELEMETRY_TOPIC, payloadStr, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[Mock ESP32] Telemetry Publish Failed: ${err.message}`);
    } else {
      console.log(`[Mock ESP32] Published telemetry to [${config.TELEMETRY_TOPIC}]:`, payloadStr);
    }
  });
}

function sendHeartbeat() {
  const heartbeat = simulator.getHeartbeatPayload(config.DEVICE_ID);
  const payloadStr = JSON.stringify(heartbeat);

  client.publish(config.HEARTBEAT_TOPIC, payloadStr, { qos: 0 }, (err) => {
    if (err) {
      console.error(`[Mock ESP32] Heartbeat Publish Failed: ${err.message}`);
    } else {
      console.log(`[Mock ESP32] Published heartbeat to [${config.HEARTBEAT_TOPIC}]:`, payloadStr);
    }
  });
}

// Graceful shutdown on SIGINT / SIGTERM
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('[Mock ESP32] Shutting down publisher...');
  if (telemetryTimer) clearInterval(telemetryTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  client.end(false, () => {
    console.log('[Mock ESP32] MQTT client disconnected cleanly.');
    process.exit(0);
  });
}
