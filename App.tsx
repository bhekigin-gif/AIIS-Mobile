
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import Marketplace from './components/Marketplace';
import AIAdvisor from './components/AIAdvisor';
import Production from './components/Production';
import Login from './components/Login';
import Information from './components/Information';
import CapacityBuilding from './components/CapacityBuilding';
import AdminModule from './components/AdminModule';
import ProfileModal from './components/ProfileModal';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserRole, UserProfile } from './types';
import { LayoutDashboard, Info, Factory, ShoppingCart, MessageSquareText, Users, ShieldCheck, ClipboardCheck, BarChart4, Sparkles, X, ShieldAlert, MoreVertical, Loader2 } from 'lucide-react';
import { Initialize_Database, View_Trading_Catalogue_Items } from './services/adminDataService';
import { db, Table } from './services/databaseService';

const AccessDenied = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm m-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
            <ShieldAlert size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Unauthorized</h3>
        <p className="text-slate-500 text-sm">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [marketCart, setMarketCart] = useState<MarketCartItem[]>([]);
  const [globalOrders, setGlobalOrders] = useState<MarketOrder[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // DB Initialization
  useEffect(() => {
    const setup = async () => {
        await Initialize_Database();
        const items = await View_Trading_Catalogue_Items();
        setProducts(items);
        setIsDbReady(true);
    };
    setup();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (authenticatedUser: UserProfile) => {
      setUser({
          ...authenticatedUser,
          title: authenticatedUser.title || (authenticatedUser.role === UserRole.Government ? 'Officer' : `${authenticatedUser.actorType} Specialist`),
      });
      setActiveTab('dashboard');
      setIsSidebarCollapsed(true);
  };

  const handleLogout = () => {
      setUser(null);
      setActiveTab('login');
      setIsAIAdvisorOpen(false);
      setIsSidebarCollapsed(true);
  };

  const toggleAIAdvisor = useCallback(() => setIsAIAdvisorOpen(prev => !prev), []);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);

  const navItems = useMemo(() => {
      if (user?.role === UserRole.Farmer) {
          return [
              { id: 'dashboard', label: 'Summary', icon: <LayoutDashboard size={20} /> },
              { id: 'production', label: 'Operations', icon: <Factory size={20} /> }, 
              { id: 'market', label: 'Trade Hub', icon: <ShoppingCart size={20} /> },
              { id: 'advisor', label: 'AI Advisor', icon: <MessageSquareText size={20} />, isDrawer: true },
              { id: 'information', label: 'Notices', icon: <Info size={20} /> },
              { id: 'resources', label: 'Knowledge', icon: <Users size={20} /> },
          ];
      }
      if (user?.role === UserRole.Government || user?.role === UserRole.Extension) {
          return [
              { id: 'dashboard', label: 'Stats', icon: <BarChart4 size={20} /> },
              { id: 'admin', label: 'Admin', icon: <ShieldCheck size={20} /> },
              { id: 'market', label: 'Oversight', icon: <ClipboardCheck size={20} /> },
              { id: 'advisor', label: 'AI Helper', icon: <MessageSquareText size={20} />, isDrawer: true },
          ];
      }
      return [
        { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { id: 'market', label: 'Market', icon: <ShoppingCart size={20} /> },
        { id: 'information', label: 'Info', icon: <Info size={20} /> },
        { id: 'advisor', label: 'AI Expert', icon: <MessageSquareText size={20} />, isDrawer: true },
      ];
  }, [user]);

  const handleNavClick = (id: string) => {
      const item = navItems.find(n => n.id === id);
      if (item?.isDrawer) {
          toggleAIAdvisor();
      } else {
          setActiveTab(id);
          setIsSidebarCollapsed(true);
      }
  };

  const renderContent = () => {
    if (!isDbReady) return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin text-[#1B4D3E]" size={48}/>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing National DB...</p>
        </div>
    );

    if (activeTab === 'login') return <Login onLogin={handleLogin} onRegister={() => setActiveTab('registry')} />;
    if (activeTab === 'registry') return <Registration onBackToLogin={() => setActiveTab('login')} onBackToHome={() => setActiveTab('dashboard')} />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} onRegister={() => setActiveTab('registry')} />;
      case 'information': return <Information />;
      case 'resources': return <CapacityBuilding />;
      case 'market': return <Marketplace products={products} setProducts={setProducts} cart={marketCart} setCart={setMarketCart} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} user={user} />;
      case 'production':
        if (user?.role === UserRole.Farmer) return <Production user={user} products={products} setProducts={setProducts} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} />;
        return <AccessDenied message="Production tools are for verified farmers." />;
      case 'admin':
        if (user?.role === UserRole.Government || user?.role === UserRole.Extension) return <AdminModule currentUser={user} />;
        return <AccessDenied message="Administrative module restricted." />;
      default: return <Dashboard user={user} onRegister={() => setActiveTab('registry')} />;
    }
  };

  const showNavBars = activeTab !== 'login' && activeTab !== 'registry';

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden safe-pt no-select">
      {isMobile && !isSidebarCollapsed && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] animate-fade-in" onClick={toggleSidebar} />
      )}
      {isAIAdvisorOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[140] animate-fade-in" onClick={toggleAIAdvisor} />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavClick} 
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
        navItems={navItems}
        className={isMobile ? `fixed inset-y-0 left-0 z-[120] transform transition-transform duration-300 ease-out mobile-panel-shadow ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}` : ''}
      />

      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300
          ${!isMobile ? (isSidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}`}>
        
        {isMobile && showNavBars && (
            <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shrink-0 shadow-sm">
                <button onClick={toggleSidebar} className="p-2 text-[#1B4D3E] hover:bg-slate-50 rounded-xl"><MoreVertical size={22}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-[#1B4D3E] tracking-[0.2em]">AIIS Mobile</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{activeTab} node</span>
                </div>
                <button onClick={() => setIsProfileModalOpen(true)} className="p-2 text-[#1B4D3E] hover:bg-slate-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[10px]">
                        {user?.name?.charAt(0) || 'G'}
                    </div>
                </button>
            </header>
        )}

        <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth ${isMobile && showNavBars ? 'pb-24' : 'p-4 md:p-8'}`}>
            <div className="max-w-7xl mx-auto h-full">
                {renderContent()}
            </div>
        </div>
      </main>

      {isMobile && showNavBars && (
          <BottomNav 
            activeTab={activeTab}
            setActiveTab={handleNavClick}
            user={user}
            onMoreClick={toggleSidebar}
            toggleAI={toggleAIAdvisor}
          />
      )}

      <div className={`fixed inset-y-0 right-0 z-[150] w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out border-l border-slate-200 ${isAIAdvisorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="p-5 bg-[#1B4D3E] text-white flex justify-between items-center shadow-md shrink-0">
                <div className="flex items-center gap-3">
                    <Sparkles className="text-[#FBBF24]" size={24} />
                    <div><h3 className="font-bold text-sm">AIIS Expert</h3><p className="text-[9px] text-green-200 uppercase tracking-widest font-black">National Intelligence</p></div>
                </div>
                <button onClick={toggleAIAdvisor} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden h-full"><AIAdvisor /></div>
        </div>
      </div>

      {isProfileModalOpen && user && (
          <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} onSave={(u) => {
              setUser(u);
              db.update(Table.Users, u.id!, u);
          }} />
      )}

      {!isMobile && (
          <button 
            onClick={toggleAIAdvisor} 
            className={`fixed bottom-8 right-8 z-[90] p-4 bg-[#1B4D3E] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group ${isAIAdvisorOpen ? 'scale-0' : 'scale-100'}`} 
          >
            <div className="relative"><MessageSquareText size={28} /><div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FBBF24] rounded-full border-2 border-[#1B4D3E] animate-pulse"></div></div>
          </button>
      )}
    </div>
  );
};

export default App;
