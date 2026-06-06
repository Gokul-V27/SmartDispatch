import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Order } from '../types';

interface PerformancePageProps {
  orders: Order[];
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ orders }) => {
  const counts = {
    Pending: orders.filter(o => o.status === 'PENDING' || o.status === 'ASSIGNED').length,
    Packing: orders.filter(o => o.status === 'PACKING').length,
    Packed: orders.filter(o => o.status === 'PACKED' || o.status === 'VERIFIED').length,
    Delivered: orders.filter(o => o.status === 'DELIVERED').length
  };
  const total = counts.Pending + counts.Packing + counts.Packed + counts.Delivered || 1;
  const pieData = [
    { name: 'Pending', value: counts.Pending, percentage: ((counts.Pending / total) * 100).toFixed(1), color: '#F59E0B' },
    { name: 'Packing', value: counts.Packing, percentage: ((counts.Packing / total) * 100).toFixed(1), color: '#3B82F6' },
    { name: 'Packed', value: counts.Packed, percentage: ((counts.Packed / total) * 100).toFixed(1), color: '#10B981' },
    { name: 'Delivered', value: counts.Delivered, percentage: ((counts.Delivered / total) * 100).toFixed(1), color: '#8B5CF6' }
  ];

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Metric chart simulation 1 */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3">Hourly Packet Intake</h4>
          <div className="h-40 flex items-end gap-3 px-2 pt-4">
            {[12, 18, 15, 24, 30, 42, 38, 55, 48, 60, 52, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#F97316]/20 hover:bg-[#F97316] transition-colors rounded-t" style={{ height: `${(h / 70) * 110}px` }} title={`${h} packets`} />
                <span className="text-[9px] text-gray-500 font-mono mt-1">{i + 8}h</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-center text-gray-500 select-none block mt-4 font-mono">Continuous measurement (GMT)</span>
        </div>

        {/* Metric chart simulation 2 */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3">Verification Anomalies Ratios</h4>
          <div className="flex flex-col gap-3.5 pt-4">
            {[
              { l: 'Color deviation RGB check mismatch', v: '3%', c: 'bg-red-500' },
              { l: 'OCR serial correlation failure', v: '1.2%', c: 'bg-amber-500' },
              { l: 'Weighment parameters variance', v: '0.8%', c: 'bg-blue-500' },
              { l: 'NFC NDEF write error rate', v: '0.04%', c: 'bg-emerald-500' }
            ].map((item, id) => (
              <div key={id} className="flex flex-col gap-1.5 text-xs text-gray-300">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>{item.l}</span>
                  <span className="font-bold">{item.v}</span>
                </div>
                <div className="w-full bg-gray-950 h-2 rounded overflow-hidden">
                  <div className={`h-full ${item.c}`} style={{ width: item.v }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metric chart simulation 3 */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3">Dynamic Queue Volume</h4>
          <div className="h-40 flex items-center justify-center font-mono py-4">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-[#22D3A0] block count font-mono">0.08%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mt-1">Mean Dispatch Error Ratio</span>
              <p className="text-[10px] text-gray-500 max-w-xs mt-3 leading-normal">
                Compared to standard industry benchmark (1.2% wrong dispatches). Saved approximately ₹4,22,000 this month alone in reverse logistics cost.
              </p>
            </div>
          </div>
        </div>

        {/* Recharts Pie Chart representing Order Status Distribution */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-1">Status Distribution</h4>
            <span className="text-[10px] text-gray-500 font-mono">Real-time status proportions</span>
          </div>

          <div className="h-32 relative mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    borderRadius: '4px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact dynamic legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] font-mono border-t border-[rgba(255,255,255,0.05)] pt-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 rounded-full block shrink-0 h-2" style={{ backgroundColor: item.color }} />
                <span className="truncate text-gray-400 max-w-[50px]">{item.name}</span>
                <span className="font-bold text-white ml-auto">{item.value} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
