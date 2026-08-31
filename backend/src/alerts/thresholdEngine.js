const mongoose = require('mongoose');
const Threshold = require('../models/Threshold');
const AlertLog = require('../models/AlertLog');

// Default System Threshold Definitions (SRS F.8, F.9, F.10)
const DEFAULT_THRESHOLDS = [
  {
    parameter: 'temperature',
    metric_name: 'Temperature',
    warning_min: 5,
    warning_max: 35,
    critical_min: 0,
    critical_max: 40,
    unit: '°C',
    is_enabled: true,
    description: 'Ambient air temperature limits'
  },
  {
    parameter: 'humidity',
    metric_name: 'Relative Humidity',
    warning_min: 20,
    warning_max: 80,
    critical_min: 10,
    critical_max: 90,
    unit: '%',
    is_enabled: true,
    description: 'Relative atmospheric humidity limits'
  },
  {
    parameter: 'heat_index',
    metric_name: 'Heat Index',
    warning_min: null,
    warning_max: 32.2,
    critical_min: null,
    critical_max: 41.0,
    unit: '°C',
    is_enabled: true,
    description: 'Calculated Heat Index threshold (NWS Extreme Caution / Danger)'
  },
  {
    parameter: 'gas_aqi',
    metric_name: 'AQI Proxy (MQ135)',
    warning_min: null,
    warning_max: 200,
    critical_min: null,
    critical_max: 300,
    unit: 'AQI Proxy',
    is_enabled: true,
    description: 'Air quality proxy index derived from MQ135 (Note: MQ135 is an AQI proxy, NOT official EPA AQI)'
  },
  {
    parameter: 'wind_speed',
    metric_name: 'Wind Speed',
    warning_min: null,
    warning_max: 15,
    critical_min: null,
    critical_max: 25,
    unit: 'm/s',
    is_enabled: true,
    description: 'Wind speed thresholds'
  },
  {
    parameter: 'rain_intensity',
    metric_name: 'Rainfall Intensity',
    warning_min: null,
    warning_max: 25,
    critical_min: null,
    critical_max: 50,
    unit: 'mm/hr',
    is_enabled: true,
    description: 'Precipitation rate warning levels'
  },
  {
    parameter: 'pressure',
    metric_name: 'Barometric Pressure',
    warning_min: 980,
    warning_max: null,
    critical_min: 950,
    critical_max: null,
    unit: 'hPa',
    is_enabled: true,
    description: 'Low atmospheric pressure storm warning threshold'
  }
];

/**
 * Ensures system default threshold rules exist in database
 */
async function seedDefaultThresholds() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    for (const rule of DEFAULT_THRESHOLDS) {
      await Threshold.findOneAndUpdate(
        { parameter: rule.parameter },
        { $setOnInsert: rule },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error(`[Threshold Engine] Error seeding default thresholds: ${err.message}`);
  }
}

/**
 * Evaluates telemetry reading against configured thresholds,
 * creating new alerts or automatically resolving existing active alerts.
 * 
 * @param {string} deviceId 
 * @param {Object} telemetryData 
 * @returns {Promise<Object>} Summary of created & resolved alerts
 */
async function evaluateTelemetryAlerts(deviceId, telemetryData) {
  if (mongoose.connection.readyState !== 1) {
    return { created: [], resolved: [] };
  }

  // Ensure default threshold rules exist
  await seedDefaultThresholds();

  const activeThresholds = await Threshold.find({ is_enabled: true });
  const createdAlerts = [];
  const resolvedAlerts = [];

  for (const rule of activeThresholds) {
    const paramKey = rule.parameter;
    
    // Extract parameter value from telemetryData or telemetryData.derived
    let val = telemetryData[paramKey];
    if (val === undefined && telemetryData.derived) {
      val = telemetryData.derived[paramKey];
    }

    // ----------------------------------------------------
    // CASE A: Sensor Value is NULL / Undefined (Sensor Failure / Unavailable)
    // ----------------------------------------------------
    if (val === null || val === undefined) {
      // Resolve any active threshold_exceeded alert since metric is no longer producing numerical readings
      const activeThresholdAlert = await AlertLog.findOne({
        device_id: deviceId,
        parameter: paramKey,
        alert_type: 'threshold_exceeded',
        status: 'active'
      });
      if (activeThresholdAlert) {
        activeThresholdAlert.status = 'resolved';
        activeThresholdAlert.resolved_at = new Date();
        await activeThresholdAlert.save();
        resolvedAlerts.push(activeThresholdAlert);
      }

      // Check if active sensor_fault alert already exists (Prevent Duplicates)
      const existingFaultAlert = await AlertLog.findOne({
        device_id: deviceId,
        parameter: paramKey,
        alert_type: 'sensor_fault',
        status: 'active'
      });

      if (!existingFaultAlert) {
        const newFault = await AlertLog.create({
          device_id: deviceId,
          alert_type: 'sensor_fault',
          parameter: paramKey,
          severity: 'warning',
          message: `Sensor fault / unavailable for ${rule.metric_name} on device '${deviceId}'`,
          trigger_value: null,
          threshold_limit: null,
          status: 'active'
        });
        createdAlerts.push(newFault);
        console.warn(`[Threshold Engine] ⚠️ SENSOR FAULT ALERT: Device '${deviceId}', Parameter '${paramKey}' unavailable.`);
      }
      continue;
    }

    // ----------------------------------------------------
    // CASE B: Sensor Value is Numerical (Valid Reading)
    // ----------------------------------------------------
    // Auto-resolve any existing active sensor_fault alert since sensor is now working
    const activeFaultAlert = await AlertLog.findOne({
      device_id: deviceId,
      parameter: paramKey,
      alert_type: 'sensor_fault',
      status: 'active'
    });

    if (activeFaultAlert) {
      activeFaultAlert.status = 'resolved';
      activeFaultAlert.resolved_at = new Date();
      await activeFaultAlert.save();
      resolvedAlerts.push(activeFaultAlert);
      console.log(`[Threshold Engine] 🟢 SENSOR FAULT RESOLVED: Device '${deviceId}', Parameter '${paramKey}' restored.`);
    }

    // Evaluate numerical value against threshold rules
    let violationSeverity = null;
    let violatedLimit = null;
    let alertMsg = '';

    if (rule.critical_max !== null && val >= rule.critical_max) {
      violationSeverity = 'critical';
      violatedLimit = rule.critical_max;
      alertMsg = `Critical High ${rule.metric_name}: ${val} ${rule.unit} exceeds limit ${rule.critical_max} ${rule.unit}`;
    } else if (rule.critical_min !== null && val <= rule.critical_min) {
      violationSeverity = 'critical';
      violatedLimit = rule.critical_min;
      alertMsg = `Critical Low ${rule.metric_name}: ${val} ${rule.unit} below limit ${rule.critical_min} ${rule.unit}`;
    } else if (rule.warning_max !== null && val >= rule.warning_max) {
      violationSeverity = 'warning';
      violatedLimit = rule.warning_max;
      alertMsg = `Warning High ${rule.metric_name}: ${val} ${rule.unit} exceeds limit ${rule.warning_max} ${rule.unit}`;
    } else if (rule.warning_min !== null && val <= rule.warning_min) {
      violationSeverity = 'warning';
      violatedLimit = rule.warning_min;
      alertMsg = `Warning Low ${rule.metric_name}: ${val} ${rule.unit} below limit ${rule.warning_min} ${rule.unit}`;
    }

    // Existing active alert check for threshold_exceeded
    const activeThresholdAlert = await AlertLog.findOne({
      device_id: deviceId,
      parameter: paramKey,
      alert_type: 'threshold_exceeded',
      status: 'active'
    });

    if (violationSeverity) {
      // Threshold is violated!
      if (activeThresholdAlert) {
        if (activeThresholdAlert.severity === violationSeverity) {
          // DUPLICATE PREVENTION: Same active alert severity already exists, do not duplicate!
          continue;
        } else {
          // Severity changed (e.g. escalated warning -> critical), resolve previous & create new
          activeThresholdAlert.status = 'resolved';
          activeThresholdAlert.resolved_at = new Date();
          await activeThresholdAlert.save();
          resolvedAlerts.push(activeThresholdAlert);
        }
      }

      // Create new active alert
      const newAlert = await AlertLog.create({
        device_id: deviceId,
        alert_type: 'threshold_exceeded',
        parameter: paramKey,
        severity: violationSeverity,
        message: alertMsg,
        trigger_value: val,
        threshold_limit: violatedLimit,
        status: 'active'
      });
      createdAlerts.push(newAlert);

      console.warn(
        `[Threshold Engine] 🚨 ALERT CREATED [${violationSeverity.toUpperCase()}]: ` +
        `Device '${deviceId}' | ${alertMsg}`
      );
    } else {
      // Value is normal (below thresholds) -> AUTO-RESOLVE active threshold alerts
      if (activeThresholdAlert) {
        activeThresholdAlert.status = 'resolved';
        activeThresholdAlert.resolved_at = new Date();
        await activeThresholdAlert.save();
        resolvedAlerts.push(activeThresholdAlert);

        console.log(
          `[Threshold Engine] 🟢 ALERT RESOLVED: Device '${deviceId}', ` +
          `Parameter '${paramKey}' returned to normal (${val} ${rule.unit}).`
        );
      }
    }
  }

  return { created: createdAlerts, resolved: resolvedAlerts };
}

/**
 * Triggers device_offline critical alert when device times out
 * @param {string} deviceId 
 */
async function evaluateDeviceOfflineAlert(deviceId) {
  if (mongoose.connection.readyState !== 1) return null;

  const existing = await AlertLog.findOne({
    device_id: deviceId,
    parameter: 'device_offline',
    alert_type: 'device_offline',
    status: 'active'
  });

  if (!existing) {
    const offlineAlert = await AlertLog.create({
      device_id: deviceId,
      alert_type: 'device_offline',
      parameter: 'device_offline',
      severity: 'critical',
      message: `Device '${deviceId}' timed out and marked OFFLINE (Inactivity limit exceeded)`,
      trigger_value: null,
      threshold_limit: null,
      status: 'active'
    });
    console.warn(`[Threshold Engine] 🚨 DEVICE OFFLINE ALERT: Device '${deviceId}' is OFFLINE.`);
    return offlineAlert;
  }
  return null;
}

/**
 * Resolves device_offline alert when device recovers back online
 * @param {string} deviceId 
 */
async function resolveDeviceOfflineAlert(deviceId) {
  if (mongoose.connection.readyState !== 1) return null;

  const activeOfflineAlert = await AlertLog.findOne({
    device_id: deviceId,
    parameter: 'device_offline',
    alert_type: 'device_offline',
    status: 'active'
  });

  if (activeOfflineAlert) {
    activeOfflineAlert.status = 'resolved';
    activeOfflineAlert.resolved_at = new Date();
    await activeOfflineAlert.save();
    console.log(`[Threshold Engine] 🟢 DEVICE OFFLINE ALERT RESOLVED: Device '${deviceId}' recovered back ONLINE.`);
    return activeOfflineAlert;
  }
  return null;
}

module.exports = {
  seedDefaultThresholds,
  evaluateTelemetryAlerts,
  evaluateDeviceOfflineAlert,
  resolveDeviceOfflineAlert,
  DEFAULT_THRESHOLDS
};
