
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
  Landmark, Maximize
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend
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
      type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', initialValue: 0, productionDate: new Date().toISOString().split('T')[0], expiryDate: ''
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
            // Fallback to pseudo-fullscreen via CSS if native API is blocked
            setIsFullscreen(true);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
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
                fullscreenControl: true, // Explicitly enable native control
                gestureHandling: 'greedy',
                styles: [
                  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
                  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] }
                ]
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
                    const entNumber = `ENT-${shortUserId}-${timestamp}`;
                    setNewEnterprise({ name: '', region, tinkhundla, lat: lat.toFixed(6), lng: lng.toFixed(6), address, country, closestPlace, entNumber });
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
            marker.addListener('click', () => { setSelectedEntId(ent.id); });
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

  const handleAddEnterprise = async () => {
      if (!newEnterprise.name || !newEnterprise.lat) return;
      const entData = {
          ...newEnterprise,
          gps: { lat: parseFloat(newEnterprise.lat), lng: parseFloat(newEnterprise.lng) },
          ownerId: scopeId, units: editingEntId ? selectedEnterprise?.units : [], resources: editingEntId ? selectedEnterprise?.resources : [], processes: editingEntId ? selectedEnterprise?.processes : [], operations: editingEntId ? selectedEnterprise?.operations : [], usageLogs: editingEntId ? selectedEnterprise?.usageLogs : []
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

  const handleSaveUnitInventory = async () => {
      if (!selectedEntId || !activeUnitForInventory) return;
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId); if (!ent) return;
      
      const linkedResources = ent.resources.filter((r: Resource) => selectedResourceIds.includes(r.id));
      
      ent.resources = ent.resources.map((r: Resource) => {
          if (selectedResourceIds.includes(r.id)) return { ...r, assignedUnitId: activeUnitForInventory.id };
          if (r.assignedUnitId === activeUnitForInventory.id && !selectedResourceIds.includes(r.id)) return { ...r, assignedUnitId: '' };
          return r;
      });

      ent.units = ent.units.map((u: any) => {
          if (u.id === activeUnitForInventory.id) return { ...u, resources: linkedResources };
          return u;
      });

      await db.update<any>(Table.Enterprises, selectedEntId, { resources: ent.resources, units: ent.units });
      setShowUnitInventoryModal(false); setActiveUnitForInventory(null); await loadAllData(selectedEntId);
  };

  const handleSaveAsset = async () => {
      const targetUnitId = activeUnitForInventory?.id; const targetEntId = selectedEntId;
      if (!targetEntId || !newAsset.name) return;
      const ent = await db.getById<any>(Table.Enterprises, targetEntId); if (!ent) return;
      
      // Calculate unitCost (usage rate) based on lifespan between production and expiry dates
      let calculatedUnitCost = newAsset.unitCost || 0;
      if (newAsset.productionDate && newAsset.expiryDate && newAsset.initialValue) {
          const start = new Date(newAsset.productionDate).getTime();
          const end = new Date(newAsset.expiryDate).getTime();
          const totalLifespanMs = end - start;
          const totalHours = totalLifespanMs / (1000 * 60 * 60);
          if (totalHours > 0) {
              calculatedUnitCost = newAsset.initialValue / totalHours;
          }
      }

      const assetObj = { 
          ...newAsset, 
          id: `AST-${Date.now()}`, 
          totalUsageHours: 0, 
          quantity: newAsset.quantity || 1, 
          assignedUnitId: targetUnitId || '', 
          unitCost: calculatedUnitCost,
          unitNumber: newAsset.unitNumber || '' 
      } as Resource;
      
      ent.resources = [...(ent.resources || []), assetObj];
      if (targetUnitId) {
          ent.units = ent.units.map((u: any) => u.id === targetUnitId ? { ...u, resources: [...(u.resources || []), assetObj] } : u);
      }
      
      await db.update<any>(Table.Enterprises, targetEntId, { resources: ent.resources, units: ent.units });
      setShowAssetModal(false); 
      setNewAsset({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', initialValue: 0, productionDate: new Date().toISOString().split('T')[0], expiryDate: '' });
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
      if (usageLogEntry.operationId) ent.operations = ent.operations.map((op: Operation) => op.id === usageLogEntry.operationId ? { ...op, accumulatedCost: (op.accumulatedCost || 0) + cost } : op);
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
        id: refinedId, name: harvestForm.name, category: harvestForm.category, price: harvestForm.price, quantity: harvestForm.quantity, unit: harvestForm.unit, description: harvestForm.description, dateListed: new Date().toISOString().split('T', 1)[0], status: 'Active', sellerId: scopeId as string, sellerName: ent.name, region: ent.region, sourceUnit: finishingOp.field, operationId: finishingOp.id, costPrice: finishingOp.accumulatedCost || 0, image: harvestForm.image || PLACE_HOLDER_IMAGE
    };
    ent.operations = ent.operations.map((op: Operation) => op.id === finishingOp.id ? { ...op, status: 'Completed', progress: 100, endDateTime: new Date().toISOString(), producedId: refinedId } : op);
    await db.update<any>(Table.Enterprises, selectedEntId, { operations: ent.operations });
    await addProductToRegistry(newProduct);
    setProducts(prev => [newProduct, ...prev]);
    setShowHarvestModal(false); setFinishingOp(null); await loadAllData(selectedEntId);
  };

  const handleMapZoom = (dir: 'in' | 'out') => {
      if (!mapInstance) return;
      const current = mapInstance.getZoom();
      mapInstance.setZoom(dir === 'in' ? current + 1 : current - 1);
  };

  // Helper to calculate drawdown value
  const getResourceValueData = (res: Resource) => {
    if (!res.productionDate || !res.expiryDate || !res.initialValue) return null;
    const start = new Date(res.productionDate).getTime();
    const end = new Date(res.expiryDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = Math.max(0, now - start);
    const remaining = Math.max(0, end - now);
    const ratio = Math.min(1, remaining / total);
    return {
        currentValue: res.initialValue * ratio,
        percentRemaining: ratio * 100
    };
  };

  const renderInventory = () => (
      <div className="space-y-4 animate-fade-in pb-20">
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-xl"><Package size={20}/></div>
                  <div className="flex gap-2">
                      <button onClick={() => setInventorySubTab('ASSETS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ASSETS' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>Assets</button>
                      <button onClick={() => setInventorySubTab('LOGS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'LOGS' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>Usage History</button>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setShowUsageModal(true)} disabled={!selectedEntId || selectedEnterprise?.resources?.length === 0} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30 hover:bg-emerald-700 transition-colors"><Calculator size={14}/> Log Usage</button>
                  <button onClick={() => { setActiveUnitForInventory(null); setShowAssetModal(true); }} disabled={!selectedEntId} className="px-5 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-30 hover:bg-[#143d31] transition-colors"><Plus size={14}/> Add Asset</button>
              </div>
          </div>
          {inventorySubTab === 'ASSETS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedEnterprise?.resources?.map((res: Resource) => {
                      const valueData = getResourceValueData(res);
                      return (
                      <div key={res.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-56">
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
                              
                              {valueData && (
                                <div className="mt-3 space-y-1">
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                                        <span className="text-slate-300">Life Drawdown</span>
                                        <span className="text-emerald-600">E {Math.round(valueData.currentValue).toLocaleString()} Remaining</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{width: `${valueData.percentRemaining}%`}}></div>
                                    </div>
                                </div>
                              )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50">
                              <div><p className="text-[8px] font-black text-slate-300 uppercase">Util</p><p className="text-[11px] font-black text-slate-700">{res.type === ResourceType.Consumable ? `${res.quantity}L` : `${res.totalUsageHours || 0}H`}</p></div>
                              <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Usage Rate</p><p className="text-[11px] font-black text-[#1B4D3E]">E {res.unitCost.toFixed(2)}/h</p></div>
                          </div>
                      </div>
                  )})}
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
                      <table className="w-full text-left border-collapse text-sm">
                          <thead className="bg-[#1B4D3E] text-white uppercase text-[8px] font-black tracking-widest sticky top-0">
                              <tr><th className="p-4">Date</th><th className="p-4">Resource</th><th className="p-4 text-center">Amount</th><th className="p-4 text-right">Attributed Cost</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                              {selectedEnterprise?.usageLogs?.filter((l: ResourceLog) => logFilterResourceId === 'All' || l.resourceId === logFilterResourceId).map((log: ResourceLog) => (
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
              </div>
          )}
      </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    const ops = selectedEnterprise?.operations || [];
    
    return (
        <div className="space-y-4 animate-fade-in h-[calc(100vh-250px)] overflow-hidden flex flex-col">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CalendarDays size={24}/></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Operations Schedule</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">National Planning Cycle</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-400">Production</span></div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-400">Harvest</span></div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ops.map((op: Operation) => (
                        <div key={op.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-[#1B4D3E]/30 transition-all flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(op.startDateTime).toLocaleDateString()}</p>
                                    <h4 className="font-black text-slate-800 text-sm group-hover:text-[#1B4D3E] transition-colors">{op.activity}</h4>
                                </div>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${op.type === 'Harvest' ? 'bg-[#FBBF24] text-[#1B4D3E]' : 'bg-[#1B4D3E] text-white'}`}>
                                    {op.type === 'Harvest' ? <Sprout size={16}/> : <Zap size={16}/>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                    <span className="text-slate-400">Resource Nodes</span>
                                    <span className="text-[#1B4D3E]">{op.assignedResources?.length || 0} Linked</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                    <span className="text-slate-400">Plot Inception</span>
                                    <span className="text-slate-700">{op.field}</span>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${op.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{op.status}</span>
                                <p className="text-[11px] font-black text-indigo-600">E {op.accumulatedCost?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    ))}
                    {ops.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <CalendarDays size={64} className="mx-auto mb-4" />
                            <p className="font-black uppercase text-xs tracking-widest">No operations scheduled.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderReports = () => {
    const costData = [
        { name: 'Seedlings', value: 12000 },
        { name: 'Fertilizer', value: 45000 },
        { name: 'Machinery', value: 85000 },
        { name: 'Labor', value: 32000 },
        { name: 'Water', value: 8000 }
    ];

    const harvestTrends = [
        { month: 'Jan', yield: 400 },
        { month: 'Feb', yield: 600 },
        { month: 'Mar', yield: 900 },
        { month: 'Apr', yield: 750 },
        { month: 'May', yield: 1200 },
        { month: 'Jun', yield: 1500 }
    ];

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-250px)] overflow-y-auto no-scrollbar pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Node Aggregate Cost</p>
                        <h3 className="text-4xl font-black text-[#1B4D3E] tracking-tight">E {(selectedEnterprise?.usageLogs?.reduce((s: number, l: ResourceLog) => s + l.attributedCost, 0) || 0).toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mt-8">
                        <TrendingUp size={16}/> +12.5% from last cycle
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Production Efficiency</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight">92.4%</h3>
                        <span className="text-xs text-slate-400 font-black uppercase mb-1">Optimized</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full mt-8 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width: '92.4%'}}></div></div>
                </div>
                <div className="bg-[#1B4D3E] p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-300 uppercase tracking-[0.2em] mb-4">Yield Nodes Registered</p>
                        <h3 className="text-4xl font-black tracking-tight">{products.filter(p => p.sellerId === scopeId).length}</h3>
                    </div>
                    <Landmark size={120} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3"><PieChart size={16} className="text-[#FBBF24]"/> Cost Distribution Index</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                    {[0, 1, 2, 3, 4].map((i) => <Cell key={i} fill={['#1B4D3E', '#FBBF24', '#10b981', '#3b82f6', '#f43f5e'][i]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3"><LineIcon size={16} className="text-indigo-600"/> Cumulative Yield Growth</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={harvestTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                                <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px'}} />
                                <Line type="monotone" dataKey="yield" stroke="#1B4D3E" strokeWidth={4} dot={{fill: '#FBBF24', r: 4, strokeWidth: 2}} activeDot={{r: 8, stroke: '#fff', strokeWidth: 4}} />
                            </LineChart>
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
                        {tab === 'ESTABLISHMENT' && <MapIcon size={14}/>}{tab === 'INVENTORY' && <Package size={14}/>}{tab === 'OPERATIONS' && <Zap size={14}/>}{tab === 'CALENDAR' && <CalendarIcon size={14}/>}{tab === 'REPORTS' && <BarChart3 size={14}/>}
                        {tab.replace('_', ' ')}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#FBBF24] rounded-full" />)}
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
                            <button disabled={!selectedEntId} onClick={() => { setIsTracing(true); if (drawingManager) drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isTracing ? 'bg-rose-500 text-white' : 'bg-[#FBBF24] text-[#1B4D3E] disabled:opacity-30'}`}>{isTracing ? 'Cancel' : 'Trace Plot'}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
                        <div ref={mapContainerRef} className={`lg:col-span-3 relative bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden h-[400px] lg:h-full group/map ${isFullscreen ? 'fixed inset-0 z-[200] !m-0 !rounded-none' : ''}`}>
                            {(isLoading || isResolvingGIS) && (<div className="absolute inset-0 z-40 bg-slate-100/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#1B4D3E]" size={32} /></div>)}
                            <div ref={mapRef} className="w-full h-full z-10 bg-slate-200" />
                            
                            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                <button 
                                    onClick={toggleFullscreen} 
                                    className="px-4 py-3 bg-white/95 backdrop-blur-md text-[#1B4D3E] rounded-2xl shadow-xl hover:bg-emerald-50 transition-all border border-slate-200 flex items-center gap-2 group/fs" 
                                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize2 size={18}/> : <Maximize size={18}/>}
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover/fs:inline-block transition-all">
                                        {isFullscreen ? "Exit Full Screen" : "Full Screen"}
                                    </span>
                                </button>
                                <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                    <button onClick={() => handleMapZoom('in')} className="p-3 text-[#1B4D3E] hover:bg-emerald-50 border-b border-slate-100 transition-colors" title="Zoom In"><ZoomIn size={20}/></button>
                                    <button onClick={() => handleMapZoom('out')} className="p-3 text-[#1B4D3E] hover:bg-emerald-50 transition-colors" title="Zoom Out"><ZoomOut size={20}/></button>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 z-20 bg-[#1B4D3E]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-2xl max-w-xs animate-fade-in hidden sm:block">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={14} className="text-[#FBBF24]"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Digital Cartography</span>
                                </div>
                                <p className="text-[10px] font-medium opacity-80 leading-relaxed">Satellite nodes synchronized with National GIS database. Interactive tracing for precision area calculation active.</p>
                            </div>
                        </div>
                        <div className={`lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[300px] lg:h-full ${isFullscreen ? 'hidden' : ''}`}>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12}/> Node Index</h4>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {enterprises.map(ent => (
                                    <div key={ent.id} className="space-y-2">
                                        <button onClick={() => setSelectedEntId(ent.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}><h5 className="font-black text-xs truncate">{ent.name}</h5><p className={`text-[8px] font-black uppercase mt-0.5 ${selectedEntId === ent.id ? 'text-[#FBBF24]' : 'text-slate-400'}`}>{ent.region}</p></button>
                                        {selectedEntId === ent.id && ent.units?.length > 0 && (<div className="pl-4 space-y-1.5 border-l border-slate-100 ml-3">{ent.units.map((unit: any) => (<div key={unit.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl"><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-700 truncate">{unit.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{unit.area} Ha</p></div><div className="flex items-center gap-1"><button onClick={() => { setActiveUnitForInventory(unit); setSelectedResourceIds(unit.resources?.map((r: any) => r.id) || []); setShowUnitInventoryModal(true); }} className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors" title="Add Inventory"><PackagePlus size={14}/></button><button onClick={() => { setEditingUnitId(unit.id); setNewUnit({...unit, height: unit.height || 1.2}); setShowUnitModal(true); }} className="p-1.5 text-slate-300 hover:text-[#1B4D3E] transition-colors" title="Edit Plot"><Pencil size={14}/></button></div></div>))}</div>)}
                                    </div>
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
                              <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-widest">Real-time Node</h3>
                              <div className="space-y-3">
                                  <div className="p-3.5 bg-emerald-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-emerald-700"><Gauge size={16}/><span className="text-[9px] font-black uppercase">KPI Target</span></div><span className="text-sm font-black text-emerald-800">92%</span></div>
                                  <div className="p-3.5 bg-indigo-50 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2 text-indigo-700"><Wallet size={16}/><span className="text-[9px] font-black uppercase">Cycle Cost</span></div><span className="text-sm font-black text-indigo-800">E {selectedEnterprise?.usageLogs?.reduce((s:number, l:ResourceLog) => s + l.attributedCost, 0).toLocaleString() || 0}</span></div>
                              </div>
                              <button onClick={() => setShowOpModal(true)} disabled={!selectedEntId} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3"><Zap size={14} className="text-[#FBBF24]"/> Start New Task</button>
                          </div>
                      </div>
                      <div className="lg:col-span-3 space-y-3 h-[calc(100vh-320px)] overflow-y-auto no-scrollbar pr-1">
                          {selectedEnterprise?.operations?.map((op: Operation) => (
                              <div key={op.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                                  <div className={`p-3 rounded-xl transition-colors ${op.type === 'Harvest' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-[#1B4D3E]/10'}`}><ClipboardList size={22}/></div>
                                  <div className="flex-1 overflow-hidden">
                                      <h4 className="font-black text-slate-800 text-sm truncate">{op.activity}</h4>
                                      <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[80px]"><MapPin size={8} className="inline mr-1"/>{op.field}</p>
                                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${op.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{op.status}</span>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase">E {op.accumulatedCost?.toLocaleString() || 0}</span>
                                      </div>
                                  </div>
                                  <div className="w-24 shrink-0 space-y-1">
                                      <div className="flex justify-between text-[8px] font-black uppercase text-slate-300"><span>Progress</span><span>{op.progress}%</span></div>
                                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${op.progress === 100 ? 'bg-emerald-500' : 'bg-[#1B4D3E]'}`} style={{width: `${op.progress}%`}}></div></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => { setUsageLogEntry({...usageLogEntry, operationId: op.id}); setShowUsageModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Hammer size={16}/></button>
                                    {op.type === 'Harvest' && op.status !== 'Completed' && (
                                      <button onClick={() => { setFinishingOp(op); setHarvestForm(prev => ({ ...prev, name: op.activity })); setShowHarvestModal(true); }} className="p-2 text-emerald-500 hover:text-emerald-700 transition-all"><Sprout size={16}/></button>
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

        {/* Unit Inventory Modal */}
        {showUnitInventoryModal && activeUnitForInventory && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Archive size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Plot Unit Allocation</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">Resource Node: {activeUnitForInventory.name}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowUnitInventoryModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[60vh]">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Map enterprise-level assets to this specific production unit for refined cost tracking and logistics visibility.</p>
                        <div className="space-y-2">
                            {selectedEnterprise?.resources?.filter((r: Resource) => [ResourceType.Machinery, ResourceType.Equipment, ResourceType.Consumable].includes(r.type)).map((res: Resource) => (
                                <button 
                                    key={res.id} 
                                    onClick={() => setSelectedResourceIds(prev => prev.includes(res.id) ? prev.filter(id => id !== res.id) : [...prev, res.id])}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedResourceIds.includes(res.id) ? 'bg-[#1B4D3E]/5 border-[#1B4D3E]/30' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${res.type === ResourceType.Machinery ? 'bg-amber-100 text-amber-600' : res.type === ResourceType.Equipment ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {res.type === ResourceType.Machinery && <Tractor size={18}/>}
                                            {res.type === ResourceType.Equipment && <Wrench size={18}/>}
                                            {res.type === ResourceType.Consumable && <Droplets size={18}/>}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-slate-700">{res.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{res.id} • {res.status}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedResourceIds.includes(res.id) ? 'bg-[#1B4D3E] text-white' : 'border-2 border-slate-200'}`}>
                                        {selectedResourceIds.includes(res.id) && <Check size={14}/>}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-center">
                            <button onClick={() => { setActiveUnitForInventory(activeUnitForInventory); setShowAssetModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                                <Plus size={16}/> New Asset for Plot
                            </button>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSaveUnitInventory} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-transform">
                            <Save size={18}/> Commit Allocation
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showHarvestModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Sprout size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Commodity Node Lifecycle</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">Institutional Harvest Registry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHarvestModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Label</label><input value={harvestForm.name} onChange={(e)=>setHarvestForm({...harvestForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield Qty</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Valuation (E)</label><input type="number" value={harvestForm.price} onChange={(e)=>setHarvestForm({...harvestForm, price: parseFloat(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Specs</label><textarea value={harvestForm.description} onChange={(e)=>setHarvestForm({...harvestForm, description: e.target.value})} className="w-full h-24 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none resize-none" /></div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">In-field Capture</label>
                                <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                    {harvestForm.image ? (
                                        <>
                                            <img src={harvestForm.image} className="w-full h-full object-cover" />
                                            <button onClick={() => setHarvestForm(prev => ({ ...prev, image: '' }))} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-4"><Camera size={24} className="text-slate-300"/></div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Verify Yield Visuals</p>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'harvest')} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                    <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Visual verification is indexed against the Refined Chronology ID for buyer transparency.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleFinalizeHarvest} className="px-10 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
                            <Save size={18}/> Close Node & Export to Hub
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><ClipboardType size={22} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black">Initialize Task Node</h3>
                        </div>
                        <button onClick={() => setShowOpModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="Activity Description..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                <option value="">Select Plot...</option>
                                {selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                            <select value={newOp.type} onChange={(e:any)=>setNewOp({...newOp, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                <option value="Production">Production</option>
                                <option value="Harvest">Harvest</option>
                                <option value="Processing">Processing</option>
                            </select>
                        </div>
                        <button onClick={handleSaveOp} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-[#143d31] transition-all">Begin Operational Cycle</button>
                    </div>
                </div>
            </div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Spatial Parameters</h3>
                            <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest mt-1">Plot Geometry Configuration</p>
                        </div>
                        <button onClick={() => setShowUnitModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifier</label><input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Maize Block A..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Resolved Footprint</p><p className="text-2xl font-black text-[#1B4D3E]">{newUnit.area} Ha</p></div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Calculated Volume</p><p className="text-2xl font-black text-slate-800">{calculatedVolume} m³</p></div>
                        </div>
                        <button onClick={handleSaveUnit} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-4 shadow-xl hover:bg-[#143d31] transition-all">Store GIS Node</button>
                    </div>
                </div>
            </div>
        )}

        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Building2 size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingEntId ? 'Update Hub' : 'Register National Hub'}</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">Institutional GIS Registry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowEnterpriseModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Identity</label>
                            <input value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Malkerns Research Station..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPinned size={18} className="text-indigo-600" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Resolution</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Country</p>
                                    <p className="text-xs font-black text-slate-700">{newEnterprise.country}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Registry ID</p>
                                    <p className="text-xs font-black text-indigo-600 font-mono tracking-tighter">{newEnterprise.entNumber}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">National Region</p>
                                    <p className="text-xs font-black text-slate-700">{newEnterprise.region}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Inkhundla Node</p>
                                    <p className="text-xs font-black text-slate-700">{newEnterprise.tinkhundla || 'Identifying...'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolved Coordinates</label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-slate-500">
                                <Globe size={14}/> {newEnterprise.lat}, {newEnterprise.lng}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleAddEnterprise} className="px-10 py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#143d31] transition-all">
                            <Save size={18} className="text-[#FBBF24]"/> Commit Node to Registry
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showAssetModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Plus size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Enterprise Asset Hub</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">Inventory Registry Entry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAssetModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[75vh]">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                            <select value={newAsset.type} onChange={(e)=>setNewAsset({...newAsset, type: e.target.value as ResourceType})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                {Object.values(ResourceType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Identity</label>
                            <input value={newAsset.name} onChange={(e)=>setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Swazi-Tractor Node 04..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial / Fleet ID</label><input value={newAsset.unitNumber} onChange={(e)=>setNewAsset({...newAsset, unitNumber: e.target.value})} placeholder="e.g. SER-405-99..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reserve Qty</label><input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-inner">
                            <div className="flex items-center gap-3">
                                <Timer size={18} className="text-[#1B4D3E]"/>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Parameters</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Total Value (E)</label>
                                    <input type="number" value={newAsset.initialValue} onChange={(e)=>setNewAsset({...newAsset, initialValue: parseFloat(e.target.value)})} placeholder="e.g. 500000" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-emerald-700 text-sm outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Production Date</label>
                                        <input type="date" value={newAsset.productionDate} onChange={(e)=>setNewAsset({...newAsset, productionDate: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                        <input type="date" value={newAsset.expiryDate} onChange={(e)=>setNewAsset({...newAsset, expiryDate: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" />
                                    </div>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
                                    <Info size={14} className="text-indigo-400"/>
                                    <p className="text-[9px] text-slate-400 font-medium">Unit usage cost (hourly rate) will be auto-apportioned based on investment value vs lifespan window.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSaveAsset} className="px-12 py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#143d31] transition-all">
                            <Save size={18}/> Commit Asset Node
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showUsageModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Calculator size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Resource Consumption Log</h3>
                                <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mt-1">National Cost Compliance</p>
                            </div>
                        </div>
                        <button onClick={() => setShowUsageModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Node</label>
                            <select value={usageLogEntry.resourceId} onChange={(e)=>setUsageLogEntry({...usageLogEntry, resourceId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                <option value="">Select Resource Node...</option>
                                {selectedEnterprise?.resources?.map((r: Resource) => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration Cycle (Hours)</label><input type="number" value={usageLogEntry.hoursUsed} onChange={(e)=>setUsageLogEntry({...usageLogEntry, hoursUsed: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Displacement (Qty)</label><input type="number" value={usageLogEntry.quantityUsed} onChange={(e)=>setUsageLogEntry({...usageLogEntry, quantityUsed: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Linkage Node</label>
                            <select value={usageLogEntry.operationId} onChange={(e)=>setUsageLogEntry({...usageLogEntry, operationId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none">
                                <option value="">General Reserve Consumption</option>
                                {selectedEnterprise?.operations?.filter((op:any) => op.status !== 'Completed').map((op: any) => <option key={op.id} value={op.id}>{op.activity} @ {op.field}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSaveUsage} className="px-10 py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#143d31] transition-all">
                            <CheckCircle2 size={18}/> Commit Consumption Entry
                        </button>
                    </div>
                </div>
            </div>
        )}

        <style>{`
            .marker-label-shadow { text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5); padding: 4px 8px; background: rgba(27, 77, 62, 0.4); border-radius: 4px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            :fullscreen .lg\\:h-full { height: 100vh !important; width: 100vw !important; }
            :-webkit-full-screen .lg\\:h-full { height: 100vh !important; width: 100vw !important; }
        `}</style>
    </div>
  );
};

export default Production;
