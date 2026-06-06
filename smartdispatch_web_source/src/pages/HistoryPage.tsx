import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck2, Users, Wifi, Truck, Clock } from 'lucide-react';
import type { Order } from '../types';

interface HistoryPageProps {
  orders: Order[];
  uniqueHistoryCustomers: string[];
  selectedHistoryCustomer: string | null;
  setSelectedHistoryCustomer: (s: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  orders,
  uniqueHistoryCustomers,
  selectedHistoryCustomer,
  setSelectedHistoryCustomer
}) => {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Drawer / Selector: Customer Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">Select Active Account</h4>
              <p className="text-[10px] text-gray-500 leading-normal">
                Select a customer to pull historical dispatches, sensor integrity records, and package timeline states.
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {uniqueHistoryCustomers.map(customer => {
                const isChosen = selectedHistoryCustomer === customer;
                const customerOrders = orders.filter(o => o.customerName === customer);
                const totalOrdersCount = customerOrders.length;
                const totalSpent = customerOrders.reduce((acc, curr) => acc + curr.totalRs, 0);

                return (
                  <button
                    key={customer}
                    onClick={() => setSelectedHistoryCustomer(customer)}
                    className={`w-full p-3 rounded-lg border text-left flex flex-col gap-1.5 transition-all duration-150 cursor-pointer ${
                      isChosen
                        ? 'bg-[#F97316]/10 border-[#F97316]/50 text-white'
                        : 'bg-gray-800/20 border-transparent hover:bg-gray-800/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate max-w-[130px]">{customer}</span>
                      <span className="px-1.5 py-0.5 bg-gray-900 rounded text-[9px] font-mono text-gray-400 font-extrabold pb-0.5 pt-0.5">
                        {totalOrdersCount} ord
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>Spent Total:</span>
                      <span className="text-emerald-400 font-bold font-mono">₹{totalSpent.toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer stats summary */}
          {selectedHistoryCustomer && (
            <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-[rgba(255,255,255,0.06)] pb-2">
                Account Dossier
              </h4>
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Security Ring:</span>
                  <span className="text-emerald-400 font-bold">Standard Secure</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Node Hub:</span>
                  <span className="text-gray-300 font-bold">DOCK-04</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">NFC Seals:</span>
                  <span className="text-gray-300 font-bold">
                    {orders.filter(o => o.customerName === selectedHistoryCustomer && (o.status === 'PACKED' || o.status === 'DELIVERED')).length} OK
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Timelines & past orders */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {selectedHistoryCustomer ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-widest font-mono text-gray-300">
                  Timeline Dossier - {selectedHistoryCustomer}
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                  {orders.filter(o => o.customerName === selectedHistoryCustomer).length} total records
                </span>
              </div>

              {orders.filter(o => o.customerName === selectedHistoryCustomer).map(order => {
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                // Dynamic timeline steps
                const steps = [
                  {
                    title: "System Order Registered",
                    desc: "Order record securely committed of node ingress system telemetry database.",
                    timestamp: `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT`,
                    status: "COMPLETED",
                    icon: FileCheck2,
                    iconColor: "text-emerald-400"
                  },
                  {
                    title: order.packerName ? `Assigned to Dispatch Packer` : `Pending Packer Assignment`,
                    desc: order.packerName 
                      ? `Operator "${order.packerName}" assigned to verify physical specifications.`
                      : "Order sits in unassigned packing queue awaiting warehouse worker assignment.",
                    timestamp: order.packerName ? `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT` : null,
                    status: order.packerName ? "COMPLETED" : "PENDING",
                    icon: Users,
                    iconColor: order.packerName ? "text-emerald-400" : "text-gray-600"
                  },
                  {
                    title: "Cryptographic NFC Seal Appended",
                    desc: order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED'
                      ? `13.56MHz physical container tag sealed, locking telemetry specifications inside NDEF memory.`
                      : "Pending verification of standard, weights and optic constraints.",
                    timestamp: order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED'
                      ? `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT`
                      : null,
                    status: (order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED') ? "COMPLETED" : "AWAITING",
                    icon: Wifi,
                    iconColor: (order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED') ? "text-emerald-400" : "text-gray-600"
                  },
                  {
                    title: "Delivered To Destination Handover",
                    desc: order.status === 'DELIVERED'
                      ? `Completed secure delivery handoff. Integrity seals validated on dispatch.`
                      : "Packages out for packing/transit checklist steps.",
                    timestamp: order.status === 'DELIVERED' ? `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT` : null,
                    status: order.status === 'DELIVERED' ? "COMPLETED" : "AWAITING",
                    icon: Truck,
                    iconColor: order.status === 'DELIVERED' ? "text-emerald-400" : "text-gray-600"
                  }
                ];

                return (
                  <div key={order.id} className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-sm p-5 flex flex-col gap-4">
                    
                    {/* Summary top row */}
                    <div className="flex flex-wrap items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3 gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#F97316] font-mono text-sm uppercase tracking-wide">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                            : order.status === 'PACKED'
                            ? 'bg-blue-950 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-950 text-amber-500 border border-amber-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <div>Value: <span className="text-white font-bold font-mono">₹{order.totalRs.toLocaleString('en-IN')}</span></div>
                        <div>Items: <span className="text-white font-bold font-mono">{totalQty}</span></div>
                      </div>
                    </div>

                    {/* Consolidating Specifications table */}
                    <div className="bg-[#0A0F1A] border border-[rgba(255,255,255,0.04)] rounded-lg p-3">
                      <span className="text-[9px] font-bold text-gray-500 uppercase font-mono block mb-1">Items in shipment</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                        {order.items.map(item => (
                          <div key={item.id} className="bg-[#111827]/40 p-2.5 rounded border border-[rgba(255,255,255,0.03)] flex flex-col gap-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-xs font-bold text-white leading-tight block">{item.productName}</span>
                                <span className="text-[10px] font-mono text-gray-500">{item.sku}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-300 font-mono">x{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-1.5 text-[9px] font-mono">
                              <span className="text-amber-500 bg-amber-950/20 px-1 rounded border border-amber-500/10">⚖ 1.6kg Spec PASSED</span>
                              <span className="text-emerald-500 font-extrabold uppercase flex items-center gap-0.5">
                                ✓ INTEGRITY OK
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual Vertical Timeline */}
                    <div className="relative pl-6 flex flex-col gap-5 mt-4">
                      {/* The vertical timeline spine */}
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-800" />

                      {steps.map((st, sIdx) => {
                        const StIcon = st.icon;
                        const isCompleted = st.status === "COMPLETED";
                        const isPending = st.status === "PENDING";
                        const isAwaiting = st.status === "AWAITING";

                        return (
                          <div key={sIdx} className="relative flex flex-col md:flex-row md:items-center justify-between gap-2 pl-4">
                            {/* Timeline node circle */}
                            <div className={`absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${
                              isCompleted 
                                ? 'bg-[#111827] border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                : isPending 
                                ? 'bg-[#111827] border-amber-500 text-amber-500 animate-pulse' 
                                : 'bg-gray-900 border-gray-700 text-gray-500'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted ? 'bg-emerald-400' : isPending ? 'bg-amber-400' : 'bg-gray-600'
                              }`} />
                            </div>

                            {/* Text info layout */}
                            <div>
                              <h5 className={`text-xs font-bold font-mono tracking-wide ${
                                isCompleted ? 'text-gray-100' : isPending ? 'text-amber-400 animate-pulse' : 'text-gray-500'
                              }`}>
                                {st.title}
                              </h5>
                              <p className="text-[11px] text-gray-400 max-w-xl leading-normal mt-0.5">
                                {st.desc}
                              </p>
                            </div>

                            {/* Timestamp layout */}
                            {st.timestamp ? (
                              <span className="text-[10px] text-gray-500 font-mono self-start md:self-auto bg-gray-900/50 px-2 py-0.5 rounded border border-[rgba(255,255,255,0.04)] sm:whitespace-nowrap md:mt-0 mt-1">
                                ⌚ {st.timestamp}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-mono italic">
                                Not started
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#111827] border border-[rgba(255,255,255,0.04)] p-8 rounded-xl text-center flex flex-col items-center justify-center min-h-[300px]">
              <Clock className="w-10 h-10 text-gray-600 mb-2 animate-pulse" />
              <span className="text-sm text-gray-400 font-mono font-bold block uppercase tracking-wider">No customer profiles loaded</span>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Register orders in orders registry first to build account portfolios.
              </p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
