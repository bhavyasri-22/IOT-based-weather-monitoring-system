const { calculateHeatIndex } = require('../utils/weatherDerivations');

/**
 * Categorizes Heat Index (°C) into standard NWS risk levels
 * @param {number|null} heatIndexC 
 * @returns {string} Risk category ('Normal', 'Caution', 'Extreme Caution', 'Danger', 'Extreme Danger')
 */
function getHeatIndexCategory(heatIndexC) {
  if (heatIndexC === null || heatIndexC === undefined || isNaN(heatIndexC)) {
    return 'Unknown';
  }
  // Convert °C to °F for NWS standard ranges:
  // < 80°F (26.7°C): Normal
  // 80°F - 90°F (26.7°C - 32.2°C): Caution
  // 90°F - 103°F (32.2°C - 39.4°C): Extreme Caution
  // 103°F - 124°F (39.4°C - 51.1°C): Danger
  // >= 125°F (51.7°C): Extreme Danger
  if (heatIndexC < 26.7) return 'Normal';
  if (heatIndexC < 32.2) return 'Caution';
  if (heatIndexC < 39.4) return 'Extreme Caution';
  if (heatIndexC < 51.1) return 'Danger';
  return 'Extreme Danger';
}

module.exports = {
  calculateHeatIndex,
  getHeatIndexCategory
};
