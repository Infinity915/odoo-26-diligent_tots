import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Search, Plus, MoreVertical, ShieldCheck, ShieldAlert, X, UserX, Eye } from 'lucide-react';

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

function ActionMenu({ driver, onViewProfile, onSuspend }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-[#1A222C] border border-slate-700 rounded-lg shadow-xl z-20 py-1">
          <button onClick={() => { onViewProfile(driver); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
            <Eye className="w-3.5 h-3.5" /> View Profile
          </button>
          {driver.status !== 'SUSPENDED' && (
            <button onClick={() => { onSuspend(driver); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <UserX className="w-3.5 h-3.5" /> Suspend Driver
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Drivers() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', licenseNumber: '', category: 'C', contactNumber: '', expiryDate: '', safetyScore: '100', status: 'AVAILABLE' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['drivers', statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/drivers?status=${statusFilter}` : '/drivers';
      const response = await api.get(url);
      return response.data.data;
    }
  });

  const addDriverMutation = useMutation({
    mutationFn: async (payload) => api.post('/drivers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      setShowAddModal(false);
      setAddForm({ name: '', licenseNumber: '', category: 'C', contactNumber: '', expiryDate: '', safetyScore: '100', status: 'AVAILABLE' });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (driver) => api.put(`/drivers/${driver.id}`, { status: 'SUSPENDED' }),
    onSuccess: () => queryClient.invalidateQueries(['drivers'])
  });

  const filteredData = data?.filter(d => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(term) || d.licenseNumber.toLowerCase().includes(term);
  });

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (score >= 70) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };
  
  const getSafetyScoreBarColor = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status) => {
    const colors = {
      AVAILABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      ON_TRIP: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      OFF_DUTY: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${colors[status] || colors.OFF_DUTY}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Active Fleet Roster</h2>
          <p className="text-sm text-slate-400">Manage drivers, monitor safety scores, and track license validity.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-lg shadow-blue-900/20">
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      <div className="bg-[#121820] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-[#161D27]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Name or License..." 
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
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-[#0A0D14] text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Driver</th>
                <th className="px-6 py-4 font-semibold">License Info</th>
                <th className="px-6 py-4 font-semibold">Current Status</th>
                <th className="px-6 py-4 font-semibold">Safety Score</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading roster...</td></tr>
              )}
              {isError && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-red-400">Failed to load drivers.</td></tr>
              )}
              {!isLoading && !isError && filteredData?.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No drivers found.</td></tr>
              )}
              {!isLoading && !isError && filteredData?.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{driver.name}</div>
                        <div className="text-xs text-slate-500">{driver.contactNumber || 'No Contact'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-300 mb-1">{driver.licenseNumber}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      Class: <span className="text-slate-300 font-semibold">{driver.category || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(driver.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold ${getSafetyScoreColor(driver.safetyScore)}`}>
                        {driver.safetyScore >= 90 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {driver.safetyScore}
                      </div>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getSafetyScoreBarColor(driver.safetyScore)}`} 
                          style={{ width: `${driver.safetyScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu 
                      driver={driver}
                      onViewProfile={(d) => setShowProfileModal(d)}
                      onSuspend={(d) => suspendMutation.mutate(d)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Driver">
        <form onSubmit={(e) => {
          e.preventDefault();
          addDriverMutation.mutate({
            ...addForm,
            safetyScore: parseFloat(addForm.safetyScore),
          });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
              <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">License Number</label>
              <input required value={addForm.licenseNumber} onChange={e => setAddForm({...addForm, licenseNumber: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
              <select value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Phone</label>
              <input required value={addForm.contactNumber} onChange={e => setAddForm({...addForm, contactNumber: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Safety Score</label>
              <input required type="number" min="0" max="100" value={addForm.safetyScore} onChange={e => setAddForm({...addForm, safetyScore: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">License Expiry Date</label>
            <input required type="date" value={addForm.expiryDate} onChange={e => setAddForm({...addForm, expiryDate: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          {addDriverMutation.isError && <div className="text-red-400 text-sm">{addDriverMutation.error?.response?.data?.error?.details || 'Failed to add driver'}</div>}
          <button type="submit" disabled={addDriverMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium mt-2">
            {addDriverMutation.isPending ? 'Adding...' : 'Add Driver'}
          </button>
        </form>
      </Modal>

      {/* View Profile Modal */}
      <Modal open={!!showProfileModal} onClose={() => setShowProfileModal(null)} title={`Driver Profile — ${showProfileModal?.name || ''}`}>
        {showProfileModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl text-slate-300 font-bold border border-slate-700">
                {showProfileModal.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{showProfileModal.name}</h4>
                <p className="text-sm text-slate-400">{showProfileModal.contactNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">License</p>
                <p className="text-sm font-mono text-white">{showProfileModal.licenseNumber}</p>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Category</p>
                <p className="text-sm font-semibold text-white">Class {showProfileModal.category}</p>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Status</p>
                {getStatusBadge(showProfileModal.status)}
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Safety Score</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold ${getSafetyScoreColor(showProfileModal.safetyScore)}`}>
                  {showProfileModal.safetyScore >= 90 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {showProfileModal.safetyScore}
                </div>
              </div>
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-slate-800 col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">License Expiry</p>
                <p className="text-sm font-semibold text-white">{new Date(showProfileModal.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
