import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowRight,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import type { Order, Alert } from '../types';

interface DashboardPageProps {
  orders: Order[];
  alerts: Alert[];
  setActiveTab: (tab: any) => void;
  setOrderStatusFilter: (status: any) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  handleResolveAlert: (alertId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  orders,
  alerts,
  setActiveTab,
  setOrderStatusFilter,
  addToast,
  handleResolveAlert
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      {/* Stats overview banner staggered entry */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        
        {/* Stat block 1 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
          onClick={() => {
            setActiveTab('orders');
            setOrderStatusFilter('PENDING');
            addToast("Navigated to Pending Orders", "info");
          }}
          className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#F97316]/40 transition duration-350 cursor-pointer"
        >
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pending Orders</span>
            <span className="text-2xl font-bold font-mono text-[#F1F5F9] mt-1 block">
              {orders.filter(o => o.status === 'PENDING').length}
            </span>
            <span className="text-[10px] text-[#F97316] font-semibold mt-1 inline-flex items-center gap-1">
              Needs packing assign
            </span>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1 bg-amber-500 opacity-60" />
        </motion.div>

        {/* Stat block 2 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
          onClick={() => {
            setActiveTab('orders');
            setOrderStatusFilter('PACKING');
            addToast("Navigated to Active Packing Orders", "info");
          }}
          className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-blue-500/40 transition duration-350 cursor-pointer"
        >
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Packing Now</span>
            <span className="text-2xl font-bold font-mono text-[#F1F5F9] mt-1 block">
              {orders.filter(o => ['ASSIGNED', 'PACKING'].includes(o.status)).length}
            </span>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-flex items-center gap-1">
              Active on Flutter App
            </span>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1 bg-blue-500 opacity-60" />
        </motion.div>

        {/* Stat block 3 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
          onClick={() => {
            setActiveTab('print');
            addToast("Navigated to Print Center (NFC Sealed Orders Queue)", "info");
          }}
          className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#22D3A0]/40 transition duration-350 cursor-pointer"
        >
          <div className="p-3 bg-[#22D3A0]/10 rounded-lg text-[#22D3A0]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">NFC Sealed Sealed</span>
            <span className="text-2xl font-bold font-mono text-[#22D3A0] mt-1 block">
              {orders.filter(o => ['PACKED', 'SHIPPED', 'DELIVERED'].includes(o.status)).length}
            </span>
            <span className="text-[10px] text-[#22D3A0] font-semibold mt-1 inline-flex items-center gap-1">
              Zero errors reported
            </span>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1 bg-[#22D3A0] opacity-60" />
        </motion.div>

        {/* Stat block 4 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
          onClick={() => {
            setActiveTab('alerts');
            addToast("Navigated to Telemetry Alerts Ledger", "info");
          }}
          className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#EF4444]/40 transition duration-350 cursor-pointer"
        >
          <div className="p-3 bg-[#EF4444]/10 rounded-lg text-[#EF4444]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Alerts</span>
            <span className="text-2xl font-bold font-mono text-[#EF4444] mt-1 block">
              {alerts.filter(a => !a.isResolved).length}
            </span>
            <span className="text-[10px] text-[#EF4444] font-semibold mt-1 inline-flex items-center gap-1">
              Optical/Weight mismatch
            </span>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1 bg-[#EF4444] opacity-60" />
        </motion.div>

      </motion.div>

      {/* Warehouse dispatch center flow overview helper banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#0A0F1A] to-amber-950/40 border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-[#22D3A0] rounded-full animate-ping shrink-0" />
          <p className="text-xs text-gray-300 font-medium max-w-2xl">
            <strong className="text-white">SmartDispatch Dispatch Flow Guide:</strong> Products are compiled into orders. Warehouse packers scan items over the Flutter Mobile App (verifying OCR text + RGB color camera checks + standard weight tolerances). Sealed items write physical order hashes into local <strong className="text-[#F97316]">NFC chips</strong> before being released to the Delivery driver.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('print')}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 tracking-wide transition duration-200 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Center Queue →
        </button>
      </div>

      {/* Grid content blocks */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left col - Recent Orders */}
        <div className="xl:col-span-7 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Registry: Recent Orders Status</h3>
              <p className="text-[11px] text-gray-500 font-mono">Live synchronization with barcode scanners</p>
            </div>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-xs text-[#F97316] hover:underline hover:text-amber-500 inline-flex items-center gap-1 font-semibold"
            >
              View all orders
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Quantity</th>
                  <th className="p-4 font-semibold">Total Price</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Packer Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-4 font-mono text-gray-300 font-semibold">{o.orderNumber}</td>
                    <td className="p-4">
                      <span className="font-semibold block text-white">{o.customerName}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{o.shippingAddress.city}, {o.shippingAddress.state}</span>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-300 font-mono">
                      {o.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="p-4 font-semibold text-gray-300 font-mono">₹{o.totalRs.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wide ${
                        o.status === 'PENDING' ? 'bg-[#1F2937] text-gray-300 border border-gray-600/20' :
                        o.status === 'ASSIGNED' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/10' :
                        o.status === 'PACKING' ? 'bg-amber-950/40 text-amber-500 border border-amber-500/25' :
                        o.status === 'VERIFIED' ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10' :
                        o.status === 'PACKED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/25' :
                        o.status === 'SHIPPED' ? 'bg-[#0F172A] text-sky-400 border border-sky-400/20' :
                        'bg-[#0F172A] text-emerald-400 border border-emerald-400/40' // Delivered
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-gray-400">
                      {o.packerName ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-300">
                          <UserCheck className="w-3 h-3 text-[#22D3A0]" />
                          {o.packerName}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col - Recent Telemetry Alerts */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          
          {/* Alert panel block */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Anomalous Telemetry Feeds</h3>
                <p className="text-[11px] text-gray-500 font-mono">Optical OCR scanning sensor logs</p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-950 text-red-400 rounded border border-red-500/20">
                {alerts.filter(a => !a.isResolved).length} UNRESOLVED
              </span>
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="p-4 flex flex-col gap-3 max-h-[360px] overflow-y-auto"
            >
              {alerts.map(alert => (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
                  }}
                  whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
                  key={alert.id}
                  className={`p-3.5 rounded-lg border transition-colors duration-200 ${
                    alert.isResolved
                      ? 'bg-gray-950/20 border-[rgba(255,255,255,0.04)] text-gray-500'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-rose-950/10 border-rose-500/20 text-rose-300'
                      : 'bg-amber-950/10 border-amber-500/20 text-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        alert.isResolved ? 'bg-gray-600' : alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                      }`} />
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-gray-900/60 px-2 py-0.5 rounded text-gray-300">
                        {alert.alertType}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500">
                      {alert.createdAt.substring(11, 16)} GMT
                    </span>
                  </div>
                  
                  <p className={`text-[11px] mt-2 block leading-relaxed ${alert.isResolved ? 'text-gray-500' : 'text-gray-200'}`}>
                    <strong className="text-white font-semibold block mb-0.5">Order {alert.orderNumber}</strong>
                    {alert.detail}
                  </p>

                  {alert.workerName && (
                    <span className="text-[10px] text-gray-400 font-mono mt-1.5 block">
                      Packer unit: {alert.workerName}
                    </span>
                  )}

                  <div className="mt-2.5 flex items-center justify-end">
                    {alert.isResolved ? (
                      <span className="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1 text-[10px] font-bold font-mono rounded bg-white text-gray-950 hover:bg-orange-500 hover:text-white transition duration-150 cursor-pointer"
                      >
                        Supervisor Resolve Flags
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* System stats block */}
          <div className="bg-gradient-to-br from-[#111827] to-[#080E1C] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wide">Optical Accuracy Engine</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#22D3A0]">99.1%</span>
                <span className="text-[10px] text-gray-500 font-mono">GLOBAL MEAN</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 max-w-sm">
                Calculated from OCR SKU correlation, RGB neural models and weighment specifications over 1,220 dispatches.
              </p>
            </div>
            <ShieldCheck className="w-12 h-12 text-[#22D3A0] opacity-20" />
          </div>

        </div>

      </div>

    </motion.div>
  );
};
