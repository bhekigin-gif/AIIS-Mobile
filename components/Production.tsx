
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
  Landmark, Maximize, GraduationCap, Microscope
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

interface ResourceLog {
    id: string;
    resourceId: string;
    resourceName: string;
    type: ResourceType;
    operationId?: string;
    quantityUsed: number;
    hoursUsed: number;
    attributedCost: number;
    timestamp: string;
    notes: string;
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
  const isExtension = user?.role === UserRole.Extension;

  const [activeTab, setActiveTab] = useState<'ESTABLISHMENT' | 'INVENTORY' | 'OPERATIONS' | 'CALENDAR' | 'REPORTS'>('ESTABLISHMENT');
  const [inventorySubTab, setInventorySubTab] = useState<'ASSETS' | 'LOGS'>('ASSETS');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const [logFilterResourceId, setLogFilterResourceId] = useState<string>('All');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isPlacingModeRef = useRef(false);

  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [allSystemUsers, setAllSystemUsers] = useState<UserProfile[]>([]);
  const [masterCatalogue, setMasterCatalogue] = useState<CatalogueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic labels for Extension work
  const tabLabels = {
      'ESTABLISHMENT': isExtension ? 'Coverage Map' : 'Hub Mapping',
      'INVENTORY': isExtension ? 'Training Kit' : 'Asset Bank',
      'OPERATIONS': isExtension ? 'Outreach Logs' : 'Cycle Logs',
      'CALENDAR': 'Schedule',
      'REPORTS': isExtension ? 'Reach Analytics' : 'Performance'
  };

  const scopeId = (user?.entityType === EntityType.EmployeeMember || user?.actorType === ActorType.Gov) && user?.organizationId 
    ? user.organizationId 
    : (user?.id || 'GUEST');

  const loadAllData = async (newSelectedId?: string) => {
    setIsLoading(true);
    const [meta, users, catalogue, allEnterprises] = await Promise.all([
        Get_System_Metadata(),
        View_All_System_Users(),
        View_Master_Catalogue(),
        db.getAll<any>(Table.Enterprises)
    ]);
    setSystemMetadata(meta);
    setAllSystemUsers(users);
    setMasterCatalogue(catalogue);

    let scoped: any[] = [];

    if (!user) {
        scoped = [];
    } else if (isExtension) {
        scoped = allEnterprises.filter(e => e.ownerId === user.id || e.region === user.region);
    } else if (user.entityType === EntityType.EmployeeMember || (user.actorType === ActorType.Gov && user.organizationId)) {
        scoped = allEnterprises.filter(e => e.ownerId === user.organizationId || e.organizationId === user.organizationId);
    } else if (user.role === UserRole.Government) {
        if (user.region === 'All') scoped = allEnterprises;
        else scoped = allEnterprises.filter(e => e.region === user.region);
    } else {
        scoped = allEnterprises.filter(e => e.ownerId === user.id);
    }

    setEnterprises(scoped);
    
    if (newSelectedId) {
        setSelectedEntId(newSelectedId);
    } else if (scoped.length > 0 && !selectedEntId) {
        setSelectedEntId(scoped[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const [selectedEntId, setSelectedEntId] = useState<string | null>(null);
  const [editingEntId, setEditingEntId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  
  const selectedEnterprise = useMemo(() => 
    enterprises.find(e => e.id === selectedEntId) || null, 
  [enterprises, selectedEntId]);

  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showOpModal, setShowOpModal] = useState(false);
  const [showUnitInventoryModal, setShowUnitInventoryModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  
  const [activeUnitForInventory, setActiveUnitForInventory] = useState<any>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [finishingOp, setFinishingOp] = useState<Operation | null>(null);

  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [isResolvingGIS, setIsResolvingGIS] = useState(false);
  const [isTracing, setIsTracing] = useState(false);

  useEffect(() => {
    isPlacingModeRef.current = isPlacingMode;
  }, [isPlacingMode]);

  const [newEnterprise, setNewEnterprise] = useState({
      name: '', region: Region.Manzini, tinkhundla: '', lat: '', lng: '', address: '', country: 'Eswatini', closestPlace: '', entNumber: ''
  });
  const [newUnit, setNewUnit] = useState({
      id: '', name: '', unitNumber: '', area: '', height: 1.2, costPerHour: '', supervisor: '', path: [] as any[]
  });

  const [newAsset, setNewAsset] = useState<Partial<Resource & { productionDate?: string; expiryDate?: string; initialValue?: number }>>({
      type: isExtension ? ResourceType.Personnel : ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', initialValue: 0, productionDate: new Date().toISOString().split('T')[0], expiryDate: ''
  });

  const [usageLogEntry, setUsageLogEntry] = useState<Partial<ResourceLog>>({
      resourceId: '', quantityUsed: 0, hoursUsed: 0, notes: '', operationId: ''
  });

  const [newOp, setNewOp] = useState<Partial<Operation>>({
      activity: '', type: isExtension ? 'Training' : 'Production', field: '', status: 'Scheduled', progress: 0, assignedResources: [], startDateTime: new Date().toISOString().split('T')[0], endDateTime: '', beneficiariesReached: 0
  });

  const [harvestForm, setHarvestForm] = useState({
      name: '', category: isExtension ? 'Technical Advisory' : 'Vegetables', quantity: 0, unit: isExtension ? 'Session' : 'kg', price: 0, description: '', image: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'harvest' | 'asset') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              if (target === 'harvest') setHarvestForm(prev => ({ ...prev, image: base64String }));
              else if (target === 'asset') setNewAsset(prev => ({ ...prev, image: base64String } as any));
          };
          reader.readAsDataURL(file);
      }
  };

  const calculatedVolume = useMemo(() => {
    const areaHa = parseFloat(newUnit.area) || 0;
    const heightM = newUnit.height || 0;
    return (areaHa * 10000 * heightM).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [newUnit.area, newUnit.height]);

  useEffect(() => {
    if ((window as any).google?.maps) { setGoogleApiLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.onload = () => setGoogleApiLoaded(true);
    document.head.appendChild(script);
  }, []);

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
        mapContainerRef.current.requestFullscreen().catch(err => {
            console.warn(`Fullscreen error: ${err.message}`);
            setIsFullscreen(true);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'ESTABLISHMENT' && googleApiLoaded && mapRef.current) {
        let map = mapInstance;
        if (!map) {
            map = new (window as any).google.maps.Map(mapRef.current, {
                center: selectedEnterprise?.gps || { lat: -26.48, lng: 31.37 },
                zoom: selectedEnterprise ? 18 : 11,
                mapTypeId: 'hybrid',
                disableDefaultUI: true,
                fullscreenControl: true, 
                gestureHandling: 'greedy',
            });
            setMapInstance(map);

            map.addListener('click', async (e: any) => {
                if (!isPlacingModeRef.current) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setIsResolvingGIS(true);
                const geocoder = new (window as any).google.maps.Geocoder();
                geocoder.geocode({ location: e.latLng }, (results: any, status: any) => {
                    let address = 'GPS Located';
                    let region = Region.Manzini;
                    let tinkhundla = '';
                    let country = 'Eswatini';
                    let closestPlace = '';

                    if (status === 'OK' && results[0]) {
                        address = results[0].formatted_address;
                        const poi = results.find((r: any) => r.types.includes('point_of_interest') || r.types.includes('establishment'));
                        if (poi) closestPlace = poi.name || poi.formatted_address.split(',')[0];
                        results[0].address_components.forEach((c: any) => {
                            if (c.types.includes('country')) country = c.long_name;
                            if (c.types.includes('administrative_area_level_1')) {
                                if (c.long_name.includes('Hhohho')) region = Region.Hhohho;
                                else if (c.long_name.includes('Manzini')) region = Region.Manzini;
                                else if (c.long_name.includes('Shiselweni')) region = Region.Shiselweni;
                                else if (c.long_name.includes('Lubombo')) region = Region.Lubombo;
                            }
                            if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) tinkhundla = c.long_name;
                        });
                    }
                    const shortUserId = scopeId.toString().slice(-4).toUpperCase();
                    const timestamp = Date.now().toString().slice(-4);
                    const entNumber = isExtension ? `SVC-${shortUserId}-${timestamp}` : `ENT-${shortUserId}-${timestamp}`;
                    setNewEnterprise({ name: '', region, tinkhundla, lat: lat.toFixed(6), lng: lng.toFixed(6), address, country, closestPlace, entNumber });
                    setIsResolvingGIS(false); setIsPlacingMode(false); setShowEnterpriseModal(true);
                });
            });

            const dm = new (window as any).google.maps.drawing.DrawingManager({
                drawingControl: false,
                polygonOptions: { fillColor: isExtension ? '#1e3a8a' : '#1B4D3E', fillOpacity: 0.35, strokeWeight: 4, strokeColor: '#FBBF24', zIndex: 2, clickable: true }
            });
            dm.setMap(map);
            setDrawingManager(dm);

            (window as any).google.maps.event.addListener(dm, 'polygoncomplete', (polygon: any) => {
                const path = polygon.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
                const areaSqm = (window as any).google.maps.geometry.spherical.computeArea(polygon.getPath());
                dm.setDrawingMode(null); setIsTracing(false);
                setNewUnit({ id: '', name: '', unitNumber: isExtension ? `NODE-${Date.now().toString().slice(-4)}` : `UNIT-${Date.now().toString().slice(-4)}`, area: (areaSqm / 10000).toFixed(2), height: 1.2, costPerHour: '', supervisor: '', path });
                setShowUnitModal(true); polygon.setMap(null); 
            });
        }
        markersRef.current.forEach(m => m.setMap(null));
        polygonsRef.current.forEach(p => p.setMap(null));
        markersRef.current = []; polygonsRef.current = [];
        enterprises.forEach(ent => {
            const isSelected = ent.id === selectedEntId;
            const isExtensionNode = ent.entNumber?.startsWith('SVC');
            const marker = new (window as any).google.maps.Marker({
                position: ent.gps, map, title: ent.name,
                animation: isSelected ? (window as any).google.maps.Animation.DROP : null,
                label: { text: ent.name, color: isSelected ? "#FBBF24" : "#FFFFFF", fontSize: "11px", fontWeight: "900", className: "marker-label-shadow" },
                icon: { url: isExtensionNode ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : isSelected ? 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new (window as any).google.maps.Size(46, 46), labelOrigin: new (window as any).google.maps.Point(23, -14) }
            });
            marker.addListener('click', () => { 
              setSelectedEntId(ent.id); 
              setIsTracing(true);
              if (drawingManager) {
                  drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON);
              }
            });
            markersRef.current.push(marker);
            ent.units?.forEach((unit: any) => {
                const poly = new (window as any).google.maps.Polygon({ paths: unit.path, strokeColor: isExtensionNode ? '#3b82f6' : '#FBBF24', strokeWeight: 4, fillColor: isExtensionNode ? '#1e3a8a' : '#1B4D3E', fillOpacity: 0.4, map, zIndex: 1 });
                poly.addListener('click', () => { setSelectedEntId(ent.id); setEditingUnitId(unit.id); setNewUnit({ ...unit, height: unit.height || 1.2 }); setShowUnitModal(true); });
                polygonsRef.current.push(poly);
            });
        });
        if (selectedEnterprise && !isPlacingMode && !isTracing && !showEnterpriseModal && !isLoading) {
            map.panTo(selectedEnterprise.gps); if (map.getZoom() < 16) map.setZoom(17);
        }
    }
  }, [activeTab, googleApiLoaded, selectedEntId, enterprises, mapInstance, isTracing, drawingManager, selectedEnterprise, showEnterpriseModal, isLoading]);

  const handleAddEnterprise = async () => {
      if (!newEnterprise.name || !newEnterprise.lat) return;
      const entData = {
          ...newEnterprise,
          gps: { lat: parseFloat(newEnterprise.lat), lng: parseFloat(newEnterprise.lng) },
          ownerId: user?.id, 
          organizationId: user?.organizationId || '',
          units: editingEntId ? selectedEnterprise?.units : [], resources: editingEntId ? selectedEnterprise?.resources : [], processes: editingEntId ? selectedEnterprise?.processes : [], operations: editingEntId ? selectedEnterprise?.operations : [], usageLogs: editingEntId ? selectedEnterprise?.usageLogs : []
      };
      let finalId = editingEntId;
      if (editingEntId) await db.update<any>(Table.Enterprises, editingEntId, entData);
      else { const inserted = await db.insert<any>(Table.Enterprises, entData); finalId = inserted.id; }
      setShowEnterpriseModal(false); setEditingEntId(null); await loadAllData(finalId);
  };

  const handleSaveUnit = async () => {
    if (!selectedEntId || !newUnit.name) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
    const unitObj = { ...newUnit, id: editingUnitId || `UNT-${Date.now()}`, resources: editingUnitId ? (ent.units.find((u:any) => u.id === editingUnitId)?.resources || []) : [] };
    if (editingUnitId) ent.units = ent.units.map((u: any) => u.id === editingUnitId ? unitObj : u);
    else ent.units = [...(ent.units || []), unitObj];
    await db.update<any>(Table.Enterprises, selectedEntId, { units: ent.units });
    setShowUnitModal(false); setEditingUnitId(null); await loadAllData(selectedEntId);
  };

  const handleSaveAsset = async () => {
      const targetUnitId = activeUnitForInventory?.id; const targetEntId = selectedEntId;
      if (!targetEntId || !newAsset.name) return;
      const ent = await db.getById<any>(Table.Enterprises, targetEntId); if (!ent) return;
      let calculatedUnitCost = newAsset.unitCost || 0;
      if (newAsset.productionDate && newAsset.expiryDate && newAsset.initialValue) {
          const hours = (new Date(newAsset.expiryDate).getTime() - new Date(newAsset.productionDate).getTime()) / (1000 * 60 * 60);
          if (hours > 0) calculatedUnitCost = newAsset.initialValue / hours;
      }
      const assetObj = { ...newAsset, id: `AST-${Date.now()}`, totalUsageHours: 0, quantity: newAsset.quantity || 1, assignedUnitId: targetUnitId || '', unitCost: calculatedUnitCost, unitNumber: newAsset.unitNumber || '' } as Resource;
      ent.resources = [...(ent.resources || []), assetObj];
      if (targetUnitId) ent.units = ent.units.map((u: any) => u.id === targetUnitId ? { ...u, resources: [...(u.resources || []), assetObj] } : u);
      await db.update<any>(Table.Enterprises, targetEntId, { resources: ent.resources, units: ent.units });
      setShowAssetModal(false); 
      setNewAsset({ type: isExtension ? ResourceType.Personnel : ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', initialValue: 0, productionDate: new Date().toISOString().split('T')[0], expiryDate: '' });
      await loadAllData(targetEntId);
  };

  const handleSaveOp = async () => {
      if (!selectedEntId || !newOp.activity) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
      const opObj = { ...newOp, id: `OP-${Date.now()}`, accumulatedCost: 0, progress: 0, status: 'Scheduled' };
      ent.operations = [...(ent.operations || []), opObj];
      await db.update<any>(Table.Enterprises, selectedEntId, { operations: ent.operations });
      setShowOpModal(false); await loadAllData(selectedEntId);
  };

  const handleFinalizeHarvest = async () => {
    if (!selectedEntId || !finishingOp || !harvestForm.name) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
    const refinedId = isExtension ? `SVC-${user?.id?.slice(0,4)}-${finishingOp.id.slice(-4)}` : `SZ-${scopeId.toString().slice(0,4)}-${selectedEntId.slice(-4)}-${finishingOp.id.slice(-4)}`;
    const newProduct: SalesProduct = {
        id: refinedId, name: harvestForm.name, category: harvestForm.category, price: harvestForm.price, quantity: harvestForm.quantity, unit: harvestForm.unit, description: harvestForm.description, dateListed: new Date().toISOString().split('T', 1)[0], status: 'Active', sellerId: user?.id as string, sellerName: isExtension ? user?.name : ent.name, region: ent.region, sourceUnit: finishingOp.field, operationId: finishingOp.id, costPrice: finishingOp.accumulatedCost || 0, image: harvestForm.image || PLACE_HOLDER_IMAGE, isService: isExtension
    };
    ent.operations = ent.operations.map((op: Operation) => op.id === finishingOp.id ? { ...op, status: 'Completed', progress: 100, endDateTime: new Date().toISOString(), producedId: refinedId } : op);
    await db.update<any>(Table.Enterprises, selectedEntId, { operations: ent.operations });
    await addProductToRegistry(newProduct);
    setProducts(prev => [newProduct, ...prev]);
    setShowHarvestModal(false); setFinishingOp(null); await loadAllData(selectedEntId);
  };

  const renderInventory = () => (
      <div className="space-y-4 animate-fade-in pb-20">
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-xl"><Package size={20}/></div>
                  <div className="flex gap-2">
                      <button onClick={() => setInventorySubTab('ASSETS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ASSETS' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>{isExtension ? 'Support Kit' : 'Assets'}</button>
                      <button onClick={() => setInventorySubTab('LOGS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'LOGS' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>Utilization</button>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setShowUsageModal(true)} disabled={!selectedEntId || selectedEnterprise?.resources?.length === 0} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30 hover:bg-emerald-700 transition-colors"><Calculator size={14}/> Log Intake</button>
                  <button onClick={() => { setActiveUnitForInventory(null); setShowAssetModal(true); }} disabled={!selectedEntId} className="px-5 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30 hover:bg-[#143d31] transition-colors"><Plus size={14}/> {isExtension ? 'Add Resource' : 'Add Asset'}</button>
              </div>
          </div>
          {inventorySubTab === 'ASSETS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedEnterprise?.resources?.map((res: Resource) => (
                      <div key={res.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-56">
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <div className={`p-2.5 rounded-xl ${res.type === ResourceType.Personnel ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                                      {res.type === ResourceType.Machinery && <Tractor size={18}/>}
                                      {res.type === ResourceType.Equipment && <Wrench size={18}/>}
                                      {res.type === ResourceType.Personnel && <GraduationCap size={18}/>}
                                      {res.type === ResourceType.Consumable && <Droplets size={18}/>}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${res.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{res.status}</span>
                              </div>
                              <h4 className="font-black text-slate-800 text-sm truncate">{res.name}</h4>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">{res.category}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50">
                              <div><p className="text-[8px] font-black text-slate-300 uppercase">Util</p><p className="text-[11px] font-black text-slate-700">{res.type === ResourceType.Consumable ? `${res.quantity}` : `${res.totalUsageHours || 0}H`}</p></div>
                              <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Usage Rate</p><p className="text-[11px] font-black text-[#1B4D3E]">E {res.unitCost.toFixed(2)}</p></div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm h-[calc(100vh-320px)] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-[#1B4D3E] text-white uppercase text-[8px] font-black tracking-widest sticky top-0">
                          <tr><th className="p-4">Date</th><th className="p-4">Node</th><th className="p-4 text-center">Amount</th><th className="p-4 text-right">Cost</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                          {selectedEnterprise?.usageLogs?.map((log: ResourceLog) => (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 text-[10px] font-black text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</td>
                                  <td className="p-4 text-slate-700 font-bold">{log.resourceName}</td>
                                  <td className="p-4 text-center text-slate-600">{log.type === ResourceType.Consumable ? `${log.quantityUsed}` : `${log.hoursUsed}h`}</td>
                                  <td className="p-4 text-right font-black text-emerald-700">E {log.attributedCost.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
  );

  const renderCalendar = () => {
    const sortedOps = [...(selectedEnterprise?.operations || [])].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm h-[calc(100vh-280px)] overflow-y-auto no-scrollbar animate-fade-in">
            <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-widest mb-8 flex items-center gap-3">
                <CalendarDays size={20}/> Agenda View
            </h3>
            <div className="space-y-6 relative border-l-2 border-slate-100 pl-8 ml-4">
                {sortedOps.length > 0 ? sortedOps.map((op, idx) => (
                    <div key={op.id} className="relative group">
                        <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-[#1B4D3E] shadow-sm group-hover:scale-125 transition-transform"></div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">{new Date(op.startDateTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                    <h4 className="text-sm font-black text-slate-800 mt-1">{op.activity}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase flex items-center gap-1"><MapPin size={10}/> {op.field}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${op.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{op.status}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4"><CalendarIcon size={32}/></div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No nodes in chronological sequence</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderReports = () => {
    const ops = selectedEnterprise?.operations || [];
    const totalBeneficiaries = ops.reduce((s: number, o: any) => s + (o.beneficiariesReached || 0), 0);
    const totalCost = ops.reduce((s: number, o: any) => s + (o.accumulatedCost || 0), 0);
    
    // Aggregates for Extension
    const reachData = [
        { name: 'Jan', value: Math.floor(totalBeneficiaries * 0.1) },
        { name: 'Feb', value: Math.floor(totalBeneficiaries * 0.3) },
        { name: 'Mar', value: Math.floor(totalBeneficiaries * 0.6) }
    ];

    const typeDistribution = [
        { name: 'Training', value: ops.filter((o:any)=>o.type==='Training').length, color: '#1B4D3E' },
        { name: 'Farm Visits', value: ops.filter((o:any)=>o.type==='FarmVisit').length, color: '#FBBF24' },
        { name: 'Advisory', value: ops.filter((o:any)=>o.type==='Advisory').length, color: '#3b82f6' }
    ].filter(v => v.value > 0);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Impact</p>
                    <div className="mt-4 flex items-end justify-between">
                        <h3 className="text-3xl font-black text-[#1B4D3E]">{isExtension ? totalBeneficiaries : ops.length} <span className="text-xs font-bold text-slate-300">{isExtension ? 'People' : 'Batches'}</span></h3>
                        <div className="flex items-center text-emerald-500 text-[10px] font-black bg-emerald-50 px-2 py-1 rounded-lg gap-1"><ArrowUpRight size={12}/> +12%</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Utilization</p>
                    <div className="mt-4 flex items-end justify-between">
                        <h3 className="text-3xl font-black text-slate-800">E {totalCost.toLocaleString()}</h3>
                        <div className="flex items-center text-amber-500 text-[10px] font-black bg-amber-50 px-2 py-1 rounded-lg gap-1"><History size={12}/> Vetted</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Efficiency</p>
                    <div className="mt-4 flex items-end justify-between">
                        <h3 className="text-3xl font-black text-indigo-700">94%</h3>
                        <div className="flex items-center text-indigo-500 text-[10px] font-black bg-indigo-50 px-2 py-1 rounded-lg gap-1"><TrendingUp size={12}/> High</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{isExtension ? 'Outreach Growth' : 'Production Intensity'}</h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reachData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="value" fill="#1B4D3E" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Service Distribution</h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                    {typeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in h-full overflow-hidden flex flex-col">
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden shrink-0">
            <div className="flex items-center gap-6 p-3 px-6 overflow-x-auto no-scrollbar">
                {(['ESTABLISHMENT', 'INVENTORY', 'OPERATIONS', 'CALENDAR', 'REPORTS'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#1B4D3E]' : 'text-slate-400'}`}>
                        {tab === 'ESTABLISHMENT' && <MapIcon size={14}/>}
                        {tab === 'INVENTORY' && <GraduationCap size={14}/>}
                        {tab === 'OPERATIONS' && <Zap size={14}/>}
                        {tab === 'CALENDAR' && <CalendarIcon size={14}/>}
                        {tab === 'REPORTS' && <BarChart3 size={14}/>}
                        {tabLabels[tab]}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#FBBF24] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
            {activeTab === 'ESTABLISHMENT' && (
                <div className="space-y-4 animate-fade-in flex flex-col h-full overflow-hidden pb-10">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
                        <div className="flex items-center gap-4"><div className="p-2 bg-blue-50 rounded-xl text-blue-600"><MapPin size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{isExtension ? 'Regional Jurisdiction' : 'Spatial Infrastructure'}</h3></div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsPlacingMode(!isPlacingMode)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isPlacingMode ? 'bg-orange-500 text-white' : 'bg-[#1B4D3E] text-white'}`}>{isPlacingMode ? 'Cancel' : (isExtension ? 'Add Hub' : 'New Hub')}</button>
                            <button disabled={!selectedEntId} onClick={() => { setIsTracing(true); if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isTracing ? 'bg-rose-50 text-white' : 'bg-[#FBBF24] text-[#1B4D3E] disabled:opacity-30'}`}>{isTracing ? 'Cancel' : 'Trace Unit'}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
                        <div ref={mapContainerRef} className={`lg:col-span-3 relative bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden h-[400px] lg:h-full group/map ${isFullscreen ? 'fixed inset-0 z-[200] !m-0 !rounded-none' : ''}`}>
                            {(isLoading || isResolvingGIS) && (<div className="absolute inset-0 z-40 bg-slate-100/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#1B4D3E]" size={32} /></div>)}
                            <div ref={mapRef} className="w-full h-full z-10 bg-slate-200" />
                            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                <button onClick={toggleFullscreen} className="p-3 bg-white/95 text-[#1B4D3E] rounded-xl shadow-xl hover:bg-emerald-50 transition-all border border-slate-200"><Maximize size={20}/></button>
                            </div>
                        </div>
                        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12}/> Regional Nodes</h4>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {enterprises.map(ent => (
                                    <button key={ent.id} onClick={() => setSelectedEntId(ent.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}><h5 className="font-black text-xs truncate">{ent.name}</h5><p className={`text-[8px] font-black uppercase mt-0.5 ${selectedEntId === ent.id ? 'text-[#FBBF24]' : 'text-slate-400'}`}>{ent.region}</p></button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'INVENTORY' && renderInventory()}
            
            {activeTab === 'OPERATIONS' && (
                <div className="space-y-4 animate-fade-in pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-widest">Outreach Reach</h3>
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-emerald-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-emerald-700"><Users size={16}/><span className="text-[9px] font-black uppercase">Beneficiaries</span></div><span className="text-sm font-black text-emerald-800">{selectedEnterprise?.operations?.reduce((s:number,o:any)=>s+(o.beneficiariesReached||0),0)||0}</span></div>
                                    <div className="p-3.5 bg-indigo-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-indigo-700"><Clock size={16}/><span className="text-[9px] font-black uppercase">Service Hours</span></div><span className="text-sm font-black text-indigo-800">{selectedEnterprise?.operations?.length * 4 || 0}</span></div>
                                </div>
                                <button onClick={() => setShowOpModal(true)} disabled={!selectedEntId} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3"><Zap size={14} className="text-[#FBBF24]"/> Log Field Outreach</button>
                            </div>
                        </div>
                        <div className="lg:col-span-3 space-y-3 h-[calc(100vh-320px)] overflow-y-auto no-scrollbar pr-1">
                            {selectedEnterprise?.operations?.map((op: Operation) => (
                                <div key={op.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                                    <div className={`p-3 rounded-xl transition-colors ${op.type === 'Training' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}><Microscope size={22}/></div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-black text-slate-800 text-sm truncate">{op.activity}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]"><MapPin size={8} className="inline mr-1"/>{op.field}</p>
                                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${op.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{op.status}</span>
                                            {isExtension && <span className="text-[8px] font-black text-blue-500 uppercase">{op.beneficiariesReached || 0} People</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setUsageLogEntry({...usageLogEntry, operationId: op.id}); setShowUsageModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Hammer size={16}/></button>
                                        {isExtension && op.status !== 'Completed' && (
                                            <button onClick={() => { setFinishingOp(op); setHarvestForm(prev => ({ ...prev, name: op.activity })); setShowHarvestModal(true); }} className="p-2 text-emerald-500 hover:text-emerald-700 transition-all"><GraduationCap size={16}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'CALENDAR' && renderCalendar()}
            {activeTab === 'REPORTS' && renderReports()}
        </div>

        {showOpModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Microscope size={22} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black">{isExtension ? 'Log Professional Service' : 'Initialize Task'}</h3>
                        </div>
                        <button onClick={() => setShowOpModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder={isExtension ? "Service Goal (e.g. Pest Management Training)..." : "Activity Description..."} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                <option value="">Select Target...</option>
                                {selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                            <select value={newOp.type} onChange={(e:any)=>setNewOp({...newOp, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                {isExtension ? (
                                    <>
                                        <option value="Training">Training Session</option>
                                        <option value="FarmVisit">Farm Visit</option>
                                        <option value="Advisory">Direct Advisory</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Production">Production</option>
                                        <option value="Harvest">Harvest</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label>
                                <input type="date" value={newOp.startDateTime} onChange={(e)=>setNewOp({...newOp, startDateTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                        </div>
                        {isExtension && <input type="number" value={newOp.beneficiariesReached} onChange={(e)=>setNewOp({...newOp, beneficiariesReached: parseInt(e.target.value)})} placeholder="Estimated Reach (Farmers)" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />}
                        <button onClick={handleSaveOp} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-[#143d31]">Commit Log Node</button>
                    </div>
                </div>
            </div>
        )}

        {showHarvestModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><CheckCircle2 size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{isExtension ? 'Verify Service Output' : 'Commodity Lifecycle'}</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">{isExtension ? 'Published Knowledge Node' : 'Institutional Harvest Registry'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHarvestModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isExtension ? 'Service Title' : 'Trade Label'}</label><input value={harvestForm.name} onChange={(e)=>setHarvestForm({...harvestForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isExtension ? 'Impact Count' : 'Yield Qty'}</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee (E)</label><input type="number" value={harvestForm.price} onChange={(e)=>setHarvestForm({...harvestForm, price: parseFloat(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcome Summary</label><textarea value={harvestForm.description} onChange={(e)=>setHarvestForm({...harvestForm, description: e.target.value})} className="w-full h-24 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none resize-none" /></div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Evidence</label>
                                <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                    {harvestForm.image ? (
                                        <img src={harvestForm.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-4"><Camera size={24} className="text-slate-300"/></div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Visual Verification</p>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'harvest')} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleFinalizeHarvest} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
                            <Save size={18}/> Publish Knowledge Package
                        </button>
                    </div>
                </div>
            </div>
        )}

        <style>{`
            .marker-label-shadow { text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5); padding: 4px 8px; background: rgba(27, 77, 62, 0.4); border-radius: 4px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
};

export default Production;
