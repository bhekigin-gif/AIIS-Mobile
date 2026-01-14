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
    CalendarCheck,
    DownloadCloud,
    UploadCloud,
    ShieldQuestion,
    Wrench,
    RefreshCw
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
        icon: <Users size={16}/>,
        description: 'Stakeholder identity records.',
        fields: [
            { key: 'id', label: 'ID', required: true },
            { key: 'firstName', label: 'First Name', required: true },
            { key: 'lastName', label: 'Last Name', required: true },
            { key: 'contact', label: 'Contacts', required: true },
            { key: 'gender', label: 'Gender', required: true },
            { key: 'actorType', label: 'Role', required: true },
            { key: 'entityType', label: 'Type', required: true },
            { key: 'region', label: 'Region', required: true },
            { key: 'rda', label: 'RDA', required: true },
            { key: 'tinkhundla', label: 'Constituency', required: true },
            { key: 'status', label: 'Status', required: false, default: 'Active' }
        ]
    },
    {
        id: 'enterprises',
        name: 'Enterprises',
        icon: <Landmark size={16}/>,
        description: 'Physical node mapping.',
        fields: [
            { key: 'id', label: 'Node ID', required: true },
            { key: 'name', label: 'Name', required: true },
            { key: 'ownerId', label: 'Owner ID', required: true },
            { key: 'region', label: 'Region', required: true }
        ]
    },
    {
        id: 'catalogue',
        name: 'Master Catalogue',
        icon: <Box size={16}/>,
        description: 'Input standards registry.',
        fields: [
            { key: 'registrationId', label: 'ID', required: true },
            { key: 'division', label: 'Division', required: true },
            { key: 'category', label: 'Category', required: true },
            { key: 'tradeName', label: 'Name', required: true },
            { key: 'unit', label: 'Unit', required: true },
            { key: 'status', label: 'Status', required: true, default: 'Vetted' }
        ]
    }
];

const AdminModule: React.FC<AdminModuleProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [systemMetadata, setSystemMetadata] = useState<any>(null);
    
    const [userPage, setUserPage] = useState(1);
    const [userPageSize] = useState(20);
    const [filterRole, setFilterRole] = useState<string>('All');
    const [filterRegion, setFilterRegion] = useState<string>('All');
    const [filterTinkhundla, setFilterTinkhundla] = useState<string>('All');

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
    
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const loadData = async () => {
        const [meta, users, catalogue] = await Promise.all([
            Get_System_Metadata(),
            View_All_System_Users(),
            View_Master_Catalogue()
        ]);
        setSystemMetadata(meta);
        setAllUsers(users);
        setCatalogueItems(catalogue);
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser]);

    const [catalogueSearch, setCatalogueSearch] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            const matchesSearch = 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.id?.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = filterRole === 'All' || u.role === filterRole || u.actorType === filterRole;
            const matchesRegion = filterRegion === 'All' || u.region === filterRegion;
            return matchesSearch && matchesRole && matchesRegion;
        });
    }, [allUsers, userSearch, filterRole, filterRegion]);

    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * userPageSize;
        return filteredUsers.slice(start, start + userPageSize);
    }, [filteredUsers, userPage]);

    const totalPages = Math.ceil(filteredUsers.length / userPageSize);

    const handleUserStatusChange = async (userId: string, status: string) => {
        await updateUserStatus(userId, status);
        await loadData();
    };

    const handleExportBackup = async () => {
        setIsBackingUp(true);
        try {
            const tables = [DbTable.Users, DbTable.Enterprises, DbTable.Products, DbTable.Orders, DbTable.Catalogue, DbTable.Metadata];
            const backupData: Record<string, any[]> = {};
            for (const table of tables) { backupData[table] = await db.getAll(table); }
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `AIIS_ARCHIVE_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (err) { alert("Backup extraction failed."); }
        setIsBackingUp(false);
    };

    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4 p-2 sm:p-4 bg-slate-50">
            {/* Header Section - Compact */}
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1B4D3E] rounded-xl text-white shadow-lg"><ShieldCheck size={20}/></div>
                    <div>
                        <h2 className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight leading-none">Oversight Hub</h2>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">National Coordination</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
                    {[ 
                        { id: 'overview', label: 'Dash', icon: <LayoutDashboard size={14}/> }, 
                        { id: 'users', label: 'Nodes', icon: <Users size={14}/> }, 
                        { id: 'catalogue', label: 'Master', icon: <Box size={14}/> }, 
                        { id: 'datahub', label: 'Sync', icon: <DatabaseZap size={14}/> }, 
                        { id: 'dropdowns', label: 'Meta', icon: <ListFilter size={14}/> },
                        { id: 'maintenance', label: 'Archive', icon: <RefreshCw size={14}/> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative overflow-y-auto no-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 group hover:border-[#1B4D3E] transition-all">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Registry Nodes</p>
                                <h3 className="text-2xl font-black text-[#1B4D3E]">{allUsers.length}</h3>
                                <div className="w-full bg-emerald-50 h-1 rounded-full"><div className="bg-emerald-500 h-full w-[60%] rounded-full"/></div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 group hover:border-indigo-600 transition-all">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Master Items</p>
                                <h3 className="text-2xl font-black text-indigo-600">{catalogueItems.length}</h3>
                                <div className="w-full bg-indigo-50 h-1 rounded-full"><div className="bg-indigo-500 h-full w-[80%] rounded-full"/></div>
                            </div>
                            <div className="bg-[#1B4D3E] p-5 rounded-2xl shadow-lg flex flex-col justify-between h-28 text-white relative overflow-hidden">
                                <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest relative z-10">Node Health</p>
                                <h3 className="text-2xl font-black relative z-10">Operational</h3>
                                <Activity size={80} className="absolute -bottom-6 -right-6 text-white/5" />
                            </div>
                            <div className="bg-[#FBBF24] p-5 rounded-2xl shadow-lg flex flex-col justify-between h-28 text-[#1B4D3E]">
                                <p className="text-[10px] font-black uppercase tracking-widest">System Build</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">v4.0 Enterprise</h3>
                                <BadgeCheck size={24} />
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} className="text-emerald-500"/> Regional Data Syncing</h4>
                            <div className="h-48 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 border-dashed">
                                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Historical Trend Visualization Loading...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-slate-50/30">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search nodes by ID or Name..." 
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5"
                                />
                            </div>
                            <button className="px-6 py-2 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-900 transition-all active:scale-95"><Plus size={14}/> Add Node</button>
                        </div>
                        <div className="flex-1 overflow-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[#1B4D3E] text-white uppercase text-[8px] font-black tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">Persona</th>
                                        <th className="p-4">Identity PIN</th>
                                        <th className="p-4">Region</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors text-[11px] font-bold text-slate-700">
                                            <td className="p-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">{u.name.charAt(0)}</div><div><p className="font-black truncate max-w-[120px]">{u.name}</p><p className="text-[8px] text-slate-400 uppercase font-black">{u.actorType}</p></div></div></td>
                                            <td className="p-3 font-mono text-indigo-600">{u.id}</td>
                                            <td className="p-3 text-slate-400">{u.region}</td>
                                            <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span></td>
                                            <td className="p-3 text-right"><div className="flex justify-end gap-1.5"><button className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-emerald-50 rounded-lg"><Edit2 size={14}/></button><button className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash size={14}/></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'catalogue' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 shrink-0">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input value={catalogueSearch} onChange={e => setCatalogueSearch(e.target.value)} placeholder="Filter Master Catalogue..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
                            </div>
                            <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 font-black"><Plus size={14}/> Append Standard</button>
                        </div>
                        <div className="flex-1 overflow-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[#1B4D3E] text-white text-[8px] font-black uppercase tracking-widest sticky top-0">
                                    <tr><th className="p-4">Registry ID</th><th className="p-4">Division</th><th className="p-4">Trade Name</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Edit</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-700">
                                    {catalogueItems.filter(i => i.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase())).map(item => (
                                        <tr key={item.registrationId} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-indigo-500 uppercase">{item.registrationId}</td>
                                            <td className="p-3 text-[10px] text-slate-400 uppercase tracking-tighter">{item.division.split(' ')[0]}</td>
                                            <td className="p-3 font-black text-slate-800">{item.tradeName}</td>
                                            <td className="p-3 text-center"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[8px] font-black uppercase">Vetted</span></td>
                                            <td className="p-3 text-right"><button className="p-1.5 text-slate-300 hover:text-[#1B4D3E]"><Edit2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'datahub' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-[#1B4D3E] p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black uppercase tracking-tight">Data Synchronization Hub</h3>
                                <p className="text-green-300 text-[10px] font-black uppercase tracking-widest mt-1">Bulk Node Intake Cluster</p>
                            </div>
                            <DatabaseZap size={100} className="absolute -bottom-4 -right-4 text-white/5 pointer-events-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {DATA_SCHEMAS.map(schema => (
                                <div key={schema.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-[#1B4D3E] group-hover:text-white rounded-2xl transition-all shadow-inner">{schema.icon}</div>
                                            <span className="text-[8px] font-black text-slate-300 uppercase">{schema.fields.length} Nodes</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm tracking-tight">{schema.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{schema.description}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button className="py-2 bg-slate-50 text-slate-500 rounded-lg text-[8px] font-black uppercase hover:bg-slate-100 transition-all font-black">Template</button>
                                        <button className="py-2 bg-[#1B4D3E] text-white rounded-lg text-[8px] font-black uppercase shadow-md hover:bg-emerald-900 transition-all font-black">Import</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'dropdowns' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1B4D3E] rounded-xl text-white shadow-md"><ListFilter size={16}/></div>
                                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest">Metadata Registry</h3>
                            </div>
                            <select value={selectedDropdownKey} onChange={e => setSelectedDropdownKey(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none">
                                <option value="units">Units</option>
                                <option value="genders">Genders</option>
                                <option value="announcementCategories">Announcements</option>
                                <option value="regions">Regions</option>
                            </select>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar border-r border-slate-100">
                                {(systemMetadata?.[selectedDropdownKey] || []).map((opt: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group hover:bg-emerald-50 transition-colors">
                                        <span className="text-[11px] font-bold text-slate-700">{typeof opt === 'string' ? opt : opt.name}</span>
                                        <button className="p-1 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="w-64 p-6 bg-slate-50/50 shrink-0 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Append Node</label>
                                    <input value={newOptionValue} onChange={e => setNewOptionValue(e.target.value)} placeholder="Enter value..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-emerald-500/5"/>
                                </div>
                                <button className="w-full py-3 bg-[#1B4D3E] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-900 transition-all active:scale-95 flex items-center justify-center gap-2"><Plus size={14}/> Commit Value</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-4 animate-fade-in h-full flex flex-col">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shrink-0 shadow-xl border border-white/5">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/20"><LockKeyhole size={32} className="text-amber-500"/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Institutional Continuity Archive</h3>
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1.5">Encryption Protocol Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl inline-block group-hover:rotate-6 transition-transform"><DownloadCloud size={32}/></div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase">Export Archive</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Compress all stakeholder identities and trade chronology batches into a secure JSON archive.</p>
                                </div>
                                <button 
                                    onClick={handleExportBackup} 
                                    disabled={isBackingUp}
                                    className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-900 transition-all font-black"
                                >
                                    {isBackingUp ? <Loader2 size={16} className="animate-spin mx-auto"/> : 'Extract System State'}
                                </button>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl inline-block group-hover:-rotate-6 transition-transform"><UploadCloud size={32}/></div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase">Restore State</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Overwrite the current device node with an authorized Ministry backup file.</p>
                                </div>
                                <div className="relative">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" />
                                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg font-black">Load Archive Node</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminModule;