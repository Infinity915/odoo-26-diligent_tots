import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  CreditCard, 
  BarChart, 
  Settings,
  LogOut,
  Search,
  X
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'], keywords: ['dashboard', 'overview', 'home', 'fleet overview'] },
    { name: 'Fleet', path: '/fleet', icon: Truck, roles: ['FLEET_MANAGER'], keywords: ['fleet', 'vehicles', 'van', 'truck', 'registry'] },
    { name: 'Drivers', path: '/drivers', icon: Users, roles: ['SAFETY_OFFICER'], keywords: ['drivers', 'roster', 'safety', 'license'] },
    { name: 'Trips', path: '/trips', icon: Map, roles: ['DISPATCHER'], keywords: ['trips', 'dispatch', 'route', 'navigation'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'], keywords: ['maintenance', 'service', 'repair', 'health'] },
    { name: 'Fuel & Expenses', path: '/expenses', icon: CreditCard, roles: ['FINANCIAL_ANALYST'], keywords: ['fuel', 'expenses', 'cost', 'finance', 'money'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart, roles: ['FINANCIAL_ANALYST'], keywords: ['analytics', 'reports', 'charts', 'insights'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['FLEET_MANAGER'], keywords: ['settings', 'profile', 'preferences', 'rbac', 'permissions'] },
  ];

  const accessibleItems = navItems.filter(item => !user || item.roles.includes(user.role));
  
  const searchResults = searchQuery.trim()
    ? accessibleItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="flex h-screen bg-[#0A0D14] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121820] border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600/20 p-1.5 rounded text-blue-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">TransOps</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Enterprise Fleet</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (user && !item.roles.includes(user.role)) return null;
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {user?.email?.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{user?.email}</p>
               <p className="text-xs text-slate-500 truncate">{user?.role}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0A0D14]">
          <div className="flex items-center gap-4" ref={searchRef}>
             <div className="relative">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Search TransOps..." 
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                 onFocus={() => setShowResults(true)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && searchResults.length > 0) {
                     handleSearchSelect(searchResults[0].path);
                   }
                 }}
                 className="pl-9 pr-8 py-2 bg-[#121820] border border-slate-800 rounded-md text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64 md:w-96"
               />
               {searchQuery && (
                 <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="absolute right-2 top-2.5 text-slate-500 hover:text-white">
                   <X className="w-4 h-4" />
                 </button>
               )}
               {showResults && searchQuery.trim() && (
                 <div className="absolute top-full mt-1 left-0 right-0 bg-[#1A222C] border border-slate-700 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                   {searchResults.length === 0 ? (
                     <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
                   ) : (
                     searchResults.map(item => (
                       <button
                         key={item.path}
                         onClick={() => handleSearchSelect(item.path)}
                         className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                       >
                         <item.icon className="w-4 h-4 text-slate-500" />
                         {item.name}
                       </button>
                     ))
                   )}
                 </div>
               )}
             </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
             <button className="hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button>
             <button className="hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
