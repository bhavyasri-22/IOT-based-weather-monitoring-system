const express = require('express');
const router = express.Router();
const AlertLog = require('../models/AlertLog');
const { authenticateJWT, requireRole } = require('../auth/jwt');

/**
 * GET /api/alerts
 * Returns alert log records filterable by status, deviceId, severity
 */
router.get('/', async (req, res) => {
  try {
    const { status, deviceId, severity, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (deviceId) query.device_id = deviceId;
    if (severity) query.severity = severity;

    const alerts = await AlertLog.find(query)
      .sort({ triggered_at: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch alerts: ${err.message}`
    });
  }
});

/**
 * GET /api/alerts/active
 * Returns all active system alerts
 */
router.get('/active', async (req, res) => {
  try {
    const activeAlerts = await AlertLog.find({ status: 'active' }).sort({ triggered_at: -1 });
    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch active alerts: ${err.message}`
    });
  }
});

/**
 * PUT /api/alerts/:alertId/resolve
 * Manually resolves an active alert (Admin Only)
 */
router.put('/:alertId/resolve', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const alert = await AlertLog.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Alert record not found'
      });
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    await alert.save();

    res.json({
      success: true,
      data: alert,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to resolve alert: ${err.message}`
    });
  }
});

module.exports = router;
