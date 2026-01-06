
export enum Region {
  Hhohho = 'Hhohho',
  Manzini = 'Manzini',
  Shiselweni = 'Shiselweni',
  Lubombo = 'Lubombo',
  All = 'All'
}

export enum UserRole {
  Farmer = 'Farmer', 
  Government = 'Government', 
  Extension = 'Extension', 
  Guest = 'Guest', 
}

export enum ActorType {
  Farmer = 'Farmer/Producer',
  Processor = 'Agro-Processor',
  Buyer = 'Market/Buyer',
  Supplier = 'Input Supplier',
  Retailer = 'Produce Retailer',
  Restaurant = 'Restaurant/Caterer',
  Consumer = 'Consumer',
  WasteManager = 'Waste Manager',
  Transporter = 'Logistics/Transporter',
  Gov = 'Supervisor/Monitor',
  Extension = 'Extension/Partner',
  AgroTrader = 'Agro Trader'
}

export enum EntityType {
  Person = 'Person (Individual)',
  Company = 'Company',
  Cooperative = 'Co-operative',
  NGO = 'Non Governmental Org',
  Association = 'Association',
  CommunityGroup = 'Community Group',
  Education = 'Education Centre',
  Church = 'Church',
  Health = 'Health facility',
  Police = 'Police station/post',
  Prison = 'Correctional Service',
  Army = 'Army',
  Other = 'Other'
}

export enum ResourceType {
    Machinery = 'Machinery',
    Equipment = 'Equipment',
    Personnel = 'Personnel',
    Consumable = 'Consumable Input'
}

export interface Resource {
    id: string;
    type: ResourceType;
    name: string;
    unitNumber: string;
    category: string;
    unitCost: number;
    quantity: number;
    threshold?: number;
    totalUsageHours?: number;
    assignedUnitId: string;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Low Stock';
    details?: string;
    catalogueRef?: string;
    linkedUserId?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  actorType?: ActorType;
  region?: string;
  tinkhundla?: string;
  avatar?: string;
  title?: string;
  status?: 'Active' | 'Pending Approval' | 'Suspended';
  entityType?: EntityType;
  subsidyStatus?: 'None' | 'NMC Voucher' | 'Input Subsidy';
  coordinates?: { lat: number; lng: number };
  dateRegistered?: string;
  contact?: string;
  gender?: string;
  organization?: string;
  organizationId?: string;
  functionalRole?: string;
  country?: string;
  rda?: string;
  affiliations?: string[];
}

export interface SalesProduct {
    id: string;
    name: string;
    category?: string;
    commodityType?: string;
    price: number;
    unit: string;
    quantity: number;
    description?: string;
    dateListed: string;
    status: 'Active' | 'Draft' | 'Sold Out' | 'Pending Approval' | 'Rejected';
    image?: string;
    sellerName?: string;
    sellerId?: string;
    sellerContact?: string;
    manufacturer?: string;
    region?: Region;
    sourceUnit?: string;
    costPrice?: number;
    rejectionReason?: string;
    operationId?: string;
    parentBatchId?: string;
}

export interface MarketCartItem extends SalesProduct {
    cartQty: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface MarketOrder {
    id: string;
    items: MarketCartItem[];
    total: number;
    status: OrderStatus;
    customerName: string;
    customerId: string;
    date: string;
    region: Region;
}

export interface CatalogueItem {
  registrationId: string;
  division: string;
  category: string;
  subCategory: string;
  productType: string;
  tradeName: string;
  size?: string;
  unit: string;
  manufacturerName: string;
  manufacturerUrl?: string;
  productStandardDescription: string;
  productStandardUrl?: string;
  description: string;
  availableDistrict: string;
  availableRDA: string;
  availableConstituency: string;
  availableRegNo: string;
  status?: string;
  image?: string;
}

export interface IndicatorItem {
  id: string;
  commitment: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  status: string;
  trend: 'up' | 'down' | 'stable';
  category?: string;
}

export interface ProductionProcess {
  id: string;
  unitId: string;
  name: string;
  commodity: string;
  status: 'Active' | 'Completed';
  totalAccumulatedCost: number;
  startDate: string;
  endDate?: string;
}

export interface Operation {
  id: string;
  activity: string;
  type: 'Production' | 'Harvest' | 'Processing' | 'Maintenance' | 'Service';
  field: string;
  processId?: string;
  status: 'In Progress' | 'Scheduled' | 'Completed' | 'Paused';
  progress: number;
  startDateTime: string;
  endDateTime: string;
  assignedResources: string[];
  durationHours?: number;
  accumulatedCost?: number;
  producedId?: string;
}

export interface StatData {
  name: string;
  value: number;
  fill?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingMetadata?: any;
  attachment?: {
    mimeType: string;
    data: string;
  };
}

export const TINKHUNDLA = {
    [Region.Hhohho]: ['Mbabane East', 'Mbabane West', 'Lobamba', 'Pigg\'s Peak', 'Timphisini', 'Motjane', 'Madlangempisi', 'Mayiwane', 'Ndzingeni', 'Ntfonjeni', 'Hhukwini', 'Maphalaleni', 'Nkhaba', 'Siphocosini'],
    [Region.Manzini]: ['Manzini North', 'Manzini South', 'Kwaluseni', 'Lobamba Lomdzala', 'Nhlambeni', 'Ngwempisi', 'Lamgabhi', 'Ludzeludze', 'Mhlambanyatsi', 'Mtfongwaneni', 'Kukhanyeni', 'Mafutseni', 'Mkhiweni', 'Nkomiyahlaba', 'Mahlangatsha', 'Mangcongo', 'Ntondozi', 'Phondo'],
    [Region.Shiselweni]: ['Hlatikulu', 'Nhlangano', 'Shiselweni I', 'Shiselweni II', 'Hluthi', 'Kumethula', 'Ngudzeni', 'Sandleni', 'Sigwe', 'Hosea', 'Matsanjeni South', 'Somntongo', 'Kubuta', 'Mtsambama', 'Nkwene', 'Mahamba', 'Gege', 'Maseyisini', 'Zombodze Emuva'],
    [Region.Lubombo]: ['Siteki', 'Siphofaneni', 'Big Bend', 'Lomahasha', 'Tikhuba', 'Dvokodvweni', 'Mhlume', 'Mpolonjeni', 'Gilgal', 'Nkilongo', 'Lubuli', 'Sithobela', 'Lugongolweni', 'Matsanjeni North'],
    [Region.All]: []
};

export const CHIEFDOMS: Record<string, string[]> = {
    'Mbabane East': ['Msunduza', 'Sidwashini'],
    'Mbabane West': ['Bahai', 'Mangwaneni'],
    'Manzini North': ['Embelebeleni'],
    'Manzini South': ['Zakhele'],
    'Siteki': ['Ka-Langa', 'Mhlumeni']
};
