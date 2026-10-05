#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>

#include "secrets.h"

// Sensor Pin Definitions
const int RAIN_AO_PIN = 34; // FC-37 Rain Sensor Analog Output (GPIO 34)

Adafruit_BME280 bme;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = TELEMETRY_INTERVAL_MS;
bool bmeAvailable = false;

void setupSensors() {
  Wire.begin(21, 22); // BME280 I2C pins: SDA=21, SCL=22

  if (bme.begin(0x76, &Wire) || bme.begin(0x77, &Wire)) {
    bmeAvailable = true;
    Serial.println("[ESP32] BME280 Sensor Connected!");
  } else {
    bmeAvailable = false;
    Serial.println("[ESP32] WARNING: BME280 Not Found or Address Mismatch! Will send null.");
  }

  analogReadResolution(12); // ADC range 0 - 4095
  Serial.println("[ESP32] Rain Sensor Ready on GPIO 34.");
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("[ESP32] Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("[ESP32] Wi-Fi Connected!");
    Serial.print("[ESP32] ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[ESP32] Wi-Fi connection pending. Retrying in background...");
  }
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  while (!mqttClient.connected()) {
    Serial.print("[ESP32] Connecting to Backend MQTT Broker at ");
    Serial.print(MQTT_SERVER);
    Serial.print("...");

    String clientId = "ESP32-WeatherNode-";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" Connected!");
    } else {
      Serial.print(" Failed, error state=");
      Serial.print(mqttClient.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void publishTelemetry() {
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = "2026-10-02T02:55:00Z";

  // BME280 Data with Sanity Check (SRS F.2 Handling)
  if (bmeAvailable) {
    float temp = bme.readTemperature();
    float hum = bme.readHumidity();
    float press = bme.readPressure() / 100.0F;

    if (!isnan(temp) && !isnan(hum) && !isnan(press) && temp > -40.0 && temp < 85.0 && press > 300.0 && press < 1250.0) {
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

  doc["light_lux"] = nullptr; // BH1750 missing -> null

  // FC-37 Rain Data (4095 = Dry = 0.0 mm/h, < 3800 = Water detected)
  int rainRaw = analogRead(RAIN_AO_PIN);
  float rainRate = 0.0;
  if (rainRaw < 3800) {
    // Map wetness: 3800 (light drops) -> 2 mm/h up to 1000 (heavy downpour) -> 80 mm/h
    rainRate = (float)map(rainRaw, 3800, 1000, 2, 80);
    if (rainRate < 0.0) rainRate = 0.0;
    if (rainRate > 100.0) rainRate = 100.0;
  } else {
    rainRate = 0.0; // Completely dry
  }
  doc["rain_intensity"] = serialized(String(rainRate, 1));

  doc["gas_aqi"]    = nullptr; // MQ-135 pending resistors -> null
  doc["wind_speed"] = nullptr; // Anemometer missing -> null

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  Serial.print("[ESP32 Publish]: ");
  Serial.print(jsonBuffer);

  if (mqttClient.connected()) {
    bool ok1 = mqttClient.publish(MQTT_TELEMETRY_TOPIC, jsonBuffer, true);
    String heartbeatPayload = String("{\"device_id\":\"") + DEVICE_ID + "\",\"status\":\"online\"}";
    bool ok2 = mqttClient.publish(MQTT_HEARTBEAT_TOPIC, heartbeatPayload.c_str(), false);
    if (ok1 && ok2) {
      Serial.println(" -> ✅ SENT TO BROKER!");
    } else {
      Serial.println(" -> ❌ BROKER REJECTED PACKET!");
    }
  } else {
    Serial.println(" -> ❌ ESP32 NOT CONNECTED TO BROKER!");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- ESP32 Weather Node Starting ---");
  setupSensors();
  setupWiFi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;
    publishTelemetry();
  }
}
