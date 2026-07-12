import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { MapPin, Navigation, Send, Save, Truck, CheckCircle, XCircle } from 'lucide-react';
import DispatchMap from '../components/DispatchMap';

export default function Trips() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '1000',
    distance: '150'
  });

  const { data: vehicles } = useQuery({ 
    queryKey: ['vehicles', 'AVAILABLE'], 
    queryFn: async () => (await api.get('/vehicles?status=AVAILABLE')).data.data 
  });
  
  const { data: drivers } = useQuery({ 
    queryKey: ['drivers', 'AVAILABLE'], 
    queryFn: async () => (await api.get('/drivers?status=AVAILABLE')).data.data 
  });

  const { data: allTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => (await api.get('/trips?limit=20')).data.data,
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      const res = await api.post('/trips/draft', {
        ...formData,
        cargoWeight: parseInt(formData.cargoWeight),
        distance: parseInt(formData.distance)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      setSuccess('Draft saved successfully!');
      setError('');
      setFormData({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '1000', distance: '150' });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to save draft';
      setError(errMsg);
      setSuccess('');
    }
  });

  const dispatchTrip = useMutation({
    mutationFn: async () => {
      const draftRes = await api.post('/trips/draft', {
        ...formData,
        cargoWeight: parseInt(formData.cargoWeight),
        distance: parseInt(formData.distance)
      });
      await api.post(`/trips/${draftRes.data.data.id}/dispatch`);
      return draftRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['analytics']);
      queryClient.invalidateQueries(['trips']);
      setSuccess('Trip dispatched successfully!');
      setError('');
      setFormData({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '1000', distance: '150' });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to dispatch trip';
      setError(errMsg);
      setSuccess('');
    }
  });

  const completeTrip = useMutation({
    mutationFn: async (tripId) => api.post(`/trips/${tripId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['analytics']);
    }
  });

  const cancelTrip = useMutation({
    mutationFn: async (tripId) => api.post(`/trips/${tripId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['analytics']);
    }
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6 h-fit">
        {/* Left Form */}
        <div className="w-full lg:w-96 bg-[#121820] border border-slate-800 rounded-xl p-6 flex flex-col h-fit shrink-0">
          <h2 className="text-xl font-bold text-white mb-6">New Trip Dispatch</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md text-sm mb-6">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 p-3 rounded-md text-sm mb-6">
              {success}
            </div>
          )}

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Origin</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
                <input 
                  type="text" 
                  placeholder="e.g. New York" 
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Destination</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
                <input 
                  type="text" 
                  placeholder="e.g. Chicago" 
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Assign Vehicle (Available)</label>
              <select 
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a vehicle</option>
                {vehicles?.map(v => <option key={v.id} value={v.id}>{v.model} - {v.regNumber}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Assign Driver (Available)</label>
              <select 
                value={formData.driverId}
                onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a driver</option>
                {drivers?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.category})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Cargo Weight (lbs)</label>
                <input type="number" value={formData.cargoWeight} onChange={e => setFormData({...formData, cargoWeight: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Distance (mi)</label>
                <input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 pt-6 border-t border-slate-800">
            <button 
              onClick={() => saveDraft.mutate()}
              disabled={saveDraft.isPending}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={() => dispatchTrip.mutate()}
              disabled={dispatchTrip.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {dispatchTrip.isPending ? 'Dispatching...' : <><Send className="w-4 h-4" /> Dispatch</>}
            </button>
          </div>
        </div>

        {/* Right - Live Telemetry Map */}
        <div className="flex-1 min-h-[500px]">
           <DispatchMap source={formData.source} destination={formData.destination} />
        </div>
      </div>

      {/* Bottom - Trip History */}
      <div className="flex-1 bg-[#121820] border border-slate-800 rounded-xl p-6 overflow-hidden">
        <h3 className="font-semibold text-white mb-4">Trip History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="pb-3 font-semibold">Route</th>
                <th className="pb-3 font-semibold">Vehicle</th>
                <th className="pb-3 font-semibold">Driver</th>
                <th className="pb-3 font-semibold">Distance</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {!allTrips?.length && (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">No trips found.</td></tr>
              )}
              {allTrips?.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3">
                    <div className="text-white text-xs">{trip.source} → {trip.destination}</div>
                  </td>
                  <td className="py-3">
                    <span className="text-xs font-mono text-slate-400">{trip.vehicle?.regNumber || '—'}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-xs">{trip.driver?.name || '—'}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-xs">{trip.distance} mi</span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusBadge(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <button onClick={() => completeTrip.mutate(trip.id)} title="Complete" className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => cancelTrip.mutate(trip.id)} title="Cancel" className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {trip.status === 'DRAFT' && (
                        <button onClick={() => cancelTrip.mutate(trip.id)} title="Cancel" className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
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
  );
}
