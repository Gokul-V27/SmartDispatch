import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Printer, Users, Wifi, FileCheck2 } from 'lucide-react';
import type { Order, Worker, OrderStatus } from '../types';

interface OrdersPageProps {
  orders: Order[];
  workers: Worker[];
  filteredOrders: Order[];
  orderSearch: string;
  setOrderSearch: (s: string) => void;
  orderStatusFilter: 'ALL' | OrderStatus;
  setOrderStatusFilter: (s: any) => void;
  exportToCsv: () => void;
  bulkSelectedOrderIds: string[];
  setBulkSelectedOrderIds: React.Dispatch<React.SetStateAction<string[]>>;
  setShowBulkPrintModal: (b: boolean) => void;
  setShowBulkAssignModal: (b: boolean) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  handleAssignPacker: (orderId: string, packerId: string) => void;
  setNfcPopupOrder: (order: Order | null) => void;
  setShowNfcPopup: (b: boolean) => void;
  playBuzzerSound: () => void;
  autoPrintEnabled: boolean;
  setAutoPrintCountdown: (c: number | null) => void;
  handleAdvanceOrderStatus: (orderId: string) => void;
  activeNfcHandshaking: any;
  handleNfcSealTapSimulation: (orderId: string) => void;
  setSelectedPrintOrderId: (id: string) => void;
  setActiveTab: (t: any) => void;
  showBulkAssignModal: boolean;
  bulkAssignTargetPackerId: string;
  setBulkAssignTargetPackerId: (id: string) => void;
  handleBulkAssignPacker: (orderIds: string[], packerId: string) => void;
  showBulkPrintModal: boolean;
  generateBulkConsolidatedPdfReport: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  workers,
  filteredOrders,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  exportToCsv,
  bulkSelectedOrderIds,
  setBulkSelectedOrderIds,
  setShowBulkPrintModal,
  setShowBulkAssignModal,
  selectedOrderId,
  setSelectedOrderId,
  handleAssignPacker,
  setNfcPopupOrder,
  setShowNfcPopup,
  playBuzzerSound,
  autoPrintEnabled,
  setAutoPrintCountdown,
  handleAdvanceOrderStatus,
  activeNfcHandshaking,
  handleNfcSealTapSimulation,
  setSelectedPrintOrderId,
  setActiveTab,
  showBulkAssignModal,
  bulkAssignTargetPackerId,
  setBulkAssignTargetPackerId,
  handleBulkAssignPacker,
  showBulkPrintModal,
  generateBulkConsolidatedPdfReport,
  addToast
}) => {
  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left col: Orders List with stats filter */}
        <div className="flex-1 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden self-start w-full">
          
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search order number or name..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs placeholder-gray-500 text-white min-w-[220px] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex wrap items-center gap-1.5 p-1 bg-gray-900 rounded-lg">
                {['ALL', 'PENDING', 'PACKING', 'PACKED', 'DELIVERED'].map((filterVal) => (
                  <button
                    key={filterVal}
                    onClick={() => setOrderStatusFilter(filterVal as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded font-mono transition duration-150 cursor-pointer ${
                      orderStatusFilter === filterVal ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {filterVal}
                  </button>
                ))}
              </div>
              <button
                onClick={exportToCsv}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(16,185,129,0.15)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Sliding Bulk Assignment Active Bar */}
          {bulkSelectedOrderIds.length > 0 && (
            <div className="bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                <span className="text-xs font-mono text-gray-300">
                  <strong className="text-white font-semibold font-mono">{bulkSelectedOrderIds.length}</strong> orders selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkPrintModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono font-bold text-[11px] tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.2)] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Bulk Print Preview
                </button>
                <button
                  onClick={() => setShowBulkAssignModal(true)}
                  className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded font-mono font-bold text-[11px] tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.2)] cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Bulk Assign Packer
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                  <th className="p-4 w-[40px]">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && filteredOrders.every(o => bulkSelectedOrderIds.includes(o.id))}
                      onChange={e => {
                        if (e.target.checked) {
                          setBulkSelectedOrderIds(filteredOrders.map(o => o.id));
                        } else {
                          setBulkSelectedOrderIds([]);
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-700 bg-[#0A0F1A] text-[#F97316] accent-[#F97316] focus:ring-0 cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="p-4">ID Reference</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Item Breakdown</th>
                  <th className="p-4">Order Value</th>
                  <th className="p-4">Assigned Packer</th>
                  <th className="p-4">Verification Check</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                {filteredOrders.map(o => {
                  const isSelected = selectedOrderId === o.id;
                  const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                  const verifiedCount = o.items.filter(i => i.ocrVerified && i.visionVerified && i.weightVerified).length;
                  const isAllVerified = verifiedCount === o.items.length;
                  
                  const isBulkSelected = bulkSelectedOrderIds.includes(o.id);
                  
                  return (
                    <tr
                      key={o.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-500/10 hover:bg-orange-500/15' : 'hover:bg-gray-800/15'
                      } ${isBulkSelected ? 'bg-orange-500/5' : ''}`}
                      onClick={() => setSelectedOrderId(o.id)}
                    >
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isBulkSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkSelectedOrderIds(prev => [...prev, o.id]);
                            } else {
                              setBulkSelectedOrderIds(prev => prev.filter(id => id !== o.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-800 text-[#F97316] accent-[#F97316] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono">
                        <div className="font-bold text-[#F1F5F9]">{o.orderNumber}</div>
                        <span className="text-[10px] text-gray-500 block">Created: {o.createdAt.substring(11, 16)} GMT</span>
                      </td>
                      <td className="p-4 font-bold text-white">{o.customerName}</td>
                      <td className="p-4 font-mono text-gray-300">
                        {totalQty} product{totalQty > 1 ? 's' : ''}
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-300">
                        ₹{o.totalRs.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        {o.packerName ? (
                          <span className="text-gray-300 font-semibold">{o.packerName}</span>
                        ) : (
                          <select
                            defaultValue=""
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              if (e.target.value) handleAssignPacker(o.id, e.target.value);
                            }}
                            className="bg-gray-800 text-gray-300 rounded border border-gray-700 p-1.5 text-xs text-left"
                          >
                            <option value="" disabled>Assign Packer</option>
                            {workers.filter(w => w.isActive).map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-4">
                        {o.status === 'PENDING' ? (
                          <span className="text-gray-500 font-mono text-[10px] uppercase">Unassigned</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold ${
                              o.status === 'DELIVERED' || o.status === 'PACKED' || o.status === 'VERIFIED'
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-amber-950 text-amber-500 animate-pulse'
                            }`}>
                              {verifiedCount}/{o.items.length} items ok
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 px-1">
                          {o.status === 'PACKED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNfcPopupOrder(o);
                                setShowNfcPopup(true);
                                playBuzzerSound();
                                if (autoPrintEnabled) {
                                  setAutoPrintCountdown(3);
                                }
                              }}
                              className="bg-[#22D3A0]/10 text-[#22D3A0] hover:bg-[#22D3A0]/20 border border-[#22D3A0]/25 px-2.5 py-1 rounded text-[10px] font-bold font-mono tracking-wide flex items-center gap-1.5 transition duration-150 cursor-pointer"
                              title="Instant Thermal Print Dispatch Label"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Label
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(o.id);
                            }}
                            className="text-[#F97316] hover:underline font-bold text-xs font-mono cursor-pointer shrink-0"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col: Order Details inspection pane */}
        <div className="w-full lg:w-[380px] bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shrink-0 flex flex-col gap-5 p-5">
          {selectedOrderId ? (
            (() => {
              const order = orders.find(o => o.id === selectedOrderId)!;
              if (!order) return null;
              const verifiedCount = order.items.filter(i => i.ocrVerified && i.visionVerified && i.weightVerified).length;
              return (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">DRILL-DOWN LOGS</span>
                      <h3 className="text-sm font-bold font-mono text-[#F97316]">{order.orderNumber}</h3>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase font-mono ${
                      order.status === 'PENDING' ? 'bg-[#1F2937] text-gray-300' :
                      order.status === 'PACKED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-950 text-amber-400 border border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer Profile */}
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 font-bold uppercase block mb-1">CLIENT PROFILE</span>
                    <div className="p-3 bg-gray-950/40 rounded-lg text-xs leading-relaxed border border-[rgba(255,255,255,0.03)]">
                      <span className="text-white font-bold block">{order.customerName}</span>
                      <span className="text-gray-400 block font-mono">{order.customerPhone}</span>
                      <span className="text-gray-400 font-mono text-[11px] block mt-1.5">
                        {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}, {order.shippingAddress.city}, {order.shippingAddress.pinCode}
                      </span>
                    </div>
                  </div>

                  {/* Items status */}
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 font-bold uppercase block mb-1.5">VERIFICATION MATRIX</span>
                    <div className="flex flex-col gap-2">
                      {order.items.map(item => (
                        <div key={item.id} className="p-3 bg-gray-950/20 rounded-lg border border-[rgba(255,255,255,0.02)]">
                          <span className="text-[11px] font-bold text-white block mb-2">{item.productName}</span>
                          <div className="grid grid-cols-3 gap-1 px-1">
                            <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                              <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[OCR SKU]</span>
                              <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.ocrVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                {item.ocrVerified ? 'PASS ✓' : 'PEND !'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                              <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[RGB COLOR]</span>
                              <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.visionVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                {item.visionVerified ? 'PASS ✓' : 'PEND !'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                              <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[WEIGHMENT]</span>
                              <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.weightVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                {item.weightVerified ? 'PASS ✓' : 'PEND !'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Emulated Operations buttons */}
                  <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
                    {order.status === 'PENDING' && (
                      <p className="text-[11px] text-gray-400 italic font-mono text-center">Assign to active worker to trigger packing sensor simulation workflow.</p>
                    )}

                    {order.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleAdvanceOrderStatus(order.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                      >
                        Trigger Worker Packing Scan
                      </button>
                    )}

                    {order.status === 'PACKING' && (
                      <button
                        onClick={() => handleAdvanceOrderStatus(order.id)}
                        className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                      >
                        Emulate OCR + Weight Sensor PASS
                      </button>
                    )}

                    {order.status === 'VERIFIED' && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-center text-amber-500 font-mono block animate-pulse">✓ ALL SENSORS VALID — SYSTEM READY FOR PHYSICAL SEAL</span>
                        {activeNfcHandshaking && activeNfcHandshaking.orderId === order.id ? (
                          <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30 text-center flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-emerald-500/5 animate-pulse" />
                            <div className="relative">
                              <motion.div
                                className="absolute inset-x-[-12px] inset-y-[-12px] rounded-full bg-emerald-400/20"
                                animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-400/40 flex items-center justify-center z-10 relative">
                                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                              </div>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider animate-pulse flex items-center gap-1.5 z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              300ms Cryptographic Coupling...
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleNfcSealTapSimulation(order.id)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
                          >
                            <Wifi className="w-4 h-4 animate-bounce" />
                            Pulse Phone NFC Seal (13.56MHz)
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === 'PACKED' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedPrintOrderId(order.id);
                            setActiveTab('print');
                          }}
                          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-[#F97316] border border-[#F97316]/30 rounded text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" /> Load Print Center Label
                        </button>
                        <button
                          onClick={() => handleAdvanceOrderStatus(order.id)}
                          className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                        >
                          Dispatch to Shipping Truck
                        </button>
                      </div>
                    )}

                    {order.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleAdvanceOrderStatus(order.id)}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
                      >
                        Mock OTP Delivery Verification
                      </button>
                    )}

                    {order.status === 'DELIVERED' && (
                      <span className="text-center p-3 bg-emerald-950/40 rounded border border-emerald-500/20 text-[#22D3A0] text-xs font-mono font-semibold block uppercase">
                        Delivered Successfully
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 text-gray-500 font-mono select-none">
              <FileCheck2 className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-xs">SELECT AN ORDER REGISTRY RECORD</p>
              <p className="text-[10px] text-gray-600 max-w-[200px] mt-1">Select from listing on left to view simulated hardware scanning states.</p>
            </div>
          )}
        </div>

      </div>

      {/* Bulk Assign Packer Modal */}
      <AnimatePresence>
        {showBulkAssignModal && (
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
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="text-[#F97316] w-4 h-4" />
                  Bulk Assign Packer
                </h3>
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                >
                  <Search className="w-4 h-4" /> {/* replaced X with Search, or add X to imports if missing */}
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  You are assigning <span className="text-white font-bold font-mono bg-gray-800 px-1.5 py-0.5 rounded">{bulkSelectedOrderIds.length}</span> selected orders to an active warehouse packer operator simultaneously.
                </p>

                <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1.5 uppercase">Select Active Packer</label>
                <select
                  value={bulkAssignTargetPackerId}
                  onChange={e => setBulkAssignTargetPackerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white"
                >
                  <option value="">-- Choose Operator --</option>
                  {workers
                    .filter(w => w.isActive && w.role === 'PACKER')
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.workerId})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setBulkAssignTargetPackerId("");
                  }}
                  className="px-4 py-1.5 text-xs text-gray-400 hover:text-white rounded hover:bg-gray-800 cursor-pointer font-bold font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!bulkAssignTargetPackerId) {
                        addToast("Please select a packer operator", "error");
                        return;
                    }
                    handleBulkAssignPacker(bulkSelectedOrderIds, bulkAssignTargetPackerId);
                    setShowBulkAssignModal(false);
                    setBulkAssignTargetPackerId("");
                    setBulkSelectedOrderIds([]);
                  }}
                  className="px-4 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide cursor-pointer"
                >
                  Confirm Bulk Assign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Shipping Labels Print Preview Modal */}
      <AnimatePresence>
        {showBulkPrintModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111827] border border-[rgba(255,255,255,0.12)] rounded-xl max-w-4xl w-full shadow-2xl p-6 relative flex flex-col gap-5 my-8 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="text-[#F97316] w-5 h-5" />
                  Bulk Shipping Labels Print Preview
                </h3>
                <button
                  onClick={() => setShowBulkPrintModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col md:flex-row gap-6">
                
                {/* Selected List Panel */}
                <div className="flex-1 flex flex-col gap-3 min-w-[280px]">
                  <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider block">
                    Aggregated Queue Selection ({bulkSelectedOrderIds.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {orders
                      .filter(o => bulkSelectedOrderIds.includes(o.id))
                      .map(o => {
                        const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <div key={o.id} className="p-3 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between gap-3 text-xs">
                            <div className="truncate">
                              <div className="font-mono font-bold text-[#F97316]">{o.orderNumber}</div>
                              <div className="text-white font-medium truncate">{o.customerName}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">{totalQty} items · ₹{o.totalRs.toLocaleString('en-IN')}</div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-bold uppercase">
                              {o.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-2 p-3.5 rounded-lg bg-[#1a1c1e] border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[9px] text-gray-400 font-mono block uppercase font-bold mb-1">CONSOLIDATION SUMMARY METRIC:</span>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono mt-1 text-gray-300">
                      <div>
                        <span className="text-gray-500 block text-[10px]">TOTAL ITEMS:</span>
                        <strong className="text-white text-sm font-semibold">
                          {orders
                            .filter(o => bulkSelectedOrderIds.includes(o.id))
                            .reduce((acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0), 0)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">ACCUMULATED VALUE:</span>
                        <strong className="text-[#22D3A0] text-sm font-semibold">
                          ₹{orders
                            .filter(o => bulkSelectedOrderIds.includes(o.id))
                            .reduce((acc, o) => acc + o.totalRs, 0)
                            .toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Preview Panel */}
                <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col gap-4">
                  <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider block">
                    Aggregated PDF Document Sheets Layout (A6 Preview)
                  </span>
                  
                  {/* Live representation of the combined shipping labels */}
                  <div className="flex-1 max-h-[350px] overflow-y-auto p-2 bg-[#0A0F1A] border border-gray-900 rounded-lg flex flex-col gap-5 divide-y divide-gray-800">
                    {orders
                      .filter(o => bulkSelectedOrderIds.includes(o.id))
                      .map((o, idx) => (
                        <div key={o.id} className={`${idx > 0 ? "pt-5" : ""} text-gray-950`}>
                          <div className="bg-white p-4 rounded border-2 border-gray-950 flex flex-col gap-3 font-sans max-w-xs mx-auto text-[10px]">
                            <div className="border-b-2 border-gray-950 pb-1 flex items-start justify-between font-bold text-[9px]">
                              <span className="bg-gray-950 text-white px-1.5 py-0.5 rounded text-[8px] tracking-wide">SMARTDISPATCH</span>
                              <span className="text-red-600 border border-red-300 px-1 py-0.2 rounded font-black">
                                {o.totalRs > 50000 ? 'PRIORITY' : 'STAND'}
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center p-1 bg-gray-100 border border-gray-300 font-mono text-[9px] font-bold">
                              <div className="flex gap-[1px] h-6 bg-transparent">
                                {[2, 1, 3, 1, 2, 2, 4, 1, 3, 2].map((w, index) => (
                                  <div key={index} className="bg-gray-950" style={{ width: `${w * 1.5}px` }} />
                                ))}
                              </div>
                              <span>*{o.orderNumber}*</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[8px] leading-snug">
                              <div>
                                <strong className="text-gray-500 font-medium block">STORE HUB:</strong>
                                <span>SMARTDISPATCH HUB 04</span>
                              </div>
                              <div>
                                <strong className="text-gray-500 font-medium block">RECIPIENT:</strong>
                                <strong className="font-bold">{o.customerName}</strong>
                                <span className="block text-gray-600 truncate">{o.shippingAddress.addressLine1}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)] flex-wrap">
                <button
                  onClick={() => setShowBulkPrintModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white rounded hover:bg-gray-800 cursor-pointer font-bold font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    generateBulkConsolidatedPdfReport();
                    setShowBulkPrintModal(false);
                    addToast(`Combined PDF Report launched successfully!`, 'success');
                  }}
                  className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                >
                  <Printer className="w-4 h-4" />
                  Download Consolidated PDF ({bulkSelectedOrderIds.length} labels)
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
