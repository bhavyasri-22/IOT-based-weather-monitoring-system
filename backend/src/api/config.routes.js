const express = require('express');
const router = express.Router();
const Threshold = require('../models/Threshold');
const { seedDefaultThresholds } = require('../alerts/thresholdEngine');
const { authenticateJWT, requireRole } = require('../auth/jwt');

/**
 * GET /api/config/thresholds
 * Returns all configured system threshold rules (accessible to all authenticated operators & admins)
 */
router.get('/thresholds', async (req, res) => {
  try {
    await seedDefaultThresholds();
    const thresholds = await Threshold.find().sort({ parameter: 1 });
    res.json({
      success: true,
      data: thresholds,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch threshold configurations: ${err.message}`
    });
  }
});

/**
 * PUT /api/config/thresholds/:parameter
 * Updates threshold rule limits for a specific weather parameter
 */
router.put('/thresholds/:parameter', async (req, res) => {
  try {
    const { parameter } = req.params;
    const { warning_min, warning_max, critical_min, critical_max, is_enabled, metric_name, unit, description } = req.body;

    const updated = await Threshold.findOneAndUpdate(
      { parameter },
      {
        $set: {
          ...(warning_min !== undefined && { warning_min }),
          ...(warning_max !== undefined && { warning_max }),
          ...(critical_min !== undefined && { critical_min }),
          ...(critical_max !== undefined && { critical_max }),
          ...(is_enabled !== undefined && { is_enabled }),
          ...(metric_name !== undefined && { metric_name }),
          ...(unit !== undefined && { unit }),
          ...(description !== undefined && { description })
        }
      },
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
      error: `Failed to update threshold rule: ${err.message}`
    });
  }
});

module.exports = router;
