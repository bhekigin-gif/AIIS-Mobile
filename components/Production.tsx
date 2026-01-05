import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Tractor, Settings, Users, MapPin, Plus, X, PenTool, ChevronRight, 
  Building2, Activity, MousePointer2, CheckCircle2, Info, History, 
  Box, Ruler, Save, Trash2, Map as MapIcon, Briefcase, Loader2, ArrowRight,
  ShieldCheck, MapPinOff, Sparkles, DollarSign, UserCheck, Globe, Search,
  Backpack, Cog, Wrench, Package, AlertCircle, TrendingDown, ClipboardList,
  Clock, CheckSquare, Zap, Calendar, ShoppingCart, Tag, ExternalLink,
  Factory,
  ArrowUpRight, BarChart3, Receipt, FileSearch,
  Store, PackagePlus, QrCode, Edit, Target, ArrowDownRight, Gauge,
  Sprout, Download, UserPlus, Link, ChevronLeft,
  LayoutList,
  Play,
  Lock,
  Camera,
  Upload,
  Layers,
  ImageIcon,
  Edit3,
  FileText,
  Percent,
  TrendingUp,
  Scale,
  Wand2,
  Maximize2,
  Check,
  ChevronDown,
  Database,
  Navigation,
  Landmark,
  Eye,
  LayoutGrid,
  BarChart4,
  Wallet,
  Timer,
  Hash,
  SearchCode,
  Mountain,
  Coins,
  RefreshCw,
  Bell,
  CheckCircle,
  User,
  Shield
} from 'lucide-react';
import { Operation, SalesProduct, MarketOrder, UserProfile, Region, Resource, ResourceType, CatalogueItem, ProductionProcess, UserRole, EntityType } from '../types';
import { View_Master_Catalogue, Get_Users_By_Organization, Add_To_Master_Catalogue, View_All_System_Users, Affiliate_User_With_Org, Get_System_Metadata } from '../services/adminDataService';
import { generateAIReport, prefillCatalogueItem } from '../services/geminiService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";
const PLACE_HOLDER_IMAGE = "https://images.unsplash.com/photo-1492496913980-501348b61384?w=300&h=300&fit=crop";

const generateShortId = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0; 
    }
    return Math.abs(hash).toString(36).toUpperCase().slice(0, 4);
};

const seedMgulukudeniData = () => [
    {
        id: 'GININDZA-001',
        name: 'Ginindza Green Estate',
        region: Region.Manzini,
        gps: { lat: -26.512, lng: 31.398 },
        country: 'Eswatini',
        inkhundla: 'Manzini South',
        closestPOI: 'MR3 Highway',
        units: [
            { 
                id: 'UNIT-001', name: 'SSibaya Setinkhomo', unitNumber: 'U-001', area: 0.032, costPerHour: 15, supervisor: 'M. Ginindza',
                points: [{lat: -26.5115, lng: 31.3975}, {lat: -26.5115, lng: 31.3985}, {lat: -26.5120, lng: 31.3985}, {lat: -26.5120, lng: 31.3975}]
            },
            { 
                id: 'UNIT-004', name: 'Main Crop Block A', unitNumber: 'U-004', area: 0.450, costPerHour: 45, supervisor: 'S. Dlamini',
                points: [{lat: -26.5115, lng: 31.3986}, {lat: -26.5115, lng: 31.3995}, {lat: -26.5125, lng: 31.3995}, {lat: -26.5125, lng: 31.3986}]
            }
        ],
        resources: [
            { id: 'R1', type: ResourceType.Machinery, name: 'John Deere 5050D', unitNumber: 'SZ-TR-001', category: 'Tractor', unitCost: 450, quantity: 1, assignedUnitId: 'UNIT-004', status: 'Available', totalUsageHours: 120 },
            { id: 'R2', type: ResourceType.Personnel, name: 'Simon Dlamini', unitNumber: 'EMP-001', category: 'Foreman', unitCost: 65, quantity: 1, assignedUnitId: 'UNIT-004', status: 'Available', linkedUserId: 'SIMON', totalUsageHours: 450 },
            { id: 'R3', type: ResourceType.Consumable, name: 'PAN 53 Hybrid Maize', unitNumber: 'LOT-992', category: 'Seed', unitCost: 850, quantity: 20, threshold: 5, assignedUnitId: 'UNIT-004', status: 'Available' }
        ],
        processes: [
            { id: 'PRC-1042', unitId: 'UNIT-004', name: 'Maize Production - Summer 2024', commodity: 'Maize', status: 'Active', totalAccumulatedCost: 4800, startDate: '2024-02-01' }
        ],
        operations: [
            { id: 'OP-5501', activity: 'Pre-Planting Fertilization', processId: 'PRC-1042', type: 'Production', field: 'UNIT-004', status: 'Completed', progress: 100, startDateTime: '2024-02-01T08:00', endDateTime: '2024-02-01T17:00', assignedResources: ['R1', 'R2'], durationHours: 9, accumulatedCost: 4800 }
        ]
    }
];

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
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isDroppingPin, setIsDroppingPin] = useState(false);

  // System Metadata
  const systemMetadata = Get_System_Metadata();
  
  const [enterprises, setEnterprises] = useState<any[]>(() => {
    const scopeIds = [user?.organizationId || '', user?.id || '', ...(user?.affiliations || [])].filter(id => id !== '');
    let allAccessibleEnterprises: any[] = [];
    Array.from(new Set(scopeIds)).forEach(id => {
        const key = `aiis_enterprises_v5_${id}`;
        const saved = localStorage.getItem(key);
        if (saved) allAccessibleEnterprises = [...allAccessibleEnterprises, ...JSON.parse(saved)];
    });
    if (allAccessibleEnterprises.length === 0 && (user?.id === 'MG' || user?.id === 'SIMON' || user?.affiliations?.includes('GININDZA-001'))) {
        return seedMgulukudeniData();
    }
    return allAccessibleEnterprises;
  });

  const [selectedEnterprise, setSelectedEnterprise] = useState<any | null>(enterprises[0] || null);
  
  // Resource Modal State
  const [showResourceModal, setShowResourceModal] = useState(false);
  type ResourceStep = 'unit' | 'type' | 'catalogue_select' | 'new_catalogue_item' | 'details' | 'personnel';
  const [resourceStep, setResourceStep] = useState<ResourceStep>('unit');
  const [newResource, setNewResource] = useState<Partial<Resource>>({
      type: systemMetadata.resourceTypes[0] as ResourceType, name: '', unitNumber: '', category: '', unitCost: 0, quantity: 1, threshold: 0, status: 'Available', assignedUnitId: ''
  });
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [personnelSearch, setPersonnelSearch] = useState('');

  // Catalogue Selection State
  const [masterCatalogue, setMasterCatalogue] = useState<CatalogueItem[]>(View_Master_Catalogue());
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [newCatItem, setNewCatItem] = useState<Partial<CatalogueItem>>({ tradeName: '', division: '', category: '', subCategory: '', unit: '', manufacturer: '', productStandard: 'ISO-Verified', description: '' });

  const [showOpModal, setShowOpModal] = useState(false);
  const [opStep, setOpStep] = useState<'unit_process' | 'activity_details' | 'resources' | 'produce'>('unit_process');
  const [selectedOpUnit, setSelectedOpUnit] = useState<string>('');
  const [selectedOpProcessId, setSelectedOpProcessId] = useState<string>('NEW');
  const [newProcessName, setNewProcessName] = useState<string>('');
  const [newProcessCommodity, setNewProcessCommodity] = useState<string>(systemMetadata.commodityCategories[0] || 'Maize');
  const [selectedOpResources, setSelectedOpResources] = useState<string[]>([]);
  const [resourceUsageQty, setResourceUsageQty] = useState<Record<string, number>>({});
  const [opStartDateTime, setOpStartDateTime] = useState<string>('');
  const [opEndDateTime, setOpEndDateTime] = useState<string>('');
  const [opName, setOpName] = useState<string>('');
  const [opType, setOpType] = useState<any>(systemMetadata.operationTypes[0] || 'Production');

  const [produceForm, setProduceForm] = useState<Partial<SalesProduct> & { proportion: number }>({
      name: '', category: systemMetadata.commodityCategories[0], price: 0, unit: 'kg', quantity: 0, description: '', image: undefined, manufacturer: user?.name || '', proportion: 100
  });

  const allSystemUsers = View_All_System_Users();

  const metricsData = useMemo(() => {
    if (!selectedEnterprise) return { budget: { actual: 0 }, revenue: 0, roi: '0', operationalUnits: 0 };
    const totalCost = selectedEnterprise.processes?.reduce((acc: number, p: any) => acc + (p.totalAccumulatedCost || 0), 0) || 0;
    const myProducts = products.filter(p => p.sellerId === selectedEnterprise.id);
    const estimatedRevenue = myProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0); 
    const roi = totalCost > 0 ? (((estimatedRevenue - totalCost) / totalCost) * 100).toFixed(1) : '0';
    return { budget: { actual: totalCost }, revenue: estimatedRevenue, roi, operationalUnits: selectedEnterprise.units?.length || 0 };
  }, [selectedEnterprise, products]);

  useEffect(() => {
    if ((window as any).google?.maps) { setGoogleApiLoaded(true); return; }
    let script = document.getElementById('google-maps-script') as HTMLScriptElement;
    if (!script) {
        script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
        script.async = true;
        document.head.appendChild(script);
    }
    script.addEventListener('load', () => setGoogleApiLoaded(true));
  }, []);

  useEffect(() => {
      if (activeTab === 'ESTABLISHMENT' && googleApiLoaded && mapRef.current) {
          const map = new (window as any).google.maps.Map(mapRef.current, {
              center: selectedEnterprise?.gps || { lat: -26.48, lng: 31.37 },
              zoom: selectedEnterprise ? 18 : 12,
              mapTypeId: 'satellite',
              disableDefaultUI: false,
          });
          setMapInstance(map);

          enterprises.forEach(ent => {
              const marker = new (window as any).google.maps.Marker({
                  position: ent.gps, map: map, title: ent.name,
                  icon: {
                      url: ent.id === selectedEnterprise?.id ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                      scaledSize: new (window as any).google.maps.Size(44, 44)
                  }
              });
              marker.addListener('click', () => setSelectedEnterprise(ent));
              if (ent.id === selectedEnterprise?.id) {
                  ent.units?.forEach((unit: any) => {
                      new (window as any).google.maps.Polygon({ paths: unit.points, strokeColor: '#10b981', strokeWeight: 2, fillColor: '#10b981', fillOpacity: 0.35, map: map });
                  });
              }
          });
      }
  }, [activeTab, googleApiLoaded, selectedEnterprise, enterprises]);

  const resetOpState = () => {
    setOpStep('unit_process'); setSelectedOpUnit(''); setSelectedOpProcessId('NEW'); setNewProcessName(''); setNewProcessCommodity(systemMetadata.commodityCategories[0] || 'Maize');
    setSelectedOpResources([]); setResourceUsageQty({}); setOpStartDateTime(''); setOpEndDateTime(''); setOpName(''); setOpType(systemMetadata.operationTypes[0] || 'Production');
    setProduceForm({ name: '', category: systemMetadata.commodityCategories[0], price: 0, unit: 'kg', quantity: 0, description: '', image: undefined, manufacturer: user?.name || '', proportion: 100 });
  };

  const handleAddResource = () => {
      if (!newResource.assignedUnitId) return;

      const resource: Resource = {
          ...newResource as Resource,
          id: `R-${Date.now()}`,
          totalUsageHours: 0,
          status: 'Available'
      };

      const updatedEnts = enterprises.map(ent => {
          if (ent.id === selectedEnterprise.id) {
              return { ...ent, resources: [...(ent.resources || []), resource] };
          }
          return ent;
      });

      setEnterprises(updatedEnts);
      setSelectedEnterprise(updatedEnts.find(e => e.id === selectedEnterprise.id));
      setShowResourceModal(false);
      setNewResource({ type: systemMetadata.resourceTypes[0] as ResourceType, name: '', unitNumber: '', category: '', unitCost: 0, quantity: 1, threshold: 0, status: 'Available', assignedUnitId: '' });
      setResourceStep('unit');
      setNewCatItem({ tradeName: '', division: '', category: '', subCategory: '', unit: '', manufacturer: '', productStandard: 'ISO-Verified', description: '' });
  };

  const handleSelectPersonnel = (p: UserProfile) => {
      setNewResource(prev => ({
          ...prev,
          name: p.name,
          unitNumber: p.id || 'N/A',
          category: 'Labor',
          linkedUserId: p.id,
          unitCost: 25 // Default labor rate
      }));
      setResourceStep('details');
  };

  const handleAIResearchCatalogue = async () => {
    if (!newCatItem.tradeName) return;
    setIsPrefilling(true);
    try {
        const research = await prefillCatalogueItem(newCatItem.tradeName);
        setNewCatItem(prev => ({
            ...prev,
            division: research.division || prev.division,
            category: research.category || prev.category,
            subCategory: research.subCategory || prev.subCategory,
            unit: research.unit || prev.unit,
            manufacturer: research.manufacturer || prev.manufacturer,
            productStandard: research.productStandard || prev.productStandard,
            description: research.description || prev.description
        }));
    } catch (e) {
        console.error("AI Catalogue Research Error", e);
    } finally {
        setIsPrefilling(false);
    }
  };

  const handleSaveAndSelectNewItem = () => {
      if (!newCatItem.tradeName) return;
      const completeItem: CatalogueItem = {
          registrationId: `REG-NEW-${Date.now()}`,
          division: newCatItem.division || (newResource.type === ResourceType.Machinery ? 'Machinery' : newResource.type === ResourceType.Equipment ? 'Equipment' : 'Crops'),
          category: newCatItem.category || 'General',
          subCategory: newCatItem.subCategory || 'N/A',
          productType: newResource.type === ResourceType.Machinery ? 'Machinery' : newResource.type === ResourceType.Equipment ? 'Equipment' : 'Consumable',
          tradeName: newCatItem.tradeName,
          unit: newCatItem.unit || 'Unit',
          manufacturer: newCatItem.manufacturer || 'Local Supplier',
          productStandard: newCatItem.productStandard || 'National Verified',
          description: newCatItem.description || 'New item added via Production workflow.',
          availableDistrict: 'National',
          availableRDA: 'All',
          availableConstituency: 'All',
          availableRegNo: 'REG-AUTO',
          status: 'Pending'
      };

      // Add to master catalogue in data service
      const updatedCat = Add_To_Master_Catalogue([completeItem]);
      setMasterCatalogue(updatedCat);
      
      // Select for the current resource
      handleSelectFromCatalogue(completeItem);
  };

  const handleSelectFromCatalogue = (item: CatalogueItem) => {
      setNewResource(prev => ({
          ...prev,
          name: item.tradeName,
          category: item.category,
          catalogueRef: item.registrationId,
          details: item.description
      }));
      setResourceStep('details');
  };

  const handleLogOperation = () => {
      const startTime = new Date(opStartDateTime).getTime();
      const endTime = new Date(opEndDateTime).getTime();
      const durationHours = Math.max(0.1, (endTime - startTime) / (1000 * 60 * 60));

      let totalOpCost = 0;
      const updatedResources = [...(selectedEnterprise.resources || [])];
      
      const unit = selectedEnterprise.units.find((u:any) => u.id === selectedOpUnit);
      if (unit) totalOpCost += (unit.costPerHour || 0) * durationHours;

      selectedOpResources.forEach(resId => {
          const resIdx = updatedResources.findIndex(r => r.id === resId);
          if (resIdx > -1) {
              const res = updatedResources[resIdx];
              if (res.type === ResourceType.Consumable) {
                  const qtyUsed = resourceUsageQty[resId] || 1;
                  totalOpCost += res.unitCost * qtyUsed;
                  updatedResources[resIdx].quantity = Math.max(0, res.quantity - qtyUsed);
                  if (updatedResources[resIdx].quantity <= (res.threshold || 0)) {
                      updatedResources[resIdx].status = 'Low Stock';
                  }
              } else {
                  totalOpCost += res.unitCost * durationHours;
                  updatedResources[resIdx].totalUsageHours = (updatedResources[resIdx].totalUsageHours || 0) + durationHours;
                  updatedResources[resIdx].status = 'Available'; 
              }
          }
      });

      const newOp: Operation = {
          id: `OP-${Date.now()}`, activity: opName, type: opType, field: selectedOpUnit, processId: selectedOpProcessId,
          status: 'Completed', progress: 100, startDateTime: opStartDateTime, endDateTime: opEndDateTime,
          assignedResources: selectedOpResources, accumulatedCost: totalOpCost, durationHours
      };

      const updatedEnts = enterprises.map(ent => {
          if (ent.id === selectedEnterprise.id) {
              const processes = [...(ent.processes || [])];
              if (selectedOpProcessId === 'NEW') {
                  const newP: ProductionProcess = {
                      id: `PRC-${Date.now()}`, unitId: selectedOpUnit, name: newProcessName, commodity: newProcessCommodity,
                      status: 'Active', totalAccumulatedCost: totalOpCost, startDate: opStartDateTime.split('T')[0]
                  };
                  newOp.processId = newP.id;
                  processes.push(newP);
              } else {
                  const pIdx = processes.findIndex(p => p.id === selectedOpProcessId);
                  if (pIdx > -1) processes[pIdx].totalAccumulatedCost += totalOpCost;
              }
              return { ...ent, resources: updatedResources, processes, operations: [...(ent.operations || []), newOp] };
          }
          return ent;
      });

      setEnterprises(updatedEnts);
      setSelectedEnterprise(updatedEnts.find(e => e.id === selectedEnterprise.id));

      if (opType === 'Harvest' || opType === 'Processing') {
          const currentProcess = updatedEnts.find(e => e.id === selectedEnterprise.id)?.processes.find((p: any) => p.id === (newOp.processId || selectedOpProcessId));
          const cycleTotalCost = currentProcess?.totalAccumulatedCost || totalOpCost;
          setProduceForm(prev => ({ 
              ...prev, 
              costPrice: cycleTotalCost,
              proportion: 100,
              name: opName, 
              category: opType === 'Harvest' ? 'Crops' : 'Processed Food',
              commodityType: newProcessCommodity,
              manufacturer: selectedEnterprise.name,
              sourceUnit: selectedOpUnit
          }));
          setOpStep('produce');
      } else {
          setShowOpModal(false); resetOpState(); setActiveTab('OPERATIONS');
      }
  };

  const handleFinalizeProduce = () => {
      if (!produceForm.name) return;
      const baseCycleCost = produceForm.costPrice || 0;
      const allocatedCost = baseCycleCost * (produceForm.proportion / 100);
      const entCode = generateShortId(selectedEnterprise.id);
      const unitCode = selectedOpUnit.slice(-4);
      const timestamp = Date.now().toString(36).toUpperCase();
      const traceableBatchId = `BCH-${entCode}-${unitCode}-${timestamp}`;
      
      const newListing: SalesProduct = {
          id: traceableBatchId, 
          name: produceForm.name!, 
          category: produceForm.category, 
          price: produceForm.price || 0,
          unit: produceForm.unit || 'kg', 
          quantity: produceForm.quantity || 0, 
          description: produceForm.description, 
          image: produceForm.image,
          dateListed: new Date().toISOString().split('T')[0], 
          status: 'Active', 
          sellerName: selectedEnterprise.name,
          sellerId: selectedEnterprise.id, 
          region: selectedEnterprise.region, 
          costPrice: allocatedCost,
          operationId: `OP-${Date.now()}`,
          manufacturer: selectedEnterprise.name,
          sourceUnit: selectedOpUnit
      };
      
      setProducts(prev => [newListing, ...prev]);
      setShowOpModal(false); resetOpState(); setActiveTab('OPERATIONS');
      alert(`Produce batch ${newListing.id} published with allocated cost of E ${allocatedCost.toLocaleString()}`);
  };

  const handleCompleteProcess = (processId: string) => {
      if (!window.confirm("Confirm deactivation of this production cycle? This will archive the costs and free the operational unit for a new sequence.")) return;

      const updatedEnts = enterprises.map(ent => {
          if (ent.id === selectedEnterprise.id) {
              const processes = ent.processes.map((p: any) => {
                  if (p.id === processId) {
                      return { ...p, status: 'Completed', endDate: new Date().toISOString().split('T')[0] };
                  }
                  return p;
              });
              return { ...ent, processes };
          }
          return ent;
      });

      setEnterprises(updatedEnts);
      setSelectedEnterprise(updatedEnts.find(e => e.id === selectedEnterprise.id));
      alert("Production cycle archived successfully.");
  };

  const startNewActivityOnProcess = (processId: string, unitId: string) => {
    resetOpState();
    setSelectedOpUnit(unitId);
    setSelectedOpProcessId(processId);
    setOpStep('activity_details');
    setShowOpModal(true);
  };

  const startHarvestOnProcess = (processId: string, unitId: string) => {
    resetOpState();
    setSelectedOpUnit(unitId);
    setSelectedOpProcessId(processId);
    setOpType('Harvest');
    setOpName('Batch Harvest');
    setOpStep('activity_details');
    setShowOpModal(true);
  };

  const renderEstablishment = () => (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-5">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><MapIcon size={24}/></div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">Establishment & GIS</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Hub Mapping</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { setIsDroppingPin(true); }} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-200 hover:bg-slate-50 flex items-center gap-2`}>
                   <Plus size={16}/> New Enterprise
                </button>
                <button onClick={() => {}} disabled={!selectedEnterprise} className="px-6 py-3 bg-[#1B4D3E] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#143d31] transition-all flex items-center gap-2">
                    <PenTool size={16}/> Trace Operational Unit
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden h-[500px]">
                <div ref={mapRef} className="w-full h-full z-10" />
            </div>
            <div className="space-y-6">
                <div className="bg-[#1B4D3E] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
                    <div className="relative z-10 space-y-6 flex-1">
                        <div>
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 mb-4 w-fit"><Building2 size={28} className="text-[#FBBF24]"/></div>
                            <h4 className="text-2xl font-black tracking-tight leading-tight">{selectedEnterprise?.name || 'Select Enterprise'}</h4>
                            <p className="text-[10px] text-green-300 font-black uppercase tracking-[0.2em] mt-2">{selectedEnterprise?.region} Region</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-green-100/60 uppercase tracking-widest">Defined Operational Units</p>
                            {selectedEnterprise?.units?.map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/20 text-green-300 rounded-lg"><Target size={14}/></div>
                                        <div><p className="text-sm font-bold">{u.name}</p><p className="text-[9px] font-black uppercase opacity-40">{u.area} Ha</p></div>
                                    </div>
                                    <ChevronRight size={16} className="opacity-30"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-8 animate-fade-in pb-20">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner"><Backpack size={32}/></div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Inventory & Assets</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Resource Capacity & Utility Rates</p>
                </div>
            </div>
            <button onClick={() => { setResourceStep('unit'); setShowResourceModal(true); }} className="w-full sm:w-auto px-8 py-4 bg-[#1B4D3E] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-[#143d31] transition-all">
                <Plus size={18} className="text-[#FBBF24]"/> Add Asset/Personnel
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedEnterprise?.resources?.map((res: Resource) => (
                <div key={res.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                    <div className="p-6 border-b border-slate-50">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    {res.type === 'Machinery' ? <Tractor size={20}/> : res.type === 'Personnel' ? <Users size={20}/> : <Package size={20}/>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.type}</p>
                                    <h4 className="font-black text-slate-800">{res.name}</h4>
                                </div>
                            </div>
                            {res.status === 'Low Stock' && (
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-full animate-pulse" title="Low Stock Alert">
                                    <Bell size={16}/>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Rate</p>
                                <p className="font-black text-slate-800">E {res.unitCost}<span className="text-[9px] font-bold opacity-30"> / {res.type === 'Consumable Input' ? 'Unit' : 'hr'}</span></p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${res.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{res.status}</span>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                             <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                <span>Unit Linkage</span>
                                <span className="text-slate-900 font-bold">{selectedEnterprise.units.find((u:any) => u.id === res.assignedUnitId)?.name || 'Unassigned'}</span>
                             </div>
                        </div>
                        {res.type !== 'Consumable Input' ? (
                             <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Utilization Tracking</span><span>{res.totalUsageHours?.toFixed(1) || 0} Hrs</span></div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full"><div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${Math.min(100, (res.totalUsageHours || 0) / 10)}%` }}></div></div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Stock Balance</span><span>{res.quantity} Units</span></div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full">
                                    <div className={`h-full rounded-full transition-all ${res.quantity <= (res.threshold || 0) ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (res.quantity / 20) * 100)}%` }}></div>
                                </div>
                                {res.threshold !== undefined && <p className="text-[8px] font-bold text-slate-400 uppercase text-right">Alert Threshold: {res.threshold}</p>}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
            <div className="flex items-center gap-5">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><ClipboardList size={24}/></div>
                <div><h4 className="font-black text-slate-800 text-lg">Active Production & Processing</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Intelligence Hub</p></div>
            </div>
            <button onClick={() => { resetOpState(); setShowOpModal(true); }} className="bg-[#1B4D3E] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#143d31] transition-all shadow-xl active:scale-95"><Zap size={18} className="text-[#FBBF24]"/> Start Production / Process</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {selectedEnterprise?.processes?.filter((p: any) => p.status === 'Active').map((process: any) => (
                    <div key={process.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-l-8 border-l-[#1B4D3E] p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h5 className="text-2xl font-black text-slate-800 leading-tight">{process.name}</h5>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">{process.commodity} • {selectedEnterprise.units.find((u:any)=>u.id===process.unitId)?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Accumulated OPEX</p>
                                <p className="text-3xl font-black text-[#1B4D3E]">E {process.totalAccumulatedCost?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-slate-50">
                            {selectedEnterprise?.operations?.filter((o: any) => o.processId === process.id).map((op: any) => (
                                <div key={op.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group transition-all hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 h-fit shadow-sm`}>
                                            {op.type === 'Harvest' ? <Package size={16}/> : op.type === 'Processing' ? <Factory size={16}/> : <Sprout size={16}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{op.activity}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {new Date(op.startDateTime).toLocaleDateString()} • {op.durationHours?.toFixed(1)} hrs • {op.assignedResources.length} Assets Used
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-800">E {op.accumulatedCost?.toLocaleString()}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Proportional Allocation</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button 
                                onClick={() => startNewActivityOnProcess(process.id, process.unitId)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm group"
                            >
                                <Plus size={14} className="text-amber-500 group-hover:text-white" /> Add Activity
                            </button>
                            <button 
                                onClick={() => startHarvestOnProcess(process.id, process.unitId)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-[#1B4D3E] hover:text-white transition-all shadow-sm group"
                            >
                                <Package size={14} className="text-emerald-500 group-hover:text-white" /> Harvest Batch
                            </button>
                            <button 
                                onClick={() => handleCompleteProcess(process.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                            >
                                <CheckSquare size={14} className="text-red-500 group-hover:text-white" /> Complete Cycle
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-6">
                <div className="bg-[#1B4D3E] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10"><p className="text-[10px] font-black text-green-300 uppercase mb-4">Total OPEX Validation</p><h4 className="text-4xl font-black">E {metricsData?.budget?.actual?.toLocaleString()}</h4><p className="text-xs text-green-100/70 mt-2">Aggregate costs across all operational units.</p></div>
                    <TrendingUp size={200} className="absolute -right-20 -bottom-20 text-white/5 pointer-events-none" />
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Node Interaction</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Resource costs are now distributed proportionally: Machinery and Personnel are charged by duration hours, while Consumables are allocated based on exact quantity utilized.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );

  const renderCalendar = () => {
    const ops = selectedEnterprise?.operations || [];
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner"><Calendar size={32}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Operational Timeline</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Lifecycle Tracking & Scheduled Phases</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Active Tracking</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-12 relative before:absolute before:left-8 before:top-4 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                    {ops.sort((a:any, b:any) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()).map((op: any) => (
                        <div key={op.id} className="relative pl-20 group">
                            <div className={`absolute left-4 top-0 w-8 h-8 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center transition-all group-hover:scale-110 ${op.type === 'Harvest' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {op.type === 'Harvest' ? <Check size={14} strokeWidth={4}/> : <div className="w-2 h-2 bg-slate-300 rounded-full"/>}
                            </div>
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group-hover:-translate-y-1">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">{op.type} Phase</span>
                                            <span className="text-[10px] font-bold text-slate-300">#{op.id.slice(-6)}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 mb-1">{op.activity}</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><MapPin size={12}/> {selectedEnterprise.units.find((u:any)=>u.id===op.field)?.name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl min-w-[140px] text-center border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p>
                                        <p className="font-black text-slate-700">{new Date(op.startDateTime).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(op.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {op.assignedResources.map((rid: string, i: number) => (
                                            <div key={rid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm" title={selectedEnterprise.resources.find((r:any)=>r.id===rid)?.name}>
                                                {selectedEnterprise.resources.find((r:any)=>r.id===rid)?.name.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-300 uppercase">Duration</p>
                                        <p className="text-sm font-black text-[#1B4D3E]">{op.durationHours?.toFixed(1)} <span className="text-[10px] opacity-40 uppercase">Hours</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {ops.length === 0 && (
                        <div className="py-20 text-center text-slate-400 font-bold italic">No operations recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const getFilteredCatalogue = () => {
    return masterCatalogue.filter(item => {
        const matchesSearch = item.tradeName.toLowerCase().includes(catalogueSearch.toLowerCase()) || 
                             item.category.toLowerCase().includes(catalogueSearch.toLowerCase());
        
        let matchesType = true;
        if (newResource.type === ResourceType.Machinery) matchesType = item.division === 'Machinery';
        else if (newResource.type === ResourceType.Equipment) matchesType = item.division === 'Equipment';
        else if (newResource.type === ResourceType.Consumable) matchesType = (item.division !== 'Machinery' && item.division !== 'Equipment' && item.division !== 'Personnel');
        
        return matchesSearch && matchesType;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in px-4 sm:px-0 pb-20">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-8 p-4 px-8 overflow-x-auto no-scrollbar">
                {(['ESTABLISHMENT', 'INVENTORY', 'OPERATIONS', 'CALENDAR', 'REPORTS'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-3 py-4 text-[13px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#1B4D3E]' : 'text-slate-400 hover:text-[#1B4D3E]'}`}>
                        {tab === 'ESTABLISHMENT' && <MapIcon size={16} />}
                        {tab === 'INVENTORY' && <Backpack size={16} />}
                        {tab === 'OPERATIONS' && <RefreshCw size={16} />}
                        {tab === 'CALENDAR' && <Calendar size={16} />}
                        {tab === 'REPORTS' && <BarChart3 size={16} />}
                        {tab.replace('_', ' ')}{activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#1B4D3E] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'ESTABLISHMENT' && renderEstablishment()}
        {activeTab === 'INVENTORY' && renderInventory()}
        {activeTab === 'OPERATIONS' && renderOperations()}
        {activeTab === 'CALENDAR' && renderCalendar()}
        {activeTab === 'REPORTS' && (
            <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8"><div className="p-5 bg-emerald-900 text-[#FBBF24] rounded-[2rem] shadow-xl"><BarChart3 size={40}/></div><div><h3 className="text-3xl font-black text-slate-800">Operational Synthesis</h3><p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mt-1">Enterprise Audit & ROI Strategy</p></div></div>
                    <button onClick={() => {}} className="w-full md:w-auto px-10 py-5 bg-[#FBBF24] text-[#1B4D3E] rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-3">
                        <Sparkles size={20}/> Generate Performance Report
                    </button>
                </div>
            </div>
        )}

        {/* Resource Management Modal */}
        {showResourceModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-3"><PackagePlus size={28} className="text-[#FBBF24]"/> Asset Enrollment</h3>
                        <button onClick={() => setShowResourceModal(false)}><X size={24}/></button>
                    </div>
                    <div className="p-10 overflow-y-auto no-scrollbar space-y-8 max-h-[70vh]">
                        {resourceStep === 'unit' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                                        <Target size={32}/>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800">Select Operational Unit</h4>
                                    <p className="text-xs text-slate-400 font-medium">All inventory assets must be assigned to a specific unit for cost attribution.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedEnterprise.units.map((u: any) => (
                                        <button 
                                            key={u.id}
                                            onClick={() => { setNewResource({...newResource, assignedUnitId: u.id}); setResourceStep('type'); }}
                                            className="p-5 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-[#FBBF24] hover:bg-emerald-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-white transition-colors">
                                                    <MapIcon size={20} className="text-slate-400 group-hover:text-emerald-600"/>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800">{u.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.area} Ha • {u.unitNumber}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {resourceStep === 'type' && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                {systemMetadata.resourceTypes.map((type: string) => (
                                    <button 
                                        key={type} 
                                        onClick={() => { 
                                            setNewResource({...newResource, type: type as ResourceType}); 
                                            if (type === 'Personnel') setResourceStep('personnel');
                                            else setResourceStep('catalogue_select'); 
                                        }}
                                        className="p-8 border-2 border-slate-100 rounded-3xl flex flex-col items-center gap-3 hover:border-[#FBBF24] hover:bg-emerald-50 transition-all group"
                                    >
                                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white text-slate-400 group-hover:text-emerald-600">
                                            {type === 'Machinery' && <Tractor size={32}/>}
                                            {type === 'Personnel' && <Users size={32}/>}
                                            {type === 'Consumable Input' && <Package size={32}/>}
                                            {type === 'Equipment' && <Wrench size={32}/>}
                                        </div>
                                        <span className="font-black text-xs uppercase tracking-widest text-slate-600">{type}</span>
                                    </button>
                                ))}
                                <button onClick={() => setResourceStep('unit')} className="col-span-2 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-t border-slate-50 mt-4">Back to Unit Selection</button>
                            </div>
                        )}

                        {resourceStep === 'catalogue_select' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Master Registry</label>
                                        <button 
                                            onClick={() => { 
                                                setNewCatItem({ tradeName: '', division: '', category: '', subCategory: '', unit: '', manufacturer: '', productStandard: 'ISO-Verified', description: '' });
                                                setResourceStep('new_catalogue_item'); 
                                            }}
                                            className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1 hover:text-amber-700"
                                        >
                                            <Plus size={12}/> New Commodity Item
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                        <input 
                                            type="text" 
                                            value={catalogueSearch} 
                                            onChange={(e) => setCatalogueSearch(e.target.value)}
                                            placeholder={`Search verified ${newResource.type?.toLowerCase()} registry...`}
                                            className="w-full pl-12 pr-4 py-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#1B4D3E]/5"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                                    {getFilteredCatalogue().map(item => (
                                        <button 
                                            key={item.registrationId}
                                            onClick={() => handleSelectFromCatalogue(item)}
                                            className="w-full p-5 border border-slate-100 bg-white rounded-3xl flex items-center justify-between hover:border-[#1B4D3E] hover:bg-slate-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-[#1B4D3E] group-hover:bg-white shadow-inner">
                                                    <Box size={20}/>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm leading-tight">{item.tradeName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{item.manufacturer} • {item.unit}</p>
                                                </div>
                                            </div>
                                            {item.status === 'Vetted' ? (
                                                <ShieldCheck size={16} className="text-emerald-500"/>
                                            ) : (
                                                <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400"/>
                                            )}
                                        </button>
                                    ))}
                                    {getFilteredCatalogue().length === 0 && (
                                        <div className="text-center py-10 space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Box size={32}/></div>
                                            <p className="text-slate-400 font-bold text-sm">No registry matches found for this asset type.</p>
                                            <button 
                                                onClick={() => {
                                                    setNewCatItem({ tradeName: '', division: '', category: '', subCategory: '', unit: '', manufacturer: '', productStandard: 'ISO-Verified', description: '' });
                                                    setResourceStep('new_catalogue_item');
                                                }}
                                                className="px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl font-black text-xs uppercase"
                                            >
                                                Register New Input Item
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setResourceStep('type')} className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-t border-slate-50 mt-4">Back to Resource Categories</button>
                            </div>
                        )}

                        {resourceStep === 'new_catalogue_item' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600"><Sparkles size={20}/></div>
                                    <div>
                                        <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Registry Intelligence</p>
                                        <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">Enter the product name and use AI to automatically research technical specifications for this {newResource.type?.toLowerCase()}.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Trade Name / Brand</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={newCatItem.tradeName} 
                                                onChange={(e) => setNewCatItem({...newCatItem, tradeName: e.target.value})}
                                                className="w-full p-4 border border-slate-200 bg-white rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-[#FBBF24]/10 transition-all outline-none"
                                                placeholder="e.g. NPK 2:3:2, Massey Ferguson 290, etc."
                                            />
                                            <button 
                                                onClick={handleAIResearchCatalogue}
                                                disabled={isPrefilling || !newCatItem.tradeName}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#FBBF24] text-[#1B4D3E] rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-30 group"
                                            >
                                                {isPrefilling ? <Loader2 size={18} className="animate-spin"/> : <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Division</label><input type="text" value={newCatItem.division} onChange={(e)=>setNewCatItem({...newCatItem, division: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label><input type="text" value={newCatItem.category} onChange={(e)=>setNewCatItem({...newCatItem, category: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit</label><input type="text" value={newCatItem.unit} onChange={(e)=>setNewCatItem({...newCatItem, unit: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Manufacturer</label><input type="text" value={newCatItem.manufacturer} onChange={(e)=>setNewCatItem({...newCatItem, manufacturer: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Technical Standard</label><input type="text" value={newCatItem.productStandard} onChange={(e)=>setNewCatItem({...newCatItem, productStandard: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setResourceStep('catalogue_select')} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Back</button>
                                    <button 
                                        onClick={handleSaveAndSelectNewItem} 
                                        disabled={!newCatItem.tradeName} 
                                        className="flex-[2] bg-amber-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Verify & Save to Registry <Shield size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {resourceStep === 'personnel' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Registry Member (Individual)</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                        <input 
                                            type="text" 
                                            value={personnelSearch} 
                                            onChange={(e) => setPersonnelSearch(e.target.value)}
                                            placeholder="Search by name or Registry ID..."
                                            className="w-full pl-12 pr-4 py-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                                    {allSystemUsers
                                        .filter(u => u.entityType === EntityType.Person && u.name.toLowerCase().includes(personnelSearch.toLowerCase()))
                                        .map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => handleSelectPersonnel(p)}
                                            className="w-full p-4 border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-[#FBBF24] hover:bg-emerald-50 transition-all text-left"
                                        >
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-800">{p.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.id} • {p.region}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setResourceStep('type')} className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Back to Categories</button>
                            </div>
                        )}

                        {resourceStep === 'details' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex gap-4 items-center shadow-inner">
                                    <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm"><CheckCircle size={24}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Registry Link Active</p>
                                        <h5 className="font-black text-emerald-950 text-lg leading-tight">{newResource.name}</h5>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial / Ref No.</label>
                                        <input type="text" value={newResource.unitNumber} onChange={(e) => setNewResource({...newResource, unitNumber: e.target.value})} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocation Rate (E)</label>
                                        <input type="number" value={newResource.unitCost} onChange={(e) => setNewResource({...newResource, unitCost: parseFloat(e.target.value)})} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Qty</label>
                                        <input type="number" value={newResource.quantity} onChange={(e) => setNewResource({...newResource, quantity: parseFloat(e.target.value)})} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none" />
                                    </div>
                                    {newResource.type === 'Consumable Input' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Low Stock Threshold</label>
                                            <input type="number" value={newResource.threshold} onChange={(e) => setNewResource({...newResource, threshold: parseFloat(e.target.value)})} className="w-full p-4 border border-rose-100 bg-rose-50/30 rounded-2xl font-bold outline-none text-rose-700" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setResourceStep(newResource.type === 'Personnel' ? 'personnel' : 'catalogue_select')} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Back</button>
                                    <button onClick={handleAddResource} disabled={!newResource.name} className="flex-[2] bg-[#1B4D3E] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-[#143d31] transition-all disabled:opacity-50">Enroll Asset</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {showOpModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-3"><Activity size={28} className="text-[#FBBF24]"/> Activity Logging</h3>
                        <button onClick={()=>{ setShowOpModal(false); resetOpState(); }}><X size={24}/></button>
                    </div>
                    <div className="p-10 overflow-y-auto max-h-[75vh] no-scrollbar">
                        {opStep === 'unit_process' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">1. Select Operational Unit</label>
                                    <select value={selectedOpUnit} onChange={(e)=>setSelectedOpUnit(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                                        <option value="">Choose a unit...</option>
                                        {selectedEnterprise.units.map((u:any)=><option key={u.id} value={u.id}>{u.name} (E{u.costPerHour}/hr)</option>)}
                                    </select>
                                </div>
                                {selectedOpUnit && (
                                    <div className="space-y-4 animate-slide-up">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">2. Assign Cycle</label>
                                        <button onClick={() => setSelectedOpProcessId('NEW')} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${selectedOpProcessId === 'NEW' ? 'bg-emerald-50 border-[#1B4D3E]' : 'border-slate-100 hover:border-slate-200'}`}><p className="font-black text-slate-800">Initialize New Production Cycle</p></button>
                                        {selectedEnterprise.processes?.filter((p:any) => p.unitId === selectedOpUnit && p.status === 'Active').map((p:any) => (
                                            <button key={p.id} onClick={() => setSelectedOpProcessId(p.id)} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${selectedOpProcessId === p.id ? 'bg-emerald-50 border-[#1B4D3E]' : 'border-slate-100 hover:border-slate-200'}`}><p className="font-black text-slate-800">{p.name}</p></button>
                                        ))}
                                        {selectedOpProcessId === 'NEW' && (
                                            <div className="grid grid-cols-2 gap-4 mt-4 animate-fade-in">
                                                <input type="text" value={newProcessName} onChange={(e)=>setNewProcessName(e.target.value)} placeholder="Process Alias (e.g. Maize 2024)" className="w-full p-4 border rounded-2xl font-bold shadow-sm" />
                                                <select value={newProcessCommodity} onChange={(e)=>setNewProcessCommodity(e.target.value)} className="w-full p-4 border rounded-2xl font-bold shadow-sm">
                                                    {systemMetadata.commodityCategories.map((c: string) => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button onClick={()=>setOpStep('activity_details')} disabled={!selectedOpUnit || (selectedOpProcessId === 'NEW' && !newProcessName)} className="w-full bg-[#1B4D3E] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50">Define Phase Details <ArrowRight size={20}/></button>
                            </div>
                        )}
                        {opStep === 'activity_details' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Activity Descriptor</label><input type="text" value={opName} onChange={(e)=>setOpName(e.target.value)} placeholder="Tilling, Spraying, Weeding, Fertilization..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" /></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Category</label><select value={opType} onChange={(e:any)=>setOpType(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold">
                                        {systemMetadata.operationTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                    </select></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Start Time</label><input type="datetime-local" value={opStartDateTime} onChange={(e)=>setOpStartDateTime(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">End Time</label><input type="datetime-local" value={opEndDateTime} onChange={(e)=>setOpEndDateTime(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                                </div>
                                <div className="flex gap-4"><button onClick={()=>setOpStep('unit_process')} className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase tracking-widest">Back</button><button onClick={()=>setOpStep('resources')} className="flex-[2] bg-[#1B4D3E] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">Allocate Assets <ArrowRight size={20}/></button></div>
                            </div>
                        )}
                        {opStep === 'resources' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <h4 className="font-black text-slate-800 text-sm uppercase mb-4 flex items-center gap-2"><Briefcase size={16}/> Allocate Machinery & Personnel</h4>
                                    <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                                        {selectedEnterprise.resources?.filter((r: any) => r.assignedUnitId === selectedOpUnit).map((res: Resource) => (
                                            <div key={res.id} className="space-y-2">
                                                <button onClick={() => { if(selectedOpResources.includes(res.id)) setSelectedOpResources(prev => prev.filter(id => id !== res.id)); else setSelectedOpResources(prev => [...prev, res.id]); }} className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${selectedOpResources.includes(res.id) ? 'bg-[#1B4D3E] text-white border-transparent' : 'bg-white border-slate-100'}`}>
                                                    <div><p className="text-xs font-black">{res.name}</p><p className="text-[9px] opacity-40 uppercase font-bold">{res.type} • E{res.unitCost}/{res.type === 'Consumable Input' ? 'unit' : 'hr'}</p></div>
                                                    {selectedOpResources.includes(res.id) && <CheckCircle2 size={18} className="text-[#FBBF24]"/>}
                                                </button>
                                                {selectedOpResources.includes(res.id) && res.type === 'Consumable Input' && (
                                                    <div className="px-4 pb-2 animate-fade-in">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Quantity Used</label>
                                                        <input 
                                                            type="number" 
                                                            value={resourceUsageQty[res.id] || 0} 
                                                            onChange={(e) => setResourceUsageQty({...resourceUsageQty, [res.id]: parseFloat(e.target.value)})}
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold mt-1" 
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4"><button onClick={()=>setOpStep('activity_details')} className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase tracking-widest">Back</button><button onClick={handleLogOperation} className="flex-[2] bg-[#1B4D3E] text-white py-4 rounded-2xl font-black shadow-xl">Commit Activity & OPEX</button></div>
                            </div>
                        )}
                        {opStep === 'produce' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                                    <h4 className="font-black text-emerald-900 text-lg">Packaging for Marketplace</h4>
                                    <p className="text-xs text-emerald-700 mt-1 font-medium leading-relaxed">Cycle output ready. Define parameters for batch provenance and cost allocation.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produce Image</label>
                                            <div className="relative group aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 transition-all cursor-pointer">
                                                {produceForm.image ? <img src={produceForm.image} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" size={40} />}
                                                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setProduceForm({...produceForm, image: r.result as string}); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-xl">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Allocated Batch Cost</p>
                                                <h4 className="text-3xl font-black text-[#FBBF24]">E {((produceForm.costPrice || 0) * (produceForm.proportion / 100)).toLocaleString()}</h4>
                                                <p className="text-[9px] text-slate-400 mt-2 font-medium">({produceForm.proportion}% of E {(produceForm.costPrice || 0).toLocaleString()} cycle cost)</p>
                                            </div>
                                            <Target size={100} className="absolute -bottom-8 -right-8 text-white/5" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harvest Proportion (%)</label>
                                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <input 
                                                    type="range" 
                                                    min="1" 
                                                    max="100" 
                                                    value={produceForm.proportion} 
                                                    onChange={(e) => setProduceForm({...produceForm, proportion: parseInt(e.target.value)})}
                                                    className="flex-1 accent-[#1B4D3E]"
                                                />
                                                <span className="font-black text-[#1B4D3E] text-lg w-12 text-right">{produceForm.proportion}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Name</label><input type="text" value={produceForm.name} onChange={(e)=>setProduceForm({...produceForm, name: e.target.value})} placeholder="e.g. Malkerns Sweet White Corn" className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold" /></div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Category</label><select value={produceForm.category} onChange={(e)=>setProduceForm({...produceForm, category: e.target.value})} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold">
                                                {systemMetadata.commodityCategories.map((c: string) => <option key={c}>{c}</option>)}
                                            </select></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label><input type="text" value={produceForm.unit} onChange={(e)=>setProduceForm({...produceForm, unit: e.target.value})} placeholder="kg, Ton..." className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price / Unit (E)</label><input type="number" value={produceForm.price} onChange={(e)=>setProduceForm({...produceForm, price: parseFloat(e.target.value)})} placeholder="E 0.00" className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold text-[#1B4D3E]" /></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Yield</label><input type="number" value={produceForm.quantity} onChange={(e)=>setProduceForm({...produceForm, quantity: parseFloat(e.target.value)})} placeholder="0" className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold" /></div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleFinalizeProduce} disabled={!produceForm.name || produceForm.price === 0} className="w-full bg-[#1B4D3E] text-white py-5 rounded-3xl font-black shadow-xl hover:bg-[#143d31] transition-all flex items-center justify-center gap-3 mt-4">Add to National Inventory Hub <ArrowUpRight size={20} className="text-yellow-400"/></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Production;