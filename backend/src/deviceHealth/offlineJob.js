const mongoose = require('mongoose');
const DeviceHealth = require('../models/DeviceHealth');
const { evaluateDeviceOfflineAlert } = require('../alerts/thresholdEngine');

// SRS Configuration values
const DEFAULT_OFFLINE_TIMEOUT_MS = parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_MS, 10) || (2 * 60 * 1000); // 2 minutes per SRS F.11
const DEFAULT_CHECK_INTERVAL_MS = parseInt(process.env.DEVICE_HEALTH_CHECK_INTERVAL_MS, 10) || 10000; // 10 seconds check frequency
const SAMPLING_INTERVAL_MS = 5000; // 5 seconds per SRS F.1

let jobTimer = null;

/**
 * Scans all devices in MongoDB and marks devices as 'offline'
 * if their last_seen timestamp exceeds the timeout threshold.
 * 
 * @param {number} timeoutMs - Timeout threshold in milliseconds (default: 2 minutes)
 * @returns {Promise<Array>} List of devices that were transitioned to offline
 */
async function checkOfflineDevices(timeoutMs = DEFAULT_OFFLINE_TIMEOUT_MS) {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  const cutoffTime = new Date(Date.now() - timeoutMs);
  const transitionedDevices = [];

  try {
    // Find all active/online devices whose last_seen timestamp is older than cutoffTime
    const staleDevices = await DeviceHealth.find({
      status: { $ne: 'offline' },
      last_seen: { $lt: cutoffTime }
    });

    for (const device of staleDevices) {
      const lastSeenTime = device.last_seen ? new Date(device.last_seen) : new Date(0);
      const elapsedSeconds = Math.round((Date.now() - lastSeenTime.getTime()) / 1000);

      device.status = 'offline';
      await device.save();

      console.warn(
        `[Device Health Monitor] ⚠️ Device '${device.device_id}' timed out ` +
        `(Inactive for ${elapsedSeconds}s, limit: ${timeoutMs / 1000}s). Status set to OFFLINE.`
      );

      // Trigger critical device offline alert
      await evaluateDeviceOfflineAlert(device.device_id);

      transitionedDevices.push(device);
    }
  } catch (err) {
    console.error(`[Device Health Monitor] Error running offline detection check: ${err.message}`);
  }

  return transitionedDevices;
}

/**
 * Starts the periodic background job for device offline detection
 * 
 * @param {number} intervalMs - Frequency of check execution (default: 10s)
 * @param {number} timeoutMs - Timeout before marking offline (default: 2 min)
 */
function startOfflineDetectionJob(intervalMs = DEFAULT_CHECK_INTERVAL_MS, timeoutMs = DEFAULT_OFFLINE_TIMEOUT_MS) {
  if (jobTimer) {
    clearInterval(jobTimer);
  }

  console.log(
    `[Device Health Monitor] 🕒 Starting offline detection background job ` +
    `(Scan interval: ${intervalMs / 1000}s, Offline timeout: ${timeoutMs / 1000}s [SRS F.11])`
  );

  // Run initial check immediately
  checkOfflineDevices(timeoutMs);

  jobTimer = setInterval(() => {
    checkOfflineDevices(timeoutMs);
  }, intervalMs);

  // Unref timer so it does not block Node process exit in tests
  if (jobTimer && typeof jobTimer.unref === 'function') {
    jobTimer.unref();
  }
}

/**
 * Stops the scheduled background job
 */
function stopOfflineDetectionJob() {
  if (jobTimer) {
    clearInterval(jobTimer);
    jobTimer = null;
    console.log(`[Device Health Monitor] Offline detection background job stopped.`);
  }
}

module.exports = {
  DEFAULT_OFFLINE_TIMEOUT_MS,
  DEFAULT_CHECK_INTERVAL_MS,
  SAMPLING_INTERVAL_MS,
  checkOfflineDevices,
  startOfflineDetectionJob,
  stopOfflineDetectionJob
};
