
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
import { LayoutDashboard, Info, Factory, ShoppingCart, MessageSquareText, Users, ShieldCheck, ClipboardCheck, BarChart4, Sparkles, X, ShieldAlert, MoreVertical } from 'lucide-react';

const initialProducts: SalesProduct[] = [
    { id: 'SP-101', name: 'Maize Meal', category: 'Processed Food', commodityType: 'Maize', price: 65, unit: '10kg', quantity: 200, status: 'Active', dateListed: '2023-11-15', sellerName: 'Malkerns Farm', region: Region.Manzini, image: 'https://images.unsplash.com/photo-1621996659490-6213b027d92f?auto=format&fit=crop&q=80&w=300' },
    { id: 'SP-102', name: 'Fresh Cabbage', category: 'Fresh Produce', commodityType: 'Vegetables', price: 20, unit: 'Pack (2)', quantity: 150, status: 'Active', dateListed: '2023-11-16', sellerName: 'Nhlangano Farmers', region: Region.Shiselweni, image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&q=80&w=300' },
];

const AccessDenied = ({ message }: { message: string }) => (
    <div class="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm m-4">
        <div class="p-4 bg-red-50 text-red-500 rounded-full mb-4">
            <ShieldAlert size={48} />
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">Unauthorized</h3>
        <p class="text-slate-500 text-sm">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<SalesProduct[]>(initialProducts);
  const [marketCart, setMarketCart] = useState<MarketCartItem[]>([]);
  const [globalOrders, setGlobalOrders] = useState<MarketOrder[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    <div class="flex h-full w-full bg-slate-50 relative overflow-hidden safe-pt no-select">
      
      {/* Mobile Drawer Backdrops */}
      {isMobile && !isSidebarCollapsed && (
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] animate-fade-in" onClick={toggleSidebar} />
      )}
      {isAIAdvisorOpen && (
          <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[140] animate-fade-in" onClick={toggleAIAdvisor} />
      )}

      {/* Navigation (Sidebar/Drawer) */}
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

      {/* Main Container */}
      <main class={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300
          ${!isMobile ? (isSidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}`}>
        
        {/* Mobile Header Bar */}
        {isMobile && showNavBars && (
            <header class="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shrink-0 shadow-sm">
                <button onClick={toggleSidebar} class="p-2 text-[#1B4D3E] hover:bg-slate-50 rounded-xl"><MoreVertical size={22}/></button>
                <div class="flex flex-col items-center">
                    <span class="text-[10px] font-black uppercase text-[#1B4D3E] tracking-[0.2em]">AIIS Mobile</span>
                    <span class="text-[8px] font-bold text-slate-400 uppercase">{activeTab} node</span>
                </div>
                <button onClick={() => setIsProfileModalOpen(true)} class="p-2 text-[#1B4D3E] hover:bg-slate-50 rounded-xl">
                    <div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[10px]">
                        {user?.name?.charAt(0) || 'G'}
                    </div>
                </button>
            </header>
        )}

        <div class={`flex-1 overflow-y-auto no-scrollbar scroll-smooth ${isMobile && showNavBars ? 'pb-24' : 'p-4 md:p-8'}`}>
            <div class="max-w-7xl mx-auto h-full">
                {renderContent()}
            </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && showNavBars && (
          <BottomNav 
            activeTab={activeTab}
            setActiveTab={handleNavClick}
            user={user}
            onMoreClick={toggleSidebar}
            toggleAI={toggleAIAdvisor}
          />
      )}

      {/* AI Advisor Sliding Panel (Right) */}
      <div class={`fixed inset-y-0 right-0 z-[150] w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out border-l border-slate-200 ${isAIAdvisorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div class="h-full flex flex-col">
            <div class="p-5 bg-[#1B4D3E] text-white flex justify-between items-center shadow-md shrink-0">
                <div class="flex items-center gap-3">
                    <Sparkles class="text-[#FBBF24]" size={24} />
                    <div><h3 class="font-bold text-sm">AIIS Expert</h3><p class="text-[9px] text-green-200 uppercase tracking-widest font-black">National Intelligence</p></div>
                </div>
                <button onClick={toggleAIAdvisor} class="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div class="flex-1 overflow-hidden h-full"><AIAdvisor /></div>
        </div>
      </div>

      {/* Modals & Floating UI */}
      {isProfileModalOpen && user && (
          <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} onSave={(u) => setUser(u)} />
      )}

      {!isMobile && (
          <button 
            onClick={toggleAIAdvisor} 
            class={`fixed bottom-8 right-8 z-[90] p-4 bg-[#1B4D3E] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group ${isAIAdvisorOpen ? 'scale-0' : 'scale-100'}`} 
          >
            <div class="relative"><MessageSquareText size={28} /><div class="absolute -top-1 -right-1 w-3 h-3 bg-[#FBBF24] rounded-full border-2 border-[#1B4D3E] animate-pulse"></div></div>
          </button>
      )}
    </div>
  );
};

export default App;
