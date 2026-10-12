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
 * GET /api/alerts/unread-count
 * Returns total count of unread active alerts
 */
router.get('/unread-count', async (req, res) => {
  try {
    const unreadCount = await AlertLog.countDocuments({
      status: 'active',
      $or: [{ is_read: false }, { is_read: { $exists: false } }]
    });

    res.json({
      success: true,
      count: unreadCount,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      count: 0,
      error: `Failed to fetch unread alert count: ${err.message}`
    });
  }
});

/**
 * PUT /api/alerts/mark-all-read
 * Marks all active unread alerts as read
 */
router.put('/mark-all-read', async (req, res) => {
  try {
    const result = await AlertLog.updateMany(
      { status: 'active', $or: [{ is_read: false }, { is_read: { $exists: false } }] },
      { $set: { is_read: true, read_at: new Date() } }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount || result.nModified || 0,
      unreadCount: 0,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to mark alerts as read: ${err.message}`
    });
  }
});

/**
 * PUT /api/alerts/:alertId/read
 * Marks a specific alert as read
 */
router.put('/:alertId/read', async (req, res) => {
  try {
    const alert = await AlertLog.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    alert.is_read = true;
    alert.read_at = new Date();
    await alert.save();

    const remainingUnread = await AlertLog.countDocuments({
      status: 'active',
      is_read: false
    });

    res.json({
      success: true,
      data: alert,
      unreadCount: remainingUnread,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to mark alert as read: ${err.message}`
    });
  }
});

const wsGateway = require('../ws/gateway');

/**
 * PUT /api/alerts/:alertId/resolve
 * Manually resolves an active alert
 */
router.put('/:alertId/resolve', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    let alert = null;
    try {
      alert = await AlertLog.findById(req.params.alertId);
    } catch {}

    if (!alert) return res.status(404).json({ success: false, data: null, error: 'Alert not found.' });

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
