const mongoose = require('mongoose');

const deviceHealthSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded'],
      default: 'online',
      index: true
    },
    api_key: {
      type: String,
      default: null
    },
    last_seen: {
      type: Date,
      default: Date.now,
      index: true
    },
    last_seen_timestamp: {
      type: Date,
      default: Date.now
    },
    last_heartbeat: {
      type: Date,
      default: null
    },
    last_telemetry: {
      type: Date,
      default: null
    },
    ip_address: {
      type: String,
      default: null
    },
    firmware_version: {
      type: String,
      default: '1.0.0'
    },
    first_seen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying devices needing offline transition check
deviceHealthSchema.index({ status: 1, last_seen: 1 });

module.exports = mongoose.model('DeviceHealth', deviceHealthSchema);
