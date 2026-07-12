import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { DollarSign, Droplet, Receipt, X, Trash2 } from 'lucide-react';

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

export default function Expenses() {
  const queryClient = useQueryClient();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ vehicleId: '', cost: '', description: '', type: 'TOLL' });

  const { data: fuelLogs } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: async () => (await api.get('/fuel-logs')).data.data
  });

  const { data: generalExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get('/expenses')).data.data
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (payload) => api.post('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setShowAddExpense(false);
      setExpenseForm({ vehicleId: '', cost: '', description: '', type: 'TOLL' });
    }
  });

  const [showAddFuel, setShowAddFuel] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', cost: '', liters: '' });

  const addFuelMutation = useMutation({
    mutationFn: async (payload) => api.post('/fuel-logs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuel-logs']);
      setShowAddFuel(false);
      setFuelForm({ vehicleId: '', cost: '', liters: '' });
    }
  });

  // Compute dynamic summary values
  const totalFuelCost = fuelLogs?.reduce((sum, log) => sum + log.cost, 0) || 0;
  const totalLiters = fuelLogs?.reduce((sum, log) => sum + log.liters, 0) || 0;
  const avgCostPerGallon = totalLiters > 0 ? (totalFuelCost / totalLiters).toFixed(2) : '0.00';
  const totalOtherExpenses = generalExpenses?.reduce((sum, exp) => sum + exp.cost, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Fuel & Expenses</h2>
        <p className="text-sm text-slate-400">Monitoring real-time operational costs and fuel efficiency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Fuel Cost</h3>
           <div className="text-3xl font-bold text-white mb-2">${totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
           <div className="text-xs text-slate-500">{fuelLogs?.length || 0} fuel log entries</div>
        </div>
        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Avg Cost / Liter</h3>
           <div className="text-3xl font-bold text-white mb-2">${avgCostPerGallon}</div>
        </div>
        <div className="bg-[#121820] border border-slate-800 rounded-xl p-6">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Liters</h3>
           <div className="text-3xl font-bold text-white mb-2">{totalLiters.toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
           <div className="text-xs text-slate-500">Across all vehicles</div>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-6">
           <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Total Other Expenses</h3>
           <div className="text-3xl font-bold text-blue-400 mb-2">${totalOtherExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121820] border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-semibold text-white">Fuel Log</h3>
               <button onClick={() => setShowAddFuel(true)} className="bg-blue-600/20 text-blue-400 p-1.5 rounded hover:bg-blue-600/30 transition-colors" title="Log Fuel">
                 <Droplet className="w-4 h-4" />
               </button>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
               <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
                 <tr>
                   <th className="pb-3 font-semibold">Date</th>
                   <th className="pb-3 font-semibold">Vehicle</th>
                   <th className="pb-3 font-semibold">Liters</th>
                   <th className="pb-3 font-semibold">Cost</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {fuelLogs?.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                       <td className="py-4 text-slate-400">{new Date(log.loggedAt).toLocaleDateString()}</td>
                       <td className="py-4 font-medium text-white">{log.vehicle?.regNumber || log.vehicleId.substring(0,8)}</td>
                       <td className="py-4">{log.liters} L</td>
                       <td className="py-4 font-mono">${log.cost.toFixed(2)}</td>
                    </tr>
                 ))}
                 {(!fuelLogs || fuelLogs.length === 0) && (
                    <tr><td colSpan="4" className="py-8 text-center text-slate-500">No fuel records. Log fuel via the backend or seed data.</td></tr>
                 )}
               </tbody>
             </table>
         </div>

         <div className="bg-[#121820] border border-slate-800 rounded-xl p-6 h-fit">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-semibold text-white">Other Expenses</h3>
               <button onClick={() => setShowAddExpense(true)} className="bg-blue-600/20 text-blue-400 p-1.5 rounded hover:bg-blue-600/30 transition-colors" title="Add Expense">
                 <Receipt className="w-4 h-4" />
               </button>
            </div>
            
            <div className="space-y-4">
               {generalExpenses?.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center p-3 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                     <div>
                        <div className="text-sm font-medium text-white">{exp.type}</div>
                        <div className="text-xs text-slate-500">{exp.description}</div>
                     </div>
                     <div className="font-mono text-sm">${exp.cost.toFixed(2)}</div>
                  </div>
               ))}
               {(!generalExpenses || generalExpenses.length === 0) && (
                  <div className="text-center py-4 text-slate-500 text-sm">No other expenses logged.</div>
               )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
               <span className="text-sm text-slate-400 uppercase font-semibold">Total Add'l Costs</span>
               <span className="text-xl font-bold text-white">${totalOtherExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
         </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Add Expense">
        <form onSubmit={(e) => {
          e.preventDefault();
          addExpenseMutation.mutate({
            vehicleId: expenseForm.vehicleId,
            cost: parseFloat(expenseForm.cost),
            description: expenseForm.description,
            type: expenseForm.type,
          });
        }} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Vehicle</label>
            <select required value={expenseForm.vehicleId} onChange={e => setExpenseForm({...expenseForm, vehicleId: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">Select Vehicle...</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.model} — {v.regNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Type</label>
              <select value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
                <option value="TOLL">Toll</option>
                <option value="PARKING">Parking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Cost ($)</label>
              <input required type="number" step="0.01" value={expenseForm.cost} onChange={e => setExpenseForm({...expenseForm, cost: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
            <input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          {addExpenseMutation.isError && <div className="text-red-400 text-sm">Failed to add expense.</div>}
          <button type="submit" disabled={addExpenseMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium">
            {addExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </Modal>

      {/* Add Fuel Modal */}
      <Modal open={showAddFuel} onClose={() => setShowAddFuel(false)} title="Log Fuel">
        <form onSubmit={(e) => {
          e.preventDefault();
          addFuelMutation.mutate({
            vehicleId: fuelForm.vehicleId,
            cost: parseFloat(fuelForm.cost),
            liters: parseFloat(fuelForm.liters)
          });
        }} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Vehicle</label>
            <select required value={fuelForm.vehicleId} onChange={e => setFuelForm({...fuelForm, vehicleId: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">Select Vehicle...</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.model} — {v.regNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Liters</label>
              <input required type="number" step="0.1" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Total Cost ($)</label>
              <input required type="number" step="0.01" value={fuelForm.cost} onChange={e => setFuelForm({...fuelForm, cost: e.target.value})} className="w-full px-3 py-2 bg-[#0A0D14] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          {addFuelMutation.isError && <div className="text-red-400 text-sm">Failed to add fuel log.</div>}
          <button type="submit" disabled={addFuelMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium">
            {addFuelMutation.isPending ? 'Logging...' : 'Log Fuel'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
