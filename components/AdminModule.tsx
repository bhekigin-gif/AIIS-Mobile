
import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, Users, ShoppingBag, FileText, 
    Search, CheckCircle, Plus, 
    MoreHorizontal, X,
    ShieldCheck, Trash2, Map as MapIcon, Upload, 
    ArrowRight, Zap, Globe2, FileUp, Check, Box, Timer,
    TrendingUp, ShieldAlert, Database, Megaphone, BookOpen, Sliders, History, Fingerprint,
    ShoppingCart, Loader2
} from 'lucide-react';
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
import { UserRole, CatalogueItem, IndicatorItem, SalesProduct, UserProfile } from '../types';

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
    const [reportMode] = useState<'MALABO' | 'NATIONAL'>('MALABO');
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [pendingProducts, setPendingProducts] = useState<SalesProduct[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
    const [tradingItems, setTradingItems] = useState<SalesProduct[]>([]);
    const [userSearch, setUserSearch] = useState('');

    const [snapshotData, setSnapshotData] = useState({
        totalEnterprises: 0,
        totalLibraryFiles: 15,
        totalNotices: 12,
        marketLiquidity: 0
    });

    const [systemMetadata, setSystemMetadata] = useState<any>(null);

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
            setAllUsers(users);
            setPendingProducts(pending);
            setCatalogueItems(catalogue);
            setTradingItems(market);

            const marketVal = market.reduce((sum, p) => sum + (p.price * p.quantity), 0);
            setSnapshotData(prev => ({
                ...prev,
                totalEnterprises: 1, // Simulated fallback
                marketLiquidity: marketVal
            }));
        };
        loadData();
    }, [activeTab]);

    const [selectedMetaKey, setSelectedMetaKey] = useState<string>('actorTypes');
    const [newItemValue, setNewItemValue] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Vetted'>('All');
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
    const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateMetadata = async (key: string, newList: any[]) => {
        const updated = await Update_System_Metadata(key, newList);
        setSystemMetadata(updated);
    };

    const addItemToMeta = () => {
        if (!newItemValue.trim() || !systemMetadata) return;
        const currentList = systemMetadata[selectedMetaKey] || [];
        const exists = typeof currentList[0] === 'object' 
            ? currentList.some((v: any) => v.name === newItemValue.trim())
            : currentList.includes(newItemValue.trim());

        if (exists) return alert("Option already exists.");

        const newValue = typeof currentList[0] === 'object'
            ? { id: newItemValue.trim().toLowerCase().replace(/\s+/g, '_'), name: newItemValue.trim() }
            : newItemValue.trim();

        handleUpdateMetadata(selectedMetaKey, [...currentList, newValue]);
        setNewItemValue('');
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedItemIds.length} items?`)) return;
        const updated = await Bulk_Delete_From_Catalogue(selectedItemIds);
        setCatalogueItems(updated);
        setSelectedItemIds([]);
    };

    const handleBulkApprove = async () => {
        const updated = await Bulk_Update_Catalogue_Status(selectedItemIds, 'Vetted');
        setCatalogueItems(updated);
        setSelectedItemIds([]);
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
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Actor Registry</p><h3 className="text-4xl font-black text-[#1B4D3E] mt-2">{allUsers.length}</h3></div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
                    </div>
                    <div className="mt-8 flex items-center justify-between"><div className="flex items-center gap-2 text-emerald-500 font-bold text-xs"><TrendingUp size={14}/> <span>+4% this month</span></div></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Trade Liquidity</p><h3 className="text-4xl font-black text-indigo-600 mt-2">E { (snapshotData.marketLiquidity / 1000).toFixed(0) }k</h3></div>
                        {/* Fixed: ShoppingCart is now imported */}
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={24} /></div>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-indigo-500 font-bold text-xs"><Box size={14}/> <span>{tradingItems.length} active batches</span></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">National GIS Feed</p><h3 className="text-4xl font-black text-amber-600 mt-2">{snapshotData.totalEnterprises}</h3></div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform"><MapIcon size={24} /></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Oversight Queue</p><h3 className="text-4xl font-black text-rose-600 mt-2">{pendingProducts.length + catalogueItems.filter(i => i.status === 'Pending').length}</h3></div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><ShieldAlert size={24} /></div>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-rose-500 font-bold text-xs"><Timer size={14} className="animate-pulse" /> <span>Critical Action</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#1B4D3E] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black mb-8 flex items-center gap-3"><Globe2 size={28} className="text-[#FBBF24]"/> Distribution</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black uppercase text-green-300 mb-2">Producers</p><span className="text-4xl font-black">{allUsers.filter(u => u.actorType?.includes('Farmer')).length}</span></div>
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black uppercase text-green-300 mb-2">Processors</p><span className="text-4xl font-black">{allUsers.filter(u => u.actorType?.includes('Processor')).length}</span></div>
                            <div className="bg-white/10 p-6 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black uppercase text-green-300 mb-2">Regulatory</p><span className="text-4xl font-black">{allUsers.filter(u => u.role === UserRole.Government).length}</span></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={20}/></div><h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Resources</h5></div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center gap-3"><FileText size={16}/> <span className="text-sm font-bold text-slate-700">Library</span></div><span className="text-xs font-black text-blue-600">{snapshotData.totalLibraryFiles}</span></div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center gap-3"><Megaphone size={16}/> <span className="text-sm font-bold text-slate-700">Notices</span></div><span className="text-xs font-black text-amber-600">{snapshotData.totalNotices}</span></div>
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
                <input type="text" placeholder="Search registry..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-3 bg-transparent font-bold text-sm outline-none" />
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                        <tr><th className="p-8">Institutional Persona</th><th className="p-8">Affiliation / Scope</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-8"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black">{u.name.charAt(0)}</div><div><p className="font-black text-slate-800 text-sm">{u.name}</p><p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.actorType}</p></div></div></td>
                                <td className="p-8"><p className="text-sm font-bold text-slate-600">{u.organization || 'Independent'}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.region}</p></td>
                                <td className="p-8 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-8 text-right"><button className="p-2 text-slate-300 hover:text-[#1B4D3E]"><MoreHorizontal size={20}/></button></td>
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
                <div className="relative flex-1 w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={catalogueSearch} onChange={(e) => setCatalogueSearch(e.target.value)} placeholder="Search catalogue..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                <div className="flex items-center gap-4">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#143d31]"><FileUp size={18} className="text-[#FBBF24]"/> Bulk Upload</button>
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                        <tr><th className="p-8">Registry ID</th><th className="p-8">Catalogue Item</th><th className="p-8">Manufacturer</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCatalogue.map(item => (
                            <tr key={item.registrationId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-8 font-mono text-xs text-slate-400">{item.registrationId}</td>
                                <td className="p-8 font-black text-slate-800 text-sm">{item.tradeName}</td>
                                <td className="p-8 font-bold text-slate-500 text-xs">{item.manufacturer}</td>
                                <td className="p-8 text-center"><span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.status === 'Vetted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span></td>
                                <td className="p-8 text-right"><button className="text-rose-500 hover:text-rose-700" onClick={() => handleBulkDelete()}><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showMappingModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
                        <h3 className="text-xl font-black mb-6">Map CSV Columns</h3>
                        <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2">
                            {MAPPABLE_FIELDS.map(f => (
                                <div key={f.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="font-bold text-sm">{f.label}</span>
                                    <select onChange={(e) => setFieldMap(prev => ({ ...prev, [f.key]: e.target.value }))} className="p-2 rounded border text-xs">
                                        <option value="">Skip</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex gap-4"><button onClick={() => setShowMappingModal(false)} className="flex-1 py-4 font-bold">Cancel</button><button onClick={finalizeImport} className="flex-1 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black">Finalize</button></div>
                    </div>
                </div>
            )}
        </div>
    );

    {/* Fixed: Loader2 is now imported */}
    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div><h2 className="text-4xl font-black text-[#1B4D3E]">National Administration</h2><p className="text-slate-500 text-lg">Central oversight and registry management node.</p></div>
                <div className="flex gap-2 bg-white p-2 rounded-3xl border border-slate-200">
                    <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500'}`}>Overview</button>
                    <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500'}`}>Registry</button>
                    <button onClick={() => setActiveTab('catalogue')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalogue' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500'}`}>Catalogue</button>
                </div>
            </div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderRegistry()}
            {activeTab === 'catalogue' && renderCatalogue()}
        </div>
    );
};

export default AdminModule;
