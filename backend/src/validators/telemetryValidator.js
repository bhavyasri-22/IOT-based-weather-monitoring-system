/**
 * Telemetry and Heartbeat JSON Schema Validator
 */

function parseJSON(rawBufferOrString) {
  if (rawBufferOrString !== null && typeof rawBufferOrString === 'object' && !Buffer.isBuffer(rawBufferOrString)) {
    return { success: true, data: rawBufferOrString };
  }
  try {
    const stringData = Buffer.isBuffer(rawBufferOrString)
      ? rawBufferOrString.toString('utf8')
      : String(rawBufferOrString);
    return { success: true, data: JSON.parse(stringData) };
  } catch (err) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}


/**
 * Validates incoming telemetry payload against schema and realistic bounds
 */
function validateTelemetryPayload(rawInput) {
  const parseResult = parseJSON(rawInput);
  if (!parseResult.success) {
    return { isValid: false, errors: [parseResult.error], parsed: null };
  }

  const payload = parseResult.data;
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Payload must be a valid JSON object'], parsed: null };
  }

  // Mandatory fields
  if (!payload.device_id || typeof payload.device_id !== 'string' || payload.device_id.trim() === '') {
    errors.push('Missing or invalid mandatory string field: device_id');
  }

  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
  if (isNaN(timestamp.getTime())) {
    errors.push(`Invalid timestamp string format: ${payload.timestamp}`);
  }

  // Sensor parameters validation (accept null for F.2 sensor fault)
  const validateNumericOrNull = (field, val, min, max) => {
    if (val === null || val === undefined) return null;
    if (typeof val !== 'number' || isNaN(val)) {
      errors.push(`Field '${field}' must be a number or null, got: ${typeof val}`);
      return null;
    }
    if (min !== undefined && val < min) {
      errors.push(`Field '${field}' value ${val} below min threshold ${min}`);
    }
    if (max !== undefined && val > max) {
      errors.push(`Field '${field}' value ${val} exceeds max threshold ${max}`);
    }
    return val;
  };

  // Helper to sanitize rain intensity if raw ESP32 ADC values leak through
  let cleanRain = payload.rain_intensity;
  if (cleanRain !== null && cleanRain !== undefined && typeof cleanRain === 'number') {
    if (cleanRain >= 3800) {
      // Raw 12-bit ADC value on dry FC-37 sensor is 4095 (~3800-4095) -> 0.0 mm/h
      cleanRain = 0.0;
    } else if (cleanRain > 100) {
      // Map wet ADC (1000..3800) to 80..0 mm/h
      cleanRain = Math.max(0, Math.min(100, ((3800 - cleanRain) / (3800 - 1000)) * 80));
      cleanRain = Number(cleanRain.toFixed(1));
    }
  }

  const sanitized = {
    device_id: payload.device_id ? payload.device_id.trim() : null,
    timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
    temperature: validateNumericOrNull('temperature', payload.temperature, -50, 100),
    humidity: validateNumericOrNull('humidity', payload.humidity, 0, 100),
    pressure: validateNumericOrNull('pressure', payload.pressure, 300, 1200),
    light_lux: validateNumericOrNull('light_lux', payload.light_lux, 0, 200000),
    rain_intensity: validateNumericOrNull('rain_intensity', cleanRain, 0, 150),
    gas_aqi: validateNumericOrNull('gas_aqi', payload.gas_aqi, 0, 500),
    wind_speed: validateNumericOrNull('wind_speed', payload.wind_speed, 0, 200)
  };

  const isValid = errors.length === 0;
  return { isValid, errors, parsed: sanitized };
}

/**
 * Validates heartbeat message payload
 */
function validateHeartbeatPayload(rawInput) {
  const parseResult = parseJSON(rawInput);
  if (!parseResult.success) {
    return { isValid: false, errors: [parseResult.error], parsed: null };
  }

  const payload = parseResult.data;
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Heartbeat payload must be a valid JSON object'], parsed: null };
  }

  if (!payload.device_id || typeof payload.device_id !== 'string' || payload.device_id.trim() === '') {
    errors.push('Missing or invalid device_id in heartbeat payload');
  }

  const timestamp = payload.heartbeat_timestamp || payload.timestamp;
  const parsedTime = timestamp ? new Date(timestamp) : new Date();

  const sanitized = {
    device_id: payload.device_id ? payload.device_id.trim() : null,
    status: payload.status || 'online',
    heartbeat_timestamp: isNaN(parsedTime.getTime()) ? new Date() : parsedTime
  };

  const isValid = errors.length === 0;
  return { isValid, errors, parsed: sanitized };
}

module.exports = {
  validateTelemetryPayload,
  validateHeartbeatPayload
};
