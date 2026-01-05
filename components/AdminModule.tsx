
import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, Users, ShoppingBag, FileText, BarChart3, 
    Search, Filter, ArrowUpDown, CheckCircle, XCircle, Plus, 
    MoreHorizontal, Download, ChevronLeft, ChevronRight, X,
    ShieldCheck, AlertCircle, Save, Trash2, Eye, Map as MapIcon, List, Upload, FileSpreadsheet, RotateCcw,
    Contact, MapPin, Briefcase, GraduationCap, Mail, Phone, Edit3, MessageSquare, History, FileWarning, ArrowRight, Settings2, Table, Sparkles, Loader2, Wand2, RefreshCw, Camera, Image as ImageIcon, ShieldAlert, Globe, Landmark, Shield, Info, Lock, Unlock, EyeOff,
    ShoppingCart, Fingerprint, Activity, Building2, User, ToggleLeft, ToggleRight, Database, Sprout, ListTodo, Type, Layers, Box, Settings,
    FileUp,
    Check,
    SearchCode,
    Sparkle,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Link as LinkIcon,
    Key,
    Sliders,
    Scale,
    Tractor,
    Megaphone,
    BookOpen,
    PieChart,
    Timer,
    Zap,
    Warehouse,
    Globe2
} from 'lucide-react';
import { 
    View_All_System_Users, View_Items_Awaiting_Approval, 
    View_Master_Catalogue, Add_To_Master_Catalogue, Delete_From_Master_Catalogue,
    Report_AIIS_Indicators, updateUserStatus, updateProductStatus, View_Trading_Catalogue_Items,
    View_Items_Awaiting_Approval as Get_Pending,
    View_Items_Rejected,
    Get_System_Metadata,
    Update_System_Metadata,
    Update_Catalogue_Status,
    Affiliate_User_With_Org,
    Bulk_Delete_From_Catalogue,
    Bulk_Update_Catalogue_Status
} from '../services/adminDataService';
import { generateCatalogueFromSearch, analyzeProductImage, prefillCatalogueItem } from '../services/geminiService';
import { UserRole, ActorType, EntityType, CatalogueItem, IndicatorItem, SalesProduct, UserProfile, Region, TINKHUNDLA } from '../types';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

const PERMISSIONS_MATRIX = [
    { component: "National Dashboard", guest: "Public summary data & weather alerts.", producer: "Personal farm performance & regional trends.", extension: "Regional yield analytics & actor distribution.", government: "Full national KPI control & strategic reports.", icon: <LayoutDashboard size={18} /> },
    { component: "Production & GIS", guest: "Restricted view of public zones.", producer: "Field mapping, unit setup, & operational logs.", extension: "Verification of field boundaries & audit logs.", government: "National land-use mapping & compliance oversight.", icon: <MapIcon size={18} /> },
    { component: "Trade Marketplace", guest: "Browse items & view retail prices.", producer: "List products, manage inventory, & sell.", extension: "Verify product quality & provenance standards.", government: "Market price regulation & trade permit oversight.", icon: <ShoppingCart size={18} /> },
    { component: "AI Expert Advisor", guest: "General agricultural Q&A & location help.", producer: "Agronomic advice & crop disease diagnosis.", extension: "Technical documentation & extension reporting.", government: "Policy synthesis & national data analysis.", icon: <MessageSquare size={18} /> }
];

const MAPPABLE_FIELDS = [
    { key: 'registrationId', label: 'Registry ID' },
    { key: 'tradeName', label: 'Trade Name' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'division', label: 'Division' },
    { key: 'category', label: 'Category' },
    { key: 'subCategory', label: 'Sub Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'description', label: 'Description' },
];

const AdminModule: React.FC<AdminModuleProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [reportMode, setReportMode] = useState<'MALABO' | 'NATIONAL'>('MALABO');
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [pendingProducts, setPendingProducts] = useState<SalesProduct[]>([]);
    const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
    const [tradingItems, setTradingItems] = useState<SalesProduct[]>([]);
    const [userSearch, setUserSearch] = useState('');

    // Cross-module state computed for snapshot
    const [snapshotData, setSnapshotData] = useState({
        totalEnterprises: 0,
        totalLibraryFiles: 15, // From CapacityBuilding mock
        totalNotices: 12,      // From Information mock
        marketLiquidity: 0
    });

    // Metadata Management State
    const [systemMetadata, setSystemMetadata] = useState<any>(Get_System_Metadata());
    const [selectedMetaKey, setSelectedMetaKey] = useState<string>('actorTypes');
    const [newItemValue, setNewItemValue] = useState('');

    // Bulk Management State
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Vetted'>('All');

    // CSV Mapping State
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
    const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const users = View_All_System_Users();
        const pending = View_Items_Awaiting_Approval();
        const catalogue = View_Master_Catalogue();
        const market = View_Trading_Catalogue_Items();
        
        setAllUsers(users);
        setPendingProducts(pending);
        setIndicators(Report_AIIS_Indicators(reportMode));
        setCatalogueItems(catalogue);
        setTradingItems(market);

        // Estimate snapshot data from localStorage / State
        const marketVal = market.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        
        // Scan for enterprises in localStorage
        let entCount = 0;
        for (let i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i);
            if (key?.startsWith('aiis_enterprises_v5_')) {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                entCount += data.length;
            }
        }
        // Fallback to seeds if empty
        if (entCount === 0) entCount = 1; 

        setSnapshotData({
            totalEnterprises: entCount,
            totalLibraryFiles: 15,
            totalNotices: 12,
            marketLiquidity: marketVal
        });

    }, [activeTab, reportMode]);

    const handleUpdateMetadata = (key: string, newList: any[]) => {
        const updated = Update_System_Metadata(key, newList);
        setSystemMetadata(updated);
    };

    const addItemToMeta = () => {
        if (!newItemValue.trim()) return;
        const currentList = systemMetadata[selectedMetaKey] || [];
        
        const exists = typeof currentList[0] === 'object' 
            ? currentList.some((v: any) => v.name === newItemValue.trim())
            : currentList.includes(newItemValue.trim());

        if (exists) {
            alert("Option already exists.");
            return;
        }

        const newValue = typeof currentList[0] === 'object'
            ? { id: newItemValue.trim().toLowerCase().replace(/\s+/g, '_'), name: newItemValue.trim() }
            : newItemValue.trim();

        handleUpdateMetadata(selectedMetaKey, [...currentList, newValue]);
        setNewItemValue('');
    };

    const removeItemFromMeta = (val: any) => {
        const currentList = systemMetadata[selectedMetaKey] || [];
        const newList = typeof currentList[0] === 'object'
            ? currentList.filter((v: any) => v.id !== (typeof val === 'object' ? val.id : val))
            : currentList.filter((v: string) => v !== val);
        
        handleUpdateMetadata(selectedMetaKey, newList);
    };

    const handleBulkDelete = () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedItemIds.length} selected items?`)) return;
        const updated = Bulk_Delete_From_Catalogue(selectedItemIds);
        setCatalogueItems(updated);
        setSelectedItemIds([]);
        alert('Items removed successfully.');
    };

    const handleBulkApprove = () => {
        const updated = Bulk_Update_Catalogue_Status(selectedItemIds, 'Vetted');
        setCatalogueItems(updated);
        setSelectedItemIds([]);
        alert('Selected items approved and added to national vetted registry.');
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredCatalogue.map(i => i.registrationId);
        if (selectedItemIds.length === visibleIds.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(visibleIds);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
                setCsvHeaders(headers);
                setCsvDataRows(rows);
                
                const initialMap: Record<string, string> = {};
                MAPPABLE_FIELDS.forEach(f => {
                    const match = headers.find(h => h.toLowerCase().includes(f.label.toLowerCase()) || h.toLowerCase().includes(f.key.toLowerCase()));
                    if (match) initialMap[f.key] = match;
                });
                setFieldMap(initialMap);
                setShowMappingModal(true);
            }
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    const finalizeImport = () => {
        if (!fieldMap.tradeName) {
            alert("Mapping for 'Trade Name' is required.");
            return;
        }

        const items: CatalogueItem[] = csvDataRows.map((row, idx) => {
            const getItemValue = (fieldKey: string) => {
                const headerName = fieldMap[fieldKey];
                const headerIdx = csvHeaders.indexOf(headerName);
                return headerIdx > -1 ? row[headerIdx] : '';
            };

            return {
                registrationId: getItemValue('registrationId') || `SZ-REG-${Date.now()}-${idx}`,
                tradeName: getItemValue('tradeName') || 'Untitled',
                manufacturer: getItemValue('manufacturer') || 'Unknown',
                division: getItemValue('division') || 'General',
                category: getItemValue('category') || 'General',
                subCategory: getItemValue('subCategory') || 'N/A',
                productType: getItemValue('productType') || 'Standard',
                unit: getItemValue('unit') || 'Unit',
                description: getItemValue('description') || 'Bulk Imported',
                productStandard: 'Registry Verified',
                availableDistrict: 'National',
                availableRDA: 'All',
                availableConstituency: 'All',
                availableRegNo: 'REG-BULK',
                status: 'Pending'
            };
        });

        const updated = Add_To_Master_Catalogue(items);
        setCatalogueItems(updated);
        setShowMappingModal(false);
        alert(`Bulk upload complete. ${items.length} items added as pending review.`);
    };

    const filteredCatalogue = catalogueItems.filter(item => {
        const matchesSearch = item.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || item.registrationId.toLowerCase().includes(catalogueSearch.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in">
            {/* Core KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Actor Registry</p>
                            <h3 className="text-4xl font-black text-[#1B4D3E] mt-2">{allUsers.length}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                            <TrendingUp size={14}/> <span>+4% this month</span>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="p-2 text-slate-300 hover:text-[#1B4D3E]"><ArrowRight size={18}/></button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Trade Liquidity</p>
                            <h3 className="text-4xl font-black text-indigo-600 mt-2">E { (snapshotData.marketLiquidity / 1000).toFixed(0) }k</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                            <Box size={14}/> <span>{tradingItems.length} active batches</span>
                        </div>
                        <div className="w-10 h-1 rounded-full bg-slate-50 overflow-hidden"><div className="h-full bg-indigo-500" style={{width: '65%'}}></div></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">National GIS Feed</p>
                            <h3 className="text-4xl font-black text-amber-600 mt-2">{snapshotData.totalEnterprises}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <MapIcon size={24} />
                        </div>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex -space-x-2">
                             {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>)}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Operational Hubs</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Oversight Queue</p>
                            <h3 className="text-4xl font-black text-rose-600 mt-2">{pendingProducts.length + catalogueItems.filter(i => i.status === 'Pending').length}</h3>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <ShieldAlert size={24} />
                        </div>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-rose-500 font-bold text-xs">
                        <Timer size={14} className="animate-pulse" /> <span>Critical Action Required</span>
                    </div>
                </div>
            </div>

            {/* Component Status Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registry & Personnel Breakdown */}
                <div className="lg:col-span-2 bg-[#1B4D3E] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black mb-8 flex items-center gap-3"><Globe2 size={28} className="text-[#FBBF24]"/> Institutional Persona Distribution</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] font-black uppercase text-green-300 mb-2">Producers</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black">{allUsers.filter(u => u.actorType?.includes('Farmer')).length}</span>
                                    <span className="text-xs font-bold text-green-400/60 pb-1">Verified</span>
                                </div>
                            </div>
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] font-black uppercase text-green-300 mb-2">Processors</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black">{allUsers.filter(u => u.actorType?.includes('Processor')).length}</span>
                                    <span className="text-xs font-bold text-green-400/60 pb-1">Active</span>
                                </div>
                            </div>
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] font-black uppercase text-green-300 mb-2">Regulatory</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black">{allUsers.filter(u => u.role === UserRole.Government).length}</span>
                                    <span className="text-xs font-bold text-green-400/60 pb-1">Officers</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl shadow-xl"><Zap size={20}/></div>
                                <div><p className="text-sm font-black">Digital Connectivity</p><p className="text-xs text-green-200/60">Registry sync operational across 4 regions.</p></div>
                            </div>
                            <button onClick={() => setActiveTab('users')} className="px-8 py-4 bg-white text-[#1B4D3E] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-3">
                                Detailed Registry <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>
                    <Activity size={300} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none" />
                </div>

                {/* Resource & Knowledge Library Snapshot */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={20}/></div>
                            <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Library & Notices</h5>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3"><FileText size={16} className="text-slate-400"/> <span className="text-sm font-bold text-slate-700">Tech Library</span></div>
                                <span className="text-xs font-black text-blue-600">{snapshotData.totalLibraryFiles} Files</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3"><Megaphone size={16} className="text-slate-400"/> <span className="text-sm font-bold text-slate-700">Public Notices</span></div>
                                <span className="text-xs font-black text-amber-600">{snapshotData.totalNotices} Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl"><Database size={20}/></div>
                            <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Master Catalogue</h5>
                        </div>
                        <div className="relative z-10 flex items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h4 className="text-3xl font-black text-slate-800">{catalogueItems.length}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vetted Items</p>
                            </div>
                            <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '78%'}}></div>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('catalogue')} className="w-full mt-6 py-3 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">Manage Catalog</button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Feed */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><Sliders size={24} className="text-indigo-500"/> Critical System Overrides</h4>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('config')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Update Metadata</button>
                        <button onClick={() => setActiveTab('access')} className="px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Audit Permissions</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                    <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                         <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><History size={20}/></div>
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Registry Sync Heartbeat</p>
                            <p className="text-[10px] text-slate-500 mt-1">Last full synchronization with Regional Extension nodes completed 14 minutes ago.</p>
                         </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                         <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><Fingerprint size={20}/></div>
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest">ID extraction Engine</p>
                            <p className="text-[10px] text-slate-500 mt-1">Gemini Pro-Vision connected. Average identification reliability: 98.4% on Eswatini ID formats.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRegistry = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center">
                <Search className="ml-4 text-slate-400" size={18} />
                <input type="text" placeholder="Search national actor registry..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-3 bg-transparent font-bold text-sm outline-none" />
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                        <tr><th className="p-8">Institutional Persona</th><th className="p-8">Affiliation / Scope</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-8"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black shadow-inner">{u.name.charAt(0)}</div><div><p className="font-black text-slate-800 text-sm">{u.name}</p><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{u.actorType}</p></div></div></td>
                                <td className="p-8"><p className="text-sm font-bold text-slate-600">{u.organization || 'Independent'}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.region} Region</p></td>
                                <td className="p-8 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-8 text-right"><button className="p-2 text-slate-300 hover:text-[#1B4D3E] transition-colors"><MoreHorizontal size={20}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCatalogue = () => (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={catalogueSearch}
                        onChange={(e) => setCatalogueSearch(e.target.value)}
                        placeholder="Search Registry IDs, Trade Names..." 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" 
                    />
                </div>
                <div className="flex items-center gap-4">
                    <select 
                        value={statusFilter}
                        onChange={(e:any) => setStatusFilter(e.target.value)}
                        className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Vetted">Vetted</option>
                    </select>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#143d31] transition-all"
                    >
                        <FileUp size={18} className="text-[#FBBF24]"/> Bulk Upload
                    </button>
                </div>
            </div>

            {selectedItemIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white px-10 py-5 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center gap-10 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">{selectedItemIds.length}</div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Selection Active</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleBulkApprove} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all">
                            <CheckCircle size={14}/> Approve Selected
                        </button>
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all">
                            <Trash2 size={14}/> Delete Selected
                        </button>
                        <button onClick={() => setSelectedItemIds([])} className="p-3 text-slate-300 hover:text-slate-500"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-[0.2em]">
                        <tr>
                            <th className="p-8 w-10">
                                <button onClick={toggleSelectAll} className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedItemIds.length === filteredCatalogue.length ? 'bg-[#FBBF24] border-[#FBBF24]' : 'border-white/20'}`}>
                                    {selectedItemIds.length === filteredCatalogue.length && <Check size={12} strokeWidth={4} className="text-[#1B4D3E]"/>}
                                </button>
                            </th>
                            <th className="p-8">Registry ID</th>
                            <th className="p-8">Catalogue Item</th>
                            <th className="p-8">Manufacturer</th>
                            <th className="p-8 text-center">Status</th>
                            <th className="p-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCatalogue.map(item => (
                            <tr key={item.registrationId} className={`transition-colors group ${selectedItemIds.includes(item.registrationId) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                                <td className="p-8">
                                    <button onClick={() => toggleSelectItem(item.registrationId)} className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedItemIds.includes(item.registrationId) ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-slate-200 group-hover:border-[#1B4D3E]'}`}>
                                        {selectedItemIds.includes(item.registrationId) && <Check size={12} strokeWidth={4} className="text-[#FBBF24]"/>}
                                    </button>
                                </td>
                                <td className="p-8"><span className="font-mono text-xs font-black text-slate-400">{item.registrationId}</span></td>
                                <td className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#1B4D3E] transition-colors"><Box size={20}/></div>
                                        <div><p className="font-black text-slate-800 text-sm leading-tight">{item.tradeName}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.division} • {item.unit}</p></div>
                                    </div>
                                </td>
                                <td className="p-8"><p className="text-xs font-bold text-slate-600">{item.manufacturer}</p></td>
                                <td className="p-8 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'Vetted' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.status || 'Pending'}
                                    </span>
                                </td>
                                <td className="p-8 text-right"><button className="p-2 text-slate-300 hover:text-[#1B4D3E]"><MoreHorizontal size={20}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showMappingModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl"><Table size={24}/></div>
                                <div><h3 className="text-2xl font-black">Align Catalogue Columns</h3><p className="text-green-300 text-xs mt-1">Map your CSV headers to official registry fields.</p></div>
                            </div>
                            <button onClick={() => setShowMappingModal(false)}><X size={24}/></button>
                        </div>
                        <div className="p-10 overflow-y-auto max-h-[60vh] no-scrollbar space-y-6">
                            <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex gap-4 items-start">
                                <Info className="text-amber-600 shrink-0" size={20}/>
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">System detected <strong>{csvHeaders.length}</strong> columns. Trade Name is mandatory for indexing.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {MAPPABLE_FIELDS.map(field => (
                                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-[#1B4D3E]/20 transition-all">
                                        <span className="font-black text-slate-700 text-xs uppercase tracking-widest">{field.label}</span>
                                        <select 
                                            value={fieldMap[field.key] || ''}
                                            onChange={(e) => setFieldMap({ ...fieldMap, [field.key]: e.target.value })}
                                            className="min-w-[200px] px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5"
                                        >
                                            <option value="">-- Ignored --</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-100 flex gap-4">
                            <button onClick={() => setShowMappingModal(false)} className="flex-1 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Discard</button>
                            <button onClick={finalizeImport} className="flex-[2] bg-[#FBBF24] text-[#1B4D3E] py-4 rounded-2xl font-black shadow-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                                Process Bulk Import <ArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAccessControl = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-[#1B4D3E] text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2">Institutional Authorization Matrix</h3>
                    <p className="text-green-100/60 text-sm max-w-2xl font-medium">Standardized access protocols across the AIIS ecosystem. Permissions are managed by the Ministry of Agriculture to ensure data privacy and national security.</p>
                </div>
                <Lock size={200} className="absolute -right-20 -bottom-20 text-white/5 pointer-events-none" />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100">Application Component</th>
                                <th className="p-6">
                                    <div className="text-sm font-black text-slate-800">Guest / Public</div>
                                    <div className="text-[10px] font-bold text-slate-400 italic">e.g. Students, Researchers</div>
                                </th>
                                <th className="p-6 border-l border-slate-100">
                                    <div className="text-sm font-black text-emerald-700">Producer / Processor</div>
                                    <div className="text-[10px] font-bold text-slate-400 italic">e.g. Smallholders, Millers</div>
                                </th>
                                <th className="p-6 border-l border-slate-100">
                                    <div className="text-sm font-black text-amber-700">Extension / Partner</div>
                                    <div className="text-[10px] font-bold text-slate-400 italic">e.g. NGO Workers, RDA Officers</div>
                                </th>
                                <th className="p-6 border-l border-slate-100 bg-[#1B4D3E]/5">
                                    <div className="text-sm font-black text-[#1B4D3E]">Government Authority</div>
                                    <div className="text-[10px] font-bold text-slate-400 italic">e.g. Ministry Officers, Auditors</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {PERMISSIONS_MATRIX.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-6 border-r border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-white group-hover:text-[#1B4D3E] transition-all shadow-sm">
                                                {row.icon}
                                            </div>
                                            <span className="font-black text-slate-800 text-sm">{row.component}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-500 leading-relaxed italic group-hover:bg-white group-hover:border group-hover:border-slate-100">
                                            {row.guest}
                                        </div>
                                    </td>
                                    <td className="p-6 border-l border-slate-100">
                                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-[11px] font-bold text-emerald-800 leading-relaxed">
                                            {row.producer}
                                        </div>
                                    </td>
                                    <td className="p-6 border-l border-slate-100">
                                        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-800 leading-relaxed">
                                            {row.extension}
                                        </div>
                                    </td>
                                    <td className="p-6 border-l border-slate-100 bg-[#1B4D3E]/5">
                                        <div className="p-3 bg-white border border-[#1B4D3E]/20 rounded-2xl text-[11px] font-black text-[#1B4D3E] leading-relaxed shadow-sm">
                                            {row.government}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <Info size={24} className="text-amber-600 shrink-0" />
                <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Access Protocol Note</h4>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Role-based access control (RBAC) is enforced at the network layer. Users can request permission elevation via the National Registry profile settings, subject to verified institutional affiliation and Physical ID verification at regional RDA offices.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSystemConfig = () => {
        const metadataCategories = [
            { key: 'actorTypes', label: 'Actor Personas', icon: <Users size={16}/> },
            { key: 'entityTypes', label: 'Entity Categories', icon: <Building2 size={16}/> },
            { key: 'commodityCategories', label: 'Commodity Groups', icon: <Sprout size={16}/> },
            { key: 'units', label: 'Units of Measure', icon: <Scale size={16}/> },
            { key: 'resourceTypes', label: 'Resource Classes', icon: <Tractor size={16}/> },
            { key: 'operationTypes', label: 'Operation Phases', icon: <RefreshCw size={16}/> },
            { key: 'announcementCategories', label: 'Notice Folders', icon: <Megaphone size={16}/> },
            { key: 'knowledgeCategories', label: 'Library Clusters', icon: <BookOpen size={16}/> },
            { key: 'regions', label: 'National Regions', icon: <Globe size={16}/> },
            { key: 'genders', label: 'Genders', icon: <User size={16}/> }
        ];

        const currentList = systemMetadata[selectedMetaKey] || [];

        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
                <div className="lg:col-span-1 space-y-2">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Collections</p>
                    {metadataCategories.map(cat => (
                        <button 
                            key={cat.key} 
                            onClick={() => setSelectedMetaKey(cat.key)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${selectedMetaKey === cat.key ? 'bg-[#1B4D3E] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">{cat.icon} {cat.label}</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedMetaKey === cat.key ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{systemMetadata[cat.key]?.length || 0}</span>
                        </button>
                    ))}
                </div>
                
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Manage {metadataCategories.find(c => c.key === selectedMetaKey)?.label}</h4>
                                <p className="text-sm text-slate-400 font-medium">Updates made here are instantly reflected in all system-wide dropdowns.</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    value={newItemValue}
                                    onChange={(e) => setNewItemValue(e.target.value)}
                                    placeholder="Enter new option..."
                                    className="flex-1 md:w-64 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all"
                                />
                                <button 
                                    onClick={addItemToMeta}
                                    className="p-3.5 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl shadow-xl hover:bg-yellow-400 transition-all active:scale-95"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {currentList.map((val: any) => {
                                const display = typeof val === 'object' ? val.name : val;
                                return (
                                    <div key={display} className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:border-[#1B4D3E]/20 hover:bg-white hover:shadow-md">
                                        <span className="font-bold text-slate-700 truncate mr-2">{display}</span>
                                        <button 
                                            onClick={() => removeItemFromMeta(val)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {currentList.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-300 italic">No options defined in this collection.</div>
                            )}
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-slate-50 flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Info size={20}/></div>
                            <div>
                                <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Global Integrity Notice</p>
                                <p className="text-[10px] text-blue-700 mt-1 leading-relaxed font-medium">Removing an option will not delete it from existing records but will prevent new records from selecting it. Dynamic lists ensure the AIIS platform remains adaptable to changing regulatory standards.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-200 pb-8">
                <div><h2 className="text-4xl font-black text-[#1B4D3E] tracking-tight">Ministry Portal</h2><p className="text-slate-500 text-lg font-medium">National oversight and regulatory control center.</p></div>
                <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-2xl text-[11px] font-black uppercase border border-blue-100 flex items-center gap-3 shadow-sm"><Landmark size={20}/> National Authority</div>
            </div>

            <div className="flex gap-2 overflow-x-auto bg-white p-2 rounded-3xl border border-slate-200 w-fit no-scrollbar">
                {[
                    { id: 'overview', label: 'Snapshot', icon: <LayoutDashboard size={18}/> },
                    { id: 'users', label: 'Registry', icon: <Users size={18}/> },
                    { id: 'catalogue', label: 'Catalogue', icon: <Box size={18}/> },
                    { id: 'access', label: 'Permissions', icon: <Key size={18}/> },
                    { id: 'config', label: 'System Config', icon: <Sliders size={18}/> },
                    { id: 'reports', label: 'National KPIs', icon: <BarChart3 size={18}/> }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderRegistry()}
                {activeTab === 'catalogue' && renderCatalogue()}
                {activeTab === 'access' && renderAccessControl()}
                {activeTab === 'config' && renderSystemConfig()}
                {activeTab === 'reports' && (
                    <div className="space-y-8">
                        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
                             <button onClick={() => setReportMode('MALABO')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${reportMode === 'MALABO' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400'}`}>Malabo Review</button>
                             <button onClick={() => setReportMode('NATIONAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${reportMode === 'NATIONAL' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400'}`}>National Annual</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {indicators.map(item => (
                                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">{item.commitment || item.category}</p>
                                    <h4 className="font-black text-slate-800 text-lg leading-tight mb-4">{item.label}</h4>
                                    <div className="flex items-baseline gap-2 mb-6"><span className="text-4xl font-black text-[#1B4D3E]">{item.value}</span><span className="text-xs font-bold text-slate-400">{item.unit}</span></div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (item.value / (item.target || 100)) * 100)}%` }}></div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminModule;
