
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Sparkles, MapPin, Paperclip, X, 
  Image as ImageIcon, Film, Mic, Languages, Camera, ScanText, 
  HeartPulse, Bug, Sprout, Globe, ShieldCheck, AlertCircle, 
  ChevronRight, Stethoscope, Beaker, Headset, UserCheck, 
  MessageSquareShare, PhoneCall, Zap, ClipboardList, Activity
} from 'lucide-react';
import { chatWithAgriBot } from '../services/geminiService';
import { ChatMessage, UserRole, ActorType, UserProfile } from '../types';

interface AIAdvisorProps {
    currentUser: UserProfile | null;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sanibonani! I am your AIIS Agricultural Expert. I can help you diagnose crop diseases, find local suppliers, or explain national policies. How can I assist you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{file: File, preview: string, type: 'image' | 'video'} | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Live Support Handover State
  const [liveMode, setLiveMode] = useState<'ai' | 'requesting' | 'extension'>('ai');
  const [connectedOfficer, setConnectedOfficer] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<{id: string, name: string, region: string, problemSummary?: string[]}[]>([]);
  const [isOfficerOnline, setIsOfficerOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isExtension = currentUser?.role === UserRole.Extension;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedFile, liveMode, incomingRequests]);

  // Simulation: Extension Officers see "Requests" from their region
  useEffect(() => {
    if (isExtension && liveMode === 'ai' && isOfficerOnline) {
        const timer = setTimeout(() => {
            setIncomingRequests([{ 
              id: 'REQ-01', 
              name: 'Musa Dlamini', 
              region: currentUser.region || 'Manzini',
              problemSummary: ['Suspected Maize Chlorotic Mottle Virus', 'Location: Sidvokodvo Unit 4', 'Crop Age: 6 Weeks']
            }]);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [isExtension, liveMode, isOfficerOnline]);

  const handleRequestExpert = () => {
    setLiveMode('requesting');
    setMessages(prev => [...prev, {
        role: 'model',
        text: `[SYSTEM] Synchronizing your regional GIS data with the National Extension Node for ${currentUser?.region || 'National'} coverage. An officer will be with you shortly.`,
        timestamp: new Date()
    }]);

    // Simulate officer pickup
    setTimeout(() => {
        setLiveMode('extension');
        setConnectedOfficer('Officer Ethan Khumalo');
        setMessages(prev => [...prev, {
            role: 'extension',
            text: 'Sawubona! This is Officer Khumalo from your Regional RDA. I see you are inquiring about pest control. How can I help with your specific plot?',
            timestamp: new Date(),
            senderName: 'Officer Ethan Khumalo'
        }]);
    }, 4000);
  };

  const handleAcceptRequest = (reqId: string) => {
    setLiveMode('extension');
    setConnectedOfficer(currentUser?.name || 'Extension Officer');
    setIncomingRequests([]);
    setMessages(prev => [...prev, {
        role: 'extension',
        text: `Officer ${currentUser?.name} from ${currentUser?.region} Regional Hub has joined the secure node.`,
        timestamp: new Date(),
        senderName: currentUser?.name
    }]);
  };

  const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({ mimeType: file.type, data: base64Data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          if (isImage || isVideo) {
              const previewUrl = URL.createObjectURL(file);
              setSelectedFile({ file, preview: previewUrl, type: isImage ? 'image' : 'video' });
          }
      }
  };

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || input;
    if (!messageText.trim() && !selectedFile) return;

    const userMsg: ChatMessage = { 
        role: 'user', 
        text: messageText || (selectedFile?.type === 'image' ? "Diagnostic input" : "Video input"), 
        timestamp: new Date(),
        senderName: currentUser?.name
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // If connected to human extension, skip AI call
    if (liveMode === 'extension') {
        setTimeout(() => {
            if (!isExtension) {
                // Mock extension response if farmer sent message
                setMessages(prev => [...prev, {
                    role: 'extension',
                    text: 'Understood. I am cross-referencing your GIS unit Soil History from the National Registry now.',
                    timestamp: new Date(),
                    senderName: connectedOfficer || 'Officer'
                }]);
            }
        }, 1500);
        return;
    }

    setIsLoading(true);
    let attachmentData = null;
    if (selectedFile) {
        try { attachmentData = await fileToGenerativePart(selectedFile.file); } catch (e) {}
    }
    
    const history = messages.filter(m => m.role !== 'extension').map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp }));
    const response = await chatWithAgriBot(messageText, attachmentData, history as any);
    
    setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date(), groundingMetadata: response.groundingMetadata }]);
    setIsLoading(false);
    setSelectedFile(null);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* Dynamic Header for Support Status */}
      <div className={`px-4 py-2 flex items-center justify-between border-b shrink-0 ${liveMode === 'extension' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${liveMode === 'extension' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {liveMode === 'extension' ? `Connected: ${connectedOfficer}` : 'AI Intelligence Active'}
              </span>
          </div>
          <div className="flex items-center gap-2">
            {isExtension && (
              <button 
                onClick={() => setIsOfficerOnline(!isOfficerOnline)}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${isOfficerOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
              >
                {isOfficerOnline ? 'Online' : 'Offline'}
              </button>
            )}
            {(!isExtension && liveMode === 'ai') && (
                <button 
                  onClick={handleRequestExpert}
                  className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:border-blue-400 transition-all"
                >
                    <Headset size={12} className="text-blue-500"/> Connect Extension
                </button>
            )}
          </div>
      </div>

      {/* Extension Officer Task Panel */}
      {isExtension && incomingRequests.length > 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-100 animate-slide-up shrink-0 shadow-inner">
              <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><PhoneCall size={18} className="animate-pulse"/></div>
                          <div>
                              <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Active Advisory Request</p>
                              <p className="text-xs font-bold text-amber-700">{incomingRequests[0].name} • {incomingRequests[0].region}</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => handleAcceptRequest(incomingRequests[0].id)}
                        className="px-6 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 shadow-lg active:scale-95 transition-all"
                      >
                          Accept Advisory
                      </button>
                  </div>
                  {incomingRequests[0].problemSummary && (
                    <div className="p-3 bg-white/60 rounded-xl border border-amber-200/50 space-y-1">
                        <p className="text-[8px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> AI Context Summary:</p>
                        {incomingRequests[0].problemSummary.map((s, i) => (
                          <p key={i} className="text-[10px] font-bold text-amber-700 flex items-center gap-2">
                             <div className="w-1 h-1 bg-amber-400 rounded-full"/> {s}
                          </p>
                        ))}
                    </div>
                  )}
              </div>
          </div>
      )}

      {/* Session Controls for active live chat */}
      {isExtension && liveMode === 'extension' && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                  <Activity size={14} className="text-indigo-500 animate-pulse"/>
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Active Live Support Session</span>
              </div>
              <button 
                onClick={() => alert("Redirecting to Outreach Hub to log this session...")}
                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-700"
              >
                  <ClipboardList size={10}/> Log Outreach
              </button>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-700 text-white' : msg.role === 'extension' ? 'bg-blue-600 text-white' : 'bg-[#1B4D3E] text-[#FBBF24]'}`}>
                {msg.role === 'user' ? <User size={16} /> : msg.role === 'extension' ? <UserCheck size={16}/> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-700 text-white rounded-tr-none' : msg.role === 'extension' ? 'bg-blue-100 text-blue-900 border border-blue-200 rounded-tl-none font-medium' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>
                {msg.senderName && <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-50">{msg.senderName}</p>}
                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                <span className={`text-[9px] mt-2 block font-black uppercase tracking-widest opacity-40`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#1B4D3E] text-[#FBBF24] rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm"><Bot size={16} /></div>
                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-[#1B4D3E]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase">Consulting National Nodes...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 pb-10 sm:pb-6 relative z-10">
        <div className="flex gap-2 relative items-end">
            <div className="flex flex-col gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100"><Paperclip size={20} /></button>
            </div>
            <div className="flex-1 relative">
                <textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                  placeholder={liveMode === 'extension' ? "Type advisory to farmer..." : "Ask the AIIS Expert..."} 
                  rows={1} 
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-bold resize-none min-h-[52px]" 
                />
                <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !selectedFile)} className="absolute right-2 bottom-2 p-2.5 bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 disabled:opacity-30 shadow-lg"><Send size={18} /></button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
