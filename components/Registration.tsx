
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, CheckCircle, MapPin, User, Shield, Phone, FileText, Loader2, 
  Clock, ShieldCheck, Lock, Upload, ChevronRight, ChevronLeft, Building2, 
  Briefcase, Sparkles, Wand2, RefreshCw, Factory, ShoppingCart, MessageSquareText,
  Activity, ArrowRight, Info, Eye
} from 'lucide-react';
import { Region, ActorType, TINKHUNDLA, CHIEFDOMS, EntityType, UserRole, UserProfile } from '../types';
import { Register_New_User, Get_System_Metadata } from '../services/adminDataService';
import { extractPersonalDetailsFromID } from '../services/geminiService';

const GOOGLE_MAPS_API_KEY = "AIzaSyDFuDLViwxFLH0iO-zFgbJkks20w_DiiJU";

interface RegistrationProps {
  onBackToLogin?: () => void;
  onBackToHome?: () => void;
}

const ROLE_WORKFLOWS: Record<string, { description: string, steps: string[], modules: {id: string, label: string, icon: any}[] }> = {
    [ActorType.Farmer]: {
        description: "Focuses on maximizing primary production and ensuring produce is market-ready with full traceability.",
        steps: [
            "GPS map your fields and operational units.",
            "Log daily activities (spraying, weeding, fertilizing).",
            "Generate Batch IDs at harvest for national trade compliance.",
            "Publish produce directly to the National Marketplace."
        ],
        modules: [
            { id: 'prod', label: 'Production', icon: <Factory size={14}/> },
            { id: 'market', label: 'Marketplace', icon: <ShoppingCart size={14}/> },
            { id: 'advisor', label: 'AI Advisor', icon: <MessageSquareText size={14}/> }
        ]
    },
    [ActorType.Buyer]: {
        description: "Streamlines sourcing of verified, traceable commodities directly from registered Eswatini producers.",
        steps: [
            "Search for commodities by region and quantity.",
            "Audit product provenance using the Traceability Portal.",
            "Secure direct contracts with verified farmers.",
            "Monitor price trends and availability across the kingdom."
        ],
        modules: [
            { id: 'market', label: 'Trade Hub', icon: <ShoppingCart size={14}/> },
            { id: 'trace', label: 'Traceability', icon: <Activity size={14}/> },
            { id: 'stats', label: 'Analytics', icon: <Info size={14}/> }
        ]
    },
    [ActorType.Gov]: {
        description: "Oversees national food security, regional production performance, and regulatory compliance.",
        steps: [
            "Monitor yield KPIs via the National Dashboard.",
            "Manage the User Registry and approve new institutional actors.",
            "Verify Master Catalogue entries for inputs and machinery.",
            "Generate strategic reports using synthesized sector data."
        ],
        modules: [
            { id: 'dash', label: 'Dashboard', icon: <Activity size={14}/> },
            { id: 'admin', label: 'Admin Panel', icon: <Shield size={14}/> },
            { id: 'trace', label: 'Oversight', icon: <Eye size={14}/> }
        ]
    },
    [ActorType.Processor]: {
        description: "Bridges primary production and retail by processing raw materials into high-value traceable goods.",
        steps: [
            "Source raw materials from registered farmers with digital provenance.",
            "Log processing stages and value-addition activities.",
            "Link processing batches to original farm Batch IDs.",
            "Distribute processed goods to retailers via the AIIS network."
        ],
        modules: [
            { id: 'prod', label: 'Value Addition', icon: <Factory size={14}/> },
            { id: 'market', label: 'Bulk Sourcing', icon: <ShoppingCart size={14}/> },
            { id: 'trace', label: 'Provenance', icon: <Activity size={14}/> }
        ]
    }
};

const Registration: React.FC<RegistrationProps> = ({ onBackToLogin, onBackToHome }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'Pending' | 'Approved'>('Pending');
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [generatedId, setGeneratedId] = useState('');
  
  // Load dynamic lists
  const systemMetadata = Get_System_Metadata();

  const [formData, setFormData] = useState({
    // Actor Details
    actorType: ActorType.Farmer as string,
    entityType: EntityType.Person as string,
    organizationName: '',
    functionalRole: '',
    
    // Personal Details
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    nationality: 'Swati',
    maritalStatus: 'Single',
    idNumber: '',
    
    // Contact
    phone: '',
    email: '',
    
    // Location
    region: Region.Manzini as string,
    tinkhundla: '',
    chiefdom: '',
    gpsLat: '',
    gpsLong: '',
    
    // Security
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const scriptId = 'google-maps-script';
    if (!(window as any).google?.maps && !document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIdFile(file);
          if (file.type.startsWith('image/')) {
              setIsExtracting(true);
              try {
                  const base64 = await fileToBase64(file);
                  const extracted = await extractPersonalDetailsFromID(base64);
                  if (extracted && extracted.firstName) {
                      setFormData(prev => ({
                          ...prev,
                          firstName: extracted.firstName || prev.firstName,
                          middleName: extracted.middleName || prev.middleName,
                          lastName: extracted.lastName || prev.lastName,
                          gender: (systemMetadata.genders.includes(extracted.gender)) ? extracted.gender : prev.gender,
                          dob: extracted.dob || prev.dob,
                          idNumber: extracted.idNumber || prev.idNumber
                      }));
                  }
              } catch (error) {
                  console.error("Auto-extraction failed", error);
              } finally {
                  setIsExtracting(false);
              }
          }
      }
  };

  const handleLocation = () => {
      setLocating(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setFormData(prev => ({ ...prev, gpsLat: lat.toFixed(6), gpsLong: lng.toFixed(6) }));
              if ((window as any).google && (window as any).google.maps) {
                  const geocoder = new (window as any).google.maps.Geocoder();
                  geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                      if (status === 'OK' && results[0]) {
                          const components = results[0].address_components;
                          let newRegion = '';
                          components.forEach((c: any) => {
                              if (c.types.includes('administrative_area_level_1')) {
                                  const val = c.long_name;
                                  if (val.includes('Hhohho')) newRegion = Region.Hhohho;
                                  else if (val.includes('Manzini')) newRegion = Region.Manzini;
                                  else if (val.includes('Shiselweni')) newRegion = Region.Shiselweni;
                                  else if (val.includes('Lubombo')) newRegion = Region.Lubombo;
                              }
                          });
                          if (newRegion && systemMetadata.regions.includes(newRegion)) {
                              setFormData(prev => ({ ...prev, region: newRegion }));
                          }
                      }
                      setLocating(false);
                  });
              } else {
                  setTimeout(() => setLocating(false), 1000); 
              }
          }, () => setLocating(false));
      } else {
          setLocating(false);
      }
  };

  const validateStep = () => {
      if (step === 1) {
          const isIndividual = formData.entityType === EntityType.Person;
          return formData.actorType && formData.entityType && idFile && (isIndividual || (formData.organizationName.trim() !== '' && formData.functionalRole.trim() !== ''));
      }
      if (step === 2) return formData.firstName && formData.lastName && formData.idNumber && formData.dob;
      if (step === 3) return formData.phone && formData.region && formData.tinkhundla;
      if (step === 4) return formData.password && formData.password === formData.confirmPassword;
      return false;
  };

  const nextStep = () => validateStep() && setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    const newSysId = `AG-${Math.floor(Math.random() * 8999) + 1000}`;
    setGeneratedId(newSysId);
    
    let determinedRole = UserRole.Farmer;
    if (formData.actorType === ActorType.Gov) determinedRole = UserRole.Government;
    if (formData.actorType === ActorType.Extension) determinedRole = UserRole.Extension;
    
    const isIndividual = formData.entityType === EntityType.Person;
    const organizationName = isIndividual ? 'Personal' : formData.organizationName;
    const organizationId = isIndividual ? `IND-${newSysId}` : organizationName.trim().replace(/\s+/g, '-').toUpperCase();
    
    const newUser: UserProfile = {
        id: newSysId,
        name: `${formData.firstName} ${formData.lastName}`,
        role: determinedRole,
        actorType: formData.actorType as ActorType,
        entityType: formData.entityType as EntityType,
        region: formData.region,
        tinkhundla: formData.tinkhundla,
        status: 'Pending Approval',
        contact: formData.phone,
        email: formData.email,
        dateRegistered: new Date().toISOString().split('T')[0],
        gender: formData.gender,
        organization: organizationName,
        organizationId: organizationId,
        functionalRole: isIndividual ? 'Owner' : formData.functionalRole,
        coordinates: formData.gpsLat ? { lat: parseFloat(formData.gpsLat), lng: parseFloat(formData.gpsLong) } : undefined
    };
    setTimeout(() => {
        Register_New_User(newUser);
        setLoading(false);
        setSubmitted(true);
        setApprovalStatus('Pending');
    }, 1500);
  };

  const simulateAdminApproval = () => {
      setIsSimulatingApproval(true);
      setTimeout(() => {
          setApprovalStatus('Approved');
          setIsSimulatingApproval(false);
      }, 2000);
  };

  if (submitted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-center animate-fade-in max-w-3xl mx-auto mt-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="text-[#1B4D3E]" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-[#1B4D3E] mb-2">Registration Successful</h3>
            <p className="text-slate-500 max-w-md mb-8">
                Your profile has been created in the Agriculture Integrated Information System. 
                Your Registration ID is <span className="font-mono bg-[#1B4D3E] text-white px-2 py-0.5 rounded text-sm font-bold">{generatedId}</span>.
            </p>
            <div className={`w-full max-w-md p-6 rounded-xl border-2 mb-8 transition-all duration-500 ${approvalStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                    {approvalStatus === 'Pending' ? (
                        <div className="p-2 bg-yellow-100 rounded-full text-yellow-700 animate-pulse"><Clock size={24} /></div>
                    ) : (
                        <div className="p-2 bg-green-100 rounded-full text-green-700"><ShieldCheck size={24} /></div>
                    )}
                    <h4 className={`text-xl font-bold ${approvalStatus === 'Pending' ? 'text-yellow-800' : 'text-green-800'}`}>
                        {approvalStatus === 'Pending' ? 'Pending Approval' : 'Account Active'}
                    </h4>
                </div>
                <p className={`text-sm ${approvalStatus === 'Pending' ? 'text-yellow-700' : 'text-green-700'}`}>
                    {approvalStatus === 'Pending' 
                        ? 'Your application is currently under review by the Regional Extension Officer. You will be notified via SMS once approved.' 
                        : 'Congratulations! Your account has been approved. You now have full access to the AIIS services.'}
                </p>
            </div>
            {approvalStatus === 'Pending' && (
                <div className="mb-8 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Demo: Simulation Controls</p>
                    <button onClick={simulateAdminApproval} disabled={isSimulatingApproval} className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
                        {isSimulatingApproval ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        {isSimulatingApproval ? 'Processing...' : 'Simulate Admin Approval'}
                    </button>
                </div>
            )}
            <button 
                onClick={() => {
                    if (approvalStatus === 'Approved') onBackToLogin?.();
                    else onBackToHome?.();
                }} 
                className={`px-8 py-3 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 ${approvalStatus === 'Approved' ? 'bg-[#1B4D3E] hover:bg-[#143d31]' : 'bg-slate-400 hover:bg-slate-500'}`}
            >
                {approvalStatus === 'Approved' ? 'Proceed to Login' : 'Return to Home'}
            </button>
        </div>
    );
  }

  const steps = [
      { id: 1, title: 'Classification', icon: <UserPlus size={18}/> },
      { id: 2, title: 'Personal Info', icon: <User size={18}/> },
      { id: 3, title: 'Location & Contact', icon: <MapPin size={18}/> },
      { id: 4, title: 'Security', icon: <Shield size={18}/> }
  ];

  const currentWorkflow = ROLE_WORKFLOWS[formData.actorType];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-[#1B4D3E]">Registration Portal</h2>
            <p className="text-slate-500">Step {step} of 4: {steps[step-1].title}</p>
        </div>
        <div className="flex items-center gap-2">
            {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s.id ? 'bg-[#1B4D3E] text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                        {step > s.id ? <CheckCircle size={16}/> : s.id}
                    </div>
                    {idx < steps.length - 1 && <div className={`w-8 h-1 rounded-full ${step > s.id ? 'bg-[#1B4D3E]' : 'bg-slate-200'}`}></div>}
                </React.Fragment>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 p-8 flex flex-col">
                
                {/* STEP 1: Classification */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">User Role</label>
                                <select name="actorType" value={formData.actorType} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] outline-none bg-slate-50 font-bold text-slate-700">
                                    {systemMetadata.actorTypes.map((role: string) => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Entity Category</label>
                                <select name="entityType" value={formData.entityType} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] outline-none bg-slate-50 font-bold text-slate-700">
                                    {systemMetadata.entityTypes.map((type: string) => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {formData.entityType !== EntityType.Person && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Institution Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                                        <input type="text" name="organizationName" required value={formData.organizationName} onChange={handleChange} placeholder="Legal name of organization" className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] outline-none bg-white font-bold" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">* Data will be shared with other institutional representatives.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Function / Job Title</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                                        <input type="text" name="functionalRole" required value={formData.functionalRole} onChange={handleChange} placeholder="e.g. Manager, Foreman" className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] outline-none bg-white font-bold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Identification Document (ID/Passport)</label>
                            <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative group ${isExtracting ? 'border-[#FBBF24] bg-yellow-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} required />
                                {isExtracting ? (
                                    <div className="flex flex-col items-center gap-4 animate-pulse">
                                        <div className="p-4 bg-white rounded-full shadow-xl"><RefreshCw className="text-[#FBBF24] animate-spin" size={40}/></div>
                                        <div><p className="font-black text-[#1B4D3E] text-lg">AI Intelligence Analysis</p><p className="text-sm text-slate-500">Auto-extracting identity details...</p></div>
                                    </div>
                                ) : idFile ? (
                                    <div className="text-[#1B4D3E] font-bold text-sm flex flex-col items-center justify-center gap-4">
                                        <div className="p-4 bg-green-50 rounded-full shadow-sm text-green-600 border border-green-100"><ShieldCheck size={40}/></div>
                                        <div className="flex items-center gap-2"><FileText size={18} className="text-slate-400"/> {idFile.name}<span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">Verified Upload</span></div>
                                    </div>
                                ) : (
                                    <div className="text-slate-400 group-hover:text-slate-600 space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto group-hover:bg-[#1B4D3E]/5 group-hover:text-[#1B4D3E] transition-all"><Upload size={28} className="opacity-50 group-hover:opacity-100"/></div>
                                        <div><p className="font-black text-slate-800">Identity Linkage</p><p className="text-xs mt-1 max-w-xs mx-auto text-slate-400 font-medium">Upload ID to auto-populate your profile.</p></div>
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-2"><Sparkles size={12}/> AI Extraction Enabled</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Personal */}
                {step === 2 && (
                    <div className="space-y-8 animate-fade-in flex-1">
                        <div className="bg-[#1B4D3E]/5 p-6 rounded-3xl border border-[#1B4D3E]/10 flex items-start gap-4">
                            <div className="p-3 bg-white rounded-2xl text-[#1B4D3E] shadow-sm"><Wand2 size={24}/></div>
                            <div><h4 className="font-black text-[#1B4D3E] text-sm">Identity Extraction Complete</h4><p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-bold uppercase tracking-widest">Verify the auto-populated details below.</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label><input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label><input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 md:col-span-2">
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none bg-white font-bold text-slate-800 transition-all shadow-sm">
                                    {systemMetadata.genders.map((g: string) => <option key={g}>{g}</option>)}
                                </select></div>
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label><input type="date" name="dob" required value={formData.dob} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">National ID (PIN)</label><input type="text" name="idNumber" required value={formData.idNumber} onChange={handleChange} placeholder="e.g. 800101..." className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-mono text-lg font-black text-[#1B4D3E] transition-all shadow-sm" /></div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Contact & Location */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label><input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+268 7..." className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                            <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold text-slate-800 transition-all shadow-sm" /></div>
                            <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label><select name="region" value={formData.region} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none bg-white font-bold text-slate-800 transition-all shadow-sm">
                                {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                            </select></div>
                            <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinkhundla</label><select name="tinkhundla" value={formData.tinkhundla} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none bg-white font-bold text-slate-800 transition-all shadow-sm" required><option value="">Select...</option>{TINKHUNDLA[formData.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="md:col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">GPS Location Linkage</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex flex-1 gap-2"><input type="text" placeholder="Lat" value={formData.gpsLat} readOnly className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-400 font-mono text-[10px]" /><input type="text" placeholder="Long" value={formData.gpsLong} readOnly className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-400 font-mono text-[10px]" /></div>
                                    <button type="button" onClick={handleLocation} disabled={locating} className="px-8 py-3 bg-[#1B4D3E] text-white font-bold rounded-2xl hover:bg-[#143d31] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">{locating ? <Loader2 className="animate-spin" size={18}/> : <MapPin size={18}/>} {locating ? 'Locating...' : 'Auto-Link GPS'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: Security */}
                {step === 4 && (
                    <div className="space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full space-y-8">
                            <div className="text-center"><div className="w-20 h-20 bg-[#1B4D3E]/5 text-[#1B4D3E] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-[#1B4D3E]/10"><Lock size={40}/></div><h4 className="font-black text-slate-800 text-xl">Institutional Keyphrase</h4><p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[250px] mx-auto mt-1">Set your secure credentials for the national database.</p></div>
                            <div className="space-y-5">
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label><input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold transition-all shadow-sm" /></div>
                                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label><input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] outline-none font-bold transition-all shadow-sm" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NAVIGATION FOOTER */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                    <button type="button" onClick={prevStep} disabled={step === 1} className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-600'}`}><ChevronLeft size={16}/> Previous Step</button>
                    {step < 4 ? (
                        <button type="button" onClick={nextStep} disabled={!validateStep() || isExtracting} className="px-10 py-4 bg-[#FBBF24] text-[#1B4D3E] font-black uppercase text-[10px] tracking-widest rounded-2xl hover:shadow-xl hover:bg-yellow-400 transition-all flex items-center gap-3 disabled:opacity-50">Next Phase <ChevronRight size={16}/></button>
                    ) : (
                        <button type="submit" disabled={loading || !validateStep()} className="px-12 py-4 bg-[#1B4D3E] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#143d31] shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50">{loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Finalize Entry</button>
                    )}
                </div>
            </form>
          </div>

          {/* RIGHT SIDE: Journey Illustration / Role Story */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#1B4D3E] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col h-full min-h-[500px]">
                  <div className="relative z-10 space-y-8 flex-1">
                      <div>
                          <p className="text-green-300 font-black text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Sparkles size={12}/> Role Workflow Preview</p>
                          <h3 className="text-3xl font-black leading-tight">Your Digital Journey as a {formData.actorType}</h3>
                      </div>

                      {currentWorkflow ? (
                          <div className="space-y-10 animate-fade-in">
                              <p className="text-sm text-green-100/80 leading-relaxed font-medium border-l-2 border-green-500/30 pl-4 italic">
                                  "{currentWorkflow.description}"
                              </p>

                              <div className="space-y-6">
                                  {currentWorkflow.steps.map((step, i) => (
                                      <div key={i} className="flex gap-4 group">
                                          <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-green-400 group-hover:text-emerald-950 transition-all">
                                              {i + 1}
                                          </div>
                                          <p className="text-sm font-bold text-green-50/90 leading-tight pt-1">{step}</p>
                                      </div>
                                  ))}
                              </div>

                              <div>
                                  <p className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-4">Core Modules Accessible</p>
                                  <div className="flex flex-wrap gap-2">
                                      {currentWorkflow.modules.map(mod => (
                                          <span key={mod.id} className="px-3 py-1.5 bg-white/10 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-white/5">
                                              {mod.icon} {mod.label}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="py-20 text-center space-y-6 opacity-40">
                              <User size={64} className="mx-auto" />
                              <p className="text-sm font-bold uppercase tracking-widest">Select a role to see your potential system workflow.</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="relative z-10 pt-10 border-t border-white/10">
                      <div className="flex items-start gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl"><ShieldCheck className="text-green-400" size={24}/></div>
                          <div>
                              <p className="text-xs font-black text-green-300 uppercase tracking-widest">Data Privacy</p>
                              <p className="text-[10px] text-green-100/60 leading-relaxed mt-1">Your registry data is encrypted and managed by the Ministry of Agriculture. Access is restricted to authorized personnel only.</p>
                          </div>
                      </div>
                  </div>

                  <Activity size={240} className="absolute -right-20 -bottom-20 text-white/5 pointer-events-none rotate-12" />
              </div>

              {/* Quick Info Card */}
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600"><Info size={20}/></div>
                  <div>
                      <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest mb-1">Approval Notice</h4>
                      <p className="text-[10px] text-amber-800 leading-relaxed">Most institutional roles require a one-time physical verification of identity by an Extension Officer before full module access is granted.</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Registration;
