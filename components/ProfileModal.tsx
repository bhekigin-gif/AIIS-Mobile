import React, { useState } from 'react';
import { 
    X, User, Mail, Phone, MapPin, Building2, Briefcase, 
    Lock, Shield, Save, Camera, CheckCircle2, AlertCircle,
    ChevronRight, Fingerprint, Globe, Landmark, ShieldCheck,
    Info
} from 'lucide-react';
import { UserProfile, Region, TINKHUNDLA, ActorType, EntityType } from '../types';
import { Get_System_Metadata } from '../services/adminDataService';

interface ProfileModalProps {
    user: UserProfile;
    onClose: () => void;
    onSave: (updatedUser: UserProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'institutional' | 'security'>('personal');
    const [formData, setFormData] = useState<UserProfile>({ ...user });
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // System Metadata
    const systemMetadata = Get_System_Metadata();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            onSave(formData);
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    const renderPersonal = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input name="name" value={formData.name} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all">
                        {systemMetadata.genders.map((g: string) => <option key={g}>{g}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all" />
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600"><Info size={18}/></div>
                <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">National Registry Status</p>
                    <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">Identity verified via Ministry of Home Affairs. Registration Date: {formData.dateRegistered || '2023-11-20'}</p>
                </div>
            </div>
        </div>
    );

    const renderInstitutional = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization / Farm</label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input name="organization" value={formData.organization} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Role</label>
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input name="functionalRole" value={formData.functionalRole} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                    <select name="region" value={formData.region} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all">
                        {systemMetadata.regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinkhundla</label>
                    <select name="tinkhundla" value={formData.tinkhundla} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] transition-all">
                        {formData.region && TINKHUNDLA[formData.region as Region]?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Scoping</p>
                        <ShieldCheck className="text-emerald-500" size={20}/>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Organization ID</span>
                            <span className="font-mono font-bold">{formData.organizationId || 'GEN-001'}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Actor Type</span>
                            <span className="font-bold">{formData.actorType}</span>
                        </div>
                    </div>
                </div>
                <Fingerprint size={120} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-8 animate-fade-in flex flex-col items-center py-4">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mb-2 border border-amber-100 shadow-sm">
                <Lock size={36} />
            </div>
            <div className="text-center max-w-xs mb-4">
                <h4 className="font-black text-slate-800 text-lg">Access Credentials</h4>
                <p className="text-xs text-slate-400 font-medium">Update your institutional keyphrase to maintain national security compliance.</p>
            </div>
            
            <div className="w-full grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Keyphrase</label>
                        <input type="password" value={passwords.next} onChange={(e) => setPasswords({...passwords, next: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E]" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New</label>
                        <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E]" placeholder="••••••••" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-[#1B4D3E] p-8 text-white flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
                                {formData.avatar ? (
                                    <img src={formData.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={32} className="text-[#FBBF24]" />
                                )}
                            </div>
                            <button className="absolute -bottom-1 -right-1 p-2 bg-[#FBBF24] text-[#1B4D3E] rounded-xl shadow-lg border-2 border-[#1B4D3E] hover:scale-110 transition-transform">
                                <Camera size={14}/>
                            </button>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">{formData.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-black uppercase tracking-widest border border-white/10">{formData.role}</span>
                                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">{formData.id || 'AG-PRO-001'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-6 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100">
                    <button onClick={() => setActiveTab('personal')} className={`px-6 py-3 rounded-t-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-slate-50 text-[#1B4D3E] border-x border-t border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>National Identity</button>
                    <button onClick={() => setActiveTab('institutional')} className={`px-6 py-3 rounded-t-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'institutional' ? 'bg-slate-50 text-[#1B4D3E] border-x border-t border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Institutional Context</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 rounded-t-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-slate-50 text-[#1B4D3E] border-x border-t border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>System Security</button>
                </div>

                {/* Content */}
                <div className="p-10 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                    {activeTab === 'personal' && renderPersonal()}
                    {activeTab === 'institutional' && renderInstitutional()}
                    {activeTab === 'security' && renderSecurity()}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        {showSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in">
                                <CheckCircle2 size={18}/> Registry Updated
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-8 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Dismiss</button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-3 bg-[#1B4D3E] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 hover:bg-[#143d31] flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
                        >
                            {isSaving ? 'Processing...' : 'Commit Changes'}
                            {!isSaving && <Save size={18}/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
