const mqtt = require('mqtt');
const ingestionService = require('../ingestion/ingestionService');

class MqttSubscriber {
  constructor() {
    this.client = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.lastConnected = null;
    this.lastError = null;
  }

  /**
   * Builds connection options supporting both full MQTT_BROKER_URL and granular env variables
   */
  getConnectionConfig() {
    let brokerUrl = process.env.MQTT_BROKER_URL;

    // Granular environment variable support
    const host = process.env.MQTT_HOST;
    const port = process.env.MQTT_PORT || (process.env.MQTT_USE_TLS === 'true' ? 8883 : 1883);
    const useTls = process.env.MQTT_USE_TLS === 'true' || (brokerUrl && brokerUrl.startsWith('mqtts://'));
    const protocol = process.env.MQTT_PROTOCOL || (useTls ? 'mqtts' : 'mqtt');

    if (!brokerUrl && host) {
      brokerUrl = `${protocol}://${host}:${port}`;
    } else if (!brokerUrl) {
      brokerUrl = 'mqtt://127.0.0.1:1883';
    }

    const username = process.env.MQTT_USERNAME || process.env.MQTT_USER;
    const password = process.env.MQTT_PASSWORD || process.env.MQTT_PASS;
    const clientId = process.env.MQTT_CLIENT_ID || `weather_backend_ingest_${Math.random().toString(16).substring(2, 8)}`;
    const rejectUnauthorized = process.env.MQTT_REJECT_UNAUTHORIZED !== 'false';

    const options = {
      clientId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 15000,
      rejectUnauthorized,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    };

    return { brokerUrl, options };
  }

  init() {
    const { brokerUrl, options } = this.getConnectionConfig();

    // Mask credentials for clean production logging
    const sanitizedUrl = brokerUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`[MQTT Consumer] Initializing connection to MQTT broker: ${sanitizedUrl}`);

    this.status = 'connecting';

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.status = 'connected';
        this.lastConnected = new Date().toISOString();
        this.lastError = null;
        console.log(`[MQTT Consumer] ✅ Connected successfully to MQTT broker at ${sanitizedUrl}`);

        const topics = ['weather/telemetry', 'weather/heartbeat'];
        this.client.subscribe(topics, (err, granted) => {
          if (err) {
            console.error(`[MQTT Consumer] ❌ Topic subscription failed: ${err.message}`);
          } else {
            granted.forEach((g) => {
              console.log(`[MQTT Consumer] 📡 Subscribed to topic '${g.topic}' (QoS ${g.qos})`);
            });
          }
        });
      });

      this.client.on('message', async (topic, payload) => {
        try {
          if (topic === 'weather/telemetry') {
            await ingestionService.processTelemetry(payload);
          } else if (topic === 'weather/heartbeat') {
            await ingestionService.processHeartbeat(payload);
          } else {
            console.warn(`[MQTT Consumer] Received message on unhandled topic: ${topic}`);
          }
        } catch (err) {
          console.error(`[MQTT Consumer] Error processing message on topic '${topic}': ${err.message}`);
        }
      });

      this.client.on('reconnect', () => {
        this.status = 'connecting';
        console.log(`[MQTT Consumer] 🔄 Connection lost. Attempting to reconnect to MQTT broker...`);
      });

      this.client.on('error', (err) => {
        this.status = 'error';
        this.lastError = err.message;
        console.error(`[MQTT Consumer] ⚠️ MQTT Error: ${err.message}`);
      });

      this.client.on('close', () => {
        if (this.status !== 'error') {
          this.status = 'disconnected';
        }
        console.log(`[MQTT Consumer] MQTT Connection closed.`);
      });
    } catch (err) {
      this.status = 'error';
      this.lastError = err.message;
      console.error(`[MQTT Consumer] ❌ Failed to initiate MQTT client: ${err.message}`);
    }
  }

  getStatus() {
    return {
      status: this.status,
      lastConnected: this.lastConnected,
      lastError: this.lastError
    };
  }

  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.status = 'disconnected';
      console.log(`[MQTT Consumer] Disconnected cleanly.`);
    }
  }
}

module.exports = new MqttSubscriber();
