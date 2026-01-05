
import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, LogIn, ChevronRight, Users, Building2, ShieldCheck, 
  Key, AlertCircle, ExternalLink, ShieldAlert, Fingerprint, Sparkles, 
  Globe, ArrowRight, CheckCircle2, Loader2, Info, HelpCircle, ArrowRightCircle,
  UserCircle
} from 'lucide-react';
import { UserRole, UserProfile, Region } from '../types';
import { View_All_System_Users } from '../services/adminDataService';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onRegister: () => void;
}

const LOGO_URL = "https://www.agrinfosystems.gov.sz/assets/uploads/logo.png";

const MinistryLogo = () => (
  <div className="flex flex-col items-center animate-fade-in">
    <div className="w-32 h-16 sm:w-40 sm:h-20 flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform duration-500 hover:scale-105">
      <img src={LOGO_URL} alt="Ministry of Agriculture" className="max-w-full max-h-full object-contain" />
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [identifier, setIdentifier] = useState(''); // Email or User ID
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKeyWarning, setShowKeyWarning] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
        if (window.aistudio?.hasSelectedApiKey) {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(selected);
        }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
          setHasApiKey(true);
          setShowKeyWarning(false);
          if (pendingUser) {
              onLogin(pendingUser);
          }
      }
  };

  const handleQuickLogin = (idOrEmail: string) => {
      setIdentifier(idOrEmail);
      setPassword('password');
      setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowKeyWarning(false);
    setIsAuthenticating(true);

    // Minor delay to feel like a real auth process
    setTimeout(() => {
        if (!identifier.trim() || !password.trim()) {
            setError("Please enter your credentials.");
            setIsAuthenticating(false);
            return;
        }

        const registeredUsers = View_All_System_Users();
        // Match against email OR system ID
        const matchedUser = registeredUsers.find(u => 
            u.email?.toLowerCase() === identifier.toLowerCase() || 
            u.id?.toLowerCase() === identifier.toLowerCase()
        );

        if (!matchedUser) {
            setError("The Identifier or Password provided is incorrect.");
            setIsAuthenticating(false);
            return;
        }

        if ((matchedUser.role === UserRole.Government || matchedUser.role === UserRole.Extension) && !hasApiKey) {
            setPendingUser(matchedUser);
            setShowKeyWarning(true);
            setIsAuthenticating(false);
            return;
        }

        onLogin(matchedUser);
    }, 600); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-100/50 rounded-full blur-[80px] sm:blur-[100px]"></div>
             <div className="absolute -bottom-[10%] -left-[10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-amber-100/40 rounded-full blur-[60px] sm:blur-[80px]"></div>
        </div>

        <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden z-10 animate-fade-in">
            <div className="p-6 sm:p-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <MinistryLogo />
                    <div className="mt-6 space-y-1">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-400 text-sm font-medium">Log in to your AIIS dashboard</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-3 rounded-2xl animate-shake">
                            <AlertCircle size={16} className="text-rose-500 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {showKeyWarning && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3 shadow-sm">
                            <div className="flex gap-3 text-amber-900">
                                <Key size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-black">Identity Link Required</p>
                                    <p className="opacity-80">Ministry accounts require a secure vault key for sensitive data.</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={handleSelectKey}
                                className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} /> Connect Secure Vault
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or User ID</label>
                            <div className="relative group">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Enter your email or ID"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keyphrase</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isAuthenticating}
                        className="w-full h-14 bg-[#1B4D3E] text-white rounded-2xl font-black shadow-lg shadow-emerald-900/10 hover:bg-[#143d31] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                    >
                        {isAuthenticating ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-widest text-[11px]">Sign In</span>
                                <ArrowRightCircle size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Quick Entry</p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => handleQuickLogin('MG')}
                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100/50 hover:bg-emerald-100 transition-all group"
                        >
                            <Users size={16} className="text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-800 uppercase">Farmer</span>
                        </button>
                        <button 
                            onClick={() => handleQuickLogin('ADMIN')}
                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100/50 hover:bg-blue-100 transition-all group"
                        >
                            <Building2 size={16} className="text-blue-600" />
                            <span className="text-[10px] font-black text-blue-800 uppercase">Officer</span>
                        </button>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button 
                            onClick={onRegister}
                            className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2"
                        >
                            Create Account <ArrowRightCircle size={14} />
                        </button>
                        
                        <button 
                            onClick={() => onLogin({ name: 'Public Guest', email: 'guest@moa.gov.sz', role: UserRole.Guest, region: Region.All, status: 'Active' })}
                            className="text-[9px] text-slate-300 hover:text-slate-500 uppercase tracking-[0.3em] font-black transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="fixed bottom-6 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center w-full px-8 opacity-40">
            National Agriculture System &bull; Kingdom of Eswatini
        </div>
    </div>
  );
};

export default Login;
