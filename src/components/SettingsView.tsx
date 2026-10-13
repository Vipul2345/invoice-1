import React, { useState } from 'react';
import { BusinessProfile, AppSettings, CountryCode, PlanTier } from '../types';
import { COUNTRIES } from '../lib/constants';
import {
  saveBusinessProfile,
  saveSettings,
  setPlanTier,
} from '../lib/storage';
import {
  SUPPORT_EMAIL,
  APP_VERSION,
  LAST_UPDATED_DATE,
  THIRD_PARTY_LICENSES,
} from '../lib/legalAndHelpContent';
import { LegalDocumentViewer, LegalDocType } from './LegalDocumentViewer';
import { HelpFaqSection } from './HelpFaqSection';
import { ContactSupportSection, ContactCategory } from './ContactSupportSection';
import { DataAndBackupSection } from './DataAndBackupSection';
import { LogoUploader } from './LogoUploader';
import { showToast } from './ToastNotification';
import {
  Building,
  Globe,
  Sliders,
  Palette,
  HardDrive,
  Cloud,
  Crown,
  HelpCircle,
  Mail,
  Bug,
  Lightbulb,
  ShieldCheck,
  FileText,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  Lock,
} from 'lucide-react';

export type SettingsTabId =
  // Business
  | 'profile'
  | 'invoice_defaults'
  | 'country'
  // Appearance
  | 'appearance'
  // Data & Backup
  | 'data_backup'
  // Your Plan
  | 'plan'
  // Support
  | 'faq'
  | 'contact'
  | 'bug'
  | 'feature'
  // Legal & Privacy
  | 'privacy'
  | 'terms'
  | 'legal_backup'
  | 'disclaimer'
  | 'refund'
  // About
  | 'about';

interface SettingsViewProps {
  business: BusinessProfile;
  settings: AppSettings;
  plan: PlanTier;
  initialTab?: SettingsTabId;
  onBusinessUpdated: (updated: BusinessProfile) => void;
  onSettingsUpdated: (updated: AppSettings) => void;
  onDataResetOrCleared: () => void;
  onNavigateToTemplates?: () => void;
  onNavigateToPricing?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  settings,
  plan,
  initialTab = 'profile',
  onBusinessUpdated,
  onSettingsUpdated,
  onDataResetOrCleared,
  onNavigateToTemplates,
  onNavigateToPricing,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  // Business Profile Form States
  const [bLogoUrl, setBLogoUrl] = useState<string | undefined>(business.logoUrl);
  const [bName, setBName] = useState(business.name);
  const [bAddress, setBAddress] = useState(business.address);
  const [bEmail, setBEmail] = useState(business.email);
  const [bPhone, setBPhone] = useState(business.phone);
  const [bTaxId, setBTaxId] = useState(business.taxId);
  const [bWebsite, setBWebsite] = useState(business.website || '');
  const [bankName, setBankName] = useState(business.bankDetails.bankName || '');
  const [accountNumber, setAccountNumber] = useState(business.bankDetails.accountNumber || '');
  const [routingCode, setRoutingCode] = useState(business.bankDetails.routingCode || '');
  const [upiId, setUpiId] = useState(business.bankDetails.upiId || '');
  const [instructions, setInstructions] = useState(business.bankDetails.instructions || '');

  // Country & Currency Form States
  const [country, setCountryCode] = useState<CountryCode>(settings.country);

  // Invoice Preferences Form States
  const [prefix, setPrefix] = useState(settings.invoicePrefix);
  const [nextNumber, setNextNumber] = useState(settings.nextInvoiceNumber);
  const [defaultTerms, setDefaultTerms] = useState(settings.defaultPaymentTerms);
  const [defaultNotes, setDefaultNotes] = useState(settings.defaultNotes);

  // Appearance Form States
  const [themePreference, setThemePreference] = useState<'system' | 'light'>('light');

  // Status notification toast
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleLogoChange = (newLogoUrl: string | undefined) => {
    setBLogoUrl(newLogoUrl);
    const updated: BusinessProfile = {
      name: bName.trim(),
      address: bAddress.trim(),
      email: bEmail.trim(),
      phone: bPhone.trim(),
      taxId: bTaxId.trim(),
      website: bWebsite.trim(),
      logoUrl: newLogoUrl,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        routingCode: routingCode.trim(),
        upiId: upiId.trim(),
        instructions: instructions.trim(),
      },
    };
    saveBusinessProfile(updated);
    onBusinessUpdated(updated);
    showToast('Company logo updated!', 'success');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessProfile = {
      name: bName.trim(),
      address: bAddress.trim(),
      email: bEmail.trim(),
      phone: bPhone.trim(),
      taxId: bTaxId.trim(),
      website: bWebsite.trim(),
      logoUrl: bLogoUrl,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        routingCode: routingCode.trim(),
        upiId: upiId.trim(),
        instructions: instructions.trim(),
      },
    };
    saveBusinessProfile(updated);
    onBusinessUpdated(updated);
    showNotification('Business profile updated and saved locally.');
    showToast('Business profile updated successfully!', 'success');
  };

  const handleSaveCountry = (e: React.FormEvent) => {
    e.preventDefault();
    const config = COUNTRIES[country] || COUNTRIES.OTHER;
    const updated: AppSettings = {
      ...settings,
      country,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
    };
    saveSettings(updated);
    onSettingsUpdated(updated);
    showNotification(`Operating country updated to ${config.name}.`);
    showToast(`Operating country updated to ${config.name}!`, 'success');
  };

  const handleSaveInvoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      invoicePrefix: prefix.trim(),
      nextInvoiceNumber: Number(nextNumber) || 1,
      defaultPaymentTerms: defaultTerms,
      defaultNotes: defaultNotes.trim(),
    };
    saveSettings(updated);
    onSettingsUpdated(updated);
    showNotification('Invoice preferences updated.');
    showToast('Invoice preferences updated!', 'success');
  };

  const handleSwitchPlan = (newPlan: PlanTier) => {
    setPlanTier(newPlan);
    const updated: AppSettings = { ...settings, plan: newPlan };
    onSettingsUpdated(updated);
    showNotification(`Active plan updated to ${newPlan.toUpperCase()} for testing.`);
    showToast(`Active plan set to ${newPlan.toUpperCase()}`, 'info');
  };

  const currentCountryConfig = COUNTRIES[settings.country] || COUNTRIES.OTHER;

  // Navigation Menu Structure
  const menuGroups = [
    {
      group: 'BUSINESS',
      items: [
        { id: 'profile' as SettingsTabId, label: 'Business Profile', icon: Building },
        { id: 'invoice_defaults' as SettingsTabId, label: 'Invoice Defaults', icon: Sliders },
        { id: 'country' as SettingsTabId, label: 'Country & Currency', icon: Globe },
      ],
    },
    {
      group: 'APPEARANCE',
      items: [
        { id: 'appearance' as SettingsTabId, label: 'Theme & Templates', icon: Palette },
      ],
    },
    {
      group: 'DATA & BACKUP',
      items: [
        { id: 'data_backup' as SettingsTabId, label: 'Data & Backup', icon: HardDrive },
      ],
    },
    {
      group: 'YOUR PLAN',
      items: [
        { id: 'plan' as SettingsTabId, label: 'Current Plan & Billing', icon: Crown },
      ],
    },
    {
      group: 'SUPPORT',
      items: [
        { id: 'faq' as SettingsTabId, label: 'Help & FAQ', icon: HelpCircle },
        { id: 'contact' as SettingsTabId, label: 'Contact Us', icon: Mail },
        { id: 'bug' as SettingsTabId, label: 'Report a Bug', icon: Bug },
        { id: 'feature' as SettingsTabId, label: 'Request a Feature', icon: Lightbulb },
      ],
    },
    {
      group: 'LEGAL & PRIVACY',
      items: [
        { id: 'privacy' as SettingsTabId, label: 'Privacy Policy', icon: ShieldCheck },
        { id: 'terms' as SettingsTabId, label: 'Terms of Service', icon: FileText },
        { id: 'legal_backup' as SettingsTabId, label: 'Data & Backup Policy', icon: HardDrive },
        { id: 'disclaimer' as SettingsTabId, label: 'Legal Disclaimer', icon: AlertTriangle },
        { id: 'refund' as SettingsTabId, label: 'Refund Policy', icon: RotateCcw },
      ],
    },
    {
      group: 'ABOUT',
      items: [
        { id: 'about' as SettingsTabId, label: 'About InvoiceFlow', icon: Info },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
          Settings & Knowledge Center
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage your business details, regional taxes, data responsibility, support, and legal information.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Main Settings Split Grid: Left Sidebar + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Category Navigation Menu */}
        <aside className="lg:col-span-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-5">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3">
                {group.group}
              </span>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Plan Info Card in Settings Sidebar */}
          <div className="pt-3 border-t border-neutral-100">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/70 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Active Plan:</span>
                <span className="font-bold uppercase tracking-wider text-neutral-900">
                  {plan}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {plan === 'free' ? 'Local-first / Watermarked' : plan === 'drive' ? 'Drive Backup Active' : 'Pro Unbranded'}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Panel */}
        <div className="lg:col-span-8">
          {/* 1. BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Business Profile
                </h3>
                <p className="text-neutral-500 mt-0.5">
                  Your business name, logo, and address will appear on generated invoices.
                </p>
              </div>

              {/* Company Logo Upload & Preview */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1.5">
                  Company Logo
                </label>
                <LogoUploader logoUrl={bLogoUrl} onLogoChange={handleLogoChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Business / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Tax Registration Number ({currentCountryConfig.taxIdLabel})
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GSTIN, EIN, or VAT ID"
                    value={bTaxId}
                    onChange={(e) => setBTaxId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={bEmail}
                    onChange={(e) => setBEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Business Address
                </label>
                <textarea
                  rows={2}
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Bank & Payout Settlement Details
                  </h4>
                  <p className="text-neutral-500 mt-0.5">
                    Included on invoices so clients know where to send payments.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JPMorgan Chase, Barclays, HDFC"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Account Number / IBAN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1049182049"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Routing / IFSC / Sort Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 021000021"
                      value={routingCode}
                      onChange={(e) => setRoutingCode(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      UPI ID / Mobile Pay (India / Digital)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. business@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Payment Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please quote invoice # in reference"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Save Business Profile
                </button>
              </div>
            </form>
          )}

          {/* 2. INVOICE DEFAULTS */}
          {activeTab === 'invoice_defaults' && (
            <form onSubmit={handleSaveInvoiceSettings} className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Invoice Defaults
                </h3>
                <p className="text-neutral-500 mt-0.5">
                  Configure default prefixes, automatic numbering series, and standard payment notes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Next Sequential Invoice Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nextNumber}
                    onChange={(e) => setNextNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Default Payment Terms
                </label>
                <select
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 14">Net 14 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Default Notes & Terms Text
                </label>
                <textarea
                  rows={3}
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Save Invoice Defaults
                </button>
              </div>
            </form>
          )}

          {/* 3. COUNTRY & CURRENCY */}
          {activeTab === 'country' && (
            <form onSubmit={handleSaveCountry} className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Country & Currency
                </h3>
                <p className="text-neutral-500 mt-0.5">
                  Select your operating country to adjust currencies, date formatting, and regional tax terminology.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Select Operating Country *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {Object.values(COUNTRIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.currencySymbol} {c.currency} · {c.taxLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-1">
                  <div className="font-bold text-neutral-900">Regional Rules Applied:</div>
                  <div>Currency: <span className="font-mono font-semibold">{COUNTRIES[country].currencySymbol} ({COUNTRIES[country].currency})</span></div>
                  <div>Tax Nomenclature: <span className="font-semibold">{COUNTRIES[country].taxLabel}</span></div>
                  <div>Registration ID: <span className="font-semibold">{COUNTRIES[country].taxIdLabel}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Update Country Settings
                </button>
              </div>
            </form>
          )}

          {/* 4. APPEARANCE & TEMPLATES */}
          {activeTab === 'appearance' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Theme & Visual Styling
                </h3>
                <p className="text-neutral-500 mt-0.5">
                  Manage interface themes, font rendering, and document design templates.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-neutral-900">Invoice Templates Gallery</h4>
                    <p className="text-neutral-500 mt-0.5">
                      Explore Minimal, Modern, Corporate, Classic, Service, and Creative layouts.
                    </p>
                  </div>
                  {onNavigateToTemplates && (
                    <button
                      type="button"
                      onClick={onNavigateToTemplates}
                      className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Open Templates
                    </button>
                  )}
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <h4 className="font-bold text-neutral-900">Application Appearance Mode</h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setThemePreference('light')}
                      className={`px-4 py-2 rounded-lg font-semibold border cursor-pointer ${
                        themePreference === 'light'
                          ? 'border-neutral-900 bg-white text-neutral-950 shadow-2xs'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      Clean High-Contrast Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemePreference('system')}
                      className={`px-4 py-2 rounded-lg font-semibold border cursor-pointer ${
                        themePreference === 'system'
                          ? 'border-neutral-900 bg-white text-neutral-950 shadow-2xs'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      System Preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. DATA & BACKUP */}
          {activeTab === 'data_backup' && (
            <DataAndBackupSection
              settings={settings}
              plan={plan}
              onSettingsUpdated={onSettingsUpdated}
              onDataResetOrCleared={onDataResetOrCleared}
              onLearnMoreLegal={() => setActiveTab('legal_backup')}
            />
          )}

          {/* 6. YOUR PLAN & BILLING */}
          {activeTab === 'plan' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-neutral-950">
                    Your Current Plan
                  </h3>
                  <p className="text-neutral-500 mt-0.5">
                    Plan tier determines cloud backup connectivity and watermark visibility.
                  </p>
                </div>

                <div className="inline-block px-3 py-1 font-bold rounded-lg uppercase tracking-wider text-xs border border-neutral-200 bg-neutral-100 text-neutral-900">
                  {plan} TIER
                </div>
              </div>

              {/* Interactive Prototype Plan Tester */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="font-bold text-neutral-900">Prototype Plan Switcher</div>
                <p className="text-neutral-600 leading-relaxed">
                  Switch your prototype plan state immediately to test watermark removal, Drive sync, and Pro template access in real-time.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('free')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      plan === 'free'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Free Plan ({settings.country === 'IN' ? '₹0' : '$0'})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('drive')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      plan === 'drive'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Drive Plan ({settings.country === 'IN' ? '₹49/mo' : '$2.99/mo'})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPlan('pro')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      plan === 'pro'
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Pro Cloud Plan ({settings.country === 'IN' ? '₹99/mo' : '$4.99/mo'})
                  </button>
                </div>
              </div>

              {/* Manage Subscription Placeholder */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-neutral-900">
                  <CreditCard className="w-4 h-4 text-neutral-600" />
                  <span>Subscription Management (Pre-Launch Placeholder)</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Live credit card billing and customer portal management will launch alongside commercial billing infrastructure. You will always be able to cancel in one click with zero risk to your local invoices.
                </p>
                {onNavigateToPricing && (
                  <button
                    type="button"
                    onClick={onNavigateToPricing}
                    className="mt-2 px-4 py-2 font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Explore Feature Comparison
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 7. SUPPORT TABS */}
          {activeTab === 'faq' && <HelpFaqSection onContactClick={() => setActiveTab('contact')} />}
          {activeTab === 'contact' && <ContactSupportSection initialCategory="General Question" />}
          {activeTab === 'bug' && <ContactSupportSection initialCategory="Report a Bug" />}
          {activeTab === 'feature' && <ContactSupportSection initialCategory="Feature Request" />}

          {/* 8. LEGAL & PRIVACY TABS */}
          {activeTab === 'privacy' && (
            <LegalDocumentViewer
              docType="privacy"
              onNavigateDoc={(t) => {
                if (t === 'privacy') setActiveTab('privacy');
                else if (t === 'terms') setActiveTab('terms');
                else if (t === 'databackup') setActiveTab('legal_backup');
                else if (t === 'disclaimer') setActiveTab('disclaimer');
                else if (t === 'refund') setActiveTab('refund');
              }}
            />
          )}

          {activeTab === 'terms' && (
            <LegalDocumentViewer
              docType="terms"
              onNavigateDoc={(t) => {
                if (t === 'privacy') setActiveTab('privacy');
                else if (t === 'terms') setActiveTab('terms');
                else if (t === 'databackup') setActiveTab('legal_backup');
                else if (t === 'disclaimer') setActiveTab('disclaimer');
                else if (t === 'refund') setActiveTab('refund');
              }}
            />
          )}

          {activeTab === 'legal_backup' && (
            <LegalDocumentViewer
              docType="databackup"
              onNavigateDoc={(t) => {
                if (t === 'privacy') setActiveTab('privacy');
                else if (t === 'terms') setActiveTab('terms');
                else if (t === 'databackup') setActiveTab('legal_backup');
                else if (t === 'disclaimer') setActiveTab('disclaimer');
                else if (t === 'refund') setActiveTab('refund');
              }}
            />
          )}

          {activeTab === 'disclaimer' && (
            <LegalDocumentViewer
              docType="disclaimer"
              onNavigateDoc={(t) => {
                if (t === 'privacy') setActiveTab('privacy');
                else if (t === 'terms') setActiveTab('terms');
                else if (t === 'databackup') setActiveTab('legal_backup');
                else if (t === 'disclaimer') setActiveTab('disclaimer');
                else if (t === 'refund') setActiveTab('refund');
              }}
            />
          )}

          {activeTab === 'refund' && (
            <LegalDocumentViewer
              docType="refund"
              onNavigateDoc={(t) => {
                if (t === 'privacy') setActiveTab('privacy');
                else if (t === 'terms') setActiveTab('terms');
                else if (t === 'databackup') setActiveTab('legal_backup');
                else if (t === 'disclaimer') setActiveTab('disclaimer');
                else if (t === 'refund') setActiveTab('refund');
              }}
            />
          )}

          {/* 9. ABOUT INVOICEFLOW */}
          {activeTab === 'about' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-6 text-xs text-neutral-700 leading-relaxed">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-neutral-950 tracking-tight">InvoiceFlow</span>
                  <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    Version {APP_VERSION}
                  </span>
                </div>
                <p className="text-neutral-500 mt-1 font-medium">
                  Simple. Professional. Offline-first invoicing.
                </p>
              </div>

              <p>
                InvoiceFlow is designed for people who need to create professional invoices quickly without the complexity of traditional accounting software. It puts users in direct control of their financial data through an offline-first architecture.
              </p>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block">Product Standards:</span>
                <ul className="list-disc list-inside space-y-1 text-neutral-600">
                  <li>No account creation barrier for basic invoicing.</li>
                  <li>Free plan is permanently useful with unlimited local records.</li>
                  <li>Structured JSON is the authoritative source of truth.</li>
                  <li>Zero tracking or advertising brokers.</li>
                </ul>
              </div>

              {/* Third-Party Open Source Licenses */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Open Source & Third-Party Software
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {THIRD_PARTY_LICENSES.map((lic, i) => (
                    <div key={i} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{lic.name}</span>
                      <span className="text-neutral-500 font-mono text-[10px]">{lic.license}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Links to Legal and Support */}
              <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="text-neutral-800 hover:text-neutral-950 font-semibold underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="text-neutral-800 hover:text-neutral-950 font-semibold underline cursor-pointer"
                >
                  Terms of Service
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('disclaimer')}
                  className="text-neutral-800 hover:text-neutral-950 font-semibold underline cursor-pointer"
                >
                  Legal Disclaimer
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className="text-neutral-800 hover:text-neutral-950 font-semibold underline cursor-pointer"
                >
                  Support ({SUPPORT_EMAIL})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
