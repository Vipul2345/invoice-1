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

export type PricingMode = 'exclusive' | 'inclusive_line' | 'inclusive_unit';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number; // Base taxable unit price before GST/tax
  taxPercent: number;
  discountPercent?: number;
  hsnSac?: string; // India GST specific
  itemCode?: string; // Item code / SKU / Product ID
  unit?: string; // e.g. 'pcs', 'hrs', 'units', 'kg', 'days'
  pricingMode?: PricingMode; // 'exclusive' (Mode A) | 'inclusive_line' (Mode B) | 'inclusive_unit'
  enteredTotal?: number; // Value entered by user when in inclusive pricing mode
  taxAmount?: number; // Calculated tax amount for the row
  taxableAmount?: number; // Calculated taxable amount for the row
  amount: number; // Final line total including tax
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
  terms?: string;
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

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerSnapshot: Customer;
  date: string;
  validUntil: string; // Validity/Expiry date
  currency: string;
  currencySymbol: string;
  paymentTerms?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  paymentDetails: BankDetails;
  status: QuotationStatus;
  templateId: string;
  country: CountryCode;
  convertedInvoiceId?: string; // Prevents duplicate conversion to invoice
  convertedAt?: string;
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
  | 'clean-professional'
  | 'detailed-business'
  | 'modern-minimal'
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
  logoPosition?: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
  showTaxBreakdown: boolean;
  showPaymentDetails: boolean;
  headerLayout: 'standard' | 'compact' | 'split';
  tableStyle: 'clean' | 'striped' | 'bordered';
  accentIntensity: 'subtle' | 'bold';
  // Comprehensive component toggles for custom template builder
  showBusinessDetails?: boolean;
  showCustomerDetails?: boolean;
  showDocTitle?: boolean;
  showInvoiceMeta?: boolean;
  showDueDate?: boolean;
  showPaymentTerms?: boolean;
  showItemCode?: boolean;
  showUnit?: boolean;
  showTaxColumn?: boolean;
  showDiscountColumn?: boolean;
  showNotes?: boolean;
  showTerms?: boolean;
  showSignatory?: boolean;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  style: TemplateStyle;
  config: TemplateConfig;
}

export interface UserSubscription {
  plan: PlanTier;
  planName: string; // 'Free Plan' | 'Drive Plan' | 'Pro Gold Program'
  status: 'active' | 'trial' | 'canceled' | 'expired';
  updatedAt: string;
  drivePermissionGranted?: boolean;
  cloudBackupEnabled?: boolean;
  // Razorpay payment & Autopay details
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;
  cancelledAt?: string;
  lastCloudSyncAt?: string;
}

export interface DriveSyncState {
  isConnected: boolean;
  email?: string;
  lastBackupAt?: string;
  autoSync: boolean;
  permissionGranted?: boolean;
}

export interface AppSettings {
  country: CountryCode;
  plan: PlanTier;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  quotationPrefix: string;
  nextQuotationNumber: number;
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
  quotations?: Quotation[];
  settings: AppSettings;
  customTemplates: InvoiceTemplate[];
}

