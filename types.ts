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
  EmployeeMember = 'Employee/Member',
  Other = 'Other'
}

export enum ResourceType {
    Machinery = 'Machinery',
    Equipment = 'Equipment',
    Personnel = 'Personnel',
    Consumable = 'Consumable Input',
    Animals = 'Animals'
}

export interface Resource {
    id: string;
    type: ResourceType;
    name: string;
    unitNumber: string;
    category: string;
    unitCost: number; 
    quantity: number;
    startingQuantity?: number;
    threshold?: number;
    totalUsageHours?: number;
    assignedUnitId: string;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Low Stock';
    details?: string;
    catalogueRef?: string;
    linkedUserId?: string;
    productionDate?: string;
    expiryDate?: string;
    initialValue?: number;
    lifespanHours?: number;
    image?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
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
  lastLogin?: string;
  veterinaryArea?: string;
  chiefCode?: string;
  chiefdom?: string;
  diptankNumber?: string;
  residentNumber?: string;
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
    tinkhundla?: string;
    sourceUnit?: string;
    costPrice?: number;
    rejectionReason?: string;
    operationId?: string;
    parentBatchId?: string;
    isService?: boolean;
}

export interface MarketCartItem extends SalesProduct {
    cartQty: number;
    destinationUnitId?: string;
}

export type OrderStatus = 'Request' | 'Payment' | 'Confirmation' | 'Processing' | 'Dispatched' | 'Received' | 'Cancelled';

export interface MarketOrder {
    id: string;
    items: MarketCartItem[];
    total: number;
    status: OrderStatus;
    customerName: string;
    customerId: string;
    sellerId: string;
    sellerName: string;
    date: string;
    region: Region;
    transportServiceId?: string;
    transportServiceName?: string;
    popImage?: string;
    popRef?: string;
    notes?: string;
}

export interface CatalogueItem {
  id?: string | number;
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
  availableDiptank?: string;
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
  type: 'Production' | 'Harvest' | 'Processing' | 'Maintenance' | 'Service' | 'Training' | 'FarmVisit' | 'Advisory';
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
  beneficiariesReached?: number;
  logs?: any[];
}

export interface StatData {
  name: string;
  value: number;
  fill?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'extension';
  text: string;
  timestamp: Date;
  groundingMetadata?: any;
  attachment?: {
    mimeType: string;
    data: string;
  };
  senderName?: string;
}

/**
 * National Regional Hierarchy Mapping
 * Structure: Region -> RDA -> Tinkhundla[]
 */
export const REGIONAL_HIERARCHY: Record<string, Record<string, string[]>> = {
  [Region.Hhohho]: {
    "KaLanga RDA": ["MHLUME"],
    "Ludzeludze RDA": ["LOBAMBA LOMDZALA", "LUDZELUDZE", "MHLAMBANYATSI"],
    "Luve RDA": ["KUKHANYENI", "MKHIWENI", "NKOMIYAHLABA"],
    "Madlangampisi RDA": ["MADLANGEMPISI"],
    "Mayiwane RDA": ["MAYIWANE", "MHLANGATANE", "TIMPHISINI"],
    "Motshane RDA": ["HHUKWINI", "LOBAMBA", "MAPHALALENI", "MBABANE EAST", "MBABANE WEST", "MOTSHANE", "NKHABA", "SIPHOCOSINI"],
    "Northern RDA": ["NDZINGENI", "NTFONJENI", "PIGGS PEAK"]
  },
  [Region.Lubombo]: {
    "Dumako RDA": ["NGUDZENI", "SIGWE"],
    "Hluti RDA": ["SOMNTONGO"],
    "KaLanga RDA": ["DVOKODVWENI", "LOMAHASHA", "MHLUME", "MPOLONJENI"],
    "Ludzeludze RDA": ["MTFONGWANENI"],
    "Luve RDA": ["MAFUTSENI", "MKHIWENI"],
    "Madlangampisi RDA": ["MADLANGEMPISI"],
    "Mayiwane RDA": ["MHLANGATANE"],
    "Siphofaneni RDA": ["GILGAL", "NKILONGO", "SIPHOFANENI"],
    "Sithobela RDA": ["LUBULI", "SITHOBELA"],
    "Southern RDA": ["KUBUTA"],
    "Tikhuba RDA": ["LUGONGOLWENI", "MATSANJENI NORTH"]
  },
  [Region.Manzini]: {
    "KaLanga RDA": ["DVOKODVWENI", "MHLUME"],
    "Ludzeludze RDA": ["KWALUSENI", "LAMGABHI", "LOBAMBA LOMDZALA", "LUDZELUDZE", "MANZINI NORTH", "MANZINI SOUTH", "MHLAMBANYATSI", "MTFONGWANENI", "NHLAMBENI"],
    "Luve RDA": ["KUKHANYENI", "MAFUTSENI", "MKHIWENI", "NKOMIYAHLABA"],
    "Madlangampisi RDA": ["MADLANGEMPISI"],
    "Mahamba/Zombodze RDA": ["GEGE"],
    "Mahlangatsha RDA": ["MAHLANGATSHA"],
    "Motshane RDA": ["HHUKWINI", "LOBAMBA", "MAPHALALENI", "SIPHOCOSINI"],
    "Ngwemphisi RDA": ["MANGCONGCO", "NGWEMPHISI", "NTONDOZI", "PHONDO"],
    "Siphofaneni RDA": ["GILGAL", "SIPHOFANENI"],
    "Southern RDA": ["KUBUTA", "NKWENE"]
  },
  [Region.Shiselweni]: {
    "Dumako RDA": ["KUMETHULA", "NGUDZENI", "SANDLENI", "SIGWE"],
    "Hluti RDA": ["HOSEA", "MATSANJENI SOUTH", "SHISELWENI I", "SOMNTONGO"],
    "Mahamba/Zombodze RDA": ["GEGE", "MASEYISINI", "ZOMBODZE EMUVA"],
    "Mahlalini RDA": ["SHISELWENI II"],
    "Mahlangatsha RDA": ["MAHLANGATSHA"],
    "Ngwemphisi RDA": ["NGWEMPHISI", "PHONDO"],
    "Sithobela RDA": ["LUBULI", "SITHOBELA"],
    "Southern RDA": ["KUBUTA", "MTSAMBAMA", "NKWENE"]
  }
};

export const CHIEFDOM_REGISTRY = [
    { Region: "Hhohho", Tinkhundla: "Hhukwini", Chiefdom: "Lamgabhi" },
    { Region: "Hhohho", Tinkhundla: "Hhukwini", Chiefdom: "Dlangeni" },
    { Region: "Hhohho", Tinkhundla: "Hhukwini", Chiefdom: "Sitseni" },
    { Region: "Hhohho", Tinkhundla: "Hhukwini", Chiefdom: "KaSiko" },
    { Region: "Hhohho", Tinkhundla: "Lobamba", Chiefdom: "Ezulwini" },
    { Region: "Hhohho", Tinkhundla: "Lobamba", Chiefdom: "Elangeni" },
    { Region: "Hhohho", Tinkhundla: "Lobamba", Chiefdom: "Lobamba" },
    { Region: "Hhohho", Tinkhundla: "Lobamba", Chiefdom: "Nkhanini" },
    { Region: "Hhohho", Tinkhundla: "Lobamba", Chiefdom: "Zabeni" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "Nyonyane/Maguqa" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "Buhlebuyeza/Tfuntini" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "KaGucuka" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "Dyokolwako/Kuphakameni" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "Mzaceni/Ekukhulumeni" },
    { Region: "Hhohho", Tinkhundla: "Madlangempisi", Chiefdom: "Mavula" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Maphalaleni" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Dlozini" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Meengeni" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Nsingweni" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Madlolo" },
    { Region: "Hhohho", Tinkhundla: "Maphalaleni", Chiefdom: "Mfeni" },
    { Region: "Hhohho", Tinkhundla: "Mayiwane", Chiefdom: "Herefords" },
    { Region: "Hhohho", Tinkhundla: "Mayiwane", Chiefdom: "Mavula" },
    { Region: "Hhohho", Tinkhundla: "Mayiwane", Chiefdom: "Mkhuzweni" },
    { Region: "Hhohho", Tinkhundla: "Mayiwane", Chiefdom: "Mkhweni" },
    { Region: "Hhohho", Tinkhundla: "Mayiwane", Chiefdom: "Mfasini" },
    { Region: "Hhohho", Tinkhundla: "Mbabane East", Chiefdom: "Musunduza" },
    { Region: "Hhohho", Tinkhundla: "Mbabane East", Chiefdom: "Fontein" },
    { Region: "Hhohho", Tinkhundla: "Mbabane East", Chiefdom: "Sidwashini" },
    { Region: "Hhohho", Tinkhundla: "Mbabane East", Chiefdom: "Mdzimba" },
    { Region: "Hhohho", Tinkhundla: "Mbabane West", Chiefdom: "Manzana" },
    { Region: "Hhohho", Tinkhundla: "Mbabane West", Chiefdom: "Nkwalini" },
    { Region: "Hhohho", Tinkhundla: "Mbabane West", Chiefdom: "Mngwaneni" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Malibeni" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Mangweni" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Mphofu" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Ndwaaengeni" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Nhlanguyawika" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Zinyane" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Sidwashini" },
    { Region: "Hhohho", Tinkhundla: "Mhlangatane", Chiefdom: "Nyakatfo" },
    { Region: "Hhohho", Tinkhundla: "Motshane", Chiefdom: "Nduma" },
    { Region: "Hhohho", Tinkhundla: "Motshane", Chiefdom: "Kupheleni" },
    { Region: "Hhohho", Tinkhundla: "Motshane", Chiefdom: "Mpolonjeni" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Mgungundlovu" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Ludlawini" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Ndzingeni" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Bulandzeni" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Kwaliweni" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Mvuma" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Nkamanzi" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Ntsanjeni" },
    { Region: "Hhohho", Tinkhundla: "Ndzingeni", Chiefdom: "Meleti" },
    { Region: "Hhohho", Tinkhundla: "Nkhaba", Chiefdom: "Nkhaba" },
    { Region: "Hhohho", Tinkhundla: "Nkhaba", Chiefdom: "Ekuvinjelweni" },
    { Region: "Hhohho", Tinkhundla: "Nkhaba", Chiefdom: "Malanti" },
    { Region: "Hhohho", Tinkhundla: "Nkhaba", Chiefdom: "eJubukweni" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "Vusweni" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "Mshingishingini" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "Lomshiyo" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "KaHhohho" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "Emvembili" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "KaKudwandwa" },
    { Region: "Hhohho", Tinkhundla: "Ntfonjeni", Chiefdom: "KaThelehhele" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Bulembu (Luhhumanani 1)" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Luhhumaneni (KaNdeva)" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Luhlangotsini" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Piggs Peak" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Nginamadvolo" },
    { Region: "Hhohho", Tinkhundla: "Piggs Peak", Chiefdom: "Nsangwini" },
    { Region: "Hhohho", Tinkhundla: "Siphocosini", Chiefdom: "Siphocosini" },
    { Region: "Hhohho", Tinkhundla: "Siphocosini", Chiefdom: "Mantabeni" },
    { Region: "Hhohho", Tinkhundla: "Siphocosini", Chiefdom: "Luhlendlweni" },
    { Region: "Hhohho", Tinkhundla: "Siphocosini", Chiefdom: "Sigangeni" },
    { Region: "Hhohho", Tinkhundla: "Timphisini", Chiefdom: "Mashobeni North" },
    { Region: "Hhohho", Tinkhundla: "Timphisini", Chiefdom: "Emvembili" },
    { Region: "Hhohho", Tinkhundla: "Timphisini", Chiefdom: "Ludzibini" },
    { Region: "Hhohho", Tinkhundla: "Timphisini", Chiefdom: "Hhohho" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Nyakeni" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Maliyaduma" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Nswaceni" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Mbeka" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Bhekinkhosi" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Nkijji" },
    { Region: "Manzini", Tinkhundla: "Ekukhanyeni", Chiefdom: "Mkhulamini" },
    { Region: "Manzini", Tinkhundla: "Kwaluseni", Chiefdom: "Logoba" },
    { Region: "Manzini", Tinkhundla: "Kwaluseni", Chiefdom: "Kwaluseni" },
    { Region: "Manzini", Tinkhundla: "Kwaluseni", Chiefdom: "Mhlane" },
    { Region: "Manzini", Tinkhundla: "Kwaluseni", Chiefdom: "Mnobodleni" },
    { Region: "Manzini", Tinkhundla: "Lamgabhi", Chiefdom: "Lamgabhi" },
    { Region: "Manzini", Tinkhundla: "Lamgabhi", Chiefdom: "Dvudvusiri" },
    { Region: "Manzini", Tinkhundla: "Lamgabhi", Chiefdom: "Luhleko" },
    { Region: "Manzini", Tinkhundla: "Lamgabhi", Chiefdom: "Emhlangeni" },
    { Region: "Manzini", Tinkhundla: "Lamgabhi", Chiefdom: "Nhlulweni" },
    { Region: "Manzini", Tinkhundla: "Lobamba Lomdzala", Chiefdom: "Kufinyeni" },
    { Region: "Manzini", Tinkhundla: "Lobamba Lomdzala", Chiefdom: "Luyengo" },
    { Region: "Manzini", Tinkhundla: "Lobamba Lomdzala", Chiefdom: "Mahlanya" },
    { Region: "Manzini", Tinkhundla: "Lobamba Lomdzala", Chiefdom: "Ngwenyameni" },
    { Region: "Manzini", Tinkhundla: "Ludzeludze", Chiefdom: "Mbekelweni" },
    { Region: "Manzini", Tinkhundla: "Ludzeludze", Chiefdom: "Zombodze" },
    { Region: "Manzini", Tinkhundla: "Ludzeludze", Chiefdom: "Lozitha" },
    { Region: "Manzini", Tinkhundla: "Ludzeludze", Chiefdom: "Nkamarzi" },
    { Region: "Manzini", Tinkhundla: "Ludzeludze", Chiefdom: "Kudzeni" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Ngculwini" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Ka-Nkhambule" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Mafutseni" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Luhlokohla" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Timbutini" },
    { Region: "Manzini", Tinkhundla: "Mafutseni", Chiefdom: "Bhudla" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Bhahwini" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Nciniselweni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Nzeleni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Sigcineni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "KaZulu" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Mgomfelweni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Luzweleni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Mambativeni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Nsangwini" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Mpolonjeni" },
    { Region: "Manzini", Tinkhundla: "Mahlangatsha", Chiefdom: "Ludvondvolweni" },
    { Region: "Manzini", Tinkhundla: "Mangcongco", Chiefdom: "Mangcongco/Zenukeni" },
    { Region: "Manzini", Tinkhundla: "Mangcongco", Chiefdom: "Sandlane/Ekuthuleni" },
    { Region: "Manzini", Tinkhundla: "Mangcongco", Chiefdom: "Mabhukwini" },
    { Region: "Manzini", Tinkhundla: "Mangcongco", Chiefdom: "Dwaille" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "Makholweni" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "St Pauls" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "Dwaleni" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "Mnyenyweni" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "Manzini Central" },
    { Region: "Manzini", Tinkhundla: "Manzini North", Chiefdom: "Mzimnene" },
    { Region: "Manzini", Tinkhundla: "Manzini South", Chiefdom: "Mjingo" },
    { Region: "Manzini", Tinkhundla: "Manzini South", Chiefdom: "Moneni" },
    { Region: "Manzini", Tinkhundla: "Manzini South", Chiefdom: "Tincaeweni" },
    { Region: "Manzini", Tinkhundla: "Manzini South", Chiefdom: "Zakhele" },
    { Region: "Manzini", Tinkhundla: "Manzini South", Chiefdom: "Ngwane Park" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Zondwako" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Lundzi" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Dingizwe" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Mindazwe" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Bhunya" },
    { Region: "Manzini", Tinkhundla: "Mhlambanyatsi", Chiefdom: "Mbangave" },
    { Region: "Manzini", Tinkhundla: "Mkhiweni", Chiefdom: "Dvokolwako" },
    { Region: "Manzini", Tinkhundla: "Mkhiweni", Chiefdom: "Kutsimleni" },
    { Region: "Manzini", Tinkhundla: "Mkhiweni", Chiefdom: "Moelebeleni" },
    { Region: "Manzini", Tinkhundla: "Mkhiweni", Chiefdom: "Khuphuka" },
    { Region: "Manzini", Tinkhundla: "Mkhiweni", Chiefdom: "Mnjoli" },
    { Region: "Manzini", Tinkhundla: "Mtfongwaneni", Chiefdom: "Gundvwini" },
    { Region: "Manzini", Tinkhundla: "Mtfongwaneni", Chiefdom: "Lwandle" },
    { Region: "Manzini", Tinkhundla: "Mtfongwaneni", Chiefdom: "Ndlandlameni" },
    { Region: "Manzini", Tinkhundla: "Mtfongwaneni", Chiefdom: "Hlane/Bulunga" },
    { Region: "Manzini", Tinkhundla: "Ngwemphisi", Chiefdom: "Diadleni" },
    { Region: "Manzini", Tinkhundla: "Ngwemphisi", Chiefdom: "Ngooseni" },
    { Region: "Manzini", Tinkhundla: "Ngwemphisi", Chiefdom: "Bhadzeni I" },
    { Region: "Manzini", Tinkhundla: "Ngwemphisi", Chiefdom: "Velezizweni" },
    { Region: "Manzini", Tinkhundla: "Ngwemphisi", Chiefdom: "Macudvulwini" },
    { Region: "Manzini", Tinkhundla: "Nhlambeni", Chiefdom: "Ngonini" },
    { Region: "Manzini", Tinkhundla: "Nhlambeni", Chiefdom: "Njelu" },
    { Region: "Manzini", Tinkhundla: "Nhlambeni", Chiefdom: "Mphankhomo" },
    { Region: "Manzini", Tinkhundla: "Nhlambeni", Chiefdom: "Masundvwini" },
    { Region: "Manzini", Tinkhundla: "Nkomiyahlaba", Chiefdom: "Sibuyeni" },
    { Region: "Manzini", Tinkhundla: "Nkomiyahlaba", Chiefdom: "Vusweni" },
    { Region: "Manzini", Tinkhundla: "Nkomiyahlaba", Chiefdom: "Sigombeni" },
    { Region: "Manzini", Tinkhundla: "Nkomiyahlaba", Chiefdom: "Eni" },
    { Region: "Manzini", Tinkhundla: "Ngcayini" },
    { Region: "Manzini", Tinkhundla: "Sankolweni" },
    { Region: "Manzini", Tinkhundla: "Ntunja" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Ntondozi" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Khalangilile" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Neabaneni" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Mphini" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Ndinda" },
    { Region: "Manzini", Tinkhundla: "Ntondozi", Chiefdom: "Ndlinilembi" },
    { Region: "Manzini", Tinkhundla: "Phondo", Chiefdom: "Bhadzeni 2" },
    { Region: "Manzini", Tinkhundla: "Phondo", Chiefdom: "Lushikishini" },
    { Region: "Manzini", Tinkhundla: "Phondo", Chiefdom: "Khabonina" },
    { Region: "Manzini", Tinkhundla: "Phondo", Chiefdom: "Mahhashini" },
    { Region: "Manzini", Tinkhundla: "Phondo", Chiefdom: "Mgazini" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Siyendle" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Sidwala" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "kaDinga" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Nsukazi" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Nshamanti" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Mindazwe" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Mhlahlweni" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Sisingeni" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "kaTsambekwako" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Dilini" },
    { Region: "Shiselweni", Tinkhundla: "Gege", Chiefdom: "Mashobeni" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Lushini" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Manyiseni" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Nsingizini" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Hhohho Emuva" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Ondiyaneni" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Kaliba" },
    { Region: "Shiselweni", Tinkhundla: "Hosea", Chiefdom: "Butaneni" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "Ngobolweni" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "Zishineni/kalkulovu" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "KaPhunga" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "Nhlalabantfu" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "Kholwane" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "kaGwebu" },
    { Region: "Shiselweni", Tinkhundla: "Kubuta", Chiefdom: "kalklboke" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Gasa" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Lomfa" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Khamsie" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Mbabane" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Mbangweni" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Nzameya" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Nkalaneni" },
    { Region: "Shiselweni", Tinkhundla: "KuMethula", Chiefdom: "Nicomonye" },
    { Region: "Shiselweni", Tinkhundla: "Maseyisini", Chiefdom: "Dlovunga" },
    { Region: "Shiselweni", Tinkhundla: "Maseyisini", Chiefdom: "kaMazzi" },
    { Region: "Shiselweni", Tinkhundla: "Maseyisini", Chiefdom: "Masibini" },
    { Region: "Shiselweni", Tinkhundla: "Mbilaneni" },
    { Region: "Shiselweni", Tinkhundla: "Maseyisini", Chiefdom: "Simemeni" },
    { Region: "Shiselweni", Tinkhundla: "Maseyisini", Chiefdom: "Vusweni" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Kwaluseni" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Naalitje" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Nkonka" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Dinabanye" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Qomintaba" },
    { Region: "Shiselweni", Tinkhundla: "Matsanjeni South", Chiefdom: "Bambitje" },
    { Region: "Shiselweni", Tinkhundla: "Mtsambama", Chiefdom: "Benezer" },
    { Region: "Shiselweni", Tinkhundla: "Mtsambama", Chiefdom: "Kwendzeni" },
    { Region: "Shiselweni", Tinkhundla: "Mtsambama", Chiefdom: "kaZenzile" },
    { Region: "Shiselweni", Tinkhundla: "Mtsambama", Chiefdom: "Bhanganoma" },
    { Region: "Shiselweni", Tinkhundla: "Mtsambama", Chiefdom: "Magele" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "KaKhibiko" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "KaMhlavu" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "KaMshengu" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "Kukhanweni/Mphini" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "Lusitini" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "Ndushulweni" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "Nokwane" },
    { Region: "Shiselweni", Tinkhundla: "Ngudzeni", Chiefdom: "Phobane" },
    { Region: "Shiselweni", Tinkhundla: "Nkwene", Chiefdom: "Nkwene" },
    { Region: "Shiselweni", Tinkhundla: "Nkwene", Chiefdom: "Hlobane" },
    { Region: "Shiselweni", Tinkhundla: "Nkwene", Chiefdom: "Buseleni" },
    { Region: "Shiselweni", Tinkhundla: "Nkwene", Chiefdom: "Kuphumieni" },
    { Region: "Shiselweni", Tinkhundla: "Sandleni", Chiefdom: "KaGwegwe" },
    { Region: "Shiselweni", Tinkhundla: "Sandleni", Chiefdom: "Ngololweni" },
    { Region: "Shiselweni", Tinkhundla: "Sandleni", Chiefdom: "Nkhungwini" },
    { Region: "Shiselweni", Tinkhundla: "Sandleni", Chiefdom: "Nhietsheni" },
    { Region: "Shiselweni", Tinkhundla: "Sandleni", Chiefdom: "kashiba/eZibondeni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Dumenkhungwini" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Eposini" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Hhuhhuma" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Mabonabulawe" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Mnchinsweni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Manyandzeni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni I", Chiefdom: "Zikhotheni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni II", Chiefdom: "Mahlaini" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni II", Chiefdom: "Sikhotseni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni II", Chiefdom: "Mpangisweni" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni II", Chiefdom: "Mbeka" },
    { Region: "Shiselweni", Tinkhundla: "Shiselweni II", Chiefdom: "Mbabala" },
    { Region: "Shiselweni", Tinkhundla: "Sigwe", Chiefdom: "Ndunayithini" },
    { Region: "Shiselweni", Tinkhundla: "Sigwe", Chiefdom: "Lulakeni" },
    { Region: "Shiselweni", Tinkhundla: "Sigwe", Chiefdom: "Kuphumieni" },
    { Region: "Shiselweni", Tinkhundla: "Sigwe", Chiefdom: "Nyatsini" },
    { Region: "Shiselweni", Tinkhundla: "Sigwe", Chiefdom: "Mphini/Kukhanweni" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Eifeni" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Nsubane" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Luhlekweni" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Phangweni" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Ntuthwakazi" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Maplotini" },
    { Region: "Shiselweni", Tinkhundla: "Somntongo", Chiefdom: "Vimbizibuko" },
    { Region: "Shiselweni", Tinkhundla: "Zombodze", Chiefdom: "Bulekeni" },
    { Region: "Shiselweni", Tinkhundla: "Zombodze", Chiefdom: "Mampondweni" },
    { Region: "Shiselweni", Tinkhundla: "Zombodze", Chiefdom: "Ngwenyameni" },
    { Region: "Shiselweni", Tinkhundla: "Zombodze", Chiefdom: "Zombodze" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Malindza" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Mdumezulu" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Njabulweni" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Ntandweni" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Mhlangatane" },
    { Region: "Lubombo", Tinkhundla: "Dvokodvweni", Chiefdom: "Hlane" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Bulunga" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Etjedze" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Hlutse" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Macetjeni" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Sigeaweni West" },
    { Region: "Lubombo", Tinkhundla: "Gilgal", Chiefdom: "Vikizijula" },
    { Region: "Lubombo", Tinkhundla: "Lomahasha", Chiefdom: "Lomahasha" },
    { Region: "Lubombo", Tinkhundla: "Lomahasha", Chiefdom: "Mafucula" },
    { Region: "Lubombo", Tinkhundla: "Lomahasha", Chiefdom: "Shewula" },
    { Region: "Lubombo", Tinkhundla: "Lubuli", Chiefdom: "Canterburry" },
    { Region: "Lubombo", Tinkhundla: "Lubuli", Chiefdom: "kaVuma" },
    { Region: "Lubombo", Tinkhundla: "Lubuli", Chiefdom: "Mabantaneni" },
    { Region: "Lubombo", Tinkhundla: "Lubuli", Chiefdom: "Ntuthwakazi" },
    { Region: "Lubombo", Tinkhundla: "Lugongolweni", Chiefdom: "Kalanga" },
    { Region: "Lubombo", Tinkhundla: "Lugongolweni", Chiefdom: "Milindazwe" },
    { Region: "Lubombo", Tinkhundla: "Lugongolweni", Chiefdom: "Sitsatsaweni" },
    { Region: "Lubombo", Tinkhundla: "Lugongolweni", Chiefdom: "Makhewu" },
    { Region: "Lubombo", Tinkhundla: "Matsanjeni North", Chiefdom: "Lukhetseni" },
    { Region: "Lubombo", Tinkhundla: "Matsanjeni North", Chiefdom: "Mambane" },
    { Region: "Lubombo", Tinkhundla: "Matsanjeni North", Chiefdom: "Maphungwane" },
    { Region: "Lubombo", Tinkhundla: "Matsanjeni North", Chiefdom: "Tikhuba" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Mhlume" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Tambankulu" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Vuvulane" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Tshaneni" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Simunye" },
    { Region: "Lubombo", Tinkhundla: "Mhlume", Chiefdom: "Tsambokhulu" },
    { Region: "Lubombo", Tinkhundla: "Mpolonjeni", Chiefdom: "Kashoba" },
    { Region: "Lubombo", Tinkhundla: "Mpolonjeni", Chiefdom: "Ngcina" },
    { Region: "Lubombo", Tinkhundla: "Mpolonjeni", Chiefdom: "Sigeaweni" },
    { Region: "Lubombo", Tinkhundla: "Mpolonjeni", Chiefdom: "Ndzangu" },
    { Region: "Lubombo", Tinkhundla: "Mpolonjeni", Chiefdom: "Mpolonjeni" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Crooks" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Illovo/Mayaluka" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Mndobandoba/Phafeni" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Nkhanini/usabeni" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Gamula" },
    { Region: "Lubombo", Tinkhundla: "Nkilongo", Chiefdom: "Lunkhuntru" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Mkhweli" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Nceka" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Madlenya" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Ngevini" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Mphumakuidze" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Tambuti" },
    { Region: "Lubombo", Tinkhundla: "Siphofaneni", Chiefdom: "Maphilingo" },
    { Region: "Lubombo", Tinkhundla: "Sithobela", Chiefdom: "Nicnjwa" },
    { Region: "Lubombo", Tinkhundla: "Sithobela", Chiefdom: "Mamisa" },
    { Region: "Lubombo", Tinkhundla: "Sithobela", Chiefdom: "Luhlanveni" },
    { Region: "Lubombo", Tinkhundla: "Sithobela", Chiefdom: "part of Nokwane" },
];

export const CHIEFDOMS: Record<string, string[]> = {
    'Mbabane East': ['Msunduza', 'Sidwashini'],
    'Mbabane West': ['Bahai', 'Mangwaneni'],
    'Manzini North': ['Embelebeleni'],
    'Manzini South': ['Zakhele'],
    'Siteki': ['Ka-Langa', 'Mhlumeni']
};

/**
 * Derived constant listing all unique RDAs from hierarchy mapping
 */
export const RDAs = Array.from(new Set(Object.values(REGIONAL_HIERARCHY).flatMap(regionData => Object.keys(regionData))));

/**
 * Derived constant mapping Regions to their respective Tinkhundla lists
 */
export const TINKHUNDLA: Record<string, string[]> = Object.entries(REGIONAL_HIERARCHY).reduce((acc, [region, rdaMap]) => {
  acc[region] = Array.from(new Set(Object.values(rdaMap).flat()));
  return acc;
}, {} as Record<string, string[]>);
