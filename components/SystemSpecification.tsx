import React from 'react';
import { 
  ShieldCheck, FileText, Layers, Lock, RefreshCw, Globe, 
  Terminal, Database, HardDrive, Cpu, Search, Activity,
  CheckCircle2, AlertCircle, Bookmark, Archive, Zap,
  Settings, Briefcase, Users, Scale, Server, DownloadCloud,
  FileCode, ClipboardCheck
} from 'lucide-react';

const SystemSpecification: React.FC = () => {
  const standards = [
    {
      id: '29148',
      standard: 'ISO/IEC/IEEE 29148',
      focus: 'Requirements Engineering',
      status: 'Compliant',
      details: 'Formalizes the Stakeholder Requirements (SyRS) for national agricultural nodes. Implements unique "Identity Pins" for farmers and institutional "Chronology IDs" for batch traceability.'
    },
    {
      id: '25010',
      standard: 'ISO/IEC 25010',
      focus: 'System Quality Model',
      status: 'Compliant',
      details: 'Focuses on Functional Suitability (Market Linkages) and Portability. The CSV/JSON state restoration engine ensures system modularity and device independence.'
    },
    {
      id: '27001',
      standard: 'ISO/IEC 27001',
      focus: 'Information Security',
      status: 'Compliant',
      details: 'Implements Role-Based Access Control (RBAC). Data at rest is persisted in encrypted local IndexedDB nodes with restricted institutional visibility.'
    },
    {
      id: '20000',
      standard: 'ISO/IEC 20000-1',
      focus: 'Service Management',
      status: 'Compliant',
      details: 'System continuity is managed via the 10-minute background Synchronization Engine, providing high availability and disaster recovery (RPO < 10 mins).'
    }
  ];

  const functionalNodes = [
    { title: 'Identity Layer', icon: <Users size={20}/>, desc: 'Stakeholder persona mapping (ActorType/EntityType) using Gemini AI for ID extraction.' },
    { title: 'Spatial Layer', icon: <Globe size={20}/>, desc: 'GIS unit tracing and perimeter calculation (Ha) integrated with Google Maps SDK.' },
    { title: 'Economic Layer', icon: <Scale size={20}/>, desc: 'Synchronized trade hub with distance-matrix logistics fee calculation.' },
    { title: 'Intelligence Layer', icon: <Cpu size={20}/>, desc: 'Gemini 3 Pro/Flash diagnostic nodes for crop pathology and policy advisory.' }
  ];

  const handleDownloadFullSpec = () => {
    const docContent = `
================================================================================
AGRICULTURE INTEGRATED INFORMATION SYSTEM (AIIS) - MOBILE NODE v4.0
SYSTEM SPECIFICATION & COMPLIANCE DOCUMENT
Compiled for Ministry of Agriculture, Kingdom of Eswatini
================================================================================

1. INTRODUCTION (ISO/IEC/IEEE 29148:2018)
-----------------------------------------
The AIIS platform is a coordinated digital ecosystem designed to unify the 
agricultural value chain. It provides tools for GIS land mapping, operational 
logging, and national marketplace synchronization.

2. STAKEHOLDER REQUIREMENTS (SyRS)
----------------------------------
- Producer (Farmer): Must be able to trace field perimeters and log inputs.
- Extension Officer: Must provide technical advisory and verify producer perimeters.
- Ministry (Oversight): Must maintain the Master Catalogue and audit trade data.
- Buyer (Market): Must verify provenance (Chronology ID) of products.

3. SOFTWARE REQUIREMENTS (SRS)
------------------------------
- REQ-001: GIS perimeter tracing with Ha calculation (Google Maps SDK).
- REQ-002: Unique Chronology ID generation for harvest batches (ISO Traceability).
- REQ-003: Real-time logistics distance matrix calculation.
- REQ-004: Gemini AI diagnostic integration for pathology advisory.

4. QUALITY ATTRIBUTES (ISO/IEC 25010:2011)
------------------------------------------
- Functional Suitability: 100% coverage of national input standard registry.
- Performance Efficiency: Sub-200ms latency for local IndexedDB queries.
- Compatibility: Browser-independent PWA architecture.
- Maintainability: Component-based architecture with separated service layers.
- Portability: Full database export/restore via JSON bundles.

5. SYSTEMS ENGINEERING (ISO/IEC/IEEE 15288:2015)
------------------------------------------------
The system utilizes a "Local-First" architecture. Data lifecycle transitions 
from Local Buffer (IndexedDB) -> Verified Node -> National Archive.
Periodic 10-minute synchronization ensures high institutional availability.

6. INFORMATION SECURITY (ISO/IEC 27001:2022)
--------------------------------------------
- Access Control: RBAC (Role-Based Access Control) defined in types.ts.
- Encryption: TLS 1.3 for API calls (Maps/AI) and localized private storage.
- Integrity: Checksums for Chronology IDs to prevent ledger tampering.

7. SERVICE MANAGEMENT (ISO/IEC 20000-1:2018)
--------------------------------------------
- Service Availability: Background synchronization (Auto-Backup Node).
- Recovery Point Objective (RPO): < 600 seconds.
- Continuity: Institutional Archive Restoration Hub for blank-slate recovery.

8. TECHNICAL ARCHITECTURE
-------------------------
- Frontend: React 18.3.1 (Vite/TypeScript)
- Graphics: Tailwind CSS v3.4
- Geospatial: Google Maps API v3.55
- Intelligence: Google Gemini GenAI SDK
- Data: IndexedDB (Client-side Relational Mapping)

================================================================================
DOCUMENT END
Ministry of Agriculture, Mbabane, Kingdom of Eswatini
Timestamp: ${new Date().toLocaleString()}
================================================================================
    `;

    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AIIS_System_Specification_ISO_Compliant_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* Document Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#1B4D3E] text-[#FBBF24] rounded-2xl shadow-xl">
                <ShieldCheck size={32}/>
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#1B4D3E] tracking-tight uppercase">System Specification</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Institutional Compliance Document v4.0</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-2xl">
              This document outlines the technical architecture and requirements engineering of the AIIS Mobile platform, 
              adhering to international standards for software process, data security, and service continuity in the Kingdom of Eswatini.
            </p>
          </div>
          
          <button 
            onClick={handleDownloadFullSpec}
            className="px-8 py-5 bg-[#1B4D3E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 border-4 border-white/20"
          >
            <DownloadCloud size={20} className="text-[#FBBF24]"/>
            Export Full Specification (.txt)
          </button>
        </div>
        <FileText size={200} className="absolute -bottom-10 -right-10 text-slate-50 opacity-50" />
      </div>

      {/* ISO Compliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {standards.map((s) => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{s.standard}</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{s.focus}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-black uppercase border border-emerald-100">
                {s.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.details}</p>
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active Process Control</span>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Breakdown */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tight">System Engineering Lifecycle</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">ISO/IEC/IEEE 15288 Framework</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {functionalNodes.map((node, i) => (
              <div key={i} className="space-y-4 group">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-[#FBBF24] group-hover:text-[#1B4D3E] transition-all shadow-lg">
                  {node.icon}
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{node.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2 opacity-80">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="text-emerald-400" size={20}/>
              <h4 className="font-black text-sm uppercase tracking-widest">Institutional Continuity Logic (ISO 20000)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold uppercase tracking-widest">
              <div className="space-y-2">
                <p className="text-slate-500">Capture Frequency</p>
                <p className="text-emerald-400 text-lg font-black">10 Minutes</p>
              </div>
              <div className="space-y-2 border-l border-white/10 pl-6">
                <p className="text-slate-500">Node Restoration</p>
                <p className="text-emerald-400 text-lg font-black">JSON / CSV</p>
              </div>
              <div className="space-y-2 border-l border-white/10 pl-6">
                <p className="text-slate-500">Recovery Point (RPO)</p>
                <p className="text-emerald-400 text-lg font-black">&lt; 600 Sec</p>
              </div>
            </div>
          </div>
        </div>
        <Database size={400} className="absolute -bottom-40 -left-40 text-white/5 pointer-events-none rotate-12" />
      </div>

      {/* Standards Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardCheck size={24}/></div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">V-Model Alignment</h4>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Standardized mapping from Requirement Specification to Quality Validation via ISO 25010 metrics.</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileCode size={24}/></div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Software Processes</h4>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Lifecycle management adhering to ISO/IEC/IEEE 12207 for sustainable software evolution.</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Lock size={24}/></div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">National Security</h4>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Institutional data integrity controls mapping to ISO 27001 cybersecurity frameworks.</p>
            </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex flex-col items-center gap-4 text-center opacity-40">
        <Server size={24} className="text-[#1B4D3E]"/>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
          Integrated Systems Node • Ministry of Agriculture • Mbabane, Eswatini
        </p>
      </div>
    </div>
  );
};

export default SystemSpecification;