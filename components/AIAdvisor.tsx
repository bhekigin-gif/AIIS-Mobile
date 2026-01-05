
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Sparkles, MapPin, Paperclip, X, 
  Image as ImageIcon, Film, Mic, Languages, Camera, ScanText, 
  HeartPulse, Bug, Sprout, Globe, ShieldCheck, AlertCircle, 
  ChevronRight, Stethoscope, Beaker
} from 'lucide-react';
import { chatWithAgriBot } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sanibonani! I am your AIIS Agricultural Expert. I can help you diagnose crop diseases, find local suppliers, or explain national policies. How can I assist you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{file: File, preview: string, type: 'image' | 'video'} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ss-SZ'>('en-US');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedFile]);

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
          } else {
              alert("Please select a valid image or video file.");
          }
      }
  };

  const clearFile = () => {
      if (selectedFile) { URL.revokeObjectURL(selectedFile.preview); setSelectedFile(null); }
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setInput(prev => prev + (prev ? ' ' : '') + event.results[0][0].transcript);
    recognition.start();
  };

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || input;
    if (!messageText.trim() && !selectedFile) return;

    let attachmentData = null;
    if (selectedFile) {
        try {
            attachmentData = await fileToGenerativePart(selectedFile.file);
        } catch (error) {
            alert("Failed to process file.");
            return;
        }
    }

    let processedInput = messageText;
    if (selectedFile?.type === 'image' && !messageText.trim()) {
        processedInput = "I need an urgent [CROP HEALTH REPORT] for this image. Diagnose pests, diseases, or deficiencies and recommend Eswatini-safe remediation.";
    }

    const userMsg: ChatMessage = { 
        role: 'user', 
        text: messageText || (selectedFile?.type === 'image' ? "Sent an image for crop diagnosis" : "Sent a video"), 
        timestamp: new Date(),
        attachment: attachmentData ? { mimeType: attachmentData.mimeType, data: attachmentData.data } : undefined
    };

    const uiMsg = { ...userMsg, uiPreview: selectedFile?.preview, uiType: selectedFile?.type };

    setMessages(prev => [...prev, uiMsg]);
    setInput('');
    clearFile();
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp }));
    const response = await chatWithAgriBot(processedInput, attachmentData, history);
    
    const botMsg: ChatMessage = { 
        role: 'model', 
        text: response.text, 
        timestamp: new Date(),
        groundingMetadata: response.groundingMetadata
    };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const renderDiagnosticReport = (text: string) => {
    if (!text.includes('[CROP HEALTH REPORT]')) return <p className="whitespace-pre-wrap font-medium">{text}</p>;

    const sections = text.split('\n- ').filter(s => s.trim() !== '');
    const title = sections[0].replace('[CROP HEALTH REPORT]', '').trim();
    
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm"><Stethoscope size={20}/></div>
                <div><h4 className="font-black text-slate-800 text-sm leading-tight uppercase tracking-tight">Diagnostic Analysis</h4><p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Eswatini AIIS Pathology Node</p></div>
            </div>
            <div className="space-y-3">
                {sections.slice(1).map((section, idx) => {
                    const [label, content] = section.split(': ');
                    const isStatus = label.includes('STATUS');
                    const isCritical = content?.includes('Critical') || content?.includes('Warning');
                    
                    return (
                        <div key={idx} className={`p-3 rounded-xl border ${isStatus ? (isCritical ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100') : 'bg-slate-50 border-slate-100'}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                            <p className={`text-xs font-bold ${isStatus ? (isCritical ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-700'}`}>{content || 'Inconclusive'}</p>
                        </div>
                    );
                })}
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                <Beaker size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-800 font-medium leading-relaxed italic">Note: AI diagnosis is for advisory purposes. Verify chemical applications with your Regional RDA Extension Officer.</p>
            </div>
        </div>
    );
  };

  const renderSources = (metadata: any) => {
      if (!metadata?.groundingChunks) return null;
      const sources = metadata.groundingChunks.flatMap((c: any) => c.maps ? [c.maps] : (c.web ? [c.web] : []));
      if (sources.length === 0) return null;
      return (
          <div className="mt-3 pt-3 border-t border-slate-200/50">
              <p className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1 uppercase tracking-widest">
                  <MapPin size={10} className="text-[#FBBF24]" /> Grounding Sources:
              </p>
              <div className="flex flex-wrap gap-2">
                  {sources.map((source: any, i: number) => (
                      <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 border border-slate-100 text-[#1B4D3E] px-2.5 py-1.5 rounded-lg hover:bg-white transition-all flex items-center gap-1.5 shadow-sm max-w-[200px] truncate font-bold" title={source.title}>
                          <Globe size={10} /> {source.title || "Reference Link"}
                      </a>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 no-scrollbar">
        {messages.length === 1 && (
            <div className="space-y-4 animate-fade-in pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">AI Integrated Pathology</p>
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-left group">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Bug size={24}/></div>
                        <div><h4 className="font-black text-slate-800 text-sm">Pathogen Diagnosis</h4><p className="text-[10px] text-slate-400 font-medium">Take a photo to identify pests/blight.</p></div>
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left group">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><HeartPulse size={24}/></div>
                        <div><h4 className="font-black text-slate-800 text-sm">Soil & Nutrient Check</h4><p className="text-[10px] text-slate-400 font-medium">Analyze leaf discoloration for health.</p></div>
                    </button>
                </div>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-[#1B4D3E] text-[#FBBF24]'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-700 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>
                {(msg as any).uiPreview && (
                    <div className="mb-3 mt-1 rounded-xl overflow-hidden border-2 border-white/20 shadow-md relative group">
                        <img src={(msg as any).uiPreview} alt="Diagnostic input" className="max-w-full max-h-72 object-cover" />
                        {isLoading && idx === messages.length - 1 && (
                            <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-scan-line"></div>
                            </div>
                        )}
                    </div>
                )}
                {renderDiagnosticReport(msg.text)}
                {msg.role === 'model' && renderSources(msg.groundingMetadata)}
                <span className={`text-[9px] mt-2 block font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#1B4D3E] text-[#FBBF24] rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"><Bot size={16} /></div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-[#1B4D3E]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pathology Processing...</span>
                    </div>
                    <div className="h-1 w-32 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-progress-indefinite"></div>
                    </div>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 pb-10 sm:pb-6 relative z-10">
        {selectedFile && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between w-fit animate-slide-up shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-inner border border-emerald-100 relative">
                        {selectedFile.type === 'image' ? <img src={selectedFile.preview} className="w-full h-full object-cover" /> : <Film size={20} className="text-emerald-500" />}
                        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                    </div>
                    <div>
                        <p className="text-xs font-black text-emerald-900 truncate max-w-[150px]">{selectedFile.file.name}</p>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Diagnostic Sample Ready</p>
                    </div>
                </div>
                <button onClick={clearFile} className="p-1.5 hover:bg-emerald-100 rounded-full text-emerald-700 ml-3 transition-colors"><X size={18} /></button>
            </div>
        )}

        <div className="flex gap-2 relative items-end">
            <div className="flex flex-col gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
                <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button onClick={() => cameraInputRef.current?.click()} className="p-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all shadow-sm border border-slate-100"><Camera size={20} /></button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><Paperclip size={20} /></button>
                </div>
            </div>
            <div className="flex-1 relative">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Describe crop symptoms..." rows={1} className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600 focus:bg-white transition-all outline-none text-sm text-slate-900 font-bold resize-none min-h-[52px]" />
                <div className="absolute right-2 bottom-2 flex gap-1 items-center">
                    <button onClick={handleVoiceInput} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-300 hover:text-slate-600'}`}><Mic size={18} /></button>
                    <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !selectedFile)} className="p-2.5 bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 disabled:opacity-30 shadow-lg transition-all active:scale-95"><Send size={18} /></button>
                </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress-indefinite { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-progress-indefinite { animation: progress-indefinite 1.5s infinite linear; }
        .animate-scan-line { animation: scan-line 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default AIAdvisor;
