const fs = require('fs');
const path = require('path');
const config = require('./config');

let sampleData = [];
let sampleIndex = 0;

// Try loading sample telemetry data file if available
try {
  const filePath = path.resolve(__dirname, config.SAMPLE_FILE_PATH);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    sampleData = JSON.parse(raw);
    console.log(`[Simulator] Loaded ${sampleData.length} samples from ${config.SAMPLE_FILE_PATH}`);
  }
} catch (err) {
  console.warn('[Simulator] Could not load sample file, defaulting to dynamic generation:', err.message);
}

// Current dynamic state for smooth continuous walk simulation
let state = {
  temperature: 27.5,
  humidity: 62.0,
  pressure: 1010.0,
  light_lux: 3200.0,
  rain_intensity: 0,
  gas_aqi: 140,
  wind_speed: 5.0
};

/**
 * Generate next sensor reading object conforming to SRS §4 JSON contract
 */
function getNextReading(deviceId) {
  let reading;

  if (sampleData && sampleData.length > 0) {
    // Cycle through pre-configured sample data array (supports text-file driven testing)
    const rawSample = sampleData[sampleIndex];
    sampleIndex = (sampleIndex + 1) % sampleData.length;

    reading = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      temperature: rawSample.temperature !== undefined ? rawSample.temperature : null,
      humidity: rawSample.humidity !== undefined ? rawSample.humidity : null,
      pressure: rawSample.pressure !== undefined ? rawSample.pressure : null,
      light_lux: rawSample.light_lux !== undefined ? rawSample.light_lux : null,
      rain_intensity: rawSample.rain_intensity !== undefined ? rawSample.rain_intensity : null,
      gas_aqi: rawSample.gas_aqi !== undefined ? rawSample.gas_aqi : null,
      wind_speed: rawSample.wind_speed !== undefined ? rawSample.wind_speed : null
    };
  } else {
    // Dynamic random walk for realistic continuous variation
    state.temperature = parseFloat((state.temperature + (Math.random() - 0.5) * 0.4).toFixed(1));
    state.humidity = parseFloat((state.humidity + (Math.random() - 0.5) * 0.8).toFixed(1));
    state.pressure = parseFloat((state.pressure + (Math.random() - 0.5) * 0.2).toFixed(1));
    state.light_lux = parseFloat(Math.max(0, state.light_lux + (Math.random() - 0.5) * 50).toFixed(1));
    state.wind_speed = parseFloat(Math.max(0, state.wind_speed + (Math.random() - 0.5) * 0.5).toFixed(1));
    state.gas_aqi = Math.max(20, Math.min(500, Math.round(state.gas_aqi + (Math.random() - 0.5) * 3)));
    
    // 5% chance of simulating sensor fault (F.2 handling -> null parameter)
    const isFault = Math.random() < 0.05;

    reading = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      temperature: isFault ? null : state.temperature,
      humidity: state.humidity,
      pressure: state.pressure,
      light_lux: state.light_lux,
      rain_intensity: state.rain_intensity,
      gas_aqi: state.gas_aqi,
      wind_speed: state.wind_speed
    };
  }

  return reading;
}

/**
 * Generate heartbeat ping payload conforming to SRS §4 contract
 */
function getHeartbeatPayload(deviceId) {
  return {
    device_id: deviceId,
    heartbeat_timestamp: new Date().toISOString(),
    status: 'online'
  };
}

module.exports = {
  getNextReading,
  getHeartbeatPayload
};
