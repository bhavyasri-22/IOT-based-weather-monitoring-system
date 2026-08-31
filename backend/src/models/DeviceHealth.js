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
      default: 'online'
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DeviceHealth', deviceHealthSchema);
