import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle, Clock } from 'lucide-react';

export default function Maintenance() {
  const { user } = useAuth();
  const isFinance = user?.role === 'FINANCIAL_ANALYST';
  const queryClient = useQueryClient();
  const [serviceForm, setServiceForm] = useState({ vehicleId: '', issue: '', cost: '', notes: '' });
  const [success, setSuccess] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data.data
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  const { data: metrics } = useQuery({
    queryKey: ['analytics', 'maintenance-metrics'],
    queryFn: async () => (await api.get('/analytics/maintenance-metrics')).data.data
  });

  const logServiceMutation = useMutation({
    mutationFn: async (payload) => api.post('/maintenance', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenance']);
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['analytics']);
      setServiceForm({ vehicleId: '', issue: '', cost: '', notes: '' });
      setSuccess('Service record logged successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  });

  const closeMutation = useMutation({
    mutationFn: async (logId) => api.put(`/maintenance/${logId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenance']);
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['analytics']);
    }
  });

  const serviceHistoryRef = React.useRef(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Service Log</h2>
          <p className="text-sm text-slate-400">Track vehicle maintenance, repairs, and fleet health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isFinance && (
          <div className="lg:col-span-1 bg-[#121820] border border-slate-800 rounded-xl p-6 h-fit">
            <h3 className="font-semibold text-white mb-6">Log New Service</h3>

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 p-3 rounded-md text-sm mb-4">
                {success}
              </div>
            )}
            {logServiceMutation.isError && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-md text-sm mb-4">
                {logServiceMutation.error?.response?.data?.error?.details || logServiceMutation.error?.response?.data?.details || 'Failed to log service'}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              logServiceMutation.mutate({
                vehicleId: serviceForm.vehicleId,
                issue: serviceForm.issue + (serviceForm.notes ? ` — ${serviceForm.notes}` : ''),
                cost: parseFloat(serviceForm.cost),
              });
            }} className="space-y-4">
              <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Vehicle</label>
                 <select required value={serviceForm.vehicleId} onChange={e => setServiceForm({...serviceForm, vehicleId: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select Vehicle...</option>
                    {vehicles?.map(v => <option key={v.id} value={v.id}>{v.model} — {v.regNumber}</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Service Type</label>
                 <input required type="text" placeholder="e.g. Engine Oil" value={serviceForm.issue} onChange={e => setServiceForm({...serviceForm, issue: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Cost ($)</label>
                 <input required type="number" step="0.01" placeholder="0.00" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm, cost: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Service Notes</label>
                 <textarea rows="3" placeholder="Describe findings..." value={serviceForm.notes} onChange={e => setServiceForm({...serviceForm, notes: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none"></textarea>
              </div>
              <button type="submit" disabled={logServiceMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium mt-4">
                 {logServiceMutation.isPending ? 'Submitting...' : 'Log Service Record'}
              </button>
            </form>
          </div>
        )}

        <div className={`${isFinance ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
                 <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Fleet Health Score</h4>
                 <div className="text-3xl font-bold text-white mb-1">{metrics?.fleetHealthScore ?? '—'}%</div>
                 <div className={`text-xs ${(metrics?.fleetHealthScore ?? 100) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {(metrics?.fleetHealthScore ?? 100) >= 80 ? 'Currently above target' : 'Below target — action needed'}
                 </div>
              </div>
              <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
                 <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Pending Alerts</h4>
                 <div className={`text-3xl font-bold mb-1 ${(metrics?.pendingAlerts ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{String(metrics?.pendingAlerts ?? 0).padStart(2, '0')}</div>
                 <div className="text-xs text-slate-500">{(metrics?.pendingAlerts ?? 0) > 0 ? 'Critical maintenance due' : 'No pending alerts'}</div>
              </div>
           </div>

           <div ref={serviceHistoryRef} className="bg-[#121820] border border-slate-800 rounded-xl p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-white">Service History</h3>
                <button onClick={() => serviceHistoryRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-blue-400 hover:underline">View Report</button>
             </div>
             <table className="w-full text-left text-sm text-slate-300">
               <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
                 <tr>
                   <th className="pb-3 font-semibold">Vehicle</th>
                   <th className="pb-3 font-semibold">Issue</th>
                   <th className="pb-3 font-semibold">Cost</th>
                   <th className="pb-3 font-semibold text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {isLoading && <tr><td colSpan="4" className="py-4 text-center">Loading...</td></tr>}
                 {!isLoading && data?.length === 0 && <tr><td colSpan="4" className="py-4 text-center text-slate-500">No maintenance logs.</td></tr>}
                 {data?.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                       <td className="py-4 text-white font-medium">{log.vehicle?.regNumber || log.vehicleId.substring(0,8)}</td>
                       <td className="py-4">{log.issue}</td>
                       <td className="py-4 font-mono">${log.cost}</td>
                       <td className="py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           {log.status === 'ACTIVE' ? (
                             <>
                               <span className="px-2 py-1 text-[10px] font-bold uppercase rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">Active</span>
                               <button 
                                 onClick={() => closeMutation.mutate(log.id)} 
                                 disabled={closeMutation.isPending}
                                 title="Close maintenance"
                                 className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                               >
                                 <CheckCircle className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <span className="px-2 py-1 text-[10px] font-bold uppercase rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Closed</span>
                           )}
                         </div>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
