
import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, Users, ShoppingBag, FileText, 
    Search, CheckCircle, Plus, 
    MoreHorizontal, X,
    ShieldCheck, Trash2, Map as MapIcon, Upload, 
    ArrowRight, Zap, Globe2, FileUp, Check, Box, Timer,
    TrendingUp, ShieldAlert, Database, Megaphone, BookOpen, Sliders, History, Fingerprint,
    ShoppingCart, Loader2, ListTree, Settings2, BarChart3, PieChart, TrendingDown, Activity,
    Globe, Landmark, BadgeCheck, ChevronRight, Table, Shield, Lock, Eye, CheckCircle2,
    XCircle, Info, Trash, Save
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    LineChart, Line, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { 
    View_All_System_Users, 
    View_Master_Catalogue, Add_To_Master_Catalogue,
    Report_AIIS_Indicators, View_Trading_Catalogue_Items,
    View_Items_Awaiting_Approval,
    Get_System_Metadata,
    Update_System_Metadata,
    Bulk_Delete_From_Catalogue,
    Bulk_Update_Catalogue_Status
} from '../services/adminDataService';
import { UserRole, CatalogueItem, IndicatorItem, SalesProduct, UserProfile, Region } from '../types';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

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
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [pendingProducts, setPendingProducts] = useState<SalesProduct[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
    const [tradingItems, setTradingItems] = useState<SalesProduct[]>([]);
    const [userSearch, setUserSearch] = useState('');

    const isNationalAdmin = currentUser?.role === UserRole.Government && currentUser?.region === 'All';
    const currentRegion = currentUser?.region;

    const [snapshotData, setSnapshotData] = useState({
        totalEnterprises: 0,
        totalLibraryFiles: 15,
        totalNotices: 12,
        marketLiquidity: 0
    });

    const [systemMetadata, setSystemMetadata] = useState<any>(null);

    // Manual Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualItem, setManualItem] = useState<CatalogueItem>({
        registrationId: '',
        tradeName: '',
        manufacturer: '',
        division: 'Crops',
        category: 'Seeds',
        subCategory: '',
        productType: 'Standard',
        size: '',
        unit: 'kg',
        productStandard: 'Registry Verified',
        description: '',
        availableDistrict: 'National',
        availableRDA: 'All',
        availableConstituency: 'All',
        availableRegNo: '',
        status: 'Vetted'
    });

    useEffect(() => {
        const loadData = async () => {
            const [meta, users, pending, catalogue, market] = await Promise.all([
                Get_System_Metadata(),
                View_All_System_Users(),
                View_Items_Awaiting_Approval(),
                View_Master_Catalogue(),
                View_Trading_Catalogue_Items()
            ]);
            
            setSystemMetadata(meta);
            const filteredUsers = isNationalAdmin ? users : users.filter(u => u.region === currentRegion);
            setAllUsers(filteredUsers);
            
            const filteredMarket = isNationalAdmin ? market : market.filter(p => p.region === currentRegion as any);
            setTradingItems(filteredMarket);
            
            const filteredPending = isNationalAdmin ? pending : pending.filter(p => p.region === currentRegion as any);
            setPendingProducts(filteredPending);
            
            setCatalogueItems(catalogue);

            const marketVal = filteredMarket.reduce((sum, p) => sum + (p.price * p.quantity), 0);
            setSnapshotData(prev => ({
                ...prev,
                totalEnterprises: isNationalAdmin ? 150 : 35,
                marketLiquidity: marketVal
            }));
        };
        loadData();
    }, [activeTab, currentUser, isNationalAdmin, currentRegion]);

    const [selectedMetaKey, setSelectedMetaKey] = useState<string>('actorTypes');
    const [newItemValue, setNewItemValue] = useState('');
    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Vetted'>('All');
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
    const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateMetadata = async (key: string, newList: any[]) => {
        const updated = await Update_System_Metadata(key, newList);
        setSystemMetadata(updated);
    };

    const addItemToMeta = () => {
        if (!newItemValue.trim() || !systemMetadata) return;
        const currentList = systemMetadata[selectedMetaKey] || [];
        const newValue = typeof currentList[0] === 'object'
            ? { id: newItemValue.trim().toLowerCase().replace(/\s+/g, '_'), name: newItemValue.trim() }
            : newItemValue.trim();
        handleUpdateMetadata(selectedMetaKey, [...currentList, newValue]);
        setNewItemValue('');
    };

    const removeItemFromMeta = (itemToRemove: any) => {
        if (!systemMetadata || !window.confirm("Remove item?")) return;
        const currentList = systemMetadata[selectedMetaKey] || [];
        const newList = currentList.filter((item: any) => (typeof item === 'object' ? item.id !== itemToRemove.id : item !== itemToRemove));
        handleUpdateMetadata(selectedMetaKey, newList);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedItemIds.length} registry entries? This action is irreversible.`)) return;
        const updated = await Bulk_Delete_From_Catalogue(selectedItemIds);
        setCatalogueItems(updated);
        setSelectedItemIds([]);
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Approve/Vet ${selectedItemIds.length} registry entries?`)) return;
        const updated = await Bulk_Update_Catalogue_Status(selectedItemIds, 'Vetted');
        setCatalogueItems(updated);
        setSelectedItemIds([]);
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItemIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (itemsOnPage: CatalogueItem[]) => {
        if (selectedItemIds.length === itemsOnPage.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(itemsOnPage.map(i => i.registrationId));
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
                const headers = lines[0].split(',').map(h => h.trim());
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
                setCsvHeaders(headers);
                setCsvDataRows(rows);
                setShowMappingModal(true);
            }
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    const handleSaveManualItem = async () => {
        if (!manualItem.tradeName || !manualItem.manufacturer) return;
        setIsSavingManual(true);
        const itemToSave = { 
            ...manualItem, 
            registrationId: manualItem.registrationId || `SZ-REG-${Date.now()}` 
        };
        const updated = await Add_To_Master_Catalogue([itemToSave]);
        setCatalogueItems(updated);
        setIsSavingManual(false);
        setShowAddModal(false);
        setManualItem({
            registrationId: '',
            tradeName: '',
            manufacturer: '',
            division: 'Crops',
            category: 'Seeds',
            subCategory: '',
            productType: 'Standard',
            size: '',
            unit: 'kg',
            productStandard: 'Registry Verified',
            description: '',
            availableDistrict: 'National',
            availableRDA: 'All',
            availableConstituency: 'All',
            availableRegNo: '',
            status: 'Vetted'
        });
    };

    const finalizeImport = async () => {
        const items: CatalogueItem[] = csvDataRows.map((row, idx) => {
            const getVal = (k: string) => row[csvHeaders.indexOf(fieldMap[k])] || '';
            return {
                registrationId: getVal('registrationId') || `SZ-REG-${Date.now()}-${idx}`,
                tradeName: getVal('tradeName') || 'Untitled',
                manufacturer: getVal('manufacturer') || 'Unknown',
                division: getVal('division') || 'General',
                category: getVal('category') || 'General',
                subCategory: getVal('subCategory') || 'N/A',
                productType: getVal('productType') || 'Standard',
                unit: getVal('unit') || 'Unit',
                description: getVal('description') || 'Bulk Imported',
                productStandard: 'Registry Verified',
                availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-BULK',
                status: 'Pending'
            };
        });
        const updated = await Add_To_Master_Catalogue(items);
        setCatalogueItems(updated);
        setShowMappingModal(false);
    };

    const filteredCatalogue = catalogueItems.filter(item => {
        const matchesSearch = item.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || item.registrationId.toLowerCase().includes(catalogueSearch.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const renderOverview = () => (
        <div className="space-y-4 animate-fade-in flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
                    <p className="text-slate-400 text-[8px] font-black uppercase">Registry</p>
                    <h3 className="text-lg font-black text-[#1B4D3E]">{allUsers.length}</h3>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
                    <p className="text-slate-400 text-[8px] font-black uppercase">Liquidity</p>
                    <h3 className="text-lg font-black text-indigo-600">E { (snapshotData.marketLiquidity / 1000).toFixed(0) }k</h3>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
                    <p className="text-slate-400 text-[8px] font-black uppercase">GIS Nodes</p>
                    <h3 className="text-lg font-black text-amber-600">{snapshotData.totalEnterprises}</h3>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
                    <p className="text-slate-400 text-[8px] font-black uppercase">Alerts</p>
                    <h3 className="text-lg font-black text-rose-600">{pendingProducts.length}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0">
                <div className="lg:col-span-2 bg-[#1B4D3E] rounded-[1.5rem] p-6 text-white relative overflow-hidden h-full flex flex-col justify-between">
                    <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><Globe2 size={18} className="text-[#FBBF24]"/> Sector Distribution</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center"><p className="text-[7px] font-black uppercase text-green-300">Farmers</p><span className="text-xl font-black">{allUsers.filter(u => u.actorType?.includes('Farmer')).length}</span></div>
                        <div className="text-center"><p className="text-[7px] font-black uppercase text-green-300">Processors</p><span className="text-xl font-black">{allUsers.filter(u => u.actorType?.includes('Processor')).length}</span></div>
                        <div className="text-center"><p className="text-[7px] font-black uppercase text-green-300">Logistics</p><span className="text-xl font-black">{allUsers.filter(u => u.actorType?.includes('Logistics')).length}</span></div>
                    </div>
                    <Activity size={200} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none rotate-12" />
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm h-full overflow-y-auto no-scrollbar">
                    <h5 className="font-black text-slate-800 uppercase text-[9px] mb-3">Resource Pool</h5>
                    <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-slate-50 rounded-xl text-[10px] font-bold"><span>Library</span><span className="text-blue-600">{snapshotData.totalLibraryFiles}</span></div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded-xl text-[10px] font-bold"><span>Notices</span><span className="text-amber-600">{snapshotData.totalNotices}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRegistry = () => (
        <div className="space-y-2 animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center shrink-0">
                <Search className="ml-2 text-slate-300" size={14} />
                <input type="text" placeholder="Search registry..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-2 py-1.5 bg-transparent font-bold text-[11px] outline-none" />
                {!isNationalAdmin && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[7px] font-black uppercase">{currentRegion} Region</span>}
            </div>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr><th className="p-4">Institutional Persona</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Ops</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black text-[10px]">{u.name.charAt(0)}</div><div><p className="font-black text-slate-700 text-[11px]">{u.name}</p><p className="text-[7px] text-slate-400 font-black leading-none mt-0.5 uppercase">{u.actorType}</p></div></div></td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${u.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-3 text-right"><MoreHorizontal size={14} className="inline text-slate-300"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCatalogue = () => (
        <div className="space-y-2 animate-fade-in flex flex-col h-[calc(100vh-200px)] relative">
            <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input type="text" placeholder="Filter Catalogue..." value={catalogueSearch} onChange={(e) => setCatalogueSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg font-bold text-[10px] outline-none" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-[#FBBF24] text-[#1B4D3E] rounded-lg text-[8px] font-black uppercase flex items-center gap-2 hover:bg-yellow-400 transition-colors"><Plus size={10}/> New Registry Entry</button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-[#1B4D3E] text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2"><FileUp size={10}/> Import</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-y-auto no-scrollbar relative">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItemIds.length === filteredCatalogue.length && filteredCatalogue.length > 0} 
                                    onChange={() => toggleSelectAll(filteredCatalogue)}
                                    className="rounded border-white/20 accent-[#FBBF24]"
                                />
                            </th>
                            <th className="p-4">Registry ID</th>
                            <th className="p-4">Trade Name</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredCatalogue.map(item => (
                            <tr key={item.registrationId} className={`hover:bg-slate-50 transition-colors ${selectedItemIds.includes(item.registrationId) ? 'bg-indigo-50/50' : ''}`}>
                                <td className="p-3">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItemIds.includes(item.registrationId)} 
                                        onChange={() => toggleItemSelection(item.registrationId)}
                                        className="rounded border-slate-300 accent-[#1B4D3E]"
                                    />
                                </td>
                                <td className="p-3 font-mono text-[8px] font-black text-indigo-600">{item.registrationId}</td>
                                <td className="p-3"><p className="font-black text-slate-700 text-[10px]">{item.tradeName}</p></td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${item.status === 'Vetted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedItemIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1B4D3E] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 z-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
                        <span className="w-5 h-5 bg-[#FBBF24] text-[#1B4D3E] text-[10px] font-black rounded-lg flex items-center justify-center">{selectedItemIds.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleBulkApprove}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <BadgeCheck size={14}/> Approve Selected
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <Trash size={14}/> Delete Selected
                        </button>
                    </div>
                    <button 
                        onClick={() => setSelectedItemIds([])}
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <X size={16}/>
                    </button>
                </div>
            )}
        </div>
    );

    const renderPermissions = () => {
        const matrix = [
            { component: "Dashboard", guest: "Summary", farmer: "My Stats", gov: "Full Analytics", extension: "Regional", services: "Market" },
            { component: "Production GIS", guest: "None", farmer: "Full (GPS)", gov: "Audit", extension: "Assisted", services: "None" },
            { component: "Ops Logging", guest: "None", farmer: "Full Entry", gov: "Audit Logs", extension: "Monitor", services: "None" },
            { component: "Marketplace", guest: "Browse", farmer: "Full Access", gov: "Regulate", extension: "Verify", services: "Procure" },
            { component: "AI Expert", guest: "Q&A", farmer: "Advice", gov: "Reports", extension: "Extension", services: "Stds" },
            { component: "Registry", guest: "Public", farmer: "Self", gov: "Global", extension: "Regional", services: "Affiliate" }
        ];

        return (
            <div className="animate-fade-in flex flex-col h-[calc(100vh-200px)] overflow-hidden">
                <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto no-scrollbar flex-1">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-[0.2em] sticky top-0 z-10">
                                <tr><th className="p-4 bg-[#1B4D3E]">Module</th><th className="p-4 text-center border-l border-white/10">Guest</th><th className="p-4 text-center border-l border-white/10">Farmer</th><th className="p-4 text-center border-l border-white/10">Gov</th><th className="p-4 text-center border-l border-white/10">Ext</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {matrix.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors text-[10px]">
                                        <td className="p-3 font-black text-slate-700 bg-slate-50/30">{row.component}</td>
                                        <td className="p-3 text-center text-slate-400 font-bold italic">{row.guest}</td>
                                        <td className="p-3 text-center text-emerald-700 font-black">{row.farmer}</td>
                                        <td className="p-3 text-center text-indigo-700 font-black">{row.gov}</td>
                                        <td className="p-3 text-center text-amber-600 font-bold">{row.extension}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-[#1B4D3E] tracking-tight">Oversight</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">National Coordination Hub</p>
                </div>
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-full">
                    {[
                        { id: 'overview', label: 'Dash', icon: <LayoutDashboard size={10}/> },
                        { id: 'permissions', label: 'Rules', icon: <Shield size={10}/> },
                        { id: 'users', label: 'Nodes', icon: <Users size={10}/> },
                        { id: 'catalogue', label: 'Master', icon: <Box size={10}/> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white' : 'text-slate-400'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'permissions' && renderPermissions()}
                {activeTab === 'users' && renderRegistry()}
                {activeTab === 'catalogue' && renderCatalogue()}
            </div>

            {/* Manual Add Catalogue Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl border border-white/10"><Plus size={24} className="text-[#FBBF24]"/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Manual Registry Entry</h3>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Master Catalogue Item</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Name *</label>
                                    <input 
                                        value={manualItem.tradeName} 
                                        onChange={(e) => setManualItem({...manualItem, tradeName: e.target.value})} 
                                        placeholder="Product Name..." 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E]" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manufacturer *</label>
                                    <input 
                                        value={manualItem.manufacturer} 
                                        onChange={(e) => setManualItem({...manualItem, manufacturer: e.target.value})} 
                                        placeholder="Company Name..." 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E]" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry ID (Auto or Manual)</label>
                                    <input 
                                        value={manualItem.registrationId} 
                                        onChange={(e) => setManualItem({...manualItem, registrationId: e.target.value})} 
                                        placeholder="SZ-REG-XXXX..." 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm font-black text-indigo-600 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E]" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Division</label>
                                    <select 
                                        value={manualItem.division} 
                                        onChange={(e) => setManualItem({...manualItem, division: e.target.value})} 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none"
                                    >
                                        <option value="Crops">Crops</option>
                                        <option value="Livestock">Livestock</option>
                                        <option value="Machinery">Machinery</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Inputs">Inputs</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                    <input 
                                        value={manualItem.category} 
                                        onChange={(e) => setManualItem({...manualItem, category: e.target.value})} 
                                        placeholder="e.g. Fertilizer, Hybrid Seeds..." 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Size</label>
                                        <input 
                                            value={manualItem.size} 
                                            onChange={(e) => setManualItem({...manualItem, size: e.target.value})} 
                                            placeholder="50, 1, 10..." 
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                                        <select 
                                            value={manualItem.unit} 
                                            onChange={(e) => setManualItem({...manualItem, unit: e.target.value})} 
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="Ton">Ton</option>
                                            <option value="Litre">Litre</option>
                                            <option value="Bag">Bag</option>
                                            <option value="Bottle">Bottle</option>
                                            <option value="Pack">Pack</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Product Description</label>
                                <textarea 
                                    value={manualItem.description} 
                                    onChange={(e) => setManualItem({...manualItem, description: e.target.value})} 
                                    placeholder="Technical specifications, application rates, or safety notes..." 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none h-24 resize-none" 
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Info size={16}/>
                                <p className="text-[10px] font-bold uppercase tracking-tight">Manual entry requires national vetting approval.</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowAddModal(false)} 
                                    className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveManualItem} 
                                    disabled={isSavingManual || !manualItem.tradeName || !manualItem.manufacturer}
                                    className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSavingManual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Commit to Registry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModule;
