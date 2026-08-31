const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    temperature: {
      type: Number,
      default: null
    },
    humidity: {
      type: Number,
      default: null
    },
    pressure: {
      type: Number,
      default: null
    },
    light_lux: {
      type: Number,
      default: null
    },
    rain_intensity: {
      type: Number,
      default: null
    },
    gas_aqi: {
      type: Number,
      default: null
    },
    wind_speed: {
      type: Number,
      default: null
    },
    derived: {
      heat_index: {
        type: Number,
        default: null
      }
    },
    is_valid: {
      type: Boolean,
      default: true
    },
    ingested_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying recent readings by device
sensorReadingSchema.index({ device_id: 1, timestamp: -1 });

// Index for date range queries
sensorReadingSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);

