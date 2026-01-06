
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
  Globe, Sparkles, PackagePlus, Briefcase, Fingerprint, Receipt,
  Tags, ArrowUpRight, BarChart4, ChevronLeft, PieChart,
  TrendingDown, Scale, MapPinned
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
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
  const [activeTab, setActiveTab] = useState<'ESTABLISHMENT' | 'INVENTORY' | 'OPERATIONS' | 'CALENDAR' | 'REPORTS'>('ESTABLISHMENT');
  const [inventorySubTab, setInventorySubTab] = useState<'ASSETS' | 'LOGS'>('ASSETS');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const [logFilterResourceId, setLogFilterResourceId] = useState<string>('All');
  
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
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  
  const [activeUnitForResources, setActiveUnitForResources] = useState<any>(null);
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

  const [newAsset, setNewAsset] = useState<Partial<Resource & { lifespanHours?: number, specificSerial?: string }>>({
      type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', lifespanHours: 5000, specificSerial: ''
  });

  const [usageLogEntry, setUsageLogEntry] = useState<Partial<ResourceLog>>({
      resourceId: '', quantityUsed: 0, hoursUsed: 0, notes: '', operationId: ''
  });

  const [newOp, setNewOp] = useState<Partial<Operation>>({
      activity: '', type: 'Production', field: '', status: 'Scheduled', progress: 0, assignedResources: [], startDateTime: new Date().toISOString().split('T')[0], endDateTime: ''
  });

  const [harvestForm, setHarvestForm] = useState({
      name: '', category: 'Vegetables', quantity: 0, unit: 'kg', price: 0, description: '', image: ''
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
                const geocoder = new (window as any).google.maps.Geocoder();
                geocoder.geocode({ location: e.latLng }, (results: any, status: any) => {
                    let address = 'GPS Located';
                    let region = Region.Manzini;
                    let tinkhundla = '';
                    let country = 'Eswatini';
                    let closestPlace = '';

                    if (status === 'OK' && results[0]) {
                        address = results[0].formatted_address;
                        
                        // Extract closest point of interest
                        const poi = results.find((r: any) => 
                            r.types.includes('point_of_interest') || 
                            r.types.includes('establishment') ||
                            r.types.includes('natural_feature') ||
                            r.types.includes('park') ||
                            r.types.includes('school') ||
                            r.types.includes('church') ||
                            r.types.includes('store')
                        );
                        if (poi) {
                            closestPlace = poi.name || poi.formatted_address.split(',')[0];
                        }

                        results[0].address_components.forEach((c: any) => {
                            if (c.types.includes('country')) {
                                country = c.long_name;
                            }
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
                    
                    // Auto-generate enterprise number linked to user
                    const shortUserId = scopeId.toString().slice(-4).toUpperCase();
                    const timestamp = Date.now().toString().slice(-4);
                    const entNumber = `ENT-${shortUserId}-${timestamp}`;

                    setNewEnterprise({ 
                        name: '', 
                        region: region, 
                        tinkhundla: tinkhundla, 
                        lat: lat.toFixed(6), 
                        lng: lng.toFixed(6), 
                        address: address,
                        country: country,
                        closestPlace: closestPlace,
                        entNumber: entNumber
                    });
                    setIsResolvingGIS(false); setIsPlacingMode(false); setShowEnterpriseModal(true);
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
                dm.setDrawingMode(null); setIsTracing(false);
                setNewUnit({ id: '', name: '', unitNumber: `UNIT-${Date.now().toString().slice(-4)}`, area: (areaSqm / 10000).toFixed(2), height: 1.2, costPerHour: '', supervisor: '', path });
                setShowUnitModal(true); polygon.setMap(null); 
            });
        }

        markersRef.current.forEach(m => m.setMap(null));
        polygonsRef.current.forEach(p => p.setMap(null));
        markersRef.current = []; polygonsRef.current = [];

        enterprises.forEach(ent => {
            const isSelected = ent.id === selectedEntId;
            const marker = new (window as any).google.maps.Marker({
                position: ent.gps, map, title: ent.name,
                animation: isSelected ? (window as any).google.maps.Animation.DROP : null,
                label: { text: ent.name, color: isSelected ? "#FBBF24" : "#FFFFFF", fontSize: "11px", fontWeight: "900", className: "marker-label-shadow" },
                icon: { url: isSelected ? 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new (window as any).google.maps.Size(46, 46), labelOrigin: new (window as any).google.maps.Point(23, -14) }
            });
            marker.addListener('click', () => { setSelectedEntId(ent.id); setIsTracing(true); if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); });
            markersRef.current.push(marker);
            ent.units?.forEach((unit: any) => {
                const poly = new (window as any).google.maps.Polygon({ paths: unit.path, strokeColor: '#FBBF24', strokeWeight: 4, fillColor: '#1B4D3E', fillOpacity: 0.4, map, zIndex: 1 });
                poly.addListener('click', () => { setSelectedEntId(ent.id); setEditingUnitId(unit.id); setNewUnit({ ...unit, height: unit.height || 1.2 }); setShowUnitModal(true); });
                polygonsRef.current.push(poly);
            });
        });

        if (selectedEnterprise && !isPlacingMode && !isTracing && !showEnterpriseModal && !isLoading) {
            map.panTo(selectedEnterprise.gps); if (map.getZoom() < 16) map.setZoom(17);
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
          ...newEnterprise,
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
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
    const unitObj = { ...newUnit, id: editingUnitId || `UNT-${Date.now()}`, resources: editingUnitId ? (ent.units.find((u:any) => u.id === editingUnitId)?.resources || []) : [] };
    if (editingUnitId) ent.units = ent.units.map((u: any) => u.id === editingUnitId ? unitObj : u);
    else ent.units = [...(ent.units || []), unitObj];
    await db.update<any>(Table.Enterprises, selectedEntId, { units: ent.units });
    setShowUnitModal(false); setEditingUnitId(null); await loadAllData(selectedEntId);
  };

  const handleSaveAsset = async () => {
      const targetUnitId = activeUnitForResources?.id; const targetEntId = selectedEntId;
      if (!targetEntId || !newAsset.name) return;
      const ent = await db.getById<any>(Table.Enterprises, targetEntId); if (!ent) return;
      const assetObj = { 
          ...newAsset, id: `AST-${Date.now()}`, totalUsageHours: 0, quantity: newAsset.quantity || 1, assignedUnitId: targetUnitId || '',
          unitNumber: newAsset.type === ResourceType.Machinery || newAsset.type === ResourceType.Equipment ? `${newAsset.unitNumber}${newAsset.specificSerial ? ' / ' + newAsset.specificSerial : ''}` : newAsset.unitNumber
      } as Resource;
      ent.resources = [...(ent.resources || []), assetObj];
      if (targetUnitId) ent.units = ent.units.map((u: any) => u.id === targetUnitId ? { ...u, resources: [...(u.resources || []), assetObj] } : u);
      await db.update<any>(Table.Enterprises, targetEntId, { resources: ent.resources, units: ent.units });
      setShowAssetModal(false); 
      setNewAsset({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', lifespanHours: 5000, specificSerial: '' });
      await loadAllData(targetEntId);
  };

  const handleSaveUsage = async () => {
      if (!selectedEntId || !usageLogEntry.resourceId) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
      const resource = ent.resources.find((r: Resource) => r.id === usageLogEntry.resourceId); if (!resource) return;
      let cost = resource.type === ResourceType.Consumable ? (usageLogEntry.quantityUsed || 0) * resource.unitCost : (usageLogEntry.hoursUsed || 0) * resource.unitCost;
      const logObj: ResourceLog = { id: `LOG-${Date.now()}`, resourceId: resource.id, resourceName: resource.name, type: resource.type, operationId: usageLogEntry.operationId, quantityUsed: usageLogEntry.quantityUsed || 0, hoursUsed: usageLogEntry.hoursUsed || 0, attributedCost: cost, timestamp: new Date().toISOString(), notes: usageLogEntry.notes || '' };
      ent.resources = ent.resources.map((r: Resource) => {
          if (r.id === resource.id) return { ...r, quantity: r.type === ResourceType.Consumable ? r.quantity - (usageLogEntry.quantityUsed || 0) : r.quantity, totalUsageHours: (r.totalUsageHours || 0) + (usageLogEntry.hoursUsed || 0) };
          return r;
      });
      if (usageLogEntry.operationId) {
          ent.operations = ent.operations.map((op: Operation) => {
              if (op.id === usageLogEntry.operationId) return { ...op, accumulatedCost: (op.accumulatedCost || 0) + cost };
              return op;
          });
      }
      ent.usageLogs = [...(ent.usageLogs || []), logObj];
      await db.update<any>(Table.Enterprises, selectedEntId, { resources: ent.resources, usageLogs: ent.usageLogs, operations: ent.operations });
      setShowUsageModal(false); setUsageLogEntry({ resourceId: '', quantityUsed: 0, hoursUsed: 0, notes: '', operationId: '' }); await loadAllData(selectedEntId);
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

    const refinedId = `SZ-${scopeId.toString().slice(0,4)}-${selectedEntId.slice(-4)}-${finishingOp.id.slice(-4)}`;
    const newProduct: SalesProduct = {
        id: refinedId,
        name: harvestForm.name,
        category: harvestForm.category,
        price: harvestForm.price,
        quantity: harvestForm.quantity,
        unit: harvestForm.unit,
        description: harvestForm.description,
        dateListed: new Date().toISOString().split('T', 1)[0],
        status: 'Active',
        sellerId: scopeId as string,
        sellerName: ent.name,
        region: ent.region,
        sourceUnit: finishingOp.field,
        operationId: finishingOp.id,
        costPrice: finishingOp.accumulatedCost || 0,
        image: harvestForm.image || PLACE_HOLDER_IMAGE
    };

    ent.operations = ent.operations.map((op: Operation) => 
        op.id === finishingOp.id ? { ...op, status: 'Completed', progress: 100, endDateTime: new Date().toISOString(), producedId: refinedId } : op
    );

    await db.update<any>(Table.Enterprises, selectedEntId, { operations: ent.operations });
    await addProductToRegistry(newProduct);
    setProducts(prev => [newProduct, ...prev]);
    setShowHarvestModal(false); setFinishingOp(null); await loadAllData(selectedEntId);
  };

  const handleDeleteEnterprise = async (eId: string) => {
    if (!window.confirm("Delete this Hub and all production records?")) return;
    await db.delete(Table.Enterprises, eId); await loadAllData();
    if (selectedEntId === eId) setSelectedEntId(null);
  };

  const renderInventory = () => (
      <div className="space-y-4 animate-fade-in pb-20">
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={20}/></div>
                  <div className="flex gap-2">
                      <button onClick={() => setInventorySubTab('ASSETS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ASSETS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Assets</button>
                      <button onClick={() => setInventorySubTab('LOGS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'LOGS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Log</button>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setShowUsageModal(true)} disabled={!selectedEntId || selectedEnterprise?.resources?.length === 0} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30"><Calculator size={14}/> Usage</button>
                  <button onClick={() => { setActiveUnitForResources(null); setShowAssetModal(true); }} disabled={!selectedEntId} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30"><Plus size={14}/> Asset</button>
              </div>
          </div>
          {inventorySubTab === 'ASSETS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedEnterprise?.resources?.map((res: Resource) => (
                      <div key={res.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-48">
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <div className={`p-2.5 rounded-xl ${res.type === ResourceType.Machinery ? 'bg-amber-50 text-amber-600' : res.type === ResourceType.Personnel ? 'bg-blue-50 text-blue-600' : res.type === ResourceType.Consumable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                                      {res.type === ResourceType.Machinery && <Tractor size={18}/>}
                                      {res.type === ResourceType.Equipment && <Wrench size={18}/>}
                                      {res.type === ResourceType.Personnel && <HardHat size={18}/>}
                                      {res.type === ResourceType.Consumable && <Droplets size={18}/>}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${res.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{res.status}</span>
                              </div>
                              <h4 className="font-black text-slate-800 text-sm truncate">{res.name}</h4>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">{res.category} • {res.id}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50">
                              <div><p className="text-[8px] font-black text-slate-300 uppercase">Util</p><p className="text-[11px] font-black text-slate-700">{res.type === ResourceType.Consumable ? `${res.quantity}L` : `${res.totalUsageHours || 0}H`}</p></div>
                              <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Cost</p><p className="text-[11px] font-black text-[#1B4D3E]">E {res.unitCost}</p></div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-320px)]">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3 shrink-0">
                      <Filter size={16} className="text-slate-300 ml-1" />
                      <select value={logFilterResourceId} onChange={(e) => setLogFilterResourceId(e.target.value)} className="bg-transparent font-black text-[10px] uppercase tracking-widest outline-none text-slate-500">
                          <option value="All">All Resources</option>
                          {selectedEnterprise?.resources?.map((r: Resource) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex-1 overflow-y-auto no-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-[#1B4D3E] text-white uppercase text-[8px] font-black tracking-widest sticky top-0">
                              <tr><th className="p-4">Date</th><th className="p-4">Resource</th><th className="p-4 text-center">Amount</th><th className="p-4 text-right">Cost</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {selectedEnterprise?.usageLogs?.filter((l: ResourceLog) => logFilterResourceId === 'All' || l.resourceId === logFilterResourceId).map((log: ResourceLog) => (
                                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</td>
                                      <td className="p-4"><p className="font-black text-slate-700 text-xs truncate max-w-[120px]">{log.resourceName}</p></td>
                                      <td className="p-4 text-center font-bold text-slate-600 text-[11px]">{log.type === ResourceType.Consumable ? `${log.quantityUsed}` : `${log.hoursUsed}h`}</td>
                                      <td className="p-4 text-right font-black text-emerald-700 text-xs">E {log.attributedCost}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>
  );

  const renderOperations = () => (
      <div className="space-y-4 animate-fade-in pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-widest">Performance Hub</h3>
                      <div className="space-y-3">
                          <div className="p-3.5 bg-emerald-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-emerald-700"><Gauge size={16}/><span className="text-[9px] font-black uppercase">Efficiency</span></div><span className="text-sm font-black text-emerald-800">92%</span></div>
                          <div className="p-3.5 bg-indigo-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-indigo-700"><Wallet size={16}/><span className="text-[9px] font-black uppercase">Total Cost</span></div><span className="text-sm font-black text-indigo-800">E {selectedEnterprise?.usageLogs?.reduce((s:number, l:ResourceLog) => s + l.attributedCost, 0).toLocaleString() || 0}</span></div>
                      </div>
                      <button onClick={() => setShowOpModal(true)} disabled={!selectedEntId} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3"><Zap size={14}/> New Operation</button>
                  </div>
              </div>
              <div className="lg:col-span-3 space-y-3 h-[calc(100vh-320px)] overflow-y-auto no-scrollbar pr-1">
                  {selectedEnterprise?.operations?.map((op: Operation) => (
                      <div key={op.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                          <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><ClipboardList size={22}/></div>
                          <div className="flex-1 overflow-hidden">
                              <h4 className="font-black text-slate-800 text-sm truncate">{op.activity}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[80px]"><MapPin size={8} className="inline mr-1"/>{op.field}</p>
                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${op.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{op.status}</span>
                                <span className="text-[8px] font-bold text-indigo-500 uppercase">E {op.accumulatedCost}</span>
                              </div>
                          </div>
                          <div className="w-24 shrink-0 space-y-1">
                              <div className="flex justify-between text-[8px] font-black uppercase text-slate-300"><span>Progress</span><span>{op.progress}%</span></div>
                              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-[#1B4D3E]" style={{width: `${op.progress}%`}}></div></div>
                          </div>
                          <button onClick={() => { setUsageLogEntry({...usageLogEntry, operationId: op.id}); setShowUsageModal(true); }} className="p-2 text-slate-300 hover:text-[#1B4D3E] transition-all"><Hammer size={16}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderReports = () => {
    if (!selectedEnterprise) return null;
    const enterpriseProducts = products.filter(p => p.sellerId === scopeId);
    const totalAccumulatedCost = selectedEnterprise.usageLogs?.reduce((s: number, l: ResourceLog) => s + l.attributedCost, 0) || 0;
    const totalYield = enterpriseProducts.reduce((s, p) => s + p.quantity, 0);
    const avgCostPerUnit = totalYield > 0 ? (totalAccumulatedCost / totalYield).toFixed(2) : 0;
    const resourceCosts = (selectedEnterprise.usageLogs || []).reduce((acc: any, log: ResourceLog) => { acc[log.type] = (acc[log.type] || 0) + log.attributedCost; return acc; }, {});
    const pieData = Object.entries(resourceCosts).map(([name, value]) => ({ name, value }));
    const COLORS = ['#1B4D3E', '#FBBF24', '#3B82F6', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-6 animate-fade-in pb-20 h-[calc(100vh-250px)] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenditure</p><h3 className="text-lg font-black text-[#1B4D3E]">E {totalAccumulatedCost.toLocaleString()}</h3></div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Yield Qty</p><h3 className="text-lg font-black text-slate-800">{totalYield.toLocaleString()}</h3></div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost/Unit</p><h3 className="text-lg font-black text-slate-800">E {avgCostPerUnit}</h3></div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p><h3 className="text-lg font-black text-slate-800">92.4%</h3></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-[280px] flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cost Distribution</h4>
                    <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip contentStyle={{borderRadius:'12px', fontSize:'10px'}}/></RePieChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-[280px] flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Node Comparison</h4>
                    <div className="flex-1 overflow-y-auto no-scrollbar"><div className="space-y-2">{enterpriseProducts.map(p => (<div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span className="text-[10px] font-black text-slate-600 truncate max-w-[150px]">{p.name}</span><span className="text-[10px] font-black text-[#1B4D3E]">E {p.price} / {p.unit}</span></div>))}</div></div>
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
                        {tab === 'ESTABLISHMENT' && <MapIcon size={14}/>}{tab === 'INVENTORY' && <Package size={14}/>}{tab === 'OPERATIONS' && <Zap size={14}/>}{tab === 'CALENDAR' && <Calendar size={14}/>}{tab === 'REPORTS' && <BarChart3 size={14}/>}
                        {tab.replace('_', ' ')}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#1B4D3E] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
            {activeTab === 'ESTABLISHMENT' && (
                <div className="space-y-4 animate-fade-in flex flex-col h-full overflow-hidden pb-10">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
                        <div className="flex items-center gap-4"><div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><MapIcon size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Spatial Infrastructure</h3></div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsPlacingMode(!isPlacingMode)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isPlacingMode ? 'bg-orange-500 text-white' : 'bg-[#1B4D3E] text-white'}`}>{isPlacingMode ? 'Cancel' : 'New Hub'}</button>
                            <button disabled={!selectedEntId} onClick={() => { setIsTracing(true); if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isTracing ? 'bg-rose-500 text-white' : 'bg-[#FBBF24] text-[#1B4D3E] disabled:opacity-30'}`}>{isTracing ? 'Cancel' : 'Trace Unit'}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
                        <div className={`lg:col-span-3 relative bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden h-[400px] lg:h-full`}>
                            {(isLoading || isResolvingGIS) && (<div className="absolute inset-0 z-40 bg-slate-100/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#1B4D3E]" size={32} /></div>)}
                            <div ref={mapRef} className="w-full h-full z-10 bg-slate-200" />
                        </div>
                        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[300px] lg:h-full">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12}/> Node Registry</h4>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {enterprises.map(ent => (
                                    <div key={ent.id} className="space-y-2">
                                        <button onClick={() => setSelectedEntId(ent.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}><h5 className="font-black text-xs truncate">{ent.name}</h5><p className={`text-[8px] font-black uppercase mt-0.5 ${selectedEntId === ent.id ? 'text-green-300' : 'text-slate-400'}`}>{ent.region}</p></button>
                                        {selectedEntId === ent.id && ent.units?.length > 0 && (<div className="pl-4 space-y-1.5 border-l border-slate-100 ml-3">{ent.units.map((unit: any) => (<div key={unit.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl"><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-700 truncate">{unit.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{unit.area} Ha</p></div><button onClick={() => { setEditingUnitId(unit.id); setNewUnit({...unit, height: unit.height || 1.2}); setShowUnitModal(true); }} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><Pencil size={12}/></button></div>))}</div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'INVENTORY' && renderInventory()}
            {activeTab === 'OPERATIONS' && renderOperations()}
            {activeTab === 'REPORTS' && renderReports()}
        </div>

        {/* Enterprise Modal: Auto-populated with GIS details */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Building2 size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingEntId ? 'Update Hub' : 'New Sourcing Node'}</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">Institutional GIS Registry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowEnterpriseModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Hub Name</label>
                            <input value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Mahlanya Hub..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPinned size={18} className="text-indigo-600" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Resolved Location</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase">Country</p>
                                    <p className="text-[11px] font-black text-slate-700">{newEnterprise.country}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase">Node Number</p>
                                    <p className="text-[11px] font-black text-indigo-600 font-mono">{newEnterprise.entNumber}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase">Region</p>
                                    <p className="text-[11px] font-black text-slate-700">{newEnterprise.region}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase">Inkhundla</p>
                                    <p className="text-[11px] font-black text-slate-700">{newEnterprise.tinkhundla || 'Establishing...'}</p>
                                </div>
                            </div>
                            {newEnterprise.closestPlace && (
                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-[8px] font-black text-slate-300 uppercase">Proximal Landmark</p>
                                    <p className="text-[11px] font-black text-emerald-700">{newEnterprise.closestPlace}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Refined Address</label>
                            <input value={newEnterprise.address} onChange={(e)=>setNewEnterprise({...newEnterprise, address: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none text-slate-500" />
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleAddEnterprise} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
                            <Save size={18}/> Commit to Registry
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODALS REMAIND UNCHANGED IN FUNCTION BUT STYLED COMPACTLY */}
        {showOpModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in"><div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"><div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center"><h3 className="text-xl font-black">Initialize Task</h3><button onClick={() => setShowOpModal(false)}><X size={24}/></button></div><div className="p-8 space-y-4"><input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="Label..." className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-sm outline-none" /><div className="grid grid-cols-2 gap-4"><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-sm"><option value="">Plot...</option>{selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select value={newOp.type} onChange={(e:any)=>setNewOp({...newOp, type: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-sm"><option value="Production">Production</option><option value="Harvest">Harvest</option></select></div><button onClick={handleSaveOp} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest">Activate</button></div></div></div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div><h3 className="text-xl font-black">Spatial Unit Configuration</h3><p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">Geometry & Inception Parameters</p></div>
                        <button onClick={() => setShowUnitModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="Unit Name (e.g. Field 01)..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase">Resolved Area</p><p className="text-lg font-black text-[#1B4D3E]">{newUnit.area} Ha</p></div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase">Unit Volume</p><p className="text-lg font-black text-slate-800">{calculatedVolume} m³</p></div>
                        </div>
                        <button onClick={handleSaveUnit} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-4">Save Configuration</button>
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

const PLACE_HOLDER_IMAGE = "https://images.unsplash.com/photo-1492496913980-501348b61384?w=300&h=300&fit=crop";

export default Production;
