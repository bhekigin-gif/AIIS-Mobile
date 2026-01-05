
import React from 'react';
import { LayoutDashboard, Factory, ShoppingCart, MessageSquareText, Menu } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  user: UserProfile | null;
  onMoreClick: () => void;
  toggleAI: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, user, onMoreClick, toggleAI }) => {
  const isFarmer = user?.role === UserRole.Farmer;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-[90] flex justify-around items-center px-2 py-3 safe-area-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'dashboard' ? 'text-[#1B4D3E]' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={22} className={activeTab === 'dashboard' ? 'scale-110' : ''} />
        <span className="text-[10px] font-black uppercase tracking-tight">Home</span>
      </button>

      {isFarmer && (
        <button 
          onClick={() => setActiveTab('production')}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'production' ? 'text-[#1B4D3E]' : 'text-slate-400'}`}
        >
          <Factory size={22} className={activeTab === 'production' ? 'scale-110' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tight">Ops</span>
        </button>
      )}

      <button 
        onClick={() => setActiveTab('market')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'market' ? 'text-[#1B4D3E]' : 'text-slate-400'}`}
      >
        <ShoppingCart size={22} className={activeTab === 'market' ? 'scale-110' : ''} />
        <span className="text-[10px] font-black uppercase tracking-tight">Trade</span>
      </button>

      <button 
        onClick={toggleAI}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 relative"
      >
        <div className="bg-[#1B4D3E] p-2.5 rounded-2xl -mt-8 shadow-xl border-4 border-white">
            <MessageSquareText size={20} className="text-[#FBBF24]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-tight mt-1">Advisor</span>
      </button>

      <button 
        onClick={onMoreClick}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400"
      >
        <Menu size={22} />
        <span className="text-[10px] font-black uppercase tracking-tight">More</span>
      </button>
    </nav>
  );
};

export default BottomNav;
