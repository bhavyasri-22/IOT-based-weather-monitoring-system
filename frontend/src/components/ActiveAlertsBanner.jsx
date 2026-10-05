import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ActiveAlertsBanner({ activeAlerts = [], onResolve }) {
  // Filter out any bogus 4095 flood alerts
  const validAlerts = activeAlerts.filter(
    (a) => (a.status === 'active' || !a.resolved) &&
      !(a.parameter === 'rain_intensity' && (a.trigger_value >= 100 || (a.message && a.message.includes('4095'))))
  );

  if (!validAlerts.length) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {validAlerts.slice(0, 2).map((alert) => (
          <motion.div
            key={alert._id || alert.id || alert.parameter}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`rounded-2xl p-4 flex items-center justify-between gap-3 border shadow-sm ${
              alert.severity === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                alert.severity === 'critical'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {alert.severity === 'critical' ? 'Critical Alert' : 'Environmental Warning'}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {alert.device_id || 'Station'}
                  </span>
                </div>
                <p className="text-xs mt-0.5 opacity-90">
                  {alert.message || `Threshold exceeded for ${alert.parameter}`}
                </p>
              </div>
            </div>

            {onResolve && (
              <button
                onClick={() => onResolve(alert._id || alert.id)}
                className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-current/20 text-xs font-semibold transition-colors flex-shrink-0"
              >
                Acknowledge
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
