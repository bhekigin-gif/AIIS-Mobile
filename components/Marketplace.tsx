
import React, { useState, useRef } from 'react';
import { 
  Search, Filter, ShoppingBag, MapPin, Trash2, ArrowLeft, ArrowRight, 
  CreditCard, CheckCircle, XCircle, Package, FileText, Download, Eye, 
  ChevronRight, Upload, X, Plus, Store, PackagePlus, Edit, TrendingUp, 
  ClipboardList, Clock, Truck, Camera, ImageIcon, MessageCircleWarning, 
  ShieldCheck, SearchCode, History, Building, User, Info, Sparkles, 
  Map as MapIcon, Calendar, UserCheck, Tag, Phone, Building2, QrCode, 
  RefreshCw, Sprout, Layers, Link, ArrowUpRight, BarChart3, Database, 
  Landmark, Receipt, FileSearch, Target, Wallet, ShoppingCart, FileUp, Table, Loader2
} from 'lucide-react';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserProfile, OrderStatus, UserRole, CatalogueItem } from '../types';
import { Get_Product_By_ID, Get_User_By_ID, View_Master_Catalogue, Add_To_Master_Catalogue, Get_System_Metadata } from '../services/adminDataService';
import { getTraceabilityReport } from '../services/geminiService';

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

const MAPPABLE_FIELDS = [
    { key: 'registrationId', label: 'Registry ID' },
    { key: 'tradeName', label: 'Trade Name' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'division', label: 'Division' },
    { key: 'category', label: 'Category' },
    { key: 'subCategory', label: 'Sub Category' },
    { key: 'productType', label: 'Product Type' },
    { key: 'unit', label: 'Unit' },
    { key: 'description', label: 'Description' },
];

const PRICE_LIST_DOCS = [
    { id: 'pl1', name: '2025 Baby Veg Gross Margins.xlsx', size: '1.2MB' },
    { id: 'pl2', name: '2024_Livestock gross margins.xlsx', size: '0.8MB' },
    { id: 'pl3', name: 'FIELD CROPS 2023 Official Prices.pdf', size: '2.4MB' }
];

const Marketplace: React.FC<MarketplaceProps> = ({ products, setProducts, cart, setCart, globalOrders, setGlobalOrders, user }) => {
  const [viewStep, setViewStep] = useState<'browse' | 'cart' | 'checkout' | 'success' | 'prices' | 'manage' | 'orders' | 'trace'>('browse');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [inspectedProduct, setInspectedProduct] = useState<SalesProduct | null>(null);
  const [traceInput, setTraceInput] = useState('');
  const [activeTrace, setActiveTrace] = useState<any>(null);
  const [isSearchingTrace, setIsSearchingTrace] = useState(false);
  const [aiTraceReport, setAiTraceReport] = useState<string>('');

  // Bulk Import State
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System Metadata
  const systemMetadata = Get_System_Metadata();
  const catalogue = View_Master_Catalogue();

  const handleTraceSearch = async () => {
      if (!traceInput.trim()) return;
      setIsSearchingTrace(true);
      const product = Get_Product_By_ID(traceInput);
      if (product) {
          const ownerProfile = Get_User_By_ID(product.sellerId || '');
          setActiveTrace({ product, owner: ownerProfile, enterprise: product.sellerName, batchDate: product.dateListed });
          const report = await getTraceabilityReport(traceInput, product, ownerProfile);
          setAiTraceReport(report);
      } else {
          alert("Chronology ID not found.");
      }
      setIsSearchingTrace(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
                
                setCsvHeaders(headers);
                setCsvDataRows(rows);
                
                // Attempt auto-mapping
                const initialMap: Record<string, string> = {};
                MAPPABLE_FIELDS.forEach(f => {
                    const match = headers.find(h => h.toLowerCase().includes(f.label.toLowerCase()) || h.toLowerCase().includes(f.key.toLowerCase()));
                    if (match) initialMap[f.key] = match;
                });
                setFieldMap(initialMap);
                setShowMappingModal(true);
            }
            setIsImporting(false);
        } else {
            alert("Please use CSV format for advanced column mapping.");
            setIsImporting(false);
        }
    };
    reader.readAsText(file);
  };

  const finalizeImport = () => {
    if (!fieldMap.tradeName) {
        alert("Mapping for 'Trade Name' is required at minimum.");
        return;
    }

    const items: CatalogueItem[] = csvDataRows.map((row, idx) => {
        const getItemValue = (fieldKey: string) => {
            const headerName = fieldMap[fieldKey];
            const headerIdx = csvHeaders.indexOf(headerName);
            return headerIdx > -1 ? row[headerIdx] : '';
        };

        return {
            registrationId: getItemValue('registrationId') || `IMP-${Date.now()}-${idx}`,
            tradeName: getItemValue('tradeName') || 'Untitled',
            manufacturer: getItemValue('manufacturer') || 'Unknown',
            category: getItemValue('category') || 'General',
            division: getItemValue('division') || 'Crops',
            subCategory: getItemValue('subCategory') || 'N/A',
            productType: getItemValue('productType') || 'Standard',
            unit: getItemValue('unit') || 'Unit',
            description: getItemValue('description') || 'Imported batch',
            productStandard: 'ISO-Standard',
            availableDistrict: 'National',
            availableRDA: 'All',
            availableConstituency: 'All',
            availableRegNo: 'REG-IMP',
            status: 'Pending'
        };
    });

    Add_To_Master_Catalogue(items);
    setShowMappingModal(false);
    setCsvHeaders([]);
    setCsvDataRows([]);
    alert(`Successfully imported ${items.length} items to Master Catalogue.`);
  };

  const renderPrices = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner"><Database size={32}/></div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Master Prices Catalogue</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">National Input Standards & Vetted Registry</p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex-1 md:flex-none px-8 py-4 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-950 transition-all disabled:opacity-50"
                >
                    {isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} className="text-[#FBBF24]"/>}
                    {isImporting ? 'Parsing...' : 'Bulk Catalogue Import'}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <FileText size={14}/> Official Price Lists
                    </h4>
                    <div className="space-y-3">
                        {PRICE_LIST_DOCS.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm"><FileText size={16}/></div>
                                    <div><p className="text-xs font-bold text-slate-700 line-clamp-1">{doc.name}</p><p className="text-[9px] text-slate-400 font-bold">{doc.size}</p></div>
                                </div>
                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Download size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100">
                        <p className="text-[10px] text-indigo-700 font-medium leading-relaxed italic">
                            These documents are verified by the Ministry of Agriculture and updated quarterly to reflect national market trends.
                        </p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search Registry IDs, Manufacturers or Trade Names..." 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catalogue.map((item: CatalogueItem) => (
                        <div key={item.registrationId} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[8px] font-black uppercase tracking-widest">{item.division}</span>
                                <p className="text-[10px] font-mono text-slate-300 font-bold uppercase">{item.registrationId}</p>
                            </div>
                            <h4 className="font-black text-slate-800 text-lg leading-tight mb-1">{item.tradeName}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">{item.manufacturer}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Unit</p><p className="text-xs font-bold text-slate-700">{item.unit}</p></div>
                                <div className="p-3 bg-slate-50 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Standard</p><p className="text-[10px] font-bold text-indigo-600 line-clamp-1">{item.productStandard}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {showMappingModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl"><Table size={24}/></div>
                            <div>
                                <h3 className="text-2xl font-black">Map CSV Columns</h3>
                                <p className="text-indigo-200 text-xs mt-1">Assign your file headers to system catalogue fields.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowMappingModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-10 overflow-y-auto max-h-[60vh] no-scrollbar space-y-8">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
                            <Info className="text-amber-600 shrink-0" size={18}/>
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                We detected <strong>{csvHeaders.length}</strong> columns and <strong>{csvDataRows.length}</strong> rows. Map the fields to import successfully.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {MAPPABLE_FIELDS.map(field => (
                                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <span className="font-black text-slate-700 text-sm">{field.label}</span>
                                    <select 
                                        value={fieldMap[field.key] || ''}
                                        onChange={(e) => setFieldMap({ ...fieldMap, [field.key]: e.target.value })}
                                        className="min-w-[200px] px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Skip Field --</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-8 border-t border-slate-100 flex gap-4">
                        <button onClick={() => setShowMappingModal(false)} className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase tracking-widest">Cancel</button>
                        <button onClick={finalizeImport} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">
                            Finalize Import <ArrowRight size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderMyShop = () => {
    const myProduce = products.filter(p => 
        (p.sellerId === user?.id || p.sellerId === user?.organizationId) && 
        p.operationId !== undefined && 
        p.status === 'Active'
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6"><div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600 shadow-inner"><Store size={32}/></div><div><h3 className="text-2xl font-black text-slate-800">My Sourcing Shop</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Verified Produce & Traceable Batches</p></div></div>
                <div className="flex gap-4">
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Batches Ready</p><p className="text-xl font-black text-slate-800">{myProduce.length}</p></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {myProduce.map(p => (
                    <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                        <div className="h-48 bg-slate-200 relative overflow-hidden">
                            <img src={p.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute top-4 right-4">
                                <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase shadow-lg bg-emerald-500 text-white">Verified Produce</span>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex-1">
                                <h5 className="font-black text-slate-800 text-lg truncate mb-1">{p.name}</h5>
                                <div className="flex items-center gap-2 mb-4">
                                    <QrCode size={12} className="text-[#1B4D3E]"/>
                                    <p className="text-[10px] font-mono text-slate-400 truncate">{p.id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Unit Price</p>
                                        <p className="text-sm font-black text-[#1B4D3E]">E {p.price}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Stock</p>
                                        <p className="text-sm font-black text-slate-700">{p.quantity} {p.unit}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Allocated Cost</p>
                                    <p className="text-xs font-black text-slate-500">E {p.costPrice?.toLocaleString()}</p>
                                </div>
                                <button className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:bg-[#1B4D3E] hover:text-white transition-all shadow-sm">
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {myProduce.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <Package size={48} className="mx-auto text-slate-300" />
                        <p className="text-slate-400 font-bold">No verified produce batches found. Harvest items in the Production module to list them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <div><h2 className="text-3xl font-black text-[#1B4D3E]">Trade & Marketplace</h2><p className="text-slate-500 text-sm mt-1 font-medium">National distribution and trade coordination network.</p></div>
            <div className="flex items-center gap-6">
                {(['browse', 'prices', 'manage', 'trace'] as const).map(tab => (
                    <button key={tab} onClick={() => setViewStep(tab)} className={`flex flex-col items-center gap-1 transition-all ${viewStep === tab ? 'text-[#1B4D3E]' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab === 'browse' && <ShoppingCart size={22} />}{tab === 'prices' && <Tag size={22} />}{tab === 'manage' && <Store size={22} />}{tab === 'trace' && <SearchCode size={22} />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{tab === 'manage' ? 'My Shop' : tab}</span>
                    </button>
                ))}
                <button onClick={() => setViewStep('cart')} className="relative p-3 bg-slate-100 rounded-2xl text-slate-600">
                    <ShoppingBag size={22} />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white">{cart.length}</span>}
                </button>
            </div>
        </div>

        <div className="min-h-[600px]">
            {viewStep === 'browse' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="text" placeholder="Search national commodity stocks..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="px-4 py-3 border border-slate-100 bg-slate-50 rounded-xl text-sm font-bold">
                                <option value="All">All Regions</option>
                                {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.filter(p => p.status === 'Active' && (filterRegion === 'All' || p.region === filterRegion) && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                            <div key={product.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group cursor-pointer" onClick={() => setInspectedProduct(product)}>
                                <div className="h-44 bg-slate-200 relative overflow-hidden"><img src={product.image || PLACE_HOLDER_IMAGE} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-black text-[#1B4D3E] shadow-sm uppercase tracking-widest border border-white/20">{product.region}</div></div>
                                <div className="p-6">
                                    <h4 className="font-black text-slate-800 line-clamp-1 mb-1">{product.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.sellerName}</p>
                                    <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-50">
                                        <div><p className="text-xl font-black text-[#1B4D3E]">E {product.price}</p><p className="text-[8px] font-mono text-slate-300 truncate max-w-[100px]">{product.id}</p></div>
                                        <button onClick={(e) => { e.stopPropagation(); setCart(prev => [...prev, { ...product, cartQty: 1 }]); setViewStep('cart'); }} className="bg-[#1B4D3E] text-white p-3 rounded-xl hover:bg-[#143d31] shadow-lg transition-all active:scale-95"><Plus size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {viewStep === 'prices' && renderPrices()}
            {viewStep === 'manage' && renderMyShop()}
            {viewStep === 'cart' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                    <button onClick={() => setViewStep('browse')} className="text-sm font-black text-slate-400 hover:text-slate-600 flex items-center gap-2 uppercase tracking-widest"><ArrowLeft size={16}/> Back to Catalog</button>
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center"><h3 className="text-xl font-black flex items-center gap-3"><ShoppingBag size={24} className="text-yellow-400"/> My Sourcing Cart</h3><p className="text-[10px] font-black uppercase tracking-widest opacity-60">{cart.length} Commodities</p></div>
                        <div className="p-8 space-y-6">
                            {cart.length > 0 ? (
                                <>
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0"><img src={item.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                            <div className="flex-1"><h5 className="font-black text-slate-800">{item.name}</h5><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.sellerName} • {item.region}</p></div>
                                            <div className="text-right"><p className="font-black text-slate-800">E {item.price}</p><button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 mt-1"><Trash2 size={16}/></button></div>
                                        </div>
                                    ))}
                                    <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                                        <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Total</p><p className="text-4xl font-black text-[#1B4D3E]">E {cart.reduce((s, i) => s + i.price, 0).toLocaleString()}</p></div>
                                        <button className="px-10 py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-3">Initialize Procurement <ArrowRight size={18}/></button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-20 text-center space-y-4 text-slate-300 italic"><ShoppingBag size={64} className="mx-auto opacity-20"/><p className="font-bold">No batches selected for procurement.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {inspectedProduct && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setInspectedProduct(null)}>
                <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setInspectedProduct(null)} className="absolute top-6 right-6 z-20 p-2 bg-white/80 rounded-full text-slate-600 shadow-sm"><X size={24} /></button>
                    <div className="w-full md:w-[45%] flex flex-col bg-slate-50 border-r border-slate-100">
                        <div className="h-80 w-full overflow-hidden relative"><img src={inspectedProduct.image || PLACE_HOLDER_IMAGE} alt={inspectedProduct.name} className="w-full h-full object-cover" /><div className="absolute top-6 left-6"><span className="px-4 py-1.5 bg-[#1B4D3E] text-white text-[10px] font-black uppercase rounded-xl shadow-lg border border-white/20">{inspectedProduct.category}</span></div></div>
                        <div className="p-8 space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5"><div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center"><QrCode size={40} className="text-slate-300"/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronology Chain</p><p className="text-[10px] font-mono font-black text-[#1B4D3E] truncate">{inspectedProduct.id}</p><button className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 mt-2 uppercase tracking-widest"><ShieldCheck size={12}/> Verify Provenance</button></div></div>
                            <div className="grid grid-cols-2 gap-4"><div className="bg-white p-4 rounded-2xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Unit Price</p><p className="text-xl font-black text-[#1B4D3E]">E {inspectedProduct.price}</p></div><div className="bg-white p-4 rounded-2xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Available</p><p className="text-xl font-black text-slate-700">{inspectedProduct.quantity}</p></div></div>
                        </div>
                    </div>
                    <div className="w-full md:w-[55%] p-10 flex flex-col justify-between overflow-y-auto max-h-[90vh] no-scrollbar">
                        <div className="space-y-8">
                            <div><h3 className="text-3xl font-black text-slate-800 leading-tight">{inspectedProduct.name}</h3><p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Listed by {inspectedProduct.sellerName}</p></div>
                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                <div><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Building2 size={12}/> Origin</label><p className="text-sm font-black text-slate-600">{inspectedProduct.manufacturer}</p></div>
                                <div><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-2"><MapPin size={12}/> Region</label><p className="text-sm font-black text-slate-600">{inspectedProduct.region}</p></div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{inspectedProduct.description || 'Verified production batch under national sector standards.'}"</p></div>
                        </div>
                        <div className="flex gap-4 mt-12"><button onClick={() => { setCart(prev => [...prev, { ...inspectedProduct, cartQty: 1 }]); setInspectedProduct(null); setViewStep('cart'); }} className="flex-1 bg-[#1B4D3E] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-[#143d31] transition-all active:scale-95">Procure Batch</button></div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Marketplace;
