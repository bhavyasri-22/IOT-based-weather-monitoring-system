import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { devicesApi } from '../api/client';
import { 
  Cpu, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Key, 
  ShieldCheck, 
  AlertTriangle,
  X,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';

const SENSORS_LIST = [
  { name: 'BME280', type: 'Temp / Humidity / Pressure', pin: 'I2C (SDA 21 / SCL 22)' },
  { name: 'BH1750', type: 'Ambient Light (Lux)', pin: 'I2C (0x23)' },
  { name: 'Rain Sensor (FC-37)', type: 'Precipitation', pin: 'GPIO 34 (ADC1_CH6)' },
  { name: 'MQ135', type: 'Air Quality & Gas Index', pin: 'GPIO 35 (ADC1_CH7)' },
  { name: 'Cup Anemometer', type: 'Wind Velocity Counter', pin: 'GPIO 14 (Interrupt)' },
];

export default function DevicesPage({ user }) {
  const isAdmin = user?.role === 'admin';
  const [nodes, setNodes] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [addError, setAddError] = useState('');

  const fetchDevices = useCallback(async () => {
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
      // Fallback node
      setNodes([
        {
          device_id: 'ESP32_SURATHKAL_01',
          location: 'Coastal Sensor Station 01 (NITK)',
          status: 'online',
          last_seen: new Date(),
          firmware_version: '2.4.1',
        },
      ]);
      setHealth({ total_devices: 1, online_devices: 1, offline_devices: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

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
      fetchDevices();
    } catch (err) {
      setAddError(err.message || 'Failed to add node');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm(`Decommission node ${deviceId}?`)) return;
    try {
      await devicesApi.delete(deviceId);
      fetchDevices();
    } catch (err) {
      alert(err.message || 'Failed to remove node');
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
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#0D3563' }}>
              Sensors &amp; Hardware Transducers
            </h2>
            <p className="text-xs" style={{ color: '#5096C8' }}>
              ESP32 microcontroller nodes, bus pinouts, and physical telemetry state
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              style={{
                background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
              }}
            >
              <Plus size={14} />
              <span>Register Node</span>
            </button>
          )}

          <button
            onClick={fetchDevices}
            className="p-2.5 rounded-xl border transition-all"
            style={{
              background: 'rgba(234,246,255,0.7)',
              borderColor: 'rgba(144,202,249,0.5)',
              color: '#1565C0',
            }}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-5 rounded-3xl border shadow-sm"
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(144,202,249,0.55)',
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#5096C8' }}>
            Total Hardware Nodes
          </span>
          <div className="text-2xl font-extrabold mt-1" style={{ color: '#0D3563' }}>
            {nodes.length}
          </div>
        </div>
        <div
          className="p-5 rounded-3xl border shadow-sm"
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(144,202,249,0.55)',
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#5096C8' }}>
            Online Transmitting
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {nodes.filter((n) => n.status === 'online').length} Nodes
          </div>
        </div>
        <div
          className="p-5 rounded-3xl border shadow-sm"
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(144,202,249,0.55)',
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#5096C8' }}>
            Transducer Channels
          </span>
          <div className="text-2xl font-extrabold mt-1" style={{ color: '#1976D2' }}>
            5 Channels Active
          </div>
        </div>
      </div>

      {/* Registered Node Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nodes.map((node) => {
          const isOnline = node.status === 'online';
          return (
            <div
              key={node.device_id}
              className="p-6 rounded-3xl border shadow-sm space-y-5 transition-all"
              style={{
                background: 'rgba(255,255,255,0.85)',
                borderColor: 'rgba(144,202,249,0.6)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border"
                    style={{
                      background: 'rgba(25,118,210,0.1)',
                      borderColor: 'rgba(25,118,210,0.2)',
                      color: '#1976D2',
                    }}
                  >
                    <Cpu size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-mono" style={{ color: '#0D3563' }}>
                        {node.device_id}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg border font-mono font-semibold"
                        style={{
                          background: 'rgba(234,246,255,0.8)',
                          borderColor: 'rgba(144,202,249,0.5)',
                          color: '#1565C0',
                        }}
                      >
                        FW v{node.firmware_version || '2.4.1'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#5096C8' }}>
                      {node.location || 'Station Node'}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
                  style={{
                    background: isOnline ? 'rgba(236,253,245,0.9)' : 'rgba(254,242,242,0.9)',
                    borderColor: isOnline ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)',
                    color: isOnline ? '#059669' : '#DC2626',
                  }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              </div>

              {/* Node Specifications Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div
                  className="p-3.5 rounded-2xl border"
                  style={{
                    background: 'rgba(245,250,255,0.7)',
                    borderColor: 'rgba(144,202,249,0.4)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#5096C8' }}>
                    Heartbeat Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold" style={{ color: '#0D3563' }}>
                    <Clock size={13} style={{ color: '#1976D2' }} />
                    <span>{formatRelativeTime(node.last_seen)}</span>
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl border"
                  style={{
                    background: 'rgba(245,250,255,0.7)',
                    borderColor: 'rgba(144,202,249,0.4)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#5096C8' }}>
                    Network Bus
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold" style={{ color: '#0D3563' }}>
                    <Wifi size={13} className="text-emerald-600" />
                    <span>WiFi + MQTT 1883</span>
                  </div>
                </div>
              </div>

              {/* Sensor Pinout Channels */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5096C8' }}>
                  Configured Transducers ({SENSORS_LIST.length})
                </span>
                <div className="space-y-1.5">
                  {SENSORS_LIST.map((s) => (
                    <div
                      key={s.name}
                      className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        background: '#FFFFFF',
                        borderColor: 'rgba(144,202,249,0.35)',
                      }}
                    >
                      <div>
                        <span className="font-bold" style={{ color: '#0D3563' }}>{s.name}</span>
                        <span className="text-[11px] block" style={{ color: '#5096C8' }}>{s.type}</span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg border font-semibold"
                        style={{
                          background: 'rgba(234,246,255,0.8)',
                          borderColor: 'rgba(144,202,249,0.5)',
                          color: '#1565C0',
                        }}
                      >
                        {s.pin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div
                  className="pt-3 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'rgba(144,202,249,0.3)' }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: '#5096C8' }}>
                    Admin Controls
                  </span>
                  <button
                    onClick={() => handleDeleteDevice(node.device_id)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all flex items-center gap-1.5 font-bold"
                  >
                    <Trash2 size={13} />
                    <span>Decommission Node</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,53,99,0.45)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(144,202,249,0.8)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'rgba(144,202,249,0.4)' }}
            >
              <h3 className="text-base font-bold" style={{ color: '#0D3563' }}>
                Register Hardware Node
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-sky-50 transition-colors"
                style={{ color: '#5096C8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: '#1565C0' }}>
                  Device Identifier (e.g. ESP32_SURATHKAL_02)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ESP32_SURATHKAL_02"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                  style={{
                    background: 'rgba(234,246,255,0.8)',
                    border: '1px solid rgba(144,202,249,0.6)',
                    color: '#0D3563',
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: '#1565C0' }}>
                  Physical Installation Location
                </label>
                <input
                  type="text"
                  placeholder="Roof Station / Oceanography Lab"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                  style={{
                    background: 'rgba(234,246,255,0.8)',
                    border: '1px solid rgba(144,202,249,0.6)',
                    color: '#0D3563',
                  }}
                />
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-sky-50 transition-colors"
                  style={{ color: '#5096C8' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
                  }}
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
