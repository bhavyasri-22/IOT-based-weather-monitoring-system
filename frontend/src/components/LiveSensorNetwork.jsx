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
  AlertCircle
} from 'lucide-react';
import SensorDetailsModal from './SensorDetailsModal';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function LiveSensorNetwork({ telemetry, lastUpdated, deviceStatus }) {
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

  const sensors = [
    {
      id: 'bme280',
      name: 'BME280',
      type: 'Environmental Sensor',
      description: 'Temperature, Relative Humidity & Barometric Pressure',
      interface: 'I2C · 0x76 / 0x77',
      pin: 'SDA 21, SCL 22',
      status: 'Operational',
      statusType: 'good',
      readings: [
        { label: 'Temp', value: `${temp}°C` },
        { label: 'Humidity', value: `${humidity}%` },
        { label: 'Pressure', value: `${pressure} hPa` },
      ],
      currentDisplay: `${temp}°C · ${humidity}% · ${pressure} hPa`,
      currentNumeric: parseFloat(temp),
      min: 24.1,
      max: 33.8,
      avg: 27.9,
      minDisplay: '24.1°C',
      maxDisplay: '33.8°C',
      avgDisplay: '27.9°C',
      thresholdRule: 'Temp > 38°C or Humidity > 90%',
      icon: Cpu,
      color: '#60A5FA',
    },
    {
      id: 'bh1750',
      name: 'BH1750',
      type: 'Digital Ambient Light Sensor',
      description: 'High-precision Lux Illuminance Metering',
      interface: 'I2C · 0x23',
      pin: 'SDA 21, SCL 22',
      status: 'Operational',
      statusType: 'good',
      readings: [
        { label: 'Illuminance', value: `${lux} lx` },
        { label: 'Condition', value: lux > 500 ? 'Daylight' : 'Low Light' },
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
      color: '#FBBF24',
    },
    {
      id: 'rain_sensor',
      name: 'Rain Sensor (FC-37 / Tipping)',
      type: 'Precipitation Transducer',
      description: 'Surface moisture detection & rain rate metering',
      interface: 'ADC / GPIO Interrupt',
      pin: 'GPIO 34 (ADC1_CH6)',
      status: 'Operational',
      statusType: 'good',
      readings: [
        { label: 'Rain Rate', value: `${rain} mm/h` },
        { label: 'State', value: parseFloat(rain) > 0.5 ? 'Active Rain' : 'Dry Surface' },
      ],
      currentDisplay: `${rain} mm/h`,
      currentNumeric: parseFloat(rain),
      min: 0.0,
      max: 24.5,
      avg: 2.1,
      minDisplay: '0.0 mm/h',
      maxDisplay: '24.5 mm/h',
      avgDisplay: '2.1 mm/h',
      thresholdRule: 'Rainfall > 15 mm/h (Flood alert)',
      icon: CloudRain,
      color: '#38BDF8',
    },
    {
      id: 'mq135',
      name: 'MQ135',
      type: 'Hazardous Gas & Air Quality Sensor',
      description: 'SnO2 gas sensing for NH3, NOx, Alcohol, Benzene, Smoke, CO2',
      interface: 'Analog Voltage / ADC',
      pin: 'GPIO 35 (ADC1_CH7)',
      status: 'Operational',
      statusType: 'good',
      readings: [
        { label: 'AQI Score', value: `${aqi}` },
        { label: 'Raw PPM', value: `${gasRaw} ppm` },
      ],
      currentDisplay: `AQI ${aqi} · ${gasRaw} ppm`,
      currentNumeric: aqi,
      min: 22,
      max: 168,
      avg: 48,
      minDisplay: '22 AQI',
      maxDisplay: '168 AQI',
      avgDisplay: '48 AQI',
      thresholdRule: 'AQI > 150 (Unhealthy Threshold)',
      icon: Sparkles,
      color: '#34D399',
    },
    {
      id: 'anemometer',
      name: 'Cup Anemometer',
      type: 'Wind Velocity Sensor',
      description: 'Optical encoder / Reed switch rotation frequency counter',
      interface: 'Digital Pulse Counter',
      pin: 'GPIO 14 (Interrupt)',
      status: 'Operational',
      statusType: 'good',
      readings: [
        { label: 'Wind Speed', value: `${wind} km/h` },
        { label: 'Est. Gust', value: `${(parseFloat(wind) * 1.35).toFixed(1)} km/h` },
      ],
      currentDisplay: `${wind} km/h (Gust ${(parseFloat(wind) * 1.35).toFixed(1)} km/h)`,
      currentNumeric: parseFloat(wind),
      min: 1.2,
      max: 42.0,
      avg: 14.2,
      minDisplay: '1.2 km/h',
      maxDisplay: '42.0 km/h',
      avgDisplay: '14.2 km/h',
      thresholdRule: 'Wind > 35 km/h (High Gale Warning)',
      icon: Wind,
      color: '#818CF8',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">Live Sensor Network</h3>
          <p className="text-xs text-[#64748B]">Physical telemetry transducers connected to ESP32 Gateway</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-xs font-medium text-[#94A3B8]">5 / 5 Active</span>
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
              className="cursor-pointer group p-4 rounded-xl bg-[#101D2E]/80 border border-white/[0.08] hover:border-[#60A5FA]/40 backdrop-blur-xl shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              {/* Top Row: Sensor Icon + Status Pill */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${sensor.color}15`,
                      color: sensor.color,
                      border: `1px solid ${sensor.color}30`,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34D399]/10 border border-[#34D399]/20 text-[10px] text-[#34D399] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                    <span>Operational</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
                    {sensor.name}
                  </h4>
                  <ExternalLink size={12} className="text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-[#64748B] line-clamp-1">{sensor.type}</p>
              </div>

              {/* Readings Grid */}
              <div className="my-3 py-2 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                {sensor.readings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8] text-[11px]">{r.label}</span>
                    <span className="font-semibold text-[#F1F5F9] font-mono">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Footer row: interface + sync timestamp */}
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-[#64748B]">
                <span className="font-mono text-[#60A5FA]">{sensor.interface.split('·')[0]}</span>
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
