import React, { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, PlusCircle, Wifi, Smartphone, ArrowRight, 
  QrCode, Barcode, Clock, RefreshCw, X, Printer, 
  CheckCircle2, ShieldCheck 
} from 'lucide-react';
import type { Order, Worker, TelemetryAlert } from '../types';

interface EmulatorPageProps {
  currentTime: string;
  batteryLevel: number;
  isSimLoggedIn: boolean;
  setIsSimLoggedIn: Dispatch<SetStateAction<boolean>>;
  simWorkerId: string;
  setSimWorkerId: Dispatch<SetStateAction<string>>;
  simPin: string;
  setSimPin: Dispatch<SetStateAction<string>>;
  workers: Worker[];
  simSelectedOrderId: string | null;
  setSimSelectedOrderId: Dispatch<SetStateAction<string | null>>;
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
  simActiveItemIndex: number;
  setSimActiveItemIndex: Dispatch<SetStateAction<number>>;
  isQrScannerActive: boolean;
  setIsQrScannerActive: Dispatch<SetStateAction<boolean>>;
  simWeightInput: number;
  setSimWeightInput: Dispatch<SetStateAction<number>>;
  alerts: TelemetryAlert[];
  setAlerts: Dispatch<SetStateAction<TelemetryAlert[]>>;
  activeNfcHandshaking: { orderId: string; targetStatus: 'PACKED' | 'DELIVERED'; statusText: string } | null;
  setActiveNfcHandshaking: Dispatch<SetStateAction<any | null>>;
  isAutoPiloting: boolean;
  runAutoPilotForOrder: (orderId: string) => void;
  handleGeneratePendingOrder: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  playBuzzerSound: () => void;
  simLogs: string[];
  setSimLogs: Dispatch<SetStateAction<string[]>>;
  showNfcPopup: boolean;
  setShowNfcPopup: Dispatch<SetStateAction<boolean>>;
  nfcPopupOrder: Order | null;
  autoPrintEnabled: boolean;
  setAutoPrintEnabled: Dispatch<SetStateAction<boolean>>;
  autoPrintCountdown: number | null;
  setAutoPrintCountdown: Dispatch<SetStateAction<number | null>>;
  printOrientation: 'portrait' | 'landscape';
  setPrintOrientation: Dispatch<SetStateAction<'portrait' | 'landscape'>>;
}

export const EmulatorPage: React.FC<EmulatorPageProps> = ({
  currentTime,
  batteryLevel,
  isSimLoggedIn,
  setIsSimLoggedIn,
  simWorkerId,
  setSimWorkerId,
  simPin,
  setSimPin,
  workers,
  simSelectedOrderId,
  setSimSelectedOrderId,
  orders,
  setOrders,
  simActiveItemIndex,
  setSimActiveItemIndex,
  isQrScannerActive,
  setIsQrScannerActive,
  simWeightInput,
  setSimWeightInput,
  alerts,
  setAlerts,
  activeNfcHandshaking,
  setActiveNfcHandshaking,
  isAutoPiloting,
  runAutoPilotForOrder,
  handleGeneratePendingOrder,
  addToast,
  playBuzzerSound,
  simLogs,
  setSimLogs,
  showNfcPopup,
  setShowNfcPopup,
  nfcPopupOrder,
  autoPrintEnabled,
  setAutoPrintEnabled,
  autoPrintCountdown,
  setAutoPrintCountdown,
  printOrientation,
  setPrintOrientation
}) => {
  return (
    <motion.div
      key="emulator"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      {/* Speed run quickbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F97316]" /> Warehouse Interactive Simulation Workspace
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Use on-demand test inputs to stress test high speed optical and RFID dispatches.</p>
        </div>
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={handleGeneratePendingOrder}
            className="flex-grow md:flex-grow-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-mono transition duration-200 flex items-center justify-center gap-2 cursor-pointer border border-slate-750"
          >
            <PlusCircle className="w-4 h-4 text-[#F97316]" /> Spawn Test Order
          </button>
        </div>
      </div>

      {/* Two Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column A: Virtual Android Device (Left: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3A0] animate-pulse" /> Active Android Emulator
          </span>
          
          {/* Smartphone Housing Frame */}
          <div className="w-full max-w-[340px] h-[610px] bg-[#0E1524] rounded-[42px] border-[5px] border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative p-4 flex flex-col justify-between overflow-hidden">
            
            {/* Top Speaker/Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-700 rounded-b-2xl z-40 flex items-center justify-center gap-2">
              <div className="w-10 h-1 bg-gray-900 rounded-full" />
              <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
            </div>

            {/* Virtual System Notification Bar */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 px-3 pt-3 pb-1 z-30 font-mono">
              <span>{currentTime.substring(11, 16)} GMT</span>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-mono font-semibold">{batteryLevel}%</span>
                  <div className="w-5 h-2.5 border border-gray-500 rounded-[3px] p-[1px] flex items-center relative gap-[1px]">
                    <div 
                      className={`h-full rounded-[1px] transition-all duration-300 ${batteryLevel < 20 ? 'bg-red-500' : 'bg-[#22D3A0]'}`} 
                      style={{ width: `${batteryLevel}%` }} 
                    />
                    <div className="w-[1.5px] h-1 bg-gray-500 rounded-r-[1px] absolute -right-[2px] top-[2px]" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-[#22D3A0]" />
                  <span className="font-bold text-[#F97316]">5G LTE</span>
                </div>
              </div>
            </div>

            {/* Device screen workspace */}
            <div className="flex-1 bg-gray-950 rounded-[28px] overflow-hidden flex flex-col justify-between border border-white/[0.04] p-4 relative">
              
              {/* Sub-view: Login Pin-Pad */}
              {!isSimLoggedIn ? (
                <div className="flex-1 flex flex-col justify-between pt-4">
                  <div className="text-center">
                    <Smartphone className="w-10 h-10 text-[#F97316] mx-auto mb-2" />
                    <h4 className="text-sm font-extrabold text-white">SmartDispatch Log-in</h4>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[180px] mx-auto">Gloves-friendly touchscreen entry credentials.</p>
                  </div>

                  <div className="my-2">
                    <label className="text-[9px] font-bold text-gray-500 uppercase font-mono block mb-1">Select Identity</label>
                    <select 
                      value={simWorkerId} 
                      onChange={(e) => setSimWorkerId(e.target.value)}
                      className="w-full p-2 bg-[#111827] border border-gray-800 text-xs text-white rounded font-mono"
                    >
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-center">
                      <span className="text-base font-bold font-mono tracking-[0.4em] text-white">
                        {simPin.split('').map(() => '*').join('') || <span className="text-gray-600 font-normal text-xs font-sans">Enter Any 4-Digit PIN</span>}
                      </span>
                    </div>

                    {/* Number Gridpad */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                          key={num}
                          onClick={() => simPin.length < 4 && setSimPin(prev => prev + num)}
                          className="py-2 bg-[#111827] hover:bg-slate-800 border border-gray-800 text-white rounded font-mono font-bold active:scale-95 transition-transform cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setSimPin('')}
                        className="py-2 bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/40 rounded font-mono active:scale-95 cursor-pointer"
                      >
                        CLR
                      </button>
                      <button
                        onClick={() => simPin.length < 4 && setSimPin(prev => prev + '0')}
                        className="py-2 bg-[#111827] hover:bg-slate-800 border border-gray-800 text-white rounded font-mono font-bold active:scale-95 cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        onClick={() => {
                          setIsSimLoggedIn(true);
                          addToast(`Simulated Session: Worker access authorized.`, 'success');
                        }}
                        className="py-2 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/40 rounded font-mono active:scale-95 cursor-pointer font-bold"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // If Logged In
                <div className="flex-1 flex flex-col justify-between">
                  
                  {/* Inner Mobile App Nav Bar */}
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-[#F97316]/20 rounded-full flex items-center justify-center">
                        <span className="text-[9px] text-[#F97316] font-bold">W</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white leading-none">
                          {workers.find(w => w.id === simWorkerId)?.name || 'Anish Nair'}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono mt-0.5">{workers.find(w => w.id === simWorkerId)?.workerId || 'WK-04219'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsSimLoggedIn(false);
                        setSimPin('');
                        setSimSelectedOrderId(null);
                      }}
                      className="text-[10px] text-red-400 font-mono hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Log out
                    </button>
                  </div>

                  {/* App Body Screens */}
                  {!simSelectedOrderId ? (
                    // Mobile Dashboard List
                    <div className="flex-1 flex flex-col gap-3 justify-between">
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono mb-2">Assigned Packings Queue</h5>
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {orders.filter(o => ['PENDING', 'ASSIGNED', 'PACKING'].includes(o.status)).length === 0 ? (
                            <div className="text-center py-6 bg-[#111827]/40 rounded border border-dashed border-gray-850">
                              <p className="text-[10px] text-gray-400">All orders fully processed.</p>
                              <button 
                                onClick={handleGeneratePendingOrder}
                                className="mt-2 text-[9px] px-2.5 py-1 bg-[#F97316] text-white font-mono rounded cursor-pointer"
                              >
                                Spawn New Order
                              </button>
                            </div>
                          ) : (
                            orders.filter(o => ['PENDING', 'ASSIGNED', 'PACKING'].includes(o.status)).map(order => (
                              <div 
                                key={order.id}
                                onClick={() => {
                                  setSimSelectedOrderId(order.id);
                                  setSimActiveItemIndex(0);
                                }}
                                className="p-2 bg-[#111827] hover:bg-[#1f293d] border border-gray-800 rounded-lg cursor-pointer transition flex items-center justify-between"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold font-mono text-[#F97316]">{order.orderNumber}</span>
                                  <span className="text-[9px] text-gray-400 mt-0.5">{order.customerName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] px-1 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded font-mono font-bold">
                                    {order.status}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-950/10 border border-emerald-500/10 rounded-lg">
                        <span className="text-[10px] font-bold text-[#22D3A0] block font-mono">STREAK INCENTIVES</span>
                        <p className="text-[9px] text-gray-400 mt-1">Pack 2 more packages accurately within error specs to secure your daily premium dispatch bonus!</p>
                      </div>
                    </div>
                  ) : (
                    // Detailed Scanning Screen
                    (() => {
                      const activeOrder = orders.find(o => o.id === simSelectedOrderId);
                      if (!activeOrder) {
                        setSimSelectedOrderId(null);
                        return null;
                      }

                      const itemToVerify = activeOrder.items[simActiveItemIndex];
                      const isAllVerified = activeOrder.items.every(i => i.ocrVerified && i.visionVerified && i.weightVerified);

                      return (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 mb-2 p-1 bg-gray-900 rounded">
                            <button
                              onClick={() => setSimSelectedOrderId(null)}
                              className="text-[9px] text-gray-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer bg-transparent border-none"
                            >
                              ← Back
                            </button>
                            <span className="text-[10px] text-gray-400 font-semibold font-mono">{activeOrder.orderNumber}</span>
                          </div>

                          {!isAllVerified ? (
                            // Live Scan Simulation Layout
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Verifying Item {simActiveItemIndex + 1}/{activeOrder.items.length}</span>
                                <span className="text-xs font-bold text-white truncate mt-0.5">{itemToVerify?.productName}</span>
                                <span className="text-[9px] font-mono text-gray-500">Target SKU: {itemToVerify?.sku}</span>
                              </div>

                              {/* Virtual Camera Viewfinder */}
                              <div className="w-full h-24 bg-[#111827] border border-gray-800 rounded-lg relative overflow-hidden flex flex-col items-center justify-center">
                                {/* Camera viewfinder grids */}
                                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#F97316]" />
                                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#F97316]" />
                                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#F97316]" />
                                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#F97316]" />
                                
                                {/* Scanner bar pulse */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-400 animate-pulse opacity-80" />

                                {isQrScannerActive ? (
                                  <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center gap-1 z-10">
                                    <QrCode className="w-8 h-8 text-emerald-400 animate-pulse" />
                                    <span className="text-[8px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">QR SCANNER ACTIVE</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Holographic item display */}
                                    <Barcode className="w-6 h-6 text-white/25 mb-1" />
                                    <span className="text-[8px] font-mono text-gray-400 select-none">ALIGN FOR INTEGRATED SCAN</span>
                                  </>
                                )}
                              </div>

                              {/* Verified checklist indicators */}
                              <div className="grid grid-cols-3 gap-1">
                                <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.ocrVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                  <span className="font-bold block">OCR SKU</span>
                                  <span>{itemToVerify?.ocrVerified ? 'PASS ✓' : 'PENDING'}</span>
                                </div>
                                <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.visionVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                  <span className="font-bold block">COLOR RGB</span>
                                  <span>{itemToVerify?.visionVerified ? 'PASS ✓' : 'PENDING'}</span>
                                </div>
                                <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.weightVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                  <span className="font-bold block">WEIGHT BEAM</span>
                                  <span>{itemToVerify?.weightVerified ? 'PASS ✓' : 'PENDING'}</span>
                                </div>
                              </div>

                              {/* Interactive Simulation Buttons on device */}
                              <div className="flex flex-col gap-1 text-[10px]">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    onClick={() => {
                                      setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                        ...o, status: 'PACKING', items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, ocrVerified: true } : it)
                                      } : o));
                                      addToast('OCR scan decoded matching SKU code perfectly!', 'success');
                                    }}
                                    className="py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/35 text-white rounded font-mono font-bold cursor-pointer text-left px-2 text-[9px] flex items-center justify-between"
                                  >
                                    <span>Simulate Barcode</span>
                                    <Barcode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (isQrScannerActive) return;
                                      setIsQrScannerActive(true);
                                      playBuzzerSound();
                                      addToast("Initiating camera-based QR code verification check...", "info");
                                      
                                      setTimeout(() => {
                                        setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                          ...o, status: 'PACKING', qrVerified: true, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, ocrVerified: true } : it)
                                        } : o));
                                        setIsQrScannerActive(false);
                                        addToast('QR Code verification success: incoming item registered!', 'success');
                                      }, 1500);
                                    }}
                                    className="verify-qr-btn py-1.5 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/35 text-blue-200 rounded font-mono font-bold cursor-pointer text-left px-2 text-[9px] flex items-center justify-between transition duration-150"
                                  >
                                    <span>Verify QR Scanner</span>
                                    <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                      ...o, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, visionVerified: true } : it)
                                    } : o));
                                    addToast('Vision camera aligned silver/charcoal casing chromatic hue!', 'success');
                                  }}
                                  className="w-full py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/30 text-white rounded font-mono font-bold cursor-pointer text-left px-2"
                                >
                                  2. Simulate RGB Casing Verify
                                </button>
                                <div className="p-1.5 bg-gray-900 border border-gray-850 rounded">
                                  <div className="flex items-center justify-between text-[9px] mb-1">
                                    <span className="text-gray-400 font-mono">Dynamic weight input:</span>
                                    <span className="font-mono text-white text-right">{simWeightInput.toFixed(2)} kg</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        // Trigger alarm sequence if weight is too high/low
                                        const correctWeightRange = 1.5;
                                        const tolerance = 0.15;
                                        const diff = Math.abs(simWeightInput - correctWeightRange);
                                        
                                        if (diff > tolerance) {
                                          // Create high severity physical alarm
                                          const newAlertId = `al-${Date.now()}`;
                                          const newAlert: TelemetryAlert = {
                                            id: newAlertId,
                                            severity: 'CRITICAL',
                                            alertType: 'WEIGHT_FAIL',
                                            orderId: activeOrder.id,
                                            orderNumber: activeOrder.orderNumber,
                                            workerName: workers.find(w => w.id === simWorkerId)?.name || 'Anish Nair',
                                            detail: `Physical weight variance violation: Measured weight is ${(simWeightInput).toFixed(2)} kg (Expected: ${correctWeightRange} kg).`,
                                            isResolved: false,
                                            createdAt: new Date().toISOString()
                                          };
                                          setAlerts(prev => [newAlert, ...prev]);
                                          addToast('ALARM TRIGGERED: Scale container weight discrepancy!', 'error');
                                        } else {
                                          setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                            ...o, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, weightVerified: true } : it)
                                          } : o));
                                          addToast('Packer box weight verified accurately.', 'success');
                                        }
                                      }}
                                      className="flex-1 py-1 bg-blue-900/30 text-blue-300 border border-blue-800/30 rounded font-mono text-[9px] cursor-pointer"
                                    >
                                      Compare against limits
                                    </button>
                                    <button
                                      onClick={() => setSimWeightInput(1.5)}
                                      className="px-2 py-1 bg-gray-950 text-gray-400 hover:text-white rounded font-mono text-[9px] border border-gray-800 cursor-pointer"
                                    >
                                      Standardize
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // All checked! Wait for digital NFC write
                            <div className="flex-1 flex flex-col justify-center text-center gap-3 py-4 relative overflow-hidden">
                              <div className="relative mx-auto my-3 w-20 h-20 flex items-center justify-center">
                                {/* Nested Electromagnetic Waves & Radio Frequency Fields Coupling Waves */}
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-[#22D3A0]/5 border border-[#22D3A0]/30"
                                  animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                />
                                <motion.div
                                  className="absolute inset-2 rounded-full bg-[#22D3A0]/10 border border-[#22D3A0]/20"
                                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                  transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
                                />
                                <motion.div
                                  className="absolute inset-4 rounded-full bg-[#22D3A0]/15 border border-[#22D3A0]/10"
                                  animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                                  transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
                                />
                                
                                {/* Physical Core Rotating Chip Antennas */}
                                <motion.div 
                                  className="absolute inset-1 border-2 border-dashed border-[#22D3A0]/30 rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Wifi / Telemetry Center Tag */}
                                <div className="w-12 h-12 rounded-full bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center z-10 relative shadow-[0_0_15px_rgba(34,211,160,0.2)]">
                                  <Wifi className="w-5 h-5 text-[#22D3A0]" />
                                </div>
                              </div>
                              
                              <div className="z-10">
                                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3A0] animate-ping" />
                                  Sensors Approved ✓
                                </h5>
                                <p className="text-[9.5px] text-gray-400 mt-1 leading-normal max-w-[220px] mx-auto font-sans">
                                  SKU & gross weight specifications successfully secured. Tap the mobile receiver to bind the cryptographic proof into the physical box NFC RFID coin tag.
                                </p>
                              </div>

                              {activeOrder.status !== 'PACKED' ? (
                                <motion.button
                                  onClick={() => {
                                    if (activeNfcHandshaking) return;
                                    setActiveNfcHandshaking({
                                      orderId: simSelectedOrderId!,
                                      targetStatus: 'PACKED',
                                      statusText: 'Synchronizing NDEF container with 13.56 MHz RFID receiver...'
                                    });

                                    setTimeout(() => {
                                      setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                        ...o, status: 'PACKED', nfcSealedAt: new Date().toISOString()
                                      } : o));
                                      playBuzzerSound();
                                      addToast('RFID/NFC physical tag secured & linked with decentralized ledger.', 'success');
                                      setActiveNfcHandshaking(null);
                                    }, 450);
                                  }}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.96 }}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold font-mono tracking-wider text-white rounded-lg text-[10px] cursor-pointer border-none shadow-[0_4px_12px_rgba(16,185,129,0.25)] z-10 flex items-center justify-center gap-1.5"
                                >
                                  <span>🔋 Tap simulated NFC tag</span>
                                </motion.button>
                              ) : (
                                <div className="p-2.5 bg-emerald-950/20 rounded border border-emerald-500/20 flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between text-[9px] font-mono leading-none">
                                    <span className="text-emerald-400">LEDGER:</span>
                                    <span className="text-emerald-300 font-bold">NFC RFID BIND COMPLETE</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (activeNfcHandshaking) return;
                                      setActiveNfcHandshaking({
                                        orderId: simSelectedOrderId!,
                                        targetStatus: 'DELIVERED',
                                        statusText: 'Broadcasting cryptographic proof to local transport nodes...'
                                      });

                                      setTimeout(() => {
                                        setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                          ...o, status: 'DELIVERED', updatedAt: new Date().toISOString()
                                        } : o));
                                        playBuzzerSound();
                                        addToast('Secure delivery dispatch sequence complete.', 'success');
                                        setActiveNfcHandshaking(null);
                                        setSimSelectedOrderId(null);
                                      }, 450);
                                    }}
                                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-mono cursor-pointer border-none"
                                  >
                                    Simulate House Handover (OTP Match)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* GORGEOUS HOLOGRAPHIC NFC RE-COUPLING HANDSHAKE OVERLAY */}
              <AnimatePresence>
                {activeNfcHandshaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 bg-[#090F1E]/95 border border-[rgba(255,255,255,0.08)] rounded-[26px] z-50 flex flex-col items-center justify-center p-6 text-center"
                  >
                    {/* Cosmic Radar Concentric Ripples */}
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      {/* Glowing radio wave pulses */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-500/5 border border-cyan-500/20"
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-4 rounded-full bg-cyan-500/10 border border-cyan-500/15"
                        animate={{ scale: [1, 2.0], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-8 rounded-full bg-cyan-500/15 border border-cyan-500/10"
                        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      
                      {/* 300ms Handshake coupling spinner rotating antenna */}
                      <motion.div
                        className="absolute inset-2 border border-dashed border-cyan-500/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />

                      {/* Rotating signal bars or dots */}
                      <motion.div
                        className="absolute w-24 h-24 border-2 border-[rgba(6,182,212,0.1)] border-t-cyan-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Core Floating Device Badge */}
                      <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                        <motion.div
                          animate={{ scale: [0.92, 1.08, 0.92] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          <Smartphone className="w-7 h-7 text-cyan-400" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Signal Strength bar values */}
                    <div className="flex gap-1.5 items-center justify-center mb-5 font-mono text-[9px] bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>13.56 MHz COUPLING DECLARED</span>
                    </div>

                    <h4 className="text-sm font-black font-mono uppercase text-white tracking-widest mb-2">
                      {activeNfcHandshaking.targetStatus === 'PACKED' ? 'Securing RFID Seal' : 'Verifying Handover'}
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans font-medium px-2">
                      {activeNfcHandshaking.statusText}
                    </p>
                    
                    {/* Scanning telemetry logs */}
                    <div className="mt-6 w-full bg-gray-950/80 border border-white/[0.05] p-2 rounded-lg text-[8.5px] font-mono text-left text-gray-500 flex flex-col gap-0.5 max-h-[60px] overflow-hidden">
                      <div className="text-cyan-400/80 flex items-center justify-between">
                        <span>TX COUPLING STATUS:</span>
                        <span className="font-bold">CONNECTING</span>
                      </div>
                      <div className="text-emerald-400/80 flex items-center justify-between">
                        <span>SECURE LEDGER:</span>
                        <span className="font-bold">SYNC ACTIVE</span>
                      </div>
                      <div className="text-gray-600 flex items-center justify-between animate-pulse">
                        <span>SIGNING CRYPTO HASH...</span>
                        <span className="font-bold">300ms</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Smartphone Home Bar */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2 z-35" />
          </div>
        </div>

        {/* Column B: Terminal Logs, Auto-Pilot Panel & Metrics (Right: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Automated Speed Run Card container */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3">Auto-Pilot Dispatch Speed Runner</h4>
            <p className="text-xs text-gray-400 leading-normal mb-4">
              Choose any order from the database and trigger our high-speed, automated execution pipeline. This fast-forwards through matching worker assignments, OCR SKU verifications, thermal layout printing, smart physical weighing, RFID sealing, and delivery verification OTP matches.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <select
                  disabled={isAutoPiloting}
                  value={simSelectedOrderId || ''}
                  onChange={(e) => setSimSelectedOrderId(e.target.value || null)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg font-mono focus:outline-none"
                >
                  <option value="">-- Choose Order to Auto-Pilot --</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName} [{order.status}]
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (!simSelectedOrderId) {
                    addToast('Please select an order above, or spawn a test order to auto-pilot.', 'info');
                    return;
                  }
                  runAutoPilotForOrder(simSelectedOrderId);
                }}
                disabled={isAutoPiloting || !simSelectedOrderId}
                className="py-2.5 px-4 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-800 disabled:text-gray-500 font-bold font-mono text-xs rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-white border-none"
              >
                {isAutoPiloting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" /> Speed-Running
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> ⚡ Trigger Auto-Pilot Dispatch
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Weight telemetry playground simulator */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-1">Calibration Laboratory</h4>
              <p className="text-[11px] text-gray-503 font-mono">Calibrate weigh scale beam limits to trigger active alarms:</p>
            </div>
            
            <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-900 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Standard criteria load size:</span>
                <span className="text-white font-bold">1.50 kg (±0.15 kg tolerance limit)</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Current Simulation Beam Weight State:</span>
                  <span className={`font-mono font-bold ${Math.abs(simWeightInput - 1.5) > 0.15 ? 'text-red-450 font-bold' : 'text-[#22D3A0]'}`}>
                    {simWeightInput.toFixed(2)} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.05"
                  value={simWeightInput}
                  onChange={(e) => setSimWeightInput(parseFloat(e.target.value))}
                  className="w-full accent-[#F97316] bg-gray-900 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5 select-none">
                  <span>0.50kg (Too light)</span>
                  <span className="text-[#22D3A0]">1.50kg (Standard)</span>
                  <span>4.00kg (Overweight variance alert)</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-gray-950 border border-white/[0.02] text-[10px] text-gray-400 leading-relaxed font-mono">
                {Math.abs(simWeightInput - 1.5) > 0.15 ? (
                  <span className="text-red-400 block font-bold">⚠️ THRESHOLD BREACH EXCEEDED! If physical comparison scan runs now, a "WEIGHT_FAIL" Alarm is immediately dispatched to supervisor ledger.</span>
                ) : (
                  <span className="text-[#22D3A0] block">✓ Scale beam calibrated correctly. Sensors will approve container payload instantly.</span>
                )}
              </div>
            </div>
          </div>

          {/* Real-time emulator activity logs console terminal */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Live Simulation Log Console</h4>
              <button
                onClick={() => setSimLogs([])}
                className="text-[10px] text-gray-500 hover:text-white font-mono uppercase bg-gray-950 px-2 py-0.5 rounded cursor-pointer border border-gray-800"
              >
                Clear terminal
              </button>
            </div>

            <div className="h-44 bg-black rounded-lg p-3 font-mono text-[10px] overflow-y-auto flex flex-col gap-1 select-all border border-gray-900">
              {simLogs.length === 0 ? (
                <div className="text-gray-600 italic">No output logged. Interact with the Android Emulator or click "⚡ Trigger Auto-Pilot Dispatch" to see live cryptographic steps log here...</div>
              ) : (
                simLogs.map((logStr, lIdx) => (
                  <div key={lIdx} className="text-[#22D3A0] leading-normal whitespace-pre-line tracking-wide">
                    {logStr}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* SMART DISPATCH LABELS POPUP (NFC SEAL INSTANT PRINT) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showNfcPopup && nfcPopupOrder && (
          <motion.div
            key="nfc-print-dispatch-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#090D16]/95 border-2 border-[#22D3A0]/30 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(34,211,160,0.15)] relative flex flex-col md:flex-row gap-8 text-[#F1F5F9]"
            >
              {/* Holographic Signal Effects */}
              <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#22D3A0] to-teal-500 rounded-t-2xl" />
              
              {/* Cancel button */}
              <button
                onClick={() => {
                  setShowNfcPopup(false);
                  setAutoPrintCountdown(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 p-2 rounded-full cursor-pointer transition border border-gray-700/50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* LEFT CONTEXT PANEL - Real-time telemetry, barcodes, status and configuration */}
              <div className="flex-1 flex flex-col justify-between gap-6 md:max-w-xs font-sans">
                
                {/* Status Banner */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22D3A0] animate-ping" />
                    <span className="text-[10px] font-bold text-[#22D3A0] uppercase font-mono tracking-wider">RF 13.56 MHz SEAL ESTABLISHED</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
                    Physical NFC Seal Bind Completed!
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Encrypted cryptographic hash successfully written to RFID box sticker tags for high-security tracking.
                  </p>
                </div>

                {/* Smart automated printing parameters toggle */}
                <div className="p-4 bg-gray-950/60 border border-white/[0.05] rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Auto-Print Thermal</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${autoPrintEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-550'}`}>
                      {autoPrintEnabled ? 'ACTIVE-CONVEYOR' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-left">
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Automatically trigger A6 printer within 3 seconds of a secure sensory NFC package sealing.
                    </p>
                    
                    <button
                      onClick={() => {
                        const nextVal = !autoPrintEnabled;
                        setAutoPrintEnabled(nextVal);
                        if (!nextVal) setAutoPrintCountdown(null);
                        else setAutoPrintCountdown(3);
                        addToast(nextVal ? 'Automation enabled. Countdown initiated.' : 'Automation disabled. Manual touch required.', 'info');
                      }}
                      className={`w-11 h-6 rounded-full p-1 transition duration-150 relative cursor-pointer outline-none border-none shrink-0 ${autoPrintEnabled ? 'bg-[#22D3A0]' : 'bg-gray-800'}`}
                    >
                      <div className={`w-4 h-4 bg-[#0F172A] rounded-full shadow-md transition duration-155 absolute top-1 ${autoPrintEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Countdown indicator */}
                  {autoPrintCountdown !== null && (
                    <div className="p-2.5 bg-emerald-950/20 text-emerald-400 font-mono text-[11px] rounded border border-emerald-500/10 flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Countdown: {autoPrintCountdown}s
                      </span>
                      <span className="animate-pulse">PRINTER ENGAGED</span>
                    </div>
                  )}
                </div>

                {/* Manual touch-screen quick prints */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setAutoPrintCountdown(null);
                      setOrders(prev =>
                        prev.map(o => (o.id === nfcPopupOrder.id ? { ...o, printedAt: new Date().toISOString() } : o))
                      );
                      // Open the printing system manually
                      playBuzzerSound();
                      window.print();
                      addToast(`Manual label print job dispatched for ${nfcPopupOrder.orderNumber}!`, 'success');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#EA580C] hover:to-orange-500 text-white font-extrabold font-mono text-xs rounded-xl transition duration-200 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer border-none uppercase tracking-wide"
                  >
                    <Printer className="w-4 h-4" /> One-Touch Safe Print
                  </button>

                  <button
                    onClick={() => {
                      setShowNfcPopup(false);
                      setAutoPrintCountdown(null);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold font-mono text-xs rounded-xl transition duration-200 cursor-pointer border border-slate-700/55 text-center"
                  >
                    Bypass and Load Next Order
                  </button>
                </div>

              </div>

              {/* RIGHT THERMAL CARD PANEL - Standards compliant A6 Label design preview */}
              <div className="flex-grow flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">PRO DIGITAL-TWIN PRINT-COPY PREVIEW</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const nextOrientation = printOrientation === 'portrait' ? 'landscape' : 'portrait';
                        setPrintOrientation(nextOrientation);
                        addToast(`Feed direction set to ${nextOrientation.toUpperCase()} for thermal printers`, 'info');
                      }}
                      className="rotate-print-btn px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-lg text-[10px] font-mono font-bold transition duration-150 flex items-center gap-1.5 cursor-pointer border border-slate-700/65"
                    >
                      <RefreshCw className="w-3 h-3 text-[#F97316]" />
                      <span>Rotate Print ({printOrientation.toUpperCase()})</span>
                    </button>
                    <span className="text-xs text-gray-400">Standard A6 Formatting</span>
                  </div>
                </div>

                {/* Real Physical Printable Card Frame */}
                <div className={`printable-label-wrapper bg-white text-gray-950 p-6 rounded-xl w-full mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-slate-900 flex flex-col gap-4 font-sans select-text relative transition-all duration-500 ease-in-out ${printOrientation === 'landscape' ? 'max-w-2xl aspect-[1.414]' : 'max-w-[420px] aspect-[0.707]'}`}>
                  
                  {/* QR Verified Badge Indicator */}
                  {nfcPopupOrder.qrVerified && (
                    <div className="absolute top-3 right-3 z-30 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-mono font-black py-1 px-2.5 rounded-md shadow-[0_4px_12px_rgba(16,185,129,0.30)] animate-pulse flex items-center gap-1 leading-none">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QR VERIFIED</span>
                    </div>
                  )}

                  {/* Watermark badge style visual */}
                  <div className="absolute top-[40%] right-6 w-24 h-24 rounded-full border-4 border-emerald-600/15 flex items-center justify-center p-1 select-none pointer-events-none rotate-12 bg-transparent">
                    <span className="text-[10px] font-black text-emerald-700/25 tracking-tighter text-center leading-none uppercase">APPROVED<br />RFID SEALED<br />SECURE</span>
                  </div>

                  {/* Label Header */}
                  <div className="border-b-4 border-gray-950 pb-3 flex items-start justify-between">
                    <div>
                      <span className="text-xs tracking-wider font-extrabold uppercase bg-gray-950 text-white px-2.5 py-0.5 rounded">SMARTDISPATCH</span>
                      <span className="text-[9px] text-gray-500 font-mono block mt-1 tracking-widest font-black">STATIONARY THERMAL DISPATCH</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 bg-gray-900 text-white rounded shadow-sm inline-block`}>
                        {nfcPopupOrder.totalRs > 50000 ? 'PRIORITY URGENT' : 'STANDARD EXPRESS'}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono block mt-1">DOCK BAY STATION 4</span>
                    </div>
                  </div>

                  {/* Integrated Barcode & QR Code Section */}
                  <div className="grid grid-cols-12 gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                    
                    {/* Barcode section (left 8 cols) */}
                    <div className="col-span-8 flex flex-col items-center justify-center border-r border-gray-300 pr-3">
                      {/* Realistic multi-line vector barcode representation */}
                      <div className="flex gap-[1.5px] items-stretch h-12 bg-transparent w-full">
                        {[3, 1, 4, 1, 5, 2, 6, 2, 7, 1, 8, 3, 4, 1, 2, 1, 5, 3, 2, 4, 1, 2, 1, 5, 1, 8, 3, 1].map((w, index) => (
                          <div key={index} className="bg-gray-950 flex-grow" style={{ minWidth: `${w}px` }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-extrabold mt-1.5 tracking-wider text-gray-800">
                        *{nfcPopupOrder.orderNumber.replace('ORD-', 'SKUID-')}*
                      </span>
                    </div>

                    {/* QR Code Section (right 4 cols) */}
                    <div className="col-span-4 flex flex-col items-center justify-center pl-2">
                      {/* High details simulated SVG QR Code representing order track payload */}
                      <div className="w-12 h-12 bg-[#0F172A] p-1 rounded flex flex-wrap content-between justify-between">
                        <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                        <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                        
                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />

                        <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                        <div className="w-3.5 h-3.5 border border-[#22D3A0] rounded-[1px] flex items-center justify-center">
                          <div className="w-1 h-1 bg-[#22D3A0] rounded-full" />
                        </div>
                      </div>
                      <span className="text-[7.5px] font-mono font-bold mt-1 text-gray-500 uppercase">SYS_TRACK</span>
                    </div>

                  </div>

                  {/* Sender and Recipient Coordinates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    
                    {/* Left: Dispatch parameters */}
                    <div className="border-r border-gray-300 pr-2">
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-0.5 uppercase font-mono">FROM DIRECTORY RAIL:</span>
                      <span className="font-extrabold text-gray-900 block">SMARTDISPATCH HUB 04</span>
                      <span className="text-gray-600 block leading-normal text-[11px] mt-0.5 font-medium">
                        Sector 12 Outer Ring Rd,<br />HSR Layout Area Phase 2,<br />Bengaluru, KA 560102
                      </span>
                    </div>

                    {/* Right: Recipient coordinates */}
                    <div className="pl-1">
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-0.5 uppercase font-mono">TO RECIPIENT COORD:</span>
                      <span className="font-extrabold text-gray-900 block text-[13px]">{nfcPopupOrder.customerName}</span>
                      <span className="text-gray-700 block text-[11px] leading-tight font-medium mt-0.5 font-sans">
                        {nfcPopupOrder.shippingAddress.addressLine1},<br />
                        {nfcPopupOrder.shippingAddress.addressLine2},<br />
                        {nfcPopupOrder.shippingAddress.city}, {nfcPopupOrder.shippingAddress.pinCode}
                      </span>
                      <span className="text-gray-900 font-mono text-[11px] font-black block mt-1.5">
                        CONTACT: {nfcPopupOrder.shippingAddress.phone}
                      </span>
                    </div>

                  </div>

                  {/* Items consolidation table */}
                  <div className="border-t border-b border-gray-950 py-2.5">
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-1.5 uppercase font-mono">CONSOLIDATING SPECIFICATIONS:</span>
                    
                    {/* SCREEN PREVIEW VIEW - Displays requested items details including 1.6kg mass and verification */}
                    <table className="w-full text-left text-xs font-sans print:hidden">
                      <thead>
                        <tr className="border-b border-gray-450 text-gray-550 select-none text-[8.5px] font-bold uppercase">
                          <th className="py-1">ITEM SPECIFICATION (PRODUCT & SKU)</th>
                          <th className="py-1 text-right">VERIFIED MASS (SAFETY CHECK)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {nfcPopupOrder.items.slice(0, 2).map(pItem => (
                          <tr key={pItem.id} className="font-sans">
                            <td className="py-2 text-left">
                              <span className="font-bold block text-gray-950 leading-tight">{pItem.productName}</span>
                              <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">{pItem.sku}</span>
                            </td>
                            <td className="py-2 text-right">
                              <span className="inline-block bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md font-extrabold text-xs">
                                ⚖ 1.6kg PASSED
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* PHYSICAL PRINT SECURE VIEW - Rendered only when printed to prevent brand identification/theft risks */}
                    <div className="hidden print:block p-3.5 border-2 border-dashed border-gray-950 bg-gray-50 rounded-xl text-center font-mono my-1">
                      <div className="flex items-center justify-center gap-1.5 mb-1.5 text-gray-900">
                        <span className="text-[10px] font-black uppercase tracking-wider">🔒 SECURED DOUBLE-TWIN CARGO SHIELD</span>
                      </div>
                      <p className="text-[9.5px] text-gray-700 leading-normal font-sans font-medium">
                        Itemized merchant nomenclature and barcode catalog maps are concealed under transport authority guidelines to prevent routing-stage cargo division & theft.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-300 text-left">
                        <div>
                          <span className="text-[8px] text-gray-500 block font-bold">DECLARED CARGO MASS:</span>
                          <span className="text-[12px] font-black text-gray-950">5.85 kg Bulk Net</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-gray-500 block font-bold">RFID SEAL STATE:</span>
                          <span className="text-[11px] font-black text-emerald-800 uppercase">ACTIVE SEALED ✓</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Calibration values */}
                  <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono">
                    <div>
                      <span>TOTAL REGISTERED MASS: </span>
                      <strong className="text-gray-950 font-bold">5.85 kg total</strong>
                    </div>
                    <div>
                      <span>OPERATOR KEY: </span>
                      <strong className="text-gray-950 font-bold">WK-04219</strong>
                    </div>
                  </div>

                  {/* Assurance Stamp */}
                  <div className="flex items-center gap-2 border-t border-gray-200 pt-3 text-[10px] text-gray-500 leading-relaxed font-mono">
                    <div className="flex flex-col flex-grow text-left">
                      <span className="font-bold flex items-center gap-1 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> SECURE SEAL CONFIRMED (13.56 MHz RFID)
                      </span>
                      <span className="mt-0.5 text-[9px] block">Cryptographic hash UID written securely on physical parcel tag labels.</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-[3px] border-emerald-600/40 p-0.5 flex items-center justify-center select-none rotate-12 shrink-0 bg-transparent">
                      <span className="text-[7px] font-black text-emerald-700 tracking-tight text-center leading-none uppercase">AUTOMATED<br />DISPATCH<br />APPROVED</span>
                    </div>
                  </div>

                  {/* Dynamic System Timestamp of Print Request */}
                  <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between text-[8px] text-gray-400 font-mono">
                    <span className="tracking-wider uppercase">SECURE THERMAL TAG GENERATION ENGINE</span>
                    <span className="font-bold text-gray-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#F97316]" />
                      TS: {currentTime}
                    </span>
                  </div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
