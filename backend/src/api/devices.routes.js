const express = require('express');
const router = express.Router();
const DeviceHealth = require('../models/DeviceHealth');

/**
 * GET /api/devices/status
 * Returns online/offline status and health metadata of all devices (SRS F.9, F.11)
 */
router.get('/status', async (req, res) => {
  try {
    const devices = await DeviceHealth.find().sort({ last_seen: -1 });
    res.json({
      success: true,
      data: devices,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch device status: ${err.message}`
    });
  }
});

/**
 * GET /api/devices/:deviceId
 * Returns health status for a single device node
 */
router.get('/:deviceId', async (req, res) => {
  try {
    const device = await DeviceHealth.findOne({ device_id: req.params.deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `Device '${req.params.deviceId}' not found`
      });
    }
    res.json({
      success: true,
      data: device,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch device: ${err.message}`
    });
  }
});

module.exports = router;
