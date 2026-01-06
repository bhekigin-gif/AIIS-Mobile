
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, CheckCircle, MapPin, User, Shield, Phone, FileText, Loader2, 
  Clock, ShieldCheck, Lock, Upload, ChevronRight, ChevronLeft, Building2, 
  Briefcase, Sparkles, Wand2, RefreshCw, Factory, ShoppingCart, MessageSquareText,
  Activity, ArrowRight, Info, Eye, Mail, Info as InfoIcon
} from 'lucide-react';
import { Region, ActorType, TINKHUNDLA, EntityType, UserRole, UserProfile } from '../types';
import { Register_New_User, Get_System_Metadata } from '../services/adminDataService';
import { extractPersonalDetailsFromID } from '../services/geminiService';

const ROLE_EXPLANATIONS: Record<ActorType, string> = {
    [ActorType.Farmer]: "Primary producers of raw commodities. Responsible for GIS mapping, crop cycle logging, and listing traceable harvest batches.",
    [ActorType.Processor]: "Value-addition specialists. Link raw produce chronology IDs to finished retail products, maintaining the digital provenance thread.",
    [ActorType.Buyer]: "Institutional procurement nodes (Supermarkets, Reservoirs). Responsible for high-volume trade liquidity and verifying food safety standards.",
    [ActorType.Supplier]: "Essential input providers (Seeds, Chemicals). Register vetted products in the Master Catalogue for farmer procurement cycles.",
    [ActorType.Retailer]: "Local produce sellers. Ensure shelf-life monitoring and provide consumers with traceability data from original production nodes.",
    [ActorType.Restaurant]: "Hospitality nodes. Source verified ingredients to provide 'Farm-to-Table' transparency for local and tourist markets.",
    [ActorType.Consumer]: "The final node. Empowered to scan chronology IDs to view the origin, safety standards, and nutritional profile of their food.",
    [ActorType.WasteManager]: "Circular economy facilitators. Collect organic waste from retail/restaurant nodes to transform into traceable organic fertilizers.",
    [ActorType.Transporter]: "National asset movers. Responsible for logistics safety and logging movement cycles between farm, processor, and market hubs.",
    [ActorType.Gov]: "National oversight and policy makers. Audit the registry, manage the Master Catalogue, and adjust national food security strategy.",
    [ActorType.Extension]: "Regional technical advisors. Onboard farmers, verify field boundaries, and provide AI-assisted diagnostic support in the field.",
    [ActorType.AgroTrader]: "Strategic integrators. Provide skilled labor linkages (like harvest crews) and aggregate multiple harvests for international export."
};

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

  const [formData, setFormData] = useState({
    actorType: ActorType.Farmer as string,
    entityType: EntityType.Person as string,
    organizationName: '',
    functionalRole: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    idNumber: '',
    phone: '',
    email: '',
    region: Region.Manzini as string,
    tinkhundla: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    Get_System_Metadata().then(setSystemMetadata);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
                      setFormData(prev => ({
                          ...prev,
                          firstName: extracted.firstName || prev.firstName,
                          lastName: extracted.lastName || prev.lastName,
                          idNumber: extracted.idNumber || prev.idNumber,
                          dob: extracted.dob || prev.dob,
                          gender: extracted.gender || prev.gender
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

    const newUser: UserProfile = {
        name: `${formData.firstName} ${formData.lastName}`,
        role: role,
        actorType: formData.actorType as ActorType,
        region: formData.region,
        status: 'Pending Approval',
        contact: formData.phone,
        email: formData.email,
        dateRegistered: new Date().toISOString().split('T')[0]
    };
    await Register_New_User(newUser);
    setLoading(false);
    setSubmitted(true);
  };

  if (!systemMetadata) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#1B4D3E]" /></div>;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#1B4D3E] uppercase tracking-tight">System Registry</h2>
          <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400">Step {step}/4</span>
      </div>

      {!submitted ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8">
                  {step === 1 && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Document</label>
                              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative group hover:border-[#1B4D3E]/30 transition-all">
                                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                  {isExtracting ? (
                                      <div className="flex flex-col items-center gap-3">
                                          <Loader2 className="animate-spin text-[#FBBF24]" size={32}/>
                                          <p className="text-xs font-black text-[#1B4D3E] uppercase">AI Extracting...</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-4">
                                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 group-hover:text-[#1B4D3E] transition-colors"><Upload size={24}/></div>
                                          <p className="text-xs font-bold text-slate-400">Upload ID Photo to Auto-Fill</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                          <div className="space-y-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Persona</label>
                                  <select name="actorType" value={formData.actorType} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                                      {systemMetadata.actorTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                              
                              {/* Role Intelligence Explanation */}
                              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl animate-fade-in">
                                  <div className="flex items-start gap-3">
                                      <InfoIcon size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                                      <div className="space-y-1">
                                          <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Digital Responsibility</h4>
                                          <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                              {ROLE_EXPLANATIONS[formData.actorType as ActorType]}
                                          </p>
                                      </div>
                                  </div>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Type</label>
                                  <select name="entityType" value={formData.entityType} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                                      {systemMetadata.entityTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                          </div>
                          <button onClick={nextStep} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Begin Verification</button>
                      </div>
                  )}

                  {step === 2 && (
                      <div className="space-y-4 animate-fade-in">
                          <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 mb-4">AI extraction successfully populated these fields.</p>
                          <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                          <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                          <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="National ID (PIN)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-mono font-black text-sm outline-none text-[#1B4D3E]" />
                          <input name="dob" type="date" value={formData.dob} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                          <div className="flex gap-4 pt-4">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Back</button>
                              <button onClick={nextStep} className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Confirm Details</button>
                          </div>
                      </div>
                  )}

                  {step === 3 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile Number (+268)" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-[#1B4D3E]" />
                          </div>
                          <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address (Optional)" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-[#1B4D3E]" />
                          </div>
                          <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <select name="region" value={formData.region} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-[#1B4D3E]">
                                  {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                              </select>
                          </div>
                          <div className="flex gap-4 pt-4">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Back</button>
                              <button onClick={nextStep} className="flex-[2] py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Next</button>
                          </div>
                      </div>
                  )}

                  {step === 4 && (
                      <div className="space-y-4 animate-fade-in text-center">
                          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100 shadow-sm"><ShieldCheck size={32}/></div>
                          <h4 className="font-black text-slate-800">Finalize Credentials</h4>
                          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Secure Keyphrase" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Keyphrase" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                          <div className="flex gap-4 pt-6">
                              <button onClick={prevStep} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Back</button>
                              <button onClick={handleSubmit} className="flex-[2] py-4 bg-[#FBBF24] text-[#1B4D3E] rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Finalize Entry</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-xl border border-slate-100 space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner border border-green-100"><CheckCircle size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800">Registration Received</h3>
              <p className="text-sm text-slate-400 font-medium">Your profile is currently being vetted by the National Registry. You will receive an SMS confirmation once approved.</p>
              <button onClick={onBackToLogin} className="w-full py-4 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest">Back to Login</button>
          </div>
      )}
    </div>
  );
};

export default Registration;
