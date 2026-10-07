#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>

#include "secrets.h"

// ── Sensor Pin Definitions ───────────────────────────────────────────────────
const int RAIN_AO_PIN = 34; // FC-37 Rain Sensor Analog Output (GPIO 34 / ADC1_CH6)

// ── Networking Clients ───────────────────────────────────────────────────────
WiFiClient espClient;
WiFiClientSecure espClientSecure;
PubSubClient mqttClient;

Adafruit_BME280 bme;
bool bmeAvailable = false;

// ── Timers & Intervals ───────────────────────────────────────────────────────
unsigned long lastTelemetryTime = 0;
unsigned long lastMqttRetryTime = 0;
unsigned long lastWifiRetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = TELEMETRY_INTERVAL_MS;

// ── Offline Ring Buffer (SRS F.4) ───────────────────────────────────────────
const int BUFFER_CAPACITY = 20;
String offlineBuffer[BUFFER_CAPACITY];
int bufferHead = 0;
int bufferCount = 0;

void pushOfflineBuffer(const String& payload) {
  offlineBuffer[bufferHead] = payload;
  bufferHead = (bufferHead + 1) % BUFFER_CAPACITY;
  if (bufferCount < BUFFER_CAPACITY) {
    bufferCount++;
  }
}

void flushOfflineBuffer() {
  if (bufferCount == 0 || !mqttClient.connected()) return;
  Serial.printf("[ESP32 Buffer] Flushing %d buffered telemetry readings...\n", bufferCount);

  int readIndex = (bufferHead - bufferCount + BUFFER_CAPACITY) % BUFFER_CAPACITY;
  while (bufferCount > 0 && mqttClient.connected()) {
    String payload = offlineBuffer[readIndex];
    if (mqttClient.publish(MQTT_TELEMETRY_TOPIC, payload.c_str(), false)) {
      readIndex = (readIndex + 1) % BUFFER_CAPACITY;
      bufferCount--;
    } else {
      break;
    }
    delay(50);
  }
  Serial.printf("[ESP32 Buffer] Flush complete. Remaining: %d\n", bufferCount);
}

// ── Sensor Initialization ────────────────────────────────────────────────────
void setupSensors() {
  Wire.begin(21, 22); // BME280 I2C pins: SDA=21, SCL=22

  if (bme.begin(0x76, &Wire) || bme.begin(0x77, &Wire)) {
    bmeAvailable = true;
    Serial.println("[ESP32] BME280 Sensor Connected successfully!");
  } else {
    bmeAvailable = false;
    Serial.println("[ESP32] WARNING: BME280 Not Found or Address Mismatch! Will send null.");
  }

  analogReadResolution(12); // ADC range 0 - 4095
  Serial.println("[ESP32] Rain Sensor Ready on GPIO 34.");
}

// ── Wi-Fi Connection Manager ─────────────────────────────────────────────────
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[ESP32 Wi-Fi] Connecting to: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[ESP32 Wi-Fi] Connected! IP: %s | RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[ESP32 Wi-Fi] Connection pending. Will retry in background loop.");
  }
}

// ── MQTT Connection Manager ──────────────────────────────────────────────────
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  unsigned long now = millis();
  if (now - lastMqttRetryTime < 5000) return; // Non-blocking retry every 5s
  lastMqttRetryTime = now;

  Serial.printf("[ESP32 MQTT] Connecting to broker %s:%d (TLS=%s)...\n",
                MQTT_SERVER, MQTT_PORT, MQTT_USE_TLS ? "ON" : "OFF");

  String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);

  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  } else {
    connected = mqttClient.connect(clientId.c_str());
  }

  if (connected) {
    Serial.println("[ESP32 MQTT] Connected successfully to MQTT Broker!");
    // Send immediate initial heartbeat
    String heartbeatPayload = String("{\"device_id\":\"") + DEVICE_ID + "\",\"status\":\"online\"}";
    mqttClient.publish(MQTT_HEARTBEAT_TOPIC, heartbeatPayload.c_str(), false);
    // Flush any cached readings from offline periods
    flushOfflineBuffer();
  } else {
    Serial.printf("[ESP32 MQTT] Connect failed! State code: %d\n", mqttClient.state());
  }
}

// ── HTTPS Fallback Transport (SRS F.4) ───────────────────────────────────────
void sendHttpsFallback(const String& jsonPayload) {
#ifdef ENABLE_HTTPS_FALLBACK
  if (!ENABLE_HTTPS_FALLBACK || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  if (strncmp(BACKEND_INGEST_URL, "https", 5) == 0) {
    WiFiClientSecure httpsClient;
    httpsClient.setInsecure();
    http.begin(httpsClient, BACKEND_INGEST_URL);
  } else {
    WiFiClient plainClient;
    http.begin(plainClient, BACKEND_INGEST_URL);
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);

  int httpCode = http.POST(jsonPayload);
  if (httpCode == 200 || httpCode == 201) {
    Serial.println("[ESP32 HTTPS Fallback] Telemetry posted successfully via REST fallback.");
  } else {
    Serial.printf("[ESP32 HTTPS Fallback] POST failed, HTTP code: %d\n", httpCode);
  }
  http.end();
#endif
}

// ── Telemetry Acquisition & Transmission ─────────────────────────────────────
void publishTelemetry() {
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  
  // Note: Backend ingestion service generates real UTC timestamp upon packet arrival

  // 1. BME280 Readings with Sanity Bounds Check (SRS F.2)
  if (bmeAvailable) {
    float temp = bme.readTemperature();
    float hum = bme.readHumidity();
    float press = bme.readPressure() / 100.0F;

    if (!isnan(temp) && !isnan(hum) && !isnan(press) &&
        temp > -40.0 && temp < 85.0 &&
        press > 300.0 && press < 1250.0 &&
        hum >= 0.0 && hum <= 100.0) {
      doc["temperature"] = serialized(String(temp, 2));
      doc["humidity"]    = serialized(String(hum, 2));
      doc["pressure"]    = serialized(String(press, 2));
    } else {
      doc["temperature"] = nullptr;
      doc["humidity"]    = nullptr;
      doc["pressure"]    = nullptr;
    }
  } else {
    doc["temperature"] = nullptr;
    doc["humidity"]    = nullptr;
    doc["pressure"]    = nullptr;
  }

  doc["light_lux"] = nullptr; // BH1750 (optional channel)

  // 2. FC-37 Rain Sensor Analog Processing
  int rainRaw = analogRead(RAIN_AO_PIN);
  float rainRate = 0.0;
  if (rainRaw < 3800) {
    // Wetness mapping: 3800 -> 2 mm/h up to 1000 -> 80 mm/h
    rainRate = (float)map(rainRaw, 3800, 1000, 2, 80);
    if (rainRate < 0.0) rainRate = 0.0;
    if (rainRate > 100.0) rainRate = 100.0;
  } else {
    rainRate = 0.0; // Dry surface
  }
  doc["rain_intensity"] = serialized(String(rainRate, 1));

  doc["gas_aqi"]    = nullptr; // MQ-135 (optional channel)
  doc["wind_speed"] = nullptr; // Anemometer (optional channel)

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  String payloadStr = String(jsonBuffer);

  Serial.printf("[ESP32 Publish]: %s\n", jsonBuffer);

  if (mqttClient.connected()) {
    bool ok1 = mqttClient.publish(MQTT_TELEMETRY_TOPIC, jsonBuffer, false);
    String heartbeatPayload = String("{\"device_id\":\"") + DEVICE_ID + "\",\"status\":\"online\"}";
    bool ok2 = mqttClient.publish(MQTT_HEARTBEAT_TOPIC, heartbeatPayload.c_str(), false);

    if (ok1 && ok2) {
      Serial.println(" -> ✅ Published to MQTT Broker.");
    } else {
      Serial.println(" -> ⚠️ Broker publish failed, buffering payload.");
      pushOfflineBuffer(payloadStr);
    }
  } else {
    Serial.println(" -> ⚠️ MQTT offline. Storing in local ring buffer.");
    pushOfflineBuffer(payloadStr);

#ifdef ENABLE_HTTPS_FALLBACK
    if (ENABLE_HTTPS_FALLBACK) {
      sendHttpsFallback(payloadStr);
    }
#endif
  }
}

// ── Setup & Loop ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==============================================");
  Serial.println("  IoT Weather Monitoring Station (ESP32)");
  Serial.printf("  Device ID: %s | Target: %s:%d\n", DEVICE_ID, MQTT_SERVER, MQTT_PORT);
  Serial.println("==============================================");

  setupSensors();
  connectWiFi();

  // Configure MQTT Transport (TLS vs Non-TLS)
  if (MQTT_USE_TLS) {
    espClientSecure.setInsecure(); // Allows connecting to cloud MQTT brokers without bundling Root CA
    mqttClient.setClient(espClientSecure);
  } else {
    mqttClient.setClient(espClient);
  }

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setBufferSize(512); // Ensure JSON payloads are not truncated
}

void loop() {
  // 1. Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastWifiRetryTime > 10000) {
      lastWifiRetryTime = now;
      connectWiFi();
    }
  } else {
    // 2. Maintain MQTT Connection
    if (!mqttClient.connected()) {
      reconnectMQTT();
    } else {
      mqttClient.loop();
    }
  }

  // 3. Periodic Telemetry Transmission
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;
    publishTelemetry();
  }
}
