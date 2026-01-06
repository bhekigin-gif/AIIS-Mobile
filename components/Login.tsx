
import React, { useState, useEffect } from 'react';
import { 
  Lock, LogIn, ChevronRight, Users, ShieldCheck, 
  Key, AlertCircle, Sparkles, UserCircle, ArrowRightCircle, Loader2
} from 'lucide-react';
import { UserRole, UserProfile, Region } from '../types';
import { View_All_System_Users } from '../services/adminDataService';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onRegister: () => void;
}

// Updated logo as per user request
const LOGO_URL = "screenshot 2025-12-03 044721.png";

const MinistryLogo = () => (
  <div className="flex flex-col items-center animate-fade-in w-full">
    <div className="w-full max-w-[240px] sm:max-w-[300px] flex items-center justify-center transition-transform duration-500 hover:scale-102">
      <img src={LOGO_URL} alt="Ministry of Agriculture AIIS" className="max-w-full h-auto object-contain" />
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [identifier, setIdentifier] = useState('');
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
        } else {
            setHasApiKey(false);
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
      } else {
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

    const processAuth = async () => {
        if (!identifier.trim() || !password.trim()) {
            setError("Please enter your credentials.");
            setIsAuthenticating(false);
            return;
        }

        const registeredUsers = await View_All_System_Users();
        const matchedUser = registeredUsers.find(u => 
            u.email?.toLowerCase() === identifier.toLowerCase() || 
            u.id?.toLowerCase() === identifier.toLowerCase()
        );

        if (!matchedUser) {
            setError("The Identifier or Password provided is incorrect.");
            setIsAuthenticating(false);
            return;
        }

        const needsKey = (matchedUser.role === UserRole.Government || matchedUser.role === UserRole.Extension);
        const canSelectKey = typeof window.aistudio !== 'undefined';

        if (needsKey && !hasApiKey && canSelectKey) {
            setPendingUser(matchedUser);
            setShowKeyWarning(true);
            setIsAuthenticating(false);
            return;
        }

        onLogin(matchedUser);
    };

    setTimeout(processAuth, 600); 
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8faf9] px-4 overflow-hidden relative font-sans">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute -top-[5%] -right-[5%] w-[350px] h-[350px] bg-emerald-100/50 rounded-full blur-[90px]"></div>
             <div className="absolute -bottom-[5%] -left-[5%] w-[300px] h-[300px] bg-amber-100/40 rounded-full blur-[80px]"></div>
        </div>

        <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden z-10 animate-fade-in my-4">
            <div className="p-5 sm:p-8 flex flex-col items-center">
                <div className="mb-4 w-full flex flex-col items-center">
                    <MinistryLogo />
                    <div className="text-center mt-2">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Portal Access</h2>
                        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">National Agriculture Gateway</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-3">
                    {error && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-2 rounded-xl animate-shake">
                            <AlertCircle size={14} className="text-rose-500 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {showKeyWarning && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-2 shadow-sm">
                            <div className="flex gap-2 text-amber-900">
                                <Key size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-[10px]">
                                    <p className="font-black uppercase tracking-tight">Identity Key Required</p>
                                    <p className="opacity-80 leading-tight">Ministry accounts require a secure vault key.</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={handleSelectKey}
                                className="w-full bg-amber-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={10} /> Connect Secure Vault
                            </button>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity ID / Email</label>
                            <div className="relative group">
                                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Enter identifier"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Keyphrase</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isAuthenticating}
                        className="w-full h-12 bg-[#1B4D3E] text-white rounded-xl font-black shadow-lg shadow-emerald-900/10 hover:bg-[#143d31] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 mt-1 py-3"
                    >
                        {isAuthenticating ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-[0.15em] text-[10px]">Secure Sign In</span>
                                <ArrowRightCircle size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-5 w-full flex flex-col items-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em] mb-3">Express Verification</p>
                    
                    <div className="flex gap-2.5 w-full">
                        <button 
                            onClick={() => handleQuickLogin('MG')}
                            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
                        >
                            <Users size={12} className="text-emerald-600" />
                            <span className="text-[8px] font-black text-emerald-800 uppercase">Producer</span>
                        </button>
                        <button 
                            onClick={() => handleQuickLogin('EXT')}
                            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100 transition-all group"
                        >
                            <UserCircle size={12} className="text-blue-600" />
                            <span className="text-[8px] font-black text-blue-800 uppercase">Extension</span>
                        </button>
                    </div>

                    <div className="mt-5 flex items-center gap-5">
                        <button 
                            onClick={onRegister}
                            className="text-[9px] font-black text-[#1B4D3E] uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1.5"
                        >
                            Register <ChevronRight size={10} />
                        </button>
                        <div className="w-px h-2.5 bg-slate-100"></div>
                        <button 
                            onClick={() => onLogin({ name: 'Guest User', email: 'guest@moa.gov.sz', role: UserRole.Guest, region: Region.All, status: 'Active' })}
                            className="text-[9px] text-slate-300 hover:text-slate-500 uppercase tracking-widest font-black transition-colors"
                        >
                            Guest Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="fixed bottom-4 text-[7px] text-slate-400 font-bold uppercase tracking-[0.15em] text-center w-full px-8 opacity-40 pointer-events-none">
            Ministry of Agriculture &bull; Kingdom of Eswatini
        </div>
    </div>
  );
};

export default Login;
