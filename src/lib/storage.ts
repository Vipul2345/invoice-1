import {
  Invoice,
  Customer,
  BusinessProfile,
  AppSettings,
  InvoiceTemplate,
  ExportDataPayload,
  PlanTier,
  CountryCode,
  Quotation,
} from '../types';
import {
  INITIAL_BUSINESS_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_QUOTATIONS,
  INITIAL_SETTINGS,
  DEFAULT_TEMPLATES,
  COUNTRIES,
} from './constants';

const STORAGE_KEYS = {
  BUSINESS: 'invoiceflow_business',
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  QUOTATIONS: 'invoiceflow_quotations',
  SETTINGS: 'invoiceflow_settings',
  CUSTOM_TEMPLATES: 'invoiceflow_custom_templates',
  ONBOARDED: 'invoiceflow_onboarded',
};

const LEGACY_SEED_PURGED_KEY = 'invoiceflow_seed_purged_v2';

function purgeLegacySeedDataIfNeeded(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(LEGACY_SEED_PURGED_KEY)) return;

    // Check if business profile is Acme Services seed
    const rawBusiness = localStorage.getItem(STORAGE_KEYS.BUSINESS);
    if (rawBusiness) {
      try {
        const parsed = JSON.parse(rawBusiness);
        if (parsed.name === 'Acme Services' && parsed.email === 'billing@acmeservices.io') {
          localStorage.removeItem(STORAGE_KEYS.BUSINESS);
        }
      } catch {}
    }

    // Check if customers contain seed customer IDs
    const rawCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (rawCustomers) {
      try {
        const parsed = JSON.parse(rawCustomers);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (c: any) => !['customer-001', 'customer-002', 'customer-003', 'customer-004'].includes(c.id)
          );
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
        }
      } catch {}
    }

    // Check if invoices contain seed invoice IDs
    const rawInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (rawInvoices) {
      try {
        const parsed = JSON.parse(rawInvoices);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (i: any) => !['inv-0001', 'inv-0002', 'inv-0003', 'inv-0004'].includes(i.id)
          );
          localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filtered));
        }
      } catch {}
    }

    // Check if quotations contain seed quotation IDs
    const rawQuotations = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    if (rawQuotations) {
      try {
        const parsed = JSON.parse(rawQuotations);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (q: any) => !['quo-0001', 'quo-0002'].includes(q.id)
          );
          localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(filtered));
        }
      } catch {}
    }

    // Reset counters in settings if they are still on seed values
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        if (parsed.nextInvoiceNumber === 4 || parsed.nextInvoiceNumber === 5) {
          parsed.nextInvoiceNumber = 1;
        }
        if (parsed.nextQuotationNumber === 2 || parsed.nextQuotationNumber === 3) {
          parsed.nextQuotationNumber = 1;
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      } catch {}
    }

    localStorage.setItem(LEGACY_SEED_PURGED_KEY, 'true');
  } catch (e) {
    console.warn('Could not run seed purge:', e);
  }
}

// Run initial purge check
purgeLegacySeedDataIfNeeded();

// Safe localStorage accessor
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('invoiceflow_storage_change'));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

// Business Profile
export function getBusinessProfile(): BusinessProfile {
  return safeGet<BusinessProfile>(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS_PROFILE);
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  safeSet(STORAGE_KEYS.BUSINESS, profile);
}

// Customers
export function getCustomers(): Customer[] {
  return safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export function saveCustomer(customer: Customer): Customer {
  const current = getCustomers();
  const existingIndex = current.findIndex((c) => c.id === customer.id);
  let updated: Customer[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = customer;
  } else {
    updated = [customer, ...current];
  }
  safeSet(STORAGE_KEYS.CUSTOMERS, updated);
  return customer;
}

export function deleteCustomer(id: string): void {
  const current = getCustomers();
  safeSet(STORAGE_KEYS.CUSTOMERS, current.filter((c) => c.id !== id));
}

// Invoices
export function getInvoices(): Invoice[] {
  return safeGet<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find((inv) => inv.id === id);
}

export function saveInvoice(invoice: Invoice): Invoice {
  const current = getInvoices();
  const existingIndex = current.findIndex((inv) => inv.id === invoice.id);
  let updated: Invoice[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...invoice, updatedAt: new Date().toISOString().split('T')[0] };
  } else {
    updated = [{ ...invoice, updatedAt: new Date().toISOString().split('T')[0] }, ...current];
    // increment next invoice number in settings if it matches current counter
    const settings = getSettings();
    const numPart = parseInt(invoice.invoiceNumber.replace(/\D/g, ''), 10);
    if (!isNaN(numPart) && numPart >= settings.nextInvoiceNumber) {
      saveSettings({ ...settings, nextInvoiceNumber: numPart + 1 });
    }
  }
  safeSet(STORAGE_KEYS.INVOICES, updated);
  return invoice;
}

export function deleteInvoice(id: string): void {
  const current = getInvoices();
  safeSet(STORAGE_KEYS.INVOICES, current.filter((inv) => inv.id !== id));
}

export function duplicateInvoice(id: string): Invoice | null {
  const target = getInvoiceById(id);
  if (!target) return null;
  const settings = getSettings();
  const nextNum = settings.nextInvoiceNumber;
  const newNumStr = `${settings.invoicePrefix}${String(nextNum).padStart(4, '0')}`;

  const duplicated: Invoice = {
    ...target,
    id: `inv-${Date.now()}`,
    invoiceNumber: newNumStr,
    status: 'draft',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  saveInvoice(duplicated);
  saveSettings({ ...settings, nextInvoiceNumber: nextNum + 1 });
  return duplicated;
}

// Quotations
export function getQuotations(): Quotation[] {
  return safeGet<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
}

export function getQuotationById(id: string): Quotation | undefined {
  return getQuotations().find((q) => q.id === id);
}

export function saveQuotation(quotation: Quotation): Quotation {
  const current = getQuotations();
  const existingIndex = current.findIndex((q) => q.id === quotation.id);
  let updated: Quotation[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...quotation, updatedAt: new Date().toISOString().split('T')[0] };
  } else {
    updated = [{ ...quotation, updatedAt: new Date().toISOString().split('T')[0] }, ...current];
    // increment next quotation number in settings if it matches current counter
    const settings = getSettings();
    const numPart = parseInt(quotation.quotationNumber.replace(/\D/g, ''), 10);
    if (!isNaN(numPart) && numPart >= settings.nextQuotationNumber) {
      saveSettings({ ...settings, nextQuotationNumber: numPart + 1 });
    }
  }
  safeSet(STORAGE_KEYS.QUOTATIONS, updated);
  return quotation;
}

export function deleteQuotation(id: string): void {
  const current = getQuotations();
  safeSet(STORAGE_KEYS.QUOTATIONS, current.filter((q) => q.id !== id));
}

export function duplicateQuotation(id: string): Quotation | null {
  const target = getQuotationById(id);
  if (!target) return null;
  const settings = getSettings();
  const nextNum = settings.nextQuotationNumber;
  const newNumStr = `${settings.quotationPrefix}${String(nextNum).padStart(4, '0')}`;

  const duplicated: Quotation = {
    ...target,
    id: `quo-${Date.now()}`,
    quotationNumber: newNumStr,
    status: 'draft',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    convertedInvoiceId: undefined,
    convertedAt: undefined,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  saveQuotation(duplicated);
  saveSettings({ ...settings, nextQuotationNumber: nextNum + 1 });
  return duplicated;
}

/**
 * Converts an existing quotation into a new official invoice.
 * - Checks for prior conversion to prevent duplicate invoice generation
 * - Generates unique invoice number using current sequence
 * - Copies items, customer, terms, tax breakdown, and notes
 * - Preserves original quotation and marks it as accepted + converted
 * - Never reuses the quotation ID as the invoice ID
 */
export function convertQuotationToInvoice(quotationId: string): {
  success: boolean;
  invoice?: Invoice;
  error?: string;
} {
  const quotation = getQuotationById(quotationId);
  if (!quotation) {
    return { success: false, error: 'Quotation not found.' };
  }

  // Prevent accidental duplicate conversion
  if (quotation.convertedInvoiceId) {
    const existingInv = getInvoiceById(quotation.convertedInvoiceId);
    return {
      success: false,
      invoice: existingInv,
      error: `This quotation was already converted to invoice ${existingInv?.invoiceNumber || quotation.convertedInvoiceId}.`,
    };
  }

  const settings = getSettings();
  const nextNum = settings.nextInvoiceNumber;
  const newInvoiceNumber = `${settings.invoicePrefix}${String(nextNum).padStart(4, '0')}`;

  // Deep clone line items to prevent linked mutation
  const copiedItems = quotation.items.map((it, idx) => ({
    ...it,
    id: `item-${Date.now()}-${idx + 1}`,
  }));

  const issueDate = new Date().toISOString().split('T')[0];
  let daysToAdd = 14;
  if (quotation.paymentTerms === 'Due on Receipt') daysToAdd = 0;
  else if (quotation.paymentTerms === 'Net 7') daysToAdd = 7;
  else if (quotation.paymentTerms === 'Net 14') daysToAdd = 14;
  else if (quotation.paymentTerms === 'Net 30') daysToAdd = 30;
  else if (quotation.paymentTerms === 'Net 60') daysToAdd = 60;

  const dueDate = new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: newInvoiceNumber,
    customerId: quotation.customerId,
    customerSnapshot: { ...quotation.customerSnapshot },
    date: issueDate,
    dueDate,
    currency: quotation.currency,
    currencySymbol: quotation.currencySymbol,
    paymentTerms: quotation.paymentTerms || settings.defaultPaymentTerms || 'Net 14',
    items: copiedItems,
    subtotal: quotation.subtotal,
    totalDiscount: quotation.totalDiscount,
    totalTax: quotation.totalTax,
    grandTotal: quotation.grandTotal,
    notes: quotation.notes || settings.defaultNotes,
    paymentDetails: { ...quotation.paymentDetails },
    status: 'pending',
    templateId: quotation.templateId || settings.defaultTemplateId || 'clean-professional',
    country: quotation.country,
    createdAt: issueDate,
    updatedAt: issueDate,
  };

  // Save the new invoice
  saveInvoice(newInvoice);

  // Update quotation history and link
  const updatedQuotation: Quotation = {
    ...quotation,
    status: 'accepted',
    convertedInvoiceId: newInvoice.id,
    convertedAt: new Date().toISOString(),
    updatedAt: issueDate,
  };
  saveQuotation(updatedQuotation);

  return { success: true, invoice: newInvoice };
}

// Settings
export function getSettings(): AppSettings {
  const loaded = safeGet<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  return {
    ...INITIAL_SETTINGS,
    ...loaded,
    quotationPrefix: loaded.quotationPrefix || 'QUO-',
    nextQuotationNumber: loaded.nextQuotationNumber || 1,
    defaultTemplateId: loaded.defaultTemplateId || 'clean-professional',
  };
}

export function saveSettings(settings: AppSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

export function setPlanTier(plan: PlanTier): void {
  const current = getSettings();
  saveSettings({ ...current, plan });
}

export function setCountry(countryCode: CountryCode): void {
  const config = COUNTRIES[countryCode] || COUNTRIES.OTHER;
  const current = getSettings();
  saveSettings({
    ...current,
    country: countryCode,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
  });
}

// Templates
export function getAllTemplates(): InvoiceTemplate[] {
  const custom = safeGet<InvoiceTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
  return [...DEFAULT_TEMPLATES, ...custom];
}

export function saveCustomTemplate(template: InvoiceTemplate): void {
  const current = safeGet<InvoiceTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: InvoiceTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [...current, template];
  }
  safeSet(STORAGE_KEYS.CUSTOM_TEMPLATES, updated);
}

export function deleteCustomTemplate(id: string): void {
  const current = safeGet<InvoiceTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
  safeSet(STORAGE_KEYS.CUSTOM_TEMPLATES, current.filter((t) => t.id !== id));
}

// Onboarding State
export function isOnboarded(): boolean {
  return safeGet<boolean>(STORAGE_KEYS.ONBOARDED, false);
}

export function setOnboarded(value: boolean): void {
  safeSet(STORAGE_KEYS.ONBOARDED, value);
}

// JSON Backup Export and Import
export function generateExportPayload(): ExportDataPayload {
  return {
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    business: getBusinessProfile(),
    customers: getCustomers(),
    invoices: getInvoices(),
    quotations: getQuotations(),
    settings: getSettings(),
    customTemplates: safeGet<InvoiceTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, []),
  };
}

export function exportBackupFile(): void {
  const data = generateExportPayload();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `invoiceflow-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupPayload(payload: ExportDataPayload): boolean {
  try {
    if (!payload.business || !payload.invoices || !payload.settings) {
      throw new Error('Invalid InvoiceFlow backup file structure');
    }
    safeSet(STORAGE_KEYS.BUSINESS, payload.business);
    safeSet(STORAGE_KEYS.CUSTOMERS, payload.customers || []);
    
    // Ensure invoices have safe default pricingMode for older documents
    const sanitizedInvoices = (payload.invoices || []).map((inv) => ({
      ...inv,
      items: (inv.items || []).map((item) => ({
        ...item,
        pricingMode: item.pricingMode || 'exclusive',
      })),
    }));
    safeSet(STORAGE_KEYS.INVOICES, sanitizedInvoices);

    // Support imported quotations or safe fallback
    const sanitizedQuotations = (payload.quotations || []).map((quo) => ({
      ...quo,
      items: (quo.items || []).map((item) => ({
        ...item,
        pricingMode: item.pricingMode || 'exclusive',
      })),
    }));
    safeSet(STORAGE_KEYS.QUOTATIONS, sanitizedQuotations);

    safeSet(STORAGE_KEYS.SETTINGS, {
      ...INITIAL_SETTINGS,
      ...payload.settings,
      quotationPrefix: payload.settings.quotationPrefix || 'QUO-',
      nextQuotationNumber: payload.settings.nextQuotationNumber || 1,
    });

    if (payload.customTemplates) {
      safeSet(STORAGE_KEYS.CUSTOM_TEMPLATES, payload.customTemplates);
    }
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

// Reset and Clear
export function resetToDemoData(): void {
  safeSet(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS_PROFILE);
  safeSet(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  safeSet(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  safeSet(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  safeSet(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
  safeSet(STORAGE_KEYS.ONBOARDED, true);
}

export function clearAllLocalData(): void {
  safeSet(STORAGE_KEYS.BUSINESS, {
    name: 'My Business',
    address: '',
    email: '',
    phone: '',
    taxId: '',
    bankDetails: {},
  });
  safeSet(STORAGE_KEYS.CUSTOMERS, []);
  safeSet(STORAGE_KEYS.INVOICES, []);
  safeSet(STORAGE_KEYS.QUOTATIONS, []);
  safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  safeSet(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
}

// Google Drive Mock Backup Operations
export function mockConnectDrive(email: string): void {
  const current = getSettings();
  saveSettings({
    ...current,
    driveSync: {
      isConnected: true,
      email,
      lastBackupAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      autoSync: true,
    },
  });
}

export function mockDisconnectDrive(): void {
  const current = getSettings();
  saveSettings({
    ...current,
    driveSync: {
      isConnected: false,
      email: undefined,
      lastBackupAt: undefined,
      autoSync: false,
    },
  });
}

export function mockTriggerDriveBackup(): void {
  const current = getSettings();
  saveSettings({
    ...current,
    driveSync: {
      ...current.driveSync,
      lastBackupAt: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
    },
  });
}

export function setDrivePermission(granted: boolean): void {
  const current = getSettings();
  saveSettings({
    ...current,
    driveSync: {
      ...current.driveSync,
      permissionGranted: granted,
    },
  });
}

// Currency formatting helpers
export function formatCurrency(amount: number, currency = 'USD', symbol = '$'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
