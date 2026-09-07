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
    } catch {}
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
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Sensors & Hardware Transducers</h2>
            <p className="text-xs text-[#64748B]">ESP32 microcontroller nodes, bus pinouts, and physical telemetry state</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#60A5FA] hover:bg-[#3B82F6] text-[#07111F] font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg"
            >
              <Plus size={14} />
              <span>Register Node</span>
            </button>
          )}

          <button
            onClick={fetchDevices}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Hardware Nodes</span>
          <div className="text-2xl font-bold text-white mt-1">{nodes.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Online Transmitting</span>
          <div className="text-2xl font-bold text-[#34D399] mt-1">
            {nodes.filter((n) => n.status === 'online').length} Nodes
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Transducer Channels</span>
          <div className="text-2xl font-bold text-[#60A5FA] mt-1">5 Channels Active</div>
        </div>
      </div>

      {/* Registered Node Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nodes.map((node) => {
          const isOnline = node.status === 'online';
          return (
            <div
              key={node.device_id}
              className="p-6 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] hover:border-white/[0.14] backdrop-blur-xl shadow-xl space-y-5 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">{node.device_id}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] font-mono">
                        FW v{node.firmware_version || '2.4.1'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">{node.location || 'Station Node'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse' : 'bg-[#F87171]'
                    }`}
                  />
                  <span className={`text-xs font-bold tracking-wider ${isOnline ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Node Specifications Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Heartbeat Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} className="text-[#60A5FA]" />
                    <span className="font-semibold text-white font-mono">{formatRelativeTime(node.last_seen)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Network Bus</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Wifi size={12} className="text-[#34D399]" />
                    <span className="font-semibold text-white font-mono">WiFi + MQTT 1883</span>
                  </div>
                </div>
              </div>

              {/* Sensor Pinout Channels */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Configured Transducers ({SENSORS_LIST.length})
                </span>
                <div className="space-y-1.5">
                  {SENSORS_LIST.map((s) => (
                    <div
                      key={s.name}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="text-[#64748B] text-[11px] block">{s.type}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#60A5FA] px-2 py-0.5 rounded bg-[#60A5FA]/10 border border-[#60A5FA]/20">
                        {s.pin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B]">Admin Control Active</span>
                  <button
                    onClick={() => handleDeleteDevice(node.device_id)}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-[#F87171]/20 border border-white/[0.08] hover:border-[#F87171]/40 text-[#94A3B8] hover:text-[#F87171] transition-all flex items-center gap-1 font-semibold"
                  >
                    <Trash2 size={12} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0B1728] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Register Hardware Node</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#94A3B8] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase mb-1">
                  Device Identifier (e.g. ESP32_SURATHKAL_02)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ESP32_SURATHKAL_02"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-[#60A5FA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase mb-1">
                  Physical Installation Location
                </label>
                <input
                  type="text"
                  placeholder="Roof Station / Oceanography Lab"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-[#60A5FA]"
                />
              </div>

              {addError && <p className="text-xs text-[#F87171]">{addError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#60A5FA] text-[#07111F] font-bold"
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
