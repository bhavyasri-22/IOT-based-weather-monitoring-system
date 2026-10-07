# 🚀 Production Deployment Guide

This guide details the complete, step-by-step process for deploying the **IoT-Based Weather Monitoring System** to the cloud.

---

## 🌐 Target Deployment Architecture

The ESP32 and backend **do NOT need to be on the same Wi-Fi network**. They communicate across the public internet via a Cloud MQTT Broker:

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
(e.g. HiveMQ Cloud / EMQX)      (e.g. Vercel / Netlify)
        │                                 │
        │ MQTT over TLS                   │ REST / WebSocket
        ▼                                 ▼
   [ Cloud Backend Ingestion Engine (Render / Railway / VPS) ]
                         │
                         ▼
               [ MongoDB Atlas Cluster ]
```

---

## 🛠️ Step-by-Step Setup

### Step 1: Cloud MQTT Broker Setup (Free Tier)

Choose any public cloud MQTT provider (e.g., [HiveMQ Cloud](https://www.hivemq.com/cloud/) or [EMQX Cloud](https://www.emqx.com/en/cloud)):

1. Create a free account at [HiveMQ Cloud Serverless](https://www.hivemq.com/cloud/).
2. Create a cluster. You will receive:
   - **Broker Hostname**: `xxxxxxxxxxxxxx.hivemq.cloud`
   - **Port**: `8883` (TLS / SSL)
3. Under **Access Management / Credentials**, create two credentials:
   - **Node Credential**:
     - Username: `esp32_weather_node`
     - Password: `YourNodeSecurePassword123`
     - Permissions: Publish to `weather/telemetry` and `weather/heartbeat`
   - **Backend Credential**:
     - Username: `backend_consumer`
     - Password: `YourBackendSecurePassword123`
     - Permissions: Subscribe to `weather/telemetry` and `weather/heartbeat`

---

### Step 2: MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user (e.g. `weather_admin`) with read/write permissions.
3. Under **Network Access**, add an IP Access Entry:
   - If your hosting provider provides dedicated static outbound IPs, whitelist those IPs.
   - For serverless/PaaS platforms (e.g. Render, Railway, AWS Elastic Beanstalk), add `0.0.0.0/0` (Allow Access from Anywhere) and rely on your strong MongoDB user password.
4. Obtain your connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster.xxxxxx.mongodb.net/weather_db?retryWrites=true&w=majority
   ```

---

### Step 3: Deploy Backend Service (e.g. Render / Railway / Docker / VPS)

#### Option A: Deploying on Render / Railway
1. Connect your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `node src/index.js`.
5. Configure the following **Environment Variables**:

| Variable | Value Example | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5001` (or provided by host) | Server port |
| `HOST` | `0.0.0.0` | Binds to all network interfaces |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/weather_db` | Atlas connection string |
| `MQTT_BROKER_URL` | `mqtts://backend_user:pass@cluster.hivemq.cloud:8883` | Cloud MQTT broker over TLS |
| `JWT_SECRET` | `generate_a_random_64_char_hex_secret` | Signs auth tokens |
| `DEVICE_API_KEY` | `generate_a_secure_device_key` | Hardware REST fallback key |
| `CORS_ORIGIN` | `https://your-weather-dashboard.vercel.app` | Allowed frontend URL |

#### Option B: Deploying with Docker
```bash
# Build and launch with docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

---

### Step 4: Deploy Frontend (e.g. Vercel / Netlify / Cloudflare Pages)

1. Connect your GitHub repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Set **Build Command** to `npm run build`.
5. Set **Output Directory** to `dist`.
6. Add the following **Environment Variables**:

| Variable | Value Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | Deployed backend REST API base URL |
| `VITE_WS_URL` | `wss://your-backend.onrender.com` | Deployed backend WebSocket Gateway URL |
| `VITE_DEFAULT_DEVICE_ID` | `ESP32-NODE-01` | Default primary station identifier |

---

### Step 5: Flash ESP32 Firmware

1. Copy the configuration template:
   ```bash
   cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h
   ```
2. Open `firmware/esp32/src/secrets.h` and configure:
   ```cpp
   // Wi-Fi (Home / College / Hotspot)
   static const char* WIFI_SSID             = "Your_WiFi_Name";
   static const char* WIFI_PASS             = "Your_WiFi_Password";

   // Cloud MQTT Broker (TLS Port 8883)
   static const char* MQTT_SERVER           = "xxxxxxxxxxxxxx.hivemq.cloud";
   static const int   MQTT_PORT             = 8883;
   static const bool  MQTT_USE_TLS          = true;

   // Cloud MQTT Node Credentials
   static const char* MQTT_USER             = "esp32_weather_node";
   static const char* MQTT_PASS             = "YourNodeSecurePassword123";

   // Device Identifier
   static const char* DEVICE_ID             = "ESP32-NODE-01";
   ```
3. Compile and flash using PlatformIO:
   ```bash
   cd firmware/esp32
   pio run --target upload
   pio device monitor
   ```

---

## 🧪 End-to-End Verification Checklist

1. **ESP32**: Check serial monitor output at 115200 baud:
   ```text
   [ESP32 Wi-Fi] Connected! IP: 192.168.x.x
   [ESP32 MQTT] Connecting to broker xxxxxxxxxxxxxx.hivemq.cloud:8883 (TLS=ON)...
   [ESP32 MQTT] Connected successfully to MQTT Broker!
   [ESP32 Publish]: {"device_id":"ESP32-NODE-01","temperature":"28.50", ...} -> ✅ Published to MQTT Broker.
   ```
2. **Backend**: Check deployment logs:
   ```text
   [MongoDB] Connected successfully
   [MQTT Consumer] ✅ Connected successfully to MQTT broker
   [MQTT Consumer] 📡 Subscribed to topic 'weather/telemetry'
   [WebSocket Gateway] 🔌 Client connected
   [Ingestion Service] Processed telemetry packet for 'ESP32-NODE-01'
   ```
3. **Backend Health Check**:
   Query `https://your-backend.onrender.com/health`:
   ```json
   {
     "status": "ok",
     "service": "Weather Ingestion Backend Service",
     "environment": "production",
     "database": "connected",
     "mqtt": "connected",
     "websocket_clients": 1
   }
   ```
4. **Frontend**: Open `https://your-weather-dashboard.vercel.app`:
   - Landing page displays project attribution.
   - Click *Check Out Now* → Sign in to authentication page.
   - Dashboard streams live telemetry and alerts over `wss://` in real time.
