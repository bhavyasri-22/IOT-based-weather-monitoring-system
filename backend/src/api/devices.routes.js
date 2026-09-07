const express = require('express');
const router = express.Router();
const DeviceHealth = require('../models/DeviceHealth');
const { authenticateJWT, requireRole } = require('../auth/jwt');

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
      count: devices.length,
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
 * GET /api/devices/health
 * Returns summary statistics of hardware node health across system
 */
router.get('/health', async (req, res) => {
  try {
    const devices = await DeviceHealth.find();
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const degraded = devices.filter(d => d.status === 'degraded').length;

    res.json({
      success: true,
      data: {
        total_devices: total,
        online_devices: online,
        offline_devices: offline,
        degraded_devices: degraded,
        system_status: offline === 0 ? 'healthy' : (online > 0 ? 'degraded' : 'critical')
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch device health summary: ${err.message}`
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

/**
 * POST /api/devices
 * Admin registers a new hardware device node
 */
router.post('/', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { device_id, location, firmware_version, api_key } = req.body;
    if (!device_id || typeof device_id !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'device_id is required'
      });
    }

    const existing = await DeviceHealth.findOne({ device_id: device_id.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Device '${device_id}' already registered`
      });
    }

    const device = new DeviceHealth({
      device_id: device_id.trim(),
      location: location || 'Station Unit',
      firmware_version: firmware_version || '1.0.0',
      api_key: api_key || `esp32-key-${Date.now()}`,
      status: 'offline',
      last_seen: new Date()
    });

    await device.save();

    res.status(201).json({
      success: true,
      data: device,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to register device: ${err.message}`
    });
  }
});

/**
 * PUT /api/devices/:deviceId/key
 * Sets or updates a specific per-device API key
 */
router.put('/:deviceId/key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'apiKey must be a non-empty string'
      });
    }

    const updated = await DeviceHealth.findOneAndUpdate(
      { device_id: req.params.deviceId },
      { $set: { api_key: apiKey.trim() } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: updated,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to update device API key: ${err.message}`
    });
  }
});

/**
 * DELETE /api/devices/:deviceId
 * Admin decommissions and removes a hardware node
 */
router.delete('/:deviceId', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const deleted = await DeviceHealth.findOneAndDelete({ device_id: req.params.deviceId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `Device '${req.params.deviceId}' not found`
      });
    }
    res.json({
      success: true,
      data: { message: `Device '${req.params.deviceId}' removed successfully` },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to remove device: ${err.message}`
    });
  }
});

module.exports = router;
