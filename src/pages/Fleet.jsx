import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Search, Plus, Filter, MoreVertical, Truck, X } from 'lucide-react';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#121820] border border-slate-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Fleet() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(null);
  const [addForm, setAddForm] = useState({ regNumber: '', model: '', type: 'Van', capacity: '', odometer: '0', acquisitionCost: '', status: 'AVAILABLE' });
  const [serviceForm, setServiceForm] = useState({ issue: '', cost: '' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vehicles', statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/vehicles?status=${statusFilter}` : '/vehicles';
      const response = await api.get(url);
      return response.data.data;
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (payload) => api.post('/vehicles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setShowAddModal(false);
      setAddForm({ regNumber: '', model: '', type: 'Van', capacity: '', odometer: '0', acquisitionCost: '', status: 'AVAILABLE' });
    }
  });

  const logServiceMutation = useMutation({
    mutationFn: async (payload) => api.post('/maintenance', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['maintenance']);
      setShowServiceModal(null);
      setServiceForm({ issue: '', cost: '' });
    }
  });

  const filteredData = data?.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return v.regNumber.toLowerCase().includes(term) || v.model.toLowerCase().includes(term);
  });

  const getVehicleImage = (type) => {
    switch(type?.toLowerCase()) {
      case 'van': return 'https://images.unsplash.com/photo-1617345689104-d576a8ec28a8?w=800&q=80';
      case 'truck': return 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80';
      default: return 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ON_TRIP': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_SHOP': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'RETIRED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Vehicle Registry</h2>
          <p className="text-sm text-slate-400">Manage and monitor your entire active fleet infrastructure.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-lg shadow-blue-900/20">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-[#121820] p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Reg No. or Model..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0D14] border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Maintenance</option>
          </select>
        </div>
      </div>

      {isLoading && <div className="text-slate-400 py-8">Loading fleet roster...</div>}
      {isError && <div className="text-red-400 py-8">Error loading vehicles. Ensure backend is running.</div>}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(filteredData?.length === 0 || !filteredData) ? (
            <div className="col-span-full text-center py-12 text-slate-500">
               No vehicles found matching criteria.
            </div>
          ) : (
            filteredData.map((vehicle) => (
              <div key={vehicle.id} className="bg-[#121820] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border backdrop-blur-md ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </div>
                  <img 
                    src={vehicle.imageUrl || getVehicleImage(vehicle.type)} 
                    alt={vehicle.model} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#121820] to-transparent pointer-events-none" />
                </div>
                
                <div className="p-5 relative -mt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">{vehicle.model}</h3>
                      <p className="text-sm text-blue-400 font-medium">{vehicle.regNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-[#0A0D14] p-3 rounded-lg border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Odometer</p>
                      <p className="text-sm font-semibold text-slate-200">{vehicle.odometer?.toLocaleString()} mi</p>
                    </div>
                    <div className="bg-[#0A0D14] p-3 rounded-lg border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Capacity</p>
                      <p className="text-sm font-semibold text-slate-200">{vehicle.capacity?.toLocaleString()} lbs</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowDetailModal(vehicle)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 rounded-md transition-colors">
                      View Details
                    </button>
                    <button onClick={() => { setShowServiceModal(vehicle); setServiceForm({ issue: '', cost: '' }); }} className="flex-1 bg-[#1A222C] border border-slate-700 hover:bg-[#222B36] text-white text-sm font-medium py-2 rounded-md transition-colors">
                      Log Service
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Vehicle">
        <form onSubmit={(e) => {
          e.preventDefault();
          addVehicleMutation.mutate({
            ...addForm,
            capacity: parseFloat(addForm.capacity),
            odometer: parseFloat(addForm.odometer),
            acquisitionCost: parseFloat(addForm.acquisitionCost),
          });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Reg Number</label>
              <input required value={addForm.regNumber} onChange={e => setAddForm({...addForm, regNumber: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Model</label>
              <input required value={addForm.model} onChange={e => setAddForm({...addForm, model: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Type</label>
              <select value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
                <option>Van</option>
                <option>Truck</option>
                <option>Semi</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
              <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
                <option value="AVAILABLE">Available</option>
                <option value="IN_SHOP">In Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Image URL (Optional)</label>
            <input placeholder="https://..." value={addForm.imageUrl || ''} onChange={e => setAddForm({...addForm, imageUrl: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Capacity (lbs)</label>
              <input required type="number" value={addForm.capacity} onChange={e => setAddForm({...addForm, capacity: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Odometer</label>
              <input required type="number" value={addForm.odometer} onChange={e => setAddForm({...addForm, odometer: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Acq. Cost ($)</label>
              <input required type="number" value={addForm.acquisitionCost} onChange={e => setAddForm({...addForm, acquisitionCost: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          {addVehicleMutation.isError && <div className="text-red-400 text-sm">{addVehicleMutation.error?.response?.data?.error?.details || 'Failed to add vehicle'}</div>}
          <button type="submit" disabled={addVehicleMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium mt-2">
            {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
          </button>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal open={!!showDetailModal} onClose={() => setShowDetailModal(null)} title={`${showDetailModal?.model || ''} — ${showDetailModal?.regNumber || ''}`}>
        {showDetailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Type</p>
                <p className="text-sm font-semibold text-white">{showDetailModal.type}</p>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Status</p>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusColor(showDetailModal.status)}`}>{showDetailModal.status.replace('_', ' ')}</span>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Odometer</p>
                <p className="text-sm font-semibold text-white">{showDetailModal.odometer?.toLocaleString()} mi</p>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Capacity</p>
                <p className="text-sm font-semibold text-white">{showDetailModal.capacity?.toLocaleString()} lbs</p>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800 col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Acquisition Cost</p>
                <p className="text-sm font-semibold text-white">${showDetailModal.acquisitionCost?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Service Modal */}
      <Modal open={!!showServiceModal} onClose={() => setShowServiceModal(null)} title={`Log Service — ${showServiceModal?.regNumber || ''}`}>
        <form onSubmit={(e) => {
          e.preventDefault();
          logServiceMutation.mutate({
            vehicleId: showServiceModal.id,
            issue: serviceForm.issue,
            cost: parseFloat(serviceForm.cost),
          });
        }} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Issue / Service Type</label>
            <input required value={serviceForm.issue} onChange={e => setServiceForm({...serviceForm, issue: e.target.value})} placeholder="e.g. Engine Oil Change" className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Estimated Cost ($)</label>
            <input required type="number" step="0.01" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm, cost: e.target.value})} placeholder="0.00" className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          {logServiceMutation.isError && <div className="text-red-400 text-sm">{logServiceMutation.error?.response?.data?.error?.details || 'Failed to log service'}</div>}
          <button type="submit" disabled={logServiceMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium">
            {logServiceMutation.isPending ? 'Submitting...' : 'Log Service Record'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
