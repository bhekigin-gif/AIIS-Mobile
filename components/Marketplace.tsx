
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Filter, ShoppingBag, MapPin, Trash2, ArrowLeft, ArrowRight, 
  CreditCard, CheckCircle, XCircle, Package, FileText, Download, Eye, 
  ChevronRight, Upload, X, Plus, Store, PackagePlus, Edit, TrendingUp, 
  ClipboardList, Clock, Truck, Camera, ImageIcon, MessageCircleWarning, 
  ShieldCheck, SearchCode, History, Building, User, Info, Sparkles, 
  Map as MapIcon, Calendar, UserCheck, Tag, Phone, Building2, QrCode, 
  RefreshCw, Sprout, Layers, Link, ArrowUpRight, BarChart3, Database, 
  Landmark, Receipt, FileSearch, Target, Wallet, ShoppingCart, FileUp, Table, Loader2,
  Fingerprint, Activity, Zap,
  // Add missing icon
  ChevronDown
} from 'lucide-react';
import { SalesProduct, Region, MarketCartItem, MarketOrder, UserProfile, OrderStatus, UserRole, CatalogueItem, Operation } from '../types';
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

// Updated mapping to match CatalogueItem property names correctly
const MAPPABLE_FIELDS = [
    { key: 'registrationId', label: 'Registry ID' },
    { key: 'tradeName', label: 'Trade Name' },
    { key: 'manufacturerName', label: 'Manufacturer' },
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

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const [meta, cat] = await Promise.all([
            Get_System_Metadata(),
            View_Master_Catalogue()
        ]);
        setSystemMetadata(meta);
        setCatalogue(cat);
    };
    loadData();
  }, []);

  const handleTraceSearch = async (targetId?: string) => {
      const id = targetId || traceInput;
      if (!id.trim()) return;
      setIsSearchingTrace(true);
      setViewStep('trace');
      setTraceInput(id);
      
      const product = await Get_Product_By_ID(id);
      if (product) {
          const ownerProfile = await Get_User_By_ID(product.sellerId || '');
          
          let linkedOperation: Operation | null = null;
          if (product.operationId) {
              const enterprises = await db.getAll<any>(DbTable.Enterprises);
              for (const ent of enterprises) {
                  const op = ent.operations?.find((o:any) => o.id === product.operationId);
                  if (op) { linkedOperation = op; break; }
              }
          }

          setActiveTrace({ 
              product, 
              owner: ownerProfile, 
              enterprise: product.sellerName, 
              batchDate: product.dateListed,
              operation: linkedOperation
          });
          const report = await getTraceabilityReport(id, product, ownerProfile);
          setAiTraceReport(report);
      } else {
          alert("Chronology ID not found in the national registry.");
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
                setCsvHeaders(headers); setCsvDataRows(rows);
                const initialMap: Record<string, string> = {};
                MAPPABLE_FIELDS.forEach(f => {
                    const match = headers.find(h => h.toLowerCase().includes(f.label.toLowerCase()) || h.toLowerCase().includes(f.key.toLowerCase()));
                    if (match) initialMap[f.key] = match;
                });
                setFieldMap(initialMap); setShowMappingModal(true);
            }
            setIsImporting(false);
        } else {
            alert("Please use CSV format.");
            setIsImporting(false);
        }
    };
    reader.readAsText(file);
  };

  const finalizeImport = async () => {
    if (!fieldMap.tradeName) return alert("Mapping for 'Trade Name' is required.");
    const items: CatalogueItem[] = csvDataRows.map((row, idx) => {
        const getVal = (k: string) => row[csvHeaders.indexOf(fieldMap[k])] || '';
        // Fixed: Use correct CatalogueItem properties manufacturerName and productStandardDescription
        return {
            registrationId: getVal('registrationId') || `IMP-${Date.now()}-${idx}`, tradeName: getVal('tradeName') || 'Untitled', manufacturerName: getVal('manufacturerName') || 'Unknown', category: getVal('category') || 'General', division: getVal('division') || 'Crops', subCategory: getVal('subCategory') || 'N/A', productType: getVal('productType') || 'Standard', unit: getVal('unit') || 'Unit', description: getVal('description') || 'Imported batch', productStandardDescription: 'ISO-Standard', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-IMP', status: 'Pending'
        };
    });
    await Add_To_Master_Catalogue(items);
    setCatalogue(prev => [...items, ...prev]);
    setShowMappingModal(false); setCsvHeaders([]); setCsvDataRows([]);
    alert(`Successfully imported ${items.length} items.`);
  };

  const renderPrices = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8"><div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2.5rem] shadow-inner"><Database size={40}/></div><div><h3 className="text-3xl font-black text-slate-800">Master Prices Catalogue</h3><p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">National Input Standards & Vetted Registry</p></div></div>
            <div className="flex items-center gap-4 w-full md:w-auto"><input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} /><button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex-1 md:flex-none px-10 py-5 bg-indigo-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-950 transition-all disabled:opacity-50">{isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={20} className="text-[#FBBF24]"/>}{isImporting ? 'Parsing National Dataset...' : 'Import Dataset'}</button></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6"><div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><FileText size={16}/> Official Publications</h4><div className="space-y-4">{PRICE_LIST_DOCS.map(doc => (<div key={doc.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all cursor-pointer"><div className="flex items-center gap-4"><div className="p-3 bg-white rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm"><FileText size={20}/></div><div><p className="text-sm font-black text-slate-700 line-clamp-1">{doc.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{doc.size}</p></div></div><button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Download size={20}/></button></div>))}</div></div></div>
            <div className="lg:col-span-3 space-y-8">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
                    <input type="text" placeholder="Search national inputs, seeds, or registered chemicals..." className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm font-bold text-base outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {catalogue.map((item: CatalogueItem) => (
                        <div key={item.registrationId} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">{item.division}</span>
                                    <p className="text-[10px] font-mono text-slate-300 font-black uppercase tracking-widest">{item.registrationId}</p>
                                </div>
                                <h4 className="font-black text-slate-800 text-xl leading-tight mb-2 group-hover:text-indigo-900 transition-colors">{item.tradeName}</h4>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-8">{item.manufacturerName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Standard Unit</p><p className="text-sm font-black text-slate-800">{item.unit}</p></div>
                                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100"><p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Status</p><p className="text-[11px] font-black text-indigo-700 truncate">{item.status || 'Vetted'}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderTraceView = () => (
      <div className="space-y-10 animate-fade-in max-w-6xl mx-auto py-4">
          <div className="bg-[#1B4D3E] p-12 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden text-white">
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-xl"><SearchCode size={40} className="text-[#FBBF24]"/></div>
                    <div>
                        <h3 className="text-4xl font-black tracking-tight">Traceability Portal</h3>
                        <p className="text-sm text-green-300 font-bold uppercase tracking-[0.3em] mt-3">Institutional Provenance Decoder • National Gateway</p>
                    </div>
                </div>
                <div className="flex gap-4 p-2 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-inner">
                    <input autoFocus value={traceInput} onChange={(e)=>setTraceInput(e.target.value)} placeholder="Enter Refined Chronology ID (SZ-XXXX-...)" className="flex-1 px-8 py-5 bg-transparent border-none font-mono text-lg font-black text-white placeholder:text-green-800 focus:ring-0 outline-none" />
                    <button onClick={() => handleTraceSearch()} disabled={isSearchingTrace} className="px-12 py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95">{isSearchingTrace ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={22}/>} Decode Chronology</button>
                </div>
              </div>
              <Activity size={500} className="absolute -bottom-40 -right-40 text-white/5 pointer-events-none rotate-12" />
          </div>

          {activeTrace && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-slide-up">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl flex flex-col hover:shadow-emerald-500/5 transition-all">
                        <div className="h-64 bg-slate-200 relative"><img src={activeTrace.product.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div></div>
                        <div className="p-10 space-y-8">
                            <div><h4 className="text-3xl font-black text-slate-800 leading-tight">{activeTrace.product.name}</h4><p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><QrCode size={14} className="text-[#1B4D3E]"/> {activeTrace.product.id}</p></div>
                            <div className="space-y-5 pt-8 border-t border-slate-50">
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Hub</p><span className="text-sm font-black text-slate-700">{activeTrace.enterprise}</span></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verified Unit</p><span className="text-sm font-black text-slate-700">{activeTrace.product.sourceUnit || 'Registry Prime'}</span></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">National Region</p><span className="text-sm font-black text-[#1B4D3E]">{activeTrace.product.region}</span></div>
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10">
                        <div className="flex items-center gap-4 pb-8 border-b border-slate-50">
                            <Sparkles className="text-[#FBBF24]" size={32}/>
                            <div>
                                <h4 className="text-2xl font-black text-[#1B4D3E] uppercase tracking-tight">Origin Logic Report</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">National AI Validation Suite</p>
                            </div>
                        </div>
                        <div className="bg-[#1B4D3E]/[0.02] border border-[#1B4D3E]/10 p-10 rounded-[2.5rem] relative overflow-hidden">
                            <p className="text-lg text-slate-800 leading-relaxed font-semibold italic relative z-10">"{aiTraceReport}"</p>
                            <Fingerprint size={150} className="absolute -bottom-10 -right-10 text-[#1B4D3E]/5" />
                        </div>
                        
                        {activeTrace.operation && (
                            <div className="space-y-8 animate-fade-in">
                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><History size={18} className="text-indigo-600"/> Refined Node Chronology</h5>
                                <div className="relative pl-12 border-l-2 border-slate-100 space-y-12 pb-4">
                                    <div className="relative">
                                        <div className="absolute -left-[64px] top-0 w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white border-8 border-white shadow-2xl scale-110"><Zap size={24}/></div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em]">Final Node: {activeTrace.operation.type}</p>
                                            <h6 className="text-xl font-black text-slate-800">{activeTrace.operation.activity}</h6>
                                            <p className="text-sm text-slate-500 leading-relaxed max-w-lg">Operation finalized on <span className="text-slate-800 font-bold">{new Date(activeTrace.operation.endDateTime).toLocaleDateString()}</span>. Total node commit: <span className="text-[#1B4D3E] font-black">E {activeTrace.operation.accumulatedCost?.toLocaleString()}</span>.</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[64px] top-0 w-14 h-14 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 border-8 border-white shadow-lg"><MapIcon size={24}/></div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inception Node</p>
                                            <h6 className="text-xl font-black text-slate-700">{activeTrace.operation.field}</h6>
                                            <p className="text-sm text-slate-500 leading-relaxed max-w-lg">Spatial footprint and soil baseline data recorded in established national GIS node.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderMyShop = () => {
    const myProduce = products.filter(p => (p.sellerId === user?.id || p.sellerId === user?.organizationId) && p.operationId !== undefined && p.status === 'Active');
    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-10"><div className="p-6 bg-emerald-50 rounded-[2.5rem] text-emerald-600 shadow-inner"><Store size={48}/></div><div><h3 className="text-3xl font-black text-slate-800 tracking-tight">National Sourcing Node</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Verified Institutional Batches • Traceable Commodity Output</p></div></div>
                <div className="bg-slate-50 px-10 py-6 rounded-[2rem] border border-slate-100 text-center flex flex-col gap-1 shadow-sm"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Trade Lots</p><p className="text-4xl font-black text-[#1B4D3E]">{myProduce.length}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {myProduce.map(p => (
                    <div key={p.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group flex flex-col hover:-translate-y-2">
                        <div className="h-56 bg-slate-200 relative overflow-hidden">
                            <img src={p.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <button onClick={(e) => { e.stopPropagation(); handleTraceSearch(p.id); }} className="absolute bottom-4 left-4 right-4 py-3 rounded-2xl text-[10px] font-black uppercase shadow-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"><Fingerprint size={14}/> Node Origin Report</button>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex-1 space-y-4">
                                <div><h5 className="font-black text-slate-800 text-xl truncate leading-tight">{p.name}</h5><div className="flex items-center gap-2 mt-2"><QrCode size={14} className="text-[#1B4D3E]"/><p className="text-[10px] font-mono text-slate-400 font-bold truncate">{p.id}</p></div></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Unit Value</p><p className="text-base font-black text-[#1B4D3E]">E {p.price}</p></div>
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Stock</p><p className="text-base font-black text-slate-700">{p.quantity}</p></div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                <div className="space-y-0.5"><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Inception Cost</p><p className="text-sm font-black text-slate-500">E {p.costPrice?.toLocaleString()}</p></div>
                                <button className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-[#1B4D3E] hover:text-white hover:shadow-xl transition-all"><Edit size={20} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]" size={48} /></div>;

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-10 gap-8 shrink-0">
            <div>
                <h2 className="text-5xl font-black text-[#1B4D3E] tracking-tight">National Trade Hub</h2>
                <p className="text-slate-500 text-lg mt-3 font-medium">Coordinated distribution network for verified agricultural commodities.</p>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                {(['browse', 'prices', 'manage', 'trace'] as const).map(tab => (
                    <button key={tab} onClick={() => setViewStep(tab)} className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] transition-all relative ${viewStep === tab ? 'bg-[#1B4D3E] text-white shadow-xl scale-105' : 'text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50'}`}>
                        {tab === 'browse' && <ShoppingCart size={20} />}{tab === 'prices' && <Tag size={20} />}{tab === 'manage' && <Store size={20} />}{tab === 'trace' && <Fingerprint size={20} />}
                        <span className="text-xs font-black uppercase tracking-widest">{tab === 'manage' ? 'My Node' : tab}</span>
                    </button>
                ))}
                <div className="w-px h-10 bg-slate-100 mx-2"></div>
                <button onClick={() => setViewStep('cart')} className={`p-4 rounded-[1.5rem] transition-all relative ${viewStep === 'cart' ? 'bg-[#1B4D3E] text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <ShoppingBag size={24} />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-black border-2 border-white shadow-xl animate-bounce">{cart.length}</span>}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {viewStep === 'browse' && (
                <div className="space-y-12 animate-fade-in">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={24} />
                            <input type="text" placeholder="Query national commodity reserves by crop, region, or batch ID..." className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-base outline-none focus:ring-8 focus:ring-[#1B4D3E]/5 focus:bg-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="px-10 py-5 border border-slate-100 bg-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest text-[#1B4D3E] shadow-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 cursor-pointer">
                                <option value="All">All National Regions</option>
                                {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8">
                        {products.filter(p => p.status === 'Active' && (filterRegion === 'All' || p.region === filterRegion) && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                            <div key={product.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-[0_50px_100px_-30px_rgba(0,0,0,0.15)] transition-all group cursor-pointer hover:-translate-y-2" onClick={() => setInspectedProduct(product)}>
                                <div className="h-56 bg-slate-200 relative overflow-hidden">
                                    <img src={product.image || PLACE_HOLDER_IMAGE} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-[#1B4D3E] shadow-xl uppercase tracking-[0.2em] border border-white/40">{product.region}</div>
                                    <div className="absolute inset-0 bg-gradient-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="p-8">
                                    <h4 className="font-black text-slate-800 text-xl line-clamp-1 group-hover:text-[#1B4D3E] transition-colors">{product.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{product.sellerName}</p>
                                    <div className="flex justify-between items-end mt-10 pt-6 border-t border-slate-50">
                                        <div>
                                            <p className="text-2xl font-black text-[#1B4D3E] tracking-tight">E {product.price}</p>
                                            <p className="text-[10px] font-mono text-slate-300 font-black mt-1 uppercase tracking-tighter">{product.id.slice(0, 15)}...</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setCart(prev => [...prev, { ...product, cartQty: 1 }]); setViewStep('cart'); }} className="bg-[#1B4D3E] text-white p-4 rounded-2xl hover:bg-[#143d31] shadow-2xl transition-all active:scale-90"><Plus size={24} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {viewStep === 'prices' && renderPrices()}
            {viewStep === 'manage' && renderMyShop()}
            {viewStep === 'trace' && renderTraceView()}
            {viewStep === 'cart' && (
                <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                    <button onClick={() => setViewStep('browse')} className="text-sm font-black text-slate-400 hover:text-[#1B4D3E] flex items-center gap-3 uppercase tracking-[0.3em] transition-all"><ArrowLeft size={20}/> Exit Cart & Catalog</button>
                    <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="bg-[#1B4D3E] p-12 text-white flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/10"><ShoppingBag size={32} className="text-[#FBBF24]"/></div>
                                <div><h3 className="text-3xl font-black tracking-tight">National Procurement Cart</h3><p className="text-green-300 text-xs font-bold uppercase tracking-[0.3em] mt-2">Verified Sourcing Channel</p></div>
                            </div>
                            <div className="text-right"><p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Total Assets</p><p className="text-4xl font-black">{cart.length}</p></div>
                        </div>
                        <div className="p-12 space-y-8">
                            {cart.length > 0 ? (
                                <> 
                                    <div className="space-y-4">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-10 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-[#1B4D3E]/20 transition-all hover:shadow-xl">
                                                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shadow-2xl shrink-0"><img src={item.image || PLACE_HOLDER_IMAGE} className="w-full h-full object-cover" /></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h5 className="text-xl font-black text-slate-800">{item.name}</h5>
                                                        <span className="px-3 py-1 bg-white text-slate-400 text-[9px] font-black uppercase border border-slate-100 rounded-lg">{item.region}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{item.sellerName} • National Producer</p>
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <p className="text-2xl font-black text-[#1B4D3E]">E {item.price}</p>
                                                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Remove Node</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-10">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Aggregate Valuation</p>
                                            <p className="text-6xl font-black text-[#1B4D3E] tracking-tighter">E {cart.reduce((s, i) => s + i.price, 0).toLocaleString()}</p>
                                        </div>
                                        <button className="w-full sm:w-auto px-16 py-7 bg-[#FBBF24] text-[#1B4D3E] rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-[0_20px_50px_rgba(251,191,36,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-6 group">
                                            Execute Procurement 
                                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div> 
                                </>
                            ) : (
                                <div className="py-32 text-center space-y-10 animate-fade-in">
                                    <div className="relative inline-block">
                                        <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-200">
                                            <ShoppingBag size={64} className="text-slate-200"/>
                                        </div>
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl text-slate-300 border border-slate-100 rotate-12"><X size={24}/></div>
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No Batches Reserved</h4>
                                        <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-4">Browse the national catalog to initialize commodity procurement cycles.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {inspectedProduct && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 animate-fade-in" onClick={() => setInspectedProduct(null)}>
                <div className="bg-white w-full max-w-[1200px] rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row relative border border-white/20" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setInspectedProduct(null)} className="absolute top-10 right-10 z-20 p-4 bg-white/90 backdrop-blur-md rounded-3xl text-slate-800 shadow-2xl hover:scale-110 transition-all border border-slate-100"><X size={28} /></button>
                    <div className="w-full lg:w-[45%] flex flex-col bg-slate-50 border-r border-slate-100">
                        <div className="h-[500px] w-full overflow-hidden relative group">
                            <img src={inspectedProduct.image || PLACE_HOLDER_IMAGE} alt={inspectedProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                            <div className="absolute top-10 left-10"><span className="px-6 py-2.5 bg-[#1B4D3E] text-white text-[11px] font-black uppercase rounded-[1.2rem] shadow-2xl border border-white/20 tracking-[0.2em]">{inspectedProduct.category}</span></div>
                        </div>
                        <div className="p-12 space-y-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-8 group hover:border-[#1B4D3E]/30 transition-all">
                                <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[1.8rem] flex-shrink-0 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform"><QrCode size={48} className="text-[#1B4D3E]/30"/></div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Chronology</p>
                                    <p className="text-xs font-mono font-black text-[#1B4D3E] truncate mt-1">{inspectedProduct.id}</p>
                                    <button onClick={() => handleTraceSearch(inspectedProduct.id)} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mt-4 uppercase tracking-[0.1em] underline decoration-indigo-200 transition-colors"><ShieldCheck size={14}/> Verify National Provenance</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-lg"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Unit Valuation</p><p className="text-3xl font-black text-[#1B4D3E]">E {inspectedProduct.price}</p></div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-lg"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Reserves Available</p><p className="text-3xl font-black text-slate-800">{inspectedProduct.quantity} <span className="text-xs font-bold text-slate-400 uppercase">{inspectedProduct.unit}</span></p></div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[55%] p-16 flex flex-col justify-between overflow-y-auto max-h-[90vh] no-scrollbar">
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-5xl font-black text-slate-800 leading-[1.1] tracking-tight">{inspectedProduct.name}</h3>
                                <div className="flex items-center gap-4 mt-6">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">{inspectedProduct.sellerName?.charAt(0)}</div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Digital Entry by {inspectedProduct.sellerName}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-50">
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3"><Building2 size={16} className="text-[#1B4D3E]"/> Node Origin</label><p className="text-lg font-black text-slate-800 tracking-tight">{inspectedProduct.manufacturer || 'Verified National Hub'}</p></div>
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3"><MapPin size={16} className="text-[#1B4D3E]"/> Administrative Region</label><p className="text-lg font-black text-slate-800 tracking-tight">{inspectedProduct.region}</p></div>
                            </div>
                            <div className="p-10 bg-[#1B4D3E]/[0.02] rounded-[3rem] border border-[#1B4D3E]/5 relative">
                                <p className="text-lg text-slate-600 leading-relaxed font-semibold italic relative z-10 opacity-80">"{inspectedProduct.description || 'Verified production batch adhering to national agricultural quality standards and food safety protocols.'}"</p>
                                <Activity size={100} className="absolute -top-4 -right-4 text-[#1B4D3E]/5" />
                            </div>
                        </div>
                        <div className="flex gap-6 mt-20">
                            <button onClick={() => { setCart(prev => [...prev, { ...inspectedProduct, cartQty: 1 }]); setInspectedProduct(null); setViewStep('cart'); }} className="flex-1 bg-[#1B4D3E] text-white py-8 rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-[0_20px_60px_-10px_rgba(27,77,62,0.4)] hover:bg-[#143d31] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-6 group">
                                Initialize procurement 
                                <ArrowRight size={28} className="group-hover:translate-x-3 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Marketplace;
