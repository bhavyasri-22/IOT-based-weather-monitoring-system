const mongoose = require('mongoose');

const thresholdSchema = new mongoose.Schema(
  {
    parameter: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    metric_name: {
      type: String,
      required: true
    },
    warning_min: {
      type: Number,
      default: null
    },
    warning_max: {
      type: Number,
      default: null
    },
    critical_min: {
      type: Number,
      default: null
    },
    critical_max: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: ''
    },
    is_enabled: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Threshold', thresholdSchema);
