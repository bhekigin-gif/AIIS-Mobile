
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
  LocateFixed, Edit, Height,
  Eye,
  Scan,
  TrendingDownIcon
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
import { analyzeResourceImage } from '../services/geminiService';

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

  // Reordered tabs: Performance first, then Setup, Resources, Operations, Calendar
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'SETUP' | 'RESOURCES' | 'OPERATIONS' | 'CALENDAR'>('REPORTS');
  const [inventorySubTab, setInventorySubTab] = useState<'RESOURCES' | 'LOGS'>('RESOURCES');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzingAsset, setIsAnalyzingAsset] = useState(false);

  const scopeId = (user?.entityType === EntityType.EmployeeMember || user?.actorType === ActorType.Gov) && user?.organizationId 
    ? user.organizationId 
    : (user?.id || 'GUEST');

  const loadAllData = async (newSelectedId?: string) => {
    setIsLoading(true);
    const [meta, catalogue, allEnterprises] = await Promise.all([
        Get_System_Metadata(),
        View_Master_Catalogue(),
        db.getAll<any>(Table.Enterprises)
    ]);
    setSystemMetadata(meta);

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
  const [showOpModal, setShowOpModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  
  const [activeUnitForInventory, setActiveUnitForInventory] = useState<any>(null);
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
      id: '', name: '', unitNumber: '', area: '', height: 10, costPerHour: '', supervisor: '', path: [] as any[]
  });

  const [newAsset, setNewAsset] = useState<Partial<Resource & { productionDate?: string; expiryDate?: string; initialValue?: number; image?: string }>>({
      type: isExtension ? ResourceType.Personnel : ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, unitNumber: '', initialValue: 0, productionDate: new Date().toISOString().split('T')[0], expiryDate: '', details: ''
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

  const handleResourceAIAnalyze = async () => {
    if (!newAsset.image) return;
    setIsAnalyzingAsset(true);
    const base64 = newAsset.image.split(',')[1];
    const result = await analyzeResourceImage(base64);
    if (result) {
        setNewAsset(prev => ({
            ...prev,
            name: result.name || prev.name,
            type: (result.type || prev.type) as ResourceType,
            category: result.category || prev.category,
            details: result.description || prev.details
        }));
    }
    setIsAnalyzingAsset(false);
  };

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

  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstance) {
      setIsResolvingGIS(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          mapInstance.setCenter(pos);
          mapInstance.setZoom(18);
          setIsResolvingGIS(false);
        },
        () => {
          setIsResolvingGIS(false);
          alert("Could not access your physical location.");
        }
      );
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const startTracing = (entId: string) => {
    setSelectedEntId(entId);
    setIsTracing(true);
    setIsPlacingMode(false);
    if (drawingManager) {
        drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const handleEditEnterprise = (ent: any) => {
    setEditingEntId(ent.id);
    setNewEnterprise({
        name: ent.name,
        region: ent.region,
        tinkhundla: ent.tinkhundla || '',
        lat: ent.gps.lat.toString(),
        lng: ent.gps.lng.toString(),
        address: ent.address || '',
        country: ent.country || 'Eswatini',
        closestPlace: ent.closestPlace || '',
        entNumber: ent.entNumber || ''
    });
    setShowEnterpriseModal(true);
  };

  const handleEditUnit = (entId: string, unit: any) => {
    setSelectedEntId(entId);
    setEditingUnitId(unit.id);
    setNewUnit({ ...unit, height: unit.height || 10 });
    setShowUnitModal(true);
  };

  const handleAddResourceToUnit = (entId: string, unit: any) => {
    setSelectedEntId(entId);
    setActiveUnitForInventory(unit);
    setNewAsset({
      type: isExtension ? ResourceType.Personnel : ResourceType.Machinery,
      name: '',
      unitCost: 0,
      category: 'General',
      status: 'Available',
      quantity: 1,
      unitNumber: '',
      initialValue: 0,
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      details: ''
    });
    setShowAssetModal(true);
  };

  // Map Instance Sync Effect
  useEffect(() => {
    if (activeTab === 'SETUP' && googleApiLoaded && mapRef.current) {
        let map = mapInstance;
        
        if (!map) {
            map = new (window as any).google.maps.Map(mapRef.current, {
                center: selectedEnterprise?.gps || { lat: -26.48, lng: 31.37 },
                zoom: selectedEnterprise ? 18 : 11,
                mapTypeId: 'hybrid',
                disableDefaultUI: true,
                fullscreenControl: false, 
                gestureHandling: 'greedy',
            });
            setMapInstance(map);

            map.addListener('click', (e: any) => {
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

                    try {
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
                    } catch (err) {
                        console.error("Geocoding Parse Error:", err);
                    } finally {
                        const shortUserId = scopeId.toString().slice(-4).toUpperCase();
                        const timestamp = Date.now().toString().slice(-4);
                        const entNumber = isExtension ? `SVC-${shortUserId}-${timestamp}` : `ENT-${shortUserId}-${timestamp}`;
                        
                        setNewEnterprise({ name: '', region, tinkhundla, lat: lat.toFixed(6), lng: lng.toFixed(6), address, country, closestPlace, entNumber });
                        setIsResolvingGIS(false); 
                        setIsPlacingMode(false); 
                        setShowEnterpriseModal(true);
                    }
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
                setNewUnit({ id: '', name: '', unitNumber: isExtension ? `NODE-${Date.now().toString().slice(-4)}` : `UNIT-${Date.now().toString().slice(-4)}`, area: (areaSqm / 10000).toFixed(2), height: 10, costPerHour: '', supervisor: '', path });
                setShowUnitModal(true); polygon.setMap(null); 
            });
        }

        // Always sync markers and polygons to current enterprise state
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
                startTracing(ent.id);
            });
            markersRef.current.push(marker);
            ent.units?.forEach((unit: any) => {
                const poly = new (window as any).google.maps.Polygon({ paths: unit.path, strokeColor: isExtensionNode ? '#3b82f6' : '#FBBF24', strokeWeight: 4, fillColor: isExtensionNode ? '#1e3a8a' : '#1B4D3E', fillOpacity: 0.4, map, zIndex: 1 });
                poly.addListener('click', () => { 
                    handleEditUnit(ent.id, unit);
                });
                polygonsRef.current.push(poly);
            });
        });

        // Pan if needed
        if (selectedEnterprise && !isPlacingMode && !isTracing && !showEnterpriseModal && !isLoading) {
            map.panTo(selectedEnterprise.gps);
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
          units: editingEntId ? selectedEnterprise?.units : [], 
          resources: editingEntId ? selectedEnterprise?.resources : [], 
          processes: editingEntId ? selectedEnterprise?.processes : [], 
          operations: editingEntId ? selectedEnterprise?.operations : [], 
          usageLogs: editingEntId ? selectedEnterprise?.usageLogs : []
      };
      let finalId = editingEntId;
      if (editingEntId) await db.update<any>(Table.Enterprises, editingEntId, entData);
      else { const inserted = await db.insert<any>(Table.Enterprises, entData); finalId = inserted.id; }
      setShowEnterpriseModal(false); setEditingEntId(null); await loadAllData(finalId!);
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

  const estimatedVolume = useMemo(() => {
    const area = parseFloat(newUnit.area) || 0;
    const h = parseFloat(newUnit.height as any) || 0;
    return (area * 10000 * h).toLocaleString();
  }, [newUnit.area, newUnit.height]);

  const renderOperations = () => {
    if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 flex flex-col items-center gap-2"><Layers size={48}/><p className="text-sm font-black uppercase">Select an Enterprise Node</p></div>;
    
    const ops = (selectedEnterprise.operations || []) as Operation[];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardList size={20}/></div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">National Cycle Logs</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Audit Trail of {selectedEnterprise.name}</p>
                    </div>
                </div>
                <button onClick={() => setShowOpModal(true)} className="px-5 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-emerald-900 transition-all"><Plus size={14}/> Log Activity</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {ops.length > 0 ? ops.sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()).map(op => (
                    <div key={op.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    op.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                                    op.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 
                                    'bg-slate-50 text-slate-400'
                                }`}>{op.status}</span>
                                <h5 className="text-sm font-black text-slate-800">{op.activity}</h5>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase"><MapIcon size={12}/> {op.field}</div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase"><CalendarIcon size={12}/> {new Date(op.startDateTime).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase"><Wallet size={12}/> E {op.accumulatedCost?.toLocaleString() || 0}</div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${op.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#FBBF24]'}`} style={{ width: `${op.progress}%` }} />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {op.status !== 'Completed' && (
                                <button 
                                    onClick={() => { setFinishingOp(op); setShowHarvestModal(true); }}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <TrendingUp size={14}/> Finalize
                                </button>
                            )}
                            <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={16}/></button>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center space-y-4">
                        <Archive className="mx-auto text-slate-200" size={64}/>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Cycles Logged in Node</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderCalendar = () => {
      const scheduled = enterprises.flatMap(ent => (ent.operations || []).filter((o:any) => o.status === 'Scheduled'));
      
      return (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                  <div className="relative z-10 flex items-center gap-6">
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10"><CalendarDays size={32} className="text-[#FBBF24]"/></div>
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight">National Agenda</h3>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Institutional Chronology Node</p>
                      </div>
                  </div>
                  <CalendarIcon size={200} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none rotate-12" />
              </div>

              <div className="space-y-4">
                  {scheduled.length > 0 ? scheduled.sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()).map(op => (
                      <div key={op.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center group hover:shadow-xl transition-all">
                          <div className="bg-emerald-50 text-emerald-700 w-20 h-20 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-black uppercase opacity-50">{new Date(op.startDateTime).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-2xl font-black">{new Date(op.startDateTime).getDate()}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                              <h4 className="text-xl font-black text-slate-800">{op.activity}</h4>
                              <div className="flex gap-4 items-center">
                                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><MapIcon size={14}/> {op.field}</span>
                                  <span className="flex items-center gap-1.5 text-[10px] font-black text-[#1B4D3E] uppercase"><Timer size={14}/> {new Date(op.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                          </div>
                          <button className="px-8 py-3 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl group-hover:scale-105 transition-all">Start Node</button>
                      </div>
                  )) : (
                      <div className="py-32 text-center space-y-6">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border-2 border-dashed border-slate-100"><Check size={40}/></div>
                          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">All Cycles Active or Finalized</p>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderReports = () => {
    if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 flex flex-col items-center gap-2"><BarChart3 size={48}/><p className="text-sm font-black uppercase">Select Enterprise for Analytics</p></div>;

    const opCosts = (selectedEnterprise.operations || []).map((o: any) => ({
        name: o.activity,
        cost: o.accumulatedCost || 0
    })).slice(0, 5);

    const areaData = (selectedEnterprise.units || []).map((u: any) => ({
        name: u.name,
        value: parseFloat(u.area) || 0
    }));

    const COLORS = ['#1B4D3E', '#FBBF24', '#4F46E5', '#EF4444', '#10B981'];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Valuation</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-[#1B4D3E]">E {selectedEnterprise.operations?.reduce((s:number, o:any) => s + (o.accumulatedCost || 0), 0).toLocaleString()}</h3>
                        <TrendingUp className="text-emerald-500" size={24}/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Footprint</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-indigo-600">{selectedEnterprise.units?.length || 0} <span className="text-xs font-bold text-slate-300">Nodes</span></h3>
                        <Layers2 className="text-indigo-400" size={24}/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Yield</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-[#FBBF24]">12.4k <span className="text-xs font-bold text-slate-300">Tons</span></h3>
                        <Sprout className="text-[#FBBF24]" size={24}/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Institutional Cost Distribution</h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={opCosts}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                                <YAxis fontSize={10} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                                <RechartsTooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="cost" fill="#1B4D3E" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Spatial Area Allocation</h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={areaData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                    {areaData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
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
                {(['REPORTS', 'SETUP', 'RESOURCES', 'OPERATIONS', 'CALENDAR'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#1B4D3E]' : 'text-slate-400'}`}>
                        {tab === 'SETUP' && <MapIcon size={14}/>}
                        {tab === 'RESOURCES' && <GraduationCap size={14}/>}
                        {tab === 'OPERATIONS' && <Zap size={14}/>}
                        {tab === 'CALENDAR' && <CalendarIcon size={14}/>}
                        {tab === 'REPORTS' && <BarChart3 size={14}/>}
                        {tab === 'SETUP' ? 'Setup' : 
                         tab === 'RESOURCES' ? (isExtension ? 'Training Kit' : 'Resources') :
                         tab === 'OPERATIONS' ? (isExtension ? 'Outreach Logs' : 'Cycle Logs') :
                         tab === 'CALENDAR' ? 'Schedule' : (isExtension ? 'Reach Analytics' : 'Performance')}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#FBBF24] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
            {activeTab === 'SETUP' && (
                <div className="space-y-4 animate-fade-in flex flex-col h-full overflow-hidden pb-10">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
                        <div className="flex items-center gap-4"><div className="p-2 bg-blue-50 rounded-xl text-blue-600"><MapPin size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{isExtension ? 'Regional Jurisdiction' : 'Spatial Infrastructure'}</h3></div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsPlacingMode(!isPlacingMode); setIsTracing(false); if(drawingManager) drawingManager.setDrawingMode(null); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isPlacingMode ? 'bg-orange-500 text-white' : 'bg-[#1B4D3E] text-white'}`}>{isPlacingMode ? 'Cancel' : (isExtension ? 'Add Hub' : 'New Hub')}</button>
                            <button disabled={!selectedEntId} onClick={() => { setIsTracing(!isTracing); setIsPlacingMode(false); if (drawingManager) drawingManager.setDrawingMode(!isTracing ? (window as any).google.maps.drawing.OverlayType.POLYGON : null); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${isTracing ? 'bg-rose-500 text-white' : 'bg-[#FBBF24] text-[#1B4D3E] disabled:opacity-30'}`}>{isTracing ? 'Cancel' : 'Trace Unit'}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
                        <div ref={mapContainerRef} className={`lg:col-span-3 relative bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden h-[400px] lg:h-full group/map ${isFullscreen ? 'fixed inset-0 z-[200] !m-0 !rounded-none' : ''}`}>
                            {(isLoading || isResolvingGIS) && (<div className="absolute inset-0 z-40 bg-slate-100/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#1B4D3E]" size={32} />{isResolvingGIS && <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4D3E]">Analyzing GIS Node...</span>}</div>)}
                            <div ref={mapRef} className="w-full h-full z-10 bg-slate-200" />
                            
                            {isPlacingMode && (
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-3 bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-3 border-2 border-white">
                                <Target size={16} /> Tap Map to Place Node
                              </div>
                            )}

                            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                <button onClick={handleLocateMe} className="p-3 bg-white text-[#1B4D3E] rounded-xl shadow-xl hover:bg-emerald-50 transition-all border border-slate-200" title="Find my location"><LocateFixed size={20}/></button>
                                <button onClick={toggleFullscreen} className="p-3 bg-white text-[#1B4D3E] rounded-xl shadow-xl hover:bg-emerald-50 transition-all border border-slate-200" title="Full Screen Map"><Maximize size={20}/></button>
                            </div>
                        </div>
                        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12}/> {isExtension ? 'Extension Hubs' : 'Production Hubs'}</h4>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {enterprises.length > 0 ? enterprises.map(ent => (
                                    <div key={ent.id} className="space-y-1">
                                        <div className="group relative">
                                            <button onClick={() => startTracing(ent.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                                                <h5 className="font-black text-xs truncate pr-6">{ent.name}</h5>
                                                <p className={`text-[8px] font-black uppercase mt-0.5 ${selectedEntId === ent.id ? 'text-[#FBBF24]' : 'text-slate-400'}`}>{ent.region} • {ent.tinkhundla || 'General'}</p>
                                            </button>
                                            <button onClick={() => handleEditEnterprise(ent)} className={`absolute top-4 right-3 p-1 rounded-lg transition-all ${selectedEntId === ent.id ? 'text-white/50 hover:text-white' : 'text-slate-300 hover:text-[#1B4D3E]'}`}>
                                                <Edit size={14}/>
                                            </button>
                                        </div>
                                        
                                        {/* Nested Units List */}
                                        {ent.units?.length > 0 && (
                                          <div className="pl-4 space-y-1.5 py-1">
                                            {ent.units.map((unit: any) => (
                                              <div key={unit.id} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 group">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-[9px] font-black text-slate-700 truncate">{unit.name}</p>
                                                  <p className="text-[7px] font-bold text-slate-400 uppercase">{unit.area} Ha</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <button onClick={() => handleAddResourceToUnit(ent.id, unit)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Add Initial Resource"><Plus size={12}/></button>
                                                  <button onClick={() => handleEditUnit(ent.id, unit)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Unit"><Edit3 size={12}/></button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                )) : (
                                  <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
                                    <MapPinOff size={24} />
                                    <p className="text-[9px] font-black uppercase">No Nodes Registered</p>
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'RESOURCES' && (
                <div className="space-y-6 animate-fade-in flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
                        <div className="flex gap-4">
                            {(['RESOURCES', 'LOGS'] as const).map(sub => (
                                <button key={sub} onClick={() => setInventorySubTab(sub)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${inventorySubTab === sub ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{sub === 'RESOURCES' ? (isExtension ? 'Training Kit' : 'RESOURCES') : 'Usage Logs'}</button>
                            ))}
                        </div>
                        {inventorySubTab === 'RESOURCES' && (
                             <button onClick={() => { setShowAssetModal(true); setActiveUnitForInventory(null); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"><Plus size={14}/> Add Resource</button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20">
                        {inventorySubTab === 'RESOURCES' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {(selectedEnterprise?.resources || []).map((res: Resource) => (
                                    <div key={res.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                        <div className="h-40 bg-slate-100 relative">
                                            {res.image ? <img src={res.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Tractor size={48}/></div>}
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-lg text-[8px] font-black text-slate-500 uppercase border border-white/50">{res.type}</div>
                                        </div>
                                        <div className="p-6 flex-1 space-y-4">
                                            <div>
                                                <h5 className="font-black text-slate-800 text-sm truncate">{res.name}</h5>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{res.category}</p>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${res.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{res.status}</span>
                                                <p className="text-xs font-black text-indigo-600">E {res.unitCost?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'OPERATIONS' && renderOperations()}
            {activeTab === 'CALENDAR' && renderCalendar()}
            {activeTab === 'REPORTS' && renderReports()}
        </div>

        {/* Modals for Enterprise, Unit, Asset, Op, Harvest... */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Building2 size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingEntId ? 'Update Node details' : (isExtension ? 'Add Extension Hub' : 'Register Production Hub')}</h3>
                                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest mt-1">National Registry Entry</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowEnterpriseModal(false); setEditingEntId(null); }}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-5">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Name</label><input autoFocus value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Dlamini Green Estate" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrative Region</label><select value={newEnterprise.region} onChange={(e)=>setNewEnterprise({...newEnterprise, region: e.target.value as Region})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none"><option value={Region.Hhohho}>Hhohho</option><option value={Region.Manzini}>Manzini</option><option value={Region.Shiselweni}>Shiselweni</option><option value={Region.Lubombo}>Lubombo</option></select></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinkhundla Node</label><input value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} placeholder="Constituency" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                          <MapPin size={20} className="text-emerald-600 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">GIS Reference</p>
                            <p className="text-[11px] text-emerald-700 font-bold leading-relaxed">{newEnterprise.address || 'Point established via GPS verification.'}</p>
                            <p className="text-[9px] text-emerald-600/60 font-mono">{newEnterprise.lat}, {newEnterprise.lng}</p>
                          </div>
                        </div>
                        <button onClick={handleAddEnterprise} disabled={!newEnterprise.name} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-[#143d31] disabled:opacity-30 transition-all active:scale-95">{editingEntId ? 'Commit Update' : 'Commit Node to National Registry'}</button>
                    </div>
                </div>
            </div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-emerald-800 p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Layers2 size={24} className="text-emerald-400"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingUnitId ? 'Update Production Unit' : (isExtension ? 'Add Outreach Node' : 'Register Production Unit')}</h3>
                                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">Spatial Resource Entry</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowUnitModal(false); setEditingUnitId(null); }}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-5">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name / Identifier</label><input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Upper Greenhouse A" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" /></div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area (Hectares)</label><div className="relative"><Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input value={newUnit.area} onChange={(e)=>setNewUnit({...newUnit, area: e.target.value})} className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Height (Metres)</label><div className="relative"><BoxSelect className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input type="number" value={newUnit.height} onChange={(e)=>setNewUnit({...newUnit, height: parseFloat(e.target.value) || 0})} className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div></div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Code</label><div className="relative"><Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input readOnly value={newUnit.unitNumber} className="w-full pl-11 pr-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl font-mono text-xs font-black text-slate-500" /></div></div>
                        </div>

                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm"><HardHat size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Volumetric Capacity</p>
                                    <p className="text-lg font-black text-emerald-900">{estimatedVolume} <span className="text-xs opacity-50 uppercase">m³</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Derived Estimate</p>
                            </div>
                        </div>

                        {editingUnitId && (
                           <button onClick={async () => {
                               const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
                               ent.units = ent.units.filter((u:any) => u.id !== editingUnitId);
                               await db.update<any>(Table.Enterprises, selectedEntId!, { units: ent.units });
                               setShowUnitModal(false); setEditingUnitId(null); await loadAllData(selectedEntId!);
                           }} className="w-full py-3 text-rose-500 font-black uppercase text-[9px] tracking-widest hover:bg-rose-50 rounded-xl transition-all">Remove Spatial Node</button>
                        )}
                        <button onClick={handleSaveUnit} className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-emerald-900 transition-all">{editingUnitId ? 'Commit Changes' : 'Finalize Spatial Logic'}</button>
                    </div>
                </div>
            </div>
        )}

        {showAssetModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                    <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><PackagePlus size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Institutional Resource</h3>
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Inventory Node Initialization</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAssetModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                        {activeUnitForInventory && (
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-[8px] font-black text-indigo-400 uppercase">Target Unit</p>
                              <p className="text-xs font-black text-indigo-800 uppercase">{activeUnitForInventory.name}</p>
                            </div>
                            <HardHat size={16} className="text-indigo-600"/>
                          </div>
                        )}
                        
                        <div className="flex gap-6">
                            <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-100 transition-all">
                                {newAsset.image ? (
                                    <img src={newAsset.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera size={24} className="text-slate-300" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Snapshot</span>
                                    </div>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'asset')} />
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-3">
                                <button 
                                    onClick={handleResourceAIAnalyze}
                                    disabled={!newAsset.image || isAnalyzingAsset}
                                    className="w-full py-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-indigo-100 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                                >
                                    {isAnalyzingAsset ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                    AI Scan Identity
                                </button>
                                <p className="text-[8px] text-slate-400 font-bold uppercase text-center px-4 leading-relaxed">
                                    Analyze item vision to automatically extract technical metadata.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Name</label><input value={newAsset.name} onChange={(e)=>setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Massey Ferguson Tractor" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label><select value={newAsset.type} onChange={(e)=>setNewAsset({...newAsset, type: e.target.value as ResourceType})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none"><option value={ResourceType.Machinery}>Machinery</option><option value={ResourceType.Equipment}>Equipment</option><option value={ResourceType.Personnel}>Personnel</option><option value={ResourceType.Consumable}>Consumable Input</option></select></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label><input value={newAsset.category} onChange={(e)=>setNewAsset({...newAsset, category: e.target.value})} placeholder="e.g. Tillage" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Specs</label><textarea value={newAsset.details} onChange={(e)=>setNewAsset({...newAsset, details: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-xs outline-none h-24 resize-none" placeholder="Describe resource attributes..." /></div>
                        </div>

                        <button onClick={handleSaveAsset} className="w-full py-5 bg-indigo-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-indigo-950 transition-all">Commit to Node Inventory</button>
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><Zap size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Node Activity Log</h3>
                                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest mt-1">Operational Cycle Entry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowOpModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-5">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Description</label><input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="e.g. Basal Fertilizer Application" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Unit</label><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                                <option value="">Select Unit...</option>
                                {(selectedEnterprise?.units || []).map((u:any) => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" value={newOp.startDateTime} onChange={(e)=>setNewOp({...newOp, startDateTime: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>
                        <button onClick={handleSaveOp} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-[#143d31] transition-all">Log Cycle Step</button>
                    </div>
                </div>
            </div>
        )}

        {showHarvestModal && finishingOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-emerald-900 p-10 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10"><Sprout size={32} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Harvest Node</h3>
                                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">Initializing Trade Hub Batch</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHarvestModal(false)}><X size={32}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produce Trade Name</label><input value={harvestForm.name} onChange={(e)=>setHarvestForm({...harvestForm, name: e.target.value})} placeholder="e.g. Grade A Yellow Maize" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield Quantity</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Price (E)</label><input type="number" value={harvestForm.price} onChange={(e)=>setHarvestForm({...harvestForm, price: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div>
                        </div>
                        <button onClick={handleFinalizeHarvest} className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-6 hover:bg-emerald-800 transition-all flex items-center justify-center gap-3">
                            <Archive size={18}/>
                            Commit Batch to National Trade
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Production;
