
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Activity, Droplets, Sun, TrendingUp, AlertTriangle, RefreshCw, ChevronRight, Globe, MessageSquare, Mic, Send, X, Mail, User, Bot, Loader2, Cloud, CloudRain, CloudLightning, ChevronDown, ChevronUp, MapPin, Thermometer, UserCheck, Shield, ShoppingBag, Sprout, ClipboardList, Landmark } from 'lucide-react';
import { getDashboardAnalysis, getWeatherAlert, chatWithAgriBot, sendChatLogsToAdmin, getWeatherForecast } from '../services/geminiService';
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
  const [forecast, setForecast] = useState<any>(null);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { role: 'model', text: 'Sanibonani! You are connected to the Ministry of Agriculture Support Line. How can I assist with your regional data today?', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRegionalScope = user?.role === UserRole.Extension || (user?.role === UserRole.Government && user?.region && user?.region !== 'All');

  const handleGenerateInsight = async () => {
    const weather = await getWeatherAlert();
    setWeatherData(weather);

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
  }, []);

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
          <div className="bg-gradient-to-br from-[#1B4D3E] to-[#2C6E58] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-2">Institutional Access</h4>
                  <p className="text-sm text-green-100 mb-4 max-w-xs">Verify your identity to access restricted production logs and trade oversight tools.</p>
                  <button onClick={onRegister} className="bg-[#FBBF24] text-[#1B4D3E] px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-400 shadow-md">Join National Registry</button>
              </div>
              <Globe size={120} className="absolute -bottom-10 -right-10 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
      );

      if (user.role === UserRole.Farmer) {
          return (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Context</p><h4 className="text-lg font-bold text-[#1B4D3E]">{user.name}</h4></div>
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Sprout size={20}/></div>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Active Plots</span><span className="font-bold text-slate-700">Verified</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Current Yield Est.</span><span className="font-bold text-green-600">+12%</span></div>
                  </div>
              </div>
          );
      }

      return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                  <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Scope</p><h4 className="text-lg font-bold text-blue-800">{user.region === 'All' ? 'National Overview' : `${user.region} Region`}</h4></div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Landmark size={20}/></div>
              </div>
              <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Regional Actors</span><span className="font-bold text-slate-700">Live Sync</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Pending Actions</span><span className="font-bold text-orange-600">Review Required</span></div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-extrabold text-[#1B4D3E]">{user ? `Sawubona, ${user.name.split(' ')[0]}` : "National Gateway"}</h2>
              {user && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === UserRole.Government ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{user.region} Authority</span>}
          </div>
          <p className="text-slate-500 text-sm font-medium">{user ? `${user.title} • ${user.region} Coordination` : "Consolidated Eswatini Agricultural Intelligence"}</p>
        </div>
        <button onClick={() => setShowLiveChat(true)} className="px-4 py-2 bg-white text-[#1B4D3E] border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:border-[#1B4D3E] transition-all">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>Ministry Support
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-green-50 text-[#1B4D3E] rounded-xl"><Activity size={24} /></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isRegionalScope ? `${user?.region} Yield` : 'National Yield'}</p><h3 className="text-xl font-bold text-slate-800">{isRegionalScope ? '4,200' : '18,800'} <span className="text-xs font-normal text-slate-400">Tonnes</span></h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="p-3 bg-yellow-50 text-[#FBBF24] rounded-xl"><Sun size={24} /></div>
                <div className="flex-1"><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meteorological Alert</p><h3 className="text-xs font-bold text-slate-800 leading-tight mt-1 line-clamp-2">{weatherData}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp size={24} /></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Market Valuation</p><h3 className="text-xl font-bold text-slate-800">E {isRegionalScope ? '1.1M' : '4.2M'}</h3></div>
            </div>
        </div>
        <div className="lg:col-span-1">{renderRoleSpecificWidget()}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-[#1B4D3E]">Aggregated Production</h3></div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData.filter(d => !isRegionalScope || d.region === user?.region)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#1B4D3E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-[#1B4D3E] mb-6">Price Volatility Index</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                    <Line type="monotone" dataKey="maize" stroke="#1B4D3E" strokeWidth={3} />
                    <Line type="monotone" dataKey="beans" stroke="#FBBF24" strokeWidth={3} />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {showLiveChat && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
              <div className="bg-white w-full sm:w-[380px] h-[500px] shadow-2xl rounded-t-3xl sm:rounded-3xl flex flex-col pointer-events-auto border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-[#1B4D3E] p-4 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3"><Bot size={24} className="text-[#FBBF24]" /><div><h3 className="font-bold text-sm">Ministry Line</h3><p className="text-[10px] text-green-200">Authorized Support</p></div></div>
                      <button onClick={() => setShowLiveChat(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#1B4D3E] text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>{msg.text}</div></div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Inquire about regional data..." className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-2 text-sm" />
                      <button onClick={handleSendChat} className="p-2 bg-[#1B4D3E] text-white rounded-2xl shadow-lg"><Send size={18} /></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
