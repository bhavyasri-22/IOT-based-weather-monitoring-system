import React, { useState, useEffect, useCallback } from 'react';
import { devicesApi } from '../api/client';
import { Cpu, Wifi, CheckCircle, XCircle, Clock, RefreshCw, Plus, Trash2, Key, ShieldCheck, AlertTriangle } from 'lucide-react';

const SENSOR_HARDWARE = [
  'BME280 (Temperature)',
  'BME280 (Pressure)',
  'BME280 (Humidity)',
  'BH1750 (Light)',
  'FC-37 (Rain)',
  'MQ135 (AQI Proxy)',
  'Anemometer (Wind)',
];

function formatLastSeen(ts) {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function DeviceCard({ device, isAdmin, onDelete, onUpdateKey }) {
  const isOnline = device.status === 'online';
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newKey, setNewKey] = useState('');

  const handleKeySave = () => {
    if (!newKey.trim()) return;
    onUpdateKey(device.device_id, newKey.trim());
    setShowKeyInput(false);
    setNewKey('');
  };

  return (
    <div className={`panel-card border p-5 ${isOnline ? 'border-[#26303B]' : 'border-[#EF444422]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#11161D] border border-[#26303B] flex items-center justify-center">
            <Cpu size={16} className="text-[#38BDF8]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9] font-mono">{device.device_id}</p>
            <p className="text-[10px] text-[#64748B]">
              {device.location || 'Station Node'} · FW v{device.firmware_version || '1.0.0'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#11161D] border border-[#26303B]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
            style={isOnline ? { boxShadow: '0 0 5px #22C55E99' } : {}}
          />
          <span className={`text-[11px] font-semibold tracking-wider ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Device info grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">Last Seen</p>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-[#64748B]" />
            <p className="text-xs text-[#94A3B8]">{formatLastSeen(device.last_seen)}</p>
          </div>
        </div>
        <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">Protocol</p>
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className={isOnline ? 'text-[#22C55E]' : 'text-[#64748B]'} />
            <p className="text-xs text-[#94A3B8]">MQTT / WebSocket</p>
          </div>
        </div>
      </div>

      {/* Sensor list */}
      <div className="mb-4">
        <p className="text-[9px] font-semibold tracking-widest text-[#3A4654] uppercase mb-2.5">SENSOR HARDWARE</p>
        <div className="flex flex-col gap-1.5">
          {SENSOR_HARDWARE.map((sensor) => (
            <div key={sensor} className="flex items-center justify-between">
              <span className="text-[11px] text-[#94A3B8]">{sensor}</span>
              {isOnline ? (
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-[#22C55E]" />
                  <span className="text-[10px] text-[#22C55E] font-medium">HEALTHY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle size={10} className="text-[#64748B]" />
                  <span className="text-[10px] text-[#64748B] font-medium">UNKNOWN</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Actions: Rotate Key & Delete Node */}
      {isAdmin && (
        <div className="border-t border-[#1A212B] pt-3 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showKeyInput ? (
              <button
                onClick={() => setShowKeyInput(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#94A3B8] hover:text-[#38BDF8] bg-[#11161D] border border-[#26303B] rounded-md transition-colors"
              >
                <Key size={11} />
                <span>API Key</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="New API Key..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="px-2 py-1 text-[11px] bg-[#0B0F14] border border-[#38BDF8] rounded text-[#F1F5F9] focus:outline-none"
                />
                <button
                  onClick={handleKeySave}
                  className="px-2 py-1 text-[11px] bg-[#1A212B] text-[#38BDF8] border border-[#38BDF8] rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="px-1.5 py-1 text-[11px] text-[#64748B]"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onDelete(device.device_id)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF444444] bg-[#11161D] border border-[#26303B] rounded-md transition-colors"
            title="Decommission hardware node"
          >
            <Trash2 size={11} />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function DevicesPage({ user }) {
  const isAdmin = user?.role === 'admin';
  const [nodes, setNodes] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [addError, setAddError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, healthData] = await Promise.all([
        devicesApi.list(),
        devicesApi.health(),
      ]);
      const nodeList = statusData?.data || statusData || [];
      setNodes(Array.isArray(nodeList) ? nodeList : []);
      setHealth(healthData?.data || healthData);
    } catch {
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceId.trim()) return;
    setAddError('');
    try {
      await devicesApi.create({
        device_id: newDeviceId.trim(),
        location: newLocation.trim() || 'Outdoor Station',
      });
      setShowAddModal(false);
      setNewDeviceId('');
      setNewLocation('');
      fetch();
    } catch (err) {
      setAddError(err.message || 'Failed to add device');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm(`Are you sure you want to decommission device '${deviceId}'?`)) return;
    try {
      await devicesApi.delete(deviceId);
      fetch();
    } catch {}
  };

  const handleUpdateKey = async (deviceId, apiKey) => {
    try {
      await devicesApi.updateKey(deviceId, apiKey);
      alert(`API Key updated for ${deviceId}`);
    } catch (err) {
      alert(`Failed to update key: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      {health && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'TOTAL DEVICES', value: health.total_devices || nodes.length, color: 'text-[#F1F5F9]' },
            { label: 'ONLINE', value: health.online_devices || nodes.filter((n) => n.status === 'online').length, color: 'text-[#22C55E]' },
            { label: 'OFFLINE', value: health.offline_devices || nodes.filter((n) => n.status !== 'online').length, color: 'text-[#EF4444]' },
          ].map((s) => (
            <div key={s.label} className="panel-card border border-[#26303B] px-4 py-3">
              <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header with Admin actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Registered Nodes</p>
          {isAdmin && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E2A3A] text-[#38BDF8] border border-[#38BDF833] font-bold">
              ADMIN MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B0F14] bg-[#38BDF8] hover:bg-[#0284C7] rounded-lg transition-colors"
            >
              <Plus size={13} />
              <span>Add Node</span>
            </button>
          )}

          <button
            onClick={fetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] bg-[#151B23] border border-[#26303B] rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md panel-card border border-[#26303B] p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A212B] pb-3">
              <p className="text-sm font-semibold text-[#F1F5F9]">Register Hardware Device Node</p>
              <button onClick={() => setShowAddModal(false)} className="text-[#64748B] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">
                  Device ID (e.g. ESP32-NODE-02)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ESP32-NODE-02"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#11161D] border border-[#26303B] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">
                  Location / Label
                </label>
                <input
                  type="text"
                  placeholder="Roof Station / Greenhouse"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#11161D] border border-[#26303B] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {addError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#1F0F0F] border border-[#EF444433] text-xs text-[#EF4444]">
                  <AlertTriangle size={12} />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#94A3B8] bg-[#151B23] border border-[#26303B] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-[#0B0F14] bg-[#38BDF8] rounded-lg hover:bg-[#0284C7]"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="panel-card border border-[#26303B] p-5">
              <div className="space-y-3">
                <div className="h-5 bg-[#1A212B] rounded animate-pulse w-1/3" />
                <div className="h-3 bg-[#1A212B] rounded animate-pulse w-1/2" />
                <div className="h-16 bg-[#1A212B] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <div className="panel-card border border-[#26303B] py-16 text-center">
          <Cpu size={28} className="text-[#26303B] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No devices registered</p>
          <p className="text-[10px] text-[#3A4654] mt-1">Devices will appear here once registered or connected</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {nodes.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              isAdmin={isAdmin}
              onDelete={handleDeleteDevice}
              onUpdateKey={handleUpdateKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
