
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Phone,
    Edit2,
    MapPinned,
    ChevronRightSquare,
    Building,
    ChevronLeft,
    FilterX,
    CalendarCheck
} from 'lucide-react';
import { 
    View_All_System_Users, 
    View_Master_Catalogue,
    Report_AIIS_Indicators, View_Trading_Catalogue_Items,
    View_Items_Awaiting_Approval,
    Get_System_Metadata,
    Update_System_Metadata,
    Bulk_Delete_From_Catalogue,
    Bulk_Update_Catalogue_Status,
    updateUserStatus,
    Bulk_Register_Users,
    Bulk_Add_To_Catalogue
} from '../services/adminDataService';
import { db, Table as DbTable } from '../services/databaseService';
import { UserRole, CatalogueItem, IndicatorItem, SalesProduct, UserProfile, Region, ActorType, EntityType, RDAs, TINKHUNDLA } from '../types';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

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
            { key: 'actorType', label: 'System Role', required: true, hint: 'e.g. Farmer/Producer' },
            { key: 'entityType', label: 'Institution Type', required: true, hint: 'e.g. Person (Individual)' },
            { key: 'organization', label: 'Organisation', required: false },
            { key: 'country', label: 'Country', required: true },
            { key: 'region', label: 'Region', required: true },
            { key: 'rda', label: 'RDA', required: true },
            { key: 'veterinaryArea', label: 'Veterinary Area', required: false },
            { key: 'tinkhundla', label: 'Constituency', required: true },
            { key: 'chiefCode', label: 'Chief Code', required: false },
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
    
    // User Pagination and Filtering
    const [userPage, setUserPage] = useState(1);
    const [userPageSize] = useState(20);
    const [filterRole, setFilterRole] = useState<string>('All');
    const [filterRegion, setFilterRegion] = useState<string>('All');
    const [filterTinkhundla, setFilterTinkhundla] = useState<string>('All');

    // Editing State
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editingCatalogueId, setEditingCatalogueId] = useState<string | null>(null);
    const [catalogueEditBuffer, setCatalogueEditBuffer] = useState<Partial<CatalogueItem>>({});
    const [selectedDropdownKey, setSelectedDropdownKey] = useState<string>('units');
    const [newOptionValue, setNewOptionValue] = useState('');
    const [managingRdaRegion, setManagingRdaRegion] = useState<Region>(Region.Hhohho);
    const [selectedSchema, setSelectedSchema] = useState(DATA_SCHEMAS[0]);
    const [showDataHubModal, setShowDataHubModal] = useState(false);
    const [hubCsvHeaders, setHubCsvHeaders] = useState<string[]>([]);
    const [hubCsvDataRows, setHubCsvDataRows] = useState<string[][]>([]);
    const [hubFieldMap, setHubFieldMap] = useState<Record<string, string>>({});
    const [isProcessingHub, setIsProcessingHub] = useState(false);

    const getScopedUsers = (users: UserProfile[]) => {
        if (!currentUser) return [];
        
        if (currentUser.entityType === EntityType.EmployeeMember || currentUser.actorType === ActorType.Gov) {
             if (currentUser.organizationId) {
                return users.filter(u => u.organizationId === currentUser.organizationId);
             }
        }

        if (currentUser.role === UserRole.Government || currentUser.role === UserRole.Extension) {
            if (currentUser.region === 'All') return users;

            return users.filter(u => {
                const uRegion = u.region?.trim().toLowerCase();
                const myRegion = currentUser.region?.trim().toLowerCase();
                if (uRegion !== myRegion) return false;
                
                if (!currentUser.rda || currentUser.rda === 'All') return true;
                const uRda = u.rda?.trim().toLowerCase();
                const myRda = currentUser.rda?.trim().toLowerCase();
                if (uRda !== myRda) return false;

                if (!currentUser.tinkhundla || currentUser.tinkhundla === 'All') return true;
                const uTink = u.tinkhundla?.trim().toLowerCase();
                const myTink = currentUser.tinkhundla?.trim().toLowerCase();
                return uTink === myTink;
            });
        }
        return users.filter(u => u.id === currentUser.id);
    };

    const loadData = async () => {
        const [meta, users, catalogue] = await Promise.all([
            Get_System_Metadata(),
            View_All_System_Users(),
            View_Master_Catalogue()
        ]);
        setSystemMetadata(meta);
        setAllUsers(getScopedUsers(users));
        setCatalogueItems(catalogue);
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser]);

    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // Filtered and Paginated Users
    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            const matchesSearch = 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.id?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.lastName?.toLowerCase().includes(userSearch.toLowerCase());
            
            const matchesRole = filterRole === 'All' || u.role === filterRole || u.actorType === filterRole;
            const matchesRegion = filterRegion === 'All' || u.region === filterRegion;
            const matchesTinkhundla = filterTinkhundla === 'All' || u.tinkhundla === filterTinkhundla;

            return matchesSearch && matchesRole && matchesRegion && matchesTinkhundla;
        });
    }, [allUsers, userSearch, filterRole, filterRegion, filterTinkhundla]);

    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * userPageSize;
        return filteredUsers.slice(start, start + userPageSize);
    }, [filteredUsers, userPage, userPageSize]);

    const totalPages = Math.ceil(filteredUsers.length / userPageSize);

    const handleUserStatusChange = async (userId: string, status: string) => {
        await updateUserStatus(userId, status);
        await loadData();
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser?.id) return;
        
        await db.update<UserProfile>(DbTable.Users, editingUser.id, editingUser);
        setEditingUser(null);
        await loadData();
        alert("User record synchronized successfully.");
    };

    const finalizeHubImport = async () => {
        if (!currentUser) return;
        setIsProcessingHub(true);
        try {
            if (selectedSchema.id === 'users') {
                const existingUsers = await View_All_System_Users();
                const usedIds = new Set(existingUsers.map(u => u.id?.toLowerCase()).filter(Boolean));
                const usersToImport: UserProfile[] = [];
                
                for (const row of hubCsvDataRows) {
                    const get = (k: string) => {
                        const mappedHeader = hubFieldMap[k];
                        if (!mappedHeader) return '';
                        const idx = hubCsvHeaders.indexOf(mappedHeader);
                        return idx !== -1 ? row[idx] || '' : '';
                    };

                    const fname = get('firstName');
                    const lname = get('lastName');
                    const actor = (get('actorType') || ActorType.Farmer) as ActorType;
                    const providedId = get('id').trim();
                    
                    let finalId = providedId;
                    let finalStatus = (get('status') as any) || 'Active';

                    if (!providedId) {
                        finalId = `TEMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        finalStatus = 'Pending Approval';
                    } else if (usedIds.has(providedId.toLowerCase())) {
                        finalId = `TEMP-DUP-${providedId}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                        finalStatus = 'Pending Approval';
                    } else {
                        usedIds.add(providedId.toLowerCase());
                    }

                    const region = get('region') || (currentUser.region !== 'All' ? currentUser.region : Region.Manzini);
                    const tink = get('tinkhundla') || currentUser.tinkhundla || '';
                    const rda = get('rda') || currentUser.rda || '';

                    let role = UserRole.Farmer;
                    if (actor === ActorType.Gov) role = UserRole.Government;
                    else if (actor === ActorType.Extension) role = UserRole.Extension;

                    usersToImport.push({
                        id: finalId,
                        name: `${fname} ${lname}`.trim() || 'New Node',
                        firstName: fname,
                        lastName: lname,
                        email: get('email'),
                        role: role,
                        actorType: actor,
                        region: region,
                        tinkhundla: tink,
                        rda: rda,
                        country: get('country') || 'Eswatini',
                        contact: get('contact'),
                        gender: get('gender') || 'Male',
                        entityType: (get('entityType') || EntityType.Person) as EntityType,
                        organization: get('organization') || (currentUser.organizationId ? currentUser.organization : ''),
                        organizationId: currentUser.organizationId || '',
                        chiefCode: get('chiefCode'),
                        veterinaryArea: get('veterinaryArea'),
                        status: finalStatus,
                        dateRegistered: new Date().toISOString().split('T')[0]
                    });
                }
                await Bulk_Register_Users(usersToImport);
            } else if (selectedSchema.id === 'catalogue') {
                const items: CatalogueItem[] = hubCsvDataRows.map(row => {
                    const get = (k: string) => {
                        const mappedHeader = hubFieldMap[k];
                        if (!mappedHeader) return '';
                        const idx = hubCsvHeaders.indexOf(mappedHeader);
                        return idx !== -1 ? row[idx] || '' : '';
                    };
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
                        availableDistrict: get('availableDistrict') || 'National',
                        availableRDA: get('availableRDA') || 'All',
                        availableConstituency: get('availableConstituency') || 'All',
                        availableDiptank: get('availableDiptank'),
                        description: 'Bulk Imported',
                        availableRegNo: ''
                    };
                });
                await Bulk_Add_To_Catalogue(items);
            } else if (selectedSchema.id === 'enterprises') {
                const ents = hubCsvDataRows.map(row => {
                    const get = (k: string) => {
                        const mappedHeader = hubFieldMap[k];
                        if (!mappedHeader) return '';
                        const idx = hubCsvHeaders.indexOf(mappedHeader);
                        return idx !== -1 ? row[idx] || '' : '';
                    };
                    return {
                        id: get('id'),
                        name: get('name'),
                        ownerId: get('ownerId'),
                        region: get('region') || (currentUser.region !== 'All' ? currentUser.region : Region.Manzini),
                        gps: { lat: parseFloat(get('lat')) || -26.48, lng: parseFloat(get('lng')) || 31.37 },
                        tinkhundla: get('tinkhundla') || currentUser.tinkhundla || '',
                        units: [], resources: [], processes: [], operations: [], usageLogs: []
                    };
                });
                await db.bulkInsert(DbTable.Enterprises, ents);
            }
            alert("Data Synchronization Complete.");
            setShowDataHubModal(false);
            await loadData();
        } catch (error) {
            console.error("Hub Sync Error:", error);
            alert("Sync Failed: Check console for schema relationship errors.");
        }
        setIsProcessingHub(false);
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

    const renderRegistry = () => (
        <div className="space-y-3 animate-fade-in flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center shrink-0 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                        type="text" 
                        placeholder="Filter by Name, ID, or Contacts..." 
                        value={userSearch} 
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} 
                        className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select 
                        value={filterRole} 
                        onChange={(e) => { setFilterRole(e.target.value); setUserPage(1); }}
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight text-[#1B4D3E] outline-none h-12"
                    >
                        <option value="All">All Roles</option>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        <option disabled>--- Detailed Roles ---</option>
                        {Object.values(ActorType).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select 
                        value={filterRegion} 
                        onChange={(e) => { setFilterRegion(e.target.value); setFilterTinkhundla('All'); setUserPage(1); }}
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight text-[#1B4D3E] outline-none h-12"
                    >
                        <option value="All">National Scope</option>
                        {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {filterRegion !== 'All' && (
                        <select 
                            value={filterTinkhundla} 
                            onChange={(e) => { setFilterTinkhundla(e.target.value); setUserPage(1); }}
                            className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight text-[#1B4D3E] outline-none h-12 animate-fade-in"
                        >
                            <option value="All">All Constituencies</option>
                            {TINKHUNDLA[filterRegion as Region]?.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    )}
                    <button 
                        onClick={() => { setUserSearch(''); setFilterRole('All'); setFilterRegion('All'); setFilterTinkhundla('All'); setUserPage(1); }}
                        className="px-3 h-12 text-slate-400 hover:text-rose-500 bg-slate-50 border border-slate-100 rounded-xl transition-all"
                        title="Clear Filters"
                    >
                        <FilterX size={18}/>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 sticky left-0 bg-[#1B4D3E] z-20">Full Name / Persona</th>
                            <th className="p-4">National ID (PIN)</th>
                            <th className="p-4">Communication Node</th>
                            <th className="p-4 text-center">Gender</th>
                            <th className="p-4 text-center">Institution Node</th>
                            <th className="p-4 text-center">Operational Area</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Last Access</th>
                            <th className="p-4 text-right sticky right-0 bg-[#1B4D3E] z-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#1B4D3E] font-black text-[10px]">{u.firstName?.charAt(0) || u.name.charAt(0)}</div><div><p className="font-black text-slate-700 text-[11px]">{u.firstName} {u.lastName}</p><p className="text-[7px] text-slate-400 font-black leading-none mt-0.5 uppercase">{u.role} - {u.actorType}</p></div></div></td>
                                <td className="p-3"><div className="flex items-center gap-1.5"><Fingerprint size={10} className="text-indigo-400" /><span className="font-mono text-indigo-600 font-black text-[10px]">{u.id}</span></div></td>
                                <td className="p-3"><div className="flex flex-col gap-0.5 text-slate-500 font-bold text-[10px]"><div className="flex items-center gap-1.5"><Mail size={10} className="text-slate-300" /><span className="truncate max-w-[150px]">{u.email || 'N/A'}</span></div><div className="flex items-center gap-1.5"><Phone size={10} className="text-slate-300" /><span>{u.contact || 'N/A'}</span></div></div></td>
                                <td className="p-3 text-center"><span className="text-[9px] font-black text-slate-400 uppercase">{u.gender || '-'}</span></td>
                                <td className="p-3 text-center"><div className="space-y-0.5"><p className="text-[9px] font-black text-slate-700 uppercase">{u.entityType}</p><p className="text-[8px] text-slate-400 italic truncate max-w-[100px] mx-auto">{u.organization || 'Individual'}</p></div></td>
                                <td className="p-3 text-center">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-[#1B4D3E] uppercase">{u.country} • {u.region}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{u.rda || 'All'} RDA • {u.tinkhundla || 'General'}</p>
                                    </div>
                                </td>
                                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${u.status === 'Active' ? 'bg-green-50 text-green-700' : u.status === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{u.status}</span></td>
                                <td className="p-3 text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <CalendarCheck size={12} className={u.lastLogin ? "text-emerald-500" : "text-slate-200"} />
                                        <span className="text-[9px] font-black text-slate-500 uppercase">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never Sync'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10">
                                    <div className="flex justify-end items-center gap-1">
                                        <button onClick={() => setEditingUser({...u})} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Update Profile"><Edit2 size={14} /></button>
                                        {u.id !== 'ADMIN' && (
                                            <>
                                                {u.status !== 'Active' ? (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Active')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate"><UserCheck size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleUserStatusChange(u.id!, 'Suspended')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend"><UserMinus size={14} /></button>
                                                )}
                                                <button onClick={async () => { if(window.confirm("Remove user node?")) { await db.delete(DbTable.Users, u.id!); loadData(); } }} className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove"><Trash size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shrink-0 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase">Showing {paginatedUsers.length} of {filteredUsers.length} records</p>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={userPage === 1} 
                        onClick={() => setUserPage(p => p - 1)}
                        className="p-2 bg-slate-50 text-[#1B4D3E] rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={16}/>
                    </button>
                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setUserPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${userPage === i + 1 ? 'bg-[#1B4D3E] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {i + 1}
                            </button>
                        )).slice(Math.max(0, userPage - 3), Math.min(totalPages, userPage + 2))}
                    </div>
                    <button 
                        disabled={userPage === totalPages} 
                        onClick={() => setUserPage(p => p + 1)}
                        className="p-2 bg-slate-50 text-[#1B4D3E] rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={16}/>
                    </button>
                </div>
            </div>

            {/* User Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Fingerprint size={24} className="text-[#FBBF24]"/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Update Node Record</h3>
                                    <p className="text-green-300 text-[9px] font-bold uppercase tracking-widest mt-1">Institutional Identity Modification</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label><input value={editingUser.firstName || ''} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label><input value={editingUser.lastName || ''} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Node</label><input value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label><input value={editingUser.contact || ''} onChange={e => setEditingUser({...editingUser, contact: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                                    <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Persona Type</label>
                                    <select value={editingUser.actorType} onChange={e => setEditingUser({...editingUser, actorType: e.target.value as ActorType})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                        {Object.values(ActorType).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrative Region</label>
                                    <select value={editingUser.region} onChange={e => setEditingUser({...editingUser, region: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                        {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinkhundla Node</label>
                                    <select value={editingUser.tinkhundla} onChange={e => setEditingUser({...editingUser, tinkhundla: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                        {editingUser.region && TINKHUNDLA[editingUser.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Organization</label><input value={editingUser.organization || ''} onChange={e => setEditingUser({...editingUser, organization: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" /></div>
                            
                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-emerald-900 transition-all flex items-center justify-center gap-2"><Save size={16}/> Commit Node Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCatalogue = () => (
        <div className="space-y-2 animate-fade-in flex flex-col h-[calc(100vh-200px)] relative">
            <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2 shrink-0"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} /><input type="text" placeholder="Filter National Master Catalogue..." value={catalogueSearch} onChange={(e) => setCatalogueSearch(e.target.value)} className="w-full h-10 pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg font-bold text-[10px] outline-none" /></div></div>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1900px]">
                    <thead className="bg-[#1B4D3E] text-white uppercase text-[7px] font-black tracking-widest sticky top-0 z-10">
                        <tr><th className="p-4 w-10 sticky left-0 bg-[#1B4D3E] z-20"><input type="checkbox" onChange={(e) => setSelectedItemIds(e.target.checked ? catalogueItems.map(i => i.registrationId) : [])} className="rounded accent-[#FBBF24]"/></th><th className="p-4 sticky left-10 bg-[#1B4D3E] z-20">ID</th><th className="p-4">Division</th><th className="p-4">Category</th><th className="p-4">Subcategory</th><th className="p-4">Product Type</th><th className="p-4">Trade Name</th><th className="p-4">Pack Size</th><th className="p-4">Unit</th><th className="p-4">Manufacturer</th><th className="p-4">Standard Info</th><th className="p-4 text-center">Status</th><th className="p-4 text-right sticky right-0 bg-[#1B4D3E] z-20">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {catalogueItems.filter(i => i.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || i.registrationId.toLowerCase().includes(catalogueSearch.toLowerCase())).map(item => {
                            const isEditing = editingCatalogueId === item.registrationId;
                            return (
                                <tr key={item.registrationId} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10"><input type="checkbox" checked={selectedItemIds.includes(item.registrationId)} onChange={() => setSelectedItemIds(prev => prev.includes(item.registrationId) ? prev.filter(i => i !== item.registrationId) : [...prev, item.registrationId])} className="rounded accent-[#1B4D3E]"/></td>
                                    <td className="p-3 font-mono text-[8px] font-black text-indigo-600 sticky left-10 bg-white group-hover:bg-slate-50 z-10">{item.registrationId}</td>
                                    <td className="p-3 text-[9px] font-black text-slate-500 uppercase">{item.division}</td>
                                    <td className="p-3">{isEditing ? (<input value={catalogueEditBuffer.category || ''} onChange={(e) => setCatalogueEditBuffer({ ...catalogueEditBuffer, category: e.target.value })} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>) : (<span className="text-[9px] font-bold text-slate-600 uppercase">{item.category}</span>)}</td>
                                    <td className="p-3 text-[9px] font-bold text-slate-400 uppercase">{item.subCategory}</td>
                                    <td className="p-3 text-[9px] font-bold text-slate-500">{item.productType}</td>
                                    <td className="p-3"><p className="font-black text-slate-700 text-[10px]">{item.tradeName}</p></td>
                                    <td className="p-3">{isEditing ? (<input value={catalogueEditBuffer.size || ''} onChange={(e) => setCatalogueEditBuffer({ ...catalogueEditBuffer, size: e.target.value })} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>) : (<span className="text-[9px] font-bold text-slate-500">{item.size}</span>)}</td>
                                    <td className="p-3 text-[9px] font-bold text-slate-500">{item.unit}</td>
                                    <td className="p-3"><span className="text-[10px] font-black text-slate-700">{item.manufacturerName}</span></td>
                                    <td className="p-3"><div className="space-y-1"><p className="text-[9px] font-bold text-emerald-600 truncate max-w-[150px]">{item.productStandardDescription}</p>{item.productStandardUrl && <a href={item.productStandardUrl} target="_blank" className="text-emerald-400 hover:text-emerald-600 inline-flex items-center gap-1 text-[8px] font-black"><Link size={8}/> Standard URL</a>}</div></td>
                                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${item.status === 'Vetted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></td>
                                    <td className="p-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10"><div className="flex justify-end items-center gap-2">{isEditing ? (<><button onClick={() => {}} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle2 size={16}/></button><button onClick={() => setEditingCatalogueId(null)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><XCircle size={16}/></button></>) : (<><button onClick={() => { setEditingCatalogueId(item.registrationId); setCatalogueEditBuffer(item); }} className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-all"><Edit2 size={14}/></button><button onClick={async () => { if(window.confirm("Remove item?")) { await db.delete(DbTable.Catalogue, item.registrationId); loadData(); } }} className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash size={14}/></button></>)}</div></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    /**
     * Renders the Data Synchronization Hub for bulk operations.
     */
    const renderDataHub = () => (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto py-4">
            <div className="bg-[#1B4D3E] p-10 rounded-[3rem] border border-white/10 shadow-xl relative overflow-hidden text-white">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 bg-white/10 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                        <DatabaseZap size={40} className="text-[#FBBF24]"/>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight">National Data Synchronization Hub</h3>
                        <p className="text-sm text-green-300 font-bold uppercase tracking-[0.3em] mt-2">Bulk Transaction Engine • Institutional Records</p>
                    </div>
                </div>
                <Network size={400} className="absolute -bottom-40 -right-40 text-white/5 pointer-events-none rotate-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATA_SCHEMAS.map(schema => (
                    <div key={schema.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-slate-50 text-slate-400 group-hover:bg-[#1B4D3E] group-hover:text-[#FBBF24] rounded-2xl transition-all shadow-inner">
                                    {schema.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{schema.fields.length} FIELDS</span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-xl tracking-tight">{schema.name}</h4>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">{schema.description}</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => downloadTemplate(schema)}
                                className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1B4D3E] hover:border-[#1B4D3E] transition-all"
                            >
                                <Download size={14}/> Template
                            </button>
                            <label className="flex items-center justify-center gap-2 py-3 bg-[#1B4D3E] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-900 transition-all cursor-pointer">
                                <HardDriveDownload size={14}/> Sync Data
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".csv" 
                                    onChange={(e) => {
                                        setSelectedSchema(schema);
                                        handleHubFileUpload(e, schema);
                                    }} 
                                />
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hub Mapping Modal */}
            {showDataHubModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 animate-fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Network size={24} className="text-[#FBBF24]"/></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Sync Logic Mapper</h3>
                                    <p className="text-green-300 text-[10px] font-black uppercase tracking-widest mt-1">Schema: {selectedSchema.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDataHubModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <div className="p-10 overflow-y-auto no-scrollbar space-y-10">
                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                <AlertCircle size={24} className="text-amber-600 mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-amber-900 uppercase">Synchronization Rules</h4>
                                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">Map your CSV headers to the system node fields. Missing mandatory fields may cause node initialization failure. Duplicates will be flagged for review.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {selectedSchema.fields.map(field => (
                                    <div key={field.key} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                {field.label}
                                                {field.required && <span className="text-rose-500 font-bold">*</span>}
                                            </label>
                                            {field.hint && <span className="text-[8px] font-bold text-slate-300 italic">{field.hint}</span>}
                                        </div>
                                        <select 
                                            value={hubFieldMap[field.key] || ''} 
                                            onChange={(e) => setHubFieldMap({ ...hubFieldMap, [field.key]: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all appearance-none"
                                        >
                                            <option value="">-- Ignore Field --</option>
                                            {hubCsvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{hubCsvDataRows.length} Rows Pending</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDataHubModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Abort</button>
                                <button 
                                    onClick={finalizeHubImport} 
                                    disabled={isProcessingHub}
                                    className="px-12 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-900 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isProcessingHub ? <Loader2 size={16} className="animate-spin" /> : <Database size={16}/>}
                                    {isProcessingHub ? 'Committing Nodes...' : 'Execute National Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2 shrink-0">
                <div className="flex items-end gap-3">
                    <div><h2 className="text-xl font-black text-[#1B4D3E] tracking-tight">{currentUser?.role === UserRole.Extension ? 'Field Hub' : 'National Oversight'}</h2><p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">National Coordination Hub</p></div>
                    {currentUser?.role === UserRole.Extension && (<div className="mb-0.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2"><MapPinned size={14} className="text-emerald-600"/><div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tight text-emerald-800"><span>{currentUser.region}</span><ChevronRight size={10} className="text-emerald-300"/><span>{currentUser.rda || 'All RDA'}</span></div></div>)}
                </div>
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-full overflow-x-auto no-scrollbar">
                    {[ { id: 'overview', label: 'Dash', icon: <LayoutDashboard size={10}/> }, { id: 'users', label: 'Nodes', icon: <Users size={10}/> }, { id: 'catalogue', label: 'Master', icon: <Box size={10}/> }, { id: 'datahub', label: 'Data Hub', icon: <DatabaseZap size={10}/> }, { id: 'dropdowns', label: 'Metadata', icon: <ListFilter size={10}/> } ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0 animate-fade-in"><div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24"><p className="text-slate-400 text-[8px] font-black uppercase">Registry</p><h3 className="text-lg font-black text-[#1B4D3E]">{allUsers.length}</h3></div><div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24"><p className="text-slate-400 text-[8px] font-black uppercase">Catalogue</p><h3 className="text-lg font-black text-indigo-600">{catalogueItems.length}</h3></div><div className="bg-[#1B4D3E] p-3 rounded-2xl shadow-sm flex flex-col justify-between h-24"><p className="text-green-300 text-[8px] font-black uppercase">Node Sync</p><h3 className="text-lg font-black text-white">Active</h3></div><div className="bg-[#FBBF24] p-3 rounded-2xl shadow-sm flex flex-col justify-between h-24"><p className="text-[#1B4D3E] text-[8px] font-black uppercase">AIIS v4.0</p><h3 className="text-lg font-black text-[#1B4D3E]">Secure</h3></div></div>
                )}
                {activeTab === 'users' && renderRegistry()}
                {activeTab === 'catalogue' && renderCatalogue()}
                {activeTab === 'datahub' && renderDataHub()}
                {activeTab === 'dropdowns' && (
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-200px)]"><div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4"><div className="flex items-center gap-3"><div className="p-2 bg-[#1B4D3E] rounded-xl text-[#FBBF24]"><ListFilter size={20}/></div><div><h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight">Metadata Management</h3><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control Global UI Dropdown Options</p></div></div></div><div className="flex-1 overflow-hidden flex flex-col lg:flex-row"><div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 no-scrollbar"><div className="space-y-2">{(systemMetadata?.[selectedDropdownKey] || []).map((option: any, i: number) => (<div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors"><span className="text-xs font-bold text-slate-700">{typeof option === 'string' ? option : option.name}</span><button onClick={() => handleUpdateDropdownOption(typeof option === 'string' ? option : option.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></div>))}</div></div><div className="w-full lg:w-80 bg-slate-50/50 p-8 shrink-0"><div className="space-y-6 sticky top-0"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Append Option</label><input value={newOptionValue} onChange={(e) => setNewOptionValue(e.target.value)} placeholder="Enter value..." className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5"/></div><button onClick={() => handleUpdateDropdownOption()} disabled={!newOptionValue.trim()} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all active:scale-95"><Plus size={16}/> Add to Global Node</button></div></div></div></div>
                )}
            </div>
        </div>
    );
};

export default AdminModule;
