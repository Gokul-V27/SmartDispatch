import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, MapPin, CheckCircle2, Clock, Truck, Home } from 'lucide-react';
import apiClient from '../services/apiClient';

interface TrackingData {
  orderNumber: string;
  status: string;
  customerName: string;
  timeline: { step: string; status: 'done' | 'current' | 'pending'; time?: string; detail?: string }[];
  items: { name: string; brand: string; quantity: number; verified: boolean }[];
}

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (searchNum: string) => {
    if (!searchNum) return;
    setLoading(true);
    setError(null);
    try {
      // In a real app, you'd call the public API endpoint. Here we'll use our apiClient proxy/mock or fetch it
      const response = await fetch(`/api/tracking/${searchNum}`);
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Could not find order. Please check your order number.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderNumber);
  };

  // Poll every 10 seconds if we have an active order that is not delivered
  useEffect(() => {
    if (!trackingData || trackingData.status === 'DELIVERED') return;
    
    const intervalId = setInterval(() => {
      fetchTracking(trackingData.orderNumber);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [trackingData?.orderNumber, trackingData?.status]);

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'Order Placed': return <Package className="w-5 h-5" />;
      case 'Packed & Verified': return <CheckCircle2 className="w-5 h-5" />;
      case 'Label Printed': return <MapPin className="w-5 h-5" />;
      case 'Shipped': return <Truck className="w-5 h-5" />;
      case 'Delivered': return <Home className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050B15] flex flex-col items-center py-12 px-4 relative overflow-hidden font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4 text-violet-400">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Track Your Package</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Enter your order number to see real-time updates on your dispatch and delivery.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="e.g. ORD-2024-8821"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-32 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-lg shadow-2xl backdrop-blur-sm uppercase"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-red-400 bg-red-500/10 py-3 rounded-xl border border-red-500/20">
            {error}
          </motion.div>
        )}

        {/* Tracking Timeline */}
        {trackingData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-10 shadow-2xl mt-4"
          >
            <div className="flex justify-between items-end mb-10 pb-6 border-b border-slate-800">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Order Number</p>
                <h2 className="text-3xl font-mono font-bold text-white tracking-tight">{trackingData.orderNumber}</h2>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold text-sm">
                  {trackingData.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="relative pl-8 md:pl-10 space-y-10">
              {/* Vertical Line */}
              <div className="absolute top-0 bottom-0 left-[22px] md:left-[30px] w-[2px] bg-slate-800" />
              <div className="absolute top-0 bottom-0 left-[22px] md:left-[30px] w-[2px] bg-gradient-to-b from-emerald-500 via-violet-500 to-transparent transition-all duration-1000" 
                style={{ height: `${(trackingData.timeline.filter(t => t.status === 'done').length / trackingData.timeline.length) * 100}%` }} 
              />

              {trackingData.timeline.map((step, idx) => {
                const isDone = step.status === 'done';
                const isCurrent = step.status === 'current';
                
                return (
                  <div key={idx} className="relative">
                    {/* Node */}
                    <div className={`absolute -left-[40px] md:-left-[48px] top-1 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                      isDone ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                      isCurrent ? 'bg-slate-900 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse' :
                      'bg-slate-900 border-slate-700 text-slate-600'
                    }`}>
                      {getStepIcon(step.step)}
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-semibold ${isDone || isCurrent ? 'text-white' : 'text-slate-500'}`}>
                        {step.step}
                      </h3>
                      {step.detail && (
                        <p className={`text-sm mt-1 ${isDone ? 'text-slate-300' : 'text-slate-500'}`}>{step.detail}</p>
                      )}
                      {step.time && (
                        <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(step.time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Items Summary */}
            <div className="mt-12 pt-6 border-t border-slate-800">
              <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Package Contents</h4>
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800/50">
                {trackingData.items.map((item, idx) => (
                  <div key={idx} className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-slate-800/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-slate-500 text-xs">Qty: {item.quantity} • {item.brand}</p>
                      </div>
                    </div>
                    {item.verified && (
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        Verified ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
