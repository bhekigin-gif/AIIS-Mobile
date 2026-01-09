
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
  Fingerprint, Activity, Zap, ChevronDown, Globe, TruckIcon, Minus, CheckCircle2, ClipboardCheck
} from 'lucide-react';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserProfile, OrderStatus, UserRole, CatalogueItem, ResourceType } from '../types';
import { Get_Product_By_ID, Get_User_By_ID, View_Master_Catalogue, Add_To_Master_Catalogue, Get_System_Metadata } from '../services/adminDataService';
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
  const [viewStep, setViewStep] = useState<'browse' | 'cart' | 'checkout' | 'success' | 'prices' | 'manage' | 'orders' | 'trace'>('browse');
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
    { id: 'TR-01', name: 'National Logistics Coop', rate: 1500, region: 'National' },
    { id: 'TR-02', name: 'Manzini Express Haulers', rate: 800, region: 'Manzini' },
    { id: 'TR-03', name: 'Shiselweni Linkers', rate: 1200, region: 'Shiselweni' },
  ];

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
    
    // ATOMIC INVENTORY SYNC ON RECEIPT
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
            await db.update(DbTable.Enterprises, sellerEnt.id, sellerEnt);
        }

        const buyerEnt = enterprises.find(e => e.ownerId === user?.id || e.organizationId === user?.organizationId);
        if (buyerEnt) {
            order.items.forEach(item => {
                const unit = buyerEnt.units?.find((u: any) => u.id === item.destinationUnitId);
                if (unit) {
                    if (!unit.resources) unit.resources = [];
                    const existing = unit.resources.find((r: any) => r.name === item.name);
                    if (existing) existing.quantity += item.cartQty;
                    else unit.resources.push({ id: `RES-${Date.now()}`, name: item.name, type: ResourceType.Consumable, quantity: item.cartQty, unitCost: item.price, assignedUnitId: item.destinationUnitId!, status: 'Available', category: item.category || 'Commodity' });
                }
            });
            await db.update(DbTable.Enterprises, buyerEnt.id, buyerEnt);
        }
    }
    setGlobalOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    setOrderEvidence(null);
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
    if (order.status === 'Cancelled') return null;

    return (
        <div className="flex gap-2">
            <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase">Cancel</button>
            {order.status === 'Request' && isSeller && <button onClick={() => handleStatusUpdate(order.id, 'Payment')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Confirm Stock</button>}
            {order.status === 'Payment' && isBuyer && <button onClick={() => setOrderEvidence({ id: order.id, image: '', ref: '' })} className="px-4 py-2 bg-[#1B4D3E] text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Confirm PoP</button>}
            {order.status === 'Confirmation' && isSeller && <button onClick={() => handleStatusUpdate(order.id, 'Processing')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Validate & Process</button>}
            {order.status === 'Processing' && isSeller && <button onClick={() => handleStatusUpdate(order.id, 'Dispatched')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Dispatch Truck</button>}
            {order.status === 'Dispatched' && isBuyer && <button onClick={() => handleStatusUpdate(order.id, 'Received')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Confirm Receipt</button>}
        </div>
    );
  };

  if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]" size={48} /></div>;

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-end border-b border-slate-200 pb-6 shrink-0">
            <div><h2 className="text-4xl font-black text-[#1B4D3E]">National Trade Hub</h2><p className="text-slate-500 text-sm mt-1 font-medium">Institutional Coordinated Commerce</p></div>
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-x-auto no-scrollbar">
                {['browse', 'orders', 'manage', 'trace'].map(tab => (
                    <button key={tab} onClick={() => setViewStep(tab as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all whitespace-nowrap ${viewStep === tab ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {tab === 'browse' && <ShoppingCart size={16} />}{tab === 'orders' && <History size={16} />}{tab === 'manage' && <Store size={16} />}{tab === 'trace' && <Fingerprint size={16} />}
                        <span className="text-[10px] font-black uppercase">{tab === 'orders' ? 'Orders' : tab === 'manage' ? 'My Hub' : tab}</span>
                    </button>
                ))}
                <div className="w-px h-6 bg-slate-100 mx-1.5" /><button onClick={() => setViewStep('cart')} className={`p-2.5 rounded-xl transition-all relative ${viewStep === 'cart' ? 'bg-[#FBBF24] text-[#1B4D3E]' : 'bg-slate-50 text-slate-400'}`}><ShoppingBag size={18} />{cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black border-2 border-white">{cart.length}</span>}</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {viewStep === 'browse' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-fade-in">
                    {products.filter(p => p.status === 'Active').map(product => (
                        <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all flex flex-col h-[400px]">
                            <div className="h-44 bg-slate-200 overflow-hidden shrink-0"><img src={product.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div><h4 className="font-black text-slate-800 text-lg line-clamp-1">{product.name}</h4><p className="text-[9px] text-slate-400 font-bold uppercase">{product.sellerName}</p></div>
                                <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-50">
                                    <p className="text-xl font-black text-[#1B4D3E]">E {product.price}</p>
                                    <button onClick={() => setCart(prev => [...prev, { ...product, cartQty: 1 }])} className="bg-[#1B4D3E] text-white p-3 rounded-xl hover:bg-[#143d31] transition-all"><Plus size={20} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewStep === 'cart' && (
                <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
                    {Object.keys(cartGroupedBySeller).map(sId => (
                        <div key={sId} className="space-y-4">
                            <div className="flex items-center gap-2 px-2 text-[#1B4D3E] font-black uppercase text-[10px]"><Store size={14}/> {cartGroupedBySeller[sId][0].sellerName} Node</div>
                            {cartGroupedBySeller[sId].map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100"><img src={item.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1"><p className="font-black text-slate-800 text-sm">{item.name}</p><p className="text-[9px] text-slate-400 uppercase">E {item.price} / {item.unit}</p></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-1">
                                            <button onClick={() => handleUpdateCartQty(item.id, -1)} className="p-1"><Minus size={14}/></button>
                                            <span className="text-xs font-black">{item.cartQty}</span>
                                            <button onClick={() => handleUpdateCartQty(item.id, 1)} className="p-1"><Plus size={14}/></button>
                                        </div>
                                        <select value={item.destinationUnitId || ''} onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, destinationUnitId: e.target.value } : i))} className="w-48 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-700 outline-none">
                                            <option value="">Destination Unit...</option>
                                            {myUnits.map(u => <option key={u.id} value={u.id}>{u.enterpriseName} - {u.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="bg-[#1B4D3E] p-8 rounded-[3rem] text-white">
                        <div className="flex items-center gap-3 mb-6"><TruckIcon size={24} className="text-[#FBBF24]"/><h4 className="text-sm font-black uppercase tracking-widest">Coordinated Logistics</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {transportProviders.map(tp => (
                                <button key={tp.id} onClick={() => setSelectedTransport(tp)} className={`p-4 rounded-2xl border transition-all text-left ${selectedTransport?.id === tp.id ? 'bg-white text-[#1B4D3E] border-white' : 'bg-white/5 border-white/10'}`}>
                                    <p className="text-[10px] font-black uppercase">{tp.name}</p><p className="text-xs font-black mt-2">E {tp.rate}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handlePlaceOrder} disabled={cart.length === 0 || !selectedTransport} className="w-full py-6 bg-[#FBBF24] text-[#1B4D3E] rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl">Commit Institutional Order</button>
                </div>
            )}

            {viewStep === 'orders' && (
                <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
                    {globalOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Package size={24}/></div>
                                <div>
                                    <div className="flex items-center gap-3"><p className="text-[10px] font-mono font-black text-indigo-500">{order.id}</p><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-50`}>{order.status}</span></div>
                                    <h5 className="font-black text-slate-800 mt-1">{order.sellerName} → {order.customerName}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(order.date).toLocaleDateString()} • {order.items.length} Production Lots</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right"><p className="text-lg font-black text-[#1B4D3E]">E {order.total.toLocaleString()}</p><p className="text-[8px] font-black text-slate-300 uppercase">Incl. Transport</p></div>
                                {renderOrderActions(order)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewStep === 'success' && (
                <div className="text-center py-20 animate-slide-up"><div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-8 shadow-inner"><CheckCircle size={64}/></div><h3 className="text-3xl font-black text-slate-800 tracking-tight">Order Split & Initialized</h3><p className="text-slate-500 mt-2 font-medium mb-10">Requests are now being vetted by sellers.</p><button onClick={() => setViewStep('orders')} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs">View My Orders</button></div>
            )}
        </div>

        {orderEvidence && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-[#1B4D3E]">Confirm Payment</h3>
                    <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Reference Number</label><input value={orderEvidence.ref} onChange={e => setOrderEvidence({ ...orderEvidence, ref: e.target.value })} placeholder="Bank Ref / Trans ID" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative group">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setOrderEvidence({ ...orderEvidence, image: reader.result as string }); reader.readAsDataURL(file); }}} />
                        {orderEvidence.image ? <CheckCircle2 className="mx-auto text-emerald-500" size={32}/> : <Camera className="mx-auto text-slate-300" size={32}/>}
                    </div>
                    <button onClick={() => handleStatusUpdate(orderEvidence.id, 'Confirmation', { image: orderEvidence.image, ref: orderEvidence.ref })} disabled={!orderEvidence.ref || !orderEvidence.image} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs shadow-xl">Commit Transaction</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Marketplace;
