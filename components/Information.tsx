import React, { useState } from 'react';
import { Building2, Phone, Mail, MapPin, Megaphone, AlertTriangle, FileText, Download, ChevronRight, ArrowLeft, Upload, X, Plus } from 'lucide-react';
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

  // System Metadata
  const systemMetadata = Get_System_Metadata();

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [targetCategory, setTargetCategory] = useState(systemMetadata.announcementCategories[0] || 'General Announcements');

  // Split categories for UI logic
  const announcementCategories = systemMetadata.announcementCategories.filter((c: string) => !c.toLowerCase().includes('alert') && !c.toLowerCase().includes('outbreak'));
  const warningCategories = systemMetadata.announcementCategories.filter((c: string) => c.toLowerCase().includes('alert') || c.toLowerCase().includes('outbreak'));

  // Mock Data generation
  const initialDocs: DocumentItem[] = [
     ...Array(6).fill(0).map((_,i) => ({ id: `gen-${i}`, name: `General_Notice_${i+1}.pdf`, category: 'General Announcements', date: '2023-10-10' })),
     ...Array(2).fill(0).map((_,i) => ({ id: `ten-${i}`, name: `Tender_Doc_${i+1}.pdf`, category: 'Tenders & Vacancies', date: '2023-11-05' })),
     ...Array(3).fill(0).map((_,i) => ({ id: `wea-${i}`, name: `Weather_Alert_${i+1}.pdf`, category: 'Weather Alerts', date: '2023-11-12' })),
     ...Array(1).fill(0).map((_,i) => ({ id: `pes-${i}`, name: `Pest_Outbreak_Report.pdf`, category: 'Pest & Disease Outbreaks', date: '2023-10-25' })),
  ];
  
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocs);

  const getFileUrl = (fileName: string) => {
    return `https://www.agrinfosystems.gov.sz/assets/uploads${encodeURIComponent(fileName)}`;
  };

  const handleUpload = () => {
    if (newFile) {
        const newDoc: DocumentItem = {
            id: `new-${Date.now()}`,
            name: newFile.name,
            category: targetCategory,
            date: new Date().toISOString().split('T')[0]
        };
        setDocuments([newDoc, ...documents]);
        setShowUploadModal(false);
        setNewFile(null);
    }
  };

  const renderAbout = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#1B4D3E] rounded-full flex items-center justify-center text-[#FBBF24]">
            <Building2 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1B4D3E]">Ministry of Agriculture</h2>
            <p className="text-slate-500">Kingdom of Eswatini</p>
          </div>
        </div>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
          <p className="text-lg leading-relaxed">
            The Ministry of Agriculture is dedicated to ensuring food security, sustainable agricultural development, 
            and the commercialization of the sector in Eswatini. We strive to provide efficient services to farmers, 
            processors, and all stakeholders in the value chain.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-100">
              <h3 className="font-bold text-[#1B4D3E] mb-2">Our Vision</h3>
              <p className="text-sm">
                A vibrant, commercialized, and sustainable agricultural sector that ensures national food security and economic growth.
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
              <h3 className="font-bold text-amber-700 mb-2">Our Mission</h3>
              <p className="text-sm">
                To promote agricultural productivity and diversification through sustainable management of natural resources and effective support services.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">Our Mandate</h3>
              <p className="text-sm">
                To formulate policy and legislation, regulate the sector, and provide extension services to enhance agricultural output.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-[#1B4D3E] mb-6 flex items-center gap-2">
          <MapPin className="text-[#FBBF24]" /> Headquarters
        </h3>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Physical Address</p>
              <p className="text-slate-600">Ministry of Agriculture Building</p>
              <p className="text-slate-600">Corner of Sozisa and Mdada Street</p>
              <p className="text-slate-600">Mbabane, Eswatini</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Postal Address</p>
              <p className="text-slate-600">P.O. Box 162</p>
              <p className="text-slate-600">Mbabane, H100</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-[#1B4D3E] mb-6 flex items-center gap-2">
          <Phone className="text-[#FBBF24]" /> Contact Channels
        </h3>
        <div className="space-y-6">
           <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">General Enquiries</p>
              <p className="text-lg text-[#1B4D3E] font-mono font-bold">+268 2404 2731</p>
              <p className="text-lg text-[#1B4D3E] font-mono font-bold">+268 2404 9800</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Email Support</p>
              <a href="mailto:info@moa.gov.sz" className="text-blue-600 hover:underline">info@moa.gov.sz</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsList = (title: string, color: string, icon: React.ReactNode) => {
     const filteredDocs = documents.filter(d => d.category === title);

     return (
     <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in">
        <button 
            onClick={() => setSelectedFolder(null)}
            className="mb-4 text-sm text-slate-500 hover:text-[#1B4D3E] flex items-center gap-1"
        >
            <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className={`p-3 bg-${color}-50 rounded-lg text-${color}-600`}>
                {icon}
            </div>
            <h4 className="text-lg font-bold text-slate-800">
                {title}
            </h4>
        </div>
        
        {/* File List */}
        <div className="space-y-2">
            {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                                <p className="text-xs text-slate-400">Date: {doc.date} • PDF</p>
                            </div>
                        </div>
                        <a 
                            href={getFileUrl(doc.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-[#1B4D3E] hover:bg-green-50 rounded-full transition-colors"
                            download
                            title="Download Document"
                        >
                            <Download size={18} />
                        </a>
                    </div>
                )) : (
                    <div className="p-4 text-center text-slate-400 text-sm">No documents uploaded yet.</div>
                )}
        </div>
    </div>
  )};

  const renderAnnouncements = () => {
    if (selectedFolder) return renderDocumentsList(selectedFolder, 'orange', <Megaphone size={20} />);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {announcementCategories.map((c: string) => (
                <button 
                    key={c}
                    onClick={() => setSelectedFolder(c)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-500/30 transition-all text-left group"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors text-orange-600">
                            <Megaphone size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full group-hover:bg-white">
                            {documents.filter(d => d.category === c).length}
                        </span>
                    </div>
                    <h4 className="font-bold text-slate-700 group-hover:text-orange-700 mb-1">{c}</h4>
                    <p className="text-xs text-slate-400">View Notices <ChevronRight size={10} className="inline ml-1" /></p>
                </button>
            ))}
        </div>
    );
  };

  const renderEarlyWarning = () => {
    if (selectedFolder) return renderDocumentsList(selectedFolder, 'red', <AlertTriangle size={20} />);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {warningCategories.map((c: string) => (
                <button 
                    key={c}
                    onClick={() => setSelectedFolder(c)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-red-500/30 transition-all text-left group"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors text-red-600">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full group-hover:bg-white">
                             {documents.filter(d => d.category === c).length}
                        </span>
                    </div>
                    <h4 className="font-bold text-slate-700 group-hover:text-red-700 mb-1">{c}</h4>
                    <p className="text-xs text-slate-400">View Alerts <ChevronRight size={10} className="inline ml-1" /></p>
                </button>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
        <div>
            <h2 className="text-2xl font-bold text-[#1B4D3E]">Information Centre</h2>
            <div className="flex gap-6 mt-6 overflow-x-auto">
            <button 
                onClick={() => { setActiveTab('about'); setSelectedFolder(null); }}
                className={`pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'about' ? 'border-[#FBBF24] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                About Us
            </button>
            <button 
                onClick={() => { setActiveTab('contacts'); setSelectedFolder(null); }}
                className={`pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'contacts' ? 'border-[#FBBF24] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Contacts
            </button>
            <button 
                onClick={() => { setActiveTab('announcements'); setSelectedFolder(null); }}
                className={`pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'announcements' ? 'border-[#FBBF24] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Announcements
            </button>
            <button 
                onClick={() => { setActiveTab('early_warning'); setSelectedFolder(null); }}
                className={`pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'early_warning' ? 'border-[#FBBF24] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Early Warning
            </button>
            </div>
        </div>
        <div>
             <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-[#1B4D3E] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-[#143d31] transition-colors"
             >
                <Upload size={14} /> Upload Document
             </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'about' && renderAbout()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'early_warning' && renderEarlyWarning()}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#1B4D3E] flex items-center gap-2">
                            <Upload size={20} /> Upload Public Notice
                        </h3>
                        <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Category</label>
                            <select 
                                value={targetCategory}
                                onChange={(e) => setTargetCategory(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#1B4D3E] outline-none"
                            >
                                {systemMetadata.announcementCategories.map((c: string) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select File</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                                />
                                {newFile ? (
                                    <div className="text-[#1B4D3E] font-bold text-sm flex items-center justify-center gap-2">
                                        <FileText size={16}/> {newFile.name}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm">
                                        <Plus size={24} className="mx-auto mb-2"/>
                                        <span className="font-bold">Click to Browse</span> or drag file here
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleUpload}
                            disabled={!newFile}
                            className="w-full bg-[#1B4D3E] text-white py-3 rounded-lg font-bold hover:bg-[#143d31] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg"
                        >
                            Publish Document
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Information;
