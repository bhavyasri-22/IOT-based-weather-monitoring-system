import React, { useEffect, useRef, useState } from 'react';
import {
  Thermometer, Droplets, Gauge, Sun, CloudRain, Wind,
  FlaskConical, Flame, TrendingUp, TrendingDown, Minus,
  AlertTriangle, WifiOff,
} from 'lucide-react';

const SENSOR_CONFIG = {
  temperature: {
    label: 'TEMPERATURE',
    icon: Thermometer,
    unit: '°C',
    size: 'primary',
    decimalPlaces: 1,
    statusThresholds: { warning: 35, critical: 40 },
    description: 'Ambient air temperature',
  },
  humidity: {
    label: 'HUMIDITY',
    icon: Droplets,
    unit: '%',
    size: 'primary',
    decimalPlaces: 0,
    statusThresholds: { warning: 80, critical: 90 },
    description: 'Relative humidity',
  },
  wind_speed: {
    label: 'WIND SPEED',
    icon: Wind,
    unit: 'm/s',
    size: 'primary',
    decimalPlaces: 1,
    statusThresholds: { warning: 15, critical: 25 },
    description: 'Anemometer',
  },
  rain_intensity: {
    label: 'RAIN',
    icon: CloudRain,
    unit: 'mm/hr',
    size: 'primary',
    decimalPlaces: 1,
    isRain: true,
    description: 'FC-37 precipitation sensor',
  },
  pressure: {
    label: 'PRESSURE',
    icon: Gauge,
    unit: 'hPa',
    size: 'secondary',
    decimalPlaces: 0,
    statusThresholds: { warning_min: 980, critical_min: 950 },
    description: 'Barometric pressure',
  },
  light_lux: {
    label: 'LIGHT',
    icon: Sun,
    unit: 'lux',
    size: 'secondary',
    decimalPlaces: 0,
    description: 'BH1750 luminosity',
  },
  gas_aqi: {
    label: 'AQI PROXY',
    icon: FlaskConical,
    unit: '',
    size: 'secondary',
    decimalPlaces: 0,
    isAqi: true,
    statusThresholds: { warning: 200, critical: 300 },
    description: 'MQ135-derived air quality',
  },
  heat_index: {
    label: 'HEAT INDEX',
    icon: Flame,
    unit: '°C',
    size: 'secondary',
    decimalPlaces: 1,
    isDerived: true,
    statusThresholds: { warning: 32.2, critical: 41.0 },
    description: 'Calculated from temp & humidity',
  },
};

function getStatus(config, value) {
  if (value === null || value === undefined) return 'unavailable';
  const t = config.statusThresholds;
  if (!t) return 'normal';
  if (t.critical !== undefined && value >= t.critical) return 'critical';
  if (t.warning !== undefined && value >= t.warning) return 'warning';
  if (t.critical_min !== undefined && value <= t.critical_min) return 'critical';
  if (t.warning_min !== undefined && value <= t.warning_min) return 'warning';
  return 'normal';
}

const STATUS_STYLES = {
  normal: { text: 'text-[#22C55E]', bg: 'bg-[#22C55E14]', label: 'NORMAL' },
  warning: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B14]', label: 'WARNING' },
  critical: { text: 'text-[#EF4444]', bg: 'bg-[#EF444414]', label: 'CRITICAL' },
  unavailable: { text: 'text-[#64748B]', bg: 'bg-[#64748B14]', label: 'UNAVAILABLE' },
};

const BORDER_STATUS = {
  normal: 'border-[#26303B]',
  warning: 'border-[#F59E0B33]',
  critical: 'border-[#EF444433]',
  unavailable: 'border-[#26303B]',
};

function PrimaryCard({ config, value, updated }) {
  const Icon = config.icon;
  const status = getStatus(config, value);
  const styles = STATUS_STYLES[status];
  const borderCls = BORDER_STATUS[status];
  const [flash, setFlash] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current && value !== null) {
      setFlash(true);
      prevVal.current = value;
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [value]);

  // Rain special display
  let displayValue, displayUnit;
  if (config.isRain) {
    displayValue = value === null || value === undefined ? null : value;
    displayUnit = '';
  } else {
    displayValue = value !== null && value !== undefined
      ? Number(value).toFixed(config.decimalPlaces)
      : null;
    displayUnit = config.unit;
  }

  return (
    <div
      className={`panel-card p-4 border ${borderCls} ${flash ? 'animate-pulse-subtle' : ''} transition-all duration-200 hover:bg-[#1A212B] cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">{config.label}</p>
          {config.isDerived && (
            <p className="text-[9px] text-[#3A4654] mt-0.5">DERIVED METRIC</p>
          )}
          {config.isAqi && (
            <p className="text-[9px] text-[#3A4654] mt-0.5">MQ135 · NOT OFFICIAL AQI</p>
          )}
        </div>
        <div className="w-7 h-7 rounded-md bg-[#11161D] border border-[#26303B] flex items-center justify-center">
          <Icon size={13} className="text-[#64748B]" strokeWidth={1.8} />
        </div>
      </div>

      {/* Value */}
      {config.isRain ? (
        <div className="mb-3">
          {displayValue === null ? (
            <p className="text-xl font-semibold text-[#64748B]">UNAVAILABLE</p>
          ) : displayValue === 0 ? (
            <p className="text-xl font-semibold text-[#22C55E]">NO RAIN</p>
          ) : (
            <div>
              <p className="text-xl font-semibold text-[#38BDF8]">RAIN DETECTED</p>
              <p className="text-sm text-[#94A3B8] mt-0.5">{Number(displayValue).toFixed(1)} mm/hr</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3">
          {displayValue === null ? (
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="text-[#64748B]" />
              <p className="text-lg font-semibold text-[#64748B]">UNAVAILABLE</p>
            </div>
          ) : (
            <p className="text-3xl font-semibold text-[#F1F5F9] leading-none tabular-nums">
              {displayValue}
              <span className="text-base font-normal text-[#64748B] ml-1">{displayUnit}</span>
            </p>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        {!config.isRain && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${styles.bg} ${styles.text} tracking-wider`}>
            {styles.label}
          </span>
        )}
        {flash && (
          <span className="text-[9px] text-[#38BDF8] tracking-wider">● UPDATED</span>
        )}
      </div>
    </div>
  );
}

function SecondaryCard({ config, value }) {
  const Icon = config.icon;
  const status = getStatus(config, value);
  const styles = STATUS_STYLES[status];

  let displayValue;
  if (value === null || value === undefined) {
    displayValue = null;
  } else {
    displayValue = Number(value).toFixed(config.decimalPlaces);
  }

  return (
    <div className="panel-card px-4 py-3 border border-[#26303B] hover:bg-[#1A212B] transition-colors duration-150 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-[#11161D] border border-[#26303B] flex items-center justify-center flex-shrink-0">
          <Icon size={11} className="text-[#64748B]" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">{config.label}</p>
          {config.isAqi && (
            <p className="text-[9px] text-[#3A4654]">MQ135 proxy</p>
          )}
          {config.isDerived && (
            <p className="text-[9px] text-[#3A4654]">Derived</p>
          )}
        </div>
      </div>
      <div className="text-right">
        {displayValue === null ? (
          <span className="text-xs text-[#64748B] font-medium">UNAVAIL.</span>
        ) : (
          <p className="text-base font-semibold text-[#F1F5F9] tabular-nums">
            {displayValue}
            {config.unit && <span className="text-xs text-[#64748B] ml-1">{config.unit}</span>}
          </p>
        )}
        <span className={`text-[9px] font-semibold ${styles.text} tracking-wider`}>
          {styles.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Renders a sensor readout card.
 * @param {string} sensor - key from SENSOR_CONFIG
 * @param {number|null} value - current sensor value (null = unavailable)
 * @param {Date|null} updated - last update timestamp
 * @param {'primary'|'secondary'} variant - override size variant
 */
export default function SensorCard({ sensor, value, updated, variant }) {
  const config = SENSOR_CONFIG[sensor];
  if (!config) return null;

  const size = variant || config.size;

  // For heat_index, value may be nested in derived
  return size === 'primary'
    ? <PrimaryCard config={config} value={value} updated={updated} />
    : <SecondaryCard config={config} value={value} />;
}

export { SENSOR_CONFIG };
