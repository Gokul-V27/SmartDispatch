import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Printer, ArrowLeft, Package, User, MapPin, CheckCircle2, 
  Smartphone, Clock, Box, ShieldCheck, Mail
} from 'lucide-react';
import { NfcPayload } from '../types';
import apiClient from '../services/apiClient';

interface NfcOrderDetailPageProps {
  nfcData: NfcPayload;
  onBack: () => void;
}

export default function NfcOrderDetailPage({ nfcData, onBack }: NfcOrderDetailPageProps) {
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');

  // Parse date
  const packedDate = new Date(nfcData.packedAt).toLocaleString();

  useEffect(() => {
    if (autoPrintEnabled && printStatus === 'idle') {
      handlePrint();
    }
  }, [autoPrintEnabled, printStatus]);

  const handlePrint = () => {
    setPrintStatus('printing');
    
    // In a real scenario, this would generate a PDF or ZPL and send it to the printer
    setTimeout(() => {
      window.print();
      
      // Update status to LABEL_PRINTED in backend
      apiClient.updateOrderStatus(nfcData.orderId, 'LABEL_PRINTED')
        .then(() => setPrintStatus('success'))
        .catch(err => {
          console.error("Failed to update status", err);
          setPrintStatus('error');
        });
    }, 500); // Short delay to allow render
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-violet-400" />
              Order Tag Data
            </h1>
            <p className="text-slate-400 text-sm mt-1">Read from NFC Tag</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoPrintEnabled}
              onChange={(e) => setAutoPrintEnabled(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-violet-500 focus:ring-violet-500"
            />
            Auto-Print on Scan
          </label>
          
          <button 
            onClick={handlePrint}
            disabled={printStatus === 'printing'}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg font-medium transition-colors disabled:opacity-50"
          >
            {printStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
            {printStatus === 'success' ? 'Printed' : 'Print Label'}
          </button>
        </div>
      </div>

      {printStatus === 'success' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Label printed and order status updated to LABEL_PRINTED.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Client Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Name</p>
                  <p className="text-white font-medium">{nfcData.clientName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <p className="text-white">{nfcData.clientPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <p className="text-white">{nfcData.clientEmail}</p>
                </div>
              </div>
              <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-slate-500 mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Shipping Address</p>
                <p className="text-white">{nfcData.address.line1}</p>
                <p className="text-white">{nfcData.address.city}, {nfcData.address.state}</p>
                <p className="text-white font-mono text-violet-300">{nfcData.address.pincode}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-slate-400" />
              Packed Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-sm text-slate-400">
                    <th className="py-3 px-2 font-medium">SKU</th>
                    <th className="py-3 px-2 font-medium">Item</th>
                    <th className="py-3 px-2 font-medium text-center">Qty</th>
                    <th className="py-3 px-2 font-medium text-center">Verified</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {nfcData.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-2 text-slate-300 font-mono text-xs">{item.sku}</td>
                      <td className="py-4 px-2">
                        <p className="text-white font-medium">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded-full">{item.color}</span>
                          <span className="text-xs text-slate-500">{item.dims.l}x{item.dims.w}x{item.dims.h} cm</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center text-white">{item.qty}</td>
                      <td className="py-4 px-2 text-center">
                        {item.verified ? (
                          <div className="inline-flex items-center justify-center p-1 bg-emerald-500/10 rounded-full">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Pack Info & Print Preview */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pack Info</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm flex items-center gap-2"><User className="w-4 h-4" /> Packer ID</span>
                <span className="text-white font-mono">{nfcData.packerId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm flex items-center gap-2"><Box className="w-4 h-4" /> Box Type</span>
                <span className="text-white font-mono">{nfcData.boxId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Packed At</span>
                <span className="text-white text-sm">{packedDate}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 text-sm">Session ID</span>
                <span className="text-slate-400 text-xs font-mono">{nfcData.sessionId.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Printable Label Preview */}
          <div className="bg-white rounded-xl p-6 shadow-xl relative" id="shipping-label">
            {/* Watermark/Logo */}
            <div className="absolute top-4 right-4 font-black text-xl tracking-tighter text-black">SD<span className="text-violet-600">.</span></div>
            
            <div className="border-b-2 border-black pb-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Ship To</p>
              <h2 className="text-2xl font-black text-black leading-tight mb-2 uppercase">{nfcData.clientName}</h2>
              <p className="text-black font-semibold">{nfcData.address.line1}</p>
              <p className="text-black font-semibold">{nfcData.address.city}, {nfcData.address.state}</p>
              <p className="text-black font-bold text-xl mt-1 tracking-wider">{nfcData.address.pincode}</p>
            </div>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Order ID</p>
                <p className="text-black font-mono font-bold text-sm">{nfcData.orderId.substring(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-500">Box</p>
                <p className="text-black font-bold">{nfcData.boxId}</p>
              </div>
            </div>

            {/* Fake Barcode using borders */}
            <div className="w-full h-16 flex items-stretch overflow-hidden opacity-90">
              {Array.from({length: 40}).map((_, i) => (
                <div key={i} className="bg-black h-full" style={{ width: `${Math.max(1, Math.random() * 5)}px`, marginRight: `${Math.random() * 3}px` }} />
              ))}
            </div>
            <p className="text-center font-mono text-xs font-bold tracking-[0.2em] mt-1">{nfcData.orderId.replace(/-/g, '').substring(0, 16)}</p>
          </div>
        </div>
      </div>
      
      {/* Print Styles injected locally */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root { height: 100vh; overflow: visible; background: white; }
          #shipping-label, #shipping-label * { visibility: visible; }
          #shipping-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 4in;
            height: 6in;
            box-shadow: none !important;
            border: none !important;
            padding: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
