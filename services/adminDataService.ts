import { UserProfile, UserRole, ActorType, EntityType, Region, SalesProduct, IndicatorItem, CatalogueItem, ResourceType, TINKHUNDLA } from '../types';

// --- SYSTEM METADATA DEFAULTS ---
const INITIAL_METADATA = {
    regions: Object.values(Region).filter(r => r !== Region.All),
    actorTypes: Object.values(ActorType),
    entityTypes: Object.values(EntityType),
    resourceTypes: Object.values(ResourceType),
    commodityCategories: ['Maize', 'Legumes', 'Vegetables', 'Sugar', 'Livestock', 'Citrus', 'Cotton', 'Crops', 'Processed Food', 'Machinery', 'Equipment', 'Services'],
    units: ['kg', 'Ton', 'Crate', 'Pack', 'Unit', 'Litre', 'Bag', 'Bottle', 'Head'],
    operationTypes: ['Production', 'Harvest', 'Processing', 'Maintenance', 'Service'],
    genders: ['Male', 'Female', 'Other'],
    announcementCategories: ['General Announcements', 'Tenders & Vacancies', 'Weather Alerts', 'Pest & Disease Outbreaks'],
    knowledgeCategories: [
        { id: 'gross_margin', name: 'Gross Margin Analysis' },
        { id: 'business', name: 'Agribusiness & Funding' },
        { id: 'livestock', name: 'Livestock Production' },
        { id: 'crops', name: 'Crop Production & Storage' },
        { id: 'soil_seeds', name: 'Soil Health & Seeds' },
        { id: 'nutrition', name: 'Food & Nutrition' },
        { id: 'crop_rotation', name: 'Crop Rotation Guidance' },
        { id: 'posters', name: 'Posters' },
        { id: 'general', name: 'General Information' }
    ]
};

const METADATA_KEY = 'aiis_system_metadata_v2';
const CATALOGUE_KEY = 'aiis_master_catalogue_v2';

export const Get_System_Metadata = () => {
    const saved = localStorage.getItem(METADATA_KEY);
    if (!saved) {
        localStorage.setItem(METADATA_KEY, JSON.stringify(INITIAL_METADATA));
        return INITIAL_METADATA;
    }
    return JSON.parse(saved);
};

export const Update_System_Metadata = (category: string, newList: any[]) => {
    const current = Get_System_Metadata();
    const updated = { ...current, [category]: newList };
    localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
    return updated;
};

const mockUsers: UserProfile[] = [
    { id: 'ADMIN', name: 'System Administrator', email: 'admin@moa.gov.sz', role: UserRole.Government, actorType: ActorType.Gov, region: Region.Hhohho, status: 'Active', title: 'Super User / System Controller', contact: '+268 2404 2731', organization: 'Ministry of Agriculture', organizationId: 'MOA-HQ' },
    { id: 'USR-001', name: 'Malkerns Valley Farm', email: 'info@malkerns.sz', role: UserRole.Farmer, actorType: ActorType.Farmer, entityType: EntityType.Company, region: Region.Manzini, tinkhundla: 'Lobamba Lomdzala', status: 'Active', subsidyStatus: 'NMC Voucher', coordinates: { lat: -26.55, lng: 31.18 }, dateRegistered: '2023-01-15', contact: '+268 7602 1234', organization: 'Malkerns Agri-Co', organizationId: 'MALKERNS-01' },
    { id: 'MG', name: 'Mgulukudeni Ginindza', email: 'farmer@gmail.com', role: UserRole.Farmer, actorType: ActorType.Farmer, entityType: EntityType.Person, region: Region.Manzini, tinkhundla: 'Manzini South', status: 'Active', title: 'Primary Producer', contact: '+268 7805 4321', organization: 'Ginindza Green Estate', organizationId: 'GININDZA-001', affiliations: ['GININDZA-001'] },
    { id: 'USR-002', name: 'Shiselweni Co-op', email: 'coop@shiselweni.sz', role: UserRole.Farmer, actorType: ActorType.Farmer, entityType: EntityType.Cooperative, region: Region.Shiselweni, tinkhundla: 'Nhlangano', status: 'Active', subsidyStatus: 'Input Subsidy', coordinates: { lat: -27.11, lng: 31.20 }, dateRegistered: '2023-02-10', contact: '+268 2207 8888', organization: 'Southern Co-operatives', organizationId: 'SOUTHERN-COOP' },
    { id: '101936761', name: 'NCAMISO KHUMALO', email: 'n.khumalo@gov.sz', role: UserRole.Government, actorType: ActorType.Gov, region: Region.Hhohho, status: 'Active', contact: '+268 2404 2731', organization: 'Ministry of Agriculture', organizationId: 'MOA-HQ' },
    { id: 'SIMON', name: 'Simon Dlamini', email: 'simon@ginindza.com', role: UserRole.Farmer, actorType: ActorType.Farmer, entityType: EntityType.Person, status: 'Active', title: 'Field Foreman', organization: 'Ginindza Green Estate', organizationId: 'GININDZA-001', affiliations: ['GININDZA-001'] },
];

const INITIAL_CATALOGUE: CatalogueItem[] = [
    { registrationId: 'CAT-001', division: 'Crops', category: 'Fertilizer', subCategory: 'NPK', productType: 'Chemical', tradeName: 'NPK 2:3:2 (22)', size: '50kg', unit: 'Bag', manufacturer: 'Farm Chemicals Ltd', productStandard: 'ISO 9001', description: 'Basal Fertilizer for early plant growth.', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-001', availableDiptank: 'N/A', status: 'Vetted' },
    { registrationId: 'CAT-002', division: 'Crops', category: 'Seeds', subCategory: 'Maize', productType: 'Hybrid', tradeName: 'PAN 53 Hybrid Maize', size: '10kg', unit: 'Bag', manufacturer: 'Pannar Seeds', productStandard: 'SADC Seed Protocol', description: 'High-yielding hybrid maize seed suitable for Middleveld.', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-002', availableDiptank: 'N/A', status: 'Vetted' },
    { registrationId: 'CAT-003', division: 'Machinery', category: 'Tractor', subCategory: 'Utility', productType: 'Diesel', tradeName: 'John Deere 5050D', size: '50HP', unit: 'Unit', manufacturer: 'John Deere Africa', productStandard: 'SABS Approved', description: 'Robust utility tractor for diverse farming operations.', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-003', availableDiptank: 'N/A', status: 'Vetted' },
    { registrationId: 'CAT-004', division: 'Equipment', category: 'Sprayer', subCategory: 'Manual', productType: 'Plastic', tradeName: 'Knapsack Sprayer 16L', size: '16L', unit: 'Unit', manufacturer: 'AgriTools SZ', productStandard: 'UN Standard', description: 'Standard knapsack sprayer for pesticide application.', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-004', availableDiptank: 'N/A', status: 'Pending' },
];

export const View_Master_Catalogue = (): CatalogueItem[] => {
    const saved = localStorage.getItem(CATALOGUE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CATALOGUE;
};

export const Add_To_Master_Catalogue = (items: CatalogueItem[]) => {
    const current = View_Master_Catalogue();
    const updated = [...current];
    
    items.forEach(newItem => {
        const existingIndex = updated.findIndex(i => i.registrationId === newItem.registrationId);
        if (existingIndex > -1 && newItem.registrationId && !newItem.registrationId.startsWith('CSV-')) {
             updated[existingIndex] = { ...updated[existingIndex], ...newItem };
        } else {
            updated.unshift(newItem);
        }
    });

    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(updated));
    return updated;
};

export const Delete_From_Master_Catalogue = (registrationId: string) => {
    const current = View_Master_Catalogue();
    const updated = current.filter(i => i.registrationId !== registrationId);
    
    if (updated.length !== current.length) {
        localStorage.setItem(CATALOGUE_KEY, JSON.stringify(updated));
        return true;
    }
    return false;
};

export const Bulk_Delete_From_Catalogue = (ids: string[]) => {
    const current = View_Master_Catalogue();
    const updated = current.filter(i => !ids.includes(i.registrationId));
    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(updated));
    return updated;
};

export const Update_Catalogue_Status = (registrationId: string, status: string) => {
    const current = View_Master_Catalogue();
    const updated = current.map(item => {
        if (item.registrationId === registrationId) {
            return { ...item, status };
        }
        return item;
    });
    
    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(updated));
    return true;
};

export const Bulk_Update_Catalogue_Status = (ids: string[], status: string) => {
    const current = View_Master_Catalogue();
    const updated = current.map(item => {
        if (ids.includes(item.registrationId)) {
            return { ...item, status };
        }
        return item;
    });
    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(updated));
    return updated;
};

const mockProducts: SalesProduct[] = [
    { 
        id: 'SZ-8J2K-U004-PRC1042-HRV5501-4432', 
        name: 'Ginindza Premium Yellow Maize', 
        category: 'Crops', 
        commodityType: 'Grains', 
        price: 450, 
        unit: 'Ton', 
        quantity: 15, 
        status: 'Active', 
        dateListed: '2024-03-05', 
        sellerName: 'Mgulukudeni Ginindza', 
        sellerId: 'MG', 
        sellerContact: '+268 7805 4321',
        manufacturer: 'Ginindza Green Estate',
        region: Region.Manzini, 
        costPrice: 280,
        description: 'Quality yellow maize harvested from Unit U-004. Refined app-generated chronology ID ensures full provenance.' 
    },
    { 
        id: 'SZ-8J2K-U001-VAP2011-FIN6602-1088', 
        name: 'Organic Baby Cabbages', 
        category: 'Processed Food', 
        commodityType: 'Vegetables', 
        price: 25, 
        unit: 'Pack', 
        quantity: 100, 
        status: 'Active', 
        dateListed: '2024-02-25', 
        sellerName: 'Mgulukudeni Ginindza', 
        sellerId: 'MG', 
        sellerContact: '+268 7805 4321',
        manufacturer: 'Ginindza Green Estate',
        region: Region.Manzini,
        costPrice: 12,
        description: 'Value-added packaged baby cabbages. Traceable back to Processing Cycle VAP2011 and source unit.'
    },
];

export const Get_Product_By_ID = (id: string): SalesProduct | undefined => {
    return mockProducts.find(p => p.id === id);
};

export const Get_User_By_ID = (id: string): UserProfile | undefined => {
    return mockUsers.find(u => u.id === id);
};

export const Get_Users_By_Organization = (orgId: string): UserProfile[] => {
    return mockUsers.filter(u => u.organizationId === orgId || u.affiliations?.includes(orgId));
};

export const Affiliate_User_With_Org = (userId: string, orgId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
        if (!user.affiliations) user.affiliations = [];
        if (!user.affiliations.includes(orgId)) {
            user.affiliations.push(orgId);
            return true;
        }
    }
    return false;
};

export const addProductToRegistry = (product: SalesProduct) => {
    mockProducts.unshift(product);
};

export const updateProductStatus = (productId: string, newStatus: string, reason?: string) => {
    const p = mockProducts.find(x => x.id === productId);
    if(p) {
        p.status = newStatus as any;
        if (reason !== undefined) p.rejectionReason = reason;
        return true;
    }
    return false;
};

export const Register_New_User = (user: UserProfile) => {
    mockUsers.unshift(user);
    return true;
};

export const View_All_System_Users = () => mockUsers;
export const View_Items_Awaiting_Approval = () => mockProducts.filter(p => p.status === 'Pending Approval');
export const View_Items_Rejected = () => mockProducts.filter(p => p.status === 'Rejected');

export const Report_AIIS_Indicators = (reportType: 'MALABO' | 'NATIONAL' = 'NATIONAL'): IndicatorItem[] => {
    if (reportType === 'MALABO') {
        return [
            { id: 'M1.1', commitment: 'CAADP Process', label: 'Biennial Review Process Participation', value: 10, target: 10, unit: 'Score', status: 'Milestone Reached', trend: 'stable' },
            { id: 'M1.2', commitment: 'CAADP Process', label: 'Quality of National Agriculture Investment Plan', value: 85, target: 100, unit: '%', status: 'On Track', trend: 'up' },
            { id: 'M2.1', commitment: 'Investment Finance', label: 'Pub Expenditure on Agric (10% target)', value: 6.8, target: 10, unit: '%', status: 'Not on Track', trend: 'down' },
            { id: 'M2.2', commitment: 'Investment Finance', label: 'Access to Agric Finance', value: 42, target: 60, unit: '%', status: 'Not on Track', trend: 'up' },
            { id: 'M3.1', commitment: 'Ending Hunger', label: 'Agric Productivity Index', value: 4.2, target: 6, unit: 'Index', status: 'Not on Track', trend: 'stable' },
            { id: 'M3.2', commitment: 'Ending Hunger', label: 'Reduction of Post-Harvest Loss', value: 12, target: 15, unit: '%', status: 'On Track', trend: 'up' },
            { id: 'M4.1', commitment: 'Halving Poverty', label: 'Agric GVA Growth Rate', value: 4.5, target: 6, unit: '%', status: 'Not on Track', trend: 'up' },
            { id: 'M5.1', commitment: 'Intra-African Trade', label: 'Intra-African Trade Value for Agric Commodities', value: 18.2, target: 30, unit: '%', status: 'Not on Track', trend: 'up' },
            { id: 'M6.1', commitment: 'Enhancing Resilience', label: 'Permanent Pasture Land Access', value: 72, target: 80, unit: '%', status: 'On Track', trend: 'up' },
            { id: 'M7.1', commitment: 'Mutual Accountability', label: 'Agric Policy Review Functionality', value: 9, target: 10, unit: 'Score', status: 'On Track', trend: 'stable' }
        ];
    }

    return [
        { id: 'N1', category: 'Production', label: 'Maize Self-Sufficiency Index', value: 74, target: 100, unit: '%', status: 'Not on Track', trend: 'up', commitment: 'National Food Security' },
        { id: 'N2', category: 'Production', label: 'Livestock Population Growth', value: 3.2, target: 5, unit: '%', status: 'Not on Track', trend: 'up', commitment: 'Livestock Development' },
        { id: 'N3', category: 'Trade', label: 'Sugar Export Valuation', value: 1.2, target: 1.5, unit: 'Bn Emalangeni', status: 'On Track', trend: 'stable', commitment: 'Agri-Trade' },
        { id: 'N4', category: 'Social', label: 'Youth Participation in Agric', value: 15.4, target: 25, unit: '%', status: 'Critical', trend: 'down', commitment: 'Youth Empowerment' },
        { id: 'N5', category: 'Tech', label: 'Digitally Registered Farmers (AIIS)', value: 12400, target: 20000, unit: 'Users', status: 'On Track', trend: 'up', commitment: 'Digital Transformation' }
    ];
};

export const updateUserStatus = (id: string, status: string) => {
    const user = mockUsers.find(u => u.id === id);
    if (user) {
        user.status = status as any;
        return true;
    }
    return false;
};
export const View_Trading_Catalogue_Items = () => mockProducts.filter(p => p.status === 'Active');
