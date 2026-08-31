const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const ingestionService = require('../ingestion/ingestionService');
const { requireDeviceApiKey } = require('../middlewares/apiKeyAuth');

/**
 * GET /api/telemetry/latest
 * Returns latest telemetry reading across devices (or aggregated latest per device)
 */
router.get('/latest', async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    if (deviceId) {
      const latest = await SensorReading.findOne({ device_id: deviceId }).sort({ timestamp: -1 });
      if (!latest) {
        return res.status(404).json({
          success: false,
          data: null,
          error: `No telemetry found for device '${deviceId}'`
        });
      }
      return res.json({
        success: true,
        data: latest,
        error: null
      });
    }

    // Aggregate latest reading per unique device
    const latestPerDevice = await SensorReading.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$device_id',
          latestReading: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestReading' } }
    ]);

    res.json({
      success: true,
      data: latestPerDevice,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch latest telemetry: ${err.message}`
    });
  }
});

/**
 * GET /api/telemetry/latest/:deviceId
 * Returns latest telemetry reading for a specific device node
 */
router.get('/latest/:deviceId', async (req, res) => {
  try {
    const latest = await SensorReading.findOne({ device_id: req.params.deviceId }).sort({ timestamp: -1 });
    if (!latest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `No telemetry found for device '${req.params.deviceId}'`
      });
    }
    res.json({
      success: true,
      data: latest,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch latest telemetry for device: ${err.message}`
    });
  }
});

/**
 * GET /api/telemetry/history
 * Query historical telemetry filtered by deviceId, start date, and end date
 */
router.get('/history', async (req, res) => {
  try {
    const { deviceId, start, end, limit = 100 } = req.query;
    const filter = {};

    if (deviceId) {
      filter.device_id = deviceId;
    }

    if (start || end) {
      filter.timestamp = {};
      if (start) filter.timestamp.$gte = new Date(start);
      if (end) filter.timestamp.$lte = new Date(end);
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 100, 1000);
    const readings = await SensorReading.find(filter)
      .sort({ timestamp: -1 })
      .limit(maxLimit);

    res.json({
      success: true,
      data: readings,
      count: readings.length,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch telemetry history: ${err.message}`
    });
  }
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
