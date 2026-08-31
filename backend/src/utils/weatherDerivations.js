/**
 * Weather Derivation Utilities
 * Contains mathematical formulas for calculated metrics such as Heat Index.
 */

/**
 * Calculates Heat Index (°C) using NWS formula given Temperature (°C) and Relative Humidity (%)
 * @param {number|null} tempC - Temperature in Celsius
 * @param {number|null} humidity - Relative Humidity percentage (0-100)
 * @returns {number|null} Heat index in Celsius (rounded to 1 decimal place), or null if inputs invalid
 */
function calculateHeatIndex(tempC, humidity) {
  if (tempC === null || tempC === undefined || humidity === null || humidity === undefined) {
    return null;
  }

  if (typeof tempC !== 'number' || typeof humidity !== 'number' || isNaN(tempC) || isNaN(humidity)) {
    return null;
  }

  // Convert Celsius to Fahrenheit for standard NWS formula
  const T = (tempC * 9 / 5) + 32;
  const RH = humidity;

  let hiF;

  if (T < 80) {
    // Simple Heat Index formula for lower temperatures
    hiF = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
  } else {
    // Full Rothfusz regression equation
    hiF = -42.379 +
      (2.04901523 * T) +
      (10.14333127 * RH) -
      (0.22475541 * T * RH) -
      (0.00683783 * T * T) -
      (0.05481717 * RH * RH) +
      (0.00122874 * T * T * RH) +
      (0.00085282 * T * RH * RH) -
      (0.00000199 * T * T * RH * RH);

    // Adjustments for extreme conditions
    if (RH < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
      hiF -= adjustment;
    } else if (RH > 85 && T >= 80 && T <= 87) {
      const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
      hiF += adjustment;
    }
  }

  // Convert Heat Index back to Celsius
  const hiC = (hiF - 32) * 5 / 9;
  return parseFloat(hiC.toFixed(1));
}

module.exports = {
  calculateHeatIndex
};
