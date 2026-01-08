
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { 
  Activity, TrendingUp, AlertTriangle, ChevronRight, 
  Bot, Loader2, Cloud, CloudRain, CloudLightning, Sun, MapPin,
  Sprout, Landmark, Info, Sparkles, Send, X, MessageSquareText,
  Headset, PhoneCall
} from 'lucide-react';
import { getDashboardAnalysis, getWeatherAlert, chatWithAgriBot, getWeatherForecast } from '../services/geminiService';
import { ChatMessage, UserProfile, UserRole } from '../types';

interface DashboardProps {
    user: UserProfile | null;
    onRegister?: () => void;
    onOpenAdvisor?: () => void;
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

const Dashboard: React.FC<DashboardProps> = ({ user, onRegister, onOpenAdvisor }) => {
  const [weatherData, setWeatherData] = useState<string>("Analyzing current weather data...");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { role: 'model', text: 'Sanibonani! I am your Ministry Support assistant. How can I help with regional data?', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isExtension = user?.role === UserRole.Extension;
  const isRegionalScope = isExtension || (user?.role === UserRole.Government && user?.region && user?.region !== 'All');

  const weatherStyles = useMemo(() => {
    const low = weatherData.toLowerCase();
    if (low.includes('severe') || low.includes('danger') || low.includes('flood')) {
      return { icon: <CloudLightning size={20} />, bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-600' };
    }
    if (low.includes('warning') || low.includes('alert') || low.includes('heat')) {
      return { icon: <AlertTriangle size={20} />, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-800', iconBg: 'bg-amber-100 text-amber-600' };
    }
    if (low.includes('rain') || low.includes('thunder')) {
      return { icon: <CloudRain size={20} />, bg: 'bg-blue-50 border-blue-100', text: 'text-blue-800', iconBg: 'bg-blue-100 text-blue-600' };
    }
    return { icon: <Sun size={20} />, bg: 'bg-emerald-50/50 border-emerald-100', text: 'text-emerald-900', iconBg: 'bg-emerald-100 text-emerald-600' };
  }, [weatherData]);

  useEffect(() => {
    const handleGenerateInsight = async () => {
      setIsAnalyzing(true);
      const weather = await getWeatherAlert();
      setWeatherData(weather);
      const filteredProduction = productionData.filter(d => !isRegionalScope || d.region === user?.region);
      const analysis = await getDashboardAnalysis(filteredProduction, priceTrends, weather);
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    };
    handleGenerateInsight();
  }, [user, isRegionalScope]);

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

  return (
    <div className="flex flex-col gap-4 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B4D3E] tracking-tight">
            {user ? `Sawubona, ${user.name.split(' ')[0]}` : "National Agriculture Gateway"}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Kingdom of Eswatini • National Feed</p>
        </div>
        <div className="flex gap-2">
            {isExtension && (
              <button onClick={onOpenAdvisor} className="flex items-center gap-2 px-3 py-1.5 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-900 transition-all group">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <Headset size={14} className="text-[#FBBF24] group-hover:rotate-12 transition-transform" />
                Live Inbox
              </button>
            )}
            <button onClick={() => setShowLiveChat(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-[#1B4D3E] transition-all">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Ministry Support
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isExtension ? (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-amber-100 transition-all" onClick={onOpenAdvisor}>
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform"><PhoneCall size={20} className="animate-bounce" /></div>
                <div>
                    <p className="text-[9px] text-amber-800 font-black uppercase">Advisory Queue</p>
                    <h3 className="text-lg font-black text-amber-900">2 <span className="text-[10px] font-bold">Waiting</span></h3>
                </div>
            </div>
        ) : (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-[#1B4D3E] rounded-xl"><Activity size={20} /></div>
                <div><p className="text-[9px] text-slate-400 font-black uppercase">Yield Aggregate</p><h3 className="text-lg font-black text-slate-800">{isRegionalScope ? '4.2k' : '18.8k'} <span className="text-[10px] text-slate-300">Tons</span></h3></div>
            </div>
        )}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${weatherStyles.bg}`}>
          <div className={`p-3 rounded-xl ${weatherStyles.iconBg}`}>{weatherStyles.icon}</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] text-slate-400 font-black uppercase">Met Alert</p>
            <h3 className={`text-[10px] font-black truncate leading-tight mt-0.5 ${weatherStyles.text}`}>{weatherData}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={20} /></div>
          <div><p className="text-[9px] text-slate-400 font-black uppercase">Market Value</p><h3 className="text-lg font-black text-slate-800">E {isRegionalScope ? '1.1M' : '4.2M'}</h3></div>
        </div>
        <div className="bg-slate-900 p-4 rounded-2xl shadow-lg flex items-center justify-between text-white overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-emerald-400">Node Status</p>
            <h4 className="text-sm font-black mt-0.5 uppercase tracking-tight">{user?.region || 'National'} Registry</h4>
          </div>
          <Landmark size={48} className="absolute -bottom-2 -right-2 text-white/5" />
        </div>
      </div>

      <div className="bg-[#1B4D3E] p-5 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-8">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md group-hover:rotate-12 transition-transform"><Sparkles className="text-[#FBBF24]" size={24}/></div>
          <div className="flex-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-300 mb-2">National AI Synthesis</h3>
            {isAnalyzing ? (
              <div className="flex items-center gap-3 py-1"><Loader2 size={16} className="animate-spin text-green-300"/><span className="text-[11px] font-bold text-green-100/60 uppercase">Processing Node Feed...</span></div>
            ) : (
              <div className="text-xs sm:text-sm font-medium leading-relaxed prose prose-invert line-clamp-3 opacity-90" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
            )}
          </div>
        </div>
        <Activity size={200} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm h-[300px] flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Production Index</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData.filter(d => !isRegionalScope || d.region === user?.region)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}} />
                <Bar dataKey="value" fill="#1B4D3E" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm h-[300px] flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Commodity Trends</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8', fontWeight: '800'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}}/>
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '10px'}} />
                <Line type="monotone" dataKey="maize" stroke="#1B4D3E" strokeWidth={2.5} dot={{fill: '#1B4D3E', r: 3}} />
                <Line type="monotone" dataKey="beans" stroke="#FBBF24" strokeWidth={2.5} dot={{fill: '#FBBF24', r: 3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showLiveChat && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
              <div className="bg-white w-full sm:w-[320px] h-[450px] shadow-2xl rounded-t-[2rem] sm:rounded-2xl flex flex-col pointer-events-auto border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-[#1B4D3E] p-4 flex justify-between items-center text-white shrink-0">
                      <div className="flex items-center gap-3"><Bot size={20} className="text-[#FBBF24]" /><div><h3 className="font-bold text-xs uppercase tracking-tight">Ministry Chat</h3><p className="text-[8px] text-green-300 font-bold uppercase">Authorized Node</p></div></div>
                      <button onClick={() => setShowLiveChat(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={20}/></button>
                  </div>
                  <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-3 no-scrollbar">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] shadow-sm ${msg.role === 'user' ? 'bg-[#1B4D3E] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none font-medium'}`}>{msg.text}</div></div>
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-2"><div className="bg-white px-3 py-1.5 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2"><Loader2 size={10} className="animate-spin text-[#1B4D3E]"/><span className="text-[9px] font-black text-slate-300 uppercase">Thinking...</span></div></div>
                      )}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Ask anything..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                      <button onClick={handleSendChat} className="p-2.5 bg-[#1B4D3E] text-white rounded-xl shadow-lg"><Send size={16} /></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
