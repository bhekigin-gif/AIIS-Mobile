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
  Edit2,
  Map as MapIconLucide,
  Cuboid,
  Warehouse,
  Boxes,
  Trash2 as TrashIcon,
  Tag as TagIcon,
  CalendarDays as CalendarDaysIcon,
  BadgeCheck,
  Timer as TimerIcon,
  AlertTriangle,
  GanttChartSquare,
  ChevronRight as ChevronRightIcon,
  UserCheck2,
  Contact2,
  Ruler as RulerIcon,
  Image as ImageIcon,
  Wind
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
    activityDate: string;
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
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [activeUnitForInventory, setActiveUnitForInventory] = useState<any>(null);
  const [filterUnitId, setFilterUnitId] = useState<string>('All');
  
  // Interaction Refs
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const isPlacingModeRef = useRef(false);
  const [isTracingUnit, setIsTracingUnit] = useState(false);
  const isTracingUnitRef = useRef(false);

  // Selection state for resource addition
  const [resourceAddMode, setResourceAddMode] = useState<'Manual' | 'Catalogue' | 'Workforce'>('Catalogue');
  const [selectedCatItems, setSelectedCatItems] = useState<SelectedCatalogueItem[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [catDivisionFilter, setCatDivisionFilter] = useState('All');

  // Form states
  const [newEnterprise, setNewEnterprise] = useState({ name: '', region: Region.Manzini, tinkhundla: '', address: '', lat: 0, lng: 0 });
  const [newUnit, setNewUnit] = useState({ id: '', name: '', unitNumber: '', area: '', height: '0', volume: '0', path: [] as any[] });
  const [newAsset, setNewAsset] = useState<Partial<Resource>>({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, initialValue: 0, lifespanHours: 1000, image: '', assignedUnitId: '', unitNumber: 'Unit' });
  const [activityForm, setActivityForm] = useState({ activity: '', resourceId: '', quantity: 1, duration: 1, activityDate: new Date().toISOString().split('T')[0] });
  const [harvestForm, setHarvestForm] = useState<any>({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '', startDate: new Date().toISOString().split('T')[0], duration: 1, traceId: '', manufacturer: '', subCategory: '', tradeName: '', division: '', tinkhundla: '' });
  const [newOp, setNewOp] = useState({ activity: '', field: '', startDateTime: new Date().toISOString().split('T')[0] });

  const [systemMetadata, setSystemMetadata] = useState<any>(null);

  const loadAllData = async (newSelectedId?: string) => {
    setIsLoading(true);
    const [allUsers, allCatalogue, allEnterprises, metadata] = await Promise.all([
        View_All_System_Users(),
        View_Master_Catalogue(),
        db.getAll<any>(Table.Enterprises),
        Get_System_Metadata()
    ]);
    
    setMasterCatalogue(allCatalogue);
    setSystemMetadata(metadata);
    if (user?.organization) {
        setOrgEmployees(allUsers.filter(u => u.organization === user.organization));
    }

    let scoped = allEnterprises;
    if (user && user.role !== UserRole.Government) {
        scoped = allEnterprises.filter(e => e.ownerId === user.id || e.organizationId === user.organizationId);
        
        // Fix for empty Spatial Registry: If no enterprise exists for this producer, initialize a default one based on profile
        if (scoped.length === 0 && user.actorType === ActorType.Farmer) {
            const defaultEnt = {
                id: `ENT-${Date.now()}`,
                name: `${user.organization || user.name} Hub`,
                ownerId: user.id,
                organizationId: user.organizationId,
                region: user.region || Region.Manzini,
                gps: { lat: -26.48, lng: 31.37 },
                tinkhundla: user.tinkhundla || '',
                address: 'Initialized from User Profile',
                units: [], resources: [], operations: []
            };
            await db.insert(Table.Enterprises, defaultEnt);
            scoped = [defaultEnt];
        }
    }
    setEnterprises(scoped);
    if (newSelectedId) setSelectedEntId(newSelectedId);
    else if (scoped.length > 0 && !selectedEntId) setSelectedEntId(scoped[0].id);
    setIsLoading(false);
  };

  useEffect(() => { loadAllData(); }, [user]);

  const selectedEnterprise = useMemo(() => enterprises.find(e => e.id === selectedEntId) || null, [enterprises, selectedEntId]);

  const filteredResources = useMemo(() => {
    if (!selectedEnterprise) return [];
    const resources = selectedEnterprise.resources || [];
    if (filterUnitId === 'All') return resources;
    return resources.filter((r: Resource) => r.assignedUnitId === filterUnitId);
  }, [selectedEnterprise, filterUnitId]);

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
        const areaInM2 = (window as any).google.maps.geometry.spherical.computeArea(event.overlay.getPath());
        const areaInHa = areaInM2 / 10000;
        setNewUnit({ 
          id: '', 
          name: '', 
          unitNumber: '', 
          area: areaInHa.toFixed(4), 
          height: '0', 
          volume: '0', 
          path 
        });
        setShowUnitModal(true);
        event.overlay.setMap(null); 
        dm.setDrawingMode(null);
        setIsTracingUnit(false);
      }
    });

    map.addListener('click', (e: any) => {
        if (isPlacingModeRef.current) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                let foundRegion = Region.Manzini;
                let foundTinkhundla = "";
                let foundAddress = "";
                let nearestPoI = "";
                let street = "";

                if (status === "OK" && results[0]) {
                    foundAddress = results[0].formatted_address;
                    results[0].address_components.forEach((c: any) => {
                        const types = c.types;
                        const name = c.long_name;
                        if (types.includes("administrative_area_level_1")) {
                            if (name.includes("Manzini")) foundRegion = Region.Manzini;
                            else if (name.includes("Hhohho")) foundRegion = Region.Hhohho;
                            else if (name.includes("Lubombo")) foundRegion = Region.Lubombo;
                            else if (name.includes("Shiselweni")) foundRegion = Region.Shiselweni;
                        }
                        if (types.includes("point_of_interest") || types.includes("establishment")) nearestPoI = name;
                        if (types.includes("route")) street = name;
                        const allTink = TINKHUNDLA[foundRegion] || [];
                        const match = allTink.find(t => name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(name.toLowerCase()));
                        if (match && !foundTinkhundla) foundTinkhundla = match;
                    });
                    const constructedAddress = [nearestPoI, street].filter(Boolean).join(", ") || foundAddress;
                    setNewEnterprise(prev => ({ ...prev, lat, lng, region: foundRegion, tinkhundla: foundTinkhundla, address: constructedAddress }));
                } else {
                    setNewEnterprise(prev => ({ ...prev, lat, lng }));
                }
                setShowEnterpriseModal(true);
                setIsPlacingMode(false);
            });
        }
    });

    return () => {
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

  const handleSaveEnterprise = async () => {
    if (editingEnt) {
        const ent = await db.getById<any>(Table.Enterprises, editingEnt.id);
        ent.name = newEnterprise.name;
        ent.region = newEnterprise.region;
        ent.tinkhundla = newEnterprise.tinkhundla;
        ent.address = newEnterprise.address;
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
            address: newEnterprise.address,
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
        ent.units = ent.units.map((u: any) => u.id === editingUnit.id ? { ...u, name: newUnit.name, height: newUnit.height, volume: newUnit.volume } : u);
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
      if (window.confirm("Permanently de-register this Enterprise Node?")) {
          await db.delete(Table.Enterprises, id);
          loadAllData();
      }
  };

  const handleDeleteUnit = async (entId: string, unitId: string) => {
      const ent = await db.getById<any>(Table.Enterprises, entId);
      const unit = ent.units?.find((u: any) => u.id === unitId);
      if (!unit) return;

      const hasInputs = ent.resources?.some((r: any) => r.assignedUnitId === unitId);
      const hasOps = ent.operations?.some((o: any) => o.field === unit.name);

      if (hasInputs || hasOps) {
          alert("Abolition Prohibited: This unit has established inventory nodes or operational chronology records. Move assets or complete history before removing unit.");
          return;
      }

      if (window.confirm("Abolish this operational unit perimeter?")) {
          ent.units = ent.units.filter((u: any) => u.id !== unitId);
          await db.update(Table.Enterprises, entId, ent);
          loadAllData(entId);
      }
  };

  const handleEditAsset = (res: Resource) => {
    setEditingAssetId(res.id);
    setResourceAddMode('Manual');
    setNewAsset({ ...res, assignedUnitId: res.assignedUnitId });
    setShowAssetModal(true);
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!selectedEntId) return;
    if (window.confirm("Permanently remove this item from the unit inventory?")) {
      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      ent.resources = ent.resources.filter((r: Resource) => r.id !== assetId);
      await db.update(Table.Enterprises, selectedEntId, ent);
      await loadAllData(selectedEntId);
    }
  };

  const handleSaveAsset = async () => {
      if (!selectedEntId) return;
      const targetUnitId = activeUnitForInventory?.id || newAsset.assignedUnitId;
      if (!targetUnitId) { alert("Operational Unit assignment is mandatory."); return; }

      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      let resources = ent.resources || [];

      if (editingAssetId) {
        const idx = resources.findIndex((r: Resource) => r.id === editingAssetId);
        if (idx !== -1) {
            resources[idx] = { ...resources[idx], ...newAsset, assignedUnitId: targetUnitId };
            if (!resources[idx].startingQuantity) resources[idx].startingQuantity = resources[idx].quantity;
        }
      } else {
        const newAssets: Resource[] = [];
        if (resourceAddMode === 'Catalogue') {
            selectedCatItems.forEach(sel => {
                newAssets.push({
                    id: `AST-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                    type: (sel.item.productType === 'Machinery' || sel.item.division.includes('Mechanisation')) ? ResourceType.Machinery : ResourceType.Consumable, 
                    name: sel.item.tradeName, unitNumber: sel.item.unit,
                    category: sel.item.category, unitCost: (sel.initialValue / (sel.quantity || 1)), quantity: sel.quantity, startingQuantity: sel.quantity, status: 'Available',
                    assignedUnitId: targetUnitId, details: sel.item.description,
                    initialValue: sel.initialValue, lifespanHours: sel.lifespanHours || 1000, totalUsageHours: 0,
                    catalogueRef: sel.item.registrationId
                });
            });
        } else if (resourceAddMode === 'Workforce') {
            const emp = orgEmployees.find(e => e.id === newAsset.linkedUserId);
            if (emp) {
                newAssets.push({
                    id: `WKF-${Date.now()}`,
                    type: ResourceType.Personnel, name: emp.name, unitNumber: 'Hrs', category: 'Labour',
                    unitCost: newAsset.unitCost || 0, quantity: newAsset.quantity || 0, startingQuantity: newAsset.quantity || 0,
                    assignedUnitId: targetUnitId, status: 'Available', linkedUserId: emp.id
                });
            }
        } else {
            newAssets.push({ ...newAsset, id: `AST-${Date.now()}`, startingQuantity: newAsset.quantity, status: 'Available', assignedUnitId: targetUnitId } as Resource);
        }
        resources = [...resources, ...newAssets];
      }

      ent.resources = resources;
      await db.update(Table.Enterprises, selectedEntId, ent);
      setShowAssetModal(false); setEditingAssetId(null); setSelectedCatItems([]);
      setNewAsset({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, initialValue: 0, lifespanHours: 1000, image: '', assignedUnitId: '', unitNumber: 'Unit' });
      await loadAllData(selectedEntId);
  };

  const handleLogActivity = async () => {
    if (!selectedOp || !activityForm.resourceId) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
    const res = ent.resources.find((r: any) => r.id === activityForm.resourceId);
    
    if (res && (activityForm.quantity > res.quantity || res.quantity <= 0)) {
        alert(`Insufficient stock. Only ${res.quantity} ${res.unitNumber} available.`);
        return;
    }
    
    const cost = (res?.unitCost || 0) * (res?.type === ResourceType.Personnel ? activityForm.duration : activityForm.quantity);
    
    const log: ActivityLog = {
        id: editingLogId || `LOG-${Date.now()}`, 
        timestamp: new Date().toISOString(), activityDate: activityForm.activityDate,
        activity: activityForm.activity || selectedOp.activity, resourceId: activityForm.resourceId, 
        resourceName: res?.name || 'Unknown', quantityUsed: activityForm.quantity, 
        durationHours: activityForm.duration, cost
    };

    if (res) {
        const qtyRatio = activityForm.quantity / (res.quantity || 1);
        const valueReduction = (res.initialValue || 0) * qtyRatio;
        res.initialValue = Math.max(0, (res.initialValue || 0) - valueReduction);
        res.quantity -= activityForm.quantity;
        
        const lowStockThreshold = (res.startingQuantity || 0) * 0.2;
        if (res.quantity <= lowStockThreshold) res.status = 'Low Stock';
    }

    const op = ent.operations.find((o: any) => o.id === selectedOp.id);
    if (editingLogId) {
        op.logs = op.logs.map((l: any) => l.id === editingLogId ? log : l);
    } else {
        op.logs = [...(op.logs || []), log];
    }
    op.accumulatedCost = op.logs.reduce((sum: number, l: any) => sum + (l.cost || 0), 0);
    op.status = 'In Progress';

    await db.update(Table.Enterprises, selectedEntId!, ent);
    setShowActivityModal(false); setEditingLogId(null);
    setActivityForm({ activity: '', resourceId: '', quantity: 1, duration: 1, activityDate: new Date().toISOString().split('T')[0] });
    await loadAllData(selectedEntId!); setSelectedOp(op);
  };

  const handleFinalizeHarvest = async () => {
    if (!selectedEntId || !selectedOp || !harvestForm.name) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
    const op = ent.operations.find((o: any) => o.id === selectedOp.id);
    if (!op) return;
    
    const productId = harvestForm.traceId;
    const newProduct: SalesProduct = {
      id: productId, name: harvestForm.name, category: harvestForm.category, price: harvestForm.price, unit: harvestForm.unit,
      quantity: harvestForm.quantity, description: harvestForm.description, dateListed: new Date().toISOString(),
      status: 'Pending Approval', image: harvestForm.image || PLACE_HOLDER_IMAGE,
      sellerName: selectedEnterprise?.name || user?.name || 'Producer',
      sellerId: user?.organizationId || user?.id, region: (selectedEnterprise?.region || user?.region) as Region,
      tinkhundla: selectedEnterprise?.tinkhundla || user?.tinkhundla,
      sourceUnit: op.field, operationId: op.id, manufacturer: `${user?.firstName} ${user?.lastName}`
    };
    await addProductToRegistry(newProduct);
    setProducts(prev => [...prev, newProduct]);
    
    const harvestLog: ActivityLog = {
      id: `HARVEST-${Date.now()}`, timestamp: new Date().toISOString(),
      activityDate: harvestForm.startDate, activity: 'Harvest Log',
      resourceId: 'SYSTEM', resourceName: harvestForm.name,
      quantityUsed: harvestForm.quantity, durationHours: harvestForm.duration, cost: 0
    };
    
    op.logs = [...(op.logs || []), harvestLog];

    await db.update(Table.Enterprises, selectedEntId, ent);
    setShowHarvestModal(false);
    setHarvestForm({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '', startDate: new Date().toISOString().split('T')[0], duration: 1, traceId: '', manufacturer: '', subCategory: '', tradeName: '', division: '', tinkhundla: '' });
    await loadAllData(selectedEntId); 
  };

  const handleCompleteOp = async (opId: string) => {
      if (!selectedEntId) return;
      if (window.confirm("Mark this operation cycle as Completed? No further activities can be logged.")) {
          const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
          const op = ent.operations.find((o: any) => o.id === opId);
          op.status = 'Completed';
          op.endDateTime = new Date().toISOString();
          await db.update(Table.Enterprises, selectedEntId, ent);
          await loadAllData(selectedEntId); setSelectedOp(op);
      }
  };

  const handleEditOp = (op: any) => {
      setEditingOpId(op.id);
      setNewOp({ activity: op.activity, field: op.field, startDateTime: op.startDateTime });
      setShowOpModal(true);
  };

  const handleDeleteOp = async (opId: string) => {
      if (!selectedEntId) return;
      if (window.confirm("Permanently delete this operation cycle? All activity logs will be lost.")) {
          const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
          ent.operations = ent.operations.filter((o: any) => o.id !== opId);
          await db.update(Table.Enterprises, selectedEntId, ent);
          await loadAllData(selectedEntId); setSelectedOp(null);
      }
  };

  const handleDeleteLog = async (logId: string) => {
      if (!selectedEntId || !selectedOp) return;
      if (window.confirm("Delete this activity log? Item quantities will NOT be automatically restored.")) {
          const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
          const op = ent.operations.find((o: any) => o.id === selectedOp.id);
          op.logs = op.logs.filter((l: any) => l.id !== logId);
          op.accumulatedCost = op.logs.reduce((sum: number, l: any) => sum + (l.cost || 0), 0);
          await db.update(Table.Enterprises, selectedEntId, ent);
          await loadAllData(selectedEntId); setSelectedOp(op);
      }
  };

  const masterCatalogueDivisions = useMemo(() => {
      const divisions = masterCatalogue.map(i => i.division);
      return ['All', ...Array.from(new Set(divisions))];
  }, [masterCatalogue]);

  const filteredCatalogue = useMemo(() => {
      return masterCatalogue.filter(item => {
          const matchesDivision = catDivisionFilter === 'All' || item.division === catDivisionFilter;
          const matchesSearch = item.tradeName.toLowerCase().includes(catSearch.toLowerCase());
          return matchesDivision && matchesSearch;
      });
  }, [masterCatalogue, catDivisionFilter, catSearch]);

  const renderReports = () => {
    if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 h-full flex flex-col justify-center items-center"><PieChart size={64} className="mb-4 text-[#1B4D3E]"/><p className="text-xs font-black uppercase text-[#1B4D3E]">Select an Enterprise Node in Setup</p></div>;
    
    const ops = selectedEnterprise.operations || [];
    const resources = selectedEnterprise.resources || [];
    const totalCost = ops.reduce((s:number, o:any) => s + (o.accumulatedCost || 0), 0);
    const totalResourceValue = resources.reduce((s:number, r:any) => s + (r.initialValue || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-white/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1B4D3E] p-6 rounded-[2rem] shadow-xl flex flex-col justify-between h-36 group relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-300 uppercase tracking-widest">Operational Sunk Cost</p>
                        <h3 className="text-2xl font-black text-[#FBBF24] mt-2">E {totalCost.toLocaleString()}</h3>
                    </div>
                    <Coins className="absolute -bottom-4 -right-4 text-white/5 size-24 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-36 hover:border-[#FBBF24] transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Asset Value</p>
                    <h3 className="text-2xl font-black text-[#1B4D3E] mt-2">E {totalResourceValue.toLocaleString()}</h3>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#FBBF24] uppercase mt-2"><TrendingUp size={12}/> Vetted Registry Active</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-36 hover:border-[#FBBF24] transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</p>
                    <h3 className="text-2xl font-black text-[#1B4D3E] mt-2">{selectedEnterprise.units?.length || 0}</h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-[#FBBF24] h-full w-2/3 rounded-full"/></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[380px] flex flex-col shadow-lg">
                    <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart4 size={18} className="text-[#FBBF24]"/> Cycle Cost Index</h4>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ops}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="activity" fontSize={9} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <YAxis fontSize={9} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="accumulatedCost" fill="#1B4D3E" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[380px] flex flex-col shadow-lg">
                    <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><PieChart size={18} className="text-[#FBBF24]"/> Asset Allocation</h4>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={resources.map((r:any) => ({ name: r.name, value: r.initialValue || 0 }))} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {resources.map((_:any, i:number) => <Cell key={`cell-${i}`} fill={['#1B4D3E', '#FBBF24', '#10B981', '#4F46E5'][i % 4]} />)}
                                </Pie>
                                <RechartsTooltip />
                                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', paddingTop: '15px' }} />
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
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#1B4D3E] rounded-2xl text-[#FBBF24] shadow-lg"><MapIcon size={20}/></div>
                  <div>
                      <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-widest leading-none">Spatial Hub Control</h3>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">GIS Node Identity Mapping</p>
                  </div>
              </div>
              <button 
                onClick={() => {
                    setIsPlacingMode(!isPlacingMode);
                    if (isTracingUnit) { drawingManager.setDrawingMode(null); setIsTracingUnit(false); }
                }} 
                className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase shadow-xl transition-all flex items-center gap-2 border-4 border-white ${isPlacingMode ? 'bg-orange-600 text-white animate-pulse' : 'bg-[#1B4D3E] text-white hover:bg-emerald-900'}`}
              >
                  {isPlacingMode ? <X size={16}/> : <MapPinPlus size={16}/>}
                  {isPlacingMode ? 'Cancel Placement' : 'Register New Hub'}
              </button>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
              <div className="flex-1 bg-slate-200 relative overflow-hidden min-h-[300px]">
                  <div ref={mapRef} className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }} />
                  {isPlacingMode && (<div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-3 pointer-events-none"><MousePointerClick size={16}/> Tap map to anchor node</div>)}
                  {isTracingUnit && (<div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-8 py-3 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-3 pointer-events-none"><Pencil size={16}/> Tracing unit perimeter...</div>)}
              </div>
              <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col relative z-20">
                  <div className="px-6 py-4 bg-[#1B4D3E] text-white flex justify-between items-center sticky top-0 shrink-0">
                      <div><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FBBF24]">Node Registry</h4><p className="text-[8px] font-bold text-green-300 uppercase mt-0.5">Institutional Hubs</p></div>
                      <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white shadow-sm">{enterprises.length} Nodes</span>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-5 bg-slate-50 space-y-4">
                      {enterprises.map(ent => (
                          <div key={ent.id} className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col gap-4 group shadow-sm ${selectedEntId === ent.id ? 'bg-white border-[#FBBF24] ring-4 ring-[#FBBF24]/10' : 'bg-white border-slate-100 hover:border-[#1B4D3E]/30'}`} onClick={() => setSelectedEntId(ent.id)}>
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-3 rounded-xl shadow-lg transition-all ${selectedEntId === ent.id ? 'bg-[#1B4D3E] text-[#FBBF24] rotate-3 scale-110' : 'bg-slate-50 text-slate-400'}`}><Building2 size={20}/></div>
                                      <div><p className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight truncate max-w-[150px] leading-none">{ent.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{ent.region}</p></div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={(e) => { e.stopPropagation(); setEditingEnt(ent); setNewEnterprise({...ent}); setShowEnterpriseModal(true); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#1B4D3E] hover:text-white transition-all"><Edit2 size={12}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEnterprise(ent.id); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><Trash size={12}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); if(drawingManager){ setSelectedEntId(ent.id); setIsTracingUnit(true); drawingManager.setDrawingMode((window as any).google.maps.drawing.OverlayType.POLYGON); } }} className="p-2 bg-[#FBBF24] text-[#1B4D3E] rounded-lg shadow-lg hover:scale-110 transition-all" title="Trace Unit"><Layers2 size={14}/></button>
                                  </div>
                              </div>
                              <div className="space-y-3 pl-3 border-l-2 border-[#FBBF24]/30">
                                  {ent.units?.map((unit: any) => (
                                      <div key={unit.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 hover:bg-white hover:border-[#1B4D3E]/20 transition-all shadow-sm group/unit">
                                          <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/><p className="text-[11px] font-black text-[#1B4D3E]">{unit.name}</p></div>
                                              <div className="flex gap-1 opacity-0 group-hover/unit:opacity-100 transition-all">
                                                  <button onClick={(e) => { e.stopPropagation(); setEditingUnit(unit); setSelectedEntId(ent.id); setNewUnit({...unit}); setShowUnitModal(true); }} className="p-1.5 bg-white text-slate-400 rounded-lg hover:text-[#1B4D3E] shadow-sm"><Edit2 size={10}/></button>
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteUnit(ent.id, unit.id); }} className="p-1.5 bg-white text-slate-400 rounded-lg hover:text-rose-500 shadow-sm"><Trash size={10}/></button>
                                              </div>
                                          </div>
                                          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200/50 pt-2">
                                              <div className="flex justify-between items-center"><p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{unit.area} Ha</p>{parseFloat(unit.volume) > 0 && <p className="text-[8px] font-black text-[#1B4D3E] uppercase tracking-tight flex items-center gap-1"><Cuboid size={8} className="text-[#FBBF24]"/> {unit.volume} m³</p>}</div>
                                              <button onClick={(e) => { e.stopPropagation(); setActiveUnitForInventory(unit); setSelectedEntId(ent.id); setShowAssetModal(true); }} className="w-full py-1.5 bg-[#1B4D3E] text-[#FBBF24] rounded-lg text-[8px] font-black uppercase hover:bg-emerald-900 transition-all shadow-lg flex items-center justify-center gap-2"><Warehouse size={10}/> Stock Unit</button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderChronology = () => {
    if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 h-full flex flex-col justify-center items-center"><GanttChartSquare size={64} className="mb-4 text-[#1B4D3E]"/><p className="text-xs font-black uppercase text-[#1B4D3E]">Select an Enterprise Node in Setup</p></div>;
    const ops = selectedEnterprise.operations || [];
    if (ops.length === 0) return <div className="text-center py-20 opacity-30 h-full flex flex-col justify-center items-center"><GanttChartSquare size={64} className="mb-4 text-[#1B4D3E]"/><p className="text-xs font-black uppercase text-[#1B4D3E]">No operations registered</p></div>;

    const now = new Date();
    const startDate = new Date(now); startDate.setDate(now.getDate() - 5);
    const timelineDays = Array.from({ length: 35 }, (_, i) => {
        const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d;
    });

    return (
        <div className="h-full flex flex-col animate-fade-in bg-slate-50/30 overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                <div><h4 className="text-xl font-black uppercase text-[#1B4D3E] tracking-tight leading-none">Chronology Planning</h4><p className="text-[9px] font-bold text-[#FBBF24] uppercase tracking-[0.3em] mt-2">Gantt Visualization</p></div>
                <div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1B4D3E]"/><span className="text-[9px] font-black uppercase text-slate-400">Planned</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-[9px] font-black uppercase text-slate-400">Completed</span></div></div>
            </div>
            <div className="flex-1 overflow-auto no-scrollbar relative p-4">
                <div className="min-w-fit inline-block bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex sticky top-0 z-30 bg-slate-900 text-white"><div className="w-60 border-r border-slate-800 p-4 shrink-0 flex items-center"><span className="text-[9px] font-black uppercase tracking-widest text-[#FBBF24]">Activity Hub</span></div><div className="flex">{timelineDays.map((date, i) => (<div key={i} className={`w-[100px] border-r border-slate-800 p-2 text-center shrink-0 flex flex-col items-center justify-center ${date.toDateString() === now.toDateString() ? 'bg-[#FBBF24]/10' : ''}`}><span className="text-[8px] font-black uppercase text-slate-400">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</span><span className="text-xs font-black">{date.getDate()}</span><span className="text-[7px] font-bold uppercase opacity-40">{date.toLocaleDateString('en-GB', { month: 'short' })}</span></div>))}</div></div>
                    <div className="relative"><div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none" style={{ left: `calc(240px + 5 * 100px + ${((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100}px)` }}><div className="absolute top-0 -translate-x-1/2 px-2 py-1 bg-rose-500 text-white text-[8px] font-black uppercase rounded shadow-lg">Today</div></div>{ops.map((op: any) => { const opStart = new Date(op.startDateTime); const diffInDays = (opStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24); let duration = op.endDateTime ? (new Date(op.endDateTime).getTime() - opStart.getTime()) / (1000 * 3600 * 24) : 1; duration = Math.max(0.5, duration); return (<div key={op.id} className="flex border-b border-slate-50 group hover:bg-slate-50/50 transition-colors"><div className="w-60 border-r border-slate-100 p-4 shrink-0 flex flex-col justify-center"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${op.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#1B4D3E] animate-pulse'}`}/><p className="text-[11px] font-black text-slate-700 truncate">{op.activity}</p></div><p className="text-[8px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1"><MapPin size={10} className="text-[#FBBF24]"/> {op.field}</p></div><div className="flex relative items-center h-20">{timelineDays.map((_, i) => (<div key={i} className="w-[100px] h-full border-r border-slate-50/50 shrink-0"/>))}<div className={`absolute h-10 rounded-2xl flex items-center px-4 shadow-lg border-2 transition-all hover:scale-[1.02] cursor-pointer group/bar ${op.status === 'Completed' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#1B4D3E] border-emerald-900/50 text-[#FBBF24]'}`} style={{ left: `${diffInDays * 100}px`, width: `${duration * 100}px` }} onClick={() => { setSelectedOp(op); setActiveTab('OPERATIONS'); }}><span className="text-[9px] font-black uppercase truncate tracking-tight">{op.activity}</span><ChevronRightIcon size={12} className="ml-auto opacity-0 group-hover/bar:opacity-100 transition-opacity" /></div></div></div>);})}</div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-2 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex gap-2 px-2">
                {[ 
                    { id: 'REPORTS', label: 'Command View', icon: <BarChart3 size={14}/> },
                    { id: 'SETUP', label: 'Spatial Registry', icon: <MapIcon size={14}/> },
                    { id: 'RESOURCES', label: 'Inventory Hub', icon: <Boxes size={14}/> },
                    { id: 'OPERATIONS', label: 'Operations', icon: <Zap size={14}/> },
                    { id: 'CALENDAR', label: 'Chronology', icon: <CalendarIcon size={14}/> }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 py-2.5 px-5 text-[9px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap rounded-xl ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label} {activeTab === tab.id && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#FBBF24] rounded-full" />}</button>
                ))}
            </div>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-inner overflow-hidden border border-slate-100">
            {activeTab === 'REPORTS' && renderReports()}
            {activeTab === 'SETUP' && renderSetup()}
            {activeTab === 'RESOURCES' && (
                <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
                        <div className="flex flex-col gap-1.5"><h4 className="text-xl font-black uppercase text-[#1B4D3E] tracking-tight leading-none">Inventory Hub</h4><p className="text-[9px] font-bold text-[#FBBF24] uppercase tracking-[0.3em]">Stock Records</p></div>
                        <div className="flex items-center gap-3 w-full sm:w-auto"><div className="relative flex-1 sm:w-48"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={filterUnitId} onChange={(e) => setFilterUnitId(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-[#1B4D3E] outline-none focus:bg-white transition-all appearance-none"><option value="All">All Unit Nodes</option>{selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div><button onClick={() => { setEditingAssetId(null); setResourceAddMode('Catalogue'); setShowAssetModal(true); }} className="px-6 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-emerald-900 transition-all active:scale-95"><Plus size={16} className="text-[#FBBF24]"/> Stock Unit</button></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                        {filteredResources.map((res: Resource) => {
                            const isLowStock = res.startingQuantity && res.quantity <= res.startingQuantity * 0.2;
                            return (
                                <div key={res.id} className={`bg-white rounded-[2rem] border transition-all flex flex-col group border-b-4 hover:border-b-[#FBBF24] ${isLowStock ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-100'}`}>
                                    <div className={`h-36 flex items-center justify-center text-slate-300 relative group-hover:bg-emerald-50 transition-colors rounded-t-[2rem] ${isLowStock ? 'bg-amber-50' : 'bg-slate-50'}`}>{res.type === ResourceType.Machinery ? <Tractor size={48} className="group-hover:text-[#1B4D3E] transition-all"/> : res.type === ResourceType.Personnel ? <Users size={48} className="group-hover:text-[#1B4D3E] transition-all"/> : <Package size={48} className="group-hover:text-[#1B4D3E] transition-all"/>}<div className="absolute top-4 right-4 px-3 py-1 bg-[#1B4D3E] text-[#FBBF24] shadow-lg rounded-lg text-[8px] font-black uppercase border border-white/10">{res.type}</div>{isLowStock && (<div className="absolute top-4 left-4 px-2 py-1 bg-amber-500 text-white rounded-lg text-[7px] font-black uppercase flex items-center gap-1 animate-pulse"><AlertTriangle size={10}/> Critical Level</div>)}<div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={(e) => { e.stopPropagation(); handleEditAsset(res); }} className="p-2 bg-white text-[#1B4D3E] rounded-lg shadow-xl hover:scale-110 active:scale-90 transition-all"><Edit2 size={12}/></button><button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(res.id); }} className="p-2 bg-white text-rose-500 rounded-lg shadow-xl hover:scale-110 active:scale-90 transition-all"><TrashIcon size={12}/></button></div></div>
                                    <div className="p-6 space-y-4"><div><h5 className="font-black text-[#1B4D3E] text-sm truncate leading-none">{res.name}</h5><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{res.category}</p></div><div className="flex items-center gap-2 text-[8px] font-black text-[#1B4D3E] uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><Warehouse size={10} className="text-[#FBBF24]"/> {selectedEnterprise?.units?.find((u:any) => u.id === res.assignedUnitId)?.name || 'Central Store'}</div><div className="flex justify-between items-end border-t border-slate-50 pt-4"><div className="flex flex-col"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Qty</span><p className={`font-black text-xl mt-1 ${isLowStock ? 'text-amber-600' : 'text-[#1B4D3E]'}`}>{res.quantity} <span className="text-[9px] font-bold text-slate-400 uppercase">{res.unitNumber}</span></p></div><div className="text-right"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Unit Cost</span><p className="font-black text-[#FBBF24] text-xl mt-1">E {res.unitCost?.toFixed(2) || '0.00'}</p></div></div></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'OPERATIONS' && (
                <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1B4D3E] p-6 rounded-[2rem] shadow-2xl text-white gap-4">
                        <div><h4 className="text-xl font-black uppercase tracking-tight leading-none text-[#FBBF24]">Operations Hub</h4><p className="text-[9px] font-bold text-green-300 uppercase tracking-[0.3em] mt-2.5">Production Monitoring</p></div>
                        <button onClick={() => { setEditingOpId(null); setNewOp({ activity: '', field: '', startDateTime: new Date().toISOString().split('T')[0] }); setShowOpModal(true); }} className="px-8 py-3.5 bg-[#FBBF24] text-[#1B4D3E] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-2"><Plus size={16}/> Start Node Cycle</button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pb-20">
                        {(selectedEnterprise?.operations || []).map((op: any) => (
                            <div key={op.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${selectedOp?.id === op.id ? 'border-[#FBBF24] shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:shadow-xl'}`}>
                                <div className="p-8 cursor-pointer" onClick={() => setSelectedOp(selectedOp?.id === op.id ? null : op)}>
                                    <div className="flex justify-between items-start flex-wrap gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4"><span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${op.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-[#1B4D3E] text-[#FBBF24] border border-white/10'}`}>{op.status}</span><h5 className="text-xl font-black text-[#1B4D3E] leading-none">{op.activity}</h5></div>
                                            <div className="flex items-center gap-6 text-slate-400"><div className="flex items-center gap-2 font-black uppercase text-[10px]"><MapPin size={14} className="text-[#FBBF24]"/><span>{op.field} Unit</span></div><div className="flex items-center gap-2 font-black uppercase text-[10px]"><CalendarIcon size={14} className="text-[#1B4D3E]"/><span>{new Date(op.startDateTime).toLocaleDateString()}</span></div></div>
                                        </div>
                                        <div className="text-right"><p className="text-2xl font-black text-[#1B4D3E] tracking-tight">E {op.accumulatedCost?.toLocaleString() || 0}</p><p className="text-[9px] font-black text-[#FBBF24] uppercase tracking-[0.4em] mt-2">Cycle Cost</p></div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {op.status !== 'Completed' && (<><button onClick={(e) => { e.stopPropagation(); handleEditOp(op); }} className="px-3 py-1.5 bg-slate-50 text-slate-400 hover:text-[#1B4D3E] rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all"><Edit2 size={12}/> Edit Cycle</button><button onClick={(e) => { e.stopPropagation(); handleDeleteOp(op.id); }} className="px-3 py-1.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all"><Trash size={12}/> De-register</button></>)}
                                    </div>
                                </div>
                                {selectedOp?.id === op.id && (
                                    <div className="px-8 pb-10 pt-2 space-y-10 animate-slide-up">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <button onClick={() => { setEditingLogId(null); setActivityForm({ activity: '', resourceId: '', quantity: 1, duration: 1, activityDate: new Date().toISOString().split('T')[0] }); setShowActivityModal(true); }} disabled={op.status === 'Completed'} className="py-4 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-900 disabled:opacity-30 transition-all group/btn"><PlusSquare size={20} className="text-[#FBBF24] group-hover/btn:rotate-90 transition-transform"/> Log Activity</button>
                                            <button onClick={() => { 
                                                const countryCode = "SZ";
                                                const enterpriseId = selectedEnterprise?.id?.split('-').pop() || 'ENT';
                                                const unitName = selectedOp?.field || 'UNT';
                                                const unitObj = selectedEnterprise?.units?.find((u: any) => u.name === unitName);
                                                const unitId = unitObj?.id?.split('-').pop() || 'UNIT';
                                                const operationId = selectedOp?.id?.split('-').pop() || 'OP';
                                                setHarvestForm({...harvestForm, traceId: `${countryCode}-${enterpriseId}-${unitId}-${operationId}`, manufacturer: `${user?.firstName} ${user?.lastName}`});
                                                setShowHarvestModal(true); 
                                            }} disabled={op.status === 'Completed'} className="py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-yellow-400 disabled:opacity-30 transition-all group/btn"><Sprout size={20} className="group-hover/btn:scale-125 transition-transform"/> Harvest Produce</button>
                                            <button onClick={() => handleCompleteOp(op.id)} disabled={op.status === 'Completed'} className="py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-700 disabled:opacity-30 transition-all group/btn"><CheckCircle2 size={20}/> Complete Cycle</button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-50 pb-4"><h6 className="text-[9px] font-black text-[#1B4D3E] uppercase tracking-[0.4em] flex items-center gap-2"><History size={16} className="text-[#FBBF24]"/> Activity Logs</h6><div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase">{op.logs?.length || 0} Records</div></div>
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                                {(op.logs || []).map((log: any) => (
                                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-[#1B4D3E]/10 transition-all shadow-sm group">
                                                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md text-[#1B4D3E] group-hover:bg-[#1B4D3E] group-hover:text-[#FBBF24] transition-all"><Zap size={18}/></div><div><p className="text-xs font-black text-slate-700 leading-none">{log.resourceName}</p><p className="text-[9px] text-slate-400 uppercase font-bold mt-2">{new Date(log.activityDate).toLocaleDateString()} • {log.durationHours > 0 ? `${log.durationHours}h Applied` : `${log.quantityUsed} Units Applied`}</p></div></div>
                                                        <div className="flex items-center gap-4"><p className="text-sm font-black text-[#1B4D3E] bg-white px-4 py-2 rounded-lg border border-[#FBBF24]/20 shadow-sm">E {log.cost.toLocaleString()}</p>{op.status !== 'Completed' && (<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => { setEditingLogId(log.id); setActivityForm({ activity: log.activity, resourceId: log.resourceId, quantity: log.quantityUsed, duration: log.durationHours, activityDate: log.activityDate }); setShowActivityModal(true); }} className="p-1.5 text-slate-400 hover:text-[#1B4D3E] transition-colors"><Edit size={14}/></button><button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash size={14}/></button></div>)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'CALENDAR' && renderChronology()}
        </div>

        {/* Modals */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20"><div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-4"><div className="p-3 bg-white/10 rounded-xl"><Building2 size={24} className="text-[#FBBF24]"/></div><h3 className="text-xl font-black uppercase tracking-tight">{editingEnt ? 'Modify Hub' : 'Register Hub'}</h3></div><button onClick={() => { setShowEnterpriseModal(false); setEditingEnt(null); }} className="text-white/50"><X size={24}/></button></div><div className="p-8 space-y-6"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Nomenclature</label><input value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Malkerns Estate" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Node</label><input value={newEnterprise.address} onChange={(e)=>setNewEnterprise({...newEnterprise, address: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label><select value={newEnterprise.region} onChange={(e)=>setNewEnterprise({...newEnterprise, region: e.target.value as Region})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none">{Object.values(Region).filter(r => r !== Region.All).map(r => <option key={r} value={r}>{r}</option>)}</select></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency</label><select value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none"><option value="">Select...</option>{TINKHUNDLA[newEnterprise.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}</select></div></div><button onClick={handleSaveEnterprise} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all">Establish Node</button></div></div></div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20 flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl border border-white/10 shadow-lg">
                                <Layers2 size={24} className="text-[#FBBF24]"/>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">{editingUnit ? 'Modify Unit' : 'Confirm Trace'}</h3>
                        </div>
                        <button onClick={() => { setShowUnitModal(false); setEditingUnit(null); }} className="text-white/50 hover:text-white transition-colors"><X size={28}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 shadow-inner">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600"><RulerIcon size={24}/></div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Calculated Footprint</p>
                                <p className="text-xl font-black text-[#1B4D3E]">{newUnit.area} <span className="text-xs">Hectares</span></p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Nomenclature</label>
                            <input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Maize Block 4, North Pasture..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Storage Height (m)</label>
                                <input 
                                    type="number" 
                                    value={newUnit.height} 
                                    onChange={(e) => {
                                        const h = e.target.value;
                                        const areaInM2 = (parseFloat(newUnit.area) || 0) * 10000;
                                        const calculatedVol = areaInM2 * (parseFloat(h) || 0);
                                        setNewUnit({ ...newUnit, height: h, volume: calculatedVol.toFixed(2) });
                                    }} 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-sm focus:ring-4 focus:ring-amber-400/10" 
                                />
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Volume (m³)</label>
                                <input 
                                    type="number" 
                                    value={newUnit.volume} 
                                    onChange={(e)=>setNewUnit({...newUnit, volume: e.target.value})} 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-sm" 
                                />
                                {parseFloat(newUnit.height) > 0 && (
                                    <div className="absolute -top-1 right-0 flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[7px] font-black text-amber-600 uppercase border border-amber-100 animate-fade-in">
                                        <Wind size={8}/> Auto-Calculating
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={handleSaveUnit} disabled={!newUnit.name} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">Commit Unit Node</button>
                    </div>
                </div>
            </div>
        )}

        {showAssetModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"><div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#FBBF24]/20"><div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-5"><div className="p-4 bg-white/10 rounded-2xl"><Boxes size={28} className="text-[#FBBF24]"/></div><div><h3 className="text-xl font-black uppercase tracking-tight">{editingAssetId ? 'Edit Inventory Node' : 'Node Inventory Registry'}</h3><p className="text-[9px] text-green-300 font-bold uppercase tracking-[0.3em] mt-2.5">{activeUnitForInventory ? `Stocking: ${activeUnitForInventory.name}` : 'Global Stock'}</p></div></div><button onClick={() => { setShowAssetModal(false); setEditingAssetId(null); }} className="text-white/50"><X size={28}/></button></div><div className="flex-1 overflow-hidden flex flex-col md:flex-row"><div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden"><div className="p-6 border-b border-slate-100 space-y-4">{!editingAssetId && (<div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl"><button onClick={() => setResourceAddMode('Catalogue')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Catalogue' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500'}`}>Catalogue</button><button onClick={() => setResourceAddMode('Manual')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Manual' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500'}`}>Manual</button><button onClick={() => setResourceAddMode('Workforce')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Workforce' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500'}`}>Workforce</button></div>)}{resourceAddMode === 'Catalogue' && (<div className="grid grid-cols-2 gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input type="text" placeholder="Trade Name..." value={catSearch} onChange={(e)=>setCatSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" /></div><div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/><select value={catDivisionFilter} onChange={(e)=>setCatDivisionFilter(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase appearance-none"><option value="All">All Divisions</option>{masterCatalogueDivisions.map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>)}{!activeUnitForInventory && (<div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Assignment</label><select value={newAsset.assignedUnitId} onChange={(e)=>setNewAsset({...newAsset, assignedUnitId: e.target.value})} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-[10px] uppercase appearance-none"><option value="">Select Unit Node...</option>{selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>)}</div><div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-4">{resourceAddMode === 'Catalogue' ? (filteredCatalogue.map(item => { const isSelected = !!selectedCatItems.find(p => p.item.registrationId === item.registrationId); return (<button key={item.registrationId} onClick={() => setSelectedCatItems(prev => isSelected ? prev.filter(p => p.item.registrationId !== item.registrationId) : [...prev, { item, quantity: 1, initialValue: 0, lifespanHours: 1000 }])} className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group/cat ${isSelected ? 'bg-emerald-50 border-[#1B4D3E] shadow-xl' : 'bg-white border-slate-100 hover:border-emerald-100'}`}><div className="flex items-center gap-4"><div className={`p-3 rounded-xl transition-all shadow-md ${isSelected ? 'bg-[#1B4D3E] text-[#FBBF24]' : 'bg-slate-50 text-slate-400'}`}>{item.productType === 'Machinery' ? <Tractor size={20}/> : <Package size={20}/>}</div><div><p className="text-xs font-black text-slate-800 leading-none">{item.tradeName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.division} • {item.category}</p></div></div>{isSelected ? <CheckCircle2 size={24} className="text-[#1B4D3E]"/> : <Plus size={24} className="text-slate-200 group-hover/cat:text-[#1B4D3E] transition-colors"/>}</button>); })) : resourceAddMode === 'Workforce' ? (orgEmployees.map(emp => (<button key={emp.id} onClick={() => setNewAsset({...newAsset, linkedUserId: emp.id, name: emp.name})} className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${newAsset.linkedUserId === emp.id ? 'bg-blue-50 border-blue-600 shadow-xl' : 'bg-white border-slate-100 hover:border-blue-100'}`}><div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${newAsset.linkedUserId === emp.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Users size={20}/></div><div><p className="text-xs font-black text-slate-800">{emp.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emp.actorType} • {emp.organization}</p></div></div>{newAsset.linkedUserId === emp.id ? <UserCheck2 size={24} className="text-blue-600"/> : <Plus size={24} className="text-slate-200"/>}</button>))) : (<div className="p-4 space-y-6"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Nomenclature</label><input value={newAsset.name} onChange={(e)=>setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Breeding Herd Delta" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification</label><select value={newAsset.type} onChange={(e)=>setNewAsset({...newAsset, type: e.target.value as ResourceType})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none"><option value={ResourceType.Machinery}>Mechanisation</option><option value={ResourceType.Equipment}>Equipment</option><option value={ResourceType.Animals}>Livestock</option><option value={ResourceType.Consumable}>Inputs</option></select></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label><select value={newAsset.category} onChange={(e)=>setNewAsset({...newAsset, category: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none"><option value="General">General</option>{systemMetadata?.categoriesByDivision?.[newAsset.type === ResourceType.Machinery ? 'Mechanisation' : 'Consumables (Biological & Chemical)']?.map((c:string) => <option key={c} value={c}>{c}</option>)}</select></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</label><input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</label><select value={newAsset.unitNumber} onChange={(e)=>setNewAsset({...newAsset, unitNumber: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none">{systemMetadata?.units?.map((u:string) => <option key={u} value={u}>{u}</option>)}</select></div></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initial Node Book Value (E)</label><input type="number" value={newAsset.initialValue} onChange={(e)=>setNewAsset({...newAsset, initialValue: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" placeholder="0.00" /></div></div>)}</div></div><div className="w-full md:w-[360px] bg-slate-50 border-l border-slate-200 flex flex-col p-8"><h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-[#1B4D3E]/40">Synchronization Manifest</h4><div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-6">{resourceAddMode === 'Workforce' ? (<div className="bg-white p-5 rounded-2xl border border-blue-100 space-y-4 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-50 pb-3"><div className="p-2 bg-blue-600 text-white rounded-lg"><HardHat size={14}/></div><p className="text-[10px] font-black text-blue-900 uppercase">Workforce Onboarding</p></div><div className="space-y-4"><div><label className="text-[8px] font-black text-slate-400 uppercase">Available Units (Hrs)</label><input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 0})} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100" /></div><div><label className="text-[8px] font-black text-slate-400 uppercase">Hourly Rate (E/Hr)</label><input type="number" value={newAsset.unitCost} onChange={(e)=>setNewAsset({...newAsset, unitCost: parseFloat(e.target.value) || 0})} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100" /></div></div></div>) : selectedCatItems.map(sel => (<div key={sel.item.registrationId} className="bg-white p-5 rounded-2xl border border-[#FBBF24]/20 space-y-4 shadow-sm hover:shadow-xl transition-all"><div className="flex justify-between items-start border-b border-slate-50 pb-3"><p className="text-[10px] font-black text-[#1B4D3E] truncate leading-none mt-1">{sel.item.tradeName}</p><button onClick={() => setSelectedCatItems(prev => prev.filter(p => p.item.registrationId !== sel.item.registrationId))} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><MinusCircle size={18}/></button></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Qty</label><input type="number" value={sel.quantity} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100" /></div><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Value (E)</label><input type="number" value={sel.initialValue} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, initialValue: parseFloat(e.target.value) || 0 } : p))} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100" /></div></div></div>))}</div><button onClick={handleSaveAsset} disabled={(selectedCatItems.length === 0 && resourceAddMode === 'Catalogue') || (resourceAddMode === 'Workforce' && !newAsset.linkedUserId) || (resourceAddMode === 'Manual' && !newAsset.name)} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all disabled:opacity-30">{editingAssetId ? 'Commit Update' : 'Commit Sync'}</button></div></div></div></div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20"><div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-4"><div className="p-3 bg-white/10 rounded-xl border border-white/10 shadow-lg"><Zap size={20} className="text-[#FBBF24]"/></div><h3 className="text-lg font-black uppercase tracking-tight leading-none">{editingOpId ? 'Update Cycle' : 'Initialize Cycle'}</h3></div><button onClick={() => setShowOpModal(false)} className="p-2 text-white/50"><X size={24}/></button></div><div className="p-8 space-y-6"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chronology Label</label><input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="e.g. Winter Hybrid Maize Plot A" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-sm" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Operational Unit</label><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none shadow-sm"><option value="">Select Target...</option>{(selectedEnterprise?.units || []).map((u:any) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label><input type="date" value={newOp.startDateTime} onChange={(e)=>setNewOp({...newOp, startDateTime: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-sm" /></div></div><button onClick={async () => { const ent = await db.getById<any>(Table.Enterprises, selectedEntId!); if (editingOpId) { const op = ent.operations.find((o: any) => o.id === editingOpId); op.activity = newOp.activity; op.field = newOp.field; op.startDateTime = newOp.startDateTime; } else { const opObj = { ...newOp, id: `OP-${Date.now()}`, accumulatedCost: 0, progress: 0, status: 'Scheduled', logs: [] }; ent.operations = [...(ent.operations || []), opObj]; } await db.update(Table.Enterprises, selectedEntId!, ent); setShowOpModal(false); setEditingOpId(null); await loadAllData(selectedEntId!); }} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all">{editingOpId ? 'Update Cycle Node' : 'Establish Cycle Node'}</button></div></div></div>
        )}

        {showActivityModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20"><div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0"><h3 className="text-lg font-black uppercase tracking-tight">{editingLogId ? 'Modify Activity' : 'Log Activity'}</h3><button onClick={() => { setShowActivityModal(false); setEditingLogId(null); }} className="p-2 text-white/50"><X size={24}/></button></div><div className="p-8 space-y-6"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Attribution</label><input value={activityForm.activity} onChange={(e)=>setActivityForm({...activityForm, activity: e.target.value})} placeholder={selectedOp.activity} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-inner" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Date</label><input type="date" value={activityForm.activityDate} onChange={(e)=>setActivityForm({...activityForm, activityDate: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none transition-all shadow-inner" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Resource Node</label><select value={activityForm.resourceId} onChange={(e)=>setActivityForm({...activityForm, resourceId: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none shadow-inner"><option value="">Select Resource...</option>{(selectedEnterprise?.resources || []).map((r: any) => (<option key={r.id} value={r.id} disabled={r.quantity <= 0}>{r.name} ({r.quantity} {r.unitNumber} available)</option>))}</select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Applied</label><input type="number" value={activityForm.quantity} onChange={(e)=>setActivityForm({...activityForm, quantity: parseFloat(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Hrs)</label><input type="number" value={activityForm.duration} onChange={(e)=>setActivityForm({...activityForm, duration: parseFloat(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div></div><button onClick={handleLogActivity} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-2"><Coins size={16}/> Commit Activity Node</button></div></div></div>
        )}

        {showHarvestModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in"><div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20 flex flex-col max-h-[95vh]"><div className="bg-emerald-900 p-8 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-4"><div className="p-2.5 bg-white/10 rounded-xl"><Archive size={20} className="text-[#FBBF24]"/></div><h3 className="text-lg font-black uppercase tracking-tight leading-none">Harvest Registry</h3></div><button onClick={() => setShowHarvestModal(false)} className="p-2 text-white/50"><X size={24}/></button></div><div className="p-8 space-y-6 overflow-y-auto no-scrollbar"><div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2"><div className="flex items-center gap-2 text-[#1B4D3E] font-black uppercase text-[8px] tracking-[0.2em]"><BadgeCheck size={12} className="text-emerald-500" /> Traceability Synchronized</div><p className="text-[10px] font-mono font-black text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm break-all">{harvestForm.traceId}</p></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harvested Commodity (Catalogue Select)</label><select value={harvestForm.tradeName} onChange={(e) => { const sel = masterCatalogue.find(i => i.tradeName === e.target.value); if (sel) { setHarvestForm({ ...harvestForm, name: sel.tradeName, tradeName: sel.tradeName, category: sel.category, subCategory: sel.subCategory, division: sel.division, unit: sel.unit, description: sel.description }); } }} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none shadow-inner"><option value="">Select Produce Reference...</option>{masterCatalogue.map(item => (<option key={item.registrationId} value={item.tradeName}>{item.tradeName} ({item.category})</option>))}</select></div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capture Batch Image</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center relative group hover:bg-slate-50 transition-all cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setHarvestForm({ ...harvestForm, image: reader.result as string }); reader.readAsDataURL(file); }}} />
                    {harvestForm.image ? (
                        <div className="relative inline-block">
                            <img src={harvestForm.image} className="h-32 w-32 object-cover rounded-xl shadow-lg border-4 border-white" />
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg"><Check size={12}/></div>
                        </div>
                    ) : (
                        <div className="space-y-2 py-4">
                            <Camera size={32} className="mx-auto text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            <p className="text-[10px] font-black text-slate-400 uppercase">Tap to Capture Produce Photo</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commodity Name</label><input value={harvestForm.name} onChange={(e)=>setHarvestForm({...harvestForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Division</label><input value={harvestForm.division} onChange={(e)=>setHarvestForm({...harvestForm, division: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label><input value={harvestForm.category} onChange={(e)=>setHarvestForm({...harvestForm, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Manufacturer (Auto-Fill)</label><input value={harvestForm.manufacturer} disabled className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl font-bold text-sm outline-none opacity-60" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Verified</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label><select value={harvestForm.unit} onChange={(e)=>setHarvestForm({...harvestForm, unit: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none shadow-inner">{systemMetadata?.units?.map((u: string) => <option key={u} value={u}>{u}</option>)}</select></div></div><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Listing Price (E/Unit)</label><input type="number" value={harvestForm.price} onChange={(e)=>setHarvestForm({...harvestForm, price: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" /></div><button onClick={handleFinalizeHarvest} disabled={!harvestForm.name} className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-800 transition-all disabled:opacity-50">Commit Partial Harvest Node</button></div></div></div>
        )}
    </div>
  );
};

export default Production;