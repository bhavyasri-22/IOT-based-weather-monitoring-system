/**
 * Weather and Environmental Calculation Utilities
 * Atmospheric Glass Design System
 */

/**
 * Calculates Heat Index (Feels Like) in Celsius using Rothfusz regression
 */
export function calculateHeatIndex(tempC, humidity) {
  if (tempC == null || humidity == null) return tempC;
  if (tempC < 20) return tempC; // Heat index only applies for warm temperatures

  const T = (tempC * 9) / 5 + 32; // Fahrenheit
  const R = humidity;

  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  const feelsLikeC = ((HI - 32) * 5) / 9;
  return Number(feelsLikeC.toFixed(1));
}

/**
 * Derives comprehensive weather condition name and icon type
 */
export function deriveWeatherCondition(telemetry) {
  if (!telemetry) return { condition: 'Awaiting data…', icon: 'unknown', description: 'No telemetry received yet' };

  const rain = telemetry.rain_intensity != null ? telemetry.rain_intensity : null;
  const humidity = telemetry.humidity != null ? telemetry.humidity : null;
  const lux = telemetry.light_lux != null ? telemetry.light_lux : null;
  const wind = telemetry.wind_speed != null ? telemetry.wind_speed : null;

  // Priority order: extreme events first
  if (rain != null && rain > 15) {
    return { condition: 'Heavy Rain', icon: 'heavy-rain', description: 'Precipitation exceeding 15 mm/h' };
  }
  if (rain != null && rain > 1) {
    return { condition: 'Rain Showers', icon: 'rain', description: 'Active light to moderate rainfall' };
  }
  if (humidity != null && lux != null && humidity > 90 && lux < 500) {
    return { condition: 'Misty / Foggy', icon: 'fog', description: 'High humidity with reduced visibility' };
  }
  if (wind != null && wind > 35) {
    return { condition: 'High Winds', icon: 'wind', description: 'Gale force wind gusts recorded' };
  }
  if (lux != null && lux < 50) {
    return { condition: 'Clear Night', icon: 'clear-night', description: 'Low ambient nocturnal illuminance' };
  }
  if (lux != null && humidity != null && lux > 1200 && humidity < 60) {
    return { condition: 'Sunny & Clear', icon: 'sunny', description: 'High ambient solar irradiance' };
  }
  if (humidity != null && humidity > 70) {
    return { condition: 'Partly Cloudy', icon: 'partly-cloudy', description: 'Scattered cloud cover with humidity' };
  }
  // All sensors present but none of the above conditions matched
  if (rain != null || humidity != null || lux != null) {
    return { condition: 'Fair Weather', icon: 'fair', description: 'Stable ambient atmosphere' };
  }
  return { condition: 'Sensor Offline', icon: 'offline', description: 'Insufficient data from sensors' };
}

/**
 * Calculates Air Quality Index status category
 */
export function getAQIStatus(aqi) {
  if (aqi == null) return { text: 'No Data', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.25)' };
  if (aqi <= 50)  return { text: 'Good',                    color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)',  border: 'rgba(52, 211, 153, 0.25)' };
  if (aqi <= 100) return { text: 'Moderate',                color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.1)',  border: 'rgba(96, 165, 250, 0.25)' };
  if (aqi <= 150) return { text: 'Sensitive Groups',        color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.1)',  border: 'rgba(251, 191, 36, 0.25)' };
  if (aqi <= 200) return { text: 'Unhealthy',               color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)',  border: 'rgba(245, 158, 11, 0.25)' };
  if (aqi <= 250) return { text: 'Very Unhealthy',          color: '#F87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.25)' };
  return             { text: 'Hazardous',                   color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)',  border: 'rgba(220, 38, 38, 0.35)' };
}

/**
 * Converts wind degrees to cardinal direction
 */
export function degreesToCardinal(deg) {
  if (deg == null) return null;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return directions[idx] || 'N';
}

/**
 * Formats time relative to now (e.g., '2s ago', '1m ago')
 */
export function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
