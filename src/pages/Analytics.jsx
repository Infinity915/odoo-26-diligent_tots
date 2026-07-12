import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BarChart3, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('12months');

  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: async () => (await api.get('/trips')).data.data });
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: async () => (await api.get('/expenses')).data.data });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuel-logs'], queryFn: async () => (await api.get('/fuel-logs')).data.data });
  const { data: maintenance } = useQuery({ queryKey: ['maintenance'], queryFn: async () => (await api.get('/maintenance')).data.data });

  // Compute dynamic totals based on real data
  const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.revenue || 500), 0) || 0; // Assume 500 base revenue per trip if not set
  const totalCost = (
    (expenses?.reduce((sum, e) => sum + e.cost, 0) || 0) +
    (fuelLogs?.reduce((sum, f) => sum + f.cost, 0) || 0) +
    (maintenance?.reduce((sum, m) => sum + m.cost, 0) || 0)
  );

  // Generate dynamic SVG path height based on ratio
  const maxVal = Math.max(totalRevenue, totalCost, 1000); // minimum 1000 to prevent flatline
  const revY = 90 - (totalRevenue / maxVal) * 80; // Map to 10-90 Y range (lower is higher on screen)
  const costY = 90 - (totalCost / maxVal) * 80;

  const chartPaths = {
    '12months': {
      revenue: `M0,90 Q20,80 50,${revY + 10} T100,${revY}`,
      cost: `M0,90 Q25,85 55,${costY + 10} T100,${costY}`,
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']
    },
    'ytd': {
      revenue: `M0,80 Q20,50 50,${revY + 5} T100,${revY}`,
      cost: `M0,85 Q25,60 55,${costY + 5} T100,${costY}`,
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    'quarter': {
      revenue: `M0,60 Q30,${revY + 20} 60,${revY + 5} T100,${revY}`,
      cost: `M0,80 Q35,${costY + 20} 65,${costY + 5} T100,${costY}`,
      labels: ['Week 1', 'Week 4', 'Week 8', 'Week 12']
    }
  };

  const currentChart = chartPaths[timeRange];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reports & Analytics</h2>
          <p className="text-sm text-slate-400">YTD comparative operational overhead and efficiency metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121820] border border-slate-800 rounded-xl p-6 min-h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-semibold text-white">Revenue & Cost Trends</h3>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-[#0A0D14] border border-slate-700 rounded-md px-3 py-1 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                 <option value="12months">Last 12 Months</option>
                 <option value="ytd">YTD</option>
                 <option value="quarter">This Quarter</option>
              </select>
           </div>
           
           <div className="flex-1 relative flex items-end">
             {/* Y-axis labels */}
             <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-600 pb-8">
                <div className="border-b border-slate-800/50 w-full h-0 relative"><span className="absolute -left-8 -top-2">${(maxVal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div className="border-b border-slate-800/50 w-full h-0 relative"><span className="absolute -left-8 -top-2">${(maxVal / 2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div className="border-b border-slate-800/50 w-full h-0 relative"><span className="absolute -left-4 -top-2">0</span></div>
             </div>
             
             {/* Chart lines */}
             <svg className="absolute inset-0 h-[calc(100%-2rem)] w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d={currentChart.revenue} fill="none" stroke="#60A5FA" strokeWidth="2" className="transition-all duration-1000 ease-in-out" />
               <path d={currentChart.cost} fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.8" className="transition-all duration-1000 ease-in-out" />
             </svg>

             {/* X-axis labels */}
             <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-slate-500 pt-4">
                {currentChart.labels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
             </div>
           </div>

           <div className="flex gap-6 mt-4 pt-4 border-t border-slate-800">
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-3 h-0.5 bg-blue-400 rounded"></div>
               Revenue (${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })})
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-3 h-0.5 bg-amber-400 rounded"></div>
               Cost (${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })})
             </div>
           </div>
        </div>

        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
           <h3 className="font-semibold text-white mb-6">Key Insights & Actions</h3>
           
           <div className="space-y-4">
              {totalCost > totalRevenue ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                   <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                         <h4 className="text-sm font-medium text-red-400">Deficit Detected</h4>
                         <p className="text-xs text-red-400/80 mt-1">Operational costs (${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}) exceed revenue (${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}). Immediate review required.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                   <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                         <h4 className="text-sm font-medium text-emerald-400">Profitable Period</h4>
                         <p className="text-xs text-emerald-400/80 mt-1">Net profit is positive. Operating margin looks healthy based on current trips.</p>
                      </div>
                   </div>
                </div>
              )}

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                       <h4 className="text-sm font-medium text-blue-400">Operational Target</h4>
                       <p className="text-xs text-blue-400/80 mt-1">Cost ratio is {(totalCost / (totalRevenue || 1) * 100).toFixed(1)}%. Target is &lt;80%.</p>
                    </div>
                 </div>
              </div>
           </div>

           <button 
             onClick={() => navigate('/expenses')}
             className="w-full mt-6 text-sm text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
           >
              View Detailed Audit Trail →
           </button>
        </div>
      </div>
    </div>
  );
}
