import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, X, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { decryptNfcPayload } from '../services/cryptoUtils';
import { NfcPayload } from '../types';

interface NfcScanButtonProps {
  onNfcScanned: (payload: NfcPayload) => void;
}

export default function NfcScanButton({ onNfcScanned }: NfcScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startNfcScan = async () => {
    setError(null);
    if ('NDEFReader' in window) {
      setIsScanning(true);
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        
        ndef.addEventListener("readingerror", () => {
          setError("Cannot read data from the NFC tag. Try another one?");
        });
        
        ndef.addEventListener("reading", async ({ message, serialNumber }: any) => {
          try {
            for (const record of message.records) {
              if (record.recordType === "text") {
                const textDecoder = new TextDecoder(record.encoding);
                const encryptedPayload = textDecoder.decode(record.data);
                const payload = await decryptNfcPayload(encryptedPayload);
                setIsScanning(false);
                onNfcScanned(payload);
                return;
              }
            }
            setError("No valid order data found on this tag.");
          } catch (e: any) {
            setError(e.message || "Decryption failed. Invalid or tampered tag.");
          }
        });
      } catch (error: any) {
        setIsScanning(false);
        setError("Error starting NFC scan: " + error.message);
        setShowSimulateModal(true); // Fallback
      }
    } else {
      // Web NFC not supported (e.g. desktop), show simulator
      setShowSimulateModal(true);
    }
  };

  const simulateNfcTap = () => {
    const mockPayload: NfcPayload = {
      orderId: "e9f08d3e-90f7-41fb-992f-1a9ea6e8f480", // Will be replaced by actual order UUID if needed, or matched in backend
      sessionId: "sess-1234",
      packerId: "PKR-007",
      boxId: "BOX-MD-01",
      packedAt: new Date().toISOString(),
      clientName: "Jane Smith",
      clientPhone: "+15550123456",
      clientEmail: "jane@example.com",
      address: {
        line1: "123 Tech Lane",
        city: "San Francisco",
        state: "CA",
        pincode: "94105"
      },
      items: [
        { sku: "SKU-PRO-MAX", name: "iPhone 15 Pro Max", qty: 1, color: "Natural Titanium", dims: {l: 15, w: 7, h: 1}, verified: true },
        { sku: "SKU-CASE", name: "Clear Case", qty: 1, color: "Clear", dims: {l: 16, w: 8, h: 2}, verified: true }
      ]
    };
    setShowSimulateModal(false);
    onNfcScanned(mockPayload);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startNfcScan}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30 backdrop-blur-md transition-colors"
      >
        <Wifi className="w-5 h-5" />
        <span className="font-semibold tracking-wide">Scan Box</span>
      </motion.button>

      <AnimatePresence>
        {(isScanning || showSimulateModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => { setIsScanning(false); setShowSimulateModal(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                {isScanning ? (
                  <>
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 bg-violet-500 rounded-full"
                      />
                      <div className="w-20 h-20 bg-slate-800 rounded-full border border-violet-500/30 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Smartphone className="w-10 h-10 text-violet-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Scan</h3>
                    <p className="text-slate-400 text-sm px-4">
                      Hold the box's NFC tag near the back of your device.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center mb-6">
                      <Wifi className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Web NFC Not Available</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Your browser does not support the Web NFC API. Use the simulator for testing.
                    </p>
                    <button
                      onClick={simulateNfcTap}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/25"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Simulate Tap
                    </button>
                  </>
                )}

                {error && (
                  <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 w-full">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm text-left">{error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
