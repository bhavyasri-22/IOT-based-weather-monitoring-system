import React, { useState, useEffect, useCallback } from 'react';
import { configApi } from '../api/client';
import { Settings, Save, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

const PARAM_LABELS = {
  temperature: { label: 'Temperature', unit: '°C', description: 'Ambient air temperature' },
  humidity: { label: 'Humidity', unit: '%', description: 'Relative humidity' },
  pressure: { label: 'Pressure', unit: 'hPa', description: 'Barometric pressure' },
  heat_index: { label: 'Heat Index', unit: '°C', description: 'Derived comfort index (NWS scale)' },
  gas_aqi: { label: 'AQI Proxy (MQ135)', unit: 'AQI*', description: 'MQ135-derived air quality indicator — NOT official AQI' },
  wind_speed: { label: 'Wind Speed', unit: 'm/s', description: 'Anemometer wind speed' },
  rain_intensity: { label: 'Rain Intensity', unit: 'mm/hr', description: 'FC-37 precipitation rate' },
};

function ThresholdRow({ threshold, onChange, onSave, status }) {
  const meta = PARAM_LABELS[threshold.parameter] || { label: threshold.parameter, unit: '', description: '' };

  return (
    <div className="px-5 py-4 border-b border-[#1A212B] last:border-0">
      <div className="flex items-start gap-4">
        {/* Labels */}
        <div className="w-52 flex-shrink-0">
          <p className="text-sm font-semibold text-[#F1F5F9]">{meta.label}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">{meta.description}</p>
          {threshold.parameter === 'gas_aqi' && (
            <p className="text-[9px] text-[#F59E0B] mt-1">⚠ Proxy indicator only</p>
          )}
        </div>

        {/* Threshold inputs */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          {[
            { field: 'critical_min', label: 'Critical Low' },
            { field: 'warning_min', label: 'Warning Low' },
            { field: 'warning_max', label: 'Warning High' },
            { field: 'critical_max', label: 'Critical High' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase block mb-1">
                {label}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  value={threshold[field] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    onChange(threshold.parameter, field, val);
                  }}
                  className="w-full px-2.5 py-1.5 text-sm text-[#F1F5F9] bg-[#11161D] border border-[#26303B] rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors font-mono"
                />
                <span className="text-[10px] text-[#64748B] whitespace-nowrap">{meta.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-4">
          <button
            onClick={() => onSave(threshold.parameter)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1A212B] border border-[#2D3947] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#38BDF8] rounded-lg transition-all"
          >
            <Save size={11} />
            Save
          </button>
          {status === 'saved' && (
            <div className="flex items-center gap-1">
              <CheckCircle size={12} className="text-[#22C55E]" />
              <span className="text-[10px] text-[#22C55E]">Saved</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-[#EF4444]" />
              <span className="text-[10px] text-[#EF4444]">Error</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminConfig() {
  const [thresholds, setThresholds] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configApi.thresholds();
      const list = data?.data || data || [];
      setThresholds(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleChange = (parameter, field, value) => {
    setThresholds((prev) =>
      prev.map((t) => t.parameter === parameter ? { ...t, [field]: value } : t)
    );
  };

  const handleSave = async (parameter) => {
    const threshold = thresholds.find((t) => t.parameter === parameter);
    if (!threshold) return;
    setSaveStatus((s) => ({ ...s, [parameter]: 'saving' }));
    try {
      await configApi.updateThreshold(parameter, {
        warning_min: threshold.warning_min,
        warning_max: threshold.warning_max,
        critical_min: threshold.critical_min,
        critical_max: threshold.critical_max,
      });
      setSaveStatus((s) => ({ ...s, [parameter]: 'saved' }));
      setTimeout(() => setSaveStatus((s) => ({ ...s, [parameter]: null })), 3000);
    } catch {
      setSaveStatus((s) => ({ ...s, [parameter]: 'error' }));
      setTimeout(() => setSaveStatus((s) => ({ ...s, [parameter]: null })), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header note */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#0D1117] border border-[#26303B]">
        <AlertTriangle size={14} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-[#94A3B8]">
            Threshold changes take effect immediately for new telemetry readings.{' '}
            <span className="text-[#F59E0B]">AQI Proxy values are MQ135-derived and are not official EPA air quality measurements.</span>
          </p>
        </div>
      </div>

      {/* Thresholds panel */}
      <div className="panel-card border border-[#26303B] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#26303B]">
          <Settings size={14} className="text-[#64748B]" />
          <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Alert Thresholds</p>
        </div>

        {/* Column header */}
        <div className="flex items-center px-5 py-2 border-b border-[#1A212B] bg-[#0D1117]">
          <div className="w-52 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-4 gap-3">
            {['Critical Low', 'Warning Low', 'Warning High', 'Critical High'].map((h) => (
              <p key={h} className="text-[9px] font-semibold tracking-widest text-[#3A4654] uppercase">{h}</p>
            ))}
          </div>
          <div className="w-20 flex-shrink-0" />
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-xs text-[#64748B]">Loading configuration...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-xs text-[#EF4444]">{error}</p>
          </div>
        ) : (
          thresholds.map((threshold) => (
            <ThresholdRow
              key={threshold.parameter}
              threshold={threshold}
              onChange={handleChange}
              onSave={handleSave}
              status={saveStatus[threshold.parameter]}
            />
          ))
        )}
      </div>
    </div>
  );
}
