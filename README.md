# 🌦️ IoT-Based Real-Time Weather Monitoring System

A production-ready, full-stack IoT weather monitoring and early-warning platform built with **ESP32**, **MQTT over TLS**, **Node.js/Express**, **MongoDB Atlas**, and **React + Vite**.

Developed for **IT303 – Internet of Things** at **NIT Karnataka** under the guidance of **Prof. Jaidhar C D**.

---

## 🏗️ System Architecture

The ESP32 and backend **do NOT need to be on the same Wi-Fi network**. The system communicates across the public Internet via Cloud MQTT:

```
                      INTERNET
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   [ ESP32 Node ]                  [ Web Browser ]
 (Any Wi-Fi / Hotspot)                    │
        │                                 │
        │ MQTT over TLS (Port 8883)       │ HTTPS / WSS
        ▼                                 ▼
[ Cloud MQTT Broker ]            [ Deployed Frontend ]
(HiveMQ Cloud / EMQX)           (Vercel / Netlify)
        │                                 │
        │ MQTT over TLS                   │ REST / WebSocket
        ▼                                 ▼
   [ Cloud Backend Ingestion Engine (Render / Railway / VPS) ]
                         │
                         ▼
               [ MongoDB Atlas Cluster ]
```

---

## 🚀 Quick Start (Local Development)

### 1. Setup Environment Files
```bash
# Backend Environment Setup
cp backend/.env.example backend/.env

# Frontend Environment Setup
cp frontend/.env.example frontend/.env

# ESP32 Firmware Configuration
cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h
```

### 2. Start Services Locally

Open **3 separate terminal tabs**:

#### Terminal 1: Local MQTT Broker
```bash
cd broker
npm install
npm start
```

#### Terminal 2: Backend Ingestion Server
```bash
cd backend
npm install
npm run dev
```
*API and WebSocket server run on `http://localhost:5001`.*

#### Terminal 3: Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Dashboard runs on `http://localhost:5173`.*

---

## 🌐 Production Cloud Deployment

For the complete guide on deploying the backend (Render/Railway), frontend (Vercel/Netlify), MongoDB Atlas, and Cloud MQTT over TLS, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Production Environment Variables Summary

#### Backend (`backend/.env` or hosting dashboard):
```env
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/weather_db?retryWrites=true&w=majority
MQTT_BROKER_URL=mqtts://<user>:<pass>@<cluster>.hivemq.cloud:8883
JWT_SECRET=your_cryptographically_secure_jwt_secret
DEVICE_API_KEY=your_secure_device_api_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Frontend (`frontend/.env` or hosting dashboard):
```env
VITE_API_BASE_URL=https://your-backend-api.onrender.com/api
VITE_WS_URL=wss://your-backend-api.onrender.com
VITE_DEFAULT_DEVICE_ID=ESP32-NODE-01
```

#### ESP32 (`firmware/esp32/src/secrets.h`):
```cpp
static const char* WIFI_SSID             = "Your_WiFi_Name";
static const char* WIFI_PASS             = "Your_WiFi_Password";
static const char* MQTT_SERVER           = "your-cluster.hivemq.cloud";
static const int   MQTT_PORT             = 8883;
static const bool  MQTT_USE_TLS          = true;
static const char* MQTT_USER             = "esp32_weather_node";
static const char* MQTT_PASS             = "YourNodePassword123";
static const char* DEVICE_ID             = "ESP32-NODE-01";
```

---

## 🔌 Hardware Wiring Guide (ESP32)

| Sensor | Sensor Pin | ESP32 Pin | Purpose |
| :--- | :--- | :--- | :--- |
| **BME280** | `VCC` | `3.3V` | 3.3V Power |
| | `GND` | `GND` | Ground |
| | `SCL` | `GPIO 22` | I2C Clock |
| | `SDA` | `GPIO 21` | I2C Data |
| **FC-37 Rain Sensor** | `VCC` | `3.3V` | 3.3V Power |
| | `GND` | `GND` | Ground |
| | `AO` | `GPIO 34` | ADC1 Channel 6 |

---

## 🧪 Testing & Validation

```bash
cd backend
node src/tests/test_phase4.js   # Ingestion, validation & device health tests
node src/tests/test_phase5.js   # Threshold alert engine & resolution tests
node src/tests/test_phase6.js   # REST API & authentication tests
node src/tests/test_phase7.js   # WebSocket live streaming tests
```
