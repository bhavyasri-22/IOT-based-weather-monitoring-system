import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Sun, 
  CloudRain, 
  Wind, 
  Sparkles, 
  Activity, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import SensorDetailsModal from './SensorDetailsModal';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function LiveSensorNetwork({ telemetry, lastUpdated, deviceStatus, activeAlerts = [] }) {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const T = telemetry || {};

  const temp = T.temperature != null ? Number(T.temperature).toFixed(1) : '28.4';
  const humidity = T.humidity != null ? Math.round(T.humidity) : 74;
  const pressure = T.pressure != null ? Math.round(T.pressure) : 1008;
  const lux = T.light_lux != null ? Math.round(T.light_lux) : 742;
  const rain = T.rain_intensity != null ? Number(T.rain_intensity).toFixed(1) : '0.0';
  const aqi = T.gas_aqi != null ? Math.round(T.gas_aqi) : 42;
  const gasRaw = T.gas_raw != null ? Math.round(T.gas_raw) : 142;
  const wind = T.wind_speed != null ? Number(T.wind_speed).toFixed(1) : '12.0';

  const timeAgo = formatRelativeTime(lastUpdated);

  // Helper to check if any active alert matches a sensor parameter
  const hasAlert = (...params) => {
    return Array.isArray(activeAlerts) && activeAlerts.some(
      (a) => params.some((p) => p.toLowerCase() === a.parameter?.toLowerCase()) && (a.status === 'active' || !a.resolved)
    );
  };

  // Sensor 1: BME280 check
  const bmeBreach = hasAlert('temperature', 'humidity', 'pressure') || 
                    parseFloat(temp) >= 32 || 
                    humidity >= 80 || 
                    pressure < 995;

  // Sensor 2: BH1750 check
  const bhBreach = hasAlert('light_lux') || lux > 2000;

  // Sensor 3: Rain sensor check
  const rainBreach = hasAlert('rain_intensity', 'rainfall') || parseFloat(rain) >= 5.0;

  // Sensor 4: MQ135 check
  const mqBreach = hasAlert('gas_aqi', 'aqi') || aqi >= 100;

  // Sensor 5: Anemometer check
  const windBreach = hasAlert('wind_speed') || parseFloat(wind) >= 25.0;

  const sensors = [
    {
      id: 'bme280',
      name: 'BME280',
      type: 'Environmental Sensor',
      description: 'Temperature, Relative Humidity & Barometric Pressure',
      interface: 'I2C · 0x76 / 0x77',
      pin: 'SDA 21, SCL 22',
      isBreached: bmeBreach,
      status: bmeBreach ? 'Threshold Breach' : 'Operational',
      readings: [
        { label: 'Temp', value: `${temp}°C`, isWarning: parseFloat(temp) >= 32 },
        { label: 'Humidity', value: `${humidity}%`, isWarning: humidity >= 80 },
        { label: 'Pressure', value: `${pressure} hPa`, isWarning: pressure < 995 },
      ],
      currentDisplay: `${temp}°C · ${humidity}% · ${pressure} hPa`,
      currentNumeric: parseFloat(temp),
      min: 24.1,
      max: 33.8,
      avg: 27.9,
      minDisplay: '24.1°C',
      maxDisplay: '33.8°C',
      avgDisplay: '27.9°C',
      thresholdRule: 'Temp > 32°C or Humidity > 80%',
      icon: Cpu,
      color: bmeBreach ? '#EF4444' : '#3B82F6',
    },
    {
      id: 'bh1750',
      name: 'BH1750',
      type: 'Digital Ambient Light Sensor',
      description: 'High-precision Lux Illuminance Metering',
      interface: 'I2C · 0x23',
      pin: 'SDA 21, SCL 22',
      isBreached: bhBreach,
      status: bhBreach ? 'Solar Peak Warning' : 'Operational',
      readings: [
        { label: 'Illuminance', value: `${lux} lx`, isWarning: lux > 2000 },
        { label: 'Condition', value: lux > 500 ? 'Daylight' : 'Low Light', isWarning: false },
      ],
      currentDisplay: `${lux} lx`,
      currentNumeric: lux,
      min: 0,
      max: 1850,
      avg: 680,
      minDisplay: '0 lx (Night)',
      maxDisplay: '1850 lx',
      avgDisplay: '680 lx',
      thresholdRule: 'Lux > 2000 lx (Direct Solar Peak)',
      icon: Sun,
      color: bhBreach ? '#F59E0B' : '#F59E0B',
    },
    {
      id: 'rain_sensor',
      name: 'Rain Sensor (FC-37)',
      type: 'Precipitation Transducer',
      description: 'Surface moisture detection & rain rate metering',
      interface: 'ADC / GPIO Interrupt',
      pin: 'GPIO 34 (ADC1_CH6)',
      isBreached: rainBreach,
      status: rainBreach ? 'Rain Alert' : 'Operational',
      readings: [
        { label: 'Rain Rate', value: `${rain} mm/h`, isWarning: parseFloat(rain) >= 5.0 },
        { label: 'State', value: parseFloat(rain) > 0.5 ? 'Active Rain' : 'Dry Surface', isWarning: parseFloat(rain) >= 5.0 },
      ],
      currentDisplay: `${rain} mm/h`,
      currentNumeric: parseFloat(rain),
      min: 0.0,
      max: 24.5,
      avg: 2.1,
      minDisplay: '0.0 mm/h',
      maxDisplay: '24.5 mm/h',
      avgDisplay: '2.1 mm/h',
      thresholdRule: 'Rainfall > 5 mm/h (Precipitation alert)',
      icon: CloudRain,
      color: rainBreach ? '#EF4444' : '#06B6D4',
    },
    {
      id: 'mq135',
      name: 'MQ135',
      type: 'Hazardous Gas & Air Quality Sensor',
      description: 'SnO2 gas sensing for NH3, NOx, Alcohol, Benzene, Smoke, CO2',
      interface: 'Analog Voltage / ADC',
      pin: 'GPIO 35 (ADC1_CH7)',
      isBreached: mqBreach,
      status: mqBreach ? 'Unhealthy Air Alert' : 'Operational',
      readings: [
        { label: 'AQI Score', value: `${aqi}`, isWarning: aqi >= 100 },
        { label: 'Raw PPM', value: `${gasRaw} ppm`, isWarning: false },
      ],
      currentDisplay: `AQI ${aqi} · ${gasRaw} ppm`,
      currentNumeric: aqi,
      min: 22,
      max: 168,
      avg: 48,
      minDisplay: '22 AQI',
      maxDisplay: '168 AQI',
      avgDisplay: '48 AQI',
      thresholdRule: 'AQI > 100 (Unhealthy Threshold)',
      icon: Sparkles,
      color: mqBreach ? '#EF4444' : '#10B981',
    },
    {
      id: 'anemometer',
      name: 'Cup Anemometer',
      type: 'Wind Velocity Sensor',
      description: 'Optical encoder / Reed switch rotation frequency counter',
      interface: 'Digital Pulse Counter',
      pin: 'GPIO 14 (Interrupt)',
      isBreached: windBreach,
      status: windBreach ? 'Gale Warning' : 'Operational',
      readings: [
        { label: 'Wind Speed', value: `${wind} km/h`, isWarning: parseFloat(wind) >= 25.0 },
        { label: 'Est. Gust', value: `${(parseFloat(wind) * 1.35).toFixed(1)} km/h`, isWarning: parseFloat(wind) >= 25.0 },
      ],
      currentDisplay: `${wind} km/h (Gust ${(parseFloat(wind) * 1.35).toFixed(1)} km/h)`,
      currentNumeric: parseFloat(wind),
      min: 1.2,
      max: 42.0,
      avg: 14.2,
      minDisplay: '1.2 km/h',
      maxDisplay: '42.0 km/h',
      avgDisplay: '14.2 km/h',
      thresholdRule: 'Wind > 25 km/h (Gale Warning)',
      icon: Wind,
      color: windBreach ? '#EF4444' : '#8B5CF6',
    },
  ];

  const totalBreaches = sensors.filter((s) => s.isBreached).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            Live Sensor Network
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#64748B]">
            Physical telemetry transducers connected to ESP32 Gateway
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalBreaches > 0 ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{totalBreaches} Active Alerts</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#34D399] border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#34D399] animate-pulse" />
              <span>5 / 5 Operational</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {sensors.map((sensor, idx) => {
          const Icon = sensor.icon;
          return (
            <motion.div
              key={sensor.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedSensor(sensor)}
              className={`cursor-pointer group p-4 rounded-xl backdrop-blur-xl transition-all duration-200 flex flex-col justify-between shadow-sm dark:shadow-lg ${
                sensor.isBreached
                  ? 'bg-rose-50/70 dark:bg-[#1B131D]/90 border border-rose-300 dark:border-rose-500/40 hover:border-rose-400'
                  : 'bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-[#60A5FA]/40'
              }`}
            >
              {/* Top Row: Sensor Icon + Status Pill */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                    style={{
                      backgroundColor: `${sensor.color}15`,
                      color: sensor.color,
                      border: `1px solid ${sensor.color}35`,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      sensor.isBreached
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/40 animate-pulse'
                        : 'bg-emerald-50 dark:bg-[#34D399]/10 text-emerald-600 dark:text-[#34D399] border-emerald-200 dark:border-[#34D399]/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sensor.isBreached ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 dark:bg-[#34D399]'
                      }`}
                    />
                    <span>{sensor.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#60A5FA] transition-colors">
                    {sensor.name}
                  </h4>
                  <ExternalLink size={12} className="text-slate-400 dark:text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B] line-clamp-1">{sensor.type}</p>
              </div>

              {/* Readings Grid */}
              <div className="my-3 py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] space-y-1.5">
                {sensor.readings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-[#94A3B8] text-[11px]">{r.label}</span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        r.isWarning
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-800 dark:text-[#F1F5F9]'
                      }`}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer row: interface + sync timestamp */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#64748B]">
                <span className="font-mono text-blue-600 dark:text-[#60A5FA]">{sensor.interface.split('·')[0]}</span>
                <span>{timeAgo}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sensor Modal */}
      {selectedSensor && (
        <SensorDetailsModal
          sensor={selectedSensor}
          onClose={() => setSelectedSensor(null)}
          telemetry={telemetry}
        />
      )}
    </div>
  );
}
