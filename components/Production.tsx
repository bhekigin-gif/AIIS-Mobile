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
  AlertTriangle
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
  
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [activeUnitForInventory, setActiveUnitForInventory] = useState<any>(null);
  const [filterUnitId, setFilterUnitId] = useState<string>('All');
  
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
  const [newEnterprise, setNewEnterprise] = useState({ name: '', region: Region.Manzini, tinkhundla: '', address: '', lat: 0, lng: 0 });
  const [newUnit, setNewUnit] = useState({ id: '', name: '', unitNumber: '', area: '', height: '0', volume: '0', path: [] as any[] });
  const [newAsset, setNewAsset] = useState<Partial<Resource>>({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, initialValue: 0, lifespanHours: 1000, image: '', assignedUnitId: '', unitNumber: 'Unit' });
  const [activityForm, setActivityForm] = useState({ activity: '', resourceId: '', quantity: 1, duration: 1, activityDate: new Date().toISOString().split('T')[0] });
  const [harvestForm, setHarvestForm] = useState({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '', startDate: new Date().toISOString().split('T')[0], duration: 1, traceId: '' });
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
      if (window.confirm("Abolish this operational unit perimeter?")) {
          const ent = await db.getById<any>(Table.Enterprises, entId);
          ent.units = ent.units.filter((u: any) => u.id !== unitId);
          await db.update(Table.Enterprises, entId, ent);
          loadAllData(entId);
      }
  };

  const handleEditAsset = (res: Resource) => {
    setEditingAssetId(res.id);
    setResourceAddMode('Manual');
    setNewAsset({
      ...res,
      assignedUnitId: res.assignedUnitId
    });
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
      if (!targetUnitId) {
          alert("Operational Unit assignment is mandatory for registry compliance.");
          return;
      }

      const ent = await db.getById<any>(Table.Enterprises, selectedEntId);
      let resources = ent.resources || [];

      if (editingAssetId) {
        const idx = resources.findIndex((r: Resource) => r.id === editingAssetId);
        if (idx !== -1) {
            const updatedAsset = { ...resources[idx], ...newAsset, assignedUnitId: targetUnitId };
            if (resourceAddMode === 'Manual') {
               const type = updatedAsset.type;
               const initial = updatedAsset.initialValue || 0;
               const qty = updatedAsset.quantity || 1;
               const lifespan = updatedAsset.lifespanHours || 1;
               updatedAsset.unitCost = (type === ResourceType.Machinery) ? (initial / lifespan) : (initial / qty);
               // Update starting quantity for monitoring if it wasn't set
               if (!updatedAsset.startingQuantity) updatedAsset.startingQuantity = updatedAsset.quantity;
            }
            resources[idx] = updatedAsset;
        }
      } else {
        const newAssets: Resource[] = [];
        if (resourceAddMode === 'Catalogue') {
            selectedCatItems.forEach(sel => {
                const itemType = (sel.item.productType === 'Machinery' || sel.item.division.includes('Mechanisation')) ? ResourceType.Machinery : ResourceType.Consumable;
                const unitCost = (itemType === ResourceType.Machinery) ? (sel.initialValue / (sel.lifespanHours || 1000)) : (sel.initialValue / (sel.quantity || 1));
                newAssets.push({
                    id: `AST-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                    type: itemType, name: sel.item.tradeName, unitNumber: sel.item.unit,
                    category: sel.item.category, unitCost, quantity: sel.quantity, startingQuantity: sel.quantity, status: 'Available',
                    assignedUnitId: targetUnitId, details: sel.item.description,
                    initialValue: sel.initialValue, lifespanHours: sel.lifespanHours || 1000, totalUsageHours: 0,
                    catalogueRef: sel.item.registrationId
                });
            });
        } else {
            const unitCost = (newAsset.type === ResourceType.Machinery) ? ((newAsset.initialValue || 0) / (newAsset.lifespanHours || 1)) : ((newAsset.initialValue || 0) / (newAsset.quantity || 1));
            newAssets.push({ ...newAsset, id: `AST-${Date.now()}`, unitCost, startingQuantity: newAsset.quantity, status: 'Available', assignedUnitId: targetUnitId, totalUsageHours: 0 } as Resource);
        }
        resources = [...resources, ...newAssets];
      }

      ent.resources = resources;
      await db.update(Table.Enterprises, selectedEntId, ent);
      setShowAssetModal(false); 
      setEditingAssetId(null);
      setSelectedCatItems([]); 
      setNewAsset({ type: ResourceType.Machinery, name: '', unitCost: 0, category: 'General', status: 'Available', quantity: 1, initialValue: 0, lifespanHours: 1000, image: '', assignedUnitId: '', unitNumber: 'Unit' });
      await loadAllData(selectedEntId);
  };

  const handleLogActivity = async () => {
    if (!selectedOp || !activityForm.resourceId) return;
    const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
    const res = ent.resources.find((r: any) => r.id === activityForm.resourceId);
    const emp = orgEmployees.find(e => e.id === activityForm.resourceId);
    
    // Prevent adding unavailable quantities
    if (res && res.type === ResourceType.Consumable) {
        if (activityForm.quantity > res.quantity || res.quantity <= 0) {
            alert(`Insufficient stock. Only ${res.quantity} ${res.unitNumber} available.`);
            return;
        }
    }
    
    const resourceName = res ? res.name : (emp ? emp.name : 'Unknown');
    const resourceType = res ? res.type : (emp ? 'Workforce' : 'Unknown');
    const unitCost = res ? res.unitCost : 0; 

    const cost = resourceType === ResourceType.Machinery ? (unitCost * activityForm.duration) : (unitCost * activityForm.quantity);
    
    const log: ActivityLog = {
        id: `LOG-${Date.now()}`, 
        timestamp: new Date().toISOString(), 
        activityDate: activityForm.activityDate,
        activity: activityForm.activity || selectedOp.activity,
        resourceId: activityForm.resourceId, 
        resourceName, 
        quantityUsed: activityForm.quantity, 
        durationHours: activityForm.duration, 
        cost
    };

    if (res) {
        if (res.type === ResourceType.Consumable) {
            // Monitor and reduce item quantity and book value accordingly
            const quantityRatio = activityForm.quantity / res.quantity;
            const valueReduction = (res.initialValue || 0) * quantityRatio;
            res.initialValue = Math.max(0, (res.initialValue || 0) - valueReduction);
            res.quantity -= activityForm.quantity;
            
            // Check stock threshold
            const lowStockThreshold = (res.startingQuantity || 0) * 0.2;
            if (res.quantity <= lowStockThreshold) res.status = 'Low Stock';
            if (res.quantity <= 0) res.status = 'Low Stock';
        }
        if (res.type === ResourceType.Machinery) {
            res.totalUsageHours = (res.totalUsageHours || 0) + activityForm.duration;
            // For machinery, "book value" might reduce by depreciation based on duration/lifespan
            const depreciation = ((res.initialValue || 0) / (res.lifespanHours || 1)) * activityForm.duration;
            res.initialValue = Math.max(0, (res.initialValue || 0) - depreciation);
        }
    }

    const op = ent.operations.find((o: any) => o.id === selectedOp.id);
    op.logs = [...(op.logs || []), log];
    op.accumulatedCost = (op.accumulatedCost || 0) + cost;
    op.status = 'In Progress';

    await db.update(Table.Enterprises, selectedEntId!, ent);
    setShowActivityModal(false); 
    setActivityForm({ activity: '', resourceId: '', quantity: 1, duration: 1, activityDate: new Date().toISOString().split('T')[0] });
    await loadAllData(selectedEntId!);
    setSelectedOp(op);
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
      sellerName: selectedEnterprise?.name || user?.name || 'Institutional Producer',
      sellerId: user?.organizationId || user?.id, region: selectedEnterprise?.region as Region,
      sourceUnit: op.field, operationId: op.id
    };
    await addProductToRegistry(newProduct);
    setProducts(prev => [...prev, newProduct]);
    
    const harvestLog: ActivityLog = {
      id: `HARVEST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      activityDate: harvestForm.startDate,
      activity: 'Harvest Finalization',
      resourceId: 'SYSTEM',
      resourceName: harvestForm.name,
      quantityUsed: harvestForm.quantity,
      durationHours: harvestForm.duration,
      cost: 0
    };
    
    op.status = 'Completed'; 
    op.producedId = productId; 
    op.endDateTime = new Date().toISOString();
    op.logs = [...(op.logs || []), harvestLog];

    await db.update(Table.Enterprises, selectedEntId, ent);
    setShowHarvestModal(false);
    setHarvestForm({ name: '', category: 'Crops', quantity: 0, unit: 'kg', price: 0, description: '', image: '', startDate: new Date().toISOString().split('T')[0], duration: 1, traceId: '' });
    await loadAllData(selectedEntId); setSelectedOp(null);
  };

  const handleOpenHarvestModal = () => {
      const countryCode = "SZ";
      const enterpriseId = selectedEnterprise?.id?.split('-').pop() || 'ENT';
      const unitName = selectedOp?.field || 'UNT';
      const unitObj = selectedEnterprise?.units?.find((u: any) => u.name === unitName);
      const unitId = unitObj?.id?.split('-').pop() || 'UNIT';
      const operationId = selectedOp?.id?.split('-').pop() || 'OP';
      
      const generatedTraceId = `${countryCode}-${enterpriseId}-${unitId}-${operationId}`;
      setHarvestForm(prev => ({...prev, traceId: generatedTraceId}));
      setShowHarvestModal(true);
  };

  const handleUnitHeightChange = (val: string) => {
    const h = parseFloat(val) || 0;
    const area = parseFloat(newUnit.area) || 0;
    const vol = area * 10000 * h;
    setNewUnit(prev => ({ ...prev, height: val, volume: vol.toFixed(2) }));
  };

  const renderReports = () => {
      if (!selectedEnterprise) return <div className="text-center py-20 opacity-30 h-full flex flex-col justify-center items-center"><BarChart3 size={64} className="mb-4 text-[#1B4D3E]"/><p className="text-xs font-black uppercase text-[#1B4D3E]">Select an Enterprise Node in Setup</p></div>;
      const opCosts = (selectedEnterprise.operations || []).map((o: any) => ({ name: o.activity, cost: o.accumulatedCost || 0 }));
      const areaData = (selectedEnterprise.units || []).map((u: any) => ({ name: u.name, value: parseFloat(u.area) || 0 }));

      return (
          <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-white/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#1B4D3E] p-6 rounded-[2rem] shadow-xl flex flex-col justify-between h-36 group relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-300 uppercase tracking-widest">Operational Value</p>
                        <h3 className="text-2xl font-black text-[#FBBF24] mt-2">E {selectedEnterprise.operations?.reduce((s:number, o:any) => s + (o.accumulatedCost || 0), 0).toLocaleString()}</h3>
                      </div>
                      <Coins className="absolute -bottom-4 -right-4 text-white/5 size-24 group-hover:scale-110 transition-transform"/>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-36 hover:border-[#FBBF24] transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
                      <h3 className="text-2xl font-black text-[#1B4D3E] mt-2">E {selectedEnterprise.resources?.reduce((s:number, r:any) => s + (r.initialValue || 0), 0).toLocaleString()}</h3>
                      <div className="flex items-center gap-2 text-[9px] font-black text-[#FBBF24] uppercase mt-2"><TrendingUp size={12}/> +12% Hub Growth</div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-[#FBBF24]/20 shadow-sm flex flex-col justify-between h-36 hover:border-[#FBBF24] transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Units</p>
                      <h3 className="text-2xl font-black text-[#1B4D3E] mt-2">{selectedEnterprise.units?.length || 0}</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-[#FBBF24] h-full w-2/3 rounded-full"/></div>
                  </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[380px] flex flex-col shadow-lg">
                      <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart4 size={18} className="text-[#FBBF24]"/> Cycle Cost Attribution</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={opCosts}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={9} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <YAxis fontSize={9} tick={{fill: '#1B4D3E', fontWeight: '800'}} axisLine={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="cost" fill="#1B4D3E" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[380px] flex flex-col shadow-lg">
                      <h4 className="text-[11px] font-black text-[#1B4D3E] uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><PieChart size={18} className="text-[#FBBF24]"/> Spatial Allocation</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={areaData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {areaData.map((_, i) => <Cell key={`cell-${i}`} fill={['#1B4D3E', '#FBBF24', '#10B981', '#4F46E5'][i % 4]} />)}
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
                  {isPlacingMode && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-3 pointer-events-none">
                          <MousePointerClick size={16}/> Tap map to anchor node
                      </div>
                  )}
                  {isTracingUnit && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-8 py-3 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20 flex items-center gap-3 pointer-events-none">
                          <Pencil size={16}/> Tracing unit perimeter...
                      </div>
                  )}
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
                                      <div>
                                          <p className="text-sm font-black text-[#1B4D3E] uppercase tracking-tight truncate max-w-[150px] leading-none">{ent.name}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{ent.region}</p>
                                          {ent.address && <p className="text-[8px] text-slate-400 mt-1 italic truncate max-w-[130px]">{ent.address}</p>}
                                      </div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={(e) => { e.stopPropagation(); setEditingEnt(ent); setNewEnterprise({...ent}); setShowEnterpriseModal(true); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#1B4D3E] hover:text-white transition-all"><Edit2 size={12}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEnterprise(ent.id); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><Trash size={12}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleStartTracing(ent.id); }} className="p-2 bg-[#FBBF24] text-[#1B4D3E] rounded-lg shadow-lg hover:scale-110 transition-all" title="Trace Unit"><Layers2 size={14}/></button>
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
                                              <div className="flex justify-between items-center">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{unit.area} Ha</p>
                                                {parseFloat(unit.volume) > 0 && <p className="text-[8px] font-black text-[#1B4D3E] uppercase tracking-tight flex items-center gap-1"><Cuboid size={8} className="text-[#FBBF24]"/> {unit.volume} m³</p>}
                                              </div>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveUnitForInventory(unit); setSelectedEntId(ent.id); setShowAssetModal(true); }}
                                                className="w-full py-1.5 bg-[#1B4D3E] text-[#FBBF24] rounded-lg text-[8px] font-black uppercase hover:bg-emerald-900 transition-all shadow-lg flex items-center justify-center gap-2"
                                              >
                                                  <Warehouse size={10}/> Stock Unit
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  {(!ent.units || ent.units.length === 0) && (
                                      <button onClick={(e) => { e.stopPropagation(); handleStartTracing(ent.id); }} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center bg-white/50 hover:bg-[#FBBF24]/5 hover:border-[#FBBF24]/50 transition-all group/trace">
                                          <div className="flex flex-col items-center gap-1.5"><Crosshair size={18} className="text-slate-200 group-hover/trace:text-[#FBBF24] transition-colors"/><p className="text-[8px] font-black text-slate-400 group-hover/trace:text-[#1B4D3E] uppercase tracking-[0.2em]">Trace Operational Unit</p></div>
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

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
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 py-2.5 px-5 text-[9px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap rounded-xl ${activeTab === tab.id ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {tab.icon} {tab.label} {activeTab === tab.id && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#FBBF24] rounded-full" />}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-inner overflow-hidden border border-slate-100">
            {activeTab === 'REPORTS' && renderReports()}
            {activeTab === 'SETUP' && renderSetup()}
            {activeTab === 'RESOURCES' && (
                <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
                        <div className="flex flex-col gap-1.5">
                            <h4 className="text-xl font-black uppercase text-[#1B4D3E] tracking-tight leading-none">Inventory Hub</h4>
                            <p className="text-[9px] font-bold text-[#FBBF24] uppercase tracking-[0.3em]">Stock Records • Unit Allocated Assets</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-48">
                                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select 
                                  value={filterUnitId} 
                                  onChange={(e) => setFilterUnitId(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-[#1B4D3E] outline-none focus:bg-white transition-all appearance-none"
                                >
                                    <option value="All">All Unit Nodes</option>
                                    {selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <button onClick={() => { setEditingAssetId(null); setActiveUnitForInventory(null); setShowAssetModal(true); }} className="px-6 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-emerald-900 transition-all active:scale-95"><Plus size={16} className="text-[#FBBF24]"/> Stock Unit</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                        {filteredResources.map((res: Resource) => {
                            const isLowStock = res.startingQuantity && res.quantity <= res.startingQuantity * 0.2;
                            return (
                                <div key={res.id} className={`bg-white rounded-[2rem] border transition-all flex flex-col group border-b-4 hover:border-b-[#FBBF24] ${isLowStock ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-100'}`}>
                                    <div className={`h-36 flex items-center justify-center text-slate-300 relative group-hover:bg-emerald-50 transition-colors rounded-t-[2rem] ${isLowStock ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                        {res.type === ResourceType.Machinery ? <Tractor size={48} className="group-hover:text-[#1B4D3E] transition-all"/> : <Package size={48} className="group-hover:text-[#1B4D3E] transition-all"/>}
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-[#1B4D3E] text-[#FBBF24] shadow-lg rounded-lg text-[8px] font-black uppercase border border-white/10">{res.type}</div>
                                        {isLowStock && (
                                            <div className="absolute top-4 left-4 px-2 py-1 bg-amber-500 text-white rounded-lg text-[7px] font-black uppercase flex items-center gap-1 animate-pulse">
                                                <AlertTriangle size={10}/> Critical Level
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                          <button onClick={(e) => { e.stopPropagation(); handleEditAsset(res); }} className="p-2 bg-white text-[#1B4D3E] rounded-lg shadow-xl hover:scale-110 active:scale-90 transition-all"><Edit2 size={12}/></button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(res.id); }} className="p-2 bg-white text-rose-500 rounded-lg shadow-xl hover:scale-110 active:scale-90 transition-all"><TrashIcon size={12}/></button>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div><h5 className="font-black text-[#1B4D3E] text-sm truncate leading-none">{res.name}</h5><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{res.category}</p></div>
                                        <div className="flex items-center gap-2 text-[8px] font-black text-[#1B4D3E] uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                          <Warehouse size={10} className="text-[#FBBF24]"/> 
                                          {selectedEnterprise?.units?.find((u:any) => u.id === res.assignedUnitId)?.name || 'Central Store'}
                                        </div>
                                        <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Qty</span><p className={`font-black text-xl mt-1 ${isLowStock ? 'text-amber-600' : 'text-[#1B4D3E]'}`}>{res.quantity} <span className="text-[9px] font-bold text-slate-400 uppercase">{res.unitNumber}</span></p></div>
                                            <div className="text-right"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Book Value</span><p className="font-black text-[#FBBF24] text-xl mt-1">E {res.initialValue?.toFixed(2) || '0.00'}</p></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'OPERATIONS' && (
                <div className="space-y-6 animate-fade-in p-6 overflow-y-auto h-full no-scrollbar bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1B4D3E] p-6 rounded-[2rem] shadow-2xl text-white gap-4">
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tight leading-none text-[#FBBF24]">Operations Hub</h4>
                            <p className="text-[9px] font-bold text-green-300 uppercase tracking-[0.3em] mt-2.5">Harvest Chronology & Logistics</p>
                        </div>
                        <button onClick={() => setShowOpModal(true)} className="px-8 py-3.5 bg-[#FBBF24] text-[#1B4D3E] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-2"><Plus size={16}/> Start Node Cycle</button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pb-20">
                        {(selectedEnterprise?.operations || []).map((op: any) => (
                            <div key={op.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${selectedOp?.id === op.id ? 'border-[#FBBF24] shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:shadow-xl'}`}>
                                <div className="p-8 cursor-pointer" onClick={() => setSelectedOp(selectedOp?.id === op.id ? null : op)}>
                                    <div className="flex justify-between items-start flex-wrap gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${op.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-[#1B4D3E] text-[#FBBF24] border border-white/10'}`}>{op.status}</span>
                                                <h5 className="text-xl font-black text-[#1B4D3E] leading-none">{op.activity}</h5>
                                            </div>
                                            <div className="flex items-center gap-6 text-slate-400">
                                                <div className="flex items-center gap-2 font-black uppercase text-[10px]"><MapPin size={14} className="text-[#FBBF24]"/><span>{op.field} Unit</span></div>
                                                <div className="flex items-center gap-2 font-black uppercase text-[10px]"><CalendarIcon size={14} className="text-[#1B4D3E]"/><span>{new Date(op.startDateTime).toLocaleDateString()}</span></div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#1B4D3E] tracking-tight">E {op.accumulatedCost?.toLocaleString() || 0}</p>
                                            <p className="text-[9px] font-black text-[#FBBF24] uppercase tracking-[0.4em] mt-2">Sunk Cost</p>
                                        </div>
                                    </div>
                                </div>
                                {selectedOp?.id === op.id && (
                                    <div className="px-8 pb-10 pt-2 space-y-10 animate-slide-up">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button onClick={() => setShowActivityModal(true)} disabled={op.status === 'Completed'} className="py-4 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-900 disabled:opacity-30 transition-all group/btn"><PlusSquare size={20} className="text-[#FBBF24] group-hover/btn:rotate-90 transition-transform"/> Log Activity</button>
                                            <button onClick={handleOpenHarvestModal} disabled={op.status === 'Completed'} className="py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-yellow-400 disabled:opacity-30 transition-all group/btn"><Sprout size={20} className="group-hover/btn:scale-125 transition-transform"/> Finalize Harvest</button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                                <h6 className="text-[9px] font-black text-[#1B4D3E] uppercase tracking-[0.4em] flex items-center gap-2"><History size={16} className="text-[#FBBF24]"/> Node Attribution History</h6>
                                                <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase">{op.logs?.length || 0} Unified Records</div>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                {(op.logs || []).map((log: any) => (
                                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-[#1B4D3E]/10 transition-all shadow-sm group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md text-[#1B4D3E] group-hover:bg-[#1B4D3E] group-hover:text-[#FBBF24] transition-all"><Zap size={18}/></div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700 leading-none">{log.resourceName}</p>
                                                                <p className="text-[9px] text-slate-400 uppercase font-bold mt-2">
                                                                    {new Date(log.activityDate).toLocaleDateString()} • {log.durationHours > 0 ? `${log.durationHours}h Applied` : `${log.quantityUsed} Units Applied`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-black text-[#1B4D3E] bg-white px-4 py-2 rounded-lg border border-[#FBBF24]/20 shadow-sm">E {log.cost.toLocaleString()}</p>
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
            {activeTab === 'CALENDAR' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 space-y-6">
                    <CalendarIcon size={100} strokeWidth={0.5} className="text-[#1B4D3E]" />
                    <h3 className="text-xl font-black uppercase tracking-[0.4em] text-[#1B4D3E]">Hub Chronology</h3>
                    <p className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest">Temporal Node Sync Active</p>
                </div>
            )}
        </div>

        {/* Modals */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl border border-white/10 shadow-lg"><Building2 size={24} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none">{editingEnt ? 'Modify Hub' : 'Register Hub'}</h3>
                        </div>
                        <button onClick={() => { setShowEnterpriseModal(false); setEditingEnt(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Nomenclature</label><input value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} placeholder="e.g. Malkerns Estate" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-inner" /></div>
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Node</label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FBBF24]" size={16}/><input value={newEnterprise.address} onChange={(e)=>setNewEnterprise({...newEnterprise, address: e.target.value})} className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-inner" /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrative Region</label><select value={newEnterprise.region} onChange={(e)=>setNewEnterprise({...newEnterprise, region: e.target.value as Region})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none shadow-inner">{Object.values(Region).filter(r => r !== Region.All).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency Node</label><select value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none shadow-inner"><option value="">Select...</option>{TINKHUNDLA[newEnterprise.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        </div>
                        <button onClick={handleSaveEnterprise} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-emerald-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Save size={16} className="text-[#FBBF24]"/>{editingEnt ? 'Sync Hub Record' : 'Establish Node'}</button>
                    </div>
                </div>
            </div>
        )}

        {showUnitModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl shadow-lg border border-white/10"><BoxSelect size={24} className="text-[#FBBF24]"/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none">{editingUnit ? 'Modify Unit' : 'Establish Unit'}</h3>
                        </div>
                        <button onClick={() => { setShowUnitModal(false); setEditingUnit(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Label</label><input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Block A1" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-inner" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Spatial Area</label><div className="w-full px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl font-bold text-sm text-[#1B4D3E] shadow-inner flex items-center justify-center gap-2"><Scale size={16}/> {newUnit.area} Ha</div></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Avg Height (m)</label><div className="relative"><Ruler size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" step="0.1" value={newUnit.height} onChange={(e) => handleUnitHeightChange(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" placeholder="0.0"/></div></div>
                        </div>
                        {parseFloat(newUnit.volume) > 0 && <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between shadow-inner animate-fade-in"><div className="flex items-center gap-3"><div className="p-2 bg-[#1B4D3E] text-[#FBBF24] rounded-lg shadow-lg"><Cuboid size={18}/></div><div><p className="text-[9px] font-black text-indigo-900 uppercase">Node Volume</p><p className="text-base font-black text-[#1B4D3E]">{newUnit.volume} m³</p></div></div><span className="text-[8px] font-black px-2 py-0.5 bg-white border border-indigo-200 rounded-md text-indigo-600 uppercase tracking-widest">Volumetric Sync</span></div>}
                        <button onClick={handleSaveUnit} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-emerald-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Save size={16} className="text-[#FBBF24]"/> Commit Spatial Node</button>
                    </div>
                </div>
            </div>
        )}

        {showAssetModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 shadow-2xl"><Boxes size={28} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight leading-none">{editingAssetId ? 'Edit Inventory Node' : 'Node Inventory Registry'}</h3>
                                <p className="text-[9px] text-green-300 font-bold uppercase tracking-[0.3em] mt-2.5">{activeUnitForInventory ? `Initializing Stock: ${activeUnitForInventory.name}` : 'Enterprise Global Stock Allocation'}</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowAssetModal(false); setEditingAssetId(null); setActiveUnitForInventory(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={28}/></button>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden bg-slate-50/20">
                            <div className="p-6 border-b border-slate-100 space-y-4">
                                {!editingAssetId && (
                                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                                      <button onClick={() => setResourceAddMode('Catalogue')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Catalogue' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Master Catalogue</button>
                                      <button onClick={() => setResourceAddMode('Manual')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resourceAddMode === 'Manual' ? 'bg-[#1B4D3E] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Manual Manifest</button>
                                  </div>
                                )}
                                {resourceAddMode === 'Catalogue' && <div className="relative group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="text" placeholder="Filter Master Registry..." value={catSearch} onChange={(e)=>setCatSearch(e.target.value)} className="w-full h-12 pl-12 pr-5 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-8 focus:ring-[#FBBF24]/5 transition-all shadow-sm" /></div>}
                                {!activeUnitForInventory && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Operational Unit Node</label>
                                        <div className="relative">
                                          <Warehouse size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FBBF24]" />
                                          <select 
                                            value={newAsset.assignedUnitId} 
                                            onChange={(e) => setNewAsset({...newAsset, assignedUnitId: e.target.value})}
                                            className="w-full pl-11 pr-4 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-[10px] text-indigo-700 uppercase outline-none focus:bg-white transition-all shadow-inner appearance-none"
                                          >
                                              <option value="">-- Mandatory: Select Unit --</option>
                                              {selectedEnterprise?.units?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                          </select>
                                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-4 bg-white">
                                {resourceAddMode === 'Catalogue' ? (
                                    masterCatalogue.filter(item => {
                                        const s = catSearch.toLowerCase();
                                        return (
                                            item.tradeName.toLowerCase().includes(s) ||
                                            item.division.toLowerCase().includes(s) ||
                                            item.category.toLowerCase().includes(s) ||
                                            item.subCategory.toLowerCase().includes(s) ||
                                            item.productType.toLowerCase().includes(s)
                                        );
                                    }).map(item => {
                                        const isSelected = !!selectedCatItems.find(p => p.item.registrationId === item.registrationId);
                                        return (
                                            <button key={item.registrationId} onClick={() => setSelectedCatItems(prev => isSelected ? prev.filter(p => p.item.registrationId !== item.registrationId) : [...prev, { item, quantity: 1, initialValue: 0, lifespanHours: 1000 }])} className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group/cat ${isSelected ? 'bg-emerald-50 border-[#1B4D3E] shadow-xl ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 hover:border-emerald-100'}`}>
                                                <div className="flex items-center gap-4"><div className={`p-3 rounded-xl transition-all shadow-md ${isSelected ? 'bg-[#1B4D3E] text-[#FBBF24] rotate-6' : 'bg-slate-50 text-slate-400'}`}>{item.productType === 'Machinery' ? <Tractor size={20}/> : <Package size={20}/>}</div><div><p className="text-xs font-black text-slate-800 leading-none">{item.tradeName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.division} • {item.category} • {item.unit}</p></div></div>
                                                {isSelected ? <CheckCircle2 size={24} className="text-[#1B4D3E]"/> : <Plus size={24} className="text-slate-200 group-hover/cat:text-[#1B4D3E] transition-colors"/>}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 space-y-6 animate-fade-in">
                                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Nomenclature</label><div className="relative"><TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input value={newAsset.name} onChange={(e)=>setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. Breeding Herd Delta" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" /></div></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label><select value={newAsset.type} onChange={(e)=>setNewAsset({...newAsset, type: e.target.value as ResourceType})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white appearance-none shadow-inner"><option value={ResourceType.Machinery}>Mechanisation</option><option value={ResourceType.Equipment}>Equipment</option><option value={ResourceType.Animals}>Livestock</option><option value={ResourceType.Consumable}>Inputs</option></select></div>
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Category</label><select value={newAsset.category} onChange={(e)=>setNewAsset({...newAsset, category: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white appearance-none shadow-inner">
                                              <option value="General">General</option>
                                              {systemMetadata?.categoriesByDivision?.[newAsset.type === ResourceType.Machinery ? 'Mechanisation' : 'Consumables (Biological & Chemical)']?.map((c:string) => <option key={c} value={c}>{c}</option>)}
                                            </select></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Manifest</label><input type="number" value={newAsset.quantity} onChange={(e)=>setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" /></div>
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit of Measure</label><select value={newAsset.unitNumber} onChange={(e)=>setNewAsset({...newAsset, unitNumber: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white appearance-none shadow-inner">
                                              {systemMetadata?.units?.map((u:string) => <option key={u} value={u}>{u}</option>)}
                                            </select></div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Node Book Value (E)</label>
                                            <div className="relative">
                                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">E</span>
                                              <input type="number" value={newAsset.initialValue} onChange={(e)=>setNewAsset({...newAsset, initialValue: parseFloat(e.target.value) || 0})} className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full md:w-[360px] bg-slate-50/80 border-l border-slate-200 flex flex-col p-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-[#1B4D3E]/40">Synchronization Manifest</h4>
                            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-6">
                                {editingAssetId ? (
                                   <div className="bg-white p-6 rounded-2xl border border-[#FBBF24] space-y-4 shadow-xl">
                                      <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                        <div className="p-2 bg-[#1B4D3E] text-[#FBBF24] rounded-lg"><RefreshCw size={14}/></div>
                                        <p className="text-[10px] font-black text-[#1B4D3E] uppercase">Updating Registry Node</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Target Identity</p>
                                        <p className="text-xs font-black text-slate-700">{newAsset.name}</p>
                                      </div>
                                   </div>
                                ) : (
                                  <>
                                  {selectedCatItems.map(sel => (
                                      <div key={sel.item.registrationId} className="bg-white p-5 rounded-2xl border border-[#FBBF24]/20 space-y-4 shadow-sm hover:shadow-xl transition-all">
                                          <div className="flex justify-between items-start border-b border-slate-50 pb-3"><p className="text-[10px] font-black text-[#1B4D3E] truncate leading-none mt-1">{sel.item.tradeName}</p><button onClick={() => setSelectedCatItems(prev => prev.filter(p => p.item.registrationId !== sel.item.registrationId))} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><MinusCircle size={18}/></button></div>
                                          <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Qty</label><input type="number" value={sel.quantity} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100 focus:bg-white transition-all shadow-inner" /></div>
                                              <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Value (E)</label><input type="number" value={sel.initialValue} onChange={(e)=> setSelectedCatItems(prev => prev.map(p => p.item.registrationId === sel.item.registrationId ? { ...p, initialValue: parseFloat(e.target.value) || 0 } : p))} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-black outline-none border border-slate-100 focus:bg-white transition-all shadow-inner" /></div>
                                          </div>
                                      </div>
                                  ))}
                                  {selectedCatItems.length === 0 && resourceAddMode === 'Catalogue' && <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-20 space-y-4 border-4 border-dashed border-slate-200 rounded-[2.5rem]"><Archive size={48} strokeWidth={1} className="text-[#1B4D3E]"/><p className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed text-[#1B4D3E]">Select vetted inputs to commit to unit node inventory.</p></div>}
                                  {resourceAddMode === 'Manual' && <div className="bg-white p-5 rounded-2xl border border-indigo-100 space-y-2 animate-fade-in"><div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase"><PenTool size={14}/> Manual Entry Verified</div><p className="text-[8px] text-slate-400 font-medium">Registry compliance will be audited by the regional Extension Node.</p></div>}
                                  </>
                                )}
                            </div>
                            <button onClick={handleSaveAsset} disabled={(selectedCatItems.length === 0 && resourceAddMode === 'Catalogue') || (resourceAddMode === 'Manual' && !newAsset.name)} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30">
                              {editingAssetId ? 'Commit Registry Update' : 'Commit Inventory Sync'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4"><div className="p-3 bg-white/10 rounded-xl border border-white/10 shadow-lg"><Zap size={20} className="text-[#FBBF24]"/></div><h3 className="text-lg font-black uppercase tracking-tight leading-none">Initialize Cycle</h3></div>
                        <button onClick={() => setShowOpModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chronology Label</label><input value={newOp.activity} onChange={(e)=>setNewOp({...newOp, activity: e.target.value})} placeholder="e.g. Winter Hybrid Maize Plot A" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#FBBF24]/10 transition-all shadow-sm" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Operational Unit</label><select value={newOp.field} onChange={(e)=>setNewOp({...newOp, field: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white appearance-none shadow-sm"><option value="">Select Target...</option>{(selectedEnterprise?.units || []).map((u:any) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label><input type="date" value={newOp.startDateTime} onChange={(e)=>setNewOp({...newOp, startDateTime: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-sm" /></div>
                        </div>
                        <button onClick={async () => {
                            const ent = await db.getById<any>(Table.Enterprises, selectedEntId!);
                            const opObj = { ...newOp, id: `OP-${Date.now()}`, accumulatedCost: 0, progress: 0, status: 'Scheduled', logs: [] };
                            ent.operations = [...(ent.operations || []), opObj];
                            await db.update(Table.Enterprises, selectedEntId!, ent);
                            setShowOpModal(false); await loadAllData(selectedEntId!);
                        }} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-emerald-900 transition-all">Establish Cycle Node</button>
                    </div>
                </div>
            </div>
        )}

        {showActivityModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center shrink-0"><h3 className="text-lg font-black uppercase tracking-tight">Log Activity</h3><button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={24}/></button></div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Attribution</label>
                            <input value={activityForm.activity} onChange={(e)=>setActivityForm({...activityForm, activity: e.target.value})} placeholder={selectedOp.activity} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Date</label>
                            <div className="relative">
                                <CalendarDaysIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                <input type="date" value={activityForm.activityDate} onChange={(e)=>setActivityForm({...activityForm, activityDate: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-inner" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Resource Node</label>
                            <select value={activityForm.resourceId} onChange={(e)=>setActivityForm({...activityForm, resourceId: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none shadow-inner">
                                <option value="">Select Resource...</option>
                                <option disabled className="font-black text-slate-300">--- Workforce ---</option>
                                {orgEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                <option disabled className="font-black text-slate-300">--- Unit Inventory ---</option>
                                {(selectedEnterprise?.resources || []).map((r: any) => (
                                    <option key={r.id} value={r.id} disabled={r.quantity <= 0}>
                                        {r.name} ({r.quantity} {r.unitNumber} available)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Applied</label><input type="number" value={activityForm.quantity} onChange={(e)=>setActivityForm({...activityForm, quantity: parseFloat(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Hrs)</label><input type="number" value={activityForm.duration} onChange={(e)=>setActivityForm({...activityForm, duration: parseFloat(e.target.value) || 1})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div>
                        </div>
                        <button onClick={handleLogActivity} className="w-full py-5 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-2"><Coins size={16}/> Commit Activity Node</button>
                    </div>
                </div>
            </div>
        )}

        {showHarvestModal && selectedOp && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#FBBF24]/20 flex flex-col max-h-[90vh]">
                    <div className="bg-emerald-900 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white/10 rounded-xl"><Archive size={20} className="text-[#FBBF24]"/></div>
                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">Finalize Harvest</h3>
                        </div>
                        <button onClick={() => setShowHarvestModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                           <div className="flex items-center gap-2 text-[#1B4D3E] font-black uppercase text-[8px] tracking-[0.2em]">
                              <BadgeCheck size={12} className="text-emerald-500" /> Traceability Synchronized
                           </div>
                           <p className="text-[10px] font-mono font-black text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm break-all">
                              {harvestForm.traceId}
                           </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harvested Commodity (Vetted Catalogue)</label>
                            <div className="relative">
                               <RefreshCw size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FBBF24]" />
                               <select 
                                 value={harvestForm.name} 
                                 onChange={(e) => {
                                    const selectedItem = masterCatalogue.find(i => i.tradeName === e.target.value);
                                    setHarvestForm({
                                        ...harvestForm, 
                                        name: e.target.value, 
                                        category: selectedItem?.category || 'Crops',
                                        unit: selectedItem?.unit || 'kg'
                                    });
                                 }}
                                 className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white appearance-none shadow-inner"
                               >
                                  <option value="">Select Vetted Produce...</option>
                                  {masterCatalogue.map(item => (
                                      <option key={item.registrationId} value={item.tradeName}>{item.tradeName} ({item.division} - {item.subCategory})</option>
                                  ))}
                               </select>
                               <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harvest Start Date</label>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="date" value={harvestForm.startDate} onChange={(e)=>setHarvestForm({...harvestForm, startDate: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Hrs)</label>
                                <div className="relative">
                                    <TimerIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="number" value={harvestForm.duration} onChange={(e)=>setHarvestForm({...harvestForm, duration: parseFloat(e.target.value) || 1})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Yield</label><input type="number" value={harvestForm.quantity} onChange={(e)=>setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-inner" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label><select value={harvestForm.unit} onChange={(e)=>setHarvestForm({...harvestForm, unit: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none shadow-inner">
                                {systemMetadata?.units?.map((u: string) => <option key={u} value={u}>{u}</option>)}
                            </select></div>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                           <CheckCircle2 size={20} className="text-emerald-600 mt-1 shrink-0"/>
                           <p className="text-[9px] text-emerald-800 leading-relaxed font-bold">
                              Committing this harvest generates an authenticated Refined Chronology ID, making the produce eligible for institutional trade.
                           </p>
                        </div>
                        <button onClick={handleFinalizeHarvest} disabled={!harvestForm.name} className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-800 transition-all disabled:opacity-50">
                            Commit to Trade Hub
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Production;