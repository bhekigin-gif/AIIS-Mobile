
import React from 'react';
import { Menu, LogIn, LogOut, UserCircle, UserPlus, X } from 'lucide-react';
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

const LOGO_EXPANDED = "https://www.agrinfosystems.gov.sz/assets/uploads/logo.png";
const LOGO_COLLAPSED = "https://www.agrinfosystems.gov.sz/assets/uploads/favicon1.png";

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, toggleSidebar, user, onLogout, onProfileClick, navItems, className = '' }) => {
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSidebar();
  };

  const showRegistryLink = !user || user.role === UserRole.Guest || user.role === UserRole.Extension;

  return (
    <aside 
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#1B4D3E] text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-xl overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-[#2C6E58] relative">
        <div className={`flex flex-col items-center gap-3 transition-all duration-300 ${isCollapsed ? 'py-1' : ''}`}>
          
          {/* Toggle Button / Close (mobile) */}
          <div className={`w-full flex justify-between items-start absolute top-2 ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'left-2'} z-20`}>
             <button 
                onClick={handleToggle} 
                className="text-green-200 hover:text-white p-1.5 rounded-lg hover:bg-[#2C6E58]/50 transition-colors"
             >
                {className.includes('fixed') ? <X size={18}/> : <Menu size={18} />}
             </button>
          </div>

          {/* Logo Container */}
          <div className={`bg-white rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 overflow-hidden relative
            ${isCollapsed ? 'w-10 h-10 mt-8 p-1' : 'w-full h-24 mt-4 p-2'}`}>
             <img src={isCollapsed ? LOGO_COLLAPSED : LOGO_EXPANDED} alt="AIIS Logo" className="w-full h-full object-contain" />
          </div>
          
          {!isCollapsed && (
            <div className="text-center pb-1">
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight uppercase">AIIS Mobile</h1>
              <p className="text-[9px] text-green-300 font-black uppercase tracking-widest">Eswatini Agriculture</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden no-scrollbar">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveTab(item.id); }}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all duration-200 
                  ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-3'}
                  ${activeTab === item.id 
                    ? 'bg-[#FBBF24] text-[#1B4D3E] shadow-lg transform scale-[1.02]' 
                    : 'text-green-100 hover:bg-[#2C6E58] hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bg-[#153e32] border-t border-[#2C6E58] safe-area-bottom">
        {user ? (
             <div className={`${isCollapsed ? 'p-2' : 'p-4'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onProfileClick(); }}
                    className={`w-full flex items-center gap-3 mb-3 hover:bg-white/5 p-2 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-green-200 flex-shrink-0">
                        <UserCircle size={20} />
                    </div>
                     {!isCollapsed && (
                        <div className="overflow-hidden text-left flex-1">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-green-400 truncate uppercase tracking-widest font-black">{user.actorType || user.role}</p>
                        </div>
                    )}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onLogout(); }}
                    className={`w-full flex items-center gap-2 text-red-300 hover:text-red-100 text-[10px] font-black transition-colors border border-red-900/30 rounded-lg p-2 hover:bg-red-900/40
                    ${isCollapsed ? 'justify-center' : 'px-3'}`}
                >
                    <LogOut size={14} />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
             </div>
        ) : (
            <div className={`${isCollapsed ? 'p-2' : 'p-4'}`}>
                 <button onClick={(e) => { e.stopPropagation(); setActiveTab('login'); }} className={`w-full flex items-center gap-3 bg-[#2C6E58] hover:bg-[#3d8c72] text-white rounded-lg transition-all ${isCollapsed ? 'justify-center p-2' : 'px-4 py-2.5 font-bold text-sm'}`}>
                    <LogIn size={18} />
                    {!isCollapsed && <span>Login</span>}
                </button>
            </div>
        )}
        {showRegistryLink && !isCollapsed && (
          <div className="px-4 pb-4">
               <button onClick={(e) => { e.stopPropagation(); setActiveTab('registry'); }} className="w-full flex items-center gap-3 text-green-200 hover:text-[#FBBF24] text-[10px] font-black uppercase tracking-widest py-2">
                  <UserPlus size={16} />
                  <span>User Registry</span>
              </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
