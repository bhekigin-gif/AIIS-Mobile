import React, { useState, useEffect } from 'react';
import { 
  Lock, LogIn, ChevronRight, Users, Key, AlertCircle, Sparkles, UserCircle, ArrowRightCircle, Loader2
} from 'lucide-react';
import { UserRole, UserProfile, Region } from '../types';
import { View_All_System_Users } from '../services/adminDataService';
import { db, Table as DbTable } from '../services/databaseService';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onRegister: () => void;
}

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

        // Persistence of Last Login Node
        const now = new Date().toISOString();
        if (matchedUser.id) {
            await db.update<UserProfile>(DbTable.Users, matchedUser.id, { lastLogin: now });
        }
        const userWithLogin = { ...matchedUser, lastLogin: now };

        const needsKey = (matchedUser.role === UserRole.Government || matchedUser.role === UserRole.Extension);
        const canSelectKey = typeof window.aistudio !== 'undefined';

        if (needsKey && !hasApiKey && canSelectKey) {
            setPendingUser(userWithLogin);
            setShowKeyWarning(true);
            setIsAuthenticating(false);
            return;
        }

        onLogin(userWithLogin);
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

        <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden z-10 animate-fade-in my-4">
            <div className="p-6 sm:p-10 flex flex-col items-center">
                <div className="mb-8 w-full flex flex-col items-center pt-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">AIIS</h2>
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Agriculture Market</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-3 rounded-2xl animate-shake">
                            <AlertCircle size={16} className="text-rose-500 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {showKeyWarning && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3 shadow-sm">
                            <div className="flex gap-3 text-amber-900">
                                <Key size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-[11px]">
                                    <p className="font-black uppercase tracking-tight">Identity Key Required</p>
                                    <p className="opacity-80 leading-relaxed font-medium mt-1">Ministry accounts require a secure vault key for national data access.</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={handleSelectKey}
                                className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={12} /> Connect Secure Vault
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity ID / Email</label>
                            <div className="relative group">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Enter identifier"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keyphrase</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 focus:border-[#1B4D3E] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end px-1">
                            <button 
                                type="button"
                                onClick={() => alert("Redirecting to password recovery flow...")}
                                className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest hover:text-emerald-700 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isAuthenticating}
                        className="w-full h-14 bg-[#1B4D3E] text-white rounded-2xl font-black shadow-xl shadow-emerald-900/10 hover:bg-[#143d31] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 mt-2 py-4"
                    >
                        {isAuthenticating ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-[0.2em] text-[11px]">Authorize Node Access</span>
                                <ArrowRightCircle size={18} className="text-[#FBBF24]" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 w-full flex flex-col items-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Express Verification</p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => handleQuickLogin('MG')}
                            className="flex-1 flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
                        >
                            <Users size={14} className="text-emerald-600" />
                            <span className="text-[9px] font-black text-emerald-800 uppercase">Producer</span>
                        </button>
                        <button 
                            onClick={() => handleQuickLogin('EXT')}
                            className="flex-1 flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100 transition-all group"
                        >
                            <UserCircle size={14} className="text-blue-600" />
                            <span className="text-[9px] font-black text-blue-800 uppercase">Extension</span>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center gap-6">
                        <button 
                            onClick={onRegister}
                            className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2"
                        >
                            New Registry <ChevronRight size={12} />
                        </button>
                        <div className="w-px h-3 bg-slate-100"></div>
                        <button 
                            onClick={() => onLogin({ name: 'Guest User', email: 'guest@moa.gov.sz', role: UserRole.Guest, region: Region.All, status: 'Active' })}
                            className="text-[10px] text-slate-300 hover:text-slate-500 uppercase tracking-widest font-black transition-colors"
                        >
                            Guest Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="fixed bottom-6 text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center w-full px-8 opacity-40 pointer-events-none">
            Ministry of Agriculture &bull; Agriculture Market &bull; Integrated Systems Node
        </div>
    </div>
  );
};

export default Login;