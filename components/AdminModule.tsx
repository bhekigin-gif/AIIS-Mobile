
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
    XCircle, Info, Trash, Save, UserCheck, UserX, UserMinus, Mail, Link, ExternalLink,
    ChevronDown,
    LockKeyhole,
    Camera,
    ListFilter,
    // Fix: Add missing AlertCircle import
    AlertCircle
} from 'lucide-react';
import { 
    View_All_System_Users, 
    View_Master_Catalogue, Add_To_Master_Catalogue,
    Report_AIIS_Indicators, View_Trading_Catalogue_Items,
    View_Items_Awaiting_Approval,
    Get_System_Metadata,
    Update_System_Metadata,
    Bulk_Delete_From_Catalogue,
    Bulk_Update_Catalogue_Status,
    updateUserStatus
} from '../services/adminDataService';
import { db, Table as DbTable } from '../services/databaseService';
import { UserRole, CatalogueItem, IndicatorItem, SalesProduct, UserProfile, Region } from '../types';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

const MAPPABLE_FIELDS = [
    { key: 'registrationId', label: 'Registry ID' },
    { key: 'division', label: 'Division' },
    { key: 'category', label: 'Category' },
    { key: 'subCategory', label: 'Subcategory Name' },
    { key: 'productType', label: 'Product Type' },
    { key: 'tradeName', label: 'Trade Name' },
    { key: 'size', label: 'Size' },
    { key: 'unit', label: 'Unit' },
    { key: 'manufacturerName', label: 'Manufacturer Name' },
    { key: 'manufacturerUrl', label: 'Manufacturer URL' },
    { key: 'productStandardDescription', label: 'Standard Description' },
    { key: 'productStandardUrl', label: 'Standard URL' },
    { key: 'description', label: 'Internal Description' },
];

const PERMISSIONS_MATRIX = [
    { component: "National Dashboard", guest: "Public Summary", farmer: "Personal Stats", extension: "Regional View", government: "National Analytics" },
    { component: "Trade Hub (Market)", guest: "Browse & Prices", farmer: "List & Purchase", extension: "Verify Listings", government: "Regulate & Audit" },
    { component: "Ops Manager (Prod)", guest: "No Access", farmer: "Full Cycle Mgmt", extension: "Technical Audit", government: "Global Monitoring" },
    { component: "AI Expert Advisor", guest: "General Info", farmer: "Pathology Expert", extension: "Diagnostic Node", government: "Policy Advisory" },
    { component: "Information Centre", guest: "Read Only", farmer: "Read/Download", extension: "Technical Access", government: "Publish & Edit" },
    { component: "Capacity Building", guest: "User Stories", farmer: "Knowledge Bank", extension: "Training Node", government: "Strategy Review" },
    { component: "Oversight Module", guest: "No Access", farmer: "No Access", extension: "Regional Admin", government: "Full Master Control" },
];

const AdminModule: React.FC<AdminModuleProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [pendingProducts, setPendingProducts] = useState<SalesProduct[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
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

    // Dropdown Management State
    const [selectedDropdownKey, setSelectedDropdownKey] = useState<string>('units');
    const [newOptionValue, setNewOptionValue] = useState('');

    // Manual Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualItem, setManualItem] = useState<CatalogueItem>({
        registrationId: '',
        division: 'Consumables (Biological & Chemical)',
        category: 'Chemicals',
        subCategory: '',
        productType: 'Standard',
        tradeName: '',
        size: '',
        unit: 'kg',
        manufacturerName: '',
        manufacturerUrl: '',
        productStandardDescription: '',
        productStandardUrl: '',
        description: '',
        availableDistrict: 'National',
        availableRDA: 'All',
        availableConstituency: 'All',
        availableRegNo: '',
        status: 'Vetted',
        image: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setManualItem(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

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
        setCatalogueItems(catalogue);

        const marketVal = filteredMarket.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        setSnapshotData(prev => ({
            ...prev,
            totalEnterprises: isNationalAdmin ? 150 : 35,
            marketLiquidity: marketVal
        }));
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser, isNationalAdmin, currentRegion]);

    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
    const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
                setCsvHeaders(headers);
                setCsvDataRows(rows);
                
                // Smart Mapping
                const initialMap: Record<string, string> = {};
                MAPPABLE_FIELDS.forEach(f => {
                    const match = headers.find(h => h.toLowerCase() === f.label.toLowerCase() || h.toLowerCase() === f.key.toLowerCase());
                    if (match) initialMap[f.key] = match;
                });
                setFieldMap(initialMap);
                setShowMappingModal(true);
            }
        };
        reader.readAsText(file);
    };

    const finalizeImport = async () => {
        const items: CatalogueItem[] = csvDataRows.map((row, idx) => {
            const getVal = (k: string) => row[csvHeaders.indexOf(fieldMap[k])] || '';
            return {
                registrationId: getVal('registrationId') || `SZ-REG-${Date.now()}-${idx}`,
                division: getVal('division') || 'Consumables (Biological & Chemical)',
                category: getVal('category') || 'General',
                subCategory: getVal('subCategory') || 'N/A',
                productType: getVal('productType') || 'Standard',
                tradeName: getVal('tradeName') || 'Untitled',
                size: getVal('size'),
                unit: getVal('unit') || 'Unit',
                manufacturerName: getVal('manufacturerName') || 'Unknown',
                manufacturerUrl: getVal('manufacturerUrl'),
                productStandardDescription: getVal('productStandardDescription') || 'Standard Registry',
                productStandardUrl: getVal('productStandardUrl'),
                description: getVal('description') || 'Bulk Imported',
                availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-BULK',
                status: 'Pending'
            };
        });
        const updated = await Add_To_Master_Catalogue(items);
        setCatalogueItems(updated);
        setShowMappingModal(false);
    };

    const handleSaveManualItem = async () => {
        if (!manualItem.tradeName || !manualItem.manufacturerName) return;
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
            division: 'Consumables (Biological & Chemical)',
            category: 'Chemicals',
            subCategory: '',
            productType: 'Standard',
            tradeName: '',
            size: '',
            unit: 'kg',
            manufacturerName: '',
            manufacturerUrl: '',
            productStandardDescription: '',
            productStandardUrl: '',
            description: '',
            availableDistrict: 'National',
            availableRDA: 'All',
            availableConstituency: 'All',
            availableRegNo: '',
            status: 'Vetted',
            image: ''
        });
    };

    const handleUserStatusChange = async (userId: string, newStatus: 'Active' | 'Suspended' | 'Pending Approval') => {
        if (userId === 'ADMIN') return alert("Cannot modify system superuser status.");
        const success = await updateUserStatus(userId, newStatus);
        if (success) {
            alert(`User status successfully updated to ${newStatus}.`);
            loadData();
        }
    };

    const handleUpdateDropdownOption = async (removeValue?: string) => {
        if (!removeValue && !newOptionValue.trim()) return;
        
        let currentOptions = systemMetadata[selectedDropdownKey];
        if (!Array.isArray(currentOptions)) return;

        let updatedOptions: any[];
        if (removeValue) {
            updatedOptions = currentOptions.filter(o => {
                if (typeof o === 'string') return o !== removeValue;
                if (o.id) return o.id !== removeValue;
                return true;
            });
        } else {
            if (currentOptions.includes(newOptionValue.trim())) return alert("Option already exists.");
            updatedOptions = [...currentOptions, newOptionValue.trim()];
        }

        const updatedMeta = await Update_System_Metadata(selectedDropdownKey, updatedOptions);
        setSystemMetadata(updatedMeta);
        setNewOptionValue('');
    };

    const filteredCatalogue = catalogueItems.filter(item => {
        const matchesSearch = item.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || item.registrationId.toLowerCase().includes(catalogueSearch.toLowerCase());
        return matchesSearch;
    });

    const renderRegistry = () => (
        <div className="space-y-2 animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center shrink-0">
                <Search className="ml-2 text-slate-300" size={14} />
                <input type="text" placeholder="Search registry by name or ID..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-2 py-1.5 bg-transparent font-bold text-[11px] outline-none" />
                {!isNationalAdmin && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[7px] font-black uppercase">{currentRegion} Region</span>}
            </div>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4">Institutional Persona</th>
                            <th className="p-4">Contact (Email)</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Region</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {allUsers.filter(u => 
                            u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.id?.toLowerCase().includes(userSearch.toLowerCase())
                        ).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black text-[10px]">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700 text-[11px]">{u.name}</p>
                                            <p className="text-[7px] text-slate-400 font-black leading-none mt-0.5 uppercase">{u.actorType}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-col gap-0.5 text-slate-500 font-bold text-[10px]">
                                        <div className="flex items-center gap-1.5"><Mail size={10} className="text-slate-300" /><span className="truncate max-w-[150px]">{u.email || 'No email provided'}</span></div>
                                    </div>
                                </td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${u.status === 'Active' ? 'bg-green-50 text-green-700' : u.status === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-3 text-center"><span className="text-[9px] font-bold text-slate-500 uppercase">{u.region}</span></td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {u.id !== 'ADMIN' && (
                                            <>
                                                {u.status !== 'Active' ? (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Active')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><UserCheck size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Suspended')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><UserMinus size={14} /></button>
                                                )}
                                                <button onClick={async () => { if(window.confirm("Remove user?")) { await db.delete(DbTable.Users, u.id!); loadData(); } }} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
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

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 w-10 sticky left-0 bg-[#1B4D3E] z-20">
                                <input type="checkbox" onChange={(e) => setSelectedItemIds(e.target.checked ? filteredCatalogue.map(i => i.registrationId) : [])} className="rounded accent-[#FBBF24]"/>
                            </th>
                            <th className="p-4 sticky left-10 bg-[#1B4D3E] z-20">Reg ID</th>
                            <th className="p-4">Division</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Trade Name</th>
                            <th className="p-4">Specs</th>
                            <th className="p-4">Manufacturer</th>
                            <th className="p-4">Standard</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredCatalogue.map(item => (
                            <tr key={item.registrationId} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                    <input type="checkbox" checked={selectedItemIds.includes(item.registrationId)} onChange={() => setSelectedItemIds(prev => prev.includes(item.registrationId) ? prev.filter(i => i !== item.registrationId) : [...prev, item.registrationId])} className="rounded accent-[#1B4D3E]"/>
                                </td>
                                <td className="p-3 font-mono text-[8px] font-black text-indigo-600 sticky left-10 bg-white group-hover:bg-slate-50 z-10">{item.registrationId}</td>
                                <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-[7px] font-black text-slate-500 uppercase">{item.division}</span></td>
                                <td className="p-3 text-[9px] font-bold text-slate-600 uppercase">{item.category}</td>
                                <td className="p-3"><p className="font-black text-slate-700 text-[10px]">{item.tradeName}</p><p className="text-[8px] text-slate-300 italic">{item.subCategory}</p></td>
                                <td className="p-3 text-[9px] font-bold text-slate-500">{item.size} {item.unit} • {item.productType}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black text-slate-700">{item.manufacturerName}</span>
                                        {item.manufacturerUrl && <a href={item.manufacturerUrl} target="_blank" className="text-indigo-400 hover:text-indigo-600"><ExternalLink size={10}/></a>}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-emerald-600">{item.productStandardDescription}</span>
                                        {item.productStandardUrl && <a href={item.productStandardUrl} target="_blank" className="text-emerald-400 hover:text-emerald-600"><Link size={10}/></a>}
                                    </div>
                                </td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${item.status === 'Vetted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedItemIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1B4D3E] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 z-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
                        <span className="w-5 h-5 bg-[#FBBF24] text-[#1B4D3E] text-[10px] font-black rounded-lg flex items-center justify-center">{selectedItemIds.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleBulkApprove} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-colors shadow-lg"><BadgeCheck size={14}/> Vet Selected</button>
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-colors shadow-lg"><Trash size={14}/> Delete</button>
                    </div>
                    <button onClick={() => setSelectedItemIds([])} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"><X size={16}/></button>
                </div>
            )}
        </div>
    );

    const renderPermissions = () => (
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1B4D3E] rounded-xl text-[#FBBF24]"><LockKeyhole size={20}/></div>
                    <div>
                        <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight">Institutional Access Matrix</h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Component Permission Scoping by Persona</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-[0.2em] sticky top-0 z-10">
                        <tr>
                            <th className="p-6">Module Cluster</th>
                            <th className="p-6 text-center border-l border-white/5">Public Guest</th>
                            <th className="p-6 text-center border-l border-white/5">Primary Farmer</th>
                            <th className="p-6 text-center border-l border-white/5">Extension Officer</th>
                            <th className="p-6 text-center border-l border-white/5">Gov Supervisor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {PERMISSIONS_MATRIX.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-6 font-black text-slate-700 text-xs bg-slate-50/30 border-r border-slate-100 group-hover:bg-indigo-50/50 group-hover:text-indigo-900 transition-colors">{row.component}</td>
                                <td className="p-6 text-center text-slate-400 font-medium italic text-[10px]">{row.guest}</td>
                                <td className="p-6 text-center text-emerald-700 font-black text-[10px]">{row.farmer}</td>
                                <td className="p-6 text-center text-amber-700 font-bold text-[10px]">{row.extension}</td>
                                <td className="p-6 text-center text-[#1B4D3E] font-black text-[11px] underline decoration-emerald-200 decoration-2 underline-offset-4">{row.government}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDropdowns = () => (
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1B4D3E] rounded-xl text-[#FBBF24]"><ListFilter size={20}/></div>
                    <div>
                        <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight">Metadata Management</h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control Global UI Dropdown Options</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Managing List:</label>
                    <select 
                        value={selectedDropdownKey} 
                        onChange={(e) => setSelectedDropdownKey(e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-[10px] outline-none focus:ring-2 focus:ring-[#1B4D3E]/10 transition-all uppercase"
                    >
                        {Object.keys(systemMetadata).filter(k => Array.isArray(systemMetadata[k])).map(key => (
                            <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left: Management List */}
                <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 no-scrollbar">
                    <div className="space-y-2">
                        {systemMetadata[selectedDropdownKey]?.map((option: any, i: number) => {
                            const label = typeof option === 'string' ? option : (option.name || option.id || JSON.stringify(option));
                            const value = typeof option === 'string' ? option : option.id;
                            return (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                                    <span className="text-xs font-bold text-slate-700">{label}</span>
                                    <button 
                                        onClick={() => handleUpdateDropdownOption(value)}
                                        className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            );
                        })}
                        {(!systemMetadata[selectedDropdownKey] || systemMetadata[selectedDropdownKey].length === 0) && (
                            <div className="py-20 text-center text-slate-300">
                                <ListTree size={48} className="mx-auto mb-4 opacity-20"/>
                                <p className="text-xs font-black uppercase tracking-widest">No options defined in this node.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Add Form */}
                <div className="w-full lg:w-80 bg-slate-50/50 p-8 shrink-0">
                    <div className="space-y-6 sticky top-0">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Append Option</label>
                            <input 
                                value={newOptionValue} 
                                onChange={(e) => setNewOptionValue(e.target.value)} 
                                placeholder="Enter value..."
                                className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5"
                            />
                        </div>
                        <button 
                            onClick={() => handleUpdateDropdownOption()}
                            disabled={!newOptionValue.trim()}
                            className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all active:scale-95"
                        >
                            <Plus size={16}/> Add to Global Node
                        </button>
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle size={14}/>
                                <span className="text-[10px] font-black uppercase tracking-tight">Institutional Warning</span>
                            </div>
                            <p className="text-[10px] text-amber-800 font-medium leading-relaxed">Changes to global metadata affect all registered user forms instantly. Ensure policy alignment before committing.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-[#1B4D3E] tracking-tight">Oversight</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">National Coordination Hub</p>
                </div>
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-full overflow-x-auto no-scrollbar">
                    {[
                        { id: 'overview', label: 'Dash', icon: <LayoutDashboard size={10}/> },
                        { id: 'users', label: 'Nodes', icon: <Users size={10}/> },
                        { id: 'catalogue', label: 'Master', icon: <Box size={10}/> },
                        { id: 'permissions', label: 'Matrix', icon: <LockKeyhole size={10}/> },
                        { id: 'dropdowns', label: 'Dropdowns', icon: <ListFilter size={10}/> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0 animate-fade-in">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24"><p className="text-slate-400 text-[8px] font-black uppercase">Registry</p><h3 className="text-lg font-black text-[#1B4D3E]">{allUsers.length}</h3></div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24"><p className="text-slate-400 text-[8px] font-black uppercase">Catalogue</p><h3 className="text-lg font-black text-indigo-600">{catalogueItems.length}</h3></div>
                        <div className="bg-[#1B4D3E] p-3 rounded-2xl shadow-sm flex flex-col justify-between h-24"><p className="text-green-300 text-[8px] font-black uppercase">Node Sync</p><h3 className="text-lg font-black text-white">Active</h3></div>
                        <div className="bg-[#FBBF24] p-3 rounded-2xl shadow-sm flex flex-col justify-between h-24"><p className="text-[#1B4D3E] text-[8px] font-black uppercase">AIIS v4.0</p><h3 className="text-lg font-black text-[#1B4D3E]">Secure</h3></div>
                    </div>
                )}
                {activeTab === 'users' && renderRegistry()}
                {activeTab === 'catalogue' && renderCatalogue()}
                {activeTab === 'permissions' && renderPermissions()}
                {activeTab === 'dropdowns' && renderDropdowns()}
            </div>

            {/* Manual Add Catalogue Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl border border-white/10"><Plus size={24} className="text-[#FBBF24]"/></div>
                                <div><h3 className="text-xl font-black uppercase tracking-tight">Vetted Registry Entry</h3><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">National Master Infrastructure</p></div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Name *</label><input value={manualItem.tradeName} onChange={(e) => setManualItem({...manualItem, tradeName: e.target.value})} placeholder="Official Product Name..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" /></div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reg ID (Auto-gen if empty)</label><input value={manualItem.registrationId} onChange={(e) => setManualItem({...manualItem, registrationId: e.target.value})} placeholder="SZ-REG-XXXX" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-black text-indigo-600 text-sm outline-none" /></div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Infrastructure Division</label>
                                        <select value={manualItem.division} onChange={(e) => setManualItem({...manualItem, division: e.target.value, category: systemMetadata.categoriesByDivision[e.target.value][0]})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                            {systemMetadata.divisions.map((d: string) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Category</label>
                                        <select value={manualItem.category} onChange={(e) => setManualItem({...manualItem, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                            {systemMetadata.categoriesByDivision[manualItem.division]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory Name</label><input value={manualItem.subCategory} onChange={(e) => setManualItem({...manualItem, subCategory: e.target.value})} placeholder="e.g. Basal NPK..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Visual</label>
                                        <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                            {manualItem.image ? (
                                                <>
                                                    <img src={manualItem.image} className="w-full h-full object-cover" />
                                                    <button onClick={() => setManualItem(prev => ({ ...prev, image: '' }))} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center mx-auto shadow-sm mb-3"><Camera size={20} className="text-slate-300"/></div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attach Official Packaging</p>
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manufacturer Name *</label><input value={manualItem.manufacturerName} onChange={(e) => setManualItem({...manualItem, manufacturerName: e.target.value})} placeholder="Entity Name..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Description</label><input value={manualItem.productStandardDescription} onChange={(e) => setManualItem({...manualItem, productStandardDescription: e.target.value})} placeholder="e.g. ISO 9001..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Size</label><input value={manualItem.size} onChange={(e) => setManualItem({...manualItem, size: e.target.value})} placeholder="50, 1..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                                            <select value={manualItem.unit} onChange={(e) => setManualItem({...manualItem, unit: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                                {systemMetadata.units.map((u: string) => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowAddModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                            <button onClick={handleSaveManualItem} disabled={isSavingManual || !manualItem.tradeName || !manualItem.manufacturerName} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50">
                                {isSavingManual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Commit to Master Registry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Mapping Modal */}
            {showMappingModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 animate-fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-indigo-900 p-10 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Table size={32} className="text-[#FBBF24]"/></div>
                                <div><h3 className="text-2xl font-black uppercase tracking-tight">Optimize Parameter Mapping</h3><p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">National Registry Batch Sync</p></div>
                            </div>
                            <button onClick={() => setShowMappingModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                        </div>
                        <div className="p-10 flex-1 overflow-y-auto no-scrollbar space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {MAPPABLE_FIELDS.map(field => (
                                    <div key={field.key} className="flex items-center gap-4 group">
                                        <div className="w-[160px] shrink-0 text-right"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label></div>
                                        <div className="flex-1 relative">
                                            <select value={fieldMap[field.key] || ''} onChange={(e) => setFieldMap({ ...fieldMap, [field.key]: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                                <option value="">-- Do Not Import --</option>
                                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                            <button onClick={() => setShowMappingModal(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard Batch</button>
                            <button onClick={finalizeImport} className="px-16 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-indigo-950 transition-all flex items-center justify-center gap-4">Initialize Data Synchronization <ArrowRight size={18} /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModule;
