
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, CheckCircle, MapPin, User, Shield, Phone, FileText, Loader2, 
  Clock, ShieldCheck, Lock, Upload, ChevronRight, ChevronLeft, Building2, 
  Briefcase, Sparkles, Wand2, RefreshCw, Factory, ShoppingCart, MessageSquareText,
  Activity, ArrowRight, Info, Eye, Mail, Info as InfoIcon, Globe, Fingerprint,
  Users as UsersIcon,
  ChevronDown,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';
import { Region, ActorType, TINKHUNDLA, EntityType, UserRole, UserProfile, RDAs } from '../types';
import { Register_New_User, Get_System_Metadata, View_All_System_Users } from '../services/adminDataService';
import { extractPersonalDetailsFromID } from '../services/geminiService';

const ROLE_EXPLANATIONS: Record<ActorType, string> = {
    [ActorType.Farmer]: "Primary producers of raw commodities. Responsible for GIS mapping, crop cycle logging, and listing traceable harvest batches.",
    [ActorType.Processor]: "Value-addition specialists. Link raw produce chronology IDs to finished retail products, maintaining the digital provenance thread.",
    [ActorType.Buyer]: "Institutional procurement nodes (Supermarkets, Reservoirs). Responsible for high-volume trade liquidity and verifying food safety standards.",
    [ActorType.Supplier]: "Essential input providers (Seeds, Chemicals). Register vetted products in the Master Catalogue for farmer procurement cycles.",
    [ActorType.Retailer]: "Produce Retailer. Ensure shelf-life monitoring and provide consumers with traceability data from original production nodes.",
    [ActorType.Restaurant]: "Hospitality nodes. Source verified ingredients to provide 'Farm-to-Table' transparency for local and tourist markets.",
    [ActorType.Consumer]: "The final node. Empowered to scan chronology IDs to view the origin, safety standards, and nutritional profile of their food.",
    [ActorType.WasteManager]: "Circular economy facilitators. Collect organic waste from retail/restaurant nodes to transform into traceable organic fertilizers.",
    [ActorType.Transporter]: "National asset movers. Responsible for logistics safety and logging movement cycles between farm, processor, and market hubs.",
    [ActorType.Gov]: "National oversight and policy makers. Audit the registry, manage the Master Catalogue, and adjust national food security strategy.",
    [ActorType.Extension]: "Regional technical advisors. Onboard farmers, verify field boundaries, and provide AI-assisted diagnostic support in the field.",
    [ActorType.AgroTrader]: "Strategic integrators. Provide skilled labor linkages and aggregate multiple harvests for international export."
};

const SECTIONS = [
    { id: 1, title: 'Institutional Persona', icon: <UsersIcon size={14}/> },
    { id: 2, title: 'Personal Identity', icon: <Fingerprint size={14}/> },
    { id: 3, title: 'Communication Node', icon: <Mail size={14}/> },
    { id: 4, title: 'Operational Area', icon: <MapPin size={14}/> },
    { id: 5, title: 'Access Security', icon: <Lock size={14}/> }
];

interface RegistrationProps {
  onBackToLogin?: () => void;
  onBackToHome?: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ onBackToLogin, onBackToHome }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [existingInstitutions, setExistingInstitutions] = useState<UserProfile[]>([]);

  const [formData, setFormData] = useState({
    actorType: ActorType.Farmer as string,
    entityType: EntityType.Person as string,
    organizationName: '',
    organizationId: '',
    functionalRole: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    idNumber: '',
    chiefCode: '',
    phone: '',
    email: '',
    country: 'Eswatini',
    region: Region.Manzini as string,
    rda: '',
    tinkhundla: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadInitData = async () => {
        const [meta, users] = await Promise.all([
            Get_System_Metadata(),
            View_All_System_Users()
        ]);
        setSystemMetadata(meta);
        const insts = users.filter(u => u.entityType !== EntityType.Person);
        setExistingInstitutions(insts);
    };
    loadInitData();
  }, []);

  const parseDOBFromID = (id: string) => {
    if (id && id.length >= 8) {
      const year = id.substring(0, 4);
      const month = id.substring(4, 6);
      const day = id.substring(6, 8);
      // Basic validation: month 1-12, day 1-31
      const m = parseInt(month);
      const d = parseInt(day);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'organizationId') {
        const selected = existingInstitutions.find(i => i.id === value);
        setFormData({ ...formData, organizationId: value, organizationName: selected?.organization || '' });
    } else if (name === 'idNumber') {
        const calculatedDob = parseDOBFromID(value);
        setFormData(prev => ({ 
            ...prev, 
            idNumber: value, 
            dob: calculatedDob || prev.dob 
        }));
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type.startsWith('image/')) {
          setIsExtracting(true);
          try {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = async () => {
                  const base64 = (reader.result as string).split(',')[1];
                  const extracted = await extractPersonalDetailsFromID(base64, file.type);
                  if (extracted) {
                      const finalId = extracted.idNumber || formData.idNumber;
                      const calculatedDob = parseDOBFromID(finalId);
                      setFormData(prev => ({
                          ...prev,
                          firstName: extracted.firstName || prev.firstName,
                          lastName: extracted.lastName || prev.lastName,
                          idNumber: finalId,
                          dob: calculatedDob || extracted.dob || prev.dob,
                          gender: extracted.gender || prev.gender,
                          chiefCode: extracted.chiefCode || prev.chiefCode
                      }));
                      setStep(2);
                  }
                  setIsExtracting(false);
              };
          } catch (error) {
              setIsExtracting(false);
          }
      }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let role = UserRole.Farmer;
    if (formData.actorType === ActorType.Extension) role = UserRole.Extension;
    else if (formData.actorType === ActorType.Gov) role = UserRole.Government;

    const finalStatus = formData.idNumber.trim() ? 'Pending Approval' : 'Suspended';

    const newUser: UserProfile = {
        id: formData.idNumber || `TEMP-${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: role,
        actorType: formData.actorType as ActorType,
        entityType: formData.entityType as EntityType,
        region: formData.region,
        tinkhundla: formData.tinkhundla,
        rda: formData.rda,
        country: formData.country,
        status: finalStatus as any,
        contact: formData.phone,
        email: formData.email,
        gender: formData.gender,
        organization: formData.organizationName,
        organizationId: formData.organizationId,
        chiefCode: formData.chiefCode,
        dateRegistered: new Date().toISOString().split('T')[0]
    };
    await Register_New_User(newUser);
    setLoading(false);
    setSubmitted(true);
  };

  if (!systemMetadata) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#1B4D3E]" /></div>;

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20 h-full overflow-y-auto no-scrollbar pt-4 px-2">
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1B4D3E] uppercase tracking-tight">Node Registry</h2>
              <div className="flex gap-1">
                  {SECTIONS.map(s => (
                      <div key={s.id} className={`w-3 h-1.5 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-[#1B4D3E] w-6' : 'bg-slate-200'}`} />
                  ))}
              </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
              {SECTIONS.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${step === s.id ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 opacity-60'}`}>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${step === s.id ? 'bg-white/20' : 'bg-slate-100'}`}>{s.id}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span>
                  </div>
              ))}
          </div>
      </div>

      {!submitted ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="p-8 sm:p-10">
                  <div className="mb-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                            <span className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-[#1B4D3E] border border-slate-100">{SECTIONS[step-1].icon}</span>
                            Section {step}: {SECTIONS[step-1].title}
                        </h3>
                        {formData.idNumber ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-fade-in">
                            <BadgeCheck size={14}/>
                            <span className="text-[8px] font-black uppercase tracking-widest">PIN Supplied</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 animate-pulse">
                            <AlertTriangle size={14}/>
                            <span className="text-[8px] font-black uppercase tracking-widest">Not Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="h-0.5 w-12 bg-[#FBBF24] mt-3 rounded-full"/>
                  </div>

                  {step === 1 && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="space-y-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role (Persona)</label>
                                  <select name="actorType" value={formData.actorType} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all">
                                      {systemMetadata.actorTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                              
                              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                  <div className="flex items-start gap-3">
                                      <InfoIcon size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                                      <div className="space-y-1">
                                          <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Responsibility Profile</h4>
                                          <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                              {ROLE_EXPLANATIONS[formData.actorType as ActorType]}
                                          </p>
                                      </div>
                                  </div>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution Classification</label>
                                  <select name="entityType" value={formData.entityType} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all">
                                      {systemMetadata.entityTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Intake (AI Assist)</label>
                              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative group hover:border-[#1B4D3E]/30 transition-all bg-slate-50/50">
                                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                  {isExtracting ? (
                                      <div className="flex flex-col items-center gap-3">
                                          <Loader2 className="animate-spin text-[#FBBF24]" size={32}/>
                                          <p className="text-xs font-black text-[#1B4D3E] uppercase">Digital Extraction Active...</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-4">
                                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 group-hover:text-[#1B4D3E] transition-colors shadow-sm"><Upload size={24}/></div>
                                          <p className="text-xs font-bold text-slate-400">Scan National ID to Auto-Fill</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <button onClick={nextStep} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#143d31] active:scale-95 transition-all">Continue to Personal Profile</button>
                      </div>
                  )}

                  {step === 2 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal First Name</label>
                                  <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Last Name</label>
                                  <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">National ID (PIN)</label>
                                  <div className="relative">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="Enter PIN (YYYYMMDD...)" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-black text-sm outline-none text-[#1B4D3E] focus:bg-white" />
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chief Code</label>
                                  <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input name="chiefCode" value={formData.chiefCode} onChange={handleChange} placeholder="Chief Code" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-black text-sm outline-none text-[#1B4D3E] focus:bg-white" />
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white">
                                      {systemMetadata.genders.map((g: string) => <option key={g} value={g}>{g}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                  <div className="relative">
                                    <input name="dob" type="date" value={formData.dob} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all focus:ring-4 focus:ring-amber-400/5" />
                                    {formData.idNumber.length >= 8 && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Sync'd with PIN</div>}
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-4 pt-6">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Back</button>
                              <button onClick={nextStep} className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#143d31] transition-all">Proceed to Contacts</button>
                          </div>
                      </div>
                  )}

                  {step === 3 && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Contacts (+268...)" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1 pt-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Brand (Optional)</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select name="organizationId" value={formData.organizationId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all appearance-none">
                                        <option value="">Select Existing Hub/Corp...</option>
                                        {existingInstitutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.organization} ({inst.entityType})</option>
                                        ))}
                                        <option value="new">-- Register New Brand (Specify Below) --</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                                </div>
                                {formData.organizationId === 'new' && (
                                    <input 
                                        name="organizationName" 
                                        value={formData.organizationName} 
                                        onChange={handleChange} 
                                        placeholder="Specify New Brand Name" 
                                        className="w-full mt-2 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                                    />
                                )}
                            </div>
                          </div>
                          <div className="flex gap-4 pt-4">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Back</button>
                              <button onClick={nextStep} className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#143d31] transition-all">Define Operational Area</button>
                          </div>
                      </div>
                  )}

                  {step === 4 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="space-y-3">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country Node</label>
                                  <div className="relative">
                                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                      <select name="country" value={formData.country} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none focus:bg-white">
                                          {systemMetadata.countries.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrative Region</label>
                                  <div className="relative">
                                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                      <select name="region" value={formData.region} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none focus:bg-white">
                                          {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">RDA Node</label>
                                      <select name="rda" value={formData.rda} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none focus:bg-white">
                                          <option value="">Select RDA...</option>
                                          {RDAs[formData.region as Region]?.map((rda: string) => <option key={rda} value={rda}>{rda}</option>)}
                                      </select>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (Tinkhundla)</label>
                                      <select name="tinkhundla" value={formData.tinkhundla} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none focus:bg-white">
                                          <option value="">Select Tinkhundla...</option>
                                          {TINKHUNDLA[formData.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-4 pt-6">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Back</button>
                              <button onClick={nextStep} className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#143d31] transition-all">Finalize Hub Security</button>
                          </div>
                      </div>
                  )}

                  {step === 5 && (
                      <div className="space-y-6 animate-fade-in text-center">
                          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-sm mb-2"><ShieldCheck size={40}/></div>
                          <div>
                            <h4 className="font-black text-slate-800 text-xl tracking-tight">Access Credentials</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Secure your national digital node</p>
                          </div>
                          
                          <div className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Keyphrase</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Secure Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Keyphrase</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all" />
                                </div>
                            </div>
                          </div>

                          <div className="flex gap-4 pt-6">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Back</button>
                              <button onClick={handleSubmit} className="flex-[2] py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-yellow-400 active:scale-95 transition-all">Submit Node Registration</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100 space-y-8 animate-slide-up">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner border border-green-100"><CheckCircle size={48}/></div>
              <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Institutional Entry Received</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                    The node for <span className="text-[#1B4D3E] font-black">{formData.firstName} {formData.lastName}</span> is currently being vetted by the National Hub.
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${formData.idNumber ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {formData.idNumber ? <Clock size={14}/> : <AlertTriangle size={14}/>}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {formData.idNumber ? 'Awaiting Oversight Verification' : 'Verification Document Required'}
                      </span>
                  </div>
              </div>
              <button onClick={onBackToLogin} className="w-full py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#143d31] transition-all">Back to Login</button>
          </div>
      )}
    </div>
  );
};

export default Registration;
