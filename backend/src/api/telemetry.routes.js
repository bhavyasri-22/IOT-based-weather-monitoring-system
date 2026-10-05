const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');
const ingestionService = require('../ingestion/ingestionService');
const { requireDeviceApiKey } = require('../middlewares/apiKeyAuth');

function sanitizeReading(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj.rain_intensity !== null && obj.rain_intensity !== undefined && typeof obj.rain_intensity === 'number') {
    if (obj.rain_intensity >= 3800) {
      obj.rain_intensity = 0.0;
    } else if (obj.rain_intensity > 100) {
      obj.rain_intensity = Math.max(0, Math.min(100, ((3800 - obj.rain_intensity) / (3800 - 1000)) * 80));
      obj.rain_intensity = Number(obj.rain_intensity.toFixed(1));
    }
  }
  return obj;
}

/**
 * GET /api/telemetry/latest
 * Returns latest telemetry reading across devices (or aggregated latest per device)
 */
router.get('/latest', async (req, res) => {
  const targetId = req.query.deviceId || req.query.device_id;

  try {
    if (mongoose.connection.readyState === 1) {
      if (targetId) {
        const latest = await SensorReading.findOne({ device_id: targetId }).sort({ timestamp: -1 });
        if (latest) {
          return res.json({
            success: true,
            data: sanitizeReading(latest),
            error: null
          });
        }
      }

      // Fallback: get the most recent reading across all recorded devices
      const latestAny = await SensorReading.findOne().sort({ timestamp: -1 });
      if (latestAny) {
        return res.json({
          success: true,
          data: sanitizeReading(latestAny),
          error: null
        });
      }
    }
  } catch (err) {
    console.warn(`[Telemetry Route] DB read warning: ${err.message}`);
  }

  // Fallback to in-memory cache
  const inMem = ingestionService.getLatestReading(targetId);
  if (inMem) {
    return res.json({
      success: true,
      data: sanitizeReading(inMem),
      error: null
    });
  }

  res.json({
    success: true,
    data: null,
    error: null
  });
});

/**
 * GET /api/telemetry/latest/:deviceId
 * Returns latest telemetry reading for a specific device node
 */
router.get('/latest/:deviceId', async (req, res) => {
  const devId = req.params.deviceId;

  try {
    if (mongoose.connection.readyState === 1) {
      const latest = await SensorReading.findOne({ device_id: devId }).sort({ timestamp: -1 });
      if (latest) {
        return res.json({
          success: true,
          data: sanitizeReading(latest),
          error: null
        });
      }
    }
  } catch (err) {
    console.warn(`[Telemetry Route] DB read warning: ${err.message}`);
  }

  const inMem = ingestionService.getLatestReading(devId);
  if (inMem) {
    return res.json({
      success: true,
      data: sanitizeReading(inMem),
      error: null
    });
  }

  res.status(404).json({
    success: false,
    data: null,
    error: `No telemetry found for device '${devId}'`
  });
});

/**
 * GET /api/telemetry/history
 * Query historical telemetry filtered by deviceId, start date, and end date
 */
router.get('/history', async (req, res) => {
  const { deviceId, start, end, limit = 100 } = req.query;

  try {
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (deviceId) filter.device_id = deviceId;
      if (start || end) {
        filter.timestamp = {};
        if (start) filter.timestamp.$gte = new Date(start);
        if (end) filter.timestamp.$lte = new Date(end);
      }

      const maxLimit = Math.min(parseInt(limit, 10) || 100, 1000);
      const readings = await SensorReading.find(filter)
        .sort({ timestamp: -1 })
        .limit(maxLimit);

      if (readings && readings.length > 0) {
        return res.json({
          success: true,
          data: readings.map(sanitizeReading),
          count: readings.length,
          error: null
        });
      }
    }
  } catch (err) {
    console.warn(`[Telemetry Route] DB history read warning: ${err.message}`);
  }

  // Fallback to in-memory history
  const inMemHistory = ingestionService.getHistoryReadings(deviceId, parseInt(limit, 10) || 100);
  res.json({
    success: true,
    data: inMemHistory.map(sanitizeReading),
    count: inMemHistory.length,
    error: null
  });
});

/**
 * POST /api/telemetry/ingest
 * HTTPS REST Fallback ingestion endpoint (SRS F.4)
 * Protected by per-device API key middleware.
 * Uses exact same ingestionService processing pipeline as MQTT subscriber.
 */
router.post('/ingest', requireDeviceApiKey, async (req, res) => {
  try {
    const result = await ingestionService.processTelemetry(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: result.errors || 'Telemetry validation failed'
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Ingestion processing error: ${err.message}`
    });
  }
});

module.exports = router;
