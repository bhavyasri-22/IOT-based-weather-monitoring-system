# 🌦️ IoT-Based Real-Time Weather Monitoring System

[![Build & Tests](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%20BME280%20%7C%20FC--37-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20WebSocket-informational.svg)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-success.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)]()
[![Protocol](https://img.shields.io/badge/Transport-MQTT%20over%20TLS%20(Port%208883)-orange.svg)]()
[![Theme](https://img.shields.io/badge/Theme-100%25%20Light%20UI-yellow.svg)]()

> A production-grade, end-to-end environmental intelligence and early-warning platform built with **ESP32**, **Cloud MQTT over TLS (Port 8883)**, **Node.js/Express**, **MongoDB Atlas**, and **React + Vite**. Designed to deliver microclimate atmospheric telemetry, sub-second live streaming, threshold-based automated alerting, and historical analytics over the public Internet.

Developed for **IT303 – Internet of Things** at **National Institute of Technology Karnataka (NITK), Surathkal**, under the guidance of **Prof. Jaidhar C. D.**

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Hardware Architecture & Wiring](#-hardware-architecture--wiring)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Quick Start: Local Development](#-quick-start-local-development)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Configure Environment](#1-clone--configure-environment)
  - [2. Launch Local Services](#2-launch-local-services)
  - [3. ESP32 Firmware Flashing](#3-esp32-firmware-flashing)
- [Environment Variables Guide](#-environment-variables-guide)
- [REST API & WebSocket Documentation](#-rest-api--websocket-documentation)
- [Alerting & Threshold Engine](#-alerting--threshold-engine)
- [Sensor Fault Detection & Graceful Degradation](#-sensor-fault-detection--graceful-degradation)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Cloud Deployment](#-production-cloud-deployment)
- [Academic Credits & Contributors](#-academic-credits--contributors)
- [License](#-license)

---

## 📖 Overview

Traditional weather tracking setups often rely on local-only networks (LAN), require complex port forwarding, or lack real-time reactivity. The **IoT-Based Real-Time Weather Monitoring System** resolves these challenges by decoupling the physical microcontroller nodes from the ingestion server via **Cloud MQTT with TLS encryption**:

1. **Independent Network Operation**: The ESP32 edge node can connect to *any* network (cellular hotspot, home Wi-Fi, campus network) without needing to be on the same LAN as the server or dashboard.
2. **Sub-Second Live Streaming**: Atmospheric metrics are ingested by the cloud server and pushed to web clients via bidirectional WebSockets with under 20 ms latency.
3. **Fault-Tolerant Sensor Network**: Automatically differentiates between active readings, out-of-range sensor breaches, and physically disconnected transducers (`Not Connected` status).
4. **Clean, High-Contrast UI**: 100% light theme across all pages, interactive data visualizations, historical CSV exports, and smooth bottom-to-top page navigation.

---

## 🏗️ System Architecture

```
                                  PUBLIC INTERNET
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
                   ▼                                           ▼
          [ ESP32 Edge Node ]                        [ Client Web Browser ]
      (Any Wi-Fi / 4G/5G Hotspot)                   (Desktop, Tablet, Mobile)
                   │                                           │
                   │ MQTT over TLS (Port 8883)                 │ HTTPS / WSS
                   ▼                                           ▼
       [ Cloud MQTT Broker ]                         [ Deployed Frontend ]
     (HiveMQ Cloud / EMQX Cloud)                      (Vercel / Netlify)
                   │                                           │
                   │ MQTT over TLS (Port 8883)                 │ REST API / WebSocket
                   ▼                                           ▼
      [ Cloud Backend Ingestion Engine (Node.js / Express / ws) ]
      (Render / Railway / Self-Hosted VPS)
                   │
                   ▼
       [ MongoDB Atlas Cloud Cluster ]
       (Time-series Telemetry & Alerts)
```

### Data Pipeline Walkthrough:
1. **Sensing & Calibration**: The ESP32 reads physical environmental transducers every 3 seconds. Raw ADC and I2C signals are calibrated and packaged into a JSON payload.
2. **Secure Transport**: The telemetry packet is transmitted via **MQTTS (TLS v1.2/1.3)** over TCP port `8883` to the Cloud Broker.
3. **Ingestion & Validation**: The backend ingestion service validates incoming frames against JSON schema rules, calculates derived parameters (such as **Heat Index** and **Dew Point**), and checks for threshold anomalies.
4. **Persistence & Broadcasting**: Validated telemetry is persisted to **MongoDB Atlas** while simultaneously being broadcast to all connected web clients through active **WebSockets (`telemetry:new`)**.
5. **Real-Time Presentation**: React components update gauges, charts, and alert ribbons dynamically with zero page reloads.

---

## ✨ Key Features

### 📡 1. Real-Time Telemetry & Monitoring
- **Live Environmental Metrics**: Ambient Temperature (°C), Relative Humidity (%), Atmospheric Pressure (hPa), Rain Intensity (mm/h), Surface Moisture, Ambient Light (Lux), and Wind Velocity (km/h).
- **Calculated Microclimate Indicators**:
  - **Heat Index ("Feels Like")**: Steadman/Rothfusz physiological apparent temperature calculation.
  - **Precipitation State**: Distinct classification (`Dry`, `Drizzle`, `Moderate Rain`, `Heavy Downpour`).
- **Live Frame Inspector**: Inspect raw JSON frames arriving over WebSockets with packet counter and timestamp inspection.

### 🔔 2. Automated Multi-Tier Alert Engine
- **Configurable Thresholds**: Warning and Critical triggers for extreme temperature, high moisture, pressure dips (storm warnings), and sudden rainfall.
- **Auto-Resolution & Manual Acknowledgment**: Alerts automatically transition to resolved once readings return to safe hysteresis zones, or can be manually acknowledged by administrators.
- **Audible / Visual Alarms**: High-visibility alerts banner and drawer with search and status filters.

### 📊 3. Analytics, Time-Series & Data Export
- **Historical Analysis**: Time-series charts with timeframe selection (**1h**, **6h**, **24h**, **7d**).
- **Statistical Aggregations**: Automatic computation of `Min`, `Max`, `Average`, and standard deviation.
- **One-Click CSV Export**: Download timestamped historical telemetry datasets for laboratory reporting and statistical analysis.

### 🛡️ 4. Role-Based Access Control (RBAC) & Security
- **Guest / Public Mode**: Immediate read-only access to live telemetry, conditions, and analytics without friction.
- **Administrator Portal**: Secure JWT authentication with Bcrypt password hashing to configure threshold limits, manage node registrations, and resolve system alerts.
- **Transport Security**: Enforced TLS 8883 encryption on MQTT and HTTPS/WSS on web clients.

### 🎨 5. Modern 100% Light Theme UI & Navigation
- **Light Theme Design**: Specially tailored `#F5FAFF` / `#EAF4FF` aesthetic with crisp cards, high-contrast typography, and zero dark theme styling across all elements.
- **Effortless Navigation**: Dedicated "Back to top" button in the footer of every page, accompanied by a floating quick-return button.

---

## 🔌 Hardware Architecture & Wiring

### Bill of Materials (BOM)

| Component | Model / Spec | Interface | Primary Function |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (30-pin DevKit) | Wi-Fi / SPI / I2C / ADC | Edge processing, calibration & MQTTS transmission |
| **Thermo-Hygro-Barometer** | Bosch BME280 | I2C (`0x76` or `0x77`) | Ambient Temperature, Relative Humidity, Pressure |
| **Rain / Precipitation Sensor** | FC-37 with LM393 Comparator | Analog ADC (0–3.3V) | Surface water accumulation & rainfall rate |
| **Ambient Light Sensor** *(Optional)* | BH1750 | I2C (`0x23`) | Illuminance (Lux) |
| **Air Quality Sensor** *(Optional)* | MQ-135 | Analog ADC | Hazardous gas & air quality proxy |
| **Anemometer** *(Optional)* | 3-Cup Anemometer | Analog / Pulse | Wind speed velocity (km/h) |

---

### ESP32 Pin Connections

```
        ┌────────────────────────────────────────────────────────┐
        │                  ESP32 DevKit (30-Pin)                 │
        │                                                        │
        │   [3.3V] ───────┬─────────────────── BME280 VCC        │
        │                 └─────────────────── FC-37 VCC         │
        │                                                        │
        │   [GND]  ───────┬─────────────────── BME280 GND        │
        │                 └─────────────────── FC-37 GND         │
        │                                                        │
        │   [GPIO 22] ──────────────────────── BME280 SCL (Clock)│
        │   [GPIO 21] ──────────────────────── BME280 SDA (Data) │
        │                                                        │
        │   [GPIO 34] ──────────────────────── FC-37 AO (Analog) │
        └────────────────────────────────────────────────────────┘
```

> **Important Notes on Hardware Wiring:**
> - The BME280 must be powered from the **3.3V rail** (5V may permanently damage the transducer).
> - `GPIO 34` on the ESP32 belongs to **ADC1**, which remains fully functional while Wi-Fi is active (ADC2 pins cannot be read simultaneously with the Wi-Fi radio).

---

## 💻 Tech Stack

- **Edge Firmware**: C++ (Arduino Core / FreeRTOS), PlatformIO, PubSubClient, Adafruit BME280 Library, WiFiClientSecure.
- **Message Broker**: Cloud MQTT (HiveMQ Cloud / EMQX) over TLS port `8883`, or local Aedes MQTT broker for offline testing.
- **Backend Service**: Node.js (v18+), Express.js, `ws` (WebSocket server), `mqtt` client, Mongoose ODM, JSON Web Tokens (JWT), Bcrypt.
- **Database**: MongoDB Atlas (Cloud Time-Series Database & Document Storage).
- **Frontend Dashboard**: React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts.
- **DevOps & Containers**: Docker, Docker Compose, PlatformIO CLI.

---

## 📁 Repository Structure

```text
IOT-based-weather-monitoring-system/
├── backend/                        # Node.js + Express Ingestion & API Server
│   ├── src/
│   │   ├── alerts/                 # Threshold evaluation & alert resolution engine
│   │   ├── api/                    # Express REST route controllers (auth, telemetry, alerts, devices)
│   │   ├── auth/                   # JWT generation, token verification, RBAC middleware
│   │   ├── config/                 # Database connection & runtime configurations
│   │   ├── deviceHealth/           # Node heartbeat tracking & offline watchdog
│   │   ├── ingestion/              # Telemetry payload normalization & validation
│   │   ├── middlewares/            # Rate limiting, error handling, CORS headers
│   │   ├── models/                 # Mongoose schemas (Telemetry, Alert, Device, User)
│   │   ├── mqtt/                   # MQTT subscriber, TLS client, reconnect handlers
│   │   ├── tests/                  # Integration and verification test suites
│   │   ├── utils/                  # Heat Index and Dew Point computational utilities
│   │   ├── validators/             # Schema validation rules
│   │   ├── ws/                     # WebSocket broadcasting server
│   │   └── index.js                # Server entry point
│   └── package.json
├── broker/                         # Standalone local Aedes MQTT broker (for offline dev)
│   ├── index.js
│   └── package.json
├── docs/                           # Documentation, user manual, and deployment manuals
│   ├── DEPLOYMENT.md               # Complete Cloud Deployment Guide (HiveMQ, Render, Vercel)
│   └── USER_MANUAL.md             # Comprehensive Academic & Operator User Manual
├── firmware/                       # Embedded C++ Firmware for ESP32
│   └── esp32/
│       ├── platformio.ini          # PlatformIO environment & library dependencies
│       └── src/
│           ├── main.cpp            # Main loop, BME280/rain sampling, MQTTS publisher
│           └── secrets.h.example   # Wi-Fi and Cloud MQTT credential template
├── frontend/                       # React 18 + Vite Web Dashboard
│   ├── src/
│   │   ├── api/                    # Axios REST client and endpoint methods
│   │   ├── components/             # Reusable UI widgets (cards, charts, modal, header, footer)
│   │   ├── hooks/                  # Custom React hooks (useTelemetry, useWebSocket, useAlerts)
│   │   ├── pages/                  # Route views (LandingPage, LiveMonitor, Analytics, History, Alerts)
│   │   ├── App.jsx                 # Main layout, shell routing, and navigation
│   │   ├── index.css               # Global light theme utility styles
│   │   └── main.jsx                # React DOM root entry
│   ├── tailwind.config.js          # Tailwind CSS styling tokens (100% light theme)
│   └── package.json
├── docker-compose.yml              # Local containerized multi-container setup
├── docker-compose.prod.yml         # Production container stack definition
└── README.md                       # Master Project Documentation
```

---

## 🚀 Quick Start: Local Development

### Prerequisites
- **Node.js**: `v18.x` or higher installed ([nodejs.org](https://nodejs.org/))
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- **PlatformIO**: Recommended via VS Code extension or CLI ([platformio.org](https://platformio.org/))

---

### 1. Clone & Configure Environment

Clone the repository and copy the environment configuration templates:

```bash
git clone https://github.com/your-username/IOT-based-weather-monitoring-system.git
cd IOT-based-weather-monitoring-system

# Configure backend environment
cp backend/.env.example backend/.env

# Configure frontend environment
cp frontend/.env.example frontend/.env

# Configure ESP32 firmware secrets
cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h
```

---

### 2. Launch Local Services

To run the complete system locally, open **three terminal tabs**:

#### Terminal 1: Local MQTT Broker
```bash
cd broker
npm install
npm start
```
*Local broker listens on MQTT port `1883`.*

#### Terminal 2: Backend Ingestion & API Server
```bash
cd backend
npm install
npm run dev
```
*Backend server runs at `http://localhost:5001` (REST API & WebSocket).*

#### Terminal 3: Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

### 3. ESP32 Firmware Flashing

1. Open `firmware/esp32` in **VS Code with the PlatformIO extension**.
2. Edit `firmware/esp32/src/secrets.h`:
   ```cpp
   static const char* WIFI_SSID             = "Your_WiFi_SSID";
   static const char* WIFI_PASS             = "Your_WiFi_Password";
   static const char* MQTT_SERVER           = "192.168.1.100"; // Or Cloud Broker URL
   static const int   MQTT_PORT             = 1883;            // 8883 for TLS
   static const bool  MQTT_USE_TLS          = false;           // true for TLS
   static const char* MQTT_USER             = "";              // Cloud broker username
   static const char* MQTT_PASS             = "";              // Cloud broker password
   static const char* DEVICE_ID             = "ESP32-NODE-01";
   ```
3. Connect your ESP32 board via USB.
4. Click **PlatformIO: Build** (`Ctrl+Alt+B` or `Cmd+Shift+B`) and **PlatformIO: Upload**.
5. Open the **Serial Monitor** at baud rate `115200` to confirm sensor initialization and MQTT connectivity.

---

## ⚙️ Environment Variables Guide

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP & WebSocket server port | `5001` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | `mongodb+srv://user:pass@cluster.mongodb.net/weather_db` |
| `MQTT_BROKER_URL` | MQTT connection URI (`mqtt://` or `mqtts://`) | `mqtts://user:pass@cluster.hivemq.cloud:8883` |
| `JWT_SECRET` | Secret key for signing admin access tokens | `your_secure_random_string` |
| `JWT_EXPIRES_IN` | Token lifetime | `24h` |
| `DEVICE_API_KEY` | Optional API key for direct HTTP ingestion | `your_device_key` |
| `CORS_ORIGIN` | Allowed web origins | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for REST API calls | `http://localhost:5001/api` |
| `VITE_WS_URL` | Base WebSocket connection URI | `ws://localhost:5001` |
| `VITE_DEFAULT_DEVICE_ID` | Primary weather station node ID | `ESP32-NODE-01` |

---

## 📡 REST API & WebSocket Documentation

### Authentication Endpoints
- `POST /api/auth/register` — Register a new administrator user.
- `POST /api/auth/login` — Authenticate and receive a Bearer JWT.
- `GET /api/auth/me` — Retrieve the profile and role of the authenticated session.
- `POST /api/auth/logout` — Invalidate the client session.

### Telemetry Endpoints
- `GET /api/telemetry/latest?deviceId=ESP32-NODE-01` — Fetch the most recent reading.
- `GET /api/telemetry/history?deviceId=ESP32-NODE-01&range=24h` — Retrieve timestamped data points (`1h`, `6h`, `24h`, `7d`).
- `GET /api/telemetry/stats?deviceId=ESP32-NODE-01` — Returns `min`, `max`, and `avg` summary statistics.
- `POST /api/telemetry/ingest` — HTTP fallback telemetry ingestion endpoint.

### Alerts Endpoints
- `GET /api/alerts?status=active` — Fetch all unresolved threshold alarms.
- `PATCH /api/alerts/:id/resolve` — Mark an alert as acknowledged and resolved (*Admin only*).
- `GET /api/alerts/history` — Retrieve historical alert audit records.

### Device Management Endpoints
- `GET /api/devices` — List all registered ESP32 nodes and their health states (`online`, `offline`, `degraded`).
- `PATCH /api/config/thresholds` — Modify environmental warning and critical thresholds (*Admin only*).

---

### WebSocket Real-Time Stream

Clients connect to `ws://localhost:5001` (or `wss://` in production).

**Sample Inbound Event (`telemetry:new`):**
```json
{
  "event": "telemetry:new",
  "data": {
    "device_id": "ESP32-NODE-01",
    "timestamp": "2026-10-12T12:00:00.000Z",
    "temperature": 27.8,
    "humidity": 65.4,
    "pressure": 1012.8,
    "heat_index": 29.6,
    "rain_analog": 4095,
    "rain_intensity": 0.0,
    "is_raining": false,
    "light_lux": null,
    "gas_aqi": null,
    "wind_speed": null
  }
}
```

---

## 🚨 Alerting & Threshold Engine

The system evaluates all incoming telemetry against configurable environmental boundary limits:

| Parameter | Unit | Warning Low | Warning High | Critical Low | Critical High | Action Triggered |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Temperature** | °C | `< 10.0` | `> 38.0` | `< 5.0` | `> 45.0` | Heatwave / Extreme Frost Warning |
| **Humidity** | % | `< 20.0` | `> 85.0` | `< 10.0` | `> 95.0` | Saturation / Mold Risk Alert |
| **Pressure** | hPa | `< 995.0` | `> 1030.0` | `< 985.0` | `> 1045.0` | Cyclone / Rapid Barometric Storm Drop |
| **Precipitation** | mm/h | — | `> 5.0` | — | `> 25.0` | Flood Risk / Flash Downpour Alert |

- **Hysteresis Buffering**: Thresholds use a 5% deadband window to prevent rapid alert flapping near boundary limits.
- **Auto-Resolution**: Once telemetry stays within nominal safety boundaries for 3 consecutive cycles, alerts auto-resolve.

---

## 🔍 Sensor Fault Detection & Graceful Degradation

The platform implements intelligent transducer validation:

1. **Active Measurement**: Transducers producing valid numerical data are marked with an **`Operational`** status badge.
2. **Missing Transducers**: If hardware is disconnected or omitted in the firmware (`nullptr`), the system displays **`Not Connected`** with `N/A` readings rather than triggering false alerts or displaying zero values.
3. **Out-of-Range Sensor Anomaly**: If a physical sensor produces improbable readings (e.g., BME280 disconnected mid-operation resulting in -140°C), the validator flags the frame as **`Sensor Degraded`** and prevents corrupted points from polluting historical trend records.

---

## 🧪 Testing & Quality Assurance

The backend includes comprehensive automated verification suites covering end-to-end functionality:

```bash
cd backend

# Phase 4: Ingestion pipeline, payload validation & device health watchdog
node src/tests/test_phase4.js

# Phase 5: Threshold alert triggers, hysteresis & resolution engine
node src/tests/test_phase5.js

# Phase 6: REST API routing, RBAC authentication & data formatting
node src/tests/test_phase6.js

# Phase 7: Real-time WebSocket broadcasting & live stream latency
node src/tests/test_phase7.js
```

---

## 🌐 Production Cloud Deployment

The system is architected for seamless deployment across standard cloud providers:

| Layer | Recommended Cloud Provider | Protocol / Port | Guide Reference |
| :--- | :--- | :--- | :--- |
| **MQTT Broker** | [HiveMQ Cloud](https://www.hivemq.com/cloud/) or [EMQX Cloud](https://www.emqx.com/en/cloud) | MQTTS / `8883` | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **Backend API** | [Render](https://render.com/) or [Railway](https://railway.app/) | HTTPS / WSS | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Mongo Wire / TLS | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **Web Frontend**| [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) | HTTPS | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

For complete step-by-step instructions with screenshots and environment checklists, consult **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** and the detailed **[docs/USER_MANUAL.md](docs/USER_MANUAL.md)**.

---

## 👥 Academic Credits & Contributors

Developed as part of **IT303: Internet of Things** at the **Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal**.

### Project Team:
- **C Thanmai Sai** (NITK Surathkal)
- **Mili Dholaria** (NITK Surathkal)
- **Thota Bhavya Sri** (NITK Surathkal)

### Faculty Guidance:
- **Prof. Jaidhar C. D.**  
  *Professor, Department of Information Technology*  
  *National Institute of Technology Karnataka, Surathkal*

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for academic, scientific, and open-source applications.
