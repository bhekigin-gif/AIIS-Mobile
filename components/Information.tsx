
import React, { useState, useEffect } from 'react';
import { 
  Building2, Phone, MapPin, Megaphone, AlertTriangle, 
  FileText, Download, ChevronRight, ArrowLeft, Upload, X, 
  Plus, Loader2, Sparkles, Smartphone, ShieldCheck, 
  Globe, Zap, Tractor, ShoppingCart
} from 'lucide-react';
import { Get_System_Metadata } from '../services/adminDataService';

type InfoTab = 'about' | 'contacts' | 'announcements' | 'early_warning';

interface DocumentItem {
    id: string;
    name: string;
    category: string;
    date: string;
}

const Information: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InfoTab>('about');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [targetCategory, setTargetCategory] = useState('');

  useEffect(() => {
    const loadMetadata = async () => {
        const data = await Get_System_Metadata();
        setSystemMetadata(data);
        if (data && data.announcementCategories.length > 0) {
            setTargetCategory(data.announcementCategories[0]);
        }
    };
    loadMetadata();
  }, []);

  const announcementCategories = systemMetadata?.announcementCategories.filter((c: string) => !c.toLowerCase().includes('alert') && !c.toLowerCase().includes('outbreak')) || [];
  const warningCategories = systemMetadata?.announcementCategories.filter((c: string) => c.toLowerCase().includes('alert') || c.toLowerCase().includes('outbreak')) || [];

  const initialDocs: DocumentItem[] = [
     ...Array(6).fill(0).map((_,i) => ({ id: `gen-${i}`, name: `General_Notice_${i+1}.pdf`, category: 'General Announcements', date: '2024-03-01' })),
     ...Array(2).fill(0).map((_,i) => ({ id: `ten-${i}`, name: `Tender_Doc_2024_03.pdf`, category: 'Tenders & Vacancies', date: '2024-03-05' })),
     ...Array(3).fill(0).map((_,i) => ({ id: `wea-${i}`, name: `Rainfall_Alert_Hhohho.pdf`, category: 'Weather Alerts', date: '2024-03-12' })),
     ...Array(1).fill(0).map((_,i) => ({ id: `pes-${i}`, name: `FAW_Outbreak_Report_Lubombo.pdf`, category: 'Pest & Disease Outbreaks', date: '2024-02-25' })),
  ];
  
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocs);

  const getFileUrl = (fileName: string) => `https://www.agrinfosystems.gov.sz/assets/uploads${encodeURIComponent(fileName)}`;

  const handleUpload = () => {
    if (newFile) {
        const newDoc: DocumentItem = { id: `new-${Date.now()}`, name: newFile.name, category: targetCategory, date: new Date().toISOString().split('T')[0] };
        setDocuments([newDoc, ...documents]);
        setShowUploadModal(false);
        setNewFile(null);
    }
  };

  if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

  const renderAbout = () => (
    <div className="space-y-4 sm:space-y-8 animate-fade-in">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1B4D3E] rounded-2xl flex items-center justify-center text-[#FBBF24] shadow-lg">
                    <Smartphone size={32} />
                </div>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1B4D3E] tracking-tight leading-none">AIIS Mobile</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] mt-2">National Agricultural Nerve Center</p>
                </div>
            </div>
            
            <div className="space-y-6 sm:space-y-8 text-slate-600">
                <p className="text-base sm:text-lg leading-relaxed font-medium italic text-slate-500 border-l-4 border-[#FBBF24] pl-4 sm:pl-6">
                    A comprehensive digital ecosystem unifying the agricultural value chain in Eswatini.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[#1B4D3E]">
                            <Tractor size={20} />
                            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">Production GIS</h3>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-80">Empowering farmers with GIS mapping and operational logging for full batch traceability.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[#1B4D3E]">
                            <ShoppingCart size={20} />
                            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">Trade Hub</h3>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-80">Connecting vetted producers with institutional buyers and agro-processors nationally.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <Sparkles size={20} />
                            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">AI Expert</h3>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-80">Instant crop diagnosis and pathology advisory using computer vision and policy knowledge.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <ShieldCheck size={20} />
                            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">Oversight</h3>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-80">Ministry-level monitoring ensuring food security and certification compliance across all nodes.</p>
                    </div>
                </div>
            </div>
        </div>
        <Building2 size={240} className="absolute -bottom-10 -right-10 text-slate-50 pointer-events-none -z-0 opacity-40" />
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="space-y-6">
            <h3 className="text-base sm:text-lg font-black text-[#1B4D3E] flex items-center gap-3 uppercase tracking-tight">
            <MapPin className="text-emerald-600" size={20} /> Headquarters
            </h3>
            <div className="space-y-4">
                <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical</p>
                <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">Ministry of Agriculture Building<br />Sozisa & Mdada Street, Mbabane</p>
                </div>
                <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Postal</p>
                <p className="text-xs sm:text-sm text-slate-700 font-bold">P.O. Box 162, Mbabane, H100</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="space-y-6">
            <h3 className="text-base sm:text-lg font-black text-[#1B4D3E] flex items-center gap-3 uppercase tracking-tight">
            <Phone className="text-indigo-600" size={20} /> Contact
            </h3>
            <div className="space-y-4">
                <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Enquiries</p>
                <p className="text-lg text-[#1B4D3E] font-black tracking-tight">+268 2404 2731</p>
                </div>
                <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <a href="mailto:info@moa.gov.sz" className="text-indigo-600 font-black hover:underline text-sm sm:text-base">info@moa.gov.sz</a>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderAnnouncements = () => {
    if (selectedFolder) return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10 animate-fade-in max-w-4xl mx-auto">
        <button onClick={() => setSelectedFolder(null)} className="mb-6 text-[10px] font-black text-slate-400 hover:text-[#1B4D3E] flex items-center gap-2 uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Library
        </button>
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
            <Megaphone size={24} className="text-amber-600" />
            <div>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedFolder}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Official Repository Notices</p>
            </div>
        </div>
        <div className="space-y-2">
            {documents.filter(d => d.category === selectedFolder).map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={18} className="text-slate-300 shrink-0" />
                        <div className="overflow-hidden">
                            <p className="text-[11px] sm:text-xs font-black text-slate-700 truncate">{doc.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{doc.date}</p>
                        </div>
                    </div>
                    <a href={getFileUrl(doc.name)} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-emerald-600 bg-white rounded-xl shadow-sm border border-slate-50" download>
                        <Download size={16} />
                    </a>
                </div>
            ))}
        </div>
      </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {announcementCategories.map((c: string) => (
                <button key={c} onClick={() => setSelectedFolder(c)} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-amber-500/30 transition-all text-left group h-40 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Megaphone size={24} /></div>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                            {documents.filter(d => d.category === c).length} FILES
                        </span>
                    </div>
                    <h4 className="font-black text-slate-700 text-sm tracking-tight leading-tight">{c}</h4>
                </button>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-20">
      <div className="flex flex-col gap-6">
        <div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#1B4D3E] tracking-tight">Information Centre</h2>
            <div className="flex gap-4 sm:gap-8 mt-6 overflow-x-auto no-scrollbar pb-2 border-b border-slate-100">
                {(['about', 'contacts', 'announcements', 'early_warning'] as const).map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSelectedFolder(null); }} className={`pb-2 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-[#FBBF24] text-[#1B4D3E]' : 'border-transparent text-slate-400'}`}>
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="flex items-center justify-center gap-2 bg-[#1B4D3E] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all w-full sm:w-fit">
          <Upload size={14} /> Upload Doc
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'about' && renderAbout()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'early_warning' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {warningCategories.map((c: string) => (
                <button key={c} onClick={() => setSelectedFolder(c)} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-rose-500/30 transition-all text-left group h-40 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><AlertTriangle size={24} /></div>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{documents.filter(d => d.category === c).length} FILES</span>
                    </div>
                    <h4 className="font-black text-slate-700 text-sm tracking-tight leading-tight">{c}</h4>
                </button>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="bg-[#1B4D3E] p-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black uppercase tracking-tight">Public Notice Upload</h3>
                        <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                            <select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none">
                                {systemMetadata?.announcementCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center relative group">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewFile(e.target.files?.[0] || null)}/>
                            {newFile ? (
                                <div className="space-y-2"><FileText className="mx-auto text-emerald-500" size={32}/><p className="text-[11px] font-black text-slate-800">{newFile.name}</p></div>
                            ) : (
                                <div className="space-y-2"><Plus className="mx-auto text-slate-300" size={32}/><p className="text-[10px] text-slate-400 font-bold uppercase">Attach PDF</p></div>
                            )}
                        </div>
                        <button onClick={handleUpload} disabled={!newFile} className="w-full bg-[#1B4D3E] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50 transition-all active:scale-95">Publish to Feed</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Information;
