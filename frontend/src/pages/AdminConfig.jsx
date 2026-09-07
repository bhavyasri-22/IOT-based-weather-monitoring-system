import React, { useState, useEffect, useCallback } from 'react';
import { configApi, authApi } from '../api/client';
import { Settings, Save, ShieldCheck, Lock, Users, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

const PARAM_LABELS = {
  temperature: { label: 'Temperature', unit: '°C', description: 'Ambient air temperature' },
  humidity: { label: 'Humidity', unit: '%', description: 'Relative humidity' },
  pressure: { label: 'Pressure', unit: 'hPa', description: 'Barometric pressure' },
  heat_index: { label: 'Heat Index', unit: '°C', description: 'Derived comfort index (NWS scale)' },
  gas_aqi: { label: 'AQI Proxy (MQ135)', unit: 'AQI*', description: 'MQ135-derived air quality indicator — NOT official AQI' },
  wind_speed: { label: 'Wind Speed', unit: 'm/s', description: 'Anemometer wind speed' },
  rain_intensity: { label: 'Rain Intensity', unit: 'mm/hr', description: 'FC-37 precipitation rate' },
};

function ThresholdRow({ threshold, onChange, onSave, status, isAdmin }) {
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
                  disabled={!isAdmin}
                  value={threshold[field] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    onChange(threshold.parameter, field, val);
                  }}
                  className={`w-full px-2.5 py-1.5 text-sm font-mono border rounded-lg transition-colors ${
                    isAdmin
                      ? 'text-[#F1F5F9] bg-[#11161D] border-[#26303B] focus:outline-none focus:border-[#38BDF8]'
                      : 'text-[#94A3B8] bg-[#0E1318] border-[#1E2630] cursor-not-allowed opacity-80'
                  }`}
                />
                <span className="text-[10px] text-[#64748B] whitespace-nowrap">{meta.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Save button (Admin only) */}
        {isAdmin && (
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
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetch(); }, [fetch]);

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
    <div className="space-y-6">
      {/* Role Notice Banner */}
      {!isAdmin ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#141C24] border border-[#253240]">
          <Lock size={15} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#F1F5F9]">OPERATOR VIEW — Read-Only Mode</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              You are signed in as an <strong>Operator</strong>. You can inspect operational limits, but modifying threshold setpoints requires an <strong>Administrator</strong> account.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#0E2A3A22] border border-[#38BDF844]">
          <ShieldCheck size={15} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#38BDF8]">ADMINISTRATIVE CONTROL ACCESS</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              You have full write authorization to modify weather thresholds and manage system parameters. Changes take effect on the next sensor packet.
            </p>
          </div>
        </div>
      )}

      {/* Thresholds panel */}
      <div className="panel-card border border-[#26303B] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#26303B]">
          <div className="flex items-center gap-2.5">
            <Settings size={14} className="text-[#64748B]" />
            <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
              {isAdmin ? 'Threshold Rules & Setpoints' : 'Active Operational Thresholds'}
            </p>
          </div>
          {!isAdmin && (
            <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-mono">
              <Lock size={11} /> Read-Only
            </span>
          )}
        </div>

        {/* Column header */}
        <div className="flex items-center px-5 py-2 border-b border-[#1A212B] bg-[#0D1117]">
          <div className="w-52 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-4 gap-3">
            {['Critical Low', 'Warning Low', 'Warning High', 'Critical High'].map((h) => (
              <p key={h} className="text-[9px] font-semibold tracking-widest text-[#3A4654] uppercase">{h}</p>
            ))}
          </div>
          {isAdmin && <div className="w-20 flex-shrink-0" />}
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
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Admin-Only: User Management Directory */}
      {isAdmin && userList.length > 0 && (
        <div className="panel-card border border-[#26303B] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#26303B]">
            <Users size={14} className="text-[#38BDF8]" />
            <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
              Registered Operator & Admin Accounts ({userList.length})
            </p>
          </div>

          <div className="divide-y divide-[#1A212B]">
            {userList.map((u) => (
              <div key={u._id} className="px-5 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1A212B] border border-[#26303B] flex items-center justify-center font-bold text-[#94A3B8]">
                    {u.username ? u.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#F1F5F9]">{u.username}</p>
                    <p className="text-[10px] text-[#64748B]">{u.email || 'No email specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-[#0E2A3A] text-[#38BDF8] border border-[#38BDF844]'
                        : 'bg-[#0F2B1D] text-[#22C55E] border border-[#22C55E44]'
                    }`}
                  >
                    {u.role || 'operator'}
                  </span>
                  <span className="text-[10px] text-[#475569] font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
