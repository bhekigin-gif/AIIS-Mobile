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
  SearchX, BadgeCheck, ShieldAlert, Check as CheckIcon,
  Maximize2, Navigation, Ruler, Route, Lock, UserPlus, Star
} from 'lucide-react';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserProfile, OrderStatus, UserRole, CatalogueItem, ResourceType, ActorType } from '../types';
import { Get_Product_By_ID, Get_User_By_ID, View_Master_Catalogue, Add_To_Master_Catalogue, Get_System_Metadata, updateProductStatus } from '../services/adminDataService';
import { getTraceabilityReport } from '../services/geminiService';
import { db, Table as DbTable } from '../services/databaseService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";
const PLACE_HOLDER_IMAGE = "https://images.unsplash.com/photo-1492496913980-501348b61384?w=300&h=300&fit=crop";

interface MarketplaceProps {
    products: SalesProduct[];
    setProducts: React.Dispatch<React.SetStateAction<SalesProduct[]>>;
    cart: MarketCartItem[];
    setCart: React.Dispatch<React.SetStateAction<MarketCartItem[]>>;
    globalOrders: MarketOrder[];
    setGlobalOrders: React.Dispatch<React.SetStateAction<MarketOrder[]>>;
    user: UserProfile | null;
    onRegisterClick?: () => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ products, setProducts, cart, setCart, globalOrders, setGlobalOrders, user, onRegisterClick }) => {
  const [viewStep, setViewStep] = useState<'browse' | 'cart' | 'checkout' | 'success' | 'prices' | 'manage' | 'orders' | 'trace' | 'vetting'>('browse');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [traceInput, setTraceInput] = useState('');
  const [activeTrace, setActiveTrace] = useState<any>(null);
  const [isSearchingTrace, setIsSearchingTrace] = useState(false);
  const [aiTraceReport, setAiTraceReport] = useState<string>('');
  const [systemMetadata, setSystemMetadata] = useState<any>(null);

  // Vetting Certificate State
  const [vettingCertificates, setVettingCertificates] = useState<Record<string, string>>({});

  // Feedback State
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null); // OrderID
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Commerce States
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [orderEvidence, setOrderEvidence] = useState<{ id: string, image: string, ref: string } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [auditImage, setAuditImage] = useState<string | null>(null);

  // Route & Distance States
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const [routeDistances, setRouteDistances] = useState<Record<string, { km: number, origin: any, destination: any }>>({});
  const [enterprises, setEnterprises] = useState<any[]>([]);

  const transportProviders = [
    { id: 'TR-01', name: 'Logistics Coop', ratePerKm: 12.5, region: 'Regional' },
    { id: 'TR-02', name: 'Manzini Express Haulers', ratePerKm: 15.0, region: 'Manzini' },
    { id: 'TR-03', name: 'Shiselweni Linkers', ratePerKm: 10.0, region: 'Shiselweni' },
  ];

  const isExtension = user?.actorType === ActorType.Extension;

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (product.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = filterRegion === 'All' || product.region === filterRegion;
        return matchesSearch && matchesRegion && product.status === 'Active';
    });
  }, [products, searchTerm, filterRegion]);

  const vettingProducts = useMemo(() => {
    if (!isExtension) return [];
    return products.filter(p => p.status === 'Pending Approval' && p.tinkhundla === user?.tinkhundla);
  }, [products, isExtension, user]);

  useEffect(() => {
    if ((window as any).google?.maps) { setGoogleApiLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.onload = () => setGoogleApiLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const init = async () => {
        const meta = await Get_System_Metadata();
        setSystemMetadata(meta);
        const allEnts = await db.getAll<any>(DbTable.Enterprises);
        setEnterprises(allEnts);
        
        if (user) {
            const units = allEnts
              .filter(e => e.ownerId === user.id || e.organizationId === user.organizationId)
              .flatMap(e => (e.units || []).map((u: any) => ({ ...u, enterpriseName: e.name, enterpriseGps: e.gps })));
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

  useEffect(() => {
    if (!googleApiLoaded || viewStep !== 'cart') return;

    const calculateDistances = async () => {
        const distances: Record<string, { km: number, origin: any, destination: any }> = {};
        const service = new (window as any).google.maps.DistanceMatrixService();

        for (const sellerId of Object.keys(cartGroupedBySeller)) {
            const firstItem = cartGroupedBySeller[sellerId][0];
            const sellerEnt = enterprises.find(e => e.ownerId === sellerId || e.organizationId === sellerId);
            const destUnit = myUnits.find(u => u.id === firstItem.destinationUnitId);

            if (sellerEnt?.gps && destUnit?.enterpriseGps) {
                try {
                    const response = await new Promise<any>((resolve, reject) => {
                        service.getDistanceMatrix({
                            origins: [new (window as any).google.maps.LatLng(sellerEnt.gps.lat, sellerEnt.gps.lng)],
                            destinations: [new (window as any).google.maps.LatLng(destUnit.enterpriseGps.lat, destUnit.enterpriseGps.lng)],
                            travelMode: (window as any).google.maps.TravelMode.DRIVING,
                        }, (res: any, status: any) => {
                            if (status === 'OK') resolve(res);
                            else reject(status);
                        });
                    });

                    const element = response.rows[0].elements[0];
                    if (element.status === 'OK') {
                        distances[sellerId] = {
                            km: element.distance.value / 1000,
                            origin: sellerEnt.gps,
                            destination: destUnit.enterpriseGps
                        };
                    }
                } catch (e) {
                    console.error("Distance calculation failed", e);
                }
            }
        }
        setRouteDistances(distances);
    };

    calculateDistances();
  }, [googleApiLoaded, cart, viewStep, cartGroupedBySeller, enterprises, myUnits]);

  useEffect(() => {
    if (!googleApiLoaded || !mapRef.current || viewStep !== 'cart') return;

    const map = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 7,
        center: { lat: -26.5, lng: 31.5 },
        styles: [
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#1B4D3E" }] }
        ]
    });

    const directionsService = new (window as any).google.maps.DirectionsService();
    
    Object.keys(routeDistances).forEach((sId, idx) => {
        const route = routeDistances[sId];
        const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: idx % 2 === 0 ? '#FBBF24' : '#10B981',
                strokeWeight: 4
            }
        });

        directionsService.route({
            origin: route.origin,
            destination: route.destination,
            travelMode: (window as any).google.maps.TravelMode.DRIVING
        }, (result: any, status: any) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
            }
        });
    });
  }, [googleApiLoaded, routeDistances, viewStep]);

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, cartQty: Math.max(0.01, item.cartQty + delta) } : item));
  };

  const handleSetCartQty = (id: string, value: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, cartQty: Math.max(0.01, value) } : item));
  };

  const calculateTransportTotal = () => {
    if (!selectedTransport) return 0;
    return (Object.values(routeDistances) as { km: number }[]).reduce((sum, route) => sum + (route.km * selectedTransport.ratePerKm), 0);
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
        const route = routeDistances[sId];
        const transCost = route ? (route.km * selectedTransport.ratePerKm) : 0;

        const order: MarketOrder = {
            id: `ORD-${Date.now()}-${sId.slice(-4)}`,
            items: items,
            total: subTotal + transCost,
            status: 'Request',
            customerName: user.name, customerId: user.id!,
            sellerId: sId, sellerName: items[0].sellerName || 'Institutional Producer',
            date: new Date().toISOString(), region: user.region as Region,
            transportServiceId: selectedTransport.id, transportServiceName: selectedTransport.name,
            notes: route ? `Distance: ${route.km.toFixed(2)} Km via ${selectedTransport.name}` : undefined
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

    let finalStatus = newStatus;

    // Logic: Free Product Auto-Skip Payment
    if (newStatus === 'Payment' && order.total === 0) {
        finalStatus = 'Confirmation'; // Skip PoP requirement
    }

    const updates: Partial<MarketOrder> = { status: finalStatus };
    if (evidence) { updates.popImage = evidence.image; updates.popRef = evidence.ref; }

    await db.update(DbTable.Orders, orderId, updates);
    
    if (finalStatus === 'Received') {
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
                    else unit.resources.push({ id: `RES-${Date.now()}`, name: item.name, type: ResourceType.Consumable, quantity: item.cartQty, startingQuantity: item.cartQty, unitCost: item.price, assignedUnitId: item.destinationUnitId!, status: 'Available', category: item.category || 'Commodity' });
                }
            });
            await db.update(DbTable.Enterprises, buyerEnt.id, buyerEnt);
        }
    }
    setGlobalOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    setOrderEvidence(null);
  };

  const handleVerifyProduct = async (productId: string, approve: boolean) => {
    const status = approve ? 'Active' : 'Rejected';
    const certUrl = vettingCertificates[productId] || '';
    
    if (approve && certUrl) {
       await db.update<SalesProduct>(DbTable.Products, productId, { status: 'Active' as any, certificateUrl: certUrl });
    } else {
       await updateProductStatus(productId, status);
    }
    
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: status as any, certificateUrl: approve ? certUrl : undefined } : p));
    setVettingCertificates(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
    });
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

  const handleSubmitFeedback = async () => {
    if (!showRatingModal) return;
    await db.update<MarketOrder>(DbTable.Orders, showRatingModal, { rating: ratingValue, feedback: feedbackText });
    setGlobalOrders(prev => prev.map(o => o.id === showRatingModal ? { ...o, rating: ratingValue, feedback: feedbackText } : o));
    setShowRatingModal(null);
    setRatingValue(5);
    setFeedbackText('');
  };

  const renderOrderActions = (order: MarketOrder) => {
    const isSeller = order.sellerId === user?.id || order.sellerId === user?.organizationId;
    const isBuyer = order.customerId === user?.id;
    if (order.status === 'Cancelled') return <span className="text-[10px] font-black text-rose-500 uppercase">Voided</span>;

    return (
        <div className="flex gap-2">
            <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase hover:bg-rose-100 font-black">Void Node</button>
            {order.status === 'Request' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Payment')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-indigo-700 font-black">Confirm Stock Availability</button>
            )}
            {order.status === 'Payment' && isBuyer && (
                <button onClick={() => setOrderEvidence({ id: order.id, image: '', ref: '' })} className="px-4 py-2 bg-[#1B4D3E] text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-900 font-black">Transmit PoP Evidence</button>
            )}
            {order.status === 'Confirmation' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Processing')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 font-black">Audit & Initialize Process</button>
            )}
            {order.status === 'Processing' && isSeller && (
                <button onClick={() => handleStatusUpdate(order.id, 'Dispatched')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-purple-700 font-black">Dispatch Logistics Node</button>
            )}
            {order.status === 'Dispatched' && isBuyer && (
                <button onClick={() => { handleStatusUpdate(order.id, 'Received'); setShowRatingModal(order.id); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 font-black">Confirm Delivery & Rate</button>
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
                    {user?.role === UserRole.Guest && (
                        <div className="mb-8 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-5 bg-amber-100 text-amber-700 rounded-3xl shadow-inner border border-amber-200/50">
                                    <UserPlus size={32}/>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.3em]">Restricted Trading Mode</p>
                                    <h4 className="text-lg font-black text-amber-800 leading-tight">Register your institutional node to source from verified producers.</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <button 
                                    onClick={onRegisterClick}
                                    className="px-8 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-900 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Register Now <ArrowRight size={16}/>
                                </button>
                                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-amber-200 text-[9px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                                    <ShieldAlert size={14}/> Authentication Required
                                </div>
                            </div>
                            <UserPlus size={180} className="absolute -bottom-10 -right-10 text-amber-100 pointer-events-none opacity-40 rotate-12" />
                        </div>
                    )}

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
                                        {product.certificateUrl && (
                                            <div className="absolute top-4 right-4 p-2 bg-emerald-600 text-white rounded-xl shadow-lg border border-white/20">
                                                <BadgeCheck size={16}/>
                                            </div>
                                        )}
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
                                                <p className="text-xl font-black text-[#1B4D3E]">{product.price === 0 ? 'FREE' : `E ${product.price}`} <span className="text-[10px] text-slate-400">/ {product.unit}</span></p>
                                            </div>
                                            
                                            {user?.role !== UserRole.Guest ? (
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
                                            ) : (
                                                <div className="group/lock relative">
                                                    <button 
                                                        disabled
                                                        className="bg-slate-50 text-slate-300 px-4 py-3 rounded-2xl cursor-not-allowed border border-slate-100 flex items-center gap-2"
                                                    >
                                                        <Lock size={18} />
                                                        <span className="text-[9px] font-black uppercase tracking-tight">Private Node</span>
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-3 w-44 bg-slate-900 text-white text-[9px] font-black uppercase p-3 rounded-xl opacity-0 group-hover/lock:opacity-100 pointer-events-none transition-all shadow-2xl translate-y-1 group-hover/lock:translate-y-0 text-center z-20">
                                                        Please register or login to start ordering
                                                    </div>
                                                </div>
                                            )}
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
                                        
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> Attach Certification (Optional)</p>
                                            <div className="flex items-center gap-4">
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between group/upload hover:border-indigo-400 transition-all">
                                                        <span className="text-[10px] font-bold text-slate-400 truncate">
                                                            {vettingCertificates[product.id] ? 'Certificate Node Attached' : 'Select PDF/Image Document'}
                                                        </span>
                                                        <Upload size={14} className="text-slate-300 group-hover/upload:text-indigo-500 transition-colors"/>
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept=".pdf,image/*" 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setVettingCertificates(prev => ({ ...prev, [product.id]: reader.result as string }));
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                {vettingCertificates[product.id] && (
                                                    <button onClick={() => setVettingCertificates(prev => {
                                                        const next = { ...prev };
                                                        delete next[product.id];
                                                        return next;
                                                    })} className="p-3 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                            <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Target Price</p><p className="text-lg font-black text-indigo-900">E {product.price}</p></div>
                                            <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Yield Node</p><p className="text-lg font-black text-indigo-900">{product.quantity} {product.unit}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 shrink-0">
                                        <button onClick={() => handleVerifyProduct(product.id, true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 font-black"><CheckCircle2 size={18}/> Authorize Node</button>
                                        <button onClick={() => handleVerifyProduct(product.id, false)} className="px-8 py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-rose-300 transition-all font-black">Reject Entry</button>
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
                <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {cart.length > 0 ? (
                                <>
                                    {Object.keys(cartGroupedBySeller).map(sId => (
                                        <div key={sId} className="space-y-4">
                                            <div className="flex items-center justify-between px-4">
                                                <div className="flex items-center gap-2 text-[#1B4D3E] font-black uppercase text-[10px] tracking-widest"><Store size={14} className="text-[#FBBF24]"/> {cartGroupedBySeller[sId][0].sellerName} Hub</div>
                                                {routeDistances[sId] && (
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                                        <Route size={12}/> {routeDistances[sId].km.toFixed(1)} Km to Destination
                                                    </div>
                                                )}
                                            </div>
                                            {cartGroupedBySeller[sId].map(item => (
                                                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100"><img src={item.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                                    <div className="flex-1"><p className="font-black text-slate-800 text-sm leading-tight">{item.name}</p><p className="text-[9px] text-slate-400 uppercase mt-1">E {item.price} / {item.unit}</p></div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-1">
                                                            <button onClick={() => handleUpdateCartQty(item.id, -1)} className="p-1 hover:text-[#1B4D3E] transition-colors"><Minus size={14}/></button>
                                                            <input 
                                                                type="number"
                                                                step="any"
                                                                value={item.cartQty}
                                                                onChange={(e) => handleSetCartQty(item.id, parseFloat(e.target.value) || 0.01)}
                                                                className="text-xs font-black w-24 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <button onClick={() => handleUpdateCartQty(item.id, 1)} className="p-1 hover:text-[#1B4D3E] transition-colors"><Plus size={14}/></button>
                                                        </div>
                                                        <select value={item.destinationUnitId || ''} onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, destinationUnitId: e.target.value } : i))} className="w-48 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-700 outline-none cursor-pointer font-black">
                                                            <option value="">Assign Destination Unit...</option>
                                                            {myUnits.map(u => <option key={u.id} value={u.id}>{u.enterpriseName} - {u.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-rose-500 p-2 transition-colors"><Trash2 size={20}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
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
                                    <button onClick={() => setViewStep('browse')} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg font-black">Start Sourcing</button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
                                <div className="p-5 border-b border-slate-100 bg-[#1B4D3E] text-white flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-xl"><Navigation size={20} className="text-[#FBBF24]"/></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest">Logistics Route Node</h4>
                                    </div>
                                    {Object.keys(routeDistances).length > 0 && <span className="bg-[#FBBF24] text-[#1B4D3E] px-3 py-1 rounded-lg text-[9px] font-black uppercase">{Object.keys(routeDistances).length} Routes Active</span>}
                                </div>
                                <div ref={mapRef} className="flex-1 bg-slate-100" />
                                <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Total Distance Matrix</span>
                                        <span className="text-[#1B4D3E]">{(Object.values(routeDistances) as { km: number }[]).reduce((s, r) => s + r.km, 0).toFixed(1)} Km</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#FBBF24] h-full rounded-full" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                    <TruckIcon size={24} className="text-[#1B4D3E]"/>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-[#1B4D3E]">Coordinated Logistics</h4>
                                </div>
                                <div className="p-6 space-y-3 bg-slate-50/50">
                                    {transportProviders.map(tp => (
                                        <button key={tp.id} onClick={() => setSelectedTransport(tp)} className={`w-full p-5 rounded-2xl border-2 transition-all text-left group flex justify-between items-center ${selectedTransport?.id === tp.id ? 'bg-white border-[#1B4D3E] shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-[#1B4D3E]/30'}`}>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-[#1B4D3E] group-hover:text-emerald-700">{tp.name}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Rate: E {tp.ratePerKm.toFixed(2)} / Km</p>
                                            </div>
                                            {selectedTransport?.id === tp.id && <CheckCircle2 className="text-[#1B4D3E]" size={20}/>}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-8 space-y-6 border-t border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Production Total</span><span className="text-sm font-black text-slate-700">E {cart.reduce((s, i) => s + (i.price * i.cartQty), 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Logistics Fee</span><span className="text-sm font-black text-indigo-600">E {calculateTransportTotal().toLocaleString()}</span></div>
                                        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">Grand Total Settlement</p><p className="text-3xl font-black text-[#1B4D3E]">E {(cart.reduce((s, i) => s + (i.price * i.cartQty), 0) + calculateTransportTotal()).toLocaleString()}</p></div>
                                        </div>
                                    </div>
                                    <button onClick={handlePlaceOrder} disabled={cart.length === 0 || !selectedTransport || isSubmittingOrder || Object.keys(routeDistances).length === 0} className="w-full py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50 font-black">
                                        {isSubmittingOrder ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Commit Synchronized Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewStep === 'orders' && (
                <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
                    {globalOrders.length > 0 ? (
                        globalOrders.map(order => {
                            const isSeller = order.sellerId === user?.id || order.sellerId === user?.organizationId;
                            return (
                                <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-6 group hover:shadow-xl transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                                                <div className="flex items-center gap-4 mt-2">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    {order.notes && <p className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{order.notes}</p>}
                                                </div>
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

                                    {order.rating && (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex gap-0.5">
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} size={14} className={s <= (order.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                                    ))}
                                                </div>
                                                <p className="text-xs font-bold text-emerald-800">"{order.feedback || 'Quality Service Confirmed'}"</p>
                                            </div>
                                            <BadgeCheck size={20} className="text-emerald-500"/>
                                        </div>
                                    )}

                                    {order.popRef && (
                                        <div className="bg-slate-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border border-slate-100 animate-slide-up">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest"><CreditCard size={12} className="text-indigo-500"/> Settlement Evidence Transmitted</div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xs font-black text-slate-700">Ref: <span className="font-mono text-indigo-600 uppercase">{order.popRef}</span></p>
                                                    {isSeller && (
                                                        <div className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                                                            <ShieldAlert size={10}/> Verification Required
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {order.popImage && (
                                                <button 
                                                    onClick={() => setAuditImage(order.popImage!)}
                                                    className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg relative group cursor-zoom-in"
                                                >
                                                    <img src={order.popImage} className="w-full h-auto object-cover" />
                                                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Maximize2 className="text-white" size={20}/>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
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
                            onClick={() => alert("To list new produce, go to the Operations Module and 'Harvest Produce' for any active production cycle.")} 
                            className="relative z-10 px-8 py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-transform font-black"
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
                                        <p className="text-lg font-black text-[#1B4D3E]">{p.price === 0 ? 'FREE' : `E ${p.price}`}</p>
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
                            className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 font-black"
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

                            {activeTrace.product.certificateUrl && (
                                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-600 text-white rounded-2xl"><ShieldCheck size={20}/></div>
                                        <div>
                                            <p className="text-xs font-black text-emerald-900 uppercase">Verified Production Certificate</p>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Digital Endorsement Node Active</p>
                                        </div>
                                    </div>
                                    <a href={activeTrace.product.certificateUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-emerald-600 hover:text-white transition-all">View Proof</a>
                                </div>
                            )}

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
                <div className="text-center py-20 animate-slide-up"><div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-8 shadow-inner"><CheckCircle size={64}/></div><h3 className="text-3xl font-black text-slate-800 tracking-tight">Order Initialized</h3><p className="text-slate-500 mt-2 font-medium mb-10">Institutional requests are now being synchronized.</p><button onClick={() => setViewStep('orders')} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs font-black">View My Orders</button></div>
            )}
        </div>

        {showRatingModal && (
            <div className="fixed inset-0 z-[800] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 relative text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500 border border-amber-100 shadow-sm"><Sparkles size={40}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-[#1B4D3E] tracking-tight">National Service Audit</h3>
                        <p className="text-sm text-slate-400 font-medium mt-2">Rate the quality of the institutional node interaction.</p>
                    </div>
                    
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRatingValue(star)} className={`p-2 transition-all hover:scale-125 ${star <= ratingValue ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                                <Star size={40} className={star <= ratingValue ? 'fill-amber-400' : ''}/>
                            </button>
                        ))}
                    </div>
                    
                    <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Provide detailed feedback on service quality..."
                        className="w-full h-32 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none"
                    />

                    <button onClick={handleSubmitFeedback} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-900 transition-all font-black">Commit Node Feedback</button>
                </div>
            </div>
        )}

        {auditImage && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/95 p-4 sm:p-10 animate-fade-in" onClick={() => setAuditImage(null)}>
                <button className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                    <X size={32}/>
                </button>
                <div className="max-w-4xl max-h-full overflow-hidden rounded-3xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                    <img src={auditImage} className="w-full h-auto object-contain" />
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black uppercase tracking-widest border border-white/20">
                    High Resolution Settlement Audit Node
                </div>
            </div>
        )}

        {orderEvidence && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 relative">
                    <button onClick={() => setOrderEvidence(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={24}/></button>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-[#1B4D3E]">Confirm Settlement</h3>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Reference Number</label>
                        <input value={orderEvidence.ref} onChange={e => setOrderEvidence({ ...orderEvidence, ref: e.target.value })} placeholder="Bank Ref / Trans ID" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" />
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
                    <button onClick={() => handleStatusUpdate(orderEvidence.id, 'Confirmation', { image: orderEvidence.image, ref: orderEvidence.ref })} disabled={!orderEvidence.ref || !orderEvidence.image} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#143d31] transition-all disabled:opacity-50 font-black">Commit Transaction Thread</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Marketplace;