# 🌦️ IoT-Based Real-Time Weather Monitoring System

A production-grade, full-stack IoT weather monitoring and early-warning platform built with **ESP32**, **MQTT**, **Node.js/Express**, **MongoDB**, and **React + Vite**.

---

## 🏗️ System Architecture

```
[ ESP32 Sensors (BME280, Rain FC-37) ]
                 │ (Wi-Fi / MQTT 1883)
                 ▼
     [ Standalone MQTT Broker (Aedes) ]
                 │
                 ▼
[ Node.js Backend & Ingestion Engine ]
   ├── Ingestion & Validation Pipeline
   ├── Real-Time Threshold & Alert Engine
   ├── Heat Index & Metric Calculators
   ├── Device Health & Heartbeat Tracker (F.11)
   ├── MongoDB Atlas / Local Persistence
   └── WebSocket Gateway (Port 5001)
                 │
                 ▼ (REST API & WebSockets)
     [ React Dashboard (Vite + Tailwind) ]
```

---

## 🚀 Quick Start Guide

### 1. Clone & Setup Configuration Files
Clone the repository and create the required local configuration files from the templates:

```bash
# Backend Environment Setup
cp backend/.env.example backend/.env

# Frontend Environment Setup
cp frontend/.env.example frontend/.env

# ESP32 Firmware Secrets Setup
cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h
```

### 2. Configure Your Network & Secrets
1. Open `firmware/esp32/src/secrets.h` and enter your **Wi-Fi SSID**, **Password**, and your computer's **Local IP Address**.
2. Make sure MongoDB is running locally (`mongodb://127.0.0.1:27017`) or update `MONGODB_URI` in `backend/.env`.

---

## 💻 Running the Services

Open **3 separate terminal tabs** and start each service:

### Terminal 1: MQTT Broker
```bash
cd broker
npm install
npm start
```
*Broker listens on port `1883`.*

### Terminal 2: Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend API and WebSocket server run on `http://localhost:5001`.*

### Terminal 3: Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Access the dashboard at `http://localhost:5173`.*

---

## 🔌 Hardware Wiring Guide (ESP32)

| Sensor | Sensor Pin | ESP32 Pin | Note |
| :--- | :--- | :--- | :--- |
| **BME280** (Temp, Hum, Pressure) | `VCC` | `3.3V` | Use 3.3V rail |
| | `GND` | `GND` | Ground |
| | `SCL` | `GPIO 22` | I2C Clock |
| | `SDA` | `GPIO 21` | I2C Data |
| **FC-37 Rain Drop Sensor** | `VCC` | `3.3V` | |
| | `GND` | `GND` | |
| | `AO` (Analog) | `GPIO 34` | ADC1 (Input Only) |

---

## 🧪 Testing & Verification

Run automated backend validation and integration test suites:

```bash
cd backend
node src/tests/test_phase4.js   # Ingestion, validation & device health tests
node src/tests/test_phase5.js   # Threshold alert engine & resolution tests
node src/tests/test_phase6.js   # REST API & authentication tests
node src/tests/test_phase7.js   # WebSocket live streaming tests
```

---

## 🔐 Security & Confidentiality
All sensitive information (Wi-Fi passwords, JWT secrets, database connection URIs) is completely decoupled from version control and managed via `.env` and `secrets.h` files ignored by `.gitignore`.
