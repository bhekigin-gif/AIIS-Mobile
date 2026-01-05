
import React, { useState, useEffect } from 'react';
import { 
  FileText, ChevronRight, BookOpen, Download, Users, Eye, ArrowLeft, Upload, X, Plus, Search, 
  ImageIcon, Book, FileCog, RefreshCw, CheckCircle, FileType, Filter, Calendar, Sprout, 
  Briefcase, Layers, Utensils, Info, HelpCircle, Copy, Clapperboard, PlayCircle, ShieldCheck, 
  Tractor, ShoppingCart, Table, Check, XCircle, MousePointerClick, Factory, Truck, Recycle, 
  Store, Package, ShoppingBag, BookOpenCheck, Lightbulb, Sparkles, Wand2, Loader2, MessageSquare, 
  SearchCode, BarChart3, Fingerprint, Activity, Building2, UserCheck, ShieldAlert, Link, TrendingUp,
  HardHat, ClipboardList, Target, Zap, LayoutDashboard, Map as MapIcon, Globe
} from 'lucide-react';
import { ActorType } from '../types';
import { generateCustomUserStory } from '../services/geminiService';
import { Get_System_Metadata } from '../services/adminDataService';

interface DocumentItem {
  id: number | string;
  name: string;
  category: string;
  date?: string;
}

interface PersonaWorkflow {
    id: string;
    role: string;
    actor: ActorType;
    personaName: string;
    title: string;
    objective: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    linkage: string;
    steps: {title: string, tool: string, description: string}[];
}

const CapacityBuilding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'matrix' | 'user_stories'>('user_stories');
  const [activeDocCategory, setActiveDocCategory] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  // System Metadata State
  const [systemMetadata, setSystemMetadata] = useState<any>(null);
  const [documentCategories, setDocumentCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
        const data = await Get_System_Metadata();
        setSystemMetadata(data);
        setDocumentCategories(data.knowledgeCategories || []);
    };
    loadMetadata();
  }, []);

  const [targetCategory, setTargetCategory] = useState('');

  useEffect(() => {
    if (documentCategories.length > 0) {
        setTargetCategory(documentCategories[0].id);
    }
  }, [documentCategories]);

  const [storyRole, setStoryRole] = useState<ActorType>(ActorType.Farmer);
  const [storyGoal, setStoryGoal] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);

  // SEQUENCE: Supervisor -> Extension -> Supplier -> Farmer -> Processor -> Transporter -> Buyer -> Retailer -> Restaurant -> Consumer -> Waste Manager -> Agro Trader
  const personaWorkflows: PersonaWorkflow[] = [
      {
          id: 'w1',
          role: 'Supervisor / Monitor',
          actor: ActorType.Gov,
          personaName: 'Sibongile Dlamini',
          title: 'National Surveillance',
          objective: 'Ensure national grain reserves meet food security targets for the Hhohho region.',
          description: 'Ministry oversight using data to adjust national agricultural policy and trade permits.',
          icon: <ShieldCheck className="text-slate-600" />,
          color: 'slate',
          linkage: 'Regulator for all nodes; dependent on data from the entire registry.',
          steps: [
              { title: 'KPI Analysis', tool: 'National Dashboard', description: 'Monitors the "Aggregated Production" charts to compare current yields against national targets.' },
              { title: 'Registry Vetting', tool: 'Admin: Registry', description: 'Reviews and approves institutional and individual actor registrations for legal compliance.' },
              { title: 'Provenance Audit', tool: 'Traceability Portal', description: 'Inputs refined chronology IDs into the search to verify if sales match regional production logs.' }
          ]
      },
      {
          id: 'w2',
          role: 'Extension / Partner',
          actor: ActorType.Extension,
          personaName: 'Ethan Khumalo',
          title: 'Regional Advisory',
          objective: 'Onboard 50 smallholders in Siphofaneni into the digital commercial ecosystem.',
          description: 'Providing on-the-ground support and advisory services to primary producers.',
          icon: <UserCheck className="text-violet-600" />,
          color: 'violet',
          linkage: 'Key intermediary between Government Policy and Farmer implementation.',
          steps: [
              { title: 'GIS Verification', tool: 'Production GIS', description: 'Visits farm plots to inspect and verify farmer-traced field boundaries for official status.' },
              { title: 'Resource Sync', tool: 'Knowledge Library', description: 'Downloads Gross Margin templates to distribute as technical guides to cooperatives.' },
              { title: 'Diagnosis Assist', tool: 'AI Expert Advisor', description: 'Analyzes crop photos from the field to provide instant pest and disease identifications.' }
          ]
      },
      {
          id: 'w3',
          role: 'Input Supplier',
          actor: ActorType.Supplier,
          personaName: 'Sipho Mamba',
          title: 'Catalogue Provisioning',
          objective: 'Distribute certified hybrid seeds to the Shiselweni region for the upcoming season.',
          description: 'Registering essential farming inputs in the master registry to support regional production.',
          icon: <Package className="text-amber-600" />,
          color: 'amber',
          linkage: 'Primary feeder node for Farmers; regulated by Ministry Supervisors.',
          steps: [
              { title: 'Catalogue Entry', tool: 'Admin: Master Catalogue', description: 'Registers seeds and fertilizers with full ISO standards and technical datasheets.' },
              { title: 'Demand Analysis', tool: 'National Dashboard', description: 'Monitors regional production cycles to forecast which areas require higher input stock.' },
              { title: 'Tech Support', tool: 'AI Expert Advisor', description: 'Inputs product specs into the AI knowledge base to help farmers with application queries.' }
          ]
      },
      {
          id: 'w4',
          role: 'Farmer / Producer',
          actor: ActorType.Farmer,
          personaName: 'Thandiwe Shongwe',
          title: 'Primary Trade Generation',
          objective: 'Harvest and list 10 Tons of Grade A Maize for institutional procurement.',
          description: 'Managing production lifecycles to generate high-value, traceable harvest batches.',
          icon: <Tractor className="text-emerald-600" />,
          color: 'emerald',
          linkage: 'Relies on Suppliers for seeds and AFROGEO for seasonal harvest labor.',
          steps: [
              { title: 'Unit Setup', tool: 'Production GIS', description: 'Traces her field boundaries on the map, generating a unique non-PII unit hash (U-XXXX).' },
              { title: 'Cycle Logging', tool: 'Production: Ops Logging', description: 'Logs every spray task to a Production Cycle (PRC), building a verifiable cost-of-production record.' },
              { title: 'Hub Publishing', tool: 'Marketplace: My Shop', description: 'Harvests produce, generating a refined chronology ID (SZ-XXXX-...) that ends the Production Cycle.' }
          ]
      },
      {
          id: 'w5',
          role: 'Agro-Processor',
          actor: ActorType.Processor,
          personaName: 'Phindile Fakudze',
          title: 'Value-Addition Lineage',
          objective: 'Produce 5,000 units of peanut butter with full farm-to-shelf provenance.',
          description: 'Transforming raw materials into retail goods while maintaining the digital thread.',
          icon: <Factory className="text-indigo-600" />,
          color: 'indigo',
          linkage: 'Depends on verified Farmers for raw supply and Transporters for bulk logistics.',
          steps: [
              { title: 'Raw Sourcing', tool: 'Marketplace Hub', description: 'Procures bulk nuts from verified farmers by validating their Harvest IDs (HRV-XXXX).' },
              { title: 'Process Link', tool: 'Production: Lifecycle', description: 'Starts a Processing Cycle (VAP), linking raw batch costs to the new value-added chronology.' },
              { title: 'Retail Distro', tool: 'Marketplace: Listings', description: 'Publishes finished jars with an app-generated Finished ID (FIN-XXXX) for market transparency.' }
          ]
      },
      {
          id: 'w6',
          role: 'Logistics / Transporter',
          actor: ActorType.Transporter,
          personaName: 'Musa Simelane',
          title: 'Secure Asset Movement',
          objective: 'Transport 100 crates of tomatoes from Ezulwini to Manzini supermarkets safely.',
          description: 'Ensuring the safe movement of agricultural goods across the value chain.',
          icon: <Truck className="text-cyan-600" />,
          color: 'cyan',
          linkage: 'Essential service provider linking Farmers and Processors to Buyers.',
          steps: [
              { title: 'Route Transit', tool: 'Production: Logistics', description: 'Scans the refined chronology IDs at pickup to initiate the transit cycle on the map.' },
              { title: 'Compliance Check', tool: 'Admin: Registry', description: 'Uploads vehicle safety and health certificates for Ministry certification.' },
              { title: 'Proof of Delivery', tool: 'Marketplace: Orders', description: 'Signs off the delivery digitally at the buyer depot, releasing escrow payments.' }
          ]
      },
      {
          id: 'w7',
          role: 'Market / Buyer',
          actor: ActorType.Buyer,
          personaName: 'Bongani Masuku',
          title: 'Institutional Sourcing',
          objective: 'Procure 500 Tons of Maize for a national supermarket chain within budget.',
          description: 'Sourcing reliable, safe commodities for supermarkets or national reserves.',
          icon: <ShoppingCart className="text-rose-600" />,
          color: 'rose',
          linkage: 'Primary liquidity provider; dependent on verified food safety standards.',
          steps: [
              { title: 'Availability Search', tool: 'Marketplace Hub', description: 'Queries national stocks for bulk availability within specific regional radii.' },
              { title: 'Safety Audit', tool: 'Traceability Portal', description: 'Decodes chronology IDs (SZ-...) to verify whether items are field-harvested or processed.' },
              { title: 'Contracting', tool: 'Marketplace: Orders', description: 'Issues Purchase Orders directly to verified cooperatives through the system.' }
          ]
      },
      {
          id: 'w8',
          role: 'Produce Retailer',
          actor: ActorType.Retailer,
          personaName: 'Zanele Gamedze',
          title: 'Shelf Safety Management',
          objective: 'Maintain a 100% "Certified Fresh" rating for her produce department.',
          description: 'Managing fresh produce stock with digital tools to ensure quality and safety.',
          icon: <Store className="text-blue-600" />,
          color: 'blue',
          linkage: 'Frontline to Consumer; sources from Processors and Aggregators.',
          steps: [
              { title: 'Inventory Sync', tool: 'Dashboard: My Shop', description: 'Tracks incoming batches and logs cold storage conditions for shelf-life assurance.' },
              { title: 'Expiry Monitoring', tool: 'Dashboard: Alerts', description: 'Uses operational alerts to rotate stock based on original chronology timestamps.' },
              { title: 'Fresh Insights', tool: 'AI Expert Advisor', description: 'Queries for optimal storage temperatures to reduce post-harvest leafy green loss.' }
          ]
      },
      {
          id: 'w9',
          role: 'Restaurant / Caterer',
          actor: ActorType.Restaurant,
          personaName: 'Chef Lindiwe',
          title: 'Traceable Sourcing',
          objective: 'Source unique "Nguni Beef" and organic kale for a weekend gourmet event.',
          description: 'Providing farm-to-table experiences by sourcing verified local ingredients.',
          icon: <Utensils className="text-orange-600" />,
          color: 'orange',
          linkage: 'High-value buyer; reliant on Retailers and Farmers for fresh daily supply.',
          steps: [
              { title: 'Niche Sourcing', tool: 'Marketplace Search', description: 'Filters for "Organic" and "Livestock" to find registered Nguni cattle producers.' },
              { title: 'Menu Verification', tool: 'Marketplace: Trace', description: 'Generates a customer-facing QR code for menus that links to the verified source unit.' },
              { title: 'Waste Logging', tool: 'Production: Ops Logging', description: 'Logs organic waste output to be picked up by verified Waste Managers.' }
          ]
      },
      {
          id: 'w10',
          role: 'Consumer',
          actor: ActorType.Consumer,
          personaName: 'Nomvula Vilakati',
          title: 'Food Safety Intelligence',
          objective: 'Purchase the healthiest, safest vegetables for her family using national data.',
          description: 'Empowered to make informed decisions through national transparency.',
          icon: <ShoppingBag className="text-pink-600" />,
          color: 'pink',
          linkage: 'The final destination; rewards honest producers with informed purchases.',
          steps: [
              { title: 'Scan Verification', tool: 'Marketplace: Scan', description: 'Scans cabbage packs to view the originating unit and cycle type (Production vs Processed).' },
              { title: 'Nutrition Support', tool: 'AI Expert Advisor', description: 'Asks for nutritional profiles or recipes based on specific local produce.' },
              { title: 'Price Monitoring', tool: 'Dashboard: Public View', description: 'Checks regional price trends to find the best value for seasonal fruits.' }
          ]
      },
      {
          id: 'w11',
          role: 'Waste Manager',
          actor: ActorType.WasteManager,
          personaName: 'Mandla Ngwenya',
          title: 'Circular Trade Ops',
          objective: 'Collect 10 Tons of organic waste to produce high-grade compost for resale.',
          description: 'Managing agricultural waste to create sustainable organic inputs.',
          icon: <Recycle className="text-stone-600" />,
          color: 'stone',
          linkage: 'Closes the loop between Retailers/Restaurants and primary Farmers.',
          steps: [
              { title: 'Route Optimizer', tool: 'Production GIS', description: 'Views the locations of units that have logged available waste for collection.' },
              { title: 'Transformation Log', tool: 'Production: Ops Logging', description: 'Records composting cycles (temp/duration) to certify organic fertilizer.' },
              { title: 'Input Listing', tool: 'Marketplace: My Shop', description: 'Publishes finished compost batches back to the hub with new chronology IDs.' }
          ]
      },
      {
          id: 'w12',
          role: 'Agro Trader',
          actor: ActorType.AgroTrader,
          personaName: 'AFROGEO Hub',
          title: 'Value Chain Integration',
          objective: 'Coordinate a 1,000 Ton Sugar export contract by providing labor and trade linkages.',
          description: 'Essential service providing Information, Labor (Skilled/Unskilled), and Trade Linkages to all nodes.',
          icon: <Briefcase className="text-teal-600" />,
          color: 'teal',
          linkage: 'The central nervous system linking all 12 nodes through the AIIS system.',
          steps: [
              { title: 'Labor Provisioning', tool: 'Production: Unit Linkage', description: 'Assigns specialized harvest crews to farmers via the system linkage tool.' },
              { title: 'Trade Linkage', tool: 'Marketplace Hub', description: 'Aggregates multiple smallholder harvests into one master trade lot for export.' },
              { title: 'Market Intel', tool: 'AI Expert Advisor', description: 'Synthesizes pricing and demand data across all nodes for Ministry reports.' }
          ]
      }
  ];

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const allRawFiles = [
        "2022 Baby Veg GM Current Situation.xlsx", "2022_Field Crops.xlsx", "2022_Gross Margin Analysis_Baby Corn.xlsx", 
        "2022_Gross Margin Analysis_French Beans.xlsx", "2022_Gross Margin Analysis_Sugar Snaps.xlsx", 
        "2022_Gross Margin Analysis_Garden Peas.xlsx", "2024_Livestock gross margins.xlsx",
        "FIELD CROPS 2023 Pdf.pdf", "2025 Baby Veg Gross Margins.xlsx", "Livestock Vaccination Chart.pdf",
        "Soil Health Management Manual.pdf", "Eswatini food composition table.pdf", "The business plan_SHOW.pdf",
        "Crop Rotation Basics.pdf", "Mpisi training center poster.pdf"
      ];
    const getCategoryForFile = (filename: string): string => {
        const lower = filename.toLowerCase();
        if (lower.includes('gross margin')) return 'gross_margin';
        if (lower.includes('rotation')) return 'crop_rotation';
        if (lower.includes('poster')) return 'posters';
        if (lower.includes('business')) return 'business';
        if (lower.includes('soil') || lower.includes('seed')) return 'soil_seeds';
        if (lower.includes('recipe') || lower.includes('food')) return 'nutrition';
        if (lower.includes('livestock') || lower.includes('cattle')) return 'livestock';
        if (lower.includes('vegetable') || lower.includes('crop') || lower.includes('maize')) return 'crops';
        return 'general';
    };
    return allRawFiles.map((name, index) => ({
      id: `doc-${index}`,
      name: name,
      category: getCategoryForFile(name),
      date: '2024-03-01'
    }));
  });

  const getFileUrl = (fileName: string) => `https://www.agrinfosystems.gov.sz/assets/uploads${encodeURIComponent(fileName)}`;
  const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || '';

  const userRoleMatrix = [
      { component: "National Dashboard", guest: "Summary", farmer: "My Stats", gov: "Full Analytics", extension: "Regional", market: "Price Trends" },
      { component: "Production: Farm Setup", guest: "No Access", farmer: "GPS Mapping", gov: "National Map", extension: "Verification", market: "No Access" },
      { component: "Production: Operations", guest: "No Access", farmer: "Logging", gov: "Audit", extension: "Monitoring", market: "Availability" },
      { component: "Marketplace Trading", guest: "View Prices", farmer: "Sell", gov: "Regulate", extension: "Verify", market: "Buy/Source" },
      { component: "Knowledge AI", guest: "General", farmer: "Advisory", gov: "Reports", extension: "Full Access", market: "Standards" },
      { component: "Affiliation Control", guest: "No Access", farmer: "Self-Link", gov: "Manage Registry", extension: "Verification", market: "No Access" }
  ];

  const handleGenerateStory = async () => {
      if (!storyGoal.trim()) return;
      setIsGeneratingStory(true);
      setGeneratedStory(null);
      try {
          const story = await generateCustomUserStory(storyRole, storyGoal);
          setGeneratedStory(story);
      } catch (e) {
          alert("Error generating story. Please try again.");
      } finally {
          setIsGeneratingStory(false);
      }
  };

  const handleApplyPresetWorkflow = (workflow: PersonaWorkflow) => {
      setStoryRole(workflow.actor);
      setStoryGoal(`I am ${workflow.personaName}, a ${workflow.role} using the AIIS platform to achieve ${workflow.title}. Explain my technical journey through the app tools: ${workflow.steps.map(s => s.tool).join(', ')}. Detail how I interact with other nodes in the chain.`);
      setGeneratedStory(null);
      document.getElementById('ai-narrative')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpload = () => {
    if (newFile) {
        const newDoc: DocumentItem = {
            id: `doc-${Date.now()}`,
            name: newFile.name,
            category: targetCategory,
            date: new Date().toISOString().split('T')[0]
        };
        setDocuments(prev => [newDoc, ...prev]);
        setShowUploadModal(false);
        setNewFile(null);
        alert(`Successfully uploaded knowledge resource: ${newFile.name}`);
    }
  };

  const colorMap: Record<string, { bg: string, text: string, border: string, dot: string }> = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-100' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-100' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-100' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', dot: 'bg-pink-100' },
      stone: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-100', dot: 'bg-stone-100' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', dot: 'bg-cyan-100' },
      slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', dot: 'bg-slate-100' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-100' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', dot: 'bg-teal-100' },
  };

  if (!systemMetadata) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#1B4D3E]"/></div>;

  const renderMatrix = () => (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-[#1B4D3E] flex items-center gap-2 uppercase tracking-tight">
                  <ShieldCheck size={28} className="text-emerald-600"/> Institutional Access Matrix
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Standardized permissions for national agricultural coordination.</p>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#1B4D3E] text-white uppercase font-black text-[10px] tracking-[0.2em]">
                      <tr>
                          <th className="p-6 sticky left-0 bg-[#1B4D3E] z-10">Module Cluster</th>
                          <th className="p-6 text-center border-l border-white/10">Guest</th>
                          <th className="p-6 text-center border-l border-white/10">Farmer</th>
                          <th className="p-6 text-center border-l border-white/10">Ministry</th>
                          <th className="p-6 text-center border-l border-white/10">Extension</th>
                          <th className="p-6 text-center border-l border-white/10">Buyer</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {userRoleMatrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-6 font-bold text-slate-700 bg-slate-50/30 sticky left-0 border-r border-slate-100">{row.component}</td>
                              <td className="p-6 text-center text-slate-400 font-medium italic">{row.guest}</td>
                              <td className="p-6 text-center text-emerald-700 font-black">{row.farmer}</td>
                              <td className="p-6 text-center text-[#1B4D3E] font-black underline decoration-emerald-200 decoration-4 underline-offset-4">{row.gov}</td>
                              <td className="p-6 text-center text-amber-700 font-bold">{row.extension}</td>
                              <td className="p-6 text-center text-indigo-700 font-bold">{row.market}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderUserStories = () => (
      <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h3 className="font-black text-4xl text-slate-800 tracking-tight">Value Chain Technical Journeys</h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  Discover how personified actors utilize AIIS tools to synchronize the Eswatini value chain. Each story illustrates the interdependent nodes from field to fork.
              </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {personaWorkflows.map(workflow => {
                  const colors = colorMap[workflow.color] || colorMap.slate;
                  return (
                  <div 
                    key={workflow.id} 
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all group hover:-translate-y-1"
                  >
                      <div className={`p-8 ${colors.bg} flex items-center gap-5 border-b ${colors.border} transition-colors group-hover:bg-opacity-80`}>
                          <div className="p-4 rounded-3xl bg-white shadow-xl group-hover:scale-110 transition-transform">{workflow.icon}</div>
                          <div>
                              <h4 className="font-black text-slate-800 text-lg leading-tight">{workflow.personaName}</h4>
                              <p className={`text-[10px] font-black ${colors.text} uppercase tracking-widest opacity-70 mt-0.5`}>{workflow.role}</p>
                          </div>
                      </div>
                      
                      <div className="p-8 flex-1 space-y-8">
                          <div className="space-y-3">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Objective</p>
                              <p className="text-sm text-slate-600 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-4">"{workflow.objective}"</p>
                              <div className={`flex items-start gap-2 p-3 rounded-2xl ${colors.bg} border ${colors.border} bg-opacity-40`}>
                                  {/* Fixed: Use imported 'Link' instead of undefined 'LinkIcon' */}
                                  <Link size={14} className={`${colors.text} shrink-0 mt-0.5`} />
                                  <p className="text-[10px] font-bold text-slate-500 leading-tight uppercase tracking-tight">
                                      <span className={`${colors.text} font-black`}>Node Linkage:</span> {workflow.linkage}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="space-y-6">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Steps</p>
                              {workflow.steps.map((step, i) => (
                                  <div key={i} className="relative flex gap-5 items-start">
                                      <div className={`w-8 h-8 rounded-2xl ${colors.dot} flex-shrink-0 flex items-center justify-center text-xs font-black ${colors.text} z-10 shadow-sm`}>
                                          {i + 1}
                                      </div>
                                      {i < workflow.steps.length - 1 && (
                                          <div className={`absolute left-4 top-10 w-0.5 h-full ${colors.dot} bg-opacity-30 -z-0`}></div>
                                      )}
                                      <div className="pt-1">
                                          <div className="flex items-center gap-2 mb-1">
                                              <h5 className="font-black text-xs text-slate-800 uppercase tracking-tight">{step.title}</h5>
                                              <span className="text-[8px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-400 font-black uppercase border border-slate-200">{step.tool}</span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.description}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                          <button 
                            onClick={() => handleApplyPresetWorkflow(workflow)}
                            className={`w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest hover:border-${workflow.color}-400 hover:text-${colors.text.split('-')[1]}-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95`}
                          >
                              Synthesize Narrative <Sparkles size={16} className={`${colors.text}`} />
                          </button>
                      </div>
                  </div>
              )})}
          </div>

          <div id="ai-narrative" className="bg-[#1B4D3E] rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-green-900/40 animate-slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 relative z-10">
                  <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-4">
                          <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-white/10"><Wand2 className="text-[#FBBF24]" size={28}/></div>
                          <h3 className="font-black text-3xl tracking-tight">AI Trade Journey Simulation</h3>
                          <p className="text-green-100 font-medium leading-relaxed opacity-80">
                              Gemini will expand the chosen persona's story into a detailed operational simulation, showing how every digital action contributes to the national value chain.
                          </p>
                      </div>
                      
                      <div className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-green-300 uppercase tracking-widest ml-1">Trade Action Context</label>
                              <select 
                                value={storyRole}
                                onChange={(e) => setStoryRole(e.target.value as ActorType)}
                                className="w-full p-5 bg-white/5 border border-white/20 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all cursor-pointer appearance-none hover:bg-white/10"
                              >
                                  {systemMetadata.actorTypes.map((role: string) => <option key={role} value={role} className="text-slate-800">{role}</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-green-300 uppercase tracking-widest ml-1">Simulated Objective</label>
                              <textarea 
                                value={storyGoal}
                                onChange={(e) => setStoryGoal(e.target.value)}
                                placeholder="Describe a specific objective (e.g., I am AFROGEO and I need to provide 50 skilled harvesters to the Big Bend region)..."
                                className="w-full h-32 p-5 bg-white/5 border border-white/20 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-yellow-400/20 outline-none resize-none transition-all placeholder:text-green-700/50"
                              />
                          </div>
                          <button 
                            onClick={handleGenerateStory}
                            disabled={isGeneratingStory || !storyGoal.trim()}
                            className="w-full bg-[#FBBF24] text-[#1B4D3E] py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95 group"
                          >
                              {isGeneratingStory ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                              {isGeneratingStory ? 'Synthesizing Step-by-Step...' : 'Synthesize Workflow'}
                          </button>
                      </div>
                  </div>

                  <div className="lg:col-span-3">
                      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 h-full min-h-[500px] flex flex-col p-10 shadow-inner relative">
                          {generatedStory ? (
                              <div className="animate-fade-in prose prose-invert prose-sm max-w-none">
                                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
                                     <div className="flex items-center gap-4">
                                         <div className="p-3 bg-yellow-400/20 text-yellow-400 rounded-2xl shadow-lg border border-yellow-400/30"><Activity size={24}/></div>
                                         <div>
                                             <h4 className="font-black text-white text-xl m-0 leading-none">Simulation Log</h4>
                                             <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">Cross-Module Integration Enabled</p>
                                         </div>
                                     </div>
                                     <button onClick={() => setGeneratedStory(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X size={24}/></button>
                                  </div>
                                  <div dangerouslySetInnerHTML={{ __html: generatedStory }} className="text-green-50/90 leading-relaxed space-y-6 text-sm" />
                              </div>
                          ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10">
                                  <div className="relative">
                                      <div className="w-28 h-28 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl animate-pulse">
                                          <Fingerprint size={56} className="text-green-500 opacity-40"/>
                                      </div>
                                      <div className="absolute -top-4 -right-4 bg-[#FBBF24] p-3 rounded-2xl text-[#1B4D3E] shadow-xl rotate-12">
                                          <TrendingUp size={24} />
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <p className="font-black text-2xl text-green-300">Ready for Synthesis</p>
                                      <p className="text-xs max-w-xs mx-auto text-green-100/40 font-medium leading-relaxed">Select a persona card above or input a custom trade objective to begin the technical journey visualization with refined chronology IDs (SZ-XXXX-...).</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              <Sparkles size={500} className="absolute -bottom-60 -left-40 text-white/5 pointer-events-none z-0 rotate-12" />
          </div>
      </div>
  );

  const renderDocs = () => {
    if (activeDocCategory) {
        const categoryInfo = documentCategories.find((c: any) => c.id === activeDocCategory);
        const filteredDocs = documents.filter(doc => {
            if (doc.category !== activeDocCategory) return false;
            if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterFileType) {
                const ext = getFileExtension(doc.name);
                if (ext !== filterFileType.toLowerCase()) return false;
            }
            return true;
        });

        return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in max-w-5xl mx-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setActiveDocCategory(null); setSearchTerm(''); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><ArrowLeft size={20} /></button>
                        <h4 className="font-black text-[#1B4D3E] uppercase text-sm tracking-tight">{categoryInfo?.name}</h4>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search technical resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1B4D3E]/5 outline-none font-bold text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
                            <FileType size={16} className="text-slate-400"/>
                            <select value={filterFileType} onChange={(e) => setFilterFileType(e.target.value)} className="text-sm font-bold outline-none bg-transparent text-slate-700">
                                <option value="">All Formats</option>
                                <option value="pdf">PDF</option>
                                <option value="xlsx">Excel</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <tr><th className="p-6">Technical Resource</th><th className="p-6 text-center">Format</th><th className="p-6 text-center">Published</th><th className="p-6 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6 font-bold text-slate-700">{doc.name}</td>
                                    <td className="p-6 text-center"><span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{getFileExtension(doc.name)}</span></td>
                                    <td className="p-6 text-center text-slate-400 font-bold text-xs">{doc.date}</td>
                                    <td className="p-6 text-right">
                                        <a href={getFileUrl(doc.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-black text-xs uppercase tracking-widest transition-all"><Download size={16}/> Download</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in max-w-6xl mx-auto">
            {documentCategories.map((cat: any) => (
                <button 
                    key={cat.id}
                    onClick={() => setActiveDocCategory(cat.id)}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all text-left group flex flex-col justify-between h-48"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-slate-50 rounded-[1.5rem] group-hover:bg-emerald-50 transition-colors">
                            {cat.id === 'gross_margin' ? <BookOpen size={20} className="text-green-600" /> : <Layers size={20} className="text-slate-400" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-all">{documents.filter(d => d.category === cat.id).length} Files</span>
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 group-hover:text-emerald-900 transition-colors text-lg tracking-tight">{cat.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2 group-hover:text-emerald-500 transition-colors">
                            Explore Repository <ChevronRight size={12}/>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-8 gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-[#1B4D3E] tracking-tight">Institutional Capacity</h2>
          <p className="text-slate-500 font-medium text-lg">Role-based frameworks and agricultural knowledge bank.</p>
        </div>
        <div className="flex gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab('user_stories')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'user_stories' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>User Stories</button>
            <button onClick={() => setActiveTab('documents')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Library</button>
            <button onClick={() => setActiveTab('matrix')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-[#1B4D3E] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Permissions</button>
        </div>
      </div>
      
      <div className="min-h-[700px]">
          {activeTab === 'documents' && renderDocs()}
          {activeTab === 'matrix' && renderMatrix()}
          {activeTab === 'user_stories' && renderUserStories()}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 flex flex-col gap-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-[#1B4D3E] flex items-center gap-3"><Upload size={24} className="text-emerald-500"/> Knowledge Upload</h3>
                    <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Classification</label>
                        <select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all">
                            {documentCategories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                         {newFile ? (
                             <div className="space-y-3">
                                <CheckCircle className="mx-auto text-emerald-500" size={40}/>
                                <p className="text-[#1B4D3E] font-black text-sm">{newFile.name}</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="text-slate-300" size={32}/>
                                </div>
                                <div>
                                    <p className="font-black text-slate-700">Attach Technical File</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">PDF or XLSX supported for indexing.</p>
                                </div>
                             </div>
                         )}
                    </div>
                    <button onClick={handleUpload} disabled={!newFile} className="w-full bg-[#1B4D3E] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-900/20 hover:bg-[#143d31] disabled:opacity-50 transition-all">Publish to National Repository</button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Upload Trigger */}
      <button 
        onClick={() => setShowUploadModal(true)}
        className="fixed bottom-10 left-10 p-5 bg-[#1B4D3E] text-white rounded-[1.5rem] shadow-2xl hover:scale-110 transition-all z-40 border border-white/10"
      >
        <Upload size={24}/>
      </button>
    </div>
  );
};

export default CapacityBuilding;
