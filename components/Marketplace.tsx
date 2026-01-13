import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ShoppingBag, MapPin, Trash2, ArrowLeft, ArrowRight, 
  CreditCard, CheckCircle, XCircle, Package, FileText, Download, Eye, 
  ChevronRight, Upload, X, Plus, Store, PackagePlus, Edit, TrendingUp, 
  ClipboardList, Clock, Truck, Camera, ImageIcon, MessageCircleWarning, 
  ShieldCheck, SearchCode, History, Building, User, Info, Sparkles, 
  Map as MapIcon, Calendar, UserCheck, Tag, Phone, Building2, QrCode, 
  RefreshCw, Sprout, Layers, Link, ArrowUpRight, BarChart3, Database, 
  Landmark, Receipt, FileSearch, Target, Wallet, ShoppingCart, FileUp, Table, Loader2,
  Fingerprint, Activity, Zap, ChevronDown, Globe, TruckIcon, Minus, CheckCircle2, ClipboardCheck,
  SearchX, BadgeCheck, ShieldAlert, Check as CheckIcon
} from 'lucide-react';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserProfile, OrderStatus, UserRole, CatalogueItem, ResourceType, ActorType } from '../types';
import { Get_Product_By_ID, Get_User_By_ID, View_Master_Catalogue, Add_To_Master_Catalogue, Get_System_Metadata, updateProductStatus } from '../services/adminDataService';
import { getTraceabilityReport } from '../services/geminiService';
import { db, Table as DbTable } from '../services/databaseService';

interface MarketplaceProps {
    products: SalesProduct[];
    setProducts: React.Dispatch<React.SetStateAction<SalesProduct[]>>;
    cart: MarketCartItem[];
    setCart: React.Dispatch<React.SetStateAction<MarketCartItem[]>>;
    globalOrders: MarketOrder[];
    setGlobalOrders: React.Dispatch<React.SetStateAction<MarketOrder[]>>;
    user: UserProfile | null;
}

const PLACE_HOLDER_IMAGE = "https://images.unsplash.com/photo-1492496913980-501348b61384?w=300&h=300&fit=crop";

const Marketplace: React.FC<MarketplaceProps> = ({ products, setProducts, cart, setCart, globalOrders, setGlobalOrders, user }) => {
  const [viewStep, setViewStep] = useState<'browse' | 'cart' | 'checkout' | 'success' | 'prices' | 'manage' | 'orders' | 'trace' | 'vetting'>('browse');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [traceInput, setTraceInput] = useState('');
  const [activeTrace, setActiveTrace] = useState<any>(null);
  const [isSearchingTrace, setIsSearchingTrace] = useState(false);
  const [aiTraceReport, setAiTraceReport] = useState<string>('');
  const [systemMetadata, setSystemMetadata] = useState<any>(null);

  const [editingDraft, setEditingDraft] = useState<SalesProduct | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Commerce States
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [orderEvidence, setOrderEvidence] = useState<{ id: string, image: string, ref: string } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const transportProviders = [
    { id: 'TR-01', name: 'Logistics Coop', rate: 1500, region: 'Regional' },
    { id: 'TR-02', name: 'Manzini Express Haulers', rate: 800, region: 'Manzini' },
    { id: 'TR-03', name: 'Shiselweni Linkers', rate: 1200, region: 'Shiselweni' },
  ];

  const isExtension = user?.actorType === ActorType.Extension;

  useEffect(() => {
    const init = async () => {
        const meta = await Get_System_Metadata();
        setSystemMetadata(meta);
        if (user) {
            const enterprises = await db.getAll<any>(DbTable.Enterprises);
            const units = enterprises
              .filter(e => e.ownerId === user.id || e.organizationId === user.organizationId)
              .flatMap(e => (e.units || []).map((u: any) => ({ ...u, enterpriseName: e.name })));
            setMyUnits(units);
        }
        const orders = await db.getAll<MarketOrder>(DbTable.Orders);
        setGlobalOrders(orders);
    };
    init();
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = filterRegion === 'All' || p.region === filterRegion;
        const isActive = p.status === 'Active';
        return matchesSearch && matchesRegion && isActive;
    });
  }, [products, searchTerm, filterRegion]);

  const vettingProducts = useMemo(() => {
    if (!isExtension) return [];
    return products.filter(p => {
        const matchesLocation = p.tinkhundla === user?.tinkhundla || p.region === user?.region;
        const isPending = p.status === 'Pending Approval';
        return matchesLocation && isPending;
    });
  }, [products, user, isExtension]);

  const cartGroupedBySeller = useMemo(() => {
    return cart.reduce((acc, item) => {
        const sId = item.sellerId || 'unknown';
        if (!acc[sId]) acc[sId] = [];
        acc[sId].push(item);
        return acc;
    }, {} as Record<string, MarketCartItem[]>);
  }, [cart]);

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, cartQty: Math.max(1, item.cartQty + delta) } : item));
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedTransport) return;
    if (cart.some(i => !i.destinationUnitId)) return alert("Assign destination unit for all items.");

    setIsSubmittingOrder(true);
    const newOrders: MarketOrder[] = [];
    const sellers = Object.keys(cartGroupedBySeller);

    for (const sId of sellers) {
        const items = cartGroupedBySeller[sId];
        const subTotal = items.reduce((s, i) => s + (i.price * i.cartQty), 0);
        const order: MarketOrder = {
            id: `ORD-${Date.now()}-${sId.slice(-4)}`,
            items: items,
            total: subTotal + (selectedTransport.rate / sellers.length),
            status: 'Request',
            customerName: user.name, customerId: user.id!,
            sellerId: sId, sellerName: items[0].sellerName || 'Institutional Producer',
            date: new Date().toISOString(), region: user.region as Region,
            transportServiceId: selectedTransport.id, transportServiceName: selectedTransport.name
        };
        newOrders.push(order);
        await db.insert(DbTable.Orders, order);
    }

    setGlobalOrders(prev => [...newOrders, ...prev]);
    setCart([]); setViewStep('success'); setIsSubmittingOrder(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus, evidence?: { image: string, ref: string }) => {
    const orders = await db.getAll<MarketOrder>(DbTable.Orders);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updates: Partial<MarketOrder> = { status: newStatus };
    if (evidence) { updates.popImage = evidence.image; updates.popRef = evidence.ref; }

    await db.update(DbTable.Orders, orderId, updates);
    
    if (newStatus === 'Received') {
        const enterprises = await db.getAll<any>(DbTable.Enterprises);
        
        const sellerEnt = enterprises.find(e => e.ownerId === order.sellerId || e.organizationId === order.sellerId);
        if (sellerEnt) {
            order.items.forEach(item => {
                if (item.sourceUnit) {
                   const unit = sellerEnt.units?.find((u: any) => u.name === item.sourceUnit);
                   if (unit) unit.resources = unit.resources?.map((r: any) => (r.catalogueRef === item.id || r.name === item.name) ? { ...r, quantity: Math.max(0, r.quantity - item.cartQty) } : r);
                }
            });
            await db.update(Table.Enterprises, sellerEnt.id, sellerEnt);
        }

        const buyerEnt = enterprises.find(e => e.ownerId === user?.id || e.organizationId === user?.organizationId);
        if (buyerEnt) {
            order.items.forEach(item => {
                const unit = buyerEnt.units?.find((u: any) => u.id === item.destinationUnitId);
                if (unit) {
                    if (!unit.resources) unit.resources = [];
                    const existing = unit.resources.find((r: any) => r.name === item.name);
                    if (existing) existing.quantity += item.cartQty;
                    else unit.resources.push({ id: `RES-${Date.now()}`, name: item.name, type: ResourceType.Consumable, quantity: item.cartQty, startingQuantity: item.cartQty, unitCost: item.price, assignedUnitId: item.destinationUnitId!, status: 'Available', category: item.category || 'Commodity' });
                }
            });
            await db.update(Table.Enterprises, buyerEnt.id, buyerEnt);
        }
    }
    setGlobalOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    setOrderEvidence(null);
  };

  const handleVerifyProduct = async (productId: string, approve: boolean) => {
    const status = approve ? 'Active' : 'Rejected';
    await updateProductStatus(productId, status);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: status as any } : p));
  };

  const handleTraceSearch = async () => {
    if (!traceInput.trim()) return;
    setIsSearchingTrace(true);
    const product = await Get_Product_By_ID(traceInput);
    if (product) {
      const seller = await Get_User_By_ID(product.sellerId || '');
      setActiveTrace({ product, seller });
      setAiTraceReport(await getTraceabilityReport(product.id, product, seller));
    } else alert("Chronology ID not found.");
    setIsSearchingTrace(false);
  };

  const renderOrderActions = (order: MarketOrder) => {
    const isSeller = order.sellerId === user?.id || order.sellerId === user?.organizationId;
    const isBuyer = order.customerId === user?.id;
    if (order.status === 'Cancelled') return <span className="text-[10px] font-black text-rose-500 uppercase">Voided</span>;

    return (
        <div className="flex gap-2">
            <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase hover:bg-rose-100">Void Node</button>
            {order.status === 'Request' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Payment')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-indigo-700">Confirm Stock Availability</button>
            )}
            {order.status === 'Payment' && isBuyer && (
                <button onClick={() => setOrderEvidence({ id: order.id, image: '', ref: '' })} className="px-4 py-2 bg-[#1B4D3E] text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-900">Transmit PoP Evidence</button>
            )}
            {order.status === 'Confirmation' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Processing')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700">Audit & Initialize Process</button>
            )}
            {order.status === 'Processing' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Dispatched')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-purple-700">Dispatch Logistics Node</button>
            )}
            {order.status === 'Dispatched' && isBuyer && (
                <button onClick={() => handleStatusUpdate(order.id, 'Received')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700">Close Transaction Node</button>
            )}
        </div>
    );
  };

  if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]" size={48} /></div>;

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-end border-b border-slate-200 pb-6 shrink-0 flex-wrap gap-4">
            <div><h2 className="text-4xl font-black text-[#1B4D3E]">Trade Hub</h2><p className="text-slate-500 text-sm mt-1 font-medium">Institutional Coordinated Commerce</p></div>
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-x-auto no-scrollbar">
                {[ 
                    { id: 'browse', icon: <ShoppingCart size={16}/>, label: 'Trade' },
                    ...(isExtension ? [{ id: 'vetting', icon: <ShieldCheck size={16}/>, label: `Verify: ${user?.tinkhundla || 'Local'}` }] : []),
                    { id: 'orders', icon: <History size={16}/>, label: 'Orders' },
                    { id: 'manage', icon: <Store size={16}/>, label: 'My Hub' },
                    { id: 'trace', icon: <Fingerprint size={16}/>, label: 'Trace' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setViewStep(tab.id as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all whitespace-nowrap ${viewStep === tab.id ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {tab.icon}
                        <span className="text-[10px] font-black uppercase">{tab.label}</span>
                        {tab.id === 'vetting' && vettingProducts.length > 0 && <span className="w-2 h-2 bg-[#FBBF24] rounded-full animate-pulse ml-1" />}
                    </button>
                ))}
                <div className="w-px h-6 bg-slate-100 mx-1.5" /><button onClick={() => setViewStep('cart')} className={`p-2.5 rounded-xl transition-all relative ${viewStep === 'cart' ? 'bg-[#FBBF24] text-[#1B4D3E]' : 'bg-slate-50 text-slate-400'}`}><ShoppingBag size={18} />{cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black border-2 border-white">{cart.length}</span>}</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {viewStep === 'browse' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by Commodity, Seller, or Batch ID..." 
                                className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                            />
                        </div>
                        <select 
                            value={filterRegion} 
                            onChange={(e) => setFilterRegion(e.target.value)}
                            className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-black text-[10px] uppercase tracking-widest outline-none text-[#1B4D3E]"
                        >
                            <option value="All">All Regions</option>
                            {Object.values(Region).filter(r => r !== 'All').map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-fade-in">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all flex flex-col group h-[420px]">
                                    <div className="h-44 bg-slate-200 overflow-hidden shrink-0 relative">
                                        <img src={product.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase text-[#1B4D3E] shadow-sm border border-white/50">{product.region}</div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-slate-800 text-lg line-clamp-2 leading-tight flex-1">{product.name}</h4>
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-1 ml-2">Lot: {product.id.split('-').pop()}</span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1.5"><Store size={10} className="text-[#FBBF24]"/>{product.sellerName}</p>
                                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-3 font-medium leading-relaxed">{product.description}</p>
                                        </div>
                                        <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pricing</p>
                                                <p className="text-xl font-black text-[#1B4D3E]">E {product.price} <span className="text-[10px] text-slate-400">/ {product.unit}</span></p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (!cart.some(i => i.id === product.id)) {
                                                        setCart(prev => [...prev, { ...product, cartQty: 1 }]);
                                                    } else {
                                                        handleUpdateCartQty(product.id, 1);
                                                    }
                                                }} 
                                                className="bg-[#1B4D3E] text-white p-3.5 rounded-2xl hover:bg-[#143d31] transition-all shadow-lg active:scale-90"
                                            >
                                                <ShoppingCart size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 opacity-20">
                            <SearchX size={80} strokeWidth={1} className="text-[#1B4D3E]"/>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-widest text-[#1B4D3E]">No Hub Records</h3>
                                <p className="text-xs font-bold uppercase tracking-tighter">Adjust filters or search criteria</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {viewStep === 'vetting' && (
                <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
                    <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3"><ShieldCheck className="text-[#FBBF24]"/> Regional Vetting Queue</h3>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.3em] mt-2">Authorized for {user?.tinkhundla} Constituency</p>
                        </div>
                        <div className="relative z-10 px-6 py-3 bg-white/10 rounded-2xl border border-white/20 text-[10px] font-black uppercase tracking-widest">{vettingProducts.length} Pending Nodes</div>
                    </div>

                    {vettingProducts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {vettingProducts.map(product => (
                                <div key={product.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center group hover:border-indigo-400 transition-all">
                                    <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden shrink-0 bg-slate-100 shadow-lg group-hover:rotate-1 transition-transform">
                                        <img src={product.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800 leading-tight">{product.name}</h4>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <p className="text-[10px] font-mono font-black text-indigo-500 uppercase">{product.id}</p>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><User size={10}/> {product.sellerName}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{product.description}</p>
                                        <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                            <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Target Price</p><p className="text-lg font-black text-indigo-900">E {product.price}</p></div>
                                            <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Yield Node</p><p className="text-lg font-black text-indigo-900">{product.quantity} {product.unit}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 shrink-0">
                                        <button onClick={() => handleVerifyProduct(product.id, true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={18}/> Authorize Node</button>
                                        <button onClick={() => handleVerifyProduct(product.id, false)} className="px-8 py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-rose-300 transition-all">Reject Entry</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center space-y-6 opacity-30">
                            <BadgeCheck size={80} strokeWidth={1} className="text-indigo-400"/>
                            <h3 className="text-xl font-black uppercase tracking-widest">Verification Node Clear</h3>
                            <p className="text-xs font-bold uppercase">No pending productions in your regional scope.</p>
                        </div>
                    )}
                </div>
            )}

            {viewStep === 'cart' && (
                <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
                    {cart.length > 0 ? (
                        <>
                            {Object.keys(cartGroupedBySeller).map(sId => (
                                <div key={sId} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2 text-[#1B4D3E] font-black uppercase text-[10px] tracking-widest"><Store size={14} className="text-[#FBBF24]"/> {cartGroupedBySeller[sId][0].sellerName} Hub</div>
                                    {cartGroupedBySeller[sId].map(item => (
                                        <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100"><img src={item.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                            <div className="flex-1"><p className="font-black text-slate-800 text-sm leading-tight">{item.name}</p><p className="text-[9px] text-slate-400 uppercase mt-1">E {item.price} / {item.unit}</p></div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-1">
                                                    <button onClick={() => handleUpdateCartQty(item.id, -1)} className="p-1 hover:text-[#1B4D3E] transition-colors"><Minus size={14}/></button>
                                                    <span className="text-xs font-black min-w-[20px] text-center">{item.cartQty}</span>
                                                    <button onClick={() => handleUpdateCartQty(item.id, 1)} className="p-1 hover:text-[#1B4D3E] transition-colors"><Plus size={14}/></button>
                                                </div>
                                                <select value={item.destinationUnitId || ''} onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, destinationUnitId: e.target.value } : i))} className="w-48 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-700 outline-none cursor-pointer">
                                                    <option value="">Assign Destination Unit...</option>
                                                    {myUnits.map(u => <option key={u.id} value={u.id}>{u.enterpriseName} - {u.name}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-rose-500 p-2 transition-colors"><Trash2 size={20}/></button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div className="bg-[#1B4D3E] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6"><TruckIcon size={24} className="text-[#FBBF24]"/><h4 className="text-sm font-black uppercase tracking-widest">Coordinated Logistics</h4></div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {transportProviders.map(tp => (
                                            <button key={tp.id} onClick={() => setSelectedTransport(tp)} className={`p-5 rounded-2xl border transition-all text-left group ${selectedTransport?.id === tp.id ? 'bg-white text-[#1B4D3E] border-white shadow-xl scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                                <p className="text-[10px] font-black uppercase opacity-60 group-hover:opacity-100">{tp.name}</p>
                                                <p className="text-lg font-black mt-2">E {tp.rate.toLocaleString()}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Activity size={200} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none rotate-12" />
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] flex justify-between items-center border border-slate-200">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transaction Value</p>
                                    <p className="text-3xl font-black text-[#1B4D3E]">
                                        E {(cart.reduce((s, i) => s + (i.price * i.cartQty), 0) + (selectedTransport?.rate || 0)).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={handlePlaceOrder} disabled={cart.length === 0 || !selectedTransport || isSubmittingOrder} className="px-12 py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50">
                                    {isSubmittingOrder ? <Loader2 size={24} className="animate-spin" /> : 'Commit Order'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <ShoppingBag size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Commerce Basket Empty</h3>
                                <p className="text-slate-400 font-medium">Browse the Trade Hub to select vetted production lots.</p>
                            </div>
                            <button onClick={() => setViewStep('browse')} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Start Sourcing</button>
                        </div>
                    )}
                </div>
            )}

            {viewStep === 'orders' && (
                <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
                    {globalOrders.length > 0 ? (
                        globalOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-xl transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner group-hover:rotate-3 transition-transform"><Package size={24}/></div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-tight">{order.id}</p>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${order.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <h5 className="font-black text-slate-800 mt-2 text-lg leading-none">{order.sellerName} <ArrowRight className="inline-block mx-2 text-slate-300" size={14}/> {order.customerName}</h5>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • {order.items.length} Production Lots</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Order Settlement</p>
                                        <p className="text-2xl font-black text-[#1B4D3E]">E {order.total.toLocaleString()}</p>
                                    </div>
                                    {renderOrderActions(order)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center opacity-20">
                            <History size={64} className="mx-auto mb-4" />
                            <h3 className="text-xl font-black uppercase tracking-widest">No Chronology Found</h3>
                        </div>
                    )}
                </div>
            )}

            {viewStep === 'manage' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <div className="bg-[#1B4D3E] p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black tracking-tight">My Institutional Hub</h3>
                            <p className="text-green-300 text-sm font-bold uppercase tracking-[0.3em] mt-2">Manage Active Listings & Vetting Status</p>
                        </div>
                        <button 
                            onClick={() => alert("To list new produce, go to the Operations Module and 'Finalize Harvest' for any active production cycle.")} 
                            className="relative z-10 px-8 py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-transform"
                        >
                            Sync From Production
                        </button>
                        <Store size={300} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {products.filter(p => p.sellerId === user?.id || p.sellerId === user?.organizationId).map(p => (
                            <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-6 shadow-sm hover:shadow-lg transition-all">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100"><img src={p.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-slate-800 text-sm">{p.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>
                                    </div>
                                    <p className="text-[9px] font-mono font-black text-indigo-500 tracking-tighter uppercase">{p.id}</p>
                                    <div className="flex justify-between items-end mt-4">
                                        <p className="text-lg font-black text-[#1B4D3E]">E {p.price}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{p.quantity} {p.unit} Remaining</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewStep === 'trace' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                    <div className="text-center space-y-3">
                        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600 mb-6 border border-indigo-100 shadow-sm"><Fingerprint size={40}/></div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Traceability Chronology</h3>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">Enter any Chronology ID to verify the institutional digital thread from soil to market.</p>
                    </div>

                    <div className="relative group">
                        <SearchCode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24}/>
                        <input 
                            value={traceInput}
                            onChange={(e) => setTraceInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTraceSearch()}
                            placeholder="e.g. SZ-ENT-UNIT-OP..." 
                            className="w-full h-18 pl-14 pr-32 bg-white border border-slate-200 rounded-3xl shadow-xl font-mono font-black text-lg outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all uppercase placeholder:opacity-30 placeholder:font-sans" 
                        />
                        <button 
                            onClick={handleTraceSearch}
                            disabled={isSearchingTrace || !traceInput.trim()}
                            className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSearchingTrace ? <Loader2 className="animate-spin" size={16}/> : 'Verify Thread'}
                        </button>
                    </div>

                    {activeTrace && (
                        <div className="space-y-6 animate-slide-up pt-10">
                            <div className="bg-[#1B4D3E] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-white"><img src={activeTrace.product.image} className="w-full h-full object-cover" /></div>
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <BadgeCheck className="text-[#FBBF24]" size={20}/>
                                                <h4 className="text-2xl font-black uppercase tracking-tight">{activeTrace.product.name}</h4>
                                            </div>
                                            <p className="text-[10px] font-mono font-black text-green-300 uppercase opacity-60">Verified Chronology ID: {activeTrace.product.id}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-white/10">
                                            <div><p className="text-[8px] font-black text-green-300 uppercase tracking-widest">Origin Node</p><p className="text-xs font-bold">{activeTrace.product.sellerName}</p></div>
                                            <div><p className="text-[8px] font-black text-green-300 uppercase tracking-widest">Administrative Area</p><p className="text-xs font-bold">{activeTrace.product.region}</p></div>
                                            <div><p className="text-[8px] font-black text-green-300 uppercase tracking-widest">Digital Entry</p><p className="text-xs font-bold">{new Date(activeTrace.product.dateListed).toLocaleDateString()}</p></div>
                                            <div><p className="text-[8px] font-black text-green-300 uppercase tracking-widest">Status</p><p className="text-xs font-bold uppercase">{activeTrace.product.status}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <Fingerprint size={200} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none rotate-12" />
                            </div>

                            <div className="bg-indigo-50/50 p-8 rounded-[3rem] border border-indigo-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><Sparkles size={20}/></div>
                                    <h5 className="font-black text-indigo-900 uppercase tracking-widest text-sm">AI Verification Insight</h5>
                                </div>
                                <div className="text-indigo-800 leading-relaxed font-medium text-sm prose prose-indigo">
                                    {aiTraceReport}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {viewStep === 'success' && (
                <div className="text-center py-20 animate-slide-up"><div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-8 shadow-inner"><CheckCircle size={64}/></div><h3 className="text-3xl font-black text-slate-800 tracking-tight">Order Split & Initialized</h3><p className="text-slate-500 mt-2 font-medium mb-10">Requests are now being vetted by sellers.</p><button onClick={() => setViewStep('orders')} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs">View My Orders</button></div>
            )}
        </div>

        {orderEvidence && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 relative">
                    <button onClick={() => setOrderEvidence(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-[#1B4D3E]">Confirm Settlement</h3>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Reference Number</label>
                        <input value={orderEvidence.ref} onChange={e => setOrderEvidence({ ...orderEvidence, ref: e.target.value })} placeholder="Bank Ref / Trans ID" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative group hover:border-[#1B4D3E]/30 transition-all bg-slate-50/50">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setOrderEvidence({ ...orderEvidence, image: reader.result as string }); reader.readAsDataURL(file); }}} />
                        {orderEvidence.image ? (
                            <div className="space-y-3">
                                <CheckCircle2 className="mx-auto text-emerald-500" size={40}/>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Evidence Uploaded</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto text-slate-300 group-hover:text-[#1B4D3E] shadow-sm transition-colors"><Camera size={24}/></div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Capture PoP Screenshot</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => handleStatusUpdate(orderEvidence.id, 'Confirmation', { image: orderEvidence.image, ref: orderEvidence.ref })} disabled={!orderEvidence.ref || !orderEvidence.image} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#143d31] transition-all disabled:opacity-50">Commit Transaction Thread</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Marketplace;