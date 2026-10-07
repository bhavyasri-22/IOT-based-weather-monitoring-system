import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { configApi, authApi } from '../api/client';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Lock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

const PARAM_LABELS = {
  temperature: { label: 'Temperature', unit: '°C', description: 'Ambient thermal bounds' },
  humidity: { label: 'Relative Humidity', unit: '%', description: 'Moisture saturation limits' },
  pressure: { label: 'Barometric Pressure', unit: 'hPa', description: 'Atmospheric pressure range' },
  heat_index: { label: 'Feels-Like Heat Index', unit: '°C', description: 'Derived biological comfort metric' },
  gas_aqi: { label: 'Air Quality (MQ135)', unit: 'Raw/AQI', description: 'Hazardous gas & smoke limit' },
  wind_speed: { label: 'Wind Velocity', unit: 'km/h', description: 'Anemometer gale threshold' },
  rain_intensity: { label: 'Rain Intensity', unit: 'mm/h', description: 'FC-37 precipitation alert trigger' },
};

function ThresholdRow({ threshold, onChange, onSave, status, isAdmin }) {
  const meta = PARAM_LABELS[threshold.parameter] || { label: threshold.parameter, unit: '', description: '' };

  return (
    <div className="p-5 border-b border-sky-100 last:border-0 hover:bg-sky-50/40 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Metric Name */}
        <div className="lg:w-64 flex-shrink-0">
          <h4 className="text-sm font-bold" style={{ color: '#0D3563' }}>{meta.label}</h4>
          <p className="text-xs mt-0.5" style={{ color: '#5096C8' }}>{meta.description}</p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { field: 'critical_min', label: 'Critical Low', color: 'text-red-600' },
            { field: 'warning_min', label: 'Warning Low', color: 'text-amber-600' },
            { field: 'warning_max', label: 'Warning High', color: 'text-amber-600' },
            { field: 'critical_max', label: 'Critical High', color: 'text-red-600' },
          ].map(({ field, label, color }) => (
            <div key={field} className="p-2.5 rounded-xl bg-white border border-sky-100 shadow-sm">
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${color}`}>
                {label}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  disabled={!isAdmin}
                  value={threshold[field] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    onChange(threshold.parameter, field, val);
                  }}
                  className={`w-full px-2 py-1 text-xs font-mono rounded-lg border transition-colors ${
                    isAdmin
                      ? 'bg-sky-50/50 border-sky-200 text-[#0D3563] focus:outline-none focus:border-[#1976D2]'
                      : 'bg-transparent border-transparent text-[#6499BC] cursor-not-allowed'
                  }`}
                />
                <span className="text-[10px] font-mono" style={{ color: '#5096C8' }}>{meta.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button (Admin) */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onSave(threshold.parameter)}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-[#1565C0] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
            {status === 'saved' && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
            {status === 'error' && (
              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle size={14} /> Failed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminConfig({ user }) {
  const isAdmin = user?.role === 'admin';
  const [thresholds, setThresholds] = useState([]);
  const [userList, setUserList] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configApi.thresholds();
      const list = data?.data || data || [];
      setThresholds(Array.isArray(list) ? list : []);

      if (isAdmin) {
        authApi.users().then((res) => {
          const uList = res?.data || res || [];
          setUserList(Array.isArray(uList) ? uList : []);
        }).catch(() => {});
      }
    } catch {
      // Default set of thresholds
      setThresholds([
        { parameter: 'temperature', warning_min: 10, warning_max: 35, critical_min: 0, critical_max: 42 },
        { parameter: 'humidity', warning_min: 30, warning_max: 80, critical_min: 15, critical_max: 95 },
        { parameter: 'pressure', warning_min: 990, warning_max: 1025, critical_min: 960, critical_max: 1040 },
        { parameter: 'wind_speed', warning_min: null, warning_max: 30, critical_min: null, critical_max: 50 },
        { parameter: 'gas_aqi', warning_min: null, warning_max: 100, critical_min: null, critical_max: 200 },
        { parameter: 'rain_intensity', warning_min: null, warning_max: 10, critical_min: null, critical_max: 25 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleChange = (parameter, field, value) => {
    setThresholds((prev) =>
      prev.map((t) => t.parameter === parameter ? { ...t, [field]: value } : t)
    );
  };

  const handleSave = async (parameter) => {
    if (!isAdmin) return;
    const threshold = thresholds.find((t) => t.parameter === parameter);
    if (!threshold) return;
    setSaveStatus((s) => ({ ...s, [parameter]: 'saving' }));
    try {
      await configApi.updateThreshold(parameter, threshold);
      setSaveStatus((s) => ({ ...s, [parameter]: 'saved' }));
      setTimeout(() => setSaveStatus((s) => ({ ...s, [parameter]: null })), 2500);
    } catch {
      setSaveStatus((s) => ({ ...s, [parameter]: 'error' }));
      setTimeout(() => setSaveStatus((s) => ({ ...s, [parameter]: null })), 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto"
    >
      {/* Top Banner */}
      <div
        className="p-6 rounded-3xl border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: 'rgba(144,202,249,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border"
            style={{
              background: 'rgba(25,118,210,0.1)',
              borderColor: 'rgba(25,118,210,0.2)',
              color: '#1976D2',
            }}
          >
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#0D3563' }}>
              System &amp; Threshold Configuration
            </h2>
            <p className="text-xs" style={{ color: '#5096C8' }}>
              Automated incident trigger setpoints, sensor limits, and access controls
            </p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold"
              style={{
                background: 'rgba(25,118,210,0.08)',
                borderColor: 'rgba(25,118,210,0.3)',
                color: '#1565C0',
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin Write Authorization Active</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold"
              style={{
                background: 'rgba(234,246,255,0.7)',
                borderColor: 'rgba(144,202,249,0.5)',
                color: '#5096C8',
              }}
            >
              <Lock size={16} />
              <span>Operator View (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Rules Table */}
      <div
        className="rounded-3xl border shadow-sm overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: 'rgba(144,202,249,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(144,202,249,0.35)' }}
        >
          <div className="flex items-center gap-2">
            <Sliders size={18} style={{ color: '#1976D2' }} />
            <h3 className="text-sm font-bold" style={{ color: '#0D3563' }}>
              Environmental Safety Setpoints
            </h3>
          </div>
          <span className="text-xs" style={{ color: '#5096C8' }}>
            Synchronized with alert evaluation engine
          </span>
        </div>

        <div className="divide-y divide-sky-100">
          {thresholds.map((threshold) => (
            <ThresholdRow
              key={threshold.parameter}
              threshold={threshold}
              onChange={handleChange}
              onSave={handleSave}
              status={saveStatus[threshold.parameter]}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* Admin User Management Directory */}
      {isAdmin && userList.length > 0 && (
        <div
          className="rounded-3xl border shadow-sm overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(144,202,249,0.6)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="p-5 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(144,202,249,0.35)' }}
          >
            <Users size={18} style={{ color: '#1976D2' }} />
            <h3 className="text-sm font-bold" style={{ color: '#0D3563' }}>
              Registered Operators &amp; Administrators ({userList.length})
            </h3>
          </div>

          <div className="divide-y divide-sky-100">
            {userList.map((u) => (
              <div key={u._id} className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-sky-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: 'rgba(25,118,210,0.12)', color: '#1565C0' }}
                  >
                    {u.username ? u.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0D3563' }}>{u.username}</p>
                    <p className="text-xs" style={{ color: '#5096C8' }}>{u.email || 'No email specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      u.role === 'admin'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {u.role || 'operator'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
