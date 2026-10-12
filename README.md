# 🌦️ IoT-Based Real-Time Weather Monitoring System

[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%20BME280%20%7C%20FC--37-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20WebSocket-informational.svg)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-success.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)]()
[![Protocol](https://img.shields.io/badge/Transport-MQTT%20over%20TLS%20(Port%208883)-orange.svg)]()

> An end-to-end IoT weather monitoring platform built with **ESP32**, **Cloud MQTT over TLS**, **Node.js/Express**, **MongoDB Atlas**, and **React + Vite**. Sensor telemetry is securely transmitted over the public Internet, ingested in real time, and streamed live to a web dashboard.

Developed for **IT303 – Software Engineering** at **National Institute of Technology Karnataka (NITK), Surathkal**, under the guidance of **Prof. Jaidhar C. D.**

---

## 📌 Table of Contents

- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Hardware & Sensors](#-hardware--sensors)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [REST API Reference](#-rest-api-reference)
- [Alert Thresholds](#-alert-thresholds)
- [Sensor Status & Fault Handling](#-sensor-status--fault-handling)
- [Testing](#-testing)
- [Cloud Deployment](#-cloud-deployment)
- [Academic Credits](#-academic-credits)

---

## 🏗️ System Architecture

```
                              PUBLIC INTERNET
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
              ▼                                             ▼
     [ ESP32 Edge Node ]                        [ Client Web Browser ]
  (Any Wi-Fi / 4G Hotspot)                   (Desktop, Tablet, Mobile)
              │                                             │
              │ MQTT over TLS (Port 8883)                   │ HTTPS / WSS
              ▼                                             ▼
   [ Cloud MQTT Broker ]                       [ Deployed Frontend ]
 (HiveMQ Cloud / EMQX Cloud)                   (Vercel / Netlify)
              │                                             │
              │ MQTT over TLS                               │ REST / WebSocket
              ▼                                             ▼
   [ Node.js Backend – Ingestion Engine, REST API, WebSocket Server ]
   (Render / Railway / VPS)
              │
              ▼
   [ MongoDB Atlas ]
```

**Data flow:** ESP32 reads sensors every 5 seconds → packages a JSON payload → publishes to `weather/telemetry` via MQTTS → Backend ingestion service validates, derives Heat Index, persists to MongoDB → broadcasts `telemetry:new` via WebSocket to all connected browser clients in real time.

---

## ✨ Key Features

### 📡 Real-Time Telemetry
- Live sensor readings streamed to the browser via WebSocket with no page refresh.
- Metrics displayed: Temperature (°C), Humidity (%), Pressure (hPa), Rain Intensity (mm/h).
- **Heat Index** ("Feels Like") is computed on the backend from Temperature and Humidity using the NWS Rothfusz regression formula and stored alongside raw readings.

### 📊 Analytics & History
- Time-series charts for historical sensor data with range filters: **1h, 6h, 24h, 7d**.
- Min, Max, and Average statistics computed per timeframe.
- One-click CSV export of historical data.

### 🔔 Automated Alert Engine
- Threshold-based alerts for Temperature, Humidity, Pressure, Heat Index, and Rainfall.
- Two severity levels: **Warning** and **Critical**.
- Alerts auto-resolve when readings return within safe bounds. Administrators can also resolve alerts manually.

### 🛡️ Authentication & Access Control
- **All users must sign in or register** before accessing the dashboard. There is no guest or immediate access — unauthenticated routes redirect to `/auth`.
- **User role:** Read-only access to live telemetry, analytics, and history.
- **Admin role:** Full access including alert resolution and threshold configuration. Admin accounts are provisioned via seed scripts, not self-registration.
- JWT-based authentication with Bcrypt password hashing.

### 🔍 Sensor Fault Handling
- Sensors not connected to the ESP32 (`light_lux`, `gas_aqi`, `wind_speed`) publish `null` values.
- The dashboard renders these as **"Not Connected"** with `N/A` readings rather than displaying zero or "Operational".

### 🎨 UI
- 100% light theme across all pages — no dark mode.
- "Back to top" button in the footer of every page and a floating scroll-back button.

---

## 🔌 Hardware & Sensors

### Wired (Active)

| Component | Model | Interface | Measures |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (30-pin DevKit) | — | Wi-Fi, MQTT transport |
| **Thermo-Hygro-Barometer** | Bosch BME280 | I2C – SDA `GPIO 21`, SCL `GPIO 22` | Temperature, Humidity, Pressure |
| **Rain Sensor** | FC-37 with LM393 | Analog ADC – `GPIO 34` | Rain intensity (mm/h) |

### Slot Channels (Not Connected — send `null`)

| Channel | Sensor | Why absent |
| :--- | :--- | :--- |
| `light_lux` | BH1750 | Hardware not available |
| `gas_aqi` | MQ-135 | Hardware not available |
| `wind_speed` | Cup Anemometer | Hardware not available |

> **Wiring notes:**
> - BME280 must use the **3.3 V rail** (5 V will damage it).
> - `GPIO 34` is on ADC1, which operates correctly while Wi-Fi is active. ADC2 pins conflict with the Wi-Fi radio.
> - The FC-37 ADC raw value is mapped: `3800 → 0 mm/h` (dry) down to `1000 → 80 mm/h` (heavy rain).

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Firmware** | C++ (Arduino Core), PlatformIO, PubSubClient, ArduinoJson, Adafruit BME280 |
| **MQTT Broker** | HiveMQ Cloud / EMQX (TLS port `8883`); Aedes (local dev, port `1883`) |
| **Backend** | Node.js 18+, Express.js, `ws` (WebSocket), `mqtt` client, Mongoose, JWT, Bcrypt |
| **Database** | MongoDB Atlas |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide React |
| **DevOps** | Docker, Docker Compose |

---

## 📁 Repository Structure

```
IOT-based-weather-monitoring-system/
├── backend/
│   └── src/
│       ├── alerts/           # Threshold evaluation & alert engine
│       ├── api/              # Express routes: auth, telemetry, alerts, devices, config
│       ├── auth/             # JWT helpers, password policy, RBAC middleware
│       ├── config/           # DB connection
│       ├── deviceHealth/     # Heartbeat handler & offline watchdog
│       ├── ingestion/        # Telemetry validation, Heat Index derivation, persistence
│       ├── middlewares/      # API key auth, error handling, rate limiting
│       ├── models/           # Mongoose schemas: SensorReading, AlertLog, DeviceHealth, Threshold, User
│       ├── mqtt/             # MQTT subscriber & TLS client
│       ├── scripts/          # Admin seed scripts
│       ├── tests/            # Integration test suites
│       ├── utils/            # Heat Index calculation (NWS Rothfusz)
│       ├── validators/       # Payload schema validation
│       ├── ws/               # WebSocket broadcast gateway
│       └── index.js          # Server entry point
├── broker/                   # Local Aedes MQTT broker (dev only)
│   └── server.js
├── docs/
│   ├── DEPLOYMENT.md         # Cloud deployment guide
│   └── USER_MANUAL.md        # Operator user manual
├── firmware/
│   └── esp32/
│       ├── platformio.ini    # PlatformIO config & library deps
│       └── src/
│           ├── main.cpp      # Sensor read loop, MQTTS publish, offline buffer
│           └── secrets.h.example
├── frontend/
│   └── src/
│       ├── api/              # Axios REST client
│       ├── components/       # UI widgets (cards, charts, modals, header, sidebar, footer)
│       ├── hooks/            # useTelemetry, useWebSocket, useAlerts
│       ├── pages/            # LandingPage, Login, RoleSelection, Dashboard, LiveMonitor,
│       │                     # Analytics, History, AlertsPage, DevicesPage, AdminConfig
│       ├── App.jsx           # Routing, protected shell
│       └── main.jsx
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local instance or Atlas URI)
- **PlatformIO** (VS Code extension or CLI) for firmware flashing

### Step 1 — Copy environment templates

```bash
git clone https://github.com/your-username/IOT-based-weather-monitoring-system.git
cd IOT-based-weather-monitoring-system

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h
```

### Step 2 — Start local services (3 terminals)

```bash
# Terminal 1: Local MQTT broker (port 1883)
cd broker && npm install && npm start

# Terminal 2: Backend API + WebSocket server (port 5001)
cd backend && npm install && npm run dev

# Terminal 3: Frontend dev server (port 5173)
cd frontend && npm install && npm run dev
```

### Step 3 — Flash ESP32 firmware

1. Edit `firmware/esp32/src/secrets.h` with your Wi-Fi credentials and MQTT broker address.
2. Open `firmware/esp32` in VS Code with the PlatformIO extension.
3. Click **Build** then **Upload**.
4. Open the Serial Monitor at `115200` baud to confirm sensor init and MQTT connection.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP & WebSocket port | `5001` |
| `NODE_ENV` | Runtime mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/weather_db` |
| `MQTT_BROKER_URL` | MQTT connection URI | `mqtts://user:pass@cluster.hivemq.cloud:8883` |
| `JWT_SECRET` | JWT signing secret | `your_random_secret` |
| `JWT_EXPIRES_IN` | Token lifetime | `24h` |
| `DEVICE_API_KEY` | API key for HTTP ingestion fallback | `your_device_key` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST base URL | `http://localhost:5001/api` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:5001` |
| `VITE_DEFAULT_DEVICE_ID` | Primary ESP32 node ID | `ESP32-NODE-01` |

### ESP32 (`firmware/esp32/src/secrets.h`)

```cpp
static const char* WIFI_SSID            = "Your_WiFi_SSID";
static const char* WIFI_PASS            = "Your_WiFi_Password";
static const char* MQTT_SERVER          = "your-cluster.hivemq.cloud"; // or local IP
static const int   MQTT_PORT            = 8883;   // 1883 for local broker
static const bool  MQTT_USE_TLS         = true;   // false for local broker
static const char* MQTT_USER            = "weather_node_01";
static const char* MQTT_PASS            = "YourSecureMqttPassword123";
static const char* DEVICE_ID            = "ESP32-NODE-01";
```

---

## 📡 REST API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | — | Register a new user account |
| `POST` | `/login` | — | Sign in and receive JWT |
| `GET` | `/me` | JWT | Get current user profile |
| `POST` | `/logout` | — | Invalidate session |
| `POST` | `/password-reset/request` | — | Request password reset email |
| `POST` | `/password-reset/confirm` | — | Confirm reset with token |

### Telemetry (`/api/telemetry`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/latest?deviceId=...` | — | Latest sensor reading |
| `GET` | `/latest/:deviceId` | — | Latest reading for a specific device |
| `GET` | `/history?deviceId=...&range=24h` | — | Historical readings (`1h`, `6h`, `24h`, `7d`) |
| `POST` | `/ingest` | API Key | HTTP fallback ingestion endpoint |

### Alerts (`/api/alerts`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | — | All alerts (filterable by status, severity, deviceId) |
| `GET` | `/active` | — | All currently active alerts |
| `GET` | `/unread-count` | — | Count of unread active alerts |
| `PUT` | `/mark-all-read` | — | Mark all alerts as read |
| `PUT` | `/:alertId/read` | — | Mark a specific alert as read |
| `PUT` | `/:alertId/resolve` | JWT (Admin) | Manually resolve an alert |

### Devices (`/api/devices`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/status` | — | Status of all registered devices |
| `GET` | `/health` | — | Device health records |
| `GET` | `/:deviceId` | — | Status of a specific device |
| `POST` | `/` | JWT (Admin) | Register a new device node |
| `DELETE` | `/:deviceId` | JWT (Admin) | Remove a device node |

### Config (`/api/config`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/thresholds` | JWT (Admin) | Retrieve current alert thresholds |

---

### WebSocket Events

Connect to `ws://localhost:5001` (or `wss://` in production). Inbound events:

| Event | Trigger | Payload |
| :--- | :--- | :--- |
| `telemetry:new` | New sensor reading ingested | Full `SensorReading` document |
| `alert:new` | Threshold breach detected | `AlertLog` document |
| `alert:resolved` | Alert resolved | `AlertLog` document |
| `device:status` | Device online/offline change | `{ device_id, status }` |
| `connection:established` | Client connected | Server acknowledgment |

---

## 🚨 Alert Thresholds

Default thresholds (configurable by admin via seed scripts):

| Parameter | Warning | Critical | Unit |
| :--- | :--- | :--- | :--- |
| Temperature | > 35 or < 5 | > 40 or < 0 | °C |
| Humidity | > 80 or < 20 | > 90 or < 10 | % |
| Heat Index | > 32.2 | > 41.0 | °C |
| Pressure | < 980 | < 950 | hPa |
| Rain Intensity | > 25 | > 50 | mm/h |

Alerts auto-resolve when readings return within safe bounds. Admins can also resolve manually via the Alerts page.

---

## 🔍 Sensor Status & Fault Handling

The firmware intentionally publishes `null` for hardware channels that are not physically connected. The backend stores `null` in MongoDB. The dashboard handles this gracefully:

- **Connected sensor with valid data** → displays reading + **`Operational`** badge.
- **Not connected (null)** → displays **`N/A`** reading + **`Not Connected`** badge (no false alerts triggered).
- **Sensor out of bounds** → reading flagged `is_valid: false` and dropped.

---

## 🧪 Testing

```bash
cd backend

node src/tests/test_phase4.js   # Ingestion pipeline & device health
node src/tests/test_phase5.js   # Threshold alert engine & resolution
node src/tests/test_phase6.js   # REST API & authentication
node src/tests/test_phase7.js   # WebSocket broadcasting
```

---

## 🌐 Cloud Deployment

| Layer | Recommended Provider |
| :--- | :--- |
| MQTT Broker | [HiveMQ Cloud](https://www.hivemq.com/cloud/) or [EMQX Cloud](https://www.emqx.com/en/cloud) |
| Backend API | [Render](https://render.com/) or [Railway](https://railway.app/) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| Frontend | [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) |

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full step-by-step guide.

---

## 👥 Academic Credits

Developed as part of **IT303: Software Engineering** at the **Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal**.

### Project Team
- C Thanmai Sai
- Mili Dholaria
- Thota Bhavya Sri

### Faculty Guidance
**Prof. Jaidhar C. D.**  
Department of Information Technology, NITK Surathkal
