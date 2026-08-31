const SensorReading = require('../models/SensorReading');
const DeviceHealth = require('../models/DeviceHealth');
const { validateTelemetryPayload, validateHeartbeatPayload } = require('../validators/telemetryValidator');
const { calculateHeatIndex } = require('../utils/weatherDerivations');
const mongoose = require('mongoose');

/**
 * Centralized Ingestion Service for MQTT Telemetry and Heartbeats
 */
class IngestionService {
  /**
   * Processes incoming weather telemetry message
   * @param {Buffer|string} rawPayload 
   */
  async processTelemetry(rawPayload) {
    const validation = validateTelemetryPayload(rawPayload);

    if (!validation.isValid) {
      console.warn(`[Ingestion Service] ⚠️ INVALID TELEMETRY DROPPED:`, {
        errors: validation.errors,
        rawPayload: rawPayload.toString()
      });
      return { success: false, reason: 'validation_failed', errors: validation.errors };
    }

    const telemetryData = validation.parsed;

    // Calculate derived parameters (Heat Index)
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

    // Persist to MongoDB if connection is ready
    if (mongoose.connection.readyState === 1) {
      try {
        savedReading = await SensorReading.create(docToSave);

        // Upsert Device Health state
        await DeviceHealth.findOneAndUpdate(
          { device_id: telemetryData.device_id },
          {
            $set: {
              status: 'online',
              last_telemetry: telemetryData.timestamp
            }
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.error(`[Ingestion Service] DB Persistence Error: ${dbErr.message}`);
      }
    } else {
      console.log(`[Ingestion Service] DB offline - Telemetry processed in-memory: Device '${telemetryData.device_id}'`);
    }

    console.log(
      `[Ingestion Service] ✅ INGESTED: Device='${telemetryData.device_id}' | ` +
      `Temp=${telemetryData.temperature ?? 'N/A'}°C | Hum=${telemetryData.humidity ?? 'N/A'}% | ` +
      `HeatIndex=${heatIndex ?? 'N/A'}°C | Press=${telemetryData.pressure ?? 'N/A'}hPa`
    );

    return { success: true, data: savedReading };
  }

  /**
   * Processes incoming node heartbeat message
   * @param {Buffer|string} rawPayload 
   */
  async processHeartbeat(rawPayload) {
    const validation = validateHeartbeatPayload(rawPayload);

    if (!validation.isValid) {
      console.warn(`[Ingestion Service] ⚠️ INVALID HEARTBEAT DROPPED:`, validation.errors);
      return { success: false, reason: 'validation_failed', errors: validation.errors };
    }

    const heartbeat = validation.parsed;

    if (mongoose.connection.readyState === 1) {
      try {
        await DeviceHealth.findOneAndUpdate(
          { device_id: heartbeat.device_id },
          {
            $set: {
              status: heartbeat.status || 'online',
              last_heartbeat: heartbeat.heartbeat_timestamp
            }
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.error(`[Ingestion Service] Heartbeat DB Error: ${dbErr.message}`);
      }
    }

    console.log(`[Ingestion Service] 💓 HEARTBEAT: Device='${heartbeat.device_id}' Status='${heartbeat.status}'`);
    return { success: true, data: heartbeat };
  }
}

module.exports = new IngestionService();
