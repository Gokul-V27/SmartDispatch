import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { TelemetryAlert } from '../types';

interface AlertsPageProps {
  alerts: TelemetryAlert[];
  handleResolveAlert: (alertId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, handleResolveAlert }) => {
  return (
    <motion.div
      key="alerts"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Full Optical & Mass Telemetry System Alerts</h3>
            <p className="text-xs text-gray-400 mt-1">Cross-correlate optical sensor values and weighment limits.</p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 rounded border border-amber-500/25">
            Live Telemetry active
          </span>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.06)] text-xs">
          {alerts.map(a => (
            <div key={a.id} className="p-5 hover:bg-gray-800/10 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg shrink-0 ${
                  a.isResolved ? 'bg-gray-800/40 text-gray-500' : a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{a.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                      a.isResolved ? 'bg-gray-900 text-gray-500' : 'bg-red-950/60 text-red-400 border border-red-500/20 animate-pulse'
                    }`}>
                      {a.alertType}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">{a.createdAt.substring(11, 16)} GMT</span>
                  </div>
                  
                  <p className={`text-xs mt-3 max-w-3xl leading-relaxed ${a.isResolved ? 'text-gray-500' : 'text-gray-200'}`}>
                    {a.detail}
                  </p>

                  {a.workerName && (
                    <span className="text-[11px] text-gray-500 font-mono tracking-normal block mt-2">
                      Packers Station Reference: <strong className="text-gray-300 font-semibold">{a.workerName}</strong>
                    </span>
                  )}

                  {a.isResolved && a.resolvedAt && (
                    <span className="text-[11.5px] text-emerald-400 font-mono tracking-normal block mt-3">
                      ✓ Resolved under system supervisor authority logs at <strong className="text-emerald-400 font-bold">{a.resolvedAt.substring(11, 19)} GMT</strong>
                    </span>
                  )}
                </div>
              </div>

              {!a.isResolved && (
                <button
                  onClick={() => handleResolveAlert(a.id)}
                  className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  Manual Force Sync Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
