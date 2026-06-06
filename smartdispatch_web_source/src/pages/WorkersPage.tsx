import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, X } from 'lucide-react';
import type { Worker } from '../types';

interface WorkersPageProps {
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  showAddWorkerModal: boolean;
  setShowAddWorkerModal: (b: boolean) => void;
  newWorkerName: string;
  setNewWorkerName: (s: string) => void;
  newWorkerRole: 'PACKER' | 'SUPERVISOR';
  setNewWorkerRole: (s: any) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const WorkersPage: React.FC<WorkersPageProps> = ({
  workers,
  setWorkers,
  showAddWorkerModal,
  setShowAddWorkerModal,
  newWorkerName,
  setNewWorkerName,
  newWorkerRole,
  setNewWorkerRole,
  addToast
}) => {
  return (
    <motion.div
      key="workers"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Active Warehouse Operator Registry</h3>
          <p className="text-xs text-gray-400 mt-1">Packers credentials and live tracking parameters.</p>
        </div>
        <button
          onClick={() => setShowAddWorkerModal(true)}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Register New Packer
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {workers.map(w => (
          <div key={w.id} className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex flex-col gap-4 shadow-md relative overflow-hidden group hover:border-orange-500/30 transition duration-300">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-gray-950/40 rounded-lg text-orange-500 border border-[rgba(255,255,255,0.03)]">
                <Users className="w-5 h-5 text-[#F97316]" />
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                w.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'
              }`}>
                {w.isActive ? 'ACTIVE IN-DOCK' : 'OFFLINE'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white block">{w.name}</h4>
              <span className="text-[11px] font-mono text-[#F97316] font-semibold">{w.workerId} · {w.role}</span>
              
              <div className="mt-3.5 flex flex-col gap-1.5 text-xs text-gray-400 font-mono">
                <div className="flex items-center justify-between">
                  <span>Handled Today:</span>
                  <span className="text-white font-semibold">{w.packagesPackedToday} standard box</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>OCR Accuracy Rate:</span>
                  <span className="text-[#22D3A0] font-bold">{w.accuracyRate}%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-3.5 mt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">TEL: {w.phone}</span>
              <button
                onClick={() => {
                  setWorkers(prev => prev.map(item => item.id === w.id ? { ...item, isActive: !item.isActive } : item));
                  addToast(`Packer ${w.name} active profile toggled`, 'info');
                }}
                className="text-[10px] text-gray-400 hover:text-white transition cursor-pointer"
              >
                Toggle In-Dock Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {showAddWorkerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111827] border border-[rgba(255,255,255,0.12)] rounded-xl max-w-sm w-full shadow-2xl p-6 relative flex flex-col gap-5"
            >
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <h3 className="text-sm font-bold text-white">Register Dispatch Packer</h3>
                <button
                  onClick={() => setShowAddWorkerModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">OPERATOR FULL NAME *</label>
                  <input
                    type="text"
                    placeholder="e.g. Karan Dev"
                    value={newWorkerName}
                    onChange={e => setNewWorkerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">ROLE CLASSIFICATION</label>
                  <select
                    value={newWorkerRole}
                    onChange={e => setNewWorkerRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-white"
                  >
                    <option value="PACKER">Packer Operator (Android Node)</option>
                    <option value="SUPERVISOR">Supervisor (Admin Master)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#F97316] font-mono block mb-1">Worker ID PIN</label>
                  <p className="text-[10px] text-gray-400 leading-normal">System will automatically assign a WK-XXXX sequence with active credentials hash standard security.</p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-1.5 text-xs text-gray-400 hover:text-white rounded hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newWorkerName.trim()) {
                      addToast('Please enter worker name', 'error');
                      return;
                    }
                    const created: Worker = {
                      id: `wrk-${Date.now()}`,
                      workerId: `WK-0${Math.floor(1000 + Math.random() * 9000)}`,
                      name: newWorkerName,
                      email: `${newWorkerName.toLowerCase().replace(/ /g, '')}@smartdispatch.com`,
                      phone: '+91 94473' + Math.floor(10000 + Math.random() * 90000),
                      role: newWorkerRole,
                      isActive: true,
                      packagesPackedToday: 0,
                      accuracyRate: 100.0
                    };
                    setWorkers(prev => [...prev, created]);
                    setShowAddWorkerModal(false);
                    setNewWorkerName('');
                    addToast(`Operator "${created.name}" registered successfully. Code: ${created.workerId}`, 'success');
                  }}
                  className="px-4 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide cursor-pointer"
                >
                  Register
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
