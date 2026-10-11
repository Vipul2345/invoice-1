import {
  Invoice,
  Customer,
  BusinessProfile,
  AppSettings,
  InvoiceTemplate,
  ExportDataPayload,
  PlanTier,
  CountryCode,
} from '../types';
import {
  INITIAL_BUSINESS_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_SETTINGS,
  DEFAULT_TEMPLATES,
  COUNTRIES,
} from './constants';

const STORAGE_KEYS = {
  BUSINESS: 'invoiceflow_business',
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  SETTINGS: 'invoiceflow_settings',
  CUSTOM_TEMPLATES: 'invoiceflow_custom_templates',
  ONBOARDED: 'invoiceflow_onboarded',
};

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

// Settings
export function getSettings(): AppSettings {
  return safeGet<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
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
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    business: getBusinessProfile(),
    customers: getCustomers(),
    invoices: getInvoices(),
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
    safeSet(STORAGE_KEYS.INVOICES, payload.invoices || []);
    safeSet(STORAGE_KEYS.SETTINGS, payload.settings);
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

// Currency formatting helpers
export function formatCurrency(amount: number, currency = 'USD', symbol = '$'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
