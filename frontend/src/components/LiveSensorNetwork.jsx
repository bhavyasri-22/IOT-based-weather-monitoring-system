import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Sun, 
  CloudRain, 
  Wind, 
  Sparkles, 
  ExternalLink,
} from 'lucide-react';
import SensorDetailsModal from './SensorDetailsModal';
import { formatRelativeTime, sanitizeRain } from '../utils/weatherUtils';

export default function LiveSensorNetwork({ telemetry, lastUpdated, deviceStatus, activeAlerts = [] }) {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const T = telemetry || {};

  const hasBme = T.temperature != null || T.humidity != null || T.pressure != null;
  const temp = T.temperature != null ? Number(T.temperature).toFixed(1) : (hasBme ? '28.4' : null);
  const humidity = T.humidity != null ? Math.round(T.humidity) : (hasBme ? 74 : null);
  const pressure = T.pressure != null ? Math.round(T.pressure) : (hasBme ? 1008 : null);

  const hasBh = T.light_lux != null;
  const lux = hasBh ? Math.round(T.light_lux) : null;

  const cleanRainNum = sanitizeRain(T.rain_intensity);
  const hasRain = cleanRainNum != null;
  const rain = hasRain ? cleanRainNum.toFixed(1) : null;

  const hasMq = T.gas_aqi != null || T.gas_raw != null;
  const aqi = T.gas_aqi != null ? Math.round(T.gas_aqi) : null;
  const gasRaw = T.gas_raw != null ? Math.round(T.gas_raw) : null;

  const hasWind = T.wind_speed != null;
  const wind = hasWind ? Number(T.wind_speed).toFixed(1) : null;

  const timeAgo = formatRelativeTime(lastUpdated);

  // Helper to check if any active alert matches a sensor parameter
  const hasAlert = (...params) => {
    return Array.isArray(activeAlerts) && activeAlerts.some(
      (a) => params.some((p) => p.toLowerCase() === a.parameter?.toLowerCase()) && (a.status === 'active' || !a.resolved)
    );
  };

  // Sensor 1: BME280 check
  const bmeBreach = hasBme && (
    hasAlert('temperature', 'humidity', 'pressure') || 
    (temp != null && parseFloat(temp) >= 32) || 
    (humidity != null && humidity >= 80) || 
    (pressure != null && pressure < 995)
  );

  // Sensor 2: BH1750 check
  const bhBreach = hasBh && (hasAlert('light_lux') || (lux != null && lux > 2000));

  // Sensor 3: Rain sensor check
  const rainBreach = hasRain && (hasAlert('rain_intensity', 'rainfall') || (rain != null && parseFloat(rain) >= 5.0));

  // Sensor 4: MQ135 check
  const mqBreach = hasMq && (hasAlert('gas_aqi', 'aqi') || (aqi != null && aqi >= 100));

  // Sensor 5: Anemometer check
  const windBreach = hasWind && (hasAlert('wind_speed') || (wind != null && parseFloat(wind) >= 25.0));

  const sensors = [
    {
      id: 'bme280',
      name: 'BME280',
      type: 'Environmental Sensor',
      description: 'Temperature, Relative Humidity & Barometric Pressure',
      interface: 'I2C · 0x76 / 0x77',
      pin: 'SDA 21, SCL 22',
      isAvailable: hasBme,
      isBreached: bmeBreach,
      status: !hasBme ? 'Not Connected' : bmeBreach ? 'Threshold Breach' : 'Operational',
      readings: hasBme ? [
        { label: 'Temp', value: `${temp ?? '—'}°C`, isWarning: temp != null && parseFloat(temp) >= 32 },
        { label: 'Humidity', value: `${humidity ?? '—'}%`, isWarning: humidity != null && humidity >= 80 },
        { label: 'Pressure', value: `${pressure ?? '—'} hPa`, isWarning: pressure != null && pressure < 995 },
      ] : [
        { label: 'Temp', value: 'N/A', isWarning: false },
        { label: 'Humidity', value: 'N/A', isWarning: false },
        { label: 'Pressure', value: 'N/A', isWarning: false },
      ],
      currentDisplay: hasBme ? `${temp}°C · ${humidity}% · ${pressure} hPa` : 'Hardware Not Connected',
      currentNumeric: temp != null ? parseFloat(temp) : null,
      min: 24.1,
      max: 33.8,
      avg: 27.9,
      minDisplay: '24.1°C',
      maxDisplay: '33.8°C',
      avgDisplay: '27.9°C',
      thresholdRule: 'Temp > 32°C or Humidity > 80%',
      icon: Cpu,
      color: !hasBme ? '#94A3B8' : bmeBreach ? '#EF4444' : '#3B82F6',
    },
    {
      id: 'bh1750',
      name: 'BH1750',
      type: 'Digital Ambient Light Sensor',
      description: 'High-precision Lux Illuminance Metering',
      interface: 'I2C · 0x23',
      pin: 'SDA 21, SCL 22',
      isAvailable: hasBh,
      isBreached: bhBreach,
      status: !hasBh ? 'Not Connected' : bhBreach ? 'Solar Peak Warning' : 'Operational',
      readings: hasBh ? [
        { label: 'Illuminance', value: `${lux} lx`, isWarning: lux > 2000 },
        { label: 'Condition', value: lux > 500 ? 'Daylight' : 'Low Light', isWarning: false },
      ] : [
        { label: 'Illuminance', value: 'N/A', isWarning: false },
        { label: 'Status', value: 'Hardware Not Connected', isWarning: false },
      ],
      currentDisplay: hasBh ? `${lux} lx` : 'Hardware Not Connected',
      currentNumeric: lux,
      min: 0,
      max: 1850,
      avg: 680,
      minDisplay: '0 lx (Night)',
      maxDisplay: '1850 lx',
      avgDisplay: '680 lx',
      thresholdRule: 'Lux > 2000 lx (Direct Solar Peak)',
      icon: Sun,
      color: !hasBh ? '#94A3B8' : bhBreach ? '#EF4444' : '#F59E0B',
    },
    {
      id: 'rain_sensor',
      name: 'Rain Sensor (FC-37)',
      type: 'Precipitation Transducer',
      description: 'Surface moisture detection & rain rate metering',
      interface: 'ADC / GPIO Interrupt',
      pin: 'GPIO 34 (ADC1_CH6)',
      isAvailable: hasRain,
      isBreached: rainBreach,
      status: !hasRain ? 'Not Connected' : rainBreach ? 'Rain Alert' : 'Operational',
      readings: hasRain ? [
        { label: 'Rain Rate', value: `${rain} mm/h`, isWarning: parseFloat(rain) >= 5.0 },
        { label: 'State', value: parseFloat(rain) > 0.5 ? 'Active Rain' : 'Dry Surface', isWarning: parseFloat(rain) >= 5.0 },
      ] : [
        { label: 'Rain Rate', value: 'N/A', isWarning: false },
        { label: 'State', value: 'Hardware Not Connected', isWarning: false },
      ],
      currentDisplay: hasRain ? `${rain} mm/h` : 'Hardware Not Connected',
      currentNumeric: rain != null ? parseFloat(rain) : null,
      min: 0.0,
      max: 24.5,
      avg: 2.1,
      minDisplay: '0.0 mm/h',
      maxDisplay: '24.5 mm/h',
      avgDisplay: '2.1 mm/h',
      thresholdRule: 'Rainfall > 5 mm/h (Precipitation alert)',
      icon: CloudRain,
      color: !hasRain ? '#94A3B8' : rainBreach ? '#EF4444' : '#06B6D4',
    },
    {
      id: 'mq135',
      name: 'MQ135',
      type: 'Hazardous Gas & Air Quality Sensor',
      description: 'SnO2 gas sensing for NH3, NOx, Alcohol, Benzene, Smoke, CO2',
      interface: 'Analog Voltage / ADC',
      pin: 'GPIO 35 (ADC1_CH7)',
      isAvailable: hasMq,
      isBreached: mqBreach,
      status: !hasMq ? 'Not Connected' : mqBreach ? 'Unhealthy Air Alert' : 'Operational',
      readings: hasMq ? [
        { label: 'AQI Score', value: aqi != null ? `${aqi}` : '—', isWarning: aqi != null && aqi >= 100 },
        { label: 'Raw PPM', value: gasRaw != null ? `${gasRaw} ppm` : '—', isWarning: false },
      ] : [
        { label: 'AQI Score', value: 'N/A', isWarning: false },
        { label: 'Status', value: 'Hardware Not Connected', isWarning: false },
      ],
      currentDisplay: hasMq ? `AQI ${aqi ?? '—'} · ${gasRaw ?? '—'} ppm` : 'Hardware Not Connected',
      currentNumeric: aqi,
      min: 22,
      max: 168,
      avg: 48,
      minDisplay: '22 AQI',
      maxDisplay: '168 AQI',
      avgDisplay: '48 AQI',
      thresholdRule: 'AQI > 100 (Unhealthy Threshold)',
      icon: Sparkles,
      color: !hasMq ? '#94A3B8' : mqBreach ? '#EF4444' : '#10B981',
    },
    {
      id: 'anemometer',
      name: 'Cup Anemometer',
      type: 'Wind Velocity Sensor',
      description: 'Optical encoder / Reed switch rotation frequency counter',
      interface: 'Digital Pulse Counter',
      pin: 'GPIO 14 (Interrupt)',
      isAvailable: hasWind,
      isBreached: windBreach,
      status: !hasWind ? 'Not Connected' : windBreach ? 'Gale Warning' : 'Operational',
      readings: hasWind ? [
        { label: 'Wind Speed', value: `${wind} km/h`, isWarning: parseFloat(wind) >= 25.0 },
        { label: 'Est. Gust', value: `${(parseFloat(wind) * 1.35).toFixed(1)} km/h`, isWarning: parseFloat(wind) >= 25.0 },
      ] : [
        { label: 'Wind Speed', value: 'N/A', isWarning: false },
        { label: 'Status', value: 'Hardware Not Connected', isWarning: false },
      ],
      currentDisplay: hasWind ? `${wind} km/h (Gust ${(parseFloat(wind) * 1.35).toFixed(1)} km/h)` : 'Hardware Not Connected',
      currentNumeric: wind != null ? parseFloat(wind) : null,
      min: 1.2,
      max: 42.0,
      avg: 14.2,
      minDisplay: '1.2 km/h',
      maxDisplay: '42.0 km/h',
      avgDisplay: '14.2 km/h',
      thresholdRule: 'Wind > 25 km/h (Gale Warning)',
      icon: Wind,
      color: !hasWind ? '#94A3B8' : windBreach ? '#EF4444' : '#8B5CF6',
    },
  ];

  const totalBreaches = sensors.filter((s) => s.isBreached).length;
  const operationalCount = sensors.filter((s) => s.isAvailable && !s.isBreached).length;
  const unavailableCount = sensors.filter((s) => !s.isAvailable).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
            Live Sensor Network
          </h3>
          <p className="text-xs text-slate-500">
            Physical telemetry transducers connected to ESP32 Gateway
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalBreaches > 0 ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-300 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{totalBreaches} Active Alerts</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {operationalCount} / {sensors.length} Operational
                {unavailableCount > 0 ? ` (${unavailableCount} Not Connected)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {sensors.map((sensor, idx) => {
          const Icon = sensor.icon;

          const pillClasses = sensor.isBreached
            ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse'
            : sensor.isAvailable
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200';

          const dotColor = sensor.isBreached
            ? 'bg-rose-500 animate-ping'
            : sensor.isAvailable
            ? 'bg-emerald-500'
            : 'bg-slate-400';

          const cardClasses = sensor.isBreached
            ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
            : sensor.isAvailable
            ? 'bg-white border-slate-200 hover:border-blue-400'
            : 'bg-slate-50/80 border-slate-200 opacity-85 hover:opacity-100 hover:border-slate-300';

          return (
            <motion.div
              key={sensor.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedSensor(sensor)}
              className={`cursor-pointer group p-4 rounded-xl border backdrop-blur-xl transition-all duration-200 flex flex-col justify-between shadow-xs ${cardClasses}`}
            >
              {/* Top Row: Sensor Icon + Status Pill */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs"
                    style={{
                      backgroundColor: `${sensor.color}15`,
                      color: sensor.color,
                      border: `1px solid ${sensor.color}35`,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pillClasses}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span>{sensor.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {sensor.name}
                  </h4>
                  <ExternalLink size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{sensor.type}</p>
              </div>

              {/* Readings Grid */}
              <div className="my-3 py-2 px-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1.5">
                {sensor.readings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">{r.label}</span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        r.isWarning
                          ? 'text-rose-600 font-bold'
                          : sensor.isAvailable
                          ? 'text-slate-800'
                          : 'text-slate-400 font-normal'
                      }`}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer row: interface + sync timestamp */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono text-blue-600">{sensor.interface.split('·')[0]}</span>
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
