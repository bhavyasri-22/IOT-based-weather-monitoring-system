# NATIONAL INSTITUTE OF TECHNOLOGY KARNATAKA, SURATHKAL
### Department of Information Technology (IT303 – Internet of Things)

---

# IoT-Based Real-Time Weather Monitoring System
## User Manual – Students, Researchers & System Operators

**Date:** October 2026 / Academic Session 2024–2025  
**Document prepared by:** C Thanmai Sai, Mili Dholaria, Thota Bhavya Sri  
**Under the Guidance of:** Prof. Jaidhar C. D.  
**System URL:** [https://iot-based-weather-monitoring-system.vercel.app/](https://iot-based-weather-monitoring-system.vercel.app/)

---

## 1. Introduction

This manual serves the purpose of highlighting the different features, monitoring workflows, data analytics tools, and hardware diagnostics available to students, researchers, lab operators, and administrators within the **IoT-Based Real-Time Weather Monitoring System**.

The platform is an end-to-end environmental intelligence system that captures physical atmospheric telemetry using an **ESP32 microcontroller** cluster coupled with precision digital and analog sensors (BME280, FC-37, MQ-135, BH1750, Anemometer). Sensor telemetry is securely transmitted across the public Internet via **MQTT over TLS (Port 8883)** to a cloud ingestion engine, permanently archived in **MongoDB Atlas**, and streamed to user web browsers with sub-second latency through full-duplex **WebSockets**.

---

## 2. Accessing the Platform

1. Open any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari) on your computer, tablet, or smartphone.
2. Navigate to the deployed system web address:  
   **`https://iot-based-weather-monitoring-system.vercel.app/`**
3. The platform opens the **Welcome Landing Page**, presenting an architectural summary, connected sensor overview, and system operational highlights.
4. Click on the **"Launch Dashboard"** button on the hero section or the **"Sign In"** button on the top-right navigation bar to enter the authentication portal.

---

## 3. Actions Available to Users & Operators

Users have access to a comprehensive suite of environmental monitoring, analytical, and diagnostic capabilities:

* **Monitor Real-Time Weather Conditions:**
  * Ambient Temperature (°C) and calculated physiological **Heat Index** ("Feels Like").
  * Relative Humidity (%) and moisture saturation indices.
  * Precipitation / Rain Intensity (mm/h) and real-time surface water accumulation status.
  * Barometric Atmospheric Pressure (hPa).
  * Proxy Air Quality Index (AQI) and gas detection via MQ-135.
  * Ambient Light Illuminance (Lux) and wind velocity (km/h).
* **Live Telemetry Gateway & Packet Inspection:**
  * Real-time telemetry frames synchronized via WebSockets (stream latency ~18 ms).
  * Active Frame Inspector displaying raw JSON payloads decoded directly from MQTT topics.
  * Ingestion frequency metrics and live node heartbeat tracking.
* **Multi-Metric Analytics & Historical Data:**
  * Visual time-series area charts for each environmental metric.
  * Dynamic timeframe filtering: **1 Hour (1h)**, **6 Hours (6h)**, **24 Hours (24h)**, and **7 Days (7d)**.
  * Automated computation of statistical aggregates: **Minimum**, **Maximum**, and **Average** values.
  * **Export to CSV**: Instant one-click download of timestamped datasets for laboratory reports and scientific analysis.
* **Environmental Alert Management:**
  * Visual multi-tier alarm banners (**Warning** vs. **Critical** breaches).
  * Filtering of alerts by status (**Active**, **Critical**, **Warning**, **Resolved**).
  * Keyword search across alert messages, parameters, and severity.
  * One-click incident acknowledgment and resolution.
* **Hardware Sensors & Transducer Diagnostics:**
  * Live status of physical ESP32 nodes (**Online Transmitting** vs. **Offline**).
  * Transducer channel health and GPIO pinout mappings (BME280 I2C, FC-37 ADC, MQ-135 ADC, BH1750 I2C, Anemometer pulse counter).
  * Firmware version and timestamp of last telemetry packet received.
* **System Administration (Admin Role Only):**
  * Dynamic configuration of environmental warning and critical thresholds for all parameters.
  * Registration of new ESP32 sensor stations.
  * Decommissioning / removal of inactive nodes.
  * Registered operator and user directory management.

---

## 4. Module Features & Step-by-Step Walkthrough

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MAIN SYSTEM NAVIGATION TREE                           │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ 1. Overview   │ Main weather hero card, sensor grid, rain gauge, trends    │
│ 2. Live       │ Sub-second WebSocket stream, JSON inspector, activity feed  │
│ 3. Analytics  │ Metric trend curves, aggregated stats, CSV export           │
│ 4. Sensors    │ ESP32 node health, hardware bus pinouts, station metadata   │
│ 5. Alerts     │ Active threshold alarm feed, severity filters, resolution   │
│ 6. History    │ Historical archive, customizable time windows, log tables   │
│ 7. Config*    │ Safety limits, threshold calibration, user directory        │
└───────────────┴─────────────────────────────────────────────────────────────┘
* Visible only to users with the Administrator role.
```

---

### Feature 1: User Authentication & Access Control

The platform provides role-based authentication using cryptographically signed **JSON Web Tokens (JWT)**.

#### Step 1.1: Logging into an Existing Account
1. From the Landing Page, click **"Sign In"** or navigate directly to `/auth`.
2. Select the **"Sign In"** tab on the authentication card.
3. Enter your credentials:
   * **Username or Email Address** (e.g., `admin@nitk.edu.in` or `operator1`).
   * **Password**.
4. Click the **"Sign In to Station"** button. Upon successful verification, you will be redirected to the main Dashboard.

#### Step 1.2: Registering a New Operator Account
1. On the authentication card, click **"Create an account"** or select the **"Register"** tab.
2. Enter the following required details:
   * **Username:** Minimum 3 characters (e.g., `student_user`).
   * **Email Address:** Valid institutional email (e.g., `student@nitk.edu.in`).
   * **Password:** Minimum 4 characters.
3. Click the **"Create Account"** button. The session token is automatically stored in your browser, granting immediate access.

> [!NOTE]
> Sessions remain active across page reloads. If a token expires or becomes invalid, the system automatically redirects you back to `/auth` with a notification prompt.

---

### Feature 2: Real-Time Weather Dashboard (Overview)

The **Weather Overview** (`/dashboard`) serves as the central control room for outdoor station data.

#### Key Dashboard Components:

1. **Active Alerts Notification Banner:**
   * Appears at the very top of the screen when any environmental threshold is exceeded.
   * Displays the severity (**Critical** in rose red, **Warning** in amber), the offending parameter, and the measured value.
   * Includes an **"Acknowledge"** button for immediate operator resolution.
2. **Weather Overview Hero Card:**
   * **Location Indicator:** Displays active station location (e.g., `Coastal Sensor Station 01 (NITK)`).
   * **Ambient Temperature Display:** Current reading in large typography with degree Celsius unit.
   * **Feels-Like Heat Index:** Thermally calculated comfort temperature combining relative humidity and dry-bulb temperature.
   * **Derived Weather Condition:** Meteorological condition tag (e.g., *Clear Skies*, *Light Showers*, *High Heat*, *Overcast*).
   * **Simulated Daily High & Low:** Projected diurnal temperature swing.
   * **Station Telemetry Badges:** Fast-glance pills for Relative Humidity (%), Rainfall (mm/h), Pressure (hPa), and Wind Speed (km/h).
3. **Sensor Conditions Grid:**
   * Six dedicated telemetry cards displaying:
     * **Temperature:** Includes comfort classification (*Comfortable*, *Cool Temp*, *High Heat*).
     * **Relative Humidity:** Moisture saturation indicator (*Optimal Moisture*, *Dry Air*, *High Humidity*).
     * **Rainfall:** Surface accumulation status (*Dry Surface*, *Light Showers*, *Moderate Rain*, *Heavy Rain*).
     * **Air Quality (AQI):** Categorization according to standard AQI bands (*Good*, *Moderate*, *Sensitive Groups*, *Unhealthy Proxy*).
     * **Atmospheric Pressure:** Barometric reading in hectopascals (hPa).
     * **Ambient Illuminance:** Sun intensity and illuminance in Lux (lx).
4. **Rain Status & Surface Accumulation Card:**
   * Dynamic visual rainfall gauge highlighting state (*Dry Baseline*, *Light Drops*, *Steady Rain*, *Caution: Heavy Precipitation*).
   * Visual progress bar representing precipitation intensity up to 30 mm/h.
5. **Recent Station Telemetry Table:**
   * Chronological log of recent telemetry packets received by the cloud backend.
   * Automatically prepends incoming live packets with smooth animations.
6. **Environmental Trend Chart:**
   * Quick-switch multi-metric area graph on the dashboard allowing operators to toggle between Temperature, Humidity, Rainfall, and Pressure trends without leaving the Overview page.

---

### Feature 3: Live Sensor Telemetry Gateway

Accessible via the sidebar at **"Live Monitor"** (`/dashboard/live`), this interface is designed for real-time laboratory inspection.

1. **Gateway Link Status Banner:**
   * **Connection State:** Displays `WebSocket Synchronized` with a green pulsing radar icon when connected, or `Reconnecting...` during network drops.
   * **Station Node ID:** Shows the active transmitting hardware identifier (e.g., `ESP32_SURATHKAL_01`).
   * **Telemetry Ingestion Frequency:** Standard hardware sampling cadence (`1 frame / 5 sec`).
   * **Stream Latency:** Round-trip network delivery time (~18 ms).
   * **Last Heartbeat:** Real-time relative counter (`Just now`, `5s ago`).
2. **Hardware Transducers Grid:**
   * Real-time monitoring cards for each physical transducer connected to the microcontroller:
     * **BME280 Digital Sensor:** Temperature, Humidity, Barometric Pressure.
     * **FC-37 Rain Sensor:** Analog surface resistance and rain rate.
     * **MQ-135 Gas Sensor:** Air contamination and gas ppm proxy.
     * **BH1750 Photodiode:** Optical lux measurement.
     * **Pulse Anemometer:** Cup rotation counter for wind velocity.
3. **Active Frame Inspector (Raw JSON Payload):**
   * Inspects the exact un-parsed JSON string transmitted by the ESP32 over MQTT.
   * Click **"Copy Payload"** to copy the JSON object to your clipboard for hardware debugging or firmware validation.
4. **Live Activity Stream:**
   * An event log recording incoming telemetry frames, alert triggerings, resolution actions, and WebSocket handshakes.

---

### Feature 4: Environmental Analytics & Historical Archive

The system provides two dedicated views for historical data exploration: **Analytics** (`/dashboard/analytics`) and **History** (`/dashboard/history`).

#### Step 4.1: Viewing Analytical Trends
1. Click **"Analytics"** on the left navigation drawer.
2. Select a target metric from the parameter tabs:
   * **Temperature (°C)**
   * **Humidity (%)**
   * **Pressure (hPa)**
   * **Wind Speed (km/h)**
   * **Air Quality (AQI)**
   * **Rainfall (mm/h)**
   * **Ambient Light (lx)**
3. Choose the desired time window filter:
   * **1 Hour (1h)** – High-resolution telemetry inspection.
   * **6 Hours (6h)** – Short-term weather shifts.
   * **24 Hours (24h)** – Diurnal environmental cycles.
   * **7 Days (7d)** – Weekly meteorological patterns.
4. The system renders a smoothed SVG gradient area chart with crosshair hover tooltips displaying the exact timestamp and value.

#### Step 4.2: Analyzing Statistical Aggregates
Directly beneath the chart, review automatically calculated summary cards:
* **Minimum Value:** Lowest recorded reading during the selected interval.
* **Maximum Value:** Highest peak recorded during the selected interval.
* **Average (Mean) Value:** Arithmetic average across all recorded data points.

#### Step 4.3: Exporting Data to CSV
1. Set the metric and time range of interest.
2. Click the **"Export CSV"** button located at the top-right of the analytics card.
3. Your browser automatically downloads a file named:  
   `atmos_<metric>_<range>_history.csv`  
4. The downloaded spreadsheet contains clean, formatted headers:  
   `Timestamp,Metric,Value,Unit`

---

### Feature 5: Environmental Alerts & Incident Management

The **Environmental Alerts** module (`/dashboard/alerts`) tracks threshold violations and safety breaches.

#### Step 5.1: Filtering Alert Logs
1. Click on **"Alerts"** in the navigation menu. (A red notification pill indicates if unresolved alerts exist).
2. Filter the table using the quick-filter tabs:
   * **All:** Complete audit trail of active and historical incidents.
   * **Critical:** Dangerous environmental breaches requiring prompt attention.
   * **Warning:** Moderate parameter deviations.
   * **Resolved:** Past incidents that have returned to normal or been acknowledged.
3. Use the **Search Bar** to filter alerts by keyword (e.g., search `temperature`, `critical`, `humidity`, or `rain`).

#### Step 5.2: Acknowledging and Resolving an Alert
1. Identify the active alert in the list.
2. Click the **"Resolve"** / **"Acknowledge"** button on the right side of the alert card.
3. The alert status immediately transitions to `Resolved`, the red badge counter in the top bar decrements, and the event is logged in the system activity feed.

---

### Feature 6: Sensors & Hardware Transducers

The **Sensors** module (`/dashboard/devices`) provides hardware telemetry diagnostics and station inventory.

#### Hardware Node Inspection:
* **Total Hardware Nodes:** Count of registered microcontroller units.
* **Online Transmitting Nodes:** Units actively publishing MQTT heartbeats within the last 60 seconds.
* **Node Information Cards:**
  * **Device ID:** E.g., `ESP32_SURATHKAL_01`.
  * **Location:** Deployed site (e.g., `Coastal Sensor Station 01 (NITK)`).
  * **Connection Status:** `Online` (green badge) or `Offline` (amber/gray badge).
  * **Firmware Version:** E.g., `v2.4.1`.
  * **Last Seen Timestamp:** Relative time since the last valid MQTT frame.

#### Hardware Pinout Reference Table:

| Sensor Module | Transducer Function | ESP32 GPIO Pin / Bus | Operating Voltage |
| :--- | :--- | :--- | :--- |
| **BME280** | Temperature, Humidity, Barometric Pressure | `GPIO 21` (SDA), `GPIO 22` (SCL) – I2C Bus | 3.3V DC |
| **FC-37 Rain Sensor** | Raindrop Surface Resistance / Precipitation Rate | `GPIO 34` (Analog In ADC1_CH6) | 3.3V DC |
| **MQ-135 Gas Sensor** | Hazardous Gas & Air Quality Proxy (CO2, NH3, Smoke) | `GPIO 35` (Analog In ADC1_CH7) | 5.0V / 3.3V DC |
| **BH1750 Sensor** | Digital Ambient Light & Solar Illuminance | `GPIO 21` (SDA), `GPIO 22` (SCL) – I2C Addr `0x23` | 3.3V DC |
| **Cup Anemometer** | Wind Velocity Frequency Pulse Counter | `GPIO 14` (Hardware Interrupt) | 3.3V DC |

#### Registering a New Station (Admin Only):
1. Click the **"Register Node"** button at the top of the Sensors page.
2. Enter the new station details:
   * **Device Identifier:** Unique string (e.g., `ESP32_LAB_02`).
   * **Installation Location:** Physical site description (e.g., `NITK Beach Lighthouse Station`).
3. Click **"Save & Register"**. The new node will appear in the fleet list.

---

### Feature 7: System Administration & Safety Thresholds (Admin)

The **Admin Config** module (`/dashboard/admin`) is restricted to accounts with administrative privileges.

#### Step 7.1: Calibrating Environmental Safety Limits
1. Navigate to **"Admin Config"** from the sidebar drawer.
2. The **Environmental Safety Setpoints** table displays every configurable parameter:
   * **Temperature (°C)**
   * **Relative Humidity (%)**
   * **Barometric Pressure (hPa)**
   * **Feels-Like Heat Index (°C)**
   * **Air Quality (MQ135)**
   * **Wind Velocity (km/h)**
   * **Rain Intensity (mm/h)**
3. For each parameter, administrators can configure four discrete setpoint bounds:
   * **Critical Low:** Severe under-range limit triggering immediate Critical Alarm.
   * **Warning Low:** Minor low deviation triggering an advisory alert.
   * **Warning High:** Minor upper threshold triggering an advisory alert.
   * **Critical High:** Hazardous upper limit triggering a Critical Alarm.
4. Update the numerical values in the respective input fields.
5. Click the **"Save"** button next to that row.
6. A green **"Saved"** badge confirms that the backend alert evaluation engine has updated its in-memory rules.

#### Step 7.2: Operator & User Management Directory
* Scroll to the bottom of the Admin Config page to inspect the **Registered Operators & Administrators** list.
* View user account usernames, emails, and their assigned roles (`Admin` or `Operator`).

---

## 5. UI Elements & Global Controls

The application layout includes several persistent UI controls:

* **Hamburger Menu Button (☰):** Located at the top-left of the header. Toggles the off-canvas navigation sidebar drawer on both desktop and mobile viewports.
* **Theme Mode Switcher (☀️ / 🌙):** Toggles between a high-contrast Sunlight Daylight theme and an OLED Dark Mode for night monitoring.
* **Notification Bell (🔔):** Located in the header bar. Displays a real-time badge count of unacknowledged alerts. Clicking opens a dropdown drawer with active alert cards and direct acknowledge buttons.
* **Station Node Indicator:** Displays the currently selected hardware station with a real-time connectivity status dot.
* **User Profile & Logout:** Displays the logged-in username and role badge (`Admin` or `Operator`). Clicking the logout icon securely clears session tokens and returns you to the login screen.

---

## 6. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: The dashboard shows "Reconnecting..." in the Live Monitor banner.
* **Cause:** The browser lost its real-time WebSocket connection to the cloud backend.
* **Resolution:** Check your local Internet connection. The application automatically retries connecting every 3 seconds with exponential backoff. You can also click the browser reload button.

### Q2: Why is the station status marked as "Offline"?
* **Cause:** The physical ESP32 node has not transmitted an MQTT packet within the last 60 seconds.
* **Resolution:** 
  1. Verify the ESP32 is powered on (micro-USB cable securely connected).
  2. Verify the Wi-Fi credentials in `firmware/esp32/src/secrets.h`.
  3. Ensure the ESP32 can connect to the Cloud MQTT Broker on port `8883`.

### Q3: Why is the "Admin Config" link missing from my sidebar?
* **Cause:** You are logged in with the standard `Operator` or `Student` role.
* **Resolution:** The Admin Configuration tab is restricted to users with `role: "admin"`. Contact a lab administrator or register an administrator account if permitted.

### Q4: How do I export historical weather data for my lab experiment?
* **Steps:** 
  1. Open the **"Analytics"** or **"History"** page.
  2. Select your desired metric and timeframe (e.g., *Precipitation* over *24 Hours*).
  3. Click the **"Export CSV"** button. The file can be opened directly in Microsoft Excel, Google Sheets, or Python pandas.

---

## 7. Technical Support & Inquiries

For technical issues, sensor recalibration requests, or system enhancement proposals, please reach out to the project team:

* **Department:** Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal, Mangalore – 575025.
* **Course:** IT303 – Internet of Things
* **Project Developers:** C Thanmai Sai, Mili Dholaria, Thota Bhavya Sri
* **Project Guide:** Prof. Jaidhar C. D.
* **Platform Deployed URL:** [https://iot-based-weather-monitoring-system.vercel.app/](https://iot-based-weather-monitoring-system.vercel.app/)

---
*(End of Document)*
