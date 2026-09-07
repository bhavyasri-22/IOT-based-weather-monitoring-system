import React, { useEffect, useRef, useState } from 'react';
import {
  Thermometer, Droplets, Gauge, Sun, CloudRain, Wind,
  FlaskConical, Flame, AlertTriangle, WifiOff, CheckCircle2,
  Clock, ShieldAlert,
} from 'lucide-react';

const SENSOR_CONFIG = {
  temperature: {
    label: 'TEMPERATURE',
    icon: Thermometer,
    unit: '°C',
    size: 'primary',
    decimalPlaces: 1,
    statusThresholds: {
      warning_min: 5,
      warning_max: 35,
      critical_min: 0,
      critical_max: 40,
    },
    description: 'Ambient air temperature',
  },
  humidity: {
    label: 'HUMIDITY',
    icon: Droplets,
    unit: '%',
    size: 'primary',
    decimalPlaces: 0,
    statusThresholds: {
      warning_min: 20,
      warning_max: 80,
      critical_min: 10,
      critical_max: 90,
    },
    description: 'Relative humidity',
  },
  wind_speed: {
    label: 'WIND SPEED',
    icon: Wind,
    unit: 'm/s',
    size: 'primary',
    decimalPlaces: 1,
    statusThresholds: {
      warning_max: 15,
      critical_max: 25,
    },
    description: 'Anemometer',
  },
  rain_intensity: {
    label: 'RAIN INTENSITY',
    icon: CloudRain,
    unit: 'mm/h',
    size: 'primary',
    decimalPlaces: 1,
    isRain: true,
    statusThresholds: {
      warning_max: 25,
      critical_max: 50,
    },
    description: 'FC-37 precipitation sensor',
  },
  pressure: {
    label: 'PRESSURE',
    icon: Gauge,
    unit: 'hPa',
    size: 'secondary',
    decimalPlaces: 0,
    statusThresholds: {
      warning_min: 980,
      critical_min: 950,
    },
    description: 'Barometric pressure',
  },
  light_lux: {
    label: 'LIGHT LEVEL',
    icon: Sun,
    unit: 'lux',
    size: 'secondary',
    decimalPlaces: 0,
    statusThresholds: {
      warning_min: 50,
      critical_min: 10,
    },
    description: 'BH1750 luminosity',
  },
  gas_aqi: {
    label: 'AQI PROXY',
    icon: FlaskConical,
    unit: '',
    size: 'secondary',
    decimalPlaces: 0,
    isAqi: true,
    statusThresholds: {
      warning_max: 200,
      critical_max: 300,
    },
    description: 'MQ135 air quality proxy',
  },
  heat_index: {
    label: 'HEAT INDEX',
    icon: Flame,
    unit: '°C',
    size: 'secondary',
    decimalPlaces: 1,
    isDerived: true,
    statusThresholds: {
      warning_max: 32.2,
      critical_max: 41.0,
    },
    description: 'Calculated from temp & humidity',
  },
};

/**
 * Determines exact status by cross-checking active alerts and threshold limits
 */
function getStatus(config, value, activeAlert = null) {
  if (value === null || value === undefined) return { state: 'unavailable', label: 'SENSOR FAULT', reason: 'No data' };

  // Priority 1: Check if an active alert is currently triggered for this parameter
  if (activeAlert) {
    const sev = activeAlert.severity === 'critical' ? 'critical' : 'warning';
    return {
      state: sev,
      label: sev === 'critical' ? 'CRITICAL ALERT' : 'WARNING ALERT',
      reason: activeAlert.message || 'Threshold breached',
    };
  }

  // Priority 2: Numerical evaluation against threshold boundaries
  const t = config.statusThresholds;
  if (!t) return { state: 'normal', label: 'NORMAL', reason: 'Within range' };

  const numVal = Number(value);
  if (isNaN(numVal)) return { state: 'unavailable', label: 'UNAVAILABLE', reason: 'Invalid reading' };

  if (t.critical_max !== undefined && numVal >= t.critical_max) {
    return { state: 'critical', label: 'CRITICAL: HIGH', reason: `≥ ${t.critical_max}${config.unit || ''}` };
  }
  if (t.critical_min !== undefined && numVal <= t.critical_min) {
    return { state: 'critical', label: 'CRITICAL: LOW', reason: `≤ ${t.critical_min}${config.unit || ''}` };
  }
  if (t.warning_max !== undefined && numVal >= t.warning_max) {
    return { state: 'warning', label: 'WARNING: HIGH', reason: `≥ ${t.warning_max}${config.unit || ''}` };
  }
  if (t.warning_min !== undefined && numVal <= t.warning_min) {
    return { state: 'warning', label: 'WARNING: LOW', reason: `≤ ${t.warning_min}${config.unit || ''}` };
  }

  return { state: 'normal', label: 'NORMAL', reason: 'Optimal range' };
}

const STATUS_STYLES = {
  normal: { text: 'text-[#22C55E]', bg: 'bg-[#22C55E14]', border: 'border-[#22C55E33]', badge: 'bg-[#22C55E20] text-[#22C55E]' },
  warning: { text: 'text-[#F59E0B]', bg: 'bg-[#1A1200]', border: 'border-[#F59E0B66] animate-pulse-warning', badge: 'bg-[#F59E0B28] text-[#F59E0B]' },
  critical: { text: 'text-[#EF4444]', bg: 'bg-[#1F0F0F]', border: 'border-[#EF444488] animate-pulse-critical', badge: 'bg-[#EF444428] text-[#EF4444]' },
  unavailable: { text: 'text-[#94A3B8]', bg: 'bg-[#151B23]', border: 'border-[#26303B]', badge: 'bg-[#26303B] text-[#94A3B8]' },
};

function formatTimestamp(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const relative = diffSec < 5 ? 'Just now' : diffSec < 60 ? `${diffSec}s ago` : `${Math.floor(diffSec / 60)}m ago`;
  return { time, relative };
}

function PrimaryCard({ config, value, updated, activeAlert }) {
  const Icon = config.icon;
  const status = getStatus(config, value, activeAlert);
  const styles = STATUS_STYLES[status.state] || STATUS_STYLES.normal;
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

  const timeInfo = formatTimestamp(updated);

  // Rain special display
  let displayValue, displayUnit;
  if (config.isRain) {
    displayValue = value === null || value === undefined ? null : Number(value);
    displayUnit = config.unit;
  } else {
    displayValue = value !== null && value !== undefined && !isNaN(Number(value))
      ? Number(value).toFixed(config.decimalPlaces)
      : null;
    displayUnit = config.unit;
  }

  return (
    <div
      className={`panel-card p-4.5 border ${styles.border} ${flash ? 'animate-pulse-subtle' : ''} transition-all duration-200 relative group overflow-hidden`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">{config.label}</p>
          {config.isDerived && (
            <p className="text-[9px] text-[#38BDF8] font-medium mt-0.5">DERIVED METRIC</p>
          )}
          {config.isAqi && (
            <p className="text-[9px] text-[#F59E0B] font-medium mt-0.5">MQ135 · NOT EPA AQI</p>
          )}
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#11161D] border border-[#26303B] flex items-center justify-center">
          <Icon size={15} className={styles.text} strokeWidth={2} />
        </div>
      </div>

      {/* Main Value Display */}
      {config.isRain ? (
        <div className="mb-3">
          {displayValue === null ? (
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="text-[#64748B]" />
              <p className="text-xl font-semibold text-[#64748B]">UNAVAILABLE</p>
            </div>
          ) : displayValue === 0 ? (
            <div>
              <p className="text-2xl font-bold text-[#22C55E]">NO RAIN</p>
              <p className="text-xs text-[#64748B] mt-0.5">0.0 mm/hr · Clear</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-[#38BDF8]">RAIN DETECTED</p>
              <p className="text-sm font-semibold text-[#F1F5F9] mt-0.5">{displayValue.toFixed(1)} mm/hr</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3">
          {displayValue === null ? (
            <div className="flex items-center gap-2 py-1">
              <WifiOff size={18} className="text-[#64748B]" />
              <p className="text-lg font-bold text-[#64748B]">SENSOR FAULT</p>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#F1F5F9] leading-none tracking-tight tabular-nums">
                {displayValue}
              </span>
              <span className="text-base font-semibold text-[#64748B]">{displayUnit}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Dynamic Status Badge & Timestamp */}
      <div className="flex items-center justify-between pt-2 border-t border-[#26303B]/60 text-xs">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${styles.badge} tracking-wider uppercase border border-current/20`}>
          {status.label}
        </span>

        {timeInfo && (
          <div className="flex items-center gap-1 text-[10px] text-[#64748B] font-mono" title={`Received at ${timeInfo.time}`}>
            <Clock size={10} />
            <span>{timeInfo.time}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SecondaryCard({ config, value, updated, activeAlert }) {
  const Icon = config.icon;
  const status = getStatus(config, value, activeAlert);
  const styles = STATUS_STYLES[status.state] || STATUS_STYLES.normal;
  const timeInfo = formatTimestamp(updated);

  let displayValue;
  if (value === null || value === undefined || isNaN(Number(value))) {
    displayValue = null;
  } else {
    displayValue = Number(value).toFixed(config.decimalPlaces);
  }

  return (
    <div className={`panel-card px-4 py-3 border ${styles.border} transition-all duration-150 flex items-center justify-between shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#11161D] border border-[#26303B] flex items-center justify-center flex-shrink-0">
          <Icon size={13} className={styles.text} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">{config.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${styles.badge} tracking-wider uppercase`}>
              {status.label}
            </span>
            {timeInfo && (
              <span className="text-[9px] text-[#64748B] font-mono">
                {timeInfo.time}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {displayValue === null ? (
          <span className="text-xs text-[#64748B] font-bold">FAULT</span>
        ) : (
          <p className="text-lg font-bold text-[#F1F5F9] tabular-nums leading-tight">
            {displayValue}
            {config.unit && <span className="text-xs font-normal text-[#64748B] ml-1">{config.unit}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Renders an enhanced sensor readout card with threshold evaluation & timestamps.
 */
export default function SensorCard({ sensor, value, updated, variant, activeAlerts = [] }) {
  const config = SENSOR_CONFIG[sensor];
  if (!config) return null;

  // Find if there is an active alert for this specific sensor parameter
  const activeAlert = Array.isArray(activeAlerts)
    ? activeAlerts.find((a) => a.parameter === sensor && a.status === 'active')
    : null;

  const size = variant || config.size;

  return size === 'primary'
    ? <PrimaryCard config={config} value={value} updated={updated} activeAlert={activeAlert} />
    : <SecondaryCard config={config} value={value} updated={updated} activeAlert={activeAlert} />;
}

export { SENSOR_CONFIG };
