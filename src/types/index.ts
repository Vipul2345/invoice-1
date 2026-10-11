export type CountryCode = 
  | 'IN' // India
  | 'US' // United States
  | 'GB' // United Kingdom
  | 'CA' // Canada
  | 'AU' // Australia
  | 'DE' // Germany
  | 'FR' // France
  | 'AE' // UAE
  | 'SG' // Singapore
  | 'OTHER';

export type PlanTier = 'free' | 'drive' | 'pro';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  discountPercent?: number;
  hsnSac?: string; // India GST specific
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxId: string; // GSTIN / Tax ID / VAT
  createdAt: string;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingCode?: string; // IFSC for India, Sort Code for UK, Routing for US
  upiId?: string; // India UPI
  iban?: string; // EU / UK
  instructions?: string;
}

export interface BusinessProfile {
  name: string;
  logoUrl?: string;
  address: string;
  email: string;
  phone: string;
  taxId: string; // GSTIN / EIN / VAT ID
  website?: string;
  bankDetails: BankDetails;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerSnapshot: Customer;
  date: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  paymentTerms: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  paymentDetails: BankDetails;
  status: InvoiceStatus;
  templateId: string;
  country: CountryCode;
  createdAt: string;
  updatedAt: string;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  taxLabel: string;
  taxIdLabel: string;
  defaultTaxRates: number[];
  dateFormat: string;
  subTaxTypes?: string[]; // e.g. ['CGST', 'SGST', 'IGST']
}

export type TemplateStyle = 
  | 'minimal' 
  | 'modern' 
  | 'corporate' 
  | 'classic' 
  | 'service' 
  | 'creative' 
  | 'custom';

export interface TemplateConfig {
  primaryColor: string;
  secondaryColor?: string;
  font: 'sans' | 'mono' | 'serif';
  showLogo: boolean;
  showTaxBreakdown: boolean;
  showPaymentDetails: boolean;
  headerLayout: 'standard' | 'compact' | 'split';
  tableStyle: 'clean' | 'striped' | 'bordered';
  accentIntensity: 'subtle' | 'bold';
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  style: TemplateStyle;
  config: TemplateConfig;
}

export interface DriveSyncState {
  isConnected: boolean;
  email?: string;
  lastBackupAt?: string;
  autoSync: boolean;
}

export interface AppSettings {
  country: CountryCode;
  plan: PlanTier;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultNotes: string;
  defaultPaymentTerms: string;
  defaultTemplateId: string;
  driveSync: DriveSyncState;
}

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  business: BusinessProfile;
  customers: Customer[];
  invoices: Invoice[];
  settings: AppSettings;
  customTemplates: InvoiceTemplate[];
}
