const DeviceHealth = require('../models/DeviceHealth');
const mongoose = require('mongoose');

const DEFAULT_SYSTEM_DEVICE_KEY = process.env.DEVICE_API_KEY || 'esp32_secret_api_key_2026';

/**
 * Middleware enforcing per-device API key authentication for HTTPS telemetry ingestion
 */
async function requireDeviceApiKey(req, res, next) {
  let apiKey = req.headers['x-api-key'];

  if (!apiKey && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      apiKey = parts[1];
    }
  }

  if (!apiKey && req.body) {
    apiKey = req.body.api_key || req.body.apiKey;
  }

  if (!apiKey && req.query) {
    apiKey = req.query.api_key || req.query.apiKey;
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Unauthorized device: Missing device API key (header x-api-key or apiKey parameter required)'
    });
  }

  const deviceId = req.body ? req.body.device_id : null;

  // If MongoDB is connected and deviceId is provided, check if custom device API key is set
  if (deviceId && mongoose.connection.readyState === 1) {
    try {
      const deviceDoc = await DeviceHealth.findOne({ device_id: deviceId });
      if (deviceDoc && deviceDoc.api_key) {
        if (apiKey !== deviceDoc.api_key) {
          return res.status(401).json({
            success: false,
            data: null,
            error: `Unauthorized device: Invalid API key for device '${deviceId}'`
          });
        }
        return next();
      }
    } catch (err) {
      console.error(`[API Key Middleware] Error looking up device key: ${err.message}`);
    }
  }

  // Check against default system key
  if (apiKey !== DEFAULT_SYSTEM_DEVICE_KEY) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Unauthorized device: Invalid API key'
    });
  }

  next();
}

module.exports = {
  requireDeviceApiKey,
  DEFAULT_SYSTEM_DEVICE_KEY
};
