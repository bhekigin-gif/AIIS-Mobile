
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Tractor, Users, MapPin, MapPinOff, Plus, X, PenTool, ChevronRight, 
  Building2, Activity, CheckCircle2, Info, Map as MapIcon, 
  Loader2, ArrowRight, Save, Target, TrendingUp, Package, 
  Sprout, Factory, ClipboardList, Zap, Calendar as CalendarIcon, Check,
  Search, CheckSquare, Edit3, Trash2, Crosshair,
  Maximize2, ZoomIn, ZoomOut, MousePointer2, AlertCircle,
  ShieldCheck, Layers, Ruler, Pencil, Trash, Hammer, 
  Droplets, UserPlus, Clock, Wallet, BarChart3, ChevronDown, 
  Settings2, MapPinPlus, Layers2, Navigation, BoxSelect,
  HardHat, Gauge, History, Timer, CreditCard, LayoutDashboard,
  ClipboardType, Filter, Calculator, UserCheck, Wrench, SearchCode,
  Globe, Sparkles, PackagePlus, Briefcase, Fingerprint, Receipt,
  Tags, ArrowUpRight, BarChart4, ChevronLeft, PieChart,
  TrendingDown, Scale, MapPinned, Camera, Upload,
  Minimize2, Archive, CalendarDays, LineChart as LineIcon,
  Landmark, Maximize, GraduationCap, Microscope,
  LocateFixed, Edit, Eye, Scan, PlusSquare, MinusCircle, Coins,
  PawPrint, MapPinned as MapPinPlusInside,
  MousePointerClick,
  MonitorCheck,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Operation, SalesProduct, MarketOrder, UserProfile, Region, 
  ResourceType, CatalogueItem, ProductionProcess, Resource, 
  TINKHUNDLA, UserRole, EntityType, ActorType 
} from '../types';
import { 
  View_Master_Catalogue, Get_System_Metadata, addProductToRegistry, View_All_System_Users 
} from '../services/adminDataService';
import { db, Table } from '../services/databaseService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";
const PLACE_HOLDER_IMAGE = "https://images.unsplash.com/photo-1492496913980-501348b61384?w=300&h=300&fit=crop";

interface SelectedCatalogueItem {
    item: CatalogueItem;
    quantity: number;
    initialValue: number;
    lifespanHours: number;
}

interface ActivityLog {
    id: string;
    timestamp: string;
    activity: string;
    resourceId: string;
    resourceName: string;
    quantityUsed: number;
    durationHours: number;
    cost: number;
}

interface ProductionProps {
    user: UserProfile | null;
    products: SalesProduct[];
    setProducts: React.Dispatch<React.SetStateAction<SalesProduct[]>>;
    globalOrders: MarketOrder[];
    setGlobalOrders: React.Dispatch<React.SetStateAction<MarketOrder[]>>;
}

const Production: React.FC<ProductionProps> = ({ 
    user,
    products = [], setProducts,
    globalOrders = [], setGlobalOrders
}) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'SETUP' | 'RESOURCES' | 'OPERATIONS' | 'CALENDAR'>('REPORTS');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [masterCatalogue, setMasterCatalogue] = useState<CatalogueItem[]>([]);
  const [orgEmployees, setOrgEmployees] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals / State
  const [selectedEntId, setSelectedEntId] = useState<string | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showOpModal, setShowOpModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  
  const [editingEnt, setEditingEnt] = useState<any | null>(null);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [activeUnitForInventory, setActiveUnitForInventory] = useState<any>(null);
  
  // Interaction Refs
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const isPlacingModeRef = useRef(false);
  const [isTracingUnit, setIsTracingUnit] = useState(false);
  const isTracingUnitRef = useRef(false);

  // Selection state for resource addition
  const [resourceAddMode, setResourceAddMode] = useState<'Manual' | 'Catalogue'>('Catalogue');
  const [selectedCatItems, setSelectedCatItems] = useState<SelectedCatalogueItem[]>([]);
  const [catSearch, setCatSearch] = useState('');

  // Form states
  const [newEnterprise, setNewEnterprise] = useState({ name: '', region: Region.Manzini, tinkhundla: '', lat: 0, lng: 0 });
  const [newUnit, setNewUnit] = useState({ id: '', name: '', unitNumber: '', area: '', path: [] as any[] });
  const [newAsset, setNewAsset] = useState<Partial<Resource>>({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, initialValue: 0, lifespanHours: 1000, image: '' });
  const [newOp, setNewOp] = useState<Partial<Operation>>({ activity: '', type: 'Production', field: '', status: 'Scheduled', assignedResources: [], startDateTime: new Date().toISOString().split('T')[0] });
  const [activityForm, setActivityForm] = useState({ activity: '', resourceId: '', quantity: 1, duration: 1 });
  const [harvestForm, setHarvestForm] = useState({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '' });

  const loadAllData = async (newSelectedId?: string) => {
    setIsLoading(true);
    const [allUsers, allCatalogue, allEnterprises] = await Promise.all([
        View_All_System_Users(),
        View_Master_Catalogue(),
        db.getAll<any>(Table.Enterprises)
    ]);
    
    setMasterCatalogue(allCatalogue);
    if (user?.organization) {
        setOrgEmployees(allUsers.filter(u => u.organization === user.organization && u.id !== user.id));
    }

    let scoped = allEnterprises;
    if (user && user.role !== UserRole.Government) {
        scoped = allEnterprises.filter(e => e.ownerId === user.id || e.organizationId === user.organizationId);
    }
    setEnterprises(scoped);
    if (newSelectedId) setSelectedEntId(newSelectedId);
    else if (scoped.length > 0 && !selectedEntId) setSelectedEntId(scoped[0].id);
    setIsLoading(false);
  };

  useEffect(() => { loadAllData(); }, [user]);

  const selectedEnterprise = useMemo(() => enterprises.find(e => e.id === selectedEntId) || null, [enterprises, selectedEntId]);

  useEffect(() => {
    if ((window as any).google?.maps) { setGoogleApiLoaded(true); return; }
    if (document.getElementById('google-maps-script')) { return; }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.onload = () => setGoogleApiLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    isPlacingModeRef.current = isPlacingMode;
    isTracingUnitRef.current = isTracingUnit;
  }, [isPlacingMode, isTracingUnit]);

  useEffect(() => {
    if (!googleApiLoaded || !mapRef.current || activeTab !== 'SETUP') return;

    const timer = setTimeout(() => {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: -26.4831, lng: 31.3692 },
        zoom: 12,
        mapTypeId: 'hybrid',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        styles: [
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#1B4D3E" }] }
        ]
      });

      const dm = new (window as any).google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: '#1B4D3E',
          fillOpacity: 0.4,
          strokeWeight: 2,
          strokeColor: '#FBBF24',
          clickable: true,
          editable: true,
          zIndex: 1
        }
      });

      dm.setMap(map);
      setMapInstance(map);
      setDrawingManager(dm);

      (window as any).google.maps.event.addListener(dm, 'overlaycomplete', (event: any) => {
        if (event.type === 'polygon') {
          const path = event.overlay.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
          const area = (window as any).google.maps.geometry.spherical.computeArea(event.overlay.getPath()) / 10000;
          setNewUnit({ id: '', name: '', unitNumber: '', area: area.toFixed(2), path });
          setShowUnitModal(true);
          event.overlay.setMap(null); 
          dm.setDrawingMode(null);
          setIsTracingUnit(false);
        }
      });

      map.addListener('click', (e: any) => {
          if (isPlacingModeRef.current) {
              setNewEnterprise(prev => ({ ...prev, lat: e.latLng.lat(), lng: e.latLng.lng() }));
              setShowEnterpriseModal(true);
              setIsPlacingMode(false);
          }
      });
    }, 100);

    return () => {
        clearTimeout(timer);
        markersRef.current.forEach(m => m.setMap(null));
        polygonsRef.current.forEach(p => p.setMap(null));
    };
  }, [googleApiLoaded, activeTab]);

  useEffect(() => {
    if (!mapInstance) return;

    markersRef.current.forEach(m => m.setMap(null));
    polygonsRef.current.forEach(p => p.setMap(null));
    markersRef.current = [];
    polygonsRef.current = [];

    enterprises.forEach(ent => {
        if (ent.gps) {
            const marker = new (window as any).google.maps.Marker({
                position: ent.gps,
                map: mapInstance,
                title: ent.name,
                icon: {
                    path: (window as any).google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: selectedEntId === ent.id ? "#FBBF24" : "#1B4D3E",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#FFFFFF"
                }
            });
            marker.addListener('click', () => setSelectedEntId(ent.id));
            markersRef.current.push(marker);

            if (selectedEntId === ent.id && ent.units) {
                ent.units.forEach((u: any) => {
                    if (u.path && u.path.length > 0) {
                        const poly = new (window as any).google.maps.Polygon({
                            paths: u.path,
                            map: mapInstance,
                            fillColor: '#1B4D3E',
                            fillOpacity: 0.35,
                            strokeColor: '#FBBF24',
                            strokeWeight: 2
                        });
                        polygonsRef.current.push(poly);
                    }
                });
            }
        }
    });
  }, [mapInstance, enterprises, selectedEntId]);

  const handleStartTracing = (entId: string) => {
      if (!drawingManager) return;
      setSelectedEntId(entId);
      setIsTracingUnit(true);
      drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON);
  };

  const handleSaveEnterprise = async () => {
    if (editingEnt) {
        const ent = await db.getById<any>(Table.Enterprises, editingEnt.id);
        ent.name = newEnterprise.name;
        ent.region = newEnterprise.region;
        ent.tinkhundla = newEnterprise.tinkhundla;
        await db.update(Table.Enterprises, editingEnt.id, ent);
        setEditingEnt(null);
    } else {
        const entObj = {
            id: `ENT-${Date.now()}`,
            name: newEnterprise.name,
            ownerId: user?.id,
            organizationId: user?.organizationId,
            region: newEnterprise.region,
            gps: { lat: newEnterprise.lat, lng: newEnterprise.lng },
            tinkhundla: newEnterprise.tinkhundla,
            units: [],
            resources: [],
            operations: []
        };
        await db.insert(Table.Enterprises, entObj);
    }
    setShowEnterpriseModal(false);
    loadAllData();
  };

  const handleSaveUnit = async () => {
    if (!selectedEntId) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
    if (editingUnit) {
        ent.units = ent.units.map((u: any) => u.id === editingUnit.id ? { ...u, name: newUnit.name } : u);
        setEditingUnit(null);
    } else {
        const unitObj = { ...newUnit, id: `UNT-${Date.now()}`, resources: [] };
        ent.units = [...(ent.units || []), unitObj];
    }
    await db.update(Table.Enterprises, selectedEntId, ent);
    setShowUnitModal(false);
    loadAllData(selectedEntId);
  };

  const handleDeleteEnterprise = async (id: string) => {
      if (window.confirm("Permanently de-register this National Enterprise Node?")) {
          await db.delete(Table.Enterprises, id);
          loadAllData();
      }
  };

  const handleDeleteUnit = async (entId: string, unitId: string) => {
      if (window.confirm("Abolish this operational unit perimeter?")) {
          const ent = await db.getById<any>(Table.Enterprises, entId);
          ent.units = ent.units.filter((u: any) => u.id !== unitId);
          await db.update(Table.Enterprises, entId, ent);
          loadAllData(entId);
      }
  };

  const handleSaveAsset = async () => {
      if (!selectedEntId) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      const newAssets: Resource[] = [];

      if (resourceAddMode === 'Catalogue') {
          selectedCatItems.forEach(sel => {
              const itemType = (sel.item.productType === 'Machinery' || sel.item.division.includes('Mechanisation')) ? ResourceType.Machinery : ResourceType.Consumable;
              const unitCost = (itemType === ResourceType.Machinery) ? (sel.initialValue / (sel.lifespanHours || 1000)) : (sel.initialValue / (sel.quantity || 1));
              newAssets.push({
                  id: `AST-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                  type: itemType, name: sel.item.tradeName, unitNumber: `REG-${sel.item.registrationId}`,
                  category: sel.item.category, unitCost, quantity: sel.quantity, status: 'Available',
                  assignedUnitId: activeUnitForInventory?.id || '', details: sel.item.description,
                  initialValue: sel.initialValue, lifespanHours: sel.lifespanHours || 1000, totalUsageHours: 0,
                  catalogueRef: sel.item.registrationId
              });
          });
      } else {
          const unitCost = (newAsset.type === ResourceType.Machinery) ? ((newAsset.initialValue || 0) / (newAsset.lifespanHours || 1)) : ((newAsset.initialValue || 0) / (newAsset.quantity || 1));
          newAssets.push({ ...newAsset, id: `AST-${Date.now()}`, unitCost, status: 'Available', assignedUnitId: activeUnitForInventory?.id || '', totalUsageHours: 0 } as Resource);
      }

      ent.resources = [...(ent.resources || []), ...newAssets];
      await db.update(Table.Enterprises, selectedEntId, ent);
      setShowAssetModal(false); setSelectedCatItems([]); await loadAllData(selectedEntId);
  };

  const handleLogActivity = async () => {
    if (!selectedOp || !activityForm.resourceId) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
    const res = ent.resources.find((r: any) => r.id === activityForm.resourceId);
    if (!res) return;

    const cost = res.type === ResourceType.Machinery ? (res.unitCost * activityForm.duration) : (res.unitCost * activityForm.quantity);
    const log: ActivityLog = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(), activity: activityForm.activity || selectedOp.activity,
        resourceId: res.id, resourceName: res.name, quantityUsed: activityForm.quantity, durationHours: activityForm.duration, cost
    };

    if (res.type === ResourceType.Consumable) res.quantity -= activityForm.quantity;
    if (res.type === ResourceType.Machinery) res.totalUsageHours = (res.totalUsageHours || 0) + activityForm.duration;

    const op = ent.operations.find((o: any) => o.id === selectedOp.id);
    op.logs = [...(op.logs || []), log];
    op.accumulatedCost = (op.accumulatedCost || 0) + cost;
    op.status = 'In Progress';

    await db.update(Table.Enterprises, selectedEntId!, ent);
    setShowActivityModal(false); setActivityForm({ activity: '', resourceId: '', quantity: 1, duration: 1 });
    await loadAllData(selectedEntId!);
    setSelectedOp(op);
  };

  const handleFinalizeHarvest = async () => {
    if (!selectedEntId || !selectedOp || !harvestForm.name) return;

    const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
    const op = ent.operations.find((o: any) => o.id === selectedOp.id);
    if (!op) return;

    const productId = `PRD-${Date.now()}`;
    const newProduct: SalesProduct = {
      id: productId,
      name: harvestForm.name,
      category: harvestForm.category,
      price: harvestForm.price,
      unit: harvestForm.unit,
      quantity: harvestForm.quantity,
      description: harvestForm.description,
      dateListed: new Date().toISOString(),
      status: 'Pending Approval',
      image: harvestForm.image || PLACE_HOLDER_IMAGE,
      sellerName: selectedEnterprise?.name || user?.name || 'Institutional Producer',
      sellerId: user?.organizationId || user?.id,
      region: selectedEnterprise?.region as Region,
      sourceUnit: op.field,
      operationId: op.id
    };

    await addProductToRegistry(newProduct);
    setProducts(prev => [...prev, newProduct]);
    
    op.status = 'Completed';
    op.producedId = productId;
    op.endDateTime = new Date().toISOString();

    await db.update(Table.Enterprises, selectedEntId, ent);

    setShowHarvestModal(false);
    setHarvestForm({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '' });
    await loadAllData(selectedEntId);
    setSelectedOp(null);
  };

  const renderReports = () => {
      if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 h-full flex flex-col justify-center items-center"><BarChart3 size={64} className="mb-4 text-[#1B4D3E]"/><p className="text-xs font-black uppercase text-[#1B4D3E]">Select an Enterprise Node in Setup</p></div>;
      const opCosts = (selectedEnterprise.operations || []).map((o: any) => ({ name: o.activity, cost: o.accumulatedCost || 0 }));
      const areaData = (selectedEnterprise.units || []).map((u: any) => ({ name: u.name, value: parseFloat(u.area) || 0 }));

      return (
          <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-white/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#1B4D3E] p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between h-40 group relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-300 uppercase tracking-widest">Operational Value</p>
                        <h3 className="text-3xl font-black text-[#FBBF24] mt-2">E {selectedEnterprise.operations?.reduce((s:number, o:any) => s + (o.accumulatedCost || 0), 0).toLocaleString()}</h3>
                      </div>
                      <Coins className="absolute -bottom-4 -right-4 text-white/5 size-32 group-hover:scale-110 transition-transform"/>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-40 hover:border-[#FBBF24] transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
                      <h3 className="text-3xl font-black text-[#1B4D3E] mt-2">E {selectedEnterprise.resources?.reduce((s:number, r:any) => s + (r.initialValue || 0), 0).toLocaleString()}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#FBBF24] uppercase mt-2"><TrendingUp size={14}/> +12% Cycle growth</div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-40 hover:border-[#FBBF24] transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</p>
                      <h3 className="text-3xl font-black text-[#1B4D3E] mt-2">{selectedEnterprise.units?.length || 0}</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-[#FBBF24] h-full w-2/3 rounded-full"/></div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 h-[400px] flex flex-col shadow-lg">
                      <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart4 size={18} className="text-[#FBBF24]"/> Cycle Cost Attribution</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={opCosts}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <YAxis fontSize={10} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="cost" fill="#1B4D3E" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 h-[400px] flex flex-col shadow-lg">
                      <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><PieChart size={18} className="text-[#FBBF24]"/> Spatial Allocation</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={areaData} innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                                    {areaData.map((_, i) => <Cell key={`cell-${i}`} fill={['#1B4D3E', '#FBBF24', '#10B981', '#4F46E5'][i % 4]} />)}
                                </Pie>
                                <RechartsTooltip />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', paddingTop: '20px' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderSetup = () => (
      <div className="h-full flex flex-col animate-fade-in relative overflow-hidden bg-slate-50">
          <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#1B4D3E] rounded-2xl text-[#FBBF24] shadow-lg"><MapIcon size={24}/></div>
                  <div>
                      <h3 className="text-base font-black text-[#1B4D3E] uppercase tracking-widest leading-none">Spatial Command</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">National GIS Node Mapping</p>
                  </div>
              </div>
              <button 
                onClick={() => {
                    setIsPlacingMode(!isPlacingMode);
                    if (isTracingUnit) {
                        drawingManager.setDrawingMode(null);
                        setIsTracingUnit(false);
                    }
                }} 
                className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-3 border-4 border-white ${isPlacingMode ? 'bg-orange-600 text-white animate-pulse' : 'bg-[#1B4D3E] text-white hover:bg-emerald-900'}`}
              >
                  {isPlacingMode ? <X size={18}/> : <MapPinPlus size={18}/>}
                  {isPlacingMode ? 'Cancel Placement' : 'Register New Hub'}
              </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
              {/* GIS Viewport */}
              <div className="flex-1 bg-slate-200 relative overflow-hidden min-h-[300px]">
                  <div ref={mapRef} className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }} />
                  {isPlacingMode && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-10 py-4 bg-orange-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-4 pointer-events-none">
                          <MousePointerClick size={20}/> Tap map to anchor node
                      </div>
                  )}
                  {isTracingUnit && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-10 py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-4 pointer-events-none">
                          <Pencil size={20}/> Tracing unit perimeter...
                      </div>
                  )}
              </div>

              {/* Management Registry Sidebar (Right Side) */}
              <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col relative z-20">
                  <div className="px-8 py-5 bg-[#1B4D3E] text-white flex justify-between items-center sticky top-0 shrink-0">
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FBBF24]">Node Registry</h4>
                        <p className="text-[8px] font-bold text-green-300 uppercase mt-0.5">National Institutional Hubs</p>
                      </div>
                      <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white shadow-sm">{enterprises.length} Nodes</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50 space-y-4">
                      {enterprises.map(ent => (
                          <div key={ent.id} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-5 group shadow-sm ${selectedEntId === ent.id ? 'bg-white border-[#FBBF24] ring-4 ring-[#FBBF24]/10' : 'bg-white border-slate-100 hover:border-[#1B4D3E]/30'}`} onClick={() => setSelectedEntId(ent.id)}>
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-4 rounded-2xl shadow-xl transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] text-[#FBBF24] rotate-3 scale-110' : 'bg-slate-50 text-slate-400'}`}>
                                          <Building2 size={24}/>
                                      </div>
                                      <div>
                                          <p className="text-base font-black text-[#1B4D3E] uppercase tracking-tight truncate max-w-[180px] leading-none">{ent.name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{ent.region}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={(e) => { e.stopPropagation(); setEditingEnt(ent); setNewEnterprise({...ent}); setShowEnterpriseModal(true); }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-[#1B4D3E] hover:text-white transition-all"><Edit2 size={14}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEnterprise(ent.id); }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash size={14}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleStartTracing(ent.id); }} className="p-2.5 bg-[#FBBF24] text-[#1B4D3E] rounded-xl shadow-lg hover:scale-110 transition-all" title="Trace Unit"><Layers2 size={16}/></button>
                                  </div>
                              </div>

                              <div className="space-y-3 pl-4 border-l-4 border-[#FBBF24]/30">
                                  {ent.units?.map((unit: any) => (
                                      <div key={unit.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2 hover:bg-white hover:border-[#1B4D3E]/20 transition-all shadow-sm group/unit">
                                          <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                                                  <p className="text-xs font-black text-[#1B4D3E]">{unit.name}</p>
                                              </div>
                                              <div className="flex gap-1 opacity-0 group-hover/unit:opacity-100 transition-all">
                                                  <button onClick={(e) => { e.stopPropagation(); setEditingUnit(unit); setSelectedEntId(ent.id); setNewUnit({...unit}); setShowUnitModal(true); }} className="p-1.5 bg-white text-slate-400 rounded-lg hover:text-[#1B4D3E] shadow-sm"><Edit2 size={12}/></button>
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteUnit(ent.id, unit.id); }} className="p-1.5 bg-white text-slate-400 rounded-lg hover:text-rose-500 shadow-sm"><Trash size={12}/></button>
                                              </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 border-t border-slate-200/50 pt-2">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{unit.area} Ha</p>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveUnitForInventory(unit); setSelectedEntId(ent.id); setShowAssetModal(true); }}
                                                className="px-4 py-1.5 bg-[#1B4D3E] text-[#FBBF24] rounded-xl text-[9px] font-black uppercase hover:bg-emerald-900 transition-all shadow-lg flex items-center gap-2"
                                              >
                                                  <PackagePlus size={12}/> Provision
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  {(!ent.units || ent.units.length === 0) && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleStartTracing(ent.id); }}
                                        className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-center bg-white/50 hover:bg-[#FBBF24]/5 hover:border-[#FBBF24]/50 transition-all group/trace"
                                      >
                                          <div className="flex flex-col items-center gap-2">
                                            <Crosshair size={24} className="text-slate-200 group-hover/trace:text-[#FBBF24] transition-colors"/>
                                            <p className="text-[10px] font-black text-slate-400 group-hover/trace:text-[#1B4D3E] uppercase tracking-[0.2em]">Trace First Operational Unit</p>
                                          </div>
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      
                      {enterprises.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-100 mb-8 border border-slate-100 shadow-inner">
                                <Globe size={48} className="animate-spin-slow opacity-10"/>
                            </div>
                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">No Hubs Registered</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-4 max-w-[200px] leading-relaxed uppercase">Start by registering your institutional enterprise node on the map.</p>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-2 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex gap-2 px-2">
                {[ 
                    { id: 'REPORTS', label: 'Command View', icon: <BarChart3 size={14}/> },
                    { id: 'SETUP', label: 'Spatial Registry', icon: <MapIcon size={14}/> },
                    { id: 'RESOURCES', label: 'Provisioning', icon: <GraduationCap size={14}/> },
                    { id: 'OPERATIONS', label: 'Cycle Registry', icon: <Zap size={14}/> },
                    { id: 'CALENDAR', label: 'Chronology', icon: <CalendarIcon size={14}/> }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 py-3 px-6 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap rounded-2xl ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {tab.icon} {tab.label} {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FBBF24] rounded-full" />}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-[3rem] shadow-inner overflow-hidden border border-slate-100">
            {activeTab === 'REPORTS' && renderReports()}
            {activeTab === 'SETUP' && renderSetup()}
            {activeTab === 'RESOURCES' && (
                <div className="space-y-6 animate-fade-in p-8 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div>
                            <h4 className="text-2xl font-black uppercase text-[#1B4D3E] tracking-tight leading-none">Operational Provisioning</h4>
                            <p className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-[0.3em] mt-3">Registry Audit • Hub Stocks</p>
                        </div>
                        <button onClick={() => setShowAssetModal(true)} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-emerald-900 transition-all active:scale-95"><Plus size={20} className="text-[#FBBF24]"/> Add Registry Resource</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                        {(selectedEnterprise?.resources || []).map((res: Resource) => (
                            <div key={res.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col group border-b-8 border-b-transparent hover:border-b-[#FBBF24]">
                                <div className="h-44 bg-slate-50 flex items-center justify-center text-slate-300 relative group-hover:bg-emerald-50 transition-colors">
                                    {res.type === ResourceType.Machinery ? <Tractor size={64} className="group-hover:text-[#1B4D3E] transition-all"/> : <Package size={64} className="group-hover:text-[#1B4D3E] transition-all"/>}
                                    <div className="absolute top-5 right-5 px-4 py-1.5 bg-[#1B4D3E] text-[#FBBF24] shadow-xl rounded-xl text-[9px] font-black uppercase border border-white/10">{res.type}</div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div><h5 className="font-black text-[#1B4D3E] text-lg truncate leading-none">{res.name}</h5><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3">{res.category}</p></div>
                                    <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                                        <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registry Qty</span><p className="font-black text-[#1B4D3E] text-2xl mt-1">{res.quantity}</p></div>
                                        <div className="text-right"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Book Rate</span><p className="font-black text-[#FBBF24] text-2xl mt-1">E {res.unitCost.toFixed(2)}</p></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'OPERATIONS' && (
                <div className="space-y-6 animate-fade-in p-8 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex justify-between items-center bg-[#1B4D3E] p-8 rounded-[3rem] shadow-2xl text-white">
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tight leading-none text-[#FBBF24]">Cycle Command</h4>
                            <p className="text-[10px] font-bold text-green-300 uppercase tracking-[0.3em] mt-3">National Harvest Chronology</p>
                        </div>
                        <button onClick={() => setShowOpModal(true)} className="px-10 py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-3"><Plus size={20}/> Initialize Node Cycle</button>
                    </div>
                    <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto pb-20">
                        {(selectedEnterprise?.operations || []).map((op: any) => (
                            <div key={op.id} className={`bg-white rounded-[3rem] border transition-all overflow-hidden ${selectedOp?.id === op.id ? 'border-[#FBBF24] shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:shadow-xl'}`}>
                                <div className="p-10 cursor-pointer" onClick={() => setSelectedOp(selectedOp?.id === op.id ? null : op)}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-5">
                                                <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${op.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-[#1B4D3E] text-[#FBBF24] border border-white/10'}`}>{op.status}</span>
                                                <h5 className="text-2xl font-black text-[#1B4D3E] leading-none">{op.activity}</h5>
                                            </div>
                                            <div className="flex items-center gap-8 text-slate-400">
                                                <div className="flex items-center gap-2.5 font-black uppercase text-[11px]"><MapPin size={18} className="text-[#FBBF24]"/><span>{op.field} Unit</span></div>
                                                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"/>
                                                <div className="flex items-center gap-2.5 font-black uppercase text-[11px]"><CalendarIcon size={18} className="text-[#1B4D3E]"/><span>{new Date(op.startDateTime).toLocaleDateString()}</span></div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-[#1B4D3E] tracking-tight">E {op.accumulatedCost?.toLocaleString() || 0}</p>
                                            <p className="text-[10px] font-black text-[#FBBF24] uppercase tracking-[0.4em] mt-3">Node Sunk Cost</p>
                                        </div>
                                    </div>
                                </div>
                                {selectedOp?.id === op.id && (
                                    <div className="px-10 pb-12 pt-2 space-y-12 animate-slide-up">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button onClick={() => setShowActivityModal(true)} disabled={op.status === 'Completed'} className="py-6 bg-[#1B4D3E] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-900 disabled:opacity-30 transition-all group/btn"><PlusSquare size={24} className="text-[#FBBF24] group-hover/btn:rotate-90 transition-transform"/> Log Cycle Activity</button>
                                            <button onClick={() => setShowHarvestModal(true)} disabled={op.status === 'Completed'} className="py-6 bg-[#FBBF24] text-[#1B4D3E] rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-yellow-400 disabled:opacity-30 transition-all group/btn"><Sprout size={24} className="group-hover/btn:scale-125 transition-transform"/> Finalize Harvest</button>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
                                                <h6 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.4em] flex items-center gap-3"><History size={20} className="text-[#FBBF24]"/> Node Attribution History</h6>
                                                <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400">{op.logs?.length || 0} Synchronized Entries</div>
                                            </div>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                                {(op.logs || []).map((log: any) => (
                                                    <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-[#1B4D3E]/10 transition-all shadow-sm group">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-[#1B4D3E] group-hover:bg-[#1B4D3E] group-hover:text-[#FBBF24] transition-all"><Zap size={24}/></div>
                                                            <div>
                                                                <p className="text-base font-black text-slate-700 leading-none">{log.resourceName}</p>
                                                                <p className="text-[11px] text-slate-400 uppercase font-bold mt-3">
                                                                    {new Date(log.timestamp).toLocaleTimeString()} • {log.durationHours > 0 ? `${log.durationHours}h Applied` : `${log.quantityUsed} Units Applied`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-lg font-black text-[#1B4D3E] bg-white px-6 py-2.5 rounded-[1.25rem] border border-[#FBBF24]/20 shadow-sm">E {log.cost.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                                {(!op.logs || op.logs.length === 0) && (
                                                    <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                                        <Info size={64} className="text-slate-200 mb-6"/>
                                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Node contains zero historical attribution data.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'CALENDAR' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 space-y-8">
                    <CalendarIcon size={120} strokeWidth={0.5} className="text-[#1B4D3E]" />
                    <h3 className="text-2xl font-black uppercase tracking-[0.4em] mb-2 text-[#1B4D3E]">National Chronology</h3>
                    <p className="text-xs font-black uppercase text-[#FBBF24] tracking-widest">Temporal Node Sync Active</p>
                </div>
            )}
        </div>

        {/* Form Modals */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/10 shadow-lg"><Building2 size={28} className="text-[#FBBF24]"/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{editingEnt ? 'Modify Hub' : 'Register Hub'}</h3>
                        </div>
                        <button onClick={() => { setShowEnterpriseModal(false); setEditingEnt(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/50"><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Enterprise Nomenclature</label><input value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Malkerns Estate" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all" /></div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Administrative Region</label>
                                <select value={newEnterprise.region} onChange={(e)=>setNewEnterprise({...newEnterprise, region: e.target.value as Region})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm outline-none focus:bg-white transition-all appearance-none">
                                    {Object.values(Region).filter(r => r !== Region.All).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Constituency Node</label>
                                <select value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm outline-none focus:bg-white transition-all appearance-none">
                                    <option value="">Select...</option>
                                    {TINKHUNDLA[newEnterprise.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        {!editingEnt && (
                        <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[#FBBF24]/20 text-[#FBBF24] rounded-xl"><Crosshair size={20}/></div>
                                <p className="text-[11px] font-mono font-black text-slate-300 tracking-tight">{newEnterprise.lat.toFixed(6)}, {newEnterprise.lng.toFixed(6)}</p>
                            </div>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-lg">Spatial Lock</span>
                        </div>
                        )}
                        <button onClick={handleSaveEnterprise} className="w-full py-6 bg-[#1B4D3E] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-900 active:scale-[0.98] transition-all">{editingEnt ? 'Sync Hub Record' : 'Establish National Node'}</button>
                    </div>
                </div>
            </div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 rounded-2xl shadow-lg border border-white/10"><BoxSelect size={28} className="text-[#FBBF24]"/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{editingUnit ? 'Modify Unit' : 'Establish Unit'}</h3>
                        </div>
                        <button onClick={() => { setShowUnitModal(false); setEditingUnit(null); }} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Functional Label</label><input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Block A1" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-sm" /></div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Spatial Area</label><div className="w-full px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-3xl font-black text-sm text-[#1B4D3E] shadow-inner flex items-center justify-center gap-3"><Scale size={18}/> {newUnit.area} Ha</div></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Topology</label><select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm outline-none appearance-none shadow-sm focus:bg-white"><option>Arable Field</option><option>Intensive Greenhouse</option><option>Shed/Dry Storage</option><option>Livestock Enclosure</option></select></div>
                        </div>
                        <div className="p-6 bg-[#FBBF24]/10 rounded-[2rem] border border-[#FBBF24]/20 flex items-start gap-5">
                            <ShieldCheck size={28} className="text-[#1B4D3E] mt-1 shrink-0"/>
                            <p className="text-[11px] text-[#1B4D3E] leading-relaxed font-bold">Node coordinates are being cryptographically verified to ensure national plot integrity and compliance.</p>
                        </div>
                        <button onClick={handleSaveUnit} className="w-full py-6 bg-[#1B4D3E] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-900 active:scale-[0.98] transition-all">Establish National Perimeter</button>
                    </div>
                </div>
            </div>
        )}

        {showAssetModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/10 rounded-[2rem] border border-white/10 shadow-2xl"><PackagePlus size={32} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Node Provisioning</h3>
                                <p className="text-[11px] text-green-300 font-bold uppercase tracking-[0.3em] mt-3">{activeUnitForInventory ? `Initializing Inventory: ${activeUnitForInventory.name}` : 'Enterprise Global Provisioning'}</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowAssetModal(false); setActiveUnitForInventory(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/50"><X size={32}/></button>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden bg-slate-50/20">
                            <div className="p-8 border-b border-slate-100 space-y-6">
                                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-3xl">
                                    <button onClick={() => setResourceAddMode('Catalogue')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Catalogue' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>National Catalogue</button>
                                    <button onClick={() => setResourceAddMode('Manual')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Manual' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Manual Manifest</button>
                                </div>
                                {resourceAddMode === 'Catalogue' && (
                                    <div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={20}/><input type="text" placeholder="Filter National Master Registry..." value={catSearch} onChange={(e)=>setCatSearch(e.target.value)} className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-3xl font-black text-sm outline-none focus:ring-8 focus:ring-[#FBBF24]/5 transition-all shadow-sm" /></div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-4 bg-white">
                                {resourceAddMode === 'Catalogue' ? (
                                    masterCatalogue.filter(i => i.tradeName.toLowerCase().includes(catSearch.toLowerCase())).map(item => {
                                        const isSelected = !!selectedCatItems.find(p => p.item.registrationId === item.registrationId);
                                        return (
                                            <button key={item.registrationId} onClick={() => {
                                                setSelectedCatItems(prev => isSelected ? prev.filter(p => p.item.registrationId !== item.registrationId) : [...prev, { item, quantity: 1, initialValue: 0, lifespanHours: 1000 }]);
                                            }} className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group/cat ${isSelected ? 'bg-emerald-50 border-[#1B4D3E] shadow-xl ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 hover:border-emerald-100 hover:bg-slate-50/50'}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`p-4 rounded-2xl transition-all shadow-md ${isSelected ? 'bg-[#1B4D3E] text-[#FBBF24] rotate-6' : 'bg-slate-50 text-slate-400'}`}>{item.productType === 'Machinery' ? <Tractor size={24}/> : <Package size={24}/>}</div>
                                                    <div><p className="text-sm font-black text-slate-800 leading-none">{item.tradeName}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{item.category} • {item.unit}</p></div>
                                                </div>
                                                {isSelected ? <CheckCircle2 size={28} className="text-[#1B4D3E]"/> : <Plus size={28} className="text-slate-200 group-hover/cat:text-[#1B4D3E] transition-colors"/>}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 space-y-8 animate-fade-in">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset Nomenclature</label><input value={newAsset.name} onChange={(e)=>setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Breeding Herd Delta" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-sm" /></div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Classification</label><select value={newAsset.type} onChange={(e)=>setNewAsset({...newAsset, type: e.target.value as ResourceType})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm outline-none focus:bg-white transition-all appearance-none shadow-sm">
                                                <option value={ResourceType.Machinery}>Mechanisation</option><option value={ResourceType.Equipment}>Equipment</option><option value={ResourceType.Animals}>Livestock</option><option value={ResourceType.Consumable}>Inputs</option>
                                            </select></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quantity Entry</label><input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 1})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm outline-none focus:bg-white transition-all shadow-sm" /></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full md:w-[380px] bg-slate-50/80 border-l border-slate-200 flex flex-col p-10">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 text-[#1B4D3E]/40">Sync Manifest</h4>
                            <div className="flex-1 overflow-y-auto space-y-5 no-scrollbar mb-8">
                                {selectedCatItems.map(sel => (
                                    <div key={sel.item.registrationId} className="bg-white p-6 rounded-3xl border border-[#FBBF24]/20 space-y-5 shadow-sm hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start border-b border-slate-50 pb-4"><p className="text-xs font-black text-[#1B4D3E] truncate leading-none mt-1">{sel.item.tradeName}</p><button onClick={() => setSelectedCatItems(prev => prev.filter(p => p.item.registrationId !== sel.item.registrationId))} className="p-1.5 text-rose-300 hover:text-rose-600 transition-colors"><MinusCircle size={20}/></button></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label><input type="number" value={sel.quantity} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))} className="w-full p-3 bg-slate-50 rounded-2xl text-sm font-black outline-none border border-slate-100 focus:bg-white transition-all shadow-inner" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Value (E)</label><input type="number" value={sel.initialValue} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, initialValue: parseFloat(e.target.value) || 0 } : p))} className="w-full p-3 bg-slate-50 rounded-2xl text-sm font-black outline-none border border-slate-100 focus:bg-white transition-all shadow-inner" /></div>
                                        </div>
                                    </div>
                                ))}
                                {selectedCatItems.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20 space-y-6 border-4 border-dashed border-slate-200 rounded-[3rem]">
                                        <Archive size={64} strokeWidth={1} className="text-[#1B4D3E]"/>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed text-[#1B4D3E]">Select regional vetted inputs to initialize node inventory.</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleSaveAsset} disabled={selectedCatItems.length === 0 && resourceAddMode === 'Catalogue'} className="w-full py-6 bg-[#1B4D3E] text-[#FBBF24] rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30">Commit Node Provisioning</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 shadow-lg"><Zap size={24} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none">Initialize Cycle</h3>
                        </div>
                        <button onClick={() => setShowOpModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cycle Chronology Label</label><input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="e.g. Winter Hybrid Maize Plot A" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-sm" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target GIS Unit</label><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none shadow-sm">
                                <option value="">Select Target...</option>
                                {(selectedEnterprise?.units || []).map((u:any) => <option key={u.id} value={u.name}>{u.name} ({u.area} Ha)</option>)}
                            </select></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label><input type="date" value={newOp.startDateTime} onChange={(e)=>setNewOp({...newOp, startDateTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-sm" /></div>
                        </div>
                        <button onClick={async () => {
                            const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
                            const opObj = { ...newOp, id: `OP-${Date.now()}`, accumulatedCost: 0, progress: 0, status: 'Scheduled', logs: [] };
                            ent.operations = [...(ent.operations || []), opObj];
                            await db.update(Table.Enterprises, selectedEntId!, ent);
                            setShowOpModal(false); await loadAllData(selectedEntId!);
                        }} className="w-full py-6 bg-[#1B4D3E] text-[#FBBF24] rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all">Establish National Cycle Node</button>
                    </div>
                </div>
            </div>
        )}

        {showActivityModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="bg-[#1B4D3E] p-10 text-white flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-black uppercase tracking-tight">Log Cycle Activity</h3>
                        <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Attribution</label><input value={activityForm.activity} onChange={(e)=>setActivityForm({...activityForm, activity: e.target.value})} placeholder={selectedOp.activity} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Resource</label>
                            <select value={activityForm.resourceId} onChange={(e)=>setActivityForm({...activityForm, resourceId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none">
                                <option value="">Select Resource Node...</option>
                                <option disabled className="font-black text-slate-300">--- Workforce ---</option>
                                {orgEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                <option disabled className="font-black text-slate-300">--- Hub Inventory ---</option>
                                {(selectedEnterprise?.resources || []).map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Applied</label><input type="number" value={activityForm.quantity} onChange={(e)=>setActivityForm({...activityForm, quantity: parseFloat(e.target.value) || 1})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usage Duration (Hrs)</label><input type="number" value={activityForm.duration} onChange={(e)=>setActivityForm({...activityForm, duration: parseFloat(e.target.value) || 1})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>
                        <button onClick={handleLogActivity} className="w-full py-6 bg-[#1B4D3E] text-[#FBBF24] rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-3"><Coins size={18}/> Commit Node Attribution</button>
                    </div>
                </div>
            </div>
        )}

        {showHarvestModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="bg-emerald-900 p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl"><Archive size={24} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none">Finalize Batch</h3>
                        </div>
                        <button onClick={() => setShowHarvestModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Registry Label</label><input value={harvestForm.name} onChange={(e)=>setHarvestForm({...harvestForm, name: e.target.value})} placeholder="e.g. Bulk Hybrid Maize Grade A" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-sm" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Verified Yield</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">National Unit</label>
                                <select value={harvestForm.unit} onChange={(e)=>setHarvestForm({...harvestForm, unit: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                    <option value="kg">kg</option><option value="Ton">Ton</option><option value="Crate">Crate</option><option value="Pack">Pack</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-5">
                            <CheckCircle2 size={24} className="text-emerald-600 mt-1 shrink-0"/>
                            <p className="text-[10px] text-emerald-800 leading-relaxed font-bold">Committing this cycle will generate a National Refined Chronology ID and move the batch to the Trade Hub for institutional coordination.</p>
                        </div>
                        <button onClick={handleFinalizeHarvest} className="w-full py-6 bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-800 transition-all">Relocate to National Trade Node</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Production;
