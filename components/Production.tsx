
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Tractor, Users, MapPin, MapPinOff, Plus, X, PenTool, ChevronRight, 
  Building2, Activity, CheckCircle2, Info, Map as MapIcon, 
  Loader2, ArrowRight, Save, Target, TrendingUp, Package, 
  Sprout, Factory, ClipboardList, Zap, Calendar, Check,
  Search, CheckSquare, Edit3, Trash2, Crosshair,
  Maximize2, ZoomIn, ZoomOut, Map as MapTypeIcon, MousePointer2, AlertCircle,
  // Fix: Add missing ShieldCheck icon import
  ShieldCheck
} from 'lucide-react';
import { 
  Operation, SalesProduct, MarketOrder, UserProfile, Region, 
  ResourceType, CatalogueItem, ProductionProcess, Resource, 
  TINKHUNDLA 
} from '../types';
import { 
  View_Master_Catalogue, Add_To_Master_Catalogue, 
  View_All_System_Users, Get_System_Metadata 
} from '../services/adminDataService';
import { prefillCatalogueItem } from '../services/geminiService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";

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
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markersRef = useRef<any[]>([]);

  // System Metadata
  const systemMetadata = Get_System_Metadata();
  
  // Data State
  const [enterprises, setEnterprises] = useState<any[]>(() => {
    const scopeId = user?.organizationId || user?.id || 'GUEST';
    const key = `aiis_enterprises_v5_${scopeId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedEntId, setSelectedEntId] = useState<string | null>(enterprises[0]?.id || null);
  
  const selectedEnterprise = useMemo(() => 
    enterprises.find(e => e.id === selectedEntId) || null, 
  [enterprises, selectedEntId]);

  useEffect(() => {
    const scopeId = user?.organizationId || user?.id || 'GUEST';
    localStorage.setItem(`aiis_enterprises_v5_${scopeId}`, JSON.stringify(enterprises));
  }, [enterprises, user]);

  // UI State
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // New Item States
  const [newEnterprise, setNewEnterprise] = useState({
      name: '', region: Region.Manzini, tinkhundla: '', lat: '', lng: '', address: ''
  });
  const [newUnit, setNewUnit] = useState({
      name: '', unitNumber: '', area: '', costPerHour: '', supervisor: ''
  });

  // Maps Initialization
  useEffect(() => {
    if ((window as any).google?.maps) { setGoogleApiLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.onload = () => setGoogleApiLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Map Click Handler for Hub Placement
  useEffect(() => {
      if (mapInstance && activeTab === 'ESTABLISHMENT') {
          const listener = mapInstance.addListener('click', async (e: any) => {
              if (!isPlacingMode) return;
              
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              
              setIsPlacingMode(false);
              setIsReverseGeocoding(true);
              
              const geocoder = new (window as any).google.maps.Geocoder();
              geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                  let detectedRegion = Region.Manzini;
                  let detectedInkhundla = '';
                  let detectedAddress = '';

                  if (status === 'OK' && results[0]) {
                      detectedAddress = results[0].formatted_address;
                      const components = results[0].address_components;
                      
                      components.forEach((c: any) => {
                          const val = c.long_name;
                          if (c.types.includes('administrative_area_level_1')) {
                              if (val.includes('Hhohho')) detectedRegion = Region.Hhohho;
                              else if (val.includes('Manzini')) detectedRegion = Region.Manzini;
                              else if (val.includes('Shiselweni')) detectedRegion = Region.Shiselweni;
                              else if (val.includes('Lubombo')) detectedRegion = Region.Lubombo;
                          }
                          // Heuristic for Inkhundla (usually level 2 or locality in some maps)
                          if (c.types.includes('administrative_area_level_2') || c.types.includes('locality')) {
                              detectedInkhundla = val;
                          }
                      });
                  }

                  setNewEnterprise({
                      name: '',
                      region: detectedRegion,
                      tinkhundla: detectedInkhundla,
                      lat: lat.toFixed(6),
                      lng: lng.toFixed(6),
                      address: detectedAddress
                  });
                  
                  setIsReverseGeocoding(false);
                  setShowEnterpriseModal(true);
              });
          });
          return () => (window as any).google.maps.event.removeListener(listener);
      }
  }, [mapInstance, isPlacingMode, activeTab]);

  // Sync Map Markers
  useEffect(() => {
    if (activeTab === 'ESTABLISHMENT' && googleApiLoaded && mapRef.current) {
        let map = mapInstance;
        
        if (!map) {
            map = new (window as any).google.maps.Map(mapRef.current, {
                center: selectedEnterprise?.gps || { lat: -26.48, lng: 31.37 },
                zoom: selectedEnterprise ? 17 : 11,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                zoomControl: false,
                gestureHandling: 'greedy'
            });
            setMapInstance(map);
        }

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        enterprises.forEach(ent => {
            const marker = new (window as any).google.maps.Marker({
                position: ent.gps,
                map,
                title: ent.name,
                label: {
                    text: ent.name,
                    color: ent.id === selectedEntId ? "#FBBF24" : "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "900",
                    className: "map-marker-label"
                },
                icon: {
                    url: ent.id === selectedEntId ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new (window as any).google.maps.Size(40, 40),
                    labelOrigin: new (window as any).google.maps.Point(20, -10)
                }
            });
            marker.addListener('click', () => setSelectedEntId(ent.id));
            markersRef.current.push(marker);
        });

        if (selectedEnterprise && !isPlacingMode) {
            map.panTo(selectedEnterprise.gps);
        }
    }
  }, [activeTab, googleApiLoaded, selectedEntId, enterprises, mapInstance, isPlacingMode]);

  // GIS Control Actions
  const handleZoomIn = () => mapInstance?.setZoom(mapInstance.getZoom() + 1);
  const handleZoomOut = () => mapInstance?.setZoom(mapInstance.getZoom() - 1);
  const handleFitAll = () => {
      if (!mapInstance || enterprises.length === 0) return;
      const bounds = new (window as any).google.maps.LatLngBounds();
      enterprises.forEach(ent => bounds.extend(ent.gps));
      mapInstance.fitBounds(bounds);
      if (enterprises.length === 1) mapInstance.setZoom(16);
  };

  const handleAddEnterprise = () => {
      if (!newEnterprise.name || !newEnterprise.lat) return;
      const id = `ENT-${Date.now()}`;
      const ent = {
          id, name: newEnterprise.name, region: newEnterprise.region,
          inkhundla: newEnterprise.tinkhundla,
          address: newEnterprise.address,
          gps: { lat: parseFloat(newEnterprise.lat), lng: parseFloat(newEnterprise.lng) },
          units: [], resources: [], processes: [], operations: []
      };
      setEnterprises(prev => [...prev, ent]);
      setSelectedEntId(id);
      setShowEnterpriseModal(false);
      setNewEnterprise({ name: '', region: Region.Manzini, tinkhundla: '', lat: '', lng: '', address: '' });
      setTimeout(handleFitAll, 500);
  };

  const handleAddUnit = () => {
      if (!newUnit.name || !selectedEntId) return;
      const unitId = `UNIT-${Date.now()}`;
      const unit = {
          id: unitId, name: newUnit.name, unitNumber: newUnit.unitNumber || `U-${unitId.slice(-4)}`,
          area: parseFloat(newUnit.area) || 1.0, costPerHour: parseFloat(newUnit.costPerHour) || 0,
          supervisor: newUnit.supervisor || user?.name || 'Self'
      };

      setEnterprises(prev => prev.map(ent => 
        ent.id === selectedEntId ? { ...ent, units: [...(ent.units || []), unit] } : ent
      ));
      setShowUnitModal(false);
      setNewUnit({ name: '', unitNumber: '', area: '', costPerHour: '', supervisor: '' });
  };

  const renderEstablishment = () => (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-5">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner"><MapIcon size={24}/></div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">Establishment & GIS</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Hub Mapping</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsPlacingMode(!isPlacingMode)} 
                    className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm
                    ${isPlacingMode ? 'bg-rose-500 text-white animate-pulse' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                   {isPlacingMode ? <X size={16}/> : <Plus size={16}/>}
                   {isPlacingMode ? 'Cancel Placement' : 'New Hub'}
                </button>
                <button onClick={() => setShowUnitModal(true)} disabled={!selectedEntId} className="px-6 py-3 bg-[#1B4D3E] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#143d31] transition-all flex items-center gap-2 disabled:opacity-30">
                    <PenTool size={16}/> Trace Unit
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className={`lg:col-span-3 relative bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden h-[550px] transition-all
                ${isPlacingMode ? 'ring-4 ring-rose-500/20 cursor-crosshair' : ''}`}>
                
                {/* Placement Instruction Banner */}
                {isPlacingMode && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[30] bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                        <MousePointer2 size={18} className="animate-pulse"/>
                        <span className="text-xs font-black uppercase tracking-widest">Click on map to position Hub</span>
                    </div>
                )}

                {/* Reverse Geocoding Loader */}
                {isReverseGeocoding && (
                    <div className="absolute inset-0 z-[40] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="p-5 bg-white rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 border border-slate-100">
                            <Loader2 className="animate-spin text-[#1B4D3E]" size={32}/>
                            <p className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">Resolving GIS Details...</p>
                        </div>
                    </div>
                )}

                {/* Custom GIS Overlays */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                    <button onClick={handleZoomIn} className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-xl text-slate-700 hover:bg-white transition-all active:scale-90 border border-slate-100" title="Zoom In">
                        <ZoomIn size={20}/>
                    </button>
                    <button onClick={handleZoomOut} className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-xl text-slate-700 hover:bg-white transition-all active:scale-90 border border-slate-100" title="Zoom Out">
                        <ZoomOut size={20}/>
                    </button>
                    <button onClick={handleFitAll} className="p-3 bg-emerald-600 text-white shadow-xl rounded-xl hover:bg-emerald-700 transition-all active:scale-90 border border-emerald-500" title="Maximum View (Fit All)">
                        <Maximize2 size={20}/>
                    </button>
                </div>

                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Satellite Mode Active</span>
                </div>

                <div ref={mapRef} className={`w-full h-full z-10 bg-slate-200 ${isPlacingMode ? 'cursor-crosshair' : ''}`} />
                
                {!googleApiLoaded && (
                    <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center z-20 gap-4">
                        <Loader2 className="animate-spin text-emerald-600" size={40}/>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecting GIS Satellite Service...</p>
                    </div>
                )}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-[550px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14}/> Registered Nodes
                        </h4>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-300"><Search size={14}/></div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                        {enterprises.map(ent => (
                            <button 
                                key={ent.id}
                                onClick={() => setSelectedEntId(ent.id)}
                                className={`w-full p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${selectedEntId === ent.id ? 'bg-[#1B4D3E] border-[#1B4D3E] shadow-lg' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-200'}`}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className={`font-black text-sm truncate pr-4 ${selectedEntId === ent.id ? 'text-white' : 'text-slate-800'}`}>{ent.name}</h5>
                                        {selectedEntId === ent.id && <CheckCircle2 size={14} className="text-[#FBBF24] shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={10} className={selectedEntId === ent.id ? 'text-green-300' : 'text-slate-400'}/>
                                        <p className={`text-[10px] font-bold uppercase tracking-tight ${selectedEntId === ent.id ? 'text-green-100/60' : 'text-slate-400'}`}>{ent.region} Hub</p>
                                    </div>
                                </div>
                                {selectedEntId === ent.id && <Activity className="absolute -bottom-2 -right-2 text-white/5 w-16 h-16 pointer-events-none" />}
                            </button>
                        ))}
                        {enterprises.length === 0 && (
                            <div className="py-20 text-center space-y-6">
                                <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto border border-dashed border-slate-200"><MapPinOff size={40} className="text-slate-200" /></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Active Nodes</p>
                                    <p className="text-[10px] text-slate-300 font-medium">Use the "New Hub" button to start mapping.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* New Enterprise Details Modal */}
        {showEnterpriseModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-xl animate-pulse"><Target size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-2xl font-black">Finalize Node</h3>
                                <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest">GIS Metadata Entry</p>
                            </div>
                        </div>
                        <button onClick={() => setShowEnterpriseModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Trade Name</label>
                            <input autoFocus value={newEnterprise.name} onChange={(e)=>setNewEnterprise({...newEnterprise, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" placeholder="e.g. Malkerns Valley Hub" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region (Detected)</label>
                                <select value={newEnterprise.region} onChange={(e:any)=>setNewEnterprise({...newEnterprise, region: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                                    {systemMetadata.regions.map((r:string)=><option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inkhundla</label>
                                <input value={newEnterprise.tinkhundla} onChange={(e)=>setNewEnterprise({...newEnterprise, tinkhundla: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700" placeholder="e.g. Manzini North" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detected Address / Nearest POI</label>
                            <textarea rows={2} value={newEnterprise.address} onChange={(e)=>setNewEnterprise({...newEnterprise, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 text-xs leading-relaxed outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" />
                        </div>

                        <div className="p-6 bg-[#1B4D3E]/5 rounded-[2rem] border border-[#1B4D3E]/10 space-y-4 shadow-inner">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase text-center">Latitude</p>
                                    <div className="px-4 py-2 bg-white rounded-xl font-mono text-[10px] text-slate-600 border border-slate-100 text-center min-h-[32px] flex items-center justify-center font-black">{newEnterprise.lat}</div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase text-center">Longitude</p>
                                    <div className="px-4 py-2 bg-white rounded-xl font-mono text-[10px] text-slate-600 border border-slate-100 text-center min-h-[32px] flex items-center justify-center font-black">{newEnterprise.lng}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-emerald-600">
                                <ShieldCheck size={14}/>
                                <span className="text-[9px] font-black uppercase tracking-widest">Pin Precision Verified</span>
                            </div>
                        </div>

                        <button onClick={handleAddEnterprise} disabled={!newEnterprise.name} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                            Publish to National Registry <ArrowRight size={20}/>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* New Unit Modal */}
        {showUnitModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><PenTool size={24} className="text-[#FBBF24]"/></div>
                            <div>
                                <h3 className="text-2xl font-black">Trace Unit</h3>
                                <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest">Internal Zoning</p>
                            </div>
                        </div>
                        <button onClick={() => setShowUnitModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name (Block ID)</label>
                            <input value={newUnit.name} onChange={(e)=>setNewUnit({...newUnit, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#1B4D3E]/5" placeholder="e.g. Block A1 - Maize" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area (Hectares)</label>
                                <input type="number" value={newUnit.area} onChange={(e)=>setNewUnit({...newUnit, area: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold font-mono" placeholder="0.0" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Cost (E/hr)</label>
                                <input type="number" value={newUnit.costPerHour} onChange={(e)=>setNewUnit({...newUnit, costPerHour: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-[#1B4D3E]" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                             <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600"><Info size={18}/></div>
                             <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">Unit boundaries are automatically localized around your Hub center. Physical boundary verification required for export permit clearance.</p>
                        </div>
                        <button onClick={handleAddUnit} disabled={!newUnit.name} className="w-full py-5 bg-[#1B4D3E] text-white rounded-3xl font-black shadow-2xl shadow-emerald-900/20 hover:bg-[#143d31] transition-all flex items-center justify-center gap-3 active:scale-95">
                            Commit Unit Zoning <Save size={20}/>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <style>{`
            .map-marker-label {
                background-color: rgba(27, 77, 62, 0.9);
                padding: 4px 8px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                white-space: nowrap;
            }
        `}</style>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in px-4 sm:px-0 pb-20">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-8 p-4 px-8 overflow-x-auto no-scrollbar">
                {(['ESTABLISHMENT', 'INVENTORY', 'OPERATIONS', 'CALENDAR'] as const).map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`flex items-center gap-3 py-4 text-[13px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#1B4D3E]' : 'text-slate-400 hover:text-[#1B4D3E]'}`}
                    >
                        {tab === 'ESTABLISHMENT' && <MapIcon size={16}/>}
                        {tab === 'INVENTORY' && <Package size={16}/>}
                        {tab === 'OPERATIONS' && <Zap size={16}/>}
                        {tab === 'CALENDAR' && <Calendar size={16}/>}
                        {tab.replace('_', ' ')}
                        {activeTab === tab && (<div className="absolute bottom-0 left-0 w-full h-1 bg-[#1B4D3E] rounded-full" />)}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'ESTABLISHMENT' && renderEstablishment()}
        
        {activeTab === 'INVENTORY' && (
            <div className="py-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 animate-fade-in">
                <Package size={64} className="mx-auto text-slate-200" />
                <div>
                    <h3 className="text-xl font-black text-slate-800">Inventory & Assets</h3>
                    <p className="text-sm text-slate-400 font-medium">Manage inputs and equipment for {selectedEnterprise?.name || 'your Hub'}.</p>
                </div>
                <button className="bg-[#1B4D3E] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-[#143d31] transition-all">Enroll New Asset</button>
            </div>
        )}

        {activeTab === 'OPERATIONS' && (
            <div className="py-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 animate-fade-in">
                <Activity size={64} className="mx-auto text-slate-200" />
                <div>
                    <h3 className="text-xl font-black text-slate-800">Operational Logging</h3>
                    <p className="text-sm text-slate-400 font-medium">Track cycles and harvest batches for {selectedEnterprise?.name || 'your Hub'}.</p>
                </div>
                <button className="bg-[#1B4D3E] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-[#143d31] transition-all">Initialize Production Phase</button>
            </div>
        )}

        {activeTab === 'CALENDAR' && (
            <div className="py-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 animate-fade-in">
                <Calendar size={64} className="mx-auto text-slate-200" />
                <div>
                    <h3 className="text-xl font-black text-slate-800">Activity Timeline</h3>
                    <p className="text-sm text-slate-400 font-medium">Schedule and view planned events for verified operational units.</p>
                </div>
                <button className="bg-[#1B4D3E] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-[#143d31] transition-all">Schedule Event</button>
            </div>
        )}
    </div>
  );
};

export default Production;
