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
  gas_aqi: { label: 'Air Quality (MQ135)', unit: 'AQI', description: 'Hazardous gas & smoke limit' },
  wind_speed: { label: 'Wind Velocity', unit: 'km/h', description: 'Anemometer gale threshold' },
  rain_intensity: { label: 'Rain Intensity', unit: 'mm/h', description: 'FC-37 precipitation alert trigger' },
};

function ThresholdRow({ threshold, onChange, onSave, status, isAdmin }) {
  const meta = PARAM_LABELS[threshold.parameter] || { label: threshold.parameter, unit: '', description: '' };

  return (
    <div className="p-5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Metric Name */}
        <div className="lg:w-64 flex-shrink-0">
          <h4 className="text-sm font-semibold text-white">{meta.label}</h4>
          <p className="text-xs text-[#64748B] mt-0.5">{meta.description}</p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { field: 'critical_min', label: 'Critical Low', color: 'text-[#F87171]' },
            { field: 'warning_min', label: 'Warning Low', color: 'text-[#FBBF24]' },
            { field: 'warning_max', label: 'Warning High', color: 'text-[#FBBF24]' },
            { field: 'critical_max', label: 'Critical High', color: 'text-[#F87171]' },
          ].map(({ field, label, color }) => (
            <div key={field} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${color}`}>
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
                      ? 'bg-white/[0.03] border-white/[0.08] text-white focus:outline-none focus:border-[#60A5FA]'
                      : 'bg-transparent border-transparent text-[#94A3B8] cursor-not-allowed'
                  }`}
                />
                <span className="text-[10px] text-[#64748B] font-mono">{meta.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button (Admin) */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onSave(threshold.parameter)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-[#60A5FA]/20 border border-white/[0.08] hover:border-[#60A5FA]/40 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            {status === 'saved' && (
              <span className="text-xs text-[#34D399] font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> Saved
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
      <div className="p-6 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">System & Threshold Configuration</h2>
            <p className="text-xs text-[#64748B]">Automated incident trigger setpoints, sensor limits, and access controls</p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/25 text-xs text-[#60A5FA] font-semibold">
              <ShieldCheck size={14} />
              <span>Admin Write Authorization</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#94A3B8]">
              <Lock size={14} />
              <span>Operator View (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Rules Table */}
      <div className="rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#60A5FA]" />
            <h3 className="text-sm font-semibold text-white">Environmental Safety Setpoints</h3>
          </div>
          <span className="text-xs text-[#64748B]">Updated in real-time across edge devices</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
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
        <div className="rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-2">
            <Users size={16} className="text-[#60A5FA]" />
            <h3 className="text-sm font-semibold text-white">Authorized Operators & Admins ({userList.length})</h3>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {userList.map((u) => (
              <div key={u._id} className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center font-bold text-white">
                    {u.username ? u.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{u.username}</p>
                    <p className="text-xs text-[#64748B]">{u.email || 'No email specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30'
                        : 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
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
