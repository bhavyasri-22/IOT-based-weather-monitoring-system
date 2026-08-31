const DeviceHealth = require('../models/DeviceHealth');
const mongoose = require('mongoose');

/**
 * Handles incoming heartbeat pings (DFD 0.3.4)
 * Updates deviceHealth collection with last_seen and online status.
 * 
 * @param {Object} heartbeatData - Validated heartbeat payload
 * @returns {Promise<Object>} Updated device health document or in-memory object
 */
async function handleHeartbeat(heartbeatData) {
  const { device_id, heartbeat_timestamp, status } = heartbeatData;
  const timestamp = heartbeat_timestamp ? new Date(heartbeat_timestamp) : new Date();
  const currentStatus = status || 'online';

  if (mongoose.connection.readyState === 1) {
    try {
      const prevRecord = await DeviceHealth.findOne({ device_id });
      const wasOffline = prevRecord && prevRecord.status === 'offline';

      const updated = await DeviceHealth.findOneAndUpdate(
        { device_id },
        {
          $set: {
            status: currentStatus,
            last_seen: timestamp,
            last_seen_timestamp: timestamp,
            last_heartbeat: timestamp
          },
          $setOnInsert: {
            first_seen: timestamp,
            firmware_version: '1.0.0'
          }
        },
        { upsert: true, new: true }
      );

      if (wasOffline) {
        console.log(`[Device Health Monitor] 🟢 Device '${device_id}' recovered back ONLINE (Heartbeat received)`);
      }

      return updated;
    } catch (err) {
      console.error(`[Device Health Monitor] Error updating heartbeat in DB: ${err.message}`);
      throw err;
    }
  }

  // Fallback for in-memory / testing without DB connection
  return {
    device_id,
    status: currentStatus,
    last_seen: timestamp,
    last_seen_timestamp: timestamp,
    last_heartbeat: timestamp
  };
}

module.exports = {
  handleHeartbeat
};
