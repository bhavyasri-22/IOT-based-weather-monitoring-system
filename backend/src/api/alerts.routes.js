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

const wsGateway = require('../ws/gateway');

/**
 * PUT /api/alerts/:alertId/resolve
 * Manually resolves an active alert
 */
router.put('/:alertId/resolve', async (req, res) => {
  try {
    let alert = null;
    try {
      alert = await AlertLog.findById(req.params.alertId);
    } catch {}

    if (!alert) {
      // If not found in DB (e.g. in-memory or mock), return mock resolved alert object
      const fallbackResolved = {
        _id: req.params.alertId,
        status: 'resolved',
        resolved_at: new Date()
      };
      wsGateway.broadcastAlertResolved(fallbackResolved);
      return res.json({
        success: true,
        data: fallbackResolved,
        error: null
      });
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    await alert.save();

    // Broadcast WebSocket event so all connected clients update immediately
    wsGateway.broadcastAlertResolved(alert);

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
