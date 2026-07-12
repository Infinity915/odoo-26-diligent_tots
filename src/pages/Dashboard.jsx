import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Activity, Truck, Wrench, TrendingUp, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data.data;
    },
    refetchInterval: 5000, 
  });

  const { data: recentTrips } = useQuery({
    queryKey: ['analytics', 'recent-trips'],
    queryFn: async () => (await api.get('/analytics/recent-trips?limit=5')).data.data,
    refetchInterval: 5000,
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ['maintenance', 'ACTIVE', 'dashboard'],
    queryFn: async () => (await api.get('/maintenance?status=ACTIVE')).data.data,
  });

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      DISPATCHED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.DRAFT;
  };

  if (isLoading) return <div className="text-slate-400">Loading live telemetry...</div>;
  if (isError) return <div className="text-red-400">Failed to load dashboard data. (Ensure backend is running on :5000)</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Fleet Overview</h2>
        <p className="text-sm text-slate-400">Real-time telemetry and dispatch status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Vehicles</h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">{data?.totalActiveVehicles || 0}</span>
            <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">Live</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
            <span>In Maintenance: <strong className="text-slate-300">{data?.vehiclesInMaintenance || 0}</strong></span>
            <span>On Trip: <strong className="text-slate-300">{data?.onTripVehicles || 0}</strong></span>
          </div>
        </div>

        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Dispatch Status</h3>
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">{data?.activeTrips || 0}</span>
            <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">En Route</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
             <span>Pending Trips: <strong className="text-slate-300">{data?.pendingTrips || 0}</strong></span>
             <span>Drivers On Duty: <strong className="text-slate-300">{data?.driversOnDuty || 0}</strong></span>
          </div>
        </div>

        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Fleet Utilization</h3>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">{data?.fleetUtilization?.toFixed(1) || '0.0'}%</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-[#121820] border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Recent Trips (Live)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Route</th>
                    <th className="pb-3 font-semibold">Vehicle</th>
                    <th className="pb-3 font-semibold">Driver</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentTrips?.length === 0 && (
                    <tr><td colSpan="4" className="py-8 text-center text-slate-500">No trips recorded yet.</td></tr>
                  )}
                  {recentTrips?.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{trip.source}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[100px]">{trip.destination}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-mono text-slate-400">{trip.vehicle?.regNumber || '—'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs">{trip.driver?.name || '—'}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusBadge(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
         <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Critical Alerts</h3>
            <div className="space-y-4">
               {(!activeAlerts || activeAlerts.length === 0) && (
                 <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                   <div className="flex items-start gap-3">
                     <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                     <div>
                       <h4 className="text-sm font-medium text-emerald-400">All Clear</h4>
                       <p className="text-xs text-emerald-400/80 mt-1">No active maintenance alerts. Fleet is healthy.</p>
                     </div>
                   </div>
                 </div>
               )}
               {activeAlerts?.map(alert => (
                 <div key={alert.id} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                       <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                       <div>
                          <h4 className="text-sm font-medium text-red-400">Action Needed: {alert.issue}</h4>
                          <p className="text-xs text-red-400/80 mt-1">Vehicle {alert.vehicle?.regNumber || alert.vehicleId.substring(0,8)} — Est. Cost: ${alert.cost}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
