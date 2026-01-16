
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
    RefreshCw,
    HardDrive,
    Database as DatabaseIcon,
    History as HistoryIcon,
    Settings
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
import { convertToCSV, parseCSV, flattenEnterprises, reconstructEnterprises } from '../services/csvService';

interface AdminModuleProps {
    currentUser: UserProfile | null;
}

const DATA_SCHEMAS = [
    {
        id: 'users',
        name: 'User Registry',
        icon: <Users size={16}/>,
        description: 'Stakeholder identity records.',
        table: DbTable.Users
    },
    {
        id: 'hubs',
        name: 'Enterprise Hubs',
        icon: <Landmark size={16}/>,
        description: 'Physical node mapping.',
        table: DbTable.Enterprises
    },
    {
        id: 'catalogue',
        name: 'Master Catalogue',
        icon: <Box size={16}/>,
        description: 'Input standards registry.',
        table: DbTable.Catalogue
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

    const [selectedDropdownKey, setSelectedDropdownKey] = useState<string>('units');
    const [newOptionValue, setNewOptionValue] = useState('');
    
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);

    const loadData = async () => {
        const [meta, users, catalogue, backupList] = await Promise.all([
            Get_System_Metadata(),
            View_All_System_Users(),
            View_Master_Catalogue(),
            // Add <any> generic to specify return type of db.getAll to prevent "unknown" type errors
            db.getAll<any>(DbTable.Backups)
        ]);
        setSystemMetadata(meta);
        setAllUsers(users);
        setCatalogueItems(catalogue);
        // Cast sort parameters to any to fix property access error on unknown type
        setBackups(backupList.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser]);

    const [catalogueSearch, setCatalogueSearch] = useState('');

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

    const handleExportCSV = async (type: 'users' | 'hubs' | 'catalogue' | 'all') => {
        setIsBackingUp(true);
        try {
            if (type === 'all') {
                const tables = Object.values(DbTable).filter(t => t !== DbTable.Backups);
                const data: Record<string, any[]> = {};
                for (const table of tables) { data[table] = await db.getAll(table); }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob); link.download = `AIIS_JSON_BUNDLE_${Date.now()}.json`;
                link.click();
            } else {
                const table = type === 'users' ? DbTable.Users : type === 'hubs' ? DbTable.Enterprises : DbTable.Catalogue;
                const items = await db.getAll(table);
                let csvData = "";
                if (type === 'hubs') {
                    const flattened = flattenEnterprises(items);
                    // Exporting Hubs, Units, Resources separately is complex for one click,
                    // so we bundle them in a simple flattened CSV for this view.
                    csvData = convertToCSV(flattened.hubs);
                } else {
                    csvData = convertToCSV(items);
                }
                const blob = new Blob([csvData], { type: 'text/csv' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob); link.download = `AIIS_${type.toUpperCase()}_${Date.now()}.csv`;
                link.click();
            }
        } catch (e) { alert("Export failed."); }
        setIsBackingUp(false);
    };

    const handleImportCSV = async (table: DbTable, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsRestoring(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                if (file.type === 'application/json') {
                    const data = JSON.parse(content);
                    await db.wipeAndRestore(data);
                } else {
                    const items = parseCSV(content);
                    await db.bulkInsert(table, items);
                }
                alert("Data Synchronization Successful.");
                loadData();
            } catch (err) { alert("Restoration failed. Ensure file schema is correct."); }
            setIsRestoring(false);
        };
        if (file.type === 'application/json') reader.readAsText(file);
        else reader.readAsText(file);
    };

    if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4 p-2 sm:p-4 bg-slate-50">
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
                        { id: 'datahub', label: 'Sync Hub', icon: <DatabaseZap size={14}/> }, 
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
                                <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest relative z-10">Backup Status</p>
                                <h3 className="text-2xl font-black relative z-10">{backups.length > 0 ? 'Synchronized' : 'Idle'}</h3>
                                <Save size={80} className="absolute -bottom-6 -right-6 text-white/5" />
                            </div>
                            <div className="bg-[#FBBF24] p-5 rounded-2xl shadow-lg flex flex-col justify-between h-28 text-[#1B4D3E]">
                                <p className="text-[10px] font-black uppercase tracking-widest">Auto-Snapshots</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{backups.length} Records</h3>
                                <HistoryIcon size={24} />
                            </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><HistoryIcon size={16} className="text-emerald-500"/> Recent Auto-Snapshots (10m Intervals)</h4>
                                <span className="text-[9px] font-black text-slate-400 uppercase">Historical Logs</span>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                {backups.map(b => (
                                    <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-600 transition-colors"><Timer size={20}/></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 leading-none">{new Date(b.timestamp).toLocaleString()}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">CSV Node Snapshot: Synchronized</p>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const blob = new Blob([JSON.stringify(b.files, null, 2)], { type: 'application/json' });
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(blob); link.download = `AIIS_SNAPSHOT_${b.id}.json`;
                                            link.click();
                                        }} className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-emerald-600 hover:text-white transition-all">Extract JSON</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-slate-50/30">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search nodes by ID or Name..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                            </div>
                            <button onClick={() => handleExportCSV('users')} className="px-6 py-2 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-900 transition-all active:scale-95 flex items-center gap-2"><Download size={14}/> Export CSV</button>
                        </div>
                        <div className="flex-1 overflow-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[#1B4D3E] text-white uppercase text-[8px] font-black tracking-widest sticky top-0 z-10">
                                    <tr><th className="p-4">Persona</th><th className="p-4">Identity PIN</th><th className="p-4">Region</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors text-[11px] font-bold text-slate-700">
                                            <td className="p-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">{u.name.charAt(0)}</div><div><p className="font-black truncate max-w-[120px]">{u.name}</p><p className="text-[8px] text-slate-400 uppercase font-black">{u.actorType}</p></div></div></td>
                                            <td className="p-3 font-mono text-indigo-600">{u.id}</td>
                                            <td className="p-3 text-slate-400">{u.region}</td>
                                            <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span></td>
                                            <td className="p-3 text-right"><button className="p-1.5 text-slate-400 hover:text-[#1B4D3E] rounded-lg"><Edit2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'datahub' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-[#1B4D3E] p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Data Synchronization Hub</h3>
                                <p className="text-green-300 text-xs font-black uppercase tracking-[0.3em] mt-2">Institutional Node Restoration & CSV Intake</p>
                            </div>
                            <DatabaseZap size={140} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
                        </div>
                        
                        <div className="p-8 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-start gap-4">
                            <ShieldAlert className="text-amber-600 mt-1" size={24}/>
                            <div>
                                <h4 className="text-sm font-black text-amber-900 uppercase">Blank Slate Recovery Protocol</h4>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">If the system has been reset, you must upload CSV files in order: 1. Users, 2. Hubs, 3. Units/Inventory. Use the specific import nodes below.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {DATA_SCHEMAS.map(schema => (
                                <div key={schema.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group">
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <div className="p-4 bg-slate-50 text-slate-400 group-hover:bg-[#1B4D3E] group-hover:text-white rounded-2xl transition-all shadow-inner">{schema.icon}</div>
                                            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">CSV Node</div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg tracking-tight uppercase">{schema.name}</h4>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">{schema.description}</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex flex-col gap-3">
                                        <div className="relative">
                                            <input type="file" accept=".csv" onChange={(e) => handleImportCSV(schema.table, e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            <button className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                                <UploadCloud size={16}/> Sync CSV Node
                                            </button>
                                        </div>
                                        <button onClick={() => handleExportCSV(schema.id as any)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                                            <DownloadCloud size={16}/> Download Snapshot
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-4 animate-fade-in h-full flex flex-col pb-20">
                        <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shrink-0 shadow-xl border border-white/5">
                            <div className="relative z-10 flex items-center gap-8">
                                <div className="p-5 bg-amber-500/20 rounded-3xl border border-amber-500/20"><LockKeyhole size={48} className="text-amber-500"/></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Institutional Continuity Archive</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">National Governance & State Restoration</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all">
                                <div className="space-y-6">
                                    <div className="p-6 bg-emerald-50 text-emerald-600 rounded-3xl inline-block group-hover:rotate-6 transition-transform shadow-inner"><HardDriveDownload size={48}/></div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Full System Export</h4>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mt-2">Compress all stakeholder identities, GIS nodes, and trade chronology into a single high-integrity JSON archive. Recommended for major updates.</p>
                                    </div>
                                </div>
                                <button onClick={() => handleExportCSV('all')} disabled={isBackingUp} className="w-full py-5 bg-[#1B4D3E] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-900 transition-all font-black flex items-center justify-center gap-3">
                                    {isBackingUp ? <Loader2 size={20} className="animate-spin" /> : <><Download size={20}/> Extract National Node Bundle</>}
                                </button>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all">
                                <div className="space-y-6">
                                    <div className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl inline-block group-hover:-rotate-6 transition-transform shadow-inner"><RefreshCw size={48}/></div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Full State Restoration</h4>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mt-2">Overwrite the current device node with an authorized Ministry backup file (JSON Bundle). All existing data on this device will be purged.</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input type="file" accept=".json" onChange={(e) => handleImportCSV(DbTable.Metadata, e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all font-black flex items-center justify-center gap-3">
                                        {isRestoring ? <Loader2 size={20} className="animate-spin" /> : <><RefreshCw size={20}/> Restore National State</>}
                                    </button>
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
