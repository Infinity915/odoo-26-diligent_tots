import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark') || true // Default true
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile and preferences.</p>
      </div>

      <div className="space-y-6">
         <div className="bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">General Profile</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
                  <input type="text" defaultValue="Alex Mercer" className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none" />
               </div>
               <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                  <input type="email" defaultValue={user?.email || 'fleet@transitops.com'} className="w-full px-3 py-2 bg-slate-100 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 focus:outline-none" disabled />
               </div>
               <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                  <input type="text" defaultValue="+1 (555) 012-3456" className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none" />
               </div>
               <button 
                 onClick={handleProfileSave}
                 className={`w-full mt-2 py-2 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                   profileSaved 
                     ? 'bg-emerald-600 text-white' 
                     : 'bg-blue-600 hover:bg-blue-700 text-white'
                 }`}
               >
                  {profileSaved ? <><Check className="w-4 h-4" /> Profile Saved!</> : 'Save Profile Changes'}
               </button>
            </div>
         </div>

         <div className="bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Preferences</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Primary Depot Name</label>
                  <input type="text" defaultValue="Central Logistics Hub (Chicago)" className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Currency</label>
                     <select className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Units</label>
                     <select className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0D14] border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none">
                        <option>Imperial (mi/gal)</option>
                        <option>Metric (km/L)</option>
                     </select>
                  </div>
               </div>
               {user?.role !== 'FLEET_MANAGER' && (
                 <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-slate-700 dark:text-white">Enable Dark Mode</span>
                    <div 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
