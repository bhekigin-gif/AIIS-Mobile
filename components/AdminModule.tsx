
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
    AlertCircle,
    Download,
    DatabaseZap,
    Network,
    HardDriveDownload,
    Phone
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
    updateUserStatus,
    Register_New_User
} from '../services/adminDataService';
import { db, Table as DbTable } from '../services/databaseService';
import { UserRole, CatalogueItem, IndicatorItem, SalesProduct, UserProfile, Region, ActorType, EntityType, RDAs } from '../types';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

// Full Schema for Data Hub including the 16 Master Catalogue fields
const DATA_SCHEMAS = [
    {
        id: 'users',
        name: 'User Registry',
        icon: <Users size={20}/>,
        description: 'Primary identity records for all agricultural stakeholders.',
        fields: [
            { key: 'id', label: 'National ID', required: true, hint: 'Unique PIN' },
            { key: 'firstName', label: 'First Name', required: true },
            { key: 'lastName', label: 'Last Name', required: true },
            { key: 'contact', label: 'Contacts', required: true },
            { key: 'gender', label: 'Gender', required: true },
            { key: 'role', label: 'System Role', required: true, hint: 'Farmer, Gov, etc' },
            { key: 'entityType', label: 'Institution type', required: true },
            { key: 'country', label: 'Country', required: true },
            { key: 'region', label: 'Region', required: true },
            { key: 'rda', label: 'RDA', required: true },
            { key: 'tinkhundla', label: 'Constituency', required: true },
            { key: 'email', label: 'Email', required: false },
            { key: 'status', label: 'Status', required: false, default: 'Active' }
        ]
    },
    {
        id: 'enterprises',
        name: 'Enterprise Nodes',
        icon: <Landmark size={20}/>,
        description: 'Physical hubs, farms, and agro-processing centers.',
        fields: [
            { key: 'id', label: 'Node ID', required: true },
            { key: 'name', label: 'Enterprise Name', required: true },
            { key: 'ownerId', label: 'Owner PIN', required: true, hint: 'Must match a User PIN' },
            { key: 'region', label: 'Region', required: true },
            { key: 'lat', label: 'Latitude', required: true },
            { key: 'lng', label: 'Longitude', required: true },
            { key: 'tinkhundla', label: 'Tinkhundla', required: false }
        ]
    },
    {
        id: 'catalogue',
        name: 'Master Catalogue',
        icon: <Box size={20}/>,
        description: 'National Vetted Registry for inputs, standards, and spatial availability.',
        fields: [
            { key: 'registrationId', label: 'ID', required: true },
            { key: 'division', label: 'Division', required: true },
            { key: 'category', label: 'Category', required: true },
            { key: 'subCategory', label: 'Subcategory name', required: true },
            { key: 'productType', label: 'Product type', required: true },
            { key: 'tradeName', label: 'Trade name', required: true },
            { key: 'size', label: 'Size', required: false },
            { key: 'unit', label: 'Unit', required: true },
            { key: 'manufacturerName', label: 'Manufacturer name', required: true },
            { key: 'productStandardDescription', label: 'Product Standard Description', required: true },
            { key: 'productStandardUrl', label: 'URL', required: false },
            { key: 'status', label: 'Status', required: true, default: 'Vetted' },
            { key: 'availableDistrict', label: 'Available Region', required: true },
            { key: 'availableRDA', label: 'Available RDA', required: true },
            { key: 'availableConstituency', label: 'Available Constituency', required: true },
            { key: 'availableDiptank', label: 'Available Diptank Area', required: false }
        ]
    }
];

const AdminModule: React.FC<AdminModuleProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [systemMetadata, setSystemMetadata] = useState<any>(null);

    const isNationalAdmin = currentUser?.role === UserRole.Government && currentUser?.region === 'All';
    const currentRegion = currentUser?.region;

    // Dropdown Management State
    const [selectedDropdownKey, setSelectedDropdownKey] = useState<string>('units');
    const [newOptionValue, setNewOptionValue] = useState('');
    const [managingRdaRegion, setManagingRdaRegion] = useState<Region>(Region.Hhohho);

    // Data Hub State
    const [selectedSchema, setSelectedSchema] = useState(DATA_SCHEMAS[0]);
    const [showDataHubModal, setShowDataHubModal] = useState(false);
    const [hubCsvHeaders, setHubCsvHeaders] = useState<string[]>([]);
    const [hubCsvDataRows, setHubCsvDataRows] = useState<string[][]>([]);
    const [hubFieldMap, setHubFieldMap] = useState<Record<string, string>>({});
    const [isProcessingHub, setIsProcessingHub] = useState(false);

    const loadData = async () => {
        const [meta, users, catalogue] = await Promise.all([
            Get_System_Metadata(),
            View_All_System_Users(),
            View_Master_Catalogue()
        ]);
        
        setSystemMetadata(meta);
        const filteredUsers = isNationalAdmin ? users : users.filter(u => u.region === currentRegion);
        setAllUsers(filteredUsers);
        setCatalogueItems(catalogue);
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser, isNationalAdmin, currentRegion]);

    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // --- Action Handlers ---

    const handleUserStatusChange = async (userId: string, status: string) => {
        await updateUserStatus(userId, status);
        await loadData();
    };

    const handleBulkApprove = async () => {
        if (selectedItemIds.length === 0) return;
        await Bulk_Update_Catalogue_Status(selectedItemIds, 'Vetted');
        setSelectedItemIds([]);
        await loadData();
    };

    const handleBulkDelete = async () => {
        if (selectedItemIds.length === 0) return;
        if (window.confirm(`Delete ${selectedItemIds.length} items from the master catalogue?`)) {
            await Bulk_Delete_From_Catalogue(selectedItemIds);
            setSelectedItemIds([]);
            await loadData();
        }
    };

    const handleUpdateDropdownOption = async (deleteValue?: string) => {
        const currentMetadata = await Get_System_Metadata();
        let updatedMetadata = { ...currentMetadata };

        if (selectedDropdownKey === 'rdas') {
            const currentRdas = [...(updatedMetadata.rdas[managingRdaRegion] || [])];
            let newRdas;
            if (deleteValue) {
                newRdas = currentRdas.filter(r => r !== deleteValue);
            } else {
                if (!newOptionValue.trim()) return;
                if (currentRdas.includes(newOptionValue.trim())) return alert("Option exists.");
                newRdas = [...currentRdas, newOptionValue.trim()];
            }
            updatedMetadata.rdas = { ...updatedMetadata.rdas, [managingRdaRegion]: newRdas };
        } else {
            const currentList = [...(updatedMetadata[selectedDropdownKey] || [])];
            let newList;
            if (deleteValue) {
                newList = currentList.filter(item => {
                    const val = typeof item === 'string' ? item : (item as any).id;
                    return val !== deleteValue;
                });
            } else {
                if (!newOptionValue.trim()) return;
                if (currentList.some(item => (typeof item === 'string' ? item : (item as any).name) === newOptionValue.trim())) {
                    alert("Option already exists.");
                    return;
                }
                newList = [...currentList, newOptionValue.trim()];
            }
            updatedMetadata[selectedDropdownKey] = newList;
        }

        await db.saveAll(DbTable.Metadata, [updatedMetadata]);
        setSystemMetadata(updatedMetadata);
        setNewOptionValue('');
    };

    // --- DATA HUB LOGIC ---

    const downloadTemplate = (schema: typeof DATA_SCHEMAS[0]) => {
        const headers = schema.fields.map(f => f.label).join(',');
        const blob = new Blob([headers], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AIIS_Template_${schema.id}.csv`;
        a.click();
    };

    const handleHubFileUpload = (e: React.ChangeEvent<HTMLInputElement>, schema: typeof DATA_SCHEMAS[0]) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
                setHubCsvHeaders(headers);
                setHubCsvDataRows(rows);
                
                // Auto-map
                const initialMap: Record<string, string> = {};
                schema.fields.forEach(f => {
                    const match = headers.find(h => h.toLowerCase() === f.label.toLowerCase() || h.toLowerCase() === f.key.toLowerCase());
                    if (match) initialMap[f.key] = match;
                });
                setHubFieldMap(initialMap);
                setShowDataHubModal(true);
            }
        };
        reader.readAsText(file);
    };

    const finalizeHubImport = async () => {
        setIsProcessingHub(true);
        try {
            if (selectedSchema.id === 'users') {
                const users: UserProfile[] = hubCsvDataRows.map(row => {
                    const get = (k: string) => row[hubCsvHeaders.indexOf(hubFieldMap[k])] || '';
                    const fname = get('firstName');
                    const lname = get('lastName');
                    return {
                        id: get('id'),
                        name: `${fname} ${lname}`,
                        firstName: fname,
                        lastName: lname,
                        email: get('email'),
                        role: get('role') as UserRole,
                        actorType: get('role') as any, // Simple mapping
                        region: get('region'),
                        tinkhundla: get('tinkhundla'),
                        rda: get('rda'),
                        country: get('country'),
                        contact: get('contact'),
                        gender: get('gender'),
                        entityType: get('entityType') as EntityType,
                        status: (get('status') as any) || 'Active',
                        dateRegistered: new Date().toISOString().split('T')[0]
                    };
                });
                for (const u of users) await Register_New_User(u);
            } else if (selectedSchema.id === 'catalogue') {
                const items: CatalogueItem[] = hubCsvDataRows.map(row => {
                    const get = (k: string) => row[hubCsvHeaders.indexOf(hubFieldMap[k])] || '';
                    return {
                        registrationId: get('registrationId'),
                        division: get('division'),
                        category: get('category'),
                        subCategory: get('subCategory'),
                        productType: get('productType'),
                        tradeName: get('tradeName'),
                        size: get('size'),
                        unit: get('unit'),
                        manufacturerName: get('manufacturerName'),
                        productStandardDescription: get('productStandardDescription'),
                        productStandardUrl: get('productStandardUrl'),
                        status: get('status') || 'Vetted',
                        availableDistrict: get('availableDistrict'),
                        availableRDA: get('availableRDA'),
                        availableConstituency: get('availableConstituency'),
                        availableDiptank: get('availableDiptank'),
                        description: 'Bulk Imported',
                        availableRegNo: ''
                    };
                });
                await Add_To_Master_Catalogue(items);
            } else if (selectedSchema.id === 'enterprises') {
                const ents = hubCsvDataRows.map(row => {
                    const get = (k: string) => row[hubCsvHeaders.indexOf(hubFieldMap[k])] || '';
                    return {
                        id: get('id'),
                        name: get('name'),
                        ownerId: get('ownerId'),
                        region: get('region'),
                        gps: { lat: parseFloat(get('lat')), lng: parseFloat(get('lng')) },
                        tinkhundla: get('tinkhundla'),
                        units: [], resources: [], processes: [], operations: [], usageLogs: []
                    };
                });
                for (const e of ents) await db.insert(DbTable.Enterprises, e);
            }
            alert("Data Synchronization Complete.");
            setShowDataHubModal(false);
            loadData();
        } catch (error) {
            alert("Sync Failed: Relationship or format error.");
        }
        setIsProcessingHub(false);
    };

    // --- COMPONENT RENDERS ---

    const renderDataHub = () => (
        <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Network size={28}/></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">National Data Architecture</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bulk Repository Population Hub</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3">
                        <BadgeCheck size={16}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Validation Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-10">
                {DATA_SCHEMAS.map(schema => (
                    <div key={schema.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-[400px]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {schema.icon}
                            </div>
                            <button 
                                onClick={() => downloadTemplate(schema)}
                                className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Download Template"
                            >
                                <Download size={20}/>
                            </button>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 mb-2">{schema.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">{schema.description}</p>
                        
                        <div className="flex-1 space-y-3 mb-8 overflow-y-auto no-scrollbar">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Required Schema</p>
                            <div className="flex flex-wrap gap-2">
                                {schema.fields.map(f => (
                                    <span key={f.key} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${f.required ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400'}`}>
                                        {f.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative mt-auto">
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept=".csv" 
                                onChange={(e) => { setSelectedSchema(schema); handleHubFileUpload(e, schema); }}
                            />
                            <button className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">
                                <DatabaseZap size={16} className="text-[#FBBF24]"/> Upload Node Data
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showDataHubModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 animate-fade-in">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10"><Table size={32} className="text-[#FBBF24]"/></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Synchronize {selectedSchema.name}</h3>
                                    <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest mt-1">Institutional Parameter Alignment</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDataHubModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                        </div>
                        <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                                {selectedSchema.fields.map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label} {field.required && <span className="text-rose-500">*</span>}</label>
                                            {field.hint && <span className="text-[8px] font-bold text-indigo-400 italic">{field.hint}</span>}
                                        </div>
                                        <div className="relative">
                                            <select 
                                                value={hubFieldMap[field.key] || ''} 
                                                onChange={(e) => setHubFieldMap({ ...hubFieldMap, [field.key]: e.target.value })} 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">-- Do Not Import --</option>
                                                {hubCsvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                            <button onClick={() => setShowDataHubModal(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard Batch</button>
                            <button 
                                onClick={finalizeHubImport} 
                                disabled={isProcessingHub}
                                className="px-16 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isProcessingHub ? <Loader2 size={18} className="animate-spin" /> : <HardDriveDownload size={18} className="text-[#FBBF24]" />}
                                {isProcessingHub ? 'Committing Nodes...' : 'Initialize National Sync'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderRegistry = () => (
        <div className="space-y-2 animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center shrink-0">
                <Search className="ml-2 text-slate-300" size={14} />
                <input type="text" placeholder="Search registry by name or National ID..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-2 py-1.5 bg-transparent font-bold text-[11px] outline-none" />
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[7px] font-black uppercase">{isNationalAdmin ? 'National Scope (All Data)' : `${currentRegion} Region Scope`}</span>
            </div>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 sticky left-0 bg-[#1B4D3E] z-20">Full Name / Persona</th>
                            <th className="p-4">National ID (PIN)</th>
                            <th className="p-4">Communication Node</th>
                            <th className="p-4 text-center">Gender</th>
                            <th className="p-4 text-center">Institution Node</th>
                            <th className="p-4 text-center">Operational Area (Region/RDA/Constituency)</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right sticky right-0 bg-[#1B4D3E] z-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {allUsers.filter(u => 
                            u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.id?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.lastName?.toLowerCase().includes(userSearch.toLowerCase())
                        ).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black text-[10px]">
                                            {u.firstName?.charAt(0) || u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700 text-[11px]">{u.firstName} {u.lastName}</p>
                                            <p className="text-[7px] text-slate-400 font-black leading-none mt-0.5 uppercase">{u.role} - {u.actorType}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1.5"><Fingerprint size={10} className="text-indigo-400" /><span className="font-mono text-indigo-600 font-black text-[10px]">{u.id}</span></div>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-col gap-0.5 text-slate-500 font-bold text-[10px]">
                                        <div className="flex items-center gap-1.5"><Mail size={10} className="text-slate-300" /><span className="truncate max-w-[150px]">{u.email || 'N/A'}</span></div>
                                        <div className="flex items-center gap-1.5"><Phone size={10} className="text-slate-300" /><span>{u.contact || 'N/A'}</span></div>
                                    </div>
                                </td>
                                <td className="p-3 text-center"><span className="text-[9px] font-black text-slate-400 uppercase">{u.gender || '-'}</span></td>
                                <td className="p-3 text-center">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-700 uppercase">{u.entityType}</p>
                                        <p className="text-[8px] text-slate-400 italic truncate max-w-[100px] mx-auto">{u.organization || 'Individual'}</p>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-[#1B4D3E] uppercase">{u.country} • {u.region}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{u.rda || 'All'} RDA • {u.tinkhundla || 'General'}</p>
                                    </div>
                                </td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${u.status === 'Active' ? 'bg-green-50 text-green-700' : u.status === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10">
                                    <div className="flex justify-end items-center gap-2">
                                        {u.id !== 'ADMIN' && (
                                            <>
                                                {u.status !== 'Active' ? (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Active')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate"><UserCheck size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Suspended')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend"><UserMinus size={14} /></button>
                                                )}
                                                <button onClick={async () => { if(window.confirm("Remove user node?")) { await db.delete(DbTable.Users, u.id!); loadData(); } }} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove"><Trash size={14} /></button>
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
                    <input type="text" placeholder="Filter National Master Catalogue..." value={catalogueSearch} onChange={(e) => setCatalogueSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg font-bold text-[10px] outline-none" />
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1800px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 w-10 sticky left-0 bg-[#1B4D3E] z-20">
                                <input type="checkbox" onChange={(e) => setSelectedItemIds(e.target.checked ? catalogueItems.map(i => i.registrationId) : [])} className="rounded accent-[#FBBF24]"/>
                            </th>
                            <th className="p-4 sticky left-10 bg-[#1B4D3E] z-20">ID</th>
                            <th className="p-4">Division</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Subcategory</th>
                            <th className="p-4">Product Type</th>
                            <th className="p-4">Trade Name</th>
                            <th className="p-4">Size/Unit</th>
                            <th className="p-4">Manufacturer</th>
                            <th className="p-4">Standard Info</th>
                            <th className="p-4">Region/RDA</th>
                            <th className="p-4">Constituency/Diptank</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {catalogueItems.filter(i => i.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || i.registrationId.toLowerCase().includes(catalogueSearch.toLowerCase())).map(item => (
                            <tr key={item.registrationId} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                    <input type="checkbox" checked={selectedItemIds.includes(item.registrationId)} onChange={() => setSelectedItemIds(prev => prev.includes(item.registrationId) ? prev.filter(i => i !== item.registrationId) : [...prev, item.registrationId])} className="rounded accent-[#1B4D3E]"/>
                                </td>
                                <td className="p-3 font-mono text-[8px] font-black text-indigo-600 sticky left-10 bg-white group-hover:bg-slate-50 z-10">{item.registrationId}</td>
                                <td className="p-3 text-[9px] font-black text-slate-500 uppercase">{item.division}</td>
                                <td className="p-3 text-[9px] font-bold text-slate-600 uppercase">{item.category}</td>
                                <td className="p-3 text-[9px] font-bold text-slate-400 uppercase">{item.subCategory}</td>
                                <td className="p-3 text-[9px] font-bold text-slate-500">{item.productType}</td>
                                <td className="p-3"><p className="font-black text-slate-700 text-[10px]">{item.tradeName}</p></td>
                                <td className="p-3 text-[9px] font-bold text-slate-500">{item.size} {item.unit}</td>
                                <td className="p-3"><span className="text-[10px] font-black text-slate-700">{item.manufacturerName}</span></td>
                                <td className="p-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-emerald-600 truncate max-w-[150px]">{item.productStandardDescription}</p>
                                        {item.productStandardUrl && <a href={item.productStandardUrl} target="_blank" className="text-emerald-400 hover:text-emerald-600 inline-flex items-center gap-1 text-[8px] font-black"><Link size={8}/> Standard URL</a>}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <p className="text-[9px] font-black text-[#1B4D3E] uppercase">{item.availableDistrict}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase">{item.availableRDA} RDA</p>
                                </td>
                                <td className="p-3">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase">{item.availableConstituency}</p>
                                    <p className="text-[8px] text-slate-300 font-black uppercase italic">{item.availableDiptank || 'National Scope'}</p>
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
                <div className="flex items-center gap-4">
                    {selectedDropdownKey === 'rdas' && (
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Region Scope:</label>
                            <select 
                                value={managingRdaRegion} 
                                onChange={(e) => setManagingRdaRegion(e.target.value as Region)}
                                className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-[10px] outline-none uppercase"
                            >
                                {Object.values(Region).filter(r => r !== Region.All).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Managing List:</label>
                        <select 
                            value={selectedDropdownKey} 
                            onChange={(e) => setSelectedDropdownKey(e.target.value)}
                            className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-[10px] outline-none focus:ring-2 focus:ring-[#1B4D3E]/10 transition-all uppercase"
                        >
                            {Object.keys(systemMetadata || {}).filter(k => Array.isArray(systemMetadata[k]) || k === 'rdas').map(key => (
                                <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 no-scrollbar">
                    <div className="space-y-2">
                        {(selectedDropdownKey === 'rdas' 
                            ? (systemMetadata?.[selectedDropdownKey]?.[managingRdaRegion] || []) 
                            : (systemMetadata?.[selectedDropdownKey] || [])
                        ).map((option: any, i: number) => {
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
                    </div>
                </div>
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
                        { id: 'datahub', label: 'Data Hub', icon: <DatabaseZap size={10}/> },
                        { id: 'dropdowns', label: 'Metadata', icon: <ListFilter size={10}/> }
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
                {activeTab === 'datahub' && renderDataHub()}
                {activeTab === 'dropdowns' && renderDropdowns()}
            </div>
        </div>
    );
};

export default AdminModule;
