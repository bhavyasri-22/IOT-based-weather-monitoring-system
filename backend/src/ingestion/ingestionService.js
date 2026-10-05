const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const { validateTelemetryPayload, validateHeartbeatPayload } = require('../validators/telemetryValidator');
const { calculateHeatIndex } = require('../utils/weatherDerivations');
const { handleHeartbeat } = require('../deviceHealth/heartbeatHandler');
const { evaluateTelemetryAlerts, resolveDeviceOfflineAlert } = require('../alerts/thresholdEngine');
const wsGateway = require('../ws/gateway');
const mongoose = require('mongoose');

/**
 * Centralized Ingestion Service for MQTT Telemetry and Heartbeats (SRS F.6, F.7, F.11)
 */
class IngestionService {
  /**
   * Processes incoming weather telemetry message
   * @param {Buffer|string|Object} rawPayload 
   */
  async processTelemetry(rawPayload) {
    const validation = validateTelemetryPayload(rawPayload);

    if (!validation.isValid) {
      console.warn(`[Ingestion Service] ⚠️ INVALID TELEMETRY DROPPED:`, {
        errors: validation.errors,
        rawPayload: typeof rawPayload === 'object' && !Buffer.isBuffer(rawPayload) ? JSON.stringify(rawPayload) : rawPayload.toString()
      });
      return { success: false, reason: 'validation_failed', errors: validation.errors };
    }

    const telemetryData = validation.parsed;

    // Calculate derived parameters (Heat Index per SRS F.8)
    const heatIndex = calculateHeatIndex(telemetryData.temperature, telemetryData.humidity);

    const docToSave = {
      ...telemetryData,
      derived: {
        heat_index: heatIndex
      },
      is_valid: true,
      ingested_at: new Date()
    };

    let savedReading = docToSave;

    // Persist to MongoDB if connection is ready (SRS F.7)
    if (mongoose.connection.readyState === 1) {
      try {
        savedReading = await SensorReading.create(docToSave);

        // Update Device Health state (SRS F.11, last_seen & status: online)
        const prevDevice = await DeviceHealth.findOne({ device_id: telemetryData.device_id });
        const wasOffline = prevDevice && prevDevice.status === 'offline';

        const now = new Date();
        await DeviceHealth.findOneAndUpdate(
          { device_id: telemetryData.device_id },
          {
            $set: {
              status: 'online',
              last_seen: now,
              last_seen_timestamp: now,
              last_telemetry: now
            },
            $setOnInsert: {
              first_seen: now,
              firmware_version: '1.0.0'
            }
          },
          { upsert: true, new: true }
        );

        if (wasOffline) {
          console.log(`[Device Health Monitor] 🟢 Device '${telemetryData.device_id}' recovered back ONLINE (Telemetry received)`);
          await resolveDeviceOfflineAlert(telemetryData.device_id);
          wsGateway.broadcastDeviceStatus(telemetryData.device_id, 'online');
        }

        // Evaluate system thresholds and manage active alerts
        await evaluateTelemetryAlerts(telemetryData.device_id, docToSave);

      } catch (dbErr) {
        console.error(`[Ingestion Service] DB Persistence Error: ${dbErr.message}`);
      }
    } else {
      console.log(`[Ingestion Service] DB offline - Telemetry processed in-memory: Device '${telemetryData.device_id}'`);
    }

    console.log(
      `[Ingestion Service] ✅ INGESTED & PERSISTED: Device='${telemetryData.device_id}' | ` +
      `Temp=${telemetryData.temperature ?? 'N/A'}°C | Hum=${telemetryData.humidity ?? 'N/A'}% | ` +
      `HeatIndex=${heatIndex ?? 'N/A'}°C | Press=${telemetryData.pressure ?? 'N/A'}hPa`
    );

    // Broadcast telemetry:new real-time event to connected WebSocket clients (SRS F.10)
    wsGateway.broadcastTelemetry(savedReading);

    return { success: true, data: savedReading };
  }

  /**
   * Processes incoming node heartbeat message (SRS F.5, DFD 0.3.4)
   * @param {Buffer|string|Object} rawPayload 
   */
  async processHeartbeat(rawPayload) {
    const validation = validateHeartbeatPayload(rawPayload);

    if (!validation.isValid) {
      console.warn(`[Ingestion Service] ⚠️ INVALID HEARTBEAT DROPPED:`, validation.errors);
      return { success: false, reason: 'validation_failed', errors: validation.errors };
    }

    const heartbeat = validation.parsed;
    const result = await handleHeartbeat(heartbeat);

    console.log(`[Ingestion Service] 💓 HEARTBEAT TRACKED: Device='${heartbeat.device_id}' Status='${heartbeat.status}'`);
    return { success: true, data: result };
  }
}

module.exports = new IngestionService();
