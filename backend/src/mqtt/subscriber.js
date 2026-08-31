const mqtt = require('mqtt');
const ingestionService = require('../ingestion/ingestionService');

class MqttSubscriber {
  constructor() {
    this.client = null;
  }

  init() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
    const clientId = `backend_consumer_${Math.random().toString(16).substring(2, 8)}`;

    console.log(`[MQTT Consumer] Initializing subscriber connection to ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      reconnectPeriod: 3000,
      connectTimeout: 10000
    });

    this.client.on('connect', () => {
      console.log(`[MQTT Consumer] Connected successfully to Mosquitto MQTT broker at ${brokerUrl}`);

      const topics = ['weather/telemetry', 'weather/heartbeat'];
      this.client.subscribe(topics, (err, granted) => {
        if (err) {
          console.error(`[MQTT Consumer] Subscription failed: ${err.message}`);
        } else {
          granted.forEach((g) => {
            console.log(`[MQTT Consumer] Subscribed to topic: ${g.topic} (QoS ${g.qos})`);
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
          console.warn(`[MQTT Consumer] Received message on unexpected topic: ${topic}`);
        }
      } catch (err) {
        console.error(`[MQTT Consumer] Error handling message on topic '${topic}': ${err.message}`);
      }
    });

    this.client.on('reconnect', () => {
      console.log(`[MQTT Consumer] Connection lost. Attempting to reconnect to MQTT broker...`);
    });

    this.client.on('error', (err) => {
      console.error(`[MQTT Consumer] MQTT Connection Error: ${err.message}`);
    });

    this.client.on('close', () => {
      console.log(`[MQTT Consumer] MQTT Connection closed.`);
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log(`[MQTT Consumer] Disconnected cleanly.`);
    }
  }
}

module.exports = new MqttSubscriber();
