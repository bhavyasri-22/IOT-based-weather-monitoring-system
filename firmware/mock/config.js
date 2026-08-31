module.exports = {
  BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883',
  DEVICE_ID: process.env.DEVICE_ID || 'ESP32-NODE-01',
  TELEMETRY_TOPIC: 'weather/telemetry',
  HEARTBEAT_TOPIC: 'weather/heartbeat',
  TELEMETRY_INTERVAL_MS: 5000, // 5 seconds per F.1 requirement
  HEARTBEAT_INTERVAL_MS: 5000,  // Heartbeat ping interval
  SAMPLE_FILE_PATH: './sample_telemetry.json'
};
