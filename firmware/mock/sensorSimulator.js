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
    const parsed = JSON.parse(raw);
    // Strip helper _comment fields so they don't pollute payloads
    sampleData = parsed.map(({ _comment, ...rest }) => rest);
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
  wind_speed: 5.0,
  wind_direction: 45,   // degrees (NE)
};

/**
 * Clamp helper
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

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
      temperature:     rawSample.temperature     !== undefined ? rawSample.temperature     : null,
      humidity:        rawSample.humidity         !== undefined ? rawSample.humidity         : null,
      pressure:        rawSample.pressure         !== undefined ? rawSample.pressure         : null,
      light_lux:       rawSample.light_lux        !== undefined ? rawSample.light_lux        : null,
      rain_intensity:  rawSample.rain_intensity   !== undefined ? rawSample.rain_intensity   : null,
      gas_aqi:         rawSample.gas_aqi          !== undefined ? rawSample.gas_aqi          : null,
      wind_speed:      rawSample.wind_speed       !== undefined ? rawSample.wind_speed       : null,
      wind_direction:  rawSample.wind_direction   !== undefined ? rawSample.wind_direction   : Math.round((Math.random() * 360)),
    };
  } else {
    // Dynamic random walk for realistic continuous variation – wider swing range
    state.temperature    = clamp(parseFloat((state.temperature    + (Math.random() - 0.5) * 4.0).toFixed(1)),   15, 45);
    state.humidity       = clamp(parseFloat((state.humidity       + (Math.random() - 0.5) * 5.0).toFixed(1)),   20, 99);
    state.pressure       = clamp(parseFloat((state.pressure       + (Math.random() - 0.5) * 2.0).toFixed(1)), 990, 1025);
    state.light_lux      = clamp(parseFloat((state.light_lux      + (Math.random() - 0.5) * 400).toFixed(1)),    0, 5500);
    state.wind_speed     = clamp(parseFloat((state.wind_speed     + (Math.random() - 0.5) * 4.0).toFixed(1)),    0, 45);
    state.wind_direction = Math.round((state.wind_direction + (Math.random() - 0.5) * 30 + 360) % 360);
    state.gas_aqi        = Math.max(10, Math.min(250, Math.round(state.gas_aqi + (Math.random() - 0.5) * 15)));

    // 8% chance of rain event, then moderate duration
    if (Math.random() < 0.08) state.rain_intensity = clamp(parseFloat((Math.random() * 50).toFixed(1)), 0, 50);
    else                       state.rain_intensity = clamp(parseFloat((state.rain_intensity * 0.7).toFixed(1)), 0, 50);

    // 5% chance of simulating sensor fault (null parameter)
    const isTempFault = Math.random() < 0.05;

    reading = {
      device_id:       deviceId,
      timestamp:       new Date().toISOString(),
      temperature:     isTempFault ? null : state.temperature,
      humidity:        state.humidity,
      pressure:        state.pressure,
      light_lux:       state.light_lux,
      rain_intensity:  state.rain_intensity,
      gas_aqi:         state.gas_aqi,
      wind_speed:      state.wind_speed,
      wind_direction:  state.wind_direction,
    };
  }

  return reading;
}

/**
 * Generate heartbeat ping payload conforming to SRS §4 contract
 */
function getHeartbeatPayload(deviceId) {
  return {
    device_id:           deviceId,
    heartbeat_timestamp: new Date().toISOString(),
    status:              'online'
  };
}

module.exports = {
  getNextReading,
  getHeartbeatPayload
};
