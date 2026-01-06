
import React from 'react';
import { Menu, LogIn, LogOut, UserCircle, UserPlus, X, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  onProfileClick: () => void;
  navItems: NavItem[];
  className?: string;
}

// Updated logos as per user request
const LOGO_PATH = "AIISlogo.png";

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  toggleSidebar, 
  user, 
  onLogout, 
  onProfileClick, 
  navItems, 
  className = '' 
}) => {
  const showRegistryLink = !user || user.role === UserRole.Guest || user.role === UserRole.Extension;

  return (
    <aside 
      className={`bg-[#1B4D3E] text-white flex flex-col h-full transition-all duration-300 shadow-2xl overflow-hidden z-[160]
        ${isCollapsed ? 'w-20' : 'w-72'} ${className}`}
    >
      {/* Top Header/Branding */}
      <div className="p-4 sm:p-6 border-b border-[#2C6E58] relative shrink-0">
        <div className="flex flex-col items-center gap-4 transition-all duration-300">
          <div className={`w-full flex justify-between items-center ${isCollapsed ? 'flex-col gap-4' : ''}`}>
             {!isCollapsed && (
               <div className="flex items-center gap-2">
                 <Shield size={16} className="text-[#FBBF24]" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-green-300">National Node</span>
               </div>
             )}
             <button 
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} 
                className="lg:hidden text-green-200 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
             >
                <X size={22} />
             </button>
          </div>

          <div className={`flex items-center justify-center transition-all duration-500 overflow-hidden relative group
            ${isCollapsed ? 'w-12 h-12' : 'w-24 h-24'}`}>
             <img src={LOGO_PATH} alt="AIIS Logo" className="w-full h-full object-contain transition-transform group-hover:scale-110 drop-shadow-lg" />
          </div>
          
          {!isCollapsed && (
            <div className="text-center w-full animate-fade-in">
              <h1 className="text-lg font-black tracking-tight text-white uppercase leading-none">AIIS Mobile</h1>
              <p className="text-[8px] text-green-300 font-bold uppercase tracking-[0.2em] mt-1">Eswatini Agriculture</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <li key={item.id} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveTab(item.id); }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 group
                  ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
                  ${activeTab === item.id 
                    ? 'bg-[#FBBF24] text-[#1B4D3E] shadow-lg' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className={`flex-shrink-0 transition-transform group-active:scale-90 ${activeTab === item.id ? 'scale-110' : ''}`}>
                    {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                
                {/* Active indicator bar */}
                {activeTab === item.id && !isCollapsed && (
                  <div className="ml-auto w-1 h-4 bg-[#1B4D3E] rounded-full opacity-50" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="bg-black/10 border-t border-[#2C6E58] shrink-0">
        <div className={`${isCollapsed ? 'p-3' : 'p-4'}`}>
          {user ? (
            <div className="space-y-2">
                <button 
                  onClick={onProfileClick} 
                  title={isCollapsed ? "My Profile" : undefined}
                  className={`w-full flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <div className="w-9 h-9 rounded-lg bg-green-700/50 flex items-center justify-center text-green-200 shadow-lg border border-white/10 shrink-0">
                      <UserCircle size={22} />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden text-left flex-1">
                            <p className="text-[11px] font-black text-white truncate">{user.name}</p>
                            <p className="text-[8px] text-green-400 truncate uppercase font-bold">{user.actorType || user.role}</p>
                        </div>
                    )}
                </button>
                <button 
                  onClick={onLogout} 
                  title={isCollapsed ? "Sign Out" : undefined}
                  className={`w-full flex items-center gap-3 text-red-300 hover:text-red-100 text-[10px] font-black uppercase tracking-widest transition-all p-3 hover:bg-red-900/40 rounded-xl ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('login')} 
              title={isCollapsed ? "Sign In" : undefined}
              className={`w-full flex items-center gap-3 bg-[#FBBF24] text-[#1B4D3E] rounded-xl hover:bg-yellow-400 transition-all shadow-md font-black text-[10px] uppercase tracking-widest ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3'}`}
            >
                <LogIn size={18} />
                {!isCollapsed && <span>Login</span>}
            </button>
          )}

          {showRegistryLink && !isCollapsed && (
             <button 
              onClick={() => setActiveTab('registry')} 
              className="w-full flex items-center gap-3 text-green-400 hover:text-[#FBBF24] text-[9px] font-black uppercase tracking-widest py-3 transition-colors mt-2"
             >
                <UserPlus size={18} />
                <span>Stakeholder Registry</span>
            </button>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:block border-t border-white/5">
           <button 
            onClick={toggleSidebar}
            className="w-full py-4 flex items-center justify-center text-green-300 hover:text-white hover:bg-white/5 transition-all"
           >
             {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={16} /><span className="text-[9px] font-black uppercase tracking-widest">Collapse Menu</span></div>}
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
