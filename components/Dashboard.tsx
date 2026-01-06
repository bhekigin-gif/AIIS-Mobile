
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, Droplets, Sun, TrendingUp, AlertTriangle, RefreshCw, ChevronRight, 
  Globe, MessageSquare, Mic, Send, X, Mail, User, Bot, Loader2, Cloud, 
  CloudRain, CloudLightning, ChevronDown, ChevronUp, MapPin, Thermometer, 
  UserCheck, Shield, ShoppingBag, Sprout, ClipboardList, Landmark, Info, Sparkles 
} from 'lucide-react';
import { getDashboardAnalysis, getWeatherAlert, chatWithAgriBot, getWeatherForecast } from '../services/geminiService';
import { ChatMessage, UserProfile, UserRole, ActorType } from '../types';

interface DashboardProps {
    user: UserProfile | null;
    onRegister?: () => void;
}

const productionData = [
  { name: 'Maize', value: 4000, region: 'Hhohho' },
  { name: 'Sugar', value: 8500, region: 'Lubombo' },
  { name: 'Citrus', value: 3000, region: 'Manzini' },
  { name: 'Cotton', value: 1200, region: 'Shiselweni' },
  { name: 'Veg', value: 2100, region: 'Hhohho' },
];

const priceTrends = [
  { month: 'Jan', maize: 120, beans: 180 },
  { month: 'Feb', maize: 125, beans: 175 },
  { month: 'Mar', maize: 130, beans: 190 },
  { month: 'Apr', maize: 128, beans: 200 },
  { month: 'May', maize: 135, beans: 210 },
  { month: 'Jun', maize: 140, beans: 205 },
];

const Dashboard: React.FC<DashboardProps> = ({ user, onRegister }) => {
  const [weatherData, setWeatherData] = useState<string>("Detecting local meteorological conditions...");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { role: 'model', text: 'Sanibonani! You are connected to the Ministry of Agriculture Support Line. How can I assist with your regional data today?', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRegionalScope = user?.role === UserRole.Extension || (user?.role === UserRole.Government && user?.region && user?.region !== 'All');

  const weatherStyles = useMemo(() => {
    const low = weatherData.toLowerCase();
    if (low.includes('severe') || low.includes('danger') || low.includes('red alert') || low.includes('flood')) {
      return { icon: <CloudLightning size={20} />, bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-600' };
    }
    if (low.includes('warning') || low.includes('alert') || low.includes('caution') || low.includes('high heat')) {
      return { icon: <AlertTriangle size={20} />, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', iconBg: 'bg-amber-100 text-amber-600' };
    }
    if (low.includes('rain') || low.includes('shower') || low.includes('thunder')) {
      return { icon: <CloudRain size={20} />, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', iconBg: 'bg-blue-100 text-blue-600' };
    }
    if (low.includes('cloud') || low.includes('overcast')) {
      return { icon: <Cloud size={20} />, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800', iconBg: 'bg-slate-200 text-slate-500' };
    }
    return { icon: <Sun size={20} />, bg: 'bg-emerald-50/30 border-emerald-100', text: 'text-emerald-900', iconBg: 'bg-emerald-100 text-emerald-600' };
  }, [weatherData]);

  const handleGenerateInsight = async () => {
    setIsAnalyzing(true);
    const weather = await getWeatherAlert();
    setWeatherData(weather);

    const filteredProduction = productionData.filter(d => !isRegionalScope || d.region === user?.region);
    const analysis = await getDashboardAnalysis(filteredProduction, priceTrends, weather);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const data = await getWeatherForecast(pos.coords.latitude, pos.coords.longitude);
            setForecast(data);
        }, async () => {
            const data = await getWeatherForecast(-26.50, 31.37);
            setForecast(data);
        });
    } else {
         const data = await getWeatherForecast(-26.50, 31.37);
         setForecast(data);
    }
  };

  useEffect(() => {
    handleGenerateInsight();
  }, [user]);

  useEffect(() => {
      if (showLiveChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showLiveChat]);

  const handleSendChat = async () => {
      if (!chatInput.trim()) return;
      const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput("");
      setIsChatLoading(true);
      const response = await chatWithAgriBot(userMsg.text, null, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date() }]);
      setIsChatLoading(false);
  };

  const renderRoleSpecificWidget = () => {
      if (!user) return (
          <div className="bg-[#1B4D3E] p-3 rounded-2xl text-white shadow-lg relative overflow-hidden h-full">
              <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Authorization</h4>
                  <button onClick={onRegister} className="bg-[#FBBF24] text-[#1B4D3E] px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-md">Register</button>
              </div>
              <Globe size={60} className="absolute -bottom-4 -right-4 text-white/5" />
          </div>
      );

      if (user.role === UserRole.Farmer) {
          return (
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                      <div><p className="text-[8px] font-black text-slate-400 uppercase">Identity</p><h4 className="text-xs font-black text-[#1B4D3E] truncate">{user.name}</h4></div>
                      <Sprout size={14} className="text-emerald-600"/>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">National Node Verified</div>
              </div>
          );
      }

      return (
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                  <div><p className="text-[8px] font-black text-slate-400 uppercase">Scope</p><h4 className="text-xs font-black text-blue-800 truncate">{user.region}</h4></div>
                  <Landmark size={14} className="text-blue-600"/>
              </div>
              <div className="text-[10px] font-bold text-slate-500">Ministry Authorized</div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden animate-fade-in relative pb-10 sm:pb-2">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#1B4D3E] tracking-tight">{user ? `Sawubona, ${user.name.split(' ')[0]}` : "National Gateway"}</h2>
              {user && <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.role === UserRole.Government ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.region} Node</span>}
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mt-1">Kingdom of Eswatini Agriculture</p>
        </div>
        <button onClick={() => setShowLiveChat(true)} className="px-3 py-1.5 bg-white text-[#1B4D3E] border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all hover:border-[#1B4D3E]">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>Ministry Support
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 shrink-0">
        <div className="lg:col-span-3 grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-[#1B4D3E] rounded-xl"><Activity size={16} /></div>
                <div><p className="text-[8px] text-slate-400 font-black uppercase">Yield</p><h3 className="text-sm font-black text-slate-800">{isRegionalScope ? '4.2k' : '18.8k'} <span className="text-[8px] font-bold text-slate-300">Tons</span></h3></div>
            </div>
            <div className={`p-3 rounded-2xl shadow-sm border flex items-center gap-3 transition-colors ${weatherStyles.bg}`}>
                <div className={`p-2 rounded-xl ${weatherStyles.iconBg}`}>{weatherStyles.icon}</div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] text-slate-400 font-black uppercase">Met Alert</p>
                  <h3 className={`text-[10px] font-bold truncate leading-tight mt-0.5 ${weatherStyles.text}`}>{weatherData}</h3>
                </div>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={16} /></div>
                <div><p className="text-[8px] text-slate-400 font-black uppercase">Market</p><h3 className="text-sm font-black text-slate-800">E {isRegionalScope ? '1.1M' : '4.2M'}</h3></div>
            </div>
        </div>
        <div className="lg:col-span-1">{renderRoleSpecificWidget()}</div>
      </div>

      <div className="bg-[#1B4D3E] p-4 rounded-2xl text-white shadow-lg relative overflow-hidden shrink-0">
          <div className="relative z-10 flex items-start gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10"><Sparkles className="text-[#FBBF24]" size={18}/></div>
              <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-green-300 mb-1">AI Synthesis</h3>
                  {isAnalyzing ? (
                      <div className="flex items-center gap-2 py-1"><Loader2 size={12} className="animate-spin text-green-300"/><span className="text-[9px] font-bold text-green-100/60 uppercase">Analyzing National Feed...</span></div>
                  ) : (
                      <div className="text-[11px] font-medium leading-relaxed prose prose-invert line-clamp-3" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                  )}
              </div>
          </div>
          <Activity size={180} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Aggregated Production Index</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData.filter(d => !isRegionalScope || d.region === user?.region)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={8} tick={{fill: '#94a3b8', fontWeight: '900'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={8} tick={{fill: '#94a3b8', fontWeight: '900'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '9px'}} />
                <Bar dataKey="value" fill="#1B4D3E" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Price Volatility</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={8} tick={{fill: '#94a3b8', fontWeight: '900'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={8} tick={{fill: '#94a3b8', fontWeight: '900'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '9px'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: '900', paddingTop: '5px'}} />
                    <Line type="monotone" dataKey="maize" stroke="#1B4D3E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="beans" stroke="#FBBF24" strokeWidth={2} dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {showLiveChat && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
              <div className="bg-white w-full sm:w-[320px] h-[400px] shadow-2xl rounded-t-3xl sm:rounded-2xl flex flex-col pointer-events-auto border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-[#1B4D3E] p-3 flex justify-between items-center text-white shrink-0">
                      <div className="flex items-center gap-2"><Bot size={20} className="text-[#FBBF24]" /><div><h3 className="font-bold text-xs">Ministry Support</h3><p className="text-[8px] text-green-200">Authorized Agent</p></div></div>
                      <button onClick={() => setShowLiveChat(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={16}/></button>
                  </div>
                  <div className="flex-1 bg-slate-50 overflow-y-auto p-3 space-y-2 no-scrollbar">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs shadow-sm ${msg.role === 'user' ? 'bg-[#1B4D3E] text-white' : 'bg-white text-slate-700'}`}>{msg.text}</div></div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Ask a question..." className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-1.5 text-xs font-medium" />
                      <button onClick={handleSendChat} className="p-2 bg-[#1B4D3E] text-white rounded-xl shadow-lg"><Send size={16} /></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
