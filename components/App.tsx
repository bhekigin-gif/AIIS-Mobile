
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import Marketplace from './components/Marketplace';
import AIAdvisor from './components/AIAdvisor';
import Production from './components/Production';
import Login from './components/Login';
import AdminModule from './components/AdminModule';
import { SalesProduct, MarketCartItem, MarketOrder, UserRole, UserProfile } from './types';
import { ShieldAlert, Loader2, Sparkles, X, MoreVertical, Monitor, Smartphone, LayoutDashboard, ShoppingCart, Factory, Shield } from 'lucide-react';
import { Initialize_Database, View_Trading_Catalogue_Items } from './services/adminDataService';

const AccessDenied = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm m-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4"><ShieldAlert size={48} /></div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Unauthorized</h3>
        <p className="text-slate-500 text-sm">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [marketCart, setMarketCart] = useState<MarketCartItem[]>([]);
  const [globalOrders, setGlobalOrders] = useState<MarketOrder[]>([]);
  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth < 768);

  useEffect(() => {
    Initialize_Database().then(async () => {
        const items = await View_Trading_Catalogue_Items();
        setProducts(items);
        setIsDbReady(true);
    });

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileDevice(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (id: string) => {
      if (id === 'advisor') setIsAIAdvisorOpen(true);
      else { setActiveTab(id); if (viewMode === 'mobile') setIsSidebarCollapsed(true); }
  };

  const renderContent = () => {
    if (!isDbReady) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#1B4D3E]" size={48}/></div>;
    if (activeTab === 'login') return <Login onLogin={(u) => { setUser(u); setActiveTab('dashboard'); }} onRegister={() => setActiveTab('registry')} />;
    if (activeTab === 'registry') return <Registration onBackToLogin={() => setActiveTab('login')} onBackToHome={() => setActiveTab('dashboard')} />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} onRegister={() => setActiveTab('registry')} />;
      case 'market': return <Marketplace products={products} setProducts={setProducts} cart={marketCart} setCart={setMarketCart} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} user={user} />;
      case 'production': return user?.role === UserRole.Farmer ? <Production user={user} products={products} setProducts={setProducts} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} /> : <AccessDenied message="Farmers only." />;
      case 'admin': return user?.role === UserRole.Government ? <AdminModule currentUser={user} /> : <AccessDenied message="Officials only." />;
      default: return <Dashboard user={user} onRegister={() => setActiveTab('registry')} />;
    }
  };

  const isDesktopView = viewMode === 'desktop';

  // Handler to shrink sidebar on work area click
  const handleWorkAreaClick = () => {
      if (!isSidebarCollapsed && isDesktopView) {
          setIsSidebarCollapsed(true);
      }
  };

  return (
    <div className={`flex h-screen w-screen transition-colors duration-500 items-center justify-center overflow-hidden ${isDesktopView ? 'bg-slate-50' : 'bg-slate-900'}`}>
      
      {!isMobileDevice && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]">
          <button 
            onClick={() => { setViewMode('mobile'); setIsSidebarCollapsed(true); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50'}`}
          >
            <Smartphone size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Mobile</span>
          </button>
          <button 
            onClick={() => { setViewMode('desktop'); setIsSidebarCollapsed(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50'}`}
          >
            <Monitor size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">WorkSpace</span>
          </button>
        </div>
      )}

      <div className={`relative bg-white transition-all duration-700 ease-out flex
        ${!isMobileDevice && viewMode === 'mobile' 
          ? 'h-[92vh] aspect-[1/2] rounded-[3.5rem] border-[14px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.6)] overflow-hidden scale-[0.85]' 
          : 'h-full w-full border-none rounded-none'}`}>
        
        {isDesktopView && (
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            user={user} 
            onLogout={() => setUser(null)} 
            onProfileClick={() => {}} 
            navItems={[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
              { id: 'market', label: 'Trade Hub', icon: <ShoppingCart size={20}/> },
              ...(user?.role === UserRole.Farmer ? [{ id: 'production', label: 'Ops Manager', icon: <Factory size={20}/> }] : []),
              ...(user?.role === UserRole.Government ? [{ id: 'admin', label: 'Oversight', icon: <Shield size={20}/> }] : [])
            ]} 
            activeTab={activeTab} 
            setActiveTab={handleNavClick} 
            className="relative shrink-0"
          />
        )}

        <main className="flex-1 h-full flex flex-col relative overflow-hidden" onClick={handleWorkAreaClick}>
            <header className={`flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 shrink-0 z-10`}>
                <div className="flex items-center gap-4">
                  {!isDesktopView && (
                    <button onClick={() => setIsSidebarCollapsed(false)} className="p-2.5 bg-slate-50 text-[#1B4D3E] hover:bg-slate-100 rounded-xl transition-colors">
                      <MoreVertical size={20}/>
                    </button>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1B4D3E]">AIIS National Node</span>
                        {isDesktopView && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-md uppercase">v4.0 Enterprise</span>}
                    </div>
                    {isDesktopView && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ministry of Agriculture • Eswatini</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {isDesktopView && (
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-700 uppercase">{new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric'})}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">System Status: Nominal</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100 mx-2"></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl border border-slate-100 pr-4">
                    <div className="w-9 h-9 rounded-xl bg-[#1B4D3E] flex items-center justify-center text-[12px] font-black text-white shadow-lg">
                        {user?.name?.charAt(0) || 'G'}
                    </div>
                    {isDesktopView && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{user?.name || 'Guest User'}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{user?.actorType || 'National Portal'}</span>
                        </div>
                    )}
                  </div>
                </div>
            </header>

            <div className={`flex-1 overflow-y-auto no-scrollbar ${isDesktopView ? 'p-10 2xl:p-14' : 'p-6'}`}>
                <div className={`${isDesktopView ? 'max-w-[1600px] mx-auto w-full h-full' : 'h-full'}`}>
                    {renderContent()}
                </div>
            </div>

            {!isDesktopView && (
              <BottomNav activeTab={activeTab} setActiveTab={handleNavClick} user={user} onMoreClick={() => setIsSidebarCollapsed(false)} toggleAI={() => setIsAIAdvisorOpen(true)} />
            )}
        </main>

        {!isDesktopView && (
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            user={user} 
            onLogout={() => setUser(null)} 
            onProfileClick={() => {}} 
            navItems={[
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
                { id: 'market', label: 'Trade Hub', icon: <ShoppingCart size={20}/> },
                ...(user?.role === UserRole.Farmer ? [{ id: 'production', label: 'Ops Manager', icon: <Factory size={20}/> }] : []),
                ...(user?.role === UserRole.Government ? [{ id: 'admin', label: 'Oversight', icon: <Shield size={20}/> }] : [])
            ]} 
            activeTab={activeTab} 
            setActiveTab={handleNavClick} 
            className={`fixed inset-y-0 left-0 transform transition-transform duration-300 z-[160] ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`} 
          />
        )}
      </div>

      <div className={`fixed inset-y-0 right-0 z-[170] w-full sm:w-[480px] bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-in-out border-l border-slate-100 ${isAIAdvisorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="p-8 bg-[#1B4D3E] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Sparkles className="text-[#FBBF24]" size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight leading-none">AIIS Expert</h3>
                    <p className="text-[10px] text-green-300 font-bold uppercase tracking-[0.2em] mt-1.5">National Knowledge Node</p>
                  </div>
                </div>
                <button onClick={() => setIsAIAdvisorOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/60 hover:text-white"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-hidden"><AIAdvisor /></div>
        </div>
      </div>
      
      {!isSidebarCollapsed && !isDesktopView && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[155] animate-fade-in" onClick={() => setIsSidebarCollapsed(true)} />
      )}
    </div>
  );
};

export default App;
