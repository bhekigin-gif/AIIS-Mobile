import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Tractor, Users, MapPin, MapPinOff, Plus, X, PenTool, ChevronRight, 
  Building2, Activity, CheckCircle2, Info, Map as MapIcon, 
  Loader2, ArrowRight, Save, Target, TrendingUp, Package, 
  Sprout, Factory, ClipboardList, Zap, Calendar, Check,
  Search, CheckSquare, Edit3, Trash2, Crosshair,
  Maximize2, ZoomIn, ZoomOut, MousePointer2, AlertCircle,
  ShieldCheck, Layers, Ruler, Pencil, Trash, Hammer, 
  Droplets, UserPlus, Clock, Wallet, BarChart3, ChevronDown, 
  Settings2, MapPinPlus, Layers2, Navigation, BoxSelect,
  HardHat, Gauge, History, Timer, CreditCard, LayoutDashboard,
  ClipboardType, Filter, Calculator, UserCheck, Wrench, SearchCode,
  Globe, Sparkles, PackagePlus, Briefcase, Fingerprint
} from 'lucide-react';
import { 
  Operation, SalesProduct, MarketOrder, UserProfile, Region, 
  ResourceType, CatalogueItem, ProductionProcess, Resource, 
  TINKHUNDLA, UserRole 
} from '../types';
import { 
  View_Master_Catalogue, Get_System_Metadata, addProductToRegistry, View_All_System_Users 
} from '../services/adminDataService';
import { db, Table } from '../services/databaseService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";

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
  const [activeTab, setActiveTab] = useState<'ESTABLISHMENT' | 'INVENTORY' | 'OPERATIONS' | 'CALENDAR'>('ESTABLISHMENT');
  const [inventorySubTab, setInventorySubTab] = useState<'ASSETS' | 'LOGS'>('ASSETS');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  
  const isPlacingModeRef = useRef(false);

  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [allSystemUsers, setAllSystemUsers] = useState<UserProfile[]>([]);
  const [masterCatalogue, setMasterCatalogue] = useState<CatalogueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const scopeId = user?.organizationId || user?.id || 'GUEST';

  const loadAllData = async (newSelectedId?: string) => {
    setIsLoading(true);
    const [meta, users, catalogue] = await Promise.all([
        Get_System_Metadata(),
        View_All_System_Users(),
        View_Master_Catalogue()
    ]);
    setSystemMetadata(meta);
    setAllSystemUsers(users);
    setMasterCatalogue(catalogue);

    const allEnterprises = await db.getAll<any>(Table.Enterprises);
    const scoped = allEnterprises.filter(e => e.ownerId === scopeId);
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
  }, [scopeId]);

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
  const [showUnitResourceModal, setShowUnitResourceModal] = useState(false);
  
  const [activeUnitForResources, setActiveUnitForResources] = useState<any>(null);

  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [isResolvingGIS, setIsResolvingGIS] = useState(false);
  const [isTracing, setIsTracing] = useState(false);

  // Filters
  const [logFilterResourceId, setLogFilterResourceId] = useState<string>('All');

  useEffect(() => {
    isPlacingModeRef.current = isPlacingMode;
  }, [isPlacingMode]);

  const [newEnterprise, setNewEnterprise] = useState({
      name: '', region: Region.Manzini, tinkhundla: '', lat: '', lng: '', address: ''
  });
  const [newUnit, setNewUnit] = useState({
      id: '', name: '', unitNumber: '', area: '', height: 1.2, costPerHour: '', supervisor: '', path: [] as any[]
  });

  const [newAsset, setNewAsset] = useState<Partial<Resource & { lifespanHours?: number, specificSerial?: string }>>({
      type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', lifespanHours: 5000, specificSerial: ''
  });

  const [usageLogEntry, setUsageLogEntry] = useState<Partial<ResourceLog>>({
      resourceId: '', quantityUsed: 0, hoursUsed: 0, notes: ''
  });

  const [newOp, setNewOp] = useState<Partial<Operation>>({
      activity: '', type: 'Production', field: '', status: 'Scheduled', progress: 0, assignedResources: []
  });

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

  // Map Initialization & Persistence logic
  useEffect(() => {
    if (activeTab === 'ESTABLISHMENT' && googleApiLoaded && mapRef.current) {
        let map = mapInstance;
        if (!map) {
            map = new (window as any).google.maps.Map(mapRef.current, {
                center: selectedEnterprise?.gps || { lat: -26.48, lng: 31.37 },
                zoom: selectedEnterprise ? 18 : 11,
                mapTypeId: 'hybrid',
                disableDefaultUI: true,
                gestureHandling: 'greedy'
            });
            setMapInstance(map);

            map.addListener('click', async (e: any) => {
                if (!isPlacingModeRef.current) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setIsResolvingGIS(true);
                
                // FAST GEOLOCATION RESOLUTION: Use Geocoder directly instead of AI
                const geocoder = new (window as any).google.maps.Geocoder();
                geocoder.geocode({ location: e.latLng }, (results: any, status: any) => {
                    let address = 'GPS Located';
                    let region = Region.Manzini;
                    let tinkhundla = '';
                    
                    if (status === 'OK' && results[0]) {
                        address = results[0].formatted_address;
                        results[0].address_components.forEach((c: any) => {
                            if (c.types.includes('administrative_area_level_1')) {
                                const rName = c.long_name;
                                if (rName.includes('Hhohho')) region = Region.Hhohho;
                                else if (rName.includes('Manzini')) region = Region.Manzini;
                                else if (rName.includes('Shiselweni')) region = Region.Shiselweni;
                                else if (rName.includes('Lubombo')) region = Region.Lubombo;
                            }
                            if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) {
                                tinkhundla = c.long_name;
                            }
                        });
                    }
                    
                    setNewEnterprise({
                        name: '', 
                        region: region, 
                        tinkhundla: tinkhundla, 
                        lat: lat.toFixed(6), 
                        lng: lng.toFixed(6), 
                        address: address
                    });
                    
                    setIsResolvingGIS(false);
                    setIsPlacingMode(false);
                    setShowEnterpriseModal(true);
                });
            });

            const dm = new (window as any).google.maps.drawing.DrawingManager({
                drawingControl: false,
                polygonOptions: { fillColor: '#1B4D3E', fillOpacity: 0.35, strokeWeight: 4, strokeColor: '#FBBF24', zIndex: 2, clickable: true }
            });
            dm.setMap(map);
            setDrawingManager(dm);

            (window as any).google.maps.event.addListener(dm, 'polygoncomplete', (polygon: any) => {
                const path = polygon.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
                const areaSqm = (window as any).google.maps.geometry.spherical.computeArea(polygon.getPath());
                dm.setDrawingMode(null);
                setIsTracing(false);
                setNewUnit({
                    id: '', name: '', unitNumber: `UNIT-${Date.now().toString().slice(-4)}`,
                    area: (areaSqm / 10000).toFixed(2), height: 1.2, costPerHour: '', supervisor: '', path
                });
                setShowUnitModal(true);
                polygon.setMap(null); 
            });
        }

        markersRef.current.forEach(m => m.setMap(null));
        polygonsRef.current.forEach(p => p.setMap(null));
        markersRef.current = [];
        polygonsRef.current = [];

        enterprises.forEach(ent => {
            const isSelected = ent.id === selectedEntId;
            const marker = new (window as any).google.maps.Marker({
                position: ent.gps, map, title: ent.name,
                animation: isSelected ? (window as any).google.maps.Animation.DROP : null,
                label: { text: ent.name, color: isSelected ? "#FBBF24" : "#FFFFFF", fontSize: "11px", fontWeight: "900", className: "marker-label-shadow" },
                icon: { url: isSelected ? 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new (window as any).google.maps.Size(46, 46), labelOrigin: new (window as any).google.maps.Point(23, -14) }
            });

            marker.addListener('click', () => {
                setSelectedEntId(ent.id);
                setIsTracing(true);
                if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON);
            });
            markersRef.current.push(marker);

            ent.units?.forEach((unit: any) => {
                const poly = new (window as any).google.maps.Polygon({ paths: unit.path, strokeColor: '#FBBF24', strokeWeight: 4, fillColor: '#1B4D3E', fillOpacity: 0.4, map, zIndex: 1 });
                poly.addListener('click', () => { setSelectedEntId(ent.id); setEditingUnitId(unit.id); setNewUnit({ ...unit, height: unit.height || 1.2 }); setShowUnitModal(true); });
                polygonsRef.current.push(poly);
            });
        });

        if (selectedEnterprise && !isPlacingMode && !isTracing && !showEnterpriseModal && !isLoading) {
            map.panTo(selectedEnterprise.gps);
            if (map.getZoom() < 16) map.setZoom(17);
        }
    }
  }, [activeTab, googleApiLoaded, selectedEntId, enterprises, mapInstance, isTracing, drawingManager, selectedEnterprise, showEnterpriseModal, isLoading]);

  const handleZoomIn = () => mapInstance?.setZoom(mapInstance.getZoom() + 1);
  const handleZoomOut = () => mapInstance?.setZoom(mapInstance.getZoom() - 1);
  const handleFitAll = () => {
    if (mapInstance && (markersRef.current.length > 0 || polygonsRef.current.length > 0)) {
        const bounds = new (window as any).google.maps.LatLngBounds();
        markersRef.current.forEach(m => bounds.extend(m.getPosition()));
        polygonsRef.current.forEach(p => p.getPath().forEach((pt: any) => bounds.extend(pt)));
        mapInstance.fitBounds(bounds);
    }
  };

  const handleAddEnterprise = async () => {
      if (!newEnterprise.name || !newEnterprise.lat) return;
      const entData = {
          name: newEnterprise.name, region: newEnterprise.region,
          inkhundla: newEnterprise.tinkhundla, address: newEnterprise.address,
          gps: { lat: parseFloat(newEnterprise.lat), lng: parseFloat(newEnterprise.lng) },
          ownerId: scopeId, 
          units: editingEntId ? selectedEnterprise?.units : [], 
          resources: editingEntId ? selectedEnterprise?.resources : [], 
          processes: editingEntId ? selectedEnterprise?.processes : [], 
          operations: editingEntId ? selectedEnterprise?.operations : [],
          usageLogs: editingEntId ? selectedEnterprise?.usageLogs : []
      };
      let finalId = editingEntId;
      if (editingEntId) await db.update<any>(Table.Enterprises, editingEntId, entData);
      else { const inserted = await db.insert<any>(Table.Enterprises, entData); finalId = inserted.id; }
      setShowEnterpriseModal(false); setEditingEntId(null); await loadAllData(finalId);
  };

  const handleSaveUnit = async () => {
    if (!selectedEntId || !newUnit.name) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
    if (!ent) return;
    const unitObj = { ...newUnit, id: editingUnitId || `UNT-${Date.now()}`, resources: editingUnitId ? (ent.units.find((u:any) => u.id === editingUnitId)?.resources || []) : [] };
    if (editingUnitId) ent.units = ent.units.map((u: any) => u.id === editingUnitId ? unitObj : u);
    else ent.units = [...(ent.units || []), unitObj];
    await db.update<any>(Table.Enterprises, selectedEntId, { units: ent.units });
    setShowUnitModal(false); setEditingUnitId(null); await loadAllData(selectedEntId);
  };

  const handleSaveAsset = async () => {
      const targetUnitId = activeUnitForResources?.id;
      const targetEntId = selectedEntId;
      if (!targetEntId || !newAsset.name) return;
      
      const ent = await db.getById<any>(Table.Enterprises, targetEntId);
      if (!ent) return;
      
      const assetObj = { 
          ...newAsset, 
          id: `AST-${Date.now()}`,
          totalUsageHours: 0,
          quantity: newAsset.quantity || 1,
          assignedUnitId: targetUnitId || '',
          unitNumber: newAsset.type === ResourceType.Machinery || newAsset.type === ResourceType.Equipment
            ? `${newAsset.unitNumber}${newAsset.specificSerial ? ' / ' + newAsset.specificSerial : ''}`
            : newAsset.unitNumber
      } as Resource;

      ent.resources = [...(ent.resources || []), assetObj];
      
      if (targetUnitId) {
          ent.units = ent.units.map((u: any) => {
              if (u.id === targetUnitId) {
                  return { ...u, resources: [...(u.resources || []), assetObj] };
              }
              return u;
          });
      }

      await db.update<any>(Table.Enterprises, targetEntId, { resources: ent.resources, units: ent.units });
      setShowAssetModal(false); 
      setNewAsset({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', lifespanHours: 5000, specificSerial: '' });
      await loadAllData(targetEntId);
  };

  const handleSaveUsage = async () => {
      if (!selectedEntId || !usageLogEntry.resourceId) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      if (!ent) return;

      const resource = ent.resources.find((r: Resource) => r.id === usageLogEntry.resourceId);
      if (!resource) return;

      let cost = 0;
      if (resource.type === ResourceType.Consumable) {
          cost = (usageLogEntry.quantityUsed || 0) * resource.unitCost;
      } else {
          cost = (usageLogEntry.hoursUsed || 0) * resource.unitCost;
      }

      const logObj: ResourceLog = {
          id: `LOG-${Date.now()}`,
          resourceId: resource.id,
          resourceName: resource.name,
          type: resource.type,
          quantityUsed: usageLogEntry.quantityUsed || 0,
          hoursUsed: usageLogEntry.hoursUsed || 0,
          attributedCost: cost,
          timestamp: new Date().toISOString(),
          notes: usageLogEntry.notes || ''
      };

      ent.resources = ent.resources.map((r: Resource) => {
          if (r.id === resource.id) {
              return {
                  ...r,
                  quantity: r.type === ResourceType.Consumable ? r.quantity - (usageLogEntry.quantityUsed || 0) : r.quantity,
                  totalUsageHours: (r.totalUsageHours || 0) + (usageLogEntry.hoursUsed || 0)
              };
          }
          return r;
      });

      ent.usageLogs = [...(ent.usageLogs || []), logObj];
      await db.update<any>(Table.Enterprises, selectedEntId, { resources: ent.resources, usageLogs: ent.usageLogs });
      setShowUsageModal(false);
      setUsageLogEntry({ resourceId: '', quantityUsed: 0, hoursUsed: 0, notes: '' });
      await loadAllData(selectedEntId);
  };

  const handleSaveOp = async () => {
      if (!selectedEntId || !newOp.activity) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      if (!ent) return;
      const opObj = { ...newOp, id: `OP-${Date.now()}`, startDateTime: new Date().toISOString() };
      ent.operations = [...(ent.operations || []), opObj];
      await db.update<any>(Table.Enterprises, selectedEntId, { operations: ent.operations });
      setShowOpModal(false); await loadAllData(selectedEntId);
  };

  const handleDeleteEnterprise = async (eId: string) => {
    if (!window.confirm("Delete this Hub and all production records?")) return;
    await db.delete(Table.Enterprises, eId); await loadAllData();
    if (selectedEntId === eId) setSelectedEntId(null);
  };

  const renderInventory = () => (
      <div className="space-y-6 animate-fade-in pb-20">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Package size={24}/></div>
                  <div className="flex gap-4">
                      <button onClick={() => setInventorySubTab('ASSETS')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ASSETS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Node Assets</button>
                      <button onClick={() => setInventorySubTab('LOGS')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inventorySubTab === 'LOGS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Utilization Log</button>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setShowUsageModal(true)} disabled={!selectedEntId || selectedEnterprise?.resources?.length === 0} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-sm disabled:opacity-30"><Calculator size={16}/> Log Usage</button>
                  <button onClick={() => { setActiveUnitForResources(null); setShowAssetModal(true); }} disabled={!selectedEntId} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-sm disabled:opacity-30"><Plus size={16}/> Register Asset</button>
              </div>
          </div>

          {inventorySubTab === 'ASSETS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedEnterprise?.resources?.map((res: Resource) => (
                      <div key={res.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-4">
                              <div className={`p-3 rounded-2xl ${res.type === ResourceType.Machinery ? 'bg-amber-50 text-amber-600' : res.type === ResourceType.Personnel ? 'bg-blue-50 text-blue-600' : res.type === ResourceType.Consumable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                                  {res.type === ResourceType.Machinery && <Tractor size={20}/>}
                                  {res.type === ResourceType.Equipment && <Wrench size={20}/>}
                                  {res.type === ResourceType.Personnel && <HardHat size={20}/>}
                                  {res.type === ResourceType.Consumable && <Droplets size={20}/>}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${res.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{res.status}</span>
                                  <span className="text-[10px] font-mono text-slate-300 uppercase">{res.id}</span>
                              </div>
                          </div>
                          <h4 className="font-black text-slate-800 text-lg mb-1">{res.name}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{res.category} • {res.unitNumber}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mt-6 py-4 border-y border-slate-50">
                              <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-300 uppercase">Stock/Utilization</p><p className="text-sm font-black text-slate-700">{res.type === ResourceType.Consumable ? `${res.quantity} Left` : `${res.totalUsageHours || 0} Hrs`}</p></div>
                              <div className="space-y-0.5 text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Unit Cost</p><p className="text-sm font-black text-[#1B4D3E]">E {res.unitCost} / {res.type === ResourceType.Consumable ? 'Unit' : 'Hr'}</p></div>
                          </div>

                          <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase">
                              <div className="flex items-center gap-1.5"><MapPin size={10}/> {res.assignedUnitId ? selectedEnterprise.units?.find((u:any)=>u.id === res.assignedUnitId)?.name : 'General Hub'}</div>
                              <button className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
                  {(!selectedEnterprise?.resources || selectedEnterprise.resources.length === 0) && (
                      <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4 opacity-50">
                          <Package size={48} className="mx-auto text-slate-300" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Inventory Empty</p>
                      </div>
                  )}
              </div>
          ) : (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <Filter size={18} className="text-slate-400 ml-2" />
                      <select value={logFilterResourceId} onChange={(e) => setLogFilterResourceId(e.target.value)} className="bg-transparent font-bold text-xs outline-none text-slate-600">
                          <option value="All">All Resources</option>
                          {selectedEnterprise?.resources?.map((r: Resource) => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                      </select>
                  </div>
                  
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-[#1B4D3E] text-white uppercase text-[9px] font-black tracking-widest">
                              <tr>
                                  <th className="p-6">Date/Time</th>
                                  <th className="p-6">Asset ID</th>
                                  <th className="p-6">Resource Name</th>
                                  <th className="p-6 text-center">Qty/Hours</th>
                                  <th className="p-6 text-right">Attributed Cost</th>
                                  <th className="p-6">Notes</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {selectedEnterprise?.usageLogs?.filter((l: ResourceLog) => logFilterResourceId === 'All' || l.resourceId === logFilterResourceId).sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log: ResourceLog) => (
                                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-6 text-[11px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                      <td className="p-6 font-mono text-[10px] text-indigo-600 font-bold">{log.resourceId}</td>
                                      <td className="p-6 font-black text-slate-700 text-sm">{log.resourceName}</td>
                                      <td className="p-6 text-center font-bold text-slate-600 text-xs">{log.type === ResourceType.Consumable ? `${log.quantityUsed} Units` : `${log.hoursUsed} Hrs`}</td>
                                      <td className="p-6 text-right font-black text-emerald-700 text-sm">E {log.attributedCost.toLocaleString()}</td>
                                      <td className="p-6 text-xs text-slate-400 italic">{log.notes || 'Routine usage'}</td>
                                  </tr>
                              ))}
                              {(!selectedEnterprise?.usageLogs || selectedEnterprise.usageLogs.length === 0) && (
                                  <tr>
                                      <td colSpan={6} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest text-xs">No usage activity recorded</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>
  );

  const renderOperations = () => (
      <div className="space-y-6 animate-fade-in pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                      <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Health</p><h3 className="text-2xl font-black text-[#1B4D3E]">Performance Hub</h3></div>
                      <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between"><div className="flex items-center gap-3 text-emerald-700"><Gauge size={18}/><span className="text-xs font-black uppercase">Efficiency</span></div><span className="text-lg font-black text-emerald-800">92%</span></div>
                          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between"><div className="flex items-center gap-3 text-indigo-700"><Wallet size={18}/><span className="text-xs font-black uppercase">Accum. Cost</span></div><span className="text-lg font-black text-indigo-800">E {selectedEnterprise?.usageLogs?.reduce((s:number, l:ResourceLog) => s + l.attributedCost, 0).toLocaleString() || 0}</span></div>
                      </div>
                      <button onClick={() => setShowOpModal(true)} disabled={!selectedEntId} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3"><Zap size={16}/> Initialize Operation</button>
                  </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                  {selectedEnterprise?.operations?.map((op: Operation) => (
                      <div key={op.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-center">
                          <div className="p-4 bg-slate-50 rounded-2xl text-slate-600"><ClipboardList size={28}/></div>
                          <div className="flex-1 space-y-1 text-center md:text-left">
                              <h4 className="font-black text-slate-800 text-lg leading-tight">{op.activity}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2"><MapPin size={10}/> {op.field} • {op.type}</p>
                          </div>
                          <div className="w-full md:w-48 space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Progress</span><span>{op.progress}%</span></div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#1B4D3E]" style={{width: `${op.progress}%`}}></div></div>
                          </div>
                          <div className="flex gap-2">
                              <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#1B4D3E] transition-all"><Settings2 size={18}/></button>
                              <button className="p-3 bg-[#FBBF24]/10 rounded-xl text-[#1B4D3E] hover:bg-[#FBBF24] transition-all"><ChevronRight size={18}/></button>
                          </div>
                      </div>
                  ))}
                  {(!selectedEnterprise?.operations || selectedEnterprise.operations.length === 0) && (
                      <div className="py-20 bg-white rounded-[3rem] border border-slate-100 text-center space-y-4 shadow-sm">
                          <Activity size={48} className="mx-auto text-slate-100" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-300">No active operations</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderCalendar = () => (
      <div className="space-y-6 animate-fade-in pb-20">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><History size={24} className="text-amber-500"/> Chronicle & Timeline</h3>
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100">
                  {selectedEnterprise?.operations?.sort((a: any, b: any) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()).map((op: Operation, i: number) => (
                      <div key={op.id} className="relative flex gap-8 group">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border-4 border-white ${op.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {op.status === 'Completed' ? <Check size={20}/> : <Timer size={20}/>}
                          </div>
                          <div className="flex-1 pb-8 border-b border-slate-50 last:border-0">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{new Date(op.startDateTime).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                              <h4 className="font-black text-slate-800 text-sm group-hover:text-[#1B4D3E] transition-colors">{op.activity}</h4>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Initialized in sector {op.field}. Resources assigned: {op.assignedResources?.length || 0}. Status: <span className="font-bold text-[#1B4D3E]">{op.status}</span></p>
                          </div>
                      </div>
                  ))}
                  {(!selectedEnterprise?.operations || selectedEnterprise.operations.length === 0) && (
                      <div className="text-center py-20 opacity-30 italic font-bold text-slate-400">Registry timeline is currently blank.</div>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in px-4 sm:px-0 pb-20">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-8 p-4 px-8 overflow-x-auto no-scrollbar">
                {(['ESTABLISHMENT', 'INVENTORY', 'OPERATIONS', 'CALENDAR'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-3 py-4 text-[13px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#1B4D3E]' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>
                        {tab === 'ESTABLISHMENT' && <MapIcon size={16}/>}{tab === 'INVENTORY' && <Package size={16}/>}{tab === 'OPERATIONS' && <Zap size={16}/>}{tab === 'CALENDAR' && <Calendar size={16}/>}
                        {tab.replace('_', ' ')}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#1B4D3E] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'ESTABLISHMENT' && (
            <div className="space-y-6 animate-fade-in pb-10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner"><MapIcon size={24}/></div>
                        <div><h3 className="text-xl font-black text-slate-800">Spatial Infrastructure</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Node Establishment & Mapping</p></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsPlacingMode(!isPlacingMode)} className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm ${isPlacingMode ? 'bg-orange-500 text-white animate-pulse' : 'bg-[#1B4D3E] text-white hover:bg-[#143d31]'}`}>{isPlacingMode ? <X size={16}/> : <MapPinPlus size={16}/>}{isPlacingMode ? 'Cancel Placement' : 'Position New Hub'}</button>
                        <button disabled={!selectedEntId} onClick={() => { setIsTracing(true); if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); }} className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm ${isTracing ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#FBBF24] text-[#1B4D3E] hover:bg-yellow-500 disabled:opacity-30'}`}>{isTracing ? <X size={16}/> : <Layers2 size={16}/>}{isTracing ? 'Cancel Tracing' : 'Trace Unit'}</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className={`lg:col-span-3 relative bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden h-[600px] transition-all ${isPlacingMode ? 'ring-4 ring-orange-500/20 cursor-crosshair' : isTracing ? 'ring-4 ring-yellow-500/20 cursor-crosshair' : ''}`}>
                        {(isLoading || isResolvingGIS) && (<div className="absolute inset-0 z-40 bg-slate-100/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#1B4D3E]" size={40} /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isResolvingGIS ? 'Synchronizing National GIS...' : 'Refreshing Registry...'}</p></div>)}
                        {isPlacingMode && (<div className="absolute top-6 left-1/2 -translate-x-1/2 z-[30] bg-orange-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-bounce">{isResolvingGIS ? <Loader2 size={18} className="animate-spin"/> : <Navigation size={18} className="animate-pulse"/>}<span className="text-xs font-black uppercase tracking-widest">{isResolvingGIS ? 'Mapping Boundaries...' : 'Click Map to place Hub marker'}</span></div>)}
                        {isTracing && (<div className="absolute top-6 left-1/2 -translate-x-1/2 z-[30] bg-yellow-500 text-[#1B4D3E] px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-pulse"><Ruler size={18} /><span className="text-xs font-black uppercase tracking-widest">Draw Unit Perimeter</span></div>)}
                        <div className="absolute top-6 right-6 z-20 flex flex-col gap-2"><button onClick={handleZoomIn} className="p-3 bg-white shadow-xl rounded-xl text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"><ZoomIn size={20}/></button><button onClick={handleZoomOut} className="p-3 bg-white shadow-xl rounded-xl text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"><ZoomOut size={20}/></button><button onClick={handleFitAll} className="p-3 bg-emerald-600 text-white shadow-xl rounded-xl hover:bg-emerald-700 transition-all border border-emerald-500"><Maximize2 size={20}/></button></div>
                        <div ref={mapRef} className={`w-full h-full z-10 bg-slate-200 transition-opacity duration-500 ${isLoading ? 'opacity-20' : 'opacity-100'}`} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[600px] flex flex-col">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6"><Building2 size={14}/> Node Registry</h4>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5">
                                {enterprises.map(ent => (
                                    <div key={ent.id} className="space-y-4">
                                        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] shadow-lg text-white' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex justify-between items-start relative z-10">
                                                <button onClick={() => setSelectedEntId(ent.id)} className="text-left flex-1"><h5 className="font-black text-sm truncate mb-1">{ent.name}</h5><p className={`text-[10px] font-bold uppercase tracking-tight ${selectedEntId === ent.id ? 'text-green-300' : 'text-slate-400'}`}>{ent.region}</p></button>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingEntId(ent.id); setNewEnterprise({...ent, lat: ent.gps.lat.toString(), lng: ent.gps.lng.toString()}); setShowEnterpriseModal(true); }} className="p-2 hover:bg-white/10 rounded-lg"><Edit3 size={14}/></button><button onClick={() => handleDeleteEnterprise(ent.id)} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 size={14}/></button></div>
                                            </div>
                                        </div>
                                        {selectedEntId === ent.id && ent.units?.length > 0 && (<div className="pl-6 space-y-2 animate-slide-down border-l-2 border-emerald-100 ml-4">{ent.units.map((unit: any) => (<div key={unit.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-[#FBBF24]/50 transition-all shadow-sm"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shadow-sm"></div><div><p className="text-[11px] font-black text-slate-700">{unit.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{unit.area} Ha • {unit.unitNumber}</p></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setActiveUnitForResources(unit); setShowUnitResourceModal(true); }} title="Manage Plot Resources" className="p-1.5 text-slate-400 hover:text-[#1B4D3E] transition-colors"><PackagePlus size={12}/></button>
                                        <button onClick={() => { setEditingUnitId(unit.id); setNewUnit({...unit, height: unit.height || 1.2}); setShowUnitModal(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"><Pencil size={12}/></button></div></div>))}</div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'INVENTORY' && renderInventory()}
        {activeTab === 'OPERATIONS' && renderOperations()}
        {activeTab === 'CALENDAR' && renderCalendar()}

        {/* MODAL: UNIT SPECIFIC RESOURCE MANAGEMENT */}
        {showUnitResourceModal && activeUnitForResources && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                    <div className="bg-emerald-900 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl shadow-lg border border-white/5"><Hammer size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-2xl font-black">Unit Resources</h3>
                                <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">{activeUnitForResources.name} • {activeUnitForResources.unitNumber}</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowUnitResourceModal(false); setActiveUnitForResources(null); }}><X size={24}/></button>
                    </div>
                    
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Assignment Form */}
                        <div className="w-full md:w-1/3 p-8 border-r border-slate-100 bg-slate-50/50 space-y-6 overflow-y-auto no-scrollbar">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign New Asset to Plot</h4>
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification</label>
                                    <select value={newAsset.type} onChange={(e:any)=>setNewAsset({...newAsset, type: e.target.value, name: '', unitNumber: '', unitCost: 0, catalogueRef: '', linkedUserId: '', specificSerial: ''})} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm">
                                        {Object.values(ResourceType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {newAsset.type === ResourceType.Personnel ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Registered User</label>
                                            <select value={newAsset.linkedUserId} onChange={(e) => {
                                                const u = allSystemUsers.find(x => x.id === e.target.value);
                                                if (u) setNewAsset({...newAsset, linkedUserId: u.id, name: u.name, unitNumber: u.id!, category: u.actorType || 'Personnel', unitCost: 15});
                                            }} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm">
                                                <option value="">-- System Users --</option>
                                                {allSystemUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Catalogue Reference</label>
                                            <select value={newAsset.catalogueRef} onChange={(e) => {
                                                const item = masterCatalogue.find(x => x.registrationId === e.target.value);
                                                if (item) setNewAsset({...newAsset, catalogueRef: item.registrationId, name: item.tradeName, category: item.category, unitNumber: item.registrationId, unitCost: 150});
                                            }} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm">
                                                <option value="">-- Browse Catalogue --</option>
                                                {masterCatalogue
                                                  .filter(i => {
                                                      if (newAsset.type === ResourceType.Machinery) return i.division.toLowerCase().includes('machinery');
                                                      if (newAsset.type === ResourceType.Consumable) return !i.division.toLowerCase().includes('machinery') && !i.division.toLowerCase().includes('equipment');
                                                      return true; // Equipment or general
                                                  })
                                                  .map(i => <option key={i.registrationId} value={i.registrationId}>{i.tradeName} ({i.manufacturer})</option>)
                                                }
                                            </select>
                                        </div>
                                        
                                        {newAsset.catalogueRef && (
                                            <div className="animate-slide-down space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Alias</label>
                                                        <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-500 truncate">{newAsset.name}</div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry ID</label>
                                                        <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-500 truncate">{newAsset.unitNumber}</div>
                                                    </div>
                                                </div>

                                                {(newAsset.type === ResourceType.Machinery || newAsset.type === ResourceType.Equipment) && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Unique Serial Number</label>
                                                        <div className="relative">
                                                            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" size={14}/>
                                                            <input 
                                                                value={newAsset.specificSerial} 
                                                                onChange={(e)=>setNewAsset({...newAsset, specificSerial: e.target.value})} 
                                                                className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl font-bold text-sm focus:ring-4 focus:ring-emerald-500/5 outline-none" 
                                                                placeholder="Enter Unit Serial No." 
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {newAsset.type === ResourceType.Consumable && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initial Qty</label>
                                                        <input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Cost (E / {newAsset.type === ResourceType.Consumable ? 'Unit' : 'Hr'})</label>
                                    <input type="number" value={newAsset.unitCost} onChange={(e)=>setNewAsset({...newAsset, unitCost: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white border rounded-xl font-bold text-sm text-emerald-700" />
                                </div>

                                <button onClick={handleSaveAsset} disabled={!newAsset.name} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                    <Plus size={16}/> Assign to {activeUnitForResources.name}
                                </button>
                            </div>
                        </div>

                        {/* Resource List for this Unit */}
                        <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plot Inventory ({activeUnitForResources.resources?.length || 0})</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeUnitForResources.resources?.map((res: Resource) => (
                                    <div key={res.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start gap-4 group">
                                        <div className={`p-2.5 rounded-xl ${res.type === ResourceType.Personnel ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {res.type === ResourceType.Personnel ? <Users size={16}/> : <Tractor size={16}/>}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h5 className="font-black text-slate-800 text-xs truncate leading-none mb-1">{res.name}</h5>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate" title={res.unitNumber}>{res.type} • {res.unitNumber}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <p className="text-[10px] font-black text-emerald-600">E {res.unitCost}</p>
                                                <button className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!activeUnitForResources.resources || activeUnitForResources.resources.length === 0) && (
                                    <div className="col-span-full py-12 text-center space-y-3 opacity-30">
                                        <Briefcase size={32} className="mx-auto" />
                                        <p className="text-[10px] font-black uppercase">No resources assigned to this block.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* COMPACT HUB MODAL (ESTABLISHMENT) */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-5 text-white flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl"><Target size={18} className="text-orange-400"/></div>
                            <div><h3 className="text-lg font-black leading-tight">{editingEntId ? 'Update Hub' : 'Establish Hub'}</h3><p className="text-green-300 text-[8px] font-bold uppercase tracking-widest">National GIS Node</p></div>
                        </div>
                        <button onClick={() => setShowEnterpriseModal(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Establishment Alias</label>
                            <input autoFocus value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" placeholder="e.g. Malkerns Distribution Center" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Region (Smart)</label>
                                <select value={newEnterprise.region} onChange={(e:any)=>setNewEnterprise({...newEnterprise, region: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none">
                                    {systemMetadata?.regions.map((r:string)=><option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (Inkhundla)</label>
                                <input value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none" placeholder="Auto-completed" />
                            </div>
                        </div>

                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-400 uppercase">Latitude</p><p className="font-mono text-[10px] font-black text-indigo-600">{newEnterprise.lat}</p></div>
                                <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-400 uppercase">Longitude</p><p className="font-mono text-[10px] font-black text-indigo-600">{newEnterprise.lng}</p></div>
                            </div>
                            <div className="p-1.5 bg-white rounded-lg shadow-sm"><Globe size={14} className="text-slate-400"/></div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Refined Address (POI + Road)</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500" size={14}/>
                                <input readOnly value={newEnterprise.address} className="w-full pl-10 pr-4 py-3 bg-white border border-orange-100 rounded-xl font-bold text-slate-600 text-xs truncate" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                    <Sparkles size={10} className="text-orange-400 animate-pulse" />
                                    <span className="text-[8px] font-black text-orange-400 uppercase">GIS Resolved</span>
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={handleAddEnterprise} disabled={!newEnterprise.name} className="w-full py-4 mt-2 bg-[#1B4D3E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#143d31] transition-all flex items-center justify-center gap-3">
                            {editingEntId ? 'Update Establishment' : 'Authorize Hub Establishment'} <ArrowRight size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ASSET REGISTRATION MODAL (GLOBAL) */}
        {showAssetModal && !activeUnitForResources && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl"><Package size={24} className="text-yellow-400"/></div>
                            <div><h3 className="text-2xl font-black">Resource Registry</h3><p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Asset Management node</p></div>
                        </div>
                        <button onClick={() => setShowAssetModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-6 overflow-y-auto max-h-[80vh] no-scrollbar">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Classification</label>
                            <select value={newAsset.type} onChange={(e:any)=>setNewAsset({...newAsset, type: e.target.value, name: '', category: 'General', unitNumber: '', unitCost: 0, specificSerial: ''})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                                {Object.values(ResourceType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* SUB-MODAL LOGIC BASED ON TYPE */}
                        {newAsset.type === ResourceType.Personnel ? (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered System User</label>
                                <select value={newAsset.linkedUserId} onChange={(e) => {
                                    const u = allSystemUsers.find(x => x.id === e.target.value);
                                    if (u) setNewAsset({...newAsset, linkedUserId: u.id, name: u.name, unitNumber: u.id!, category: u.actorType || 'Personnel'});
                                }} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                                    <option value="">Select Employee...</option>
                                    {allSystemUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                                <div className="mt-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Labor Rate (E/hr)</label>
                                    <input type="number" value={newAsset.unitCost} onChange={(e)=>setNewAsset({...newAsset, unitCost: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl font-black text-indigo-700" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Catalogue Item</label>
                                    <select value={newAsset.catalogueRef} onChange={(e) => {
                                        const item = masterCatalogue.find(x => x.registrationId === e.target.value);
                                        if (item) setNewAsset({...newAsset, catalogueRef: item.registrationId, name: item.tradeName, category: item.category, unitNumber: item.registrationId, unitCost: 150}); // Default cost to be edited
                                    }} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                                        <option value="">Select Item...</option>
                                        {masterCatalogue.map(i => <option key={i.registrationId} value={i.registrationId}>{i.tradeName} ({i.manufacturer})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {newAsset.type === ResourceType.Consumable ? 'Initial Stock' : 'Quantity'}
                                        </label>
                                        <input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Cost / {newAsset.type === ResourceType.Consumable ? 'Unit' : 'Hr'}
                                        </label>
                                        <input type="number" value={newAsset.unitCost} onChange={(e)=>setNewAsset({...newAsset, unitCost: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" />
                                    </div>
                                </div>
                                {(newAsset.type === ResourceType.Machinery || newAsset.type === ResourceType.Equipment) && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Design Life Span (Hours)</label>
                                        <input type="number" value={newAsset.lifespanHours} onChange={(e)=>setNewAsset({...newAsset, lifespanHours: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" />
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={handleSaveAsset} disabled={!newAsset.name} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">Commit to Registry <ArrowRight size={20}/></button>
                    </div>
                </div>
            </div>
        )}

        {/* USAGE LOG MODAL */}
        {showUsageModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-emerald-900 p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl shadow-lg border border-white/5"><SearchCode size={24} className="text-[#FBBF24]"/></div>
                            <div><h3 className="text-2xl font-black">Utilization Record</h3><p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Production Cost Engine</p></div>
                        </div>
                        <button onClick={() => setShowUsageModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Active Resource</label>
                            <select value={usageLogEntry.resourceId} onChange={(e) => setUsageLogEntry({...usageLogEntry, resourceId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                                <option value="">Select Asset...</option>
                                {selectedEnterprise?.resources?.map((r: Resource) => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                            </select>
                        </div>
                        
                        {usageLogEntry.resourceId && (
                            <div className="animate-slide-down space-y-4">
                                {selectedEnterprise?.resources?.find((r: Resource) => r.id === usageLogEntry.resourceId)?.type === ResourceType.Consumable ? (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Consumed</label>
                                        <div className="relative">
                                            <input type="number" value={usageLogEntry.quantityUsed} onChange={(e) => setUsageLogEntry({...usageLogEntry, quantityUsed: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Units</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Hours Worked</label>
                                        <div className="relative">
                                            <input type="number" step="0.1" value={usageLogEntry.hoursUsed} onChange={(e) => setUsageLogEntry({...usageLogEntry, hoursUsed: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Hours</span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Context / Notes</label>
                                    <textarea value={usageLogEntry.notes} onChange={(e) => setUsageLogEntry({...usageLogEntry, notes: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 resize-none h-24" placeholder="Briefly describe what this resource was used for..." />
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Calculator size={14} className="text-emerald-600"/><span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Calculated Cost</span></div>
                                    <span className="font-black text-emerald-700">E {
                                        (() => {
                                            const r = selectedEnterprise?.resources?.find((x: Resource) => x.id === usageLogEntry.resourceId);
                                            if (!r) return 0;
                                            return r.type === ResourceType.Consumable ? (usageLogEntry.quantityUsed || 0) * r.unitCost : (usageLogEntry.hoursUsed || 0) * r.unitCost;
                                        })().toLocaleString()
                                    }</span>
                                </div>
                            </div>
                        )}

                        <button onClick={handleSaveUsage} disabled={!usageLogEntry.resourceId} className="w-full py-5 bg-emerald-700 text-white rounded-3xl font-black shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-3">Authorize Log & Attribute Cost <ArrowRight size={20}/></button>
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center"><h3 className="text-2xl font-black">Initialize Task</h3><button onClick={() => setShowOpModal(false)}><X size={24}/></button></div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Label</label><input autoFocus value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="e.g. Herbicide Application B4" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Sector</label><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"><option value="">Select Plot...</option>{selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Category</label><select value={newOp.type} onChange={(e:any)=>setNewOp({...newOp, type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"><option value="Production">Production</option><option value="Harvest">Harvest</option><option value="Processing">Processing</option></select></div>
                        </div>
                        <button onClick={handleSaveOp} className="w-full py-5 bg-[#1B4D3E] text-white rounded-3xl font-black shadow-xl hover:bg-[#143d31] transition-all flex items-center justify-center gap-3">Authorize Activation <ArrowRight size={20}/></button>
                    </div>
                </div>
            </div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-3 bg-white/10 rounded-2xl shadow-lg border border-white/5"><Layers size={24} className="text-[#FBBF24]"/></div><div><h3 className="text-2xl font-black">{editingUnitId ? 'Edit Block' : 'Define Block'}</h3><p className="text-green-300 text-[10px] font-bold uppercase tracking-widest">Spatial Characteristics & Geometry</p></div></div><button onClick={() => setShowUnitModal(false)}><X size={24}/></button></div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Block Label</label><input autoFocus value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" placeholder="e.g. Upper Block C" /></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Code</label><input value={newUnit.unitNumber} onChange={(e)=>setNewUnit({...newUnit, unitNumber: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold font-mono text-xs" /></div><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calculated Area (Ha)</label><div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-700 text-lg">{newUnit.area}</div></div></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Height (m)</label><div className="relative"><input type="number" step="0.1" value={newUnit.height} onChange={(e)=>setNewUnit({...newUnit, height: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">METERS</span></div></div><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calculated Volume (m³)</label><div className="px-6 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-700 text-lg flex items-center gap-2"><BoxSelect size={18} className="opacity-50" />{calculatedVolume}</div></div></div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supervisor</label>
                            <select 
                                value={newUnit.supervisor} 
                                onChange={(e)=>setNewUnit({...newUnit, supervisor: e.target.value})} 
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all"
                            >
                                <option value="">Select Supervisor...</option>
                                {allSystemUsers.map(u => (
                                    <option key={u.id} value={u.name}>{u.name} ({u.actorType || u.role})</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={handleSaveUnit} disabled={!newUnit.name} className="w-full py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-3xl font-black shadow-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-3">Confirm Geometry <ArrowRight size={20}/></button>
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