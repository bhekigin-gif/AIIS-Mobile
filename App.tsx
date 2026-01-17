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
import CapacityBuilding from './components/CapacityBuilding';
import Information from './components/Information';
import ProfileModal from './components/ProfileModal';
import { SalesProduct, MarketCartItem, MarketOrder, UserRole, UserProfile } from './types';
import { ShieldAlert, Loader2, Sparkles, X, MoreVertical, LayoutDashboard, ShoppingCart, Factory, Shield, BookOpen, Info, MapPinned, MessageSquareText, Save, CheckCircle2 } from 'lucide-react';
import { Initialize_Database, View_Trading_Catalogue_Items } from './services/adminDataService';
import { db, Table as DbTable } from './services/databaseService';
import { convertToCSV, flattenEnterprises } from './services/csvService';

const AccessDenied = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm m-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4"><ShieldAlert size={48} /></div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Unauthorized</h3>
        <p className="text-slate-500 text-sm">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  // Set initial tab to login to force authentication on startup
  const [activeTab, setActiveTab] = useState('login');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1280);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [marketCart, setMarketCart] = useState<MarketCartItem[]>([]);
  const [globalOrders, setGlobalOrders] = useState<MarketOrder[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [showBackupToast, setShowBackupToast] = useState(false);

  const isMobile = windowWidth < 768;
  const isDesktop = windowWidth >= 1024;

  // AUTO-BACKUP ENGINE (10 Minute Period)
  useEffect(() => {
    if (!isDbReady) return;

    const performBackup = async () => {
        try {
            const [users, enterprises, products, orders, catalogue, metadata] = await Promise.all([
                db.getAll(DbTable.Users),
                db.getAll(DbTable.Enterprises),
                db.getAll(DbTable.Products),
                db.getAll(DbTable.Orders),
                db.getAll(DbTable.Catalogue),
                db.getAll(DbTable.Metadata)
            ]);

            const flattened = flattenEnterprises(enterprises);
            
            const snapshot = {
                id: `BACKUP-${Date.now()}`,
                timestamp: new Date().toISOString(),
                files: {
                    users: convertToCSV(users),
                    hubs: convertToCSV(flattened.hubs),
                    units: convertToCSV(flattened.units),
                    inventory: convertToCSV(flattened.inventory),
                    operations: convertToCSV(flattened.operations),
                    logs: convertToCSV(flattened.logs),
                    products: convertToCSV(products),
                    orders: convertToCSV(orders),
                    catalogue: convertToCSV(catalogue),
                    metadata: JSON.stringify(metadata)
                }
            };

            await db.insert(DbTable.Backups, snapshot);
            setLastBackupTime(new Date().toLocaleTimeString());
            setShowBackupToast(true);
            setTimeout(() => setShowBackupToast(false), 3000);
            console.log("AIIS: 10-Minute Periodic Snapshot Committed.");
        } catch (error) {
            console.error("AIIS: Periodic Backup Node Error", error);
        }
    };

    const interval = setInterval(performBackup, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [isDbReady]);

  useEffect(() => {
    Initialize_Database().then(async () => {
        const items = await View_Trading_Catalogue_Items();
        setProducts(items);
        setIsDbReady(true);
    });

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      if (currentWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (id: string) => {
      if (id === 'advisor') {
        setIsAIAdvisorOpen(true);
      } else { 
        setActiveTab(id); 
        if (windowWidth < 1024) {
          setIsSidebarCollapsed(true);
        }
      }
  };

  const renderContent = () => {
    if (!isDbReady) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#1B4D3E]" size={48}/></div>;
    if (activeTab === 'login') return <Login onLogin={(u) => { setUser(u); setActiveTab('dashboard'); }} onRegister={() => setActiveTab('registry')} />;
    if (activeTab === 'registry') return <Registration onBackToLogin={() => setActiveTab('login')} onBackToHome={() => setActiveTab('dashboard')} />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} onRegister={() => setActiveTab('registry')} onOpenAdvisor={() => setIsAIAdvisorOpen(true)} />;
      case 'market': return <Marketplace products={products} setProducts={setProducts} cart={marketCart} setCart={setMarketCart} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} user={user} onRegisterClick={() => setActiveTab('registry')} />;
      case 'production': return (user?.role === UserRole.Farmer || user?.role === UserRole.Extension) ? <Production user={user} products={products} setProducts={setProducts} globalOrders={globalOrders} setGlobalOrders={setGlobalOrders} /> : <AccessDenied message="Access restricted to Producers and Extension Officers." />;
      case 'admin': return (user?.role === UserRole.Government || user?.role === UserRole.Extension) ? <AdminModule currentUser={user} /> : <AccessDenied message="Authorized Officials only." />;
      case 'capacity': return <CapacityBuilding user={user} />;
      case 'info': return <Information />;
      default: return <Dashboard user={user} onRegister={() => setActiveTab('registry')} onOpenAdvisor={() => setIsAIAdvisorOpen(true)} />;
    }
  };

  const commonNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
    { id: 'market', label: 'Trade Hub', icon: <ShoppingCart size={20}/> },
    { id: 'advisor', label: 'AI Advisor', icon: <MessageSquareText size={20}/> },
    { id: 'info', label: 'Information Centre', icon: <Info size={20}/> },
    { id: 'capacity', label: 'Capacity Building', icon: <BookOpen size={20}/> },
    ...(user?.role === UserRole.Farmer ? [{ id: 'production', label: 'Ops Manager', icon: <Factory size={20}/> }] : []),
    ...(user?.role === UserRole.Extension ? [{ id: 'production', label: 'Outreach Hub', icon: <Factory size={20}/> }] : []),
    ...(user?.role === UserRole.Government ? [{ id: 'admin', label: 'Oversight', icon: <Shield size={20}/> }] : []),
    ...(user?.role === UserRole.Extension ? [{ id: 'admin', label: 'Field Registry', icon: <Shield size={20}/> }] : [])
  ];

  // If in a "Gatekeeper" state (Login, Registry, or DB Loading), show only the content view without global navigation
  if (activeTab === 'login' || activeTab === 'registry' || !isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-hidden font-sans">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        user={user} 
        onLogout={() => { setUser(null); setActiveTab('login'); }} 
        onProfileClick={() => setIsProfileOpen(true)} 
        navItems={commonNavItems} 
        activeTab={activeTab} 
        setActiveTab={handleNavClick} 
        className={`${isDesktop ? 'relative' : 'fixed inset-y-0 left-0 transform transition-transform duration-300 z-[160] shadow-2xl'} 
                   ${!isDesktop && isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}
      />

      <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-white">
          <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-white border-b border-slate-100 shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                {!isDesktop && (
                  <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 bg-slate-50 text-[#1B4D3E] hover:bg-slate-100 rounded-xl transition-colors">
                    <MoreVertical size={20}/>
                  </button>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-tight text-[#1B4D3E]">AIIS Node</span>
                      {isDesktop && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-md uppercase border border-emerald-100 ml-2">v4.0 Enterprise</span>}
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden xs:block">Eswatini • Agriculture</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {lastBackupTime && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-400">
                        <Save size={12}/> Last Sync: {lastBackupTime}
                    </div>
                )}
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 sm:pr-4 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1B4D3E] flex items-center justify-center text-[10px] sm:text-[12px] font-black text-white">
                      {user?.name?.charAt(0) || 'G'}
                  </div>
                  <div className="hidden sm:flex flex-col overflow-hidden max-w-[120px]">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{user?.name || 'Guest'}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase truncate">{user?.actorType || 'Portal'}</span>
                  </div>
                </button>
              </div>
          </header>

          <div className={`flex-1 overflow-y-auto no-scrollbar ${isDesktop ? 'p-8' : 'p-4 pb-24'}`}>
              <div className="max-w-[1600px] mx-auto w-full">
                  {renderContent()}
              </div>
          </div>

          {isMobile && (
            <BottomNav activeTab={activeTab} setActiveTab={handleNavClick} user={user} onMoreClick={() => setIsSidebarCollapsed(false)} toggleAI={() => setIsAIAdvisorOpen(true)} />
          )}

          {/* AUTO-BACKUP TOAST */}
          {showBackupToast && (
              <div className="fixed top-20 right-8 z-[200] bg-[#1B4D3E] text-[#FBBF24] px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-up">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
                      <CheckCircle2 size={16}/>
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">Auto-Sync Complete</p>
                      <p className="text-[8px] text-green-300 font-bold uppercase mt-1">Institutional Snapshots Committed</p>
                  </div>
              </div>
          )}
      </main>

      <div className={`fixed inset-y-0 right-0 z-[170] w-full sm:w-[480px] bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-in-out border-l border-slate-100 ${isAIAdvisorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="p-5 sm:p-6 bg-[#1B4D3E] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                    <Sparkles className="text-[#FBBF24]" size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-tight leading-none">AIIS Expert</h3>
                    <p className="text-[9px] text-green-300 font-bold uppercase tracking-widest mt-1">Knowledge Node</p>
                  </div>
                </div>
                <button onClick={() => setIsAIAdvisorOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
                <AIAdvisor currentUser={user} />
            </div>
        </div>
      </div>

      {isProfileOpen && user && (
        <ProfileModal 
            user={user} 
            onClose={() => setIsProfileOpen(false)} 
            onSave={(updated) => { setUser(updated); setIsProfileOpen(false); }} 
        />
      )}
      
      {!isSidebarCollapsed && !isDesktop && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[155] animate-fade-in" onClick={() => setIsSidebarCollapsed(true)} />
      )}
    </div>
  );
};

export default App;