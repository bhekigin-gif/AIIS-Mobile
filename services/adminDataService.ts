
import { UserProfile, UserRole, ActorType, EntityType, Region, SalesProduct, IndicatorItem, CatalogueItem, ResourceType } from '../types';
import { db, Table } from './databaseService';

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

const INITIAL_USERS: UserProfile[] = [
    { id: 'ADMIN', name: 'System Administrator', email: 'admin@moa.gov.sz', role: UserRole.Government, actorType: ActorType.Gov, region: Region.Hhohho, status: 'Active', title: 'Super User', organization: 'Ministry of Agriculture', organizationId: 'MOA-HQ' },
    { id: 'MG', name: 'Mgulukudeni Ginindza', email: 'farmer@gmail.com', role: UserRole.Farmer, actorType: ActorType.Farmer, entityType: EntityType.Person, region: Region.Manzini, tinkhundla: 'Manzini South', status: 'Active', title: 'Primary Producer', contact: '+268 7805 4321', organization: 'Ginindza Green Estate', organizationId: 'GININDZA-001' },
    { id: 'EXT', name: 'Extension Officer', email: 'extension@moa.gov.sz', role: UserRole.Extension, actorType: ActorType.Extension, region: Region.Lubombo, status: 'Active', title: 'Regional Advisor', organization: 'Ministry of Agriculture', organizationId: 'MOA-LUBOMBO' },
];

const INITIAL_CATALOGUE: CatalogueItem[] = [
    { registrationId: 'CAT-001', division: 'Crops', category: 'Fertilizer', subCategory: 'NPK', productType: 'Chemical', tradeName: 'NPK 2:3:2 (22)', size: '50kg', unit: 'Bag', manufacturer: 'Farm Chemicals Ltd', productStandard: 'ISO 9001', description: 'Basal Fertilizer', availableDistrict: 'National', availableRDA: 'All', availableConstituency: 'All', availableRegNo: 'REG-001', status: 'Vetted' },
];

// Seed Database if empty
export const Initialize_Database = async () => {
    const users = await db.getAll(Table.Users);
    if (users.length === 0) await db.saveAll(Table.Users, INITIAL_USERS);

    const meta = await db.getAll(Table.Metadata);
    if (meta.length === 0) await db.saveAll(Table.Metadata, [INITIAL_METADATA]);

    const cat = await db.getAll(Table.Catalogue);
    if (cat.length === 0) await db.saveAll(Table.Catalogue, INITIAL_CATALOGUE);
};

export const Get_System_Metadata = async () => {
    const meta = await db.getAll<any>(Table.Metadata);
    return meta[0] || INITIAL_METADATA;
};

export const Update_System_Metadata = async (category: string, newList: any[]) => {
    const current = await Get_System_Metadata();
    const updated = { ...current, [category]: newList };
    await db.saveAll(Table.Metadata, [updated]);
    return updated;
};

export const View_All_System_Users = () => db.getAll<UserProfile>(Table.Users);

export const Get_User_By_ID = async (id: string) => {
    const users = await db.getAll<UserProfile>(Table.Users);
    return users.find(u => u.id === id);
};

export const Register_New_User = async (user: UserProfile) => {
    return db.insert(Table.Users, user);
};

export const updateUserStatus = async (id: string, status: string) => {
    return db.update<UserProfile>(Table.Users, id, { status: status as any });
};

export const Get_Product_By_ID = async (id: string) => {
    const products = await db.getAll<SalesProduct>(Table.Products);
    return products.find(p => p.id === id);
};

export const updateProductStatus = async (id: string, status: string) => {
    return db.update<SalesProduct>(Table.Products, id, { status: status as any });
};

export const View_Items_Awaiting_Approval = async () => {
    const products = await db.getAll<SalesProduct>(Table.Products);
    return products.filter(p => p.status === 'Pending Approval');
};

export const View_Items_Rejected = async () => {
    const products = await db.getAll<SalesProduct>(Table.Products);
    return products.filter(p => p.status === 'Rejected');
};

export const View_Master_Catalogue = () => db.getAll<CatalogueItem>(Table.Catalogue);

export const Add_To_Master_Catalogue = async (items: CatalogueItem[]) => {
    const current = await db.getAll<CatalogueItem>(Table.Catalogue);
    const updated = [...items, ...current];
    await db.saveAll(Table.Catalogue, updated);
    return updated;
};

export const Delete_From_Master_Catalogue = async (id: string) => {
    return db.delete(Table.Catalogue, id);
};

export const Bulk_Delete_From_Catalogue = async (ids: string[]) => {
    const items = await db.getAll<CatalogueItem>(Table.Catalogue);
    const filtered = items.filter(i => !ids.includes(i.registrationId));
    await db.saveAll(Table.Catalogue, filtered);
    return filtered;
};

export const Bulk_Update_Catalogue_Status = async (ids: string[], status: string) => {
    const items = await db.getAll<CatalogueItem>(Table.Catalogue);
    const updated = items.map(i => ids.includes(i.registrationId) ? { ...i, status } : i);
    await db.saveAll(Table.Catalogue, updated);
    return updated;
};

export const Update_Catalogue_Status = async (registrationId: string, status: string) => {
    const current = await db.getAll<any>(Table.Catalogue);
    const index = current.findIndex((i: any) => i.registrationId === registrationId || i.id === registrationId);
    if (index > -1) {
        current[index].status = status;
        await db.saveAll(Table.Catalogue, current);
        return true;
    }
    return false;
};

export const Affiliate_User_With_Org = async (userId: string, orgId: string, orgName: string) => {
    return db.update<UserProfile>(Table.Users, userId, { organizationId: orgId, organization: orgName });
};

export const View_Trading_Catalogue_Items = () => db.getAll<SalesProduct>(Table.Products);

export const addProductToRegistry = (product: SalesProduct) => db.insert(Table.Products, product);

export const Report_AIIS_Indicators = (reportType: 'MALABO' | 'NATIONAL' = 'NATIONAL'): IndicatorItem[] => {
    // Note: In a production system, these would aggregate live DB stats.
    if (reportType === 'MALABO') {
        return [
            { id: 'M1.1', commitment: 'CAADP Process', label: 'Biennial Review Participation', value: 10, target: 10, unit: ' Score', status: 'Milestone Reached', trend: 'stable' },
            { id: 'M3.2', commitment: 'Ending Hunger', label: 'Reduction of Post-Harvest Loss', value: 12, target: 15, unit: '%', status: 'On Track', trend: 'up' },
            { id: 'M4.1', commitment: 'Poverty Alleviation', label: 'Smallholder Market Penetration', value: 24, target: 50, unit: '%', status: 'Not on Track', trend: 'up' },
            { id: 'M6.1', commitment: 'Resilience', label: 'Climate-Smart Adoption Rate', value: 38, target: 60, unit: '%', status: 'On Track', trend: 'up' },
        ];
    }
    return [
        { id: 'N1', category: 'Production', label: 'Maize Self-Sufficiency Index', value: 74, target: 100, unit: '%', status: 'Not on Track', trend: 'up', commitment: 'National Food Security' },
        { id: 'N2', category: 'Registry', label: 'Stakeholder Digital Integration', value: 615, target: 2000, unit: ' Nodes', status: 'On Track', trend: 'up', commitment: 'Institutional Reach' },
        { id: 'N3', category: 'Trade', label: 'Inter-Regional Commerce Liquidity', value: 4.2, target: 10, unit: 'M Emalangeni', status: 'Not on Track', trend: 'down', commitment: 'Value Chain Efficiency' },
        { id: 'N4', category: 'Policy', label: 'Women & Youth Participation', value: 42, target: 50, unit: '%', status: 'On Track', trend: 'up', commitment: 'Inclusive Development' },
        { id: 'N5', category: 'Compliance', label: 'ISO Standard Product Certification', value: 88, target: 100, unit: '%', status: 'Milestone Reached', trend: 'stable', commitment: 'Food Safety' },
    ];
};
