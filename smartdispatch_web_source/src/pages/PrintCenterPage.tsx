import React from 'react';
import { motion } from 'framer-motion';
import { Printer, Wifi, Save, Edit2, CheckCircle2 } from 'lucide-react';
import type { Order } from '../types';

interface PrintCenterPageProps {
  orders: Order[];
  handlePrintAllReadyLabels: () => void;
  printQueueFilter: 'all' | 'ready' | 'packing' | 'printed';
  setPrintQueueFilter: (filter: 'all' | 'ready' | 'packing' | 'printed') => void;
  selectedPrintOrderId: string | null;
  setSelectedPrintOrderId: (id: string | null) => void;
  isEditLabelMode: boolean;
  setIsEditLabelMode: (b: boolean) => void;
  handleSaveLabelEdits: (orderId: string) => void;
  editLabelData: any;
  setEditLabelData: React.Dispatch<React.SetStateAction<any>>;
  handleMarkPrinted: (orderId: string) => void;
  activeNfcHandshaking: any;
  handleNfcSealTapSimulation: (orderId: string) => void;
}

export const PrintCenterPage: React.FC<PrintCenterPageProps> = ({
  orders,
  handlePrintAllReadyLabels,
  printQueueFilter,
  setPrintQueueFilter,
  selectedPrintOrderId,
  setSelectedPrintOrderId,
  isEditLabelMode,
  setIsEditLabelMode,
  handleSaveLabelEdits,
  editLabelData,
  setEditLabelData,
  handleMarkPrinted,
  activeNfcHandshaking,
  handleNfcSealTapSimulation
}) => {
  return (
    <motion.div
      key="print"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-5"
    >
      
      {/* Dynamic Queue Print Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)]">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="text-amber-500 w-4 h-4" />
            Automated Thermal Label Dispatch Queue
          </h3>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
            Total Packed Orders Ready for Carrier Handover: <span className="text-[#22D3A0] font-bold">{orders.filter(o => o.status === 'PACKED').length}</span>
          </p>
        </div>
        <button
          onClick={handlePrintAllReadyLabels}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-[#EA580C] hover:to-[#C2410C] text-white font-mono text-xs font-bold rounded-lg transition-transform duration-150 active:scale-95 flex items-center gap-2 shadow-[0_4px_12px_rgba(234,88,12,0.18)] self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print All Ready Labels (Packed)
        </button>
      </div>

      {/* Three-panel grid matching the specification exactly */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ═══ LEFT PANEL ═══ Print Queue */}
        <div className="xl:col-span-3 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider block">PACKAGING QUEUE</span>
            <h3 className="text-sm font-bold text-white mt-0.5">Shipping Queue</h3>
          </div>

          {/* Filter selector */}
          <div className="grid grid-cols-4 p-1.5 bg-gray-950/60 border-b border-[rgba(255,255,255,0.05)] text-[10px] font-mono">
            {(['all', 'ready', 'packing', 'printed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setPrintQueueFilter(f)}
                className={`py-1 rounded text-center uppercase font-bold transition duration-150 cursor-pointer ${
                  printQueueFilter === f ? 'bg-[#F97316] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Queue List */}
          <div className="flex flex-col max-h-[500px] overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
            {orders
              .filter(o => {
                if (printQueueFilter === 'all') return true;
                if (printQueueFilter === 'ready') return o.status === 'PACKED' && !o.printedAt;
                if (printQueueFilter === 'packing') return ['ASSIGNED', 'PACKING', 'VERIFIED'].includes(o.status);
                if (printQueueFilter === 'printed') return o.printedAt != null;
                return true;
              })
              .map(o => {
                const isSelectedRef = selectedPrintOrderId === o.id;
                const isUrgent = o.totalRs > 50000;
                return (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedPrintOrderId(o.id);
                      setIsEditLabelMode(false);
                    }}
                    className={`p-3.5 text-left border-l-4 transition-all cursor-pointer ${
                      isSelectedRef ? 'bg-orange-500/10 border-l-[#F97316]' : 'hover:bg-gray-800/15 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#F97316]">{o.orderNumber}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-[#EF4444]' : 'bg-[#22D3A0]'}`} title={isUrgent ? 'Urgent Value' : 'Normal Priority'} />
                    </div>
                    <span className="text-xs font-semibold text-white block mt-1">{o.customerName}</span>
                    
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-2">
                      <span>{o.items.length} SKUs</span>
                      <span>·</span>
                      <span>{o.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono">
                      {o.nfcSealedAt ? (
                        <span className="text-emerald-400 inline-flex items-center gap-1">
                          <Wifi className="w-3 h-3 rotate-90" /> NFC Sealed
                        </span>
                      ) : (
                        <span className="text-amber-500 uppercase">Wait Seal...</span>
                      )}

                      {o.printedAt ? (
                        <span className="text-gray-500">Printed</span>
                      ) : (
                        <span className="bg-amber-950/60 text-amber-500 px-1.5 py-0.5 rounded">READY PRINT</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ═══ CENTRE PANEL ═══ Label Preview */}
        <div className="xl:col-span-6 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 flex flex-col gap-4">
          
          {/* Toolbar */}
          {(() => {
            const orderItem = orders.find(o => o.id === selectedPrintOrderId);
            if (!orderItem) return <p className="text-xs text-gray-500 mt-10 text-center font-mono">No order selected in queue</p>;
            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4 gap-3">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-mono block">ACTIVE PREVIEW</span>
                    <span className="text-sm font-bold text-white font-mono">{orderItem.orderNumber} ({orderItem.customerName})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditLabelMode ? (
                      <>
                        <button
                          onClick={() => handleSaveLabelEdits(orderItem.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Specs
                        </button>
                        <button
                          onClick={() => setIsEditLabelMode(false)}
                          className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded text-xs font-bold font-mono tracking-wide cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditLabelMode(true)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Template
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleMarkPrinted(orderItem.id);
                        window.print();
                      }}
                      className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Standard A6
                    </button>
                  </div>
                </div>

                {/* Physical Print Copy standard A6 card */}
                <div className="bg-white text-gray-950 p-6 rounded-lg max-w-sm sm:max-w-md w-full mx-auto shadow-2xl border-2 border-gray-900 flex flex-col gap-4 font-sans select-text relative">
                  
                  {/* QR Verified Badge Indicator */}
                  {orderItem.qrVerified && (
                    <div className="absolute top-3 right-3 z-30 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-mono font-black py-1 px-2.5 rounded-md shadow-[0_4px_12px_rgba(16,185,129,0.30)] animate-pulse flex items-center gap-1 leading-none">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QR VERIFIED</span>
                    </div>
                  )}

                  {/* Heading label bar Header */}
                  <div className="border-b-4 border-gray-900 pb-3 flex items-start justify-between">
                    <div>
                      <span className="text-sm tracking-wider font-extrabold uppercase bg-gray-950 text-white px-2.5 py-0.5 rounded">SMARTDISPATCH</span>
                      <span className="text-[10px] text-gray-600 font-mono block mt-1 tracking-widest font-bold">WAREHOUSE SYSTEM STANDARD</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-sm inline-block">
                        {orderItem.totalRs > 50000 ? 'PRIORITY URGENT' : 'STANDARD SHIP'}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono font-bold block mt-1">DOCK BAY 4</span>
                    </div>
                  </div>

                  {/* Barcode section */}
                  <div className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded border border-gray-300">
                    {/* Simple simulated vector styled barcode lines representing SKU */}
                    <div className="flex gap-[2px] items-stretch h-14 bg-transparent">
                      {[3, 1, 4, 1, 5, 2, 6, 2, 7, 1, 8, 3, 4, 1, 2, 1, 5, 3, 2, 4, 1, 2, 1, 5, 1, 8].map((w, index) => (
                        <div key={index} className={`bg-gray-950`} style={{ width: `${w * 1.5}px` }} />
                      ))}
                    </div>
                    <span className="text-xs font-mono font-bold mt-1.5 tracking-widest block text-gray-800">
                      *{orderItem.orderNumber.replace('ORD-', 'SKU-')}*
                    </span>
                  </div>

                  {/* Address Delivery blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="border-r border-gray-300 pr-2">
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-0.5">DISPATCH WAREHOUSE:</span>
                      <span className="font-bold text-gray-900 block">SMARTDISPATCH HUB 04</span>
                      <span className="text-gray-600 block leading-tight text-[11px] mt-0.5">
                        Sector 12 Outer Ring Rd,<br />HSR Layout Area Phase 2,<br />Bengaluru, KA 560102
                      </span>
                    </div>

                    <div className="pl-1">
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-0.5">SHIPPING RECIPIENT:</span>
                      
                      {isEditLabelMode ? (
                        <div className="flex flex-col gap-1.5 bg-yellow-50 p-2 rounded border border-yellow-300">
                          <input
                            type="text"
                            value={editLabelData.recipientName}
                            onChange={e => setEditLabelData(prev => ({ ...prev, recipientName: e.target.value }))}
                            className="w-full p-1 bg-white border border-gray-400 text-xs text-gray-900 rounded font-sans font-bold"
                            placeholder="Recipient Name"
                          />
                          <input
                            type="text"
                            value={editLabelData.addressLine1}
                            onChange={e => setEditLabelData(prev => ({ ...prev, addressLine1: e.target.value }))}
                            className="w-full p-1 bg-white border border-gray-400 text-[11px] text-gray-900 rounded font-sans"
                            placeholder="Address Line 1"
                          />
                          <input
                            type="text"
                            value={editLabelData.addressLine2}
                            onChange={e => setEditLabelData(prev => ({ ...prev, addressLine2: e.target.value }))}
                            className="w-full p-1 bg-white border border-gray-400 text-[11px] text-gray-900 rounded font-sans"
                            placeholder="Address Line 2"
                          />
                          <input
                            type="text"
                            value={editLabelData.phone}
                            onChange={e => setEditLabelData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-1 bg-white border border-gray-400 text-xs text-gray-900 rounded font-mono"
                            placeholder="Phone Contact"
                          />
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-gray-900 block text-[13px]">{orderItem.customerName}</span>
                          <span className="text-gray-800 block text-[11px] leading-tight mt-0.5">
                            {orderItem.shippingAddress.addressLine1},<br />
                            {orderItem.shippingAddress.addressLine2},<br />
                            {orderItem.shippingAddress.city}, {orderItem.shippingAddress.pinCode}
                          </span>
                          <span className="text-gray-700 font-mono text-[11px] font-bold block mt-1.5">
                            TEL: {orderItem.shippingAddress.phone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items Breakdown list */}
                  <div className="border-t border-b border-gray-900 py-2.5">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5 uppercase font-mono">CONSOLIDATING SPECIFICATIONS:</span>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-900 font-bold bg-transparent text-gray-900 select-none">
                          <th className="py-1 text-[9px] uppercase tracking-wider">ITEM SPECIFICATION (PRODUCT & SKU)</th>
                          <th className="py-1 text-right text-[9px] uppercase tracking-wider">VERIFIED MASS (SAFETY CHECK)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-250">
                        {orderItem.items.slice(0, 2).map(pItem => (
                          <tr key={pItem.id} className="font-mono">
                            <td className="py-2 text-left font-sans">
                              <span className="font-bold block text-gray-900 leading-tight">{pItem.productName}</span>
                              <span className="text-[10px] text-gray-600 font-mono mt-0.5 block">{pItem.sku}</span>
                            </td>
                            <td className="py-2 text-right">
                              <span className="inline-block bg-amber-50 text-amber-800 border border-amber-400/40 px-2.5 py-1 rounded-md font-black text-xs shadow-sm">
                                ⚖ 1.6kg PASSED
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Labels Footer Block */}
                  <div className="flex items-center justify-between text-[11px] text-gray-700 font-mono select-none">
                    <div>
                      <span>WEIGHT MASS: </span>
                      <strong className="text-gray-950 font-bold">5.85 kg total</strong>
                    </div>
                    <div>
                      <span>OPERATOR ID: </span>
                      <strong className="text-gray-950 font-bold">WK-04219</strong>
                    </div>
                  </div>

                  {/* Stamp of security assurance */}
                  <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-[10px] text-gray-500 italic">
                    <span>Secured using smart RFID 13.56 MHz verification standard.</span>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-600/30 flex items-center justify-center p-0.5 shrink-0 select-none rotate-12">
                      <span className="text-[7.5px] font-black text-emerald-700 tracking-tighter text-center leading-none">VERIFIED<br />SYSTEM</span>
                    </div>
                  </div>

                </div>
              </>
            );
          })()}
        </div>

        {/* ═══ RIGHT PANEL ═══ Telemetry Details */}
        <div className="xl:col-span-3 flex flex-col gap-5">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <span className="text-[10px] text-[#22D3A0] font-mono uppercase tracking-widest block font-bold mb-3">SYSTEM TELEMETRY SUMMARY</span>
            
            {(() => {
              const orderRef = orders.find(o => o.id === selectedPrintOrderId);
              if (!orderRef) return <p className="text-xs text-gray-500 italic">No selection</p>;
              return (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-gray-300">Order Checks Metrics:</span>
                    
                    {[
                      { label: 'Optical SKU OCR check', pass: orderRef.items.every(i => i.ocrVerified) },
                      { label: 'RGB Image color match model', pass: orderRef.items.every(i => i.visionVerified) },
                      { label: 'Sensory weight tolerance scale', pass: orderRef.items.every(i => i.weightVerified) },
                      { label: 'NFC Sealed physical binding text', pass: orderRef.nfcSealedAt !== undefined }
                    ].map((checkItem, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-950/40 rounded border border-[rgba(255,255,255,0.02)] text-xs">
                        <span className="text-gray-400 font-mono">{checkItem.label}</span>
                        {checkItem.pass ? (
                          <span className="text-[#22D3A0] font-bold font-mono text-[11px]">PASS ✓</span>
                        ) : (
                          <span className="text-amber-500 font-bold font-mono text-[11px] animate-pulse">PENDING !</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-gray-950/20 rounded border border-[rgba(255,255,255,0.03)] flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-gray-500 font-mono uppercase">CONSOLIDATED SPECIFICS</span>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Total volume:</span>
                      <span className="text-white">1 Package Carton</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Target dock:</span>
                      <span className="text-[#F97316] font-bold">{orderRef.dockAssignment || 'Bay 4'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Truck reference:</span>
                      <span className="text-white">{orderRef.truckId || 'KA-12-MB-9000'}</span>
                    </div>
                  </div>

                  {/* Simulation Helpers */}
                  <div className="p-3 bg-orange-950/10 border border-orange-500/10 rounded">
                    <span className="text-[11px] font-bold font-mono text-[#F97316] block uppercase mb-1">PROTOTYPE ACTIONS:</span>
                    <p className="text-[10px] text-gray-400 leading-normal mb-2">Simulate a packer holding their android phone to write physical NDEF tags:</p>
                    {activeNfcHandshaking && activeNfcHandshaking.orderId === orderRef.id ? (
                      <div className="w-full py-1.5 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] rounded text-[10px] font-mono tracking-wide text-center animate-pulse">
                        Handshaking NFC antenna...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNfcSealTapSimulation(orderRef.id)}
                        className="w-full py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/40 text-white rounded text-[10px] font-mono tracking-wide transition duration-150 cursor-pointer"
                      >
                        Tap simulated NFC sticker
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

    </motion.div>
  );
};
