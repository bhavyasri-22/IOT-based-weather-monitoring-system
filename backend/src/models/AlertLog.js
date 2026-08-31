const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      index: true
    },
    alert_type: {
      type: String,
      enum: ['threshold_exceeded', 'device_offline', 'sensor_fault'],
      required: true
    },
    parameter: {
      type: String,
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['warning', 'critical', 'info'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    trigger_value: {
      type: Number,
      default: null
    },
    threshold_limit: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      index: true
    },
    triggered_at: {
      type: Date,
      default: Date.now
    },
    resolved_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookup of active alerts per device and parameter
alertLogSchema.index({ device_id: 1, parameter: 1, status: 1 });

module.exports = mongoose.model('AlertLog', alertLogSchema);
