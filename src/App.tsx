/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Invoice,
  Customer,
  BusinessProfile,
  AppSettings,
  InvoiceTemplate,
  PlanTier,
  CountryCode,
} from './types';
import {
  getBusinessProfile,
  getCustomers,
  getInvoices,
  getSettings,
  getAllTemplates,
  isOnboarded,
  setOnboarded,
  saveInvoice,
  deleteInvoice,
  duplicateInvoice,
  setPlanTier,
  setCountry,
  saveSettings,
} from './lib/storage';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { InvoicesListView } from './components/InvoicesListView';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { CustomersView } from './components/CustomersView';
import { TemplatesView } from './components/TemplatesView';
import { ReportsView } from './components/ReportsView';
import { PricingView } from './components/PricingView';
import { SettingsView, SettingsTabId } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { BackupReminderBanner } from './components/BackupReminderBanner';
import { LegalDocType } from './components/LegalDocumentViewer';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export default function App() {
  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('profile');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [activeInvoiceForEdit, setActiveInvoiceForEdit] = useState<Invoice | null>(null);
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState<Invoice | null>(null);

  // App Data States
  const [business, setBusiness] = useState<BusinessProfile>(getBusinessProfile());
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(getInvoices());
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [templates, setTemplates] = useState<InvoiceTemplate[]>(getAllTemplates());

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isOnboarded());

  // Reload data from local storage
  const reloadData = () => {
    setBusiness(getBusinessProfile());
    setCustomers(getCustomers());
    setInvoices(getInvoices());
    setSettings(getSettings());
    setTemplates(getAllTemplates());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      reloadData();
    };
    window.addEventListener('invoiceflow_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('invoiceflow_storage_change', handleStorageChange);
    };
  }, []);

  // Android Hardware Back Button Handler
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListenerPromise = CapacitorApp.addListener('backButton', () => {
      if (showOnboarding) {
        setShowOnboarding(false);
        return;
      }
      if (activeInvoiceForPreview) {
        setActiveInvoiceForPreview(null);
        return;
      }
      if (isCreatingInvoice) {
        if (window.confirm('Leave invoice editor? Any unsaved changes will be lost.')) {
          setIsCreatingInvoice(false);
          setActiveInvoiceForEdit(null);
        }
        return;
      }
      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        return;
      }
      // On root screen: exit app
      CapacitorApp.exitApp();
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [showOnboarding, activeInvoiceForPreview, isCreatingInvoice, currentTab]);

  // Handlers for Navigation & Invoice Workflow
  const handleStartCreateInvoice = () => {
    setActiveInvoiceForEdit(null);
    setActiveInvoiceForPreview(null);
    setIsCreatingInvoice(true);
  };

  const handleStartEditInvoice = (invoice: Invoice) => {
    setActiveInvoiceForPreview(null);
    setActiveInvoiceForEdit(invoice);
    setIsCreatingInvoice(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setIsCreatingInvoice(false);
    setActiveInvoiceForEdit(null);
    setActiveInvoiceForPreview(invoice);
  };

  const handleSaveInvoice = (saved: Invoice, previewImmediately = false) => {
    const updated = saveInvoice(saved);
    reloadData();
    setIsCreatingInvoice(false);
    setActiveInvoiceForEdit(null);
    if (previewImmediately) {
      setActiveInvoiceForPreview(updated);
    } else {
      setActiveInvoiceForPreview(null);
      setCurrentTab('invoices');
    }
  };

  const handleCancelEditor = () => {
    setIsCreatingInvoice(false);
    setActiveInvoiceForEdit(null);
  };

  const handleDuplicateInvoice = (id: string) => {
    const dup = duplicateInvoice(id);
    if (dup) {
      reloadData();
      setActiveInvoiceForPreview(dup);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id);
    const num = target?.invoiceNumber || 'this invoice';
    if (confirm(`Are you sure you want to delete ${num}?`)) {
      deleteInvoice(id);
      reloadData();
      if (activeInvoiceForPreview?.id === id) {
        setActiveInvoiceForPreview(null);
      }
    }
  };

  const handleStatusChangeOnPreview = (status: Invoice['status']) => {
    if (!activeInvoiceForPreview) return;
    const updated: Invoice = {
      ...activeInvoiceForPreview,
      status,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    saveInvoice(updated);
    setActiveInvoiceForPreview(updated);
    reloadData();
  };

  const handleTemplateChangeOnPreview = (templateId: string) => {
    if (!activeInvoiceForPreview) return;
    const updated: Invoice = {
      ...activeInvoiceForPreview,
      templateId,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    saveInvoice(updated);
    setActiveInvoiceForPreview(updated);
    reloadData();
  };

  const handlePlanChange = (plan: PlanTier) => {
    setPlanTier(plan);
    setSettings((prev) => ({ ...prev, plan }));
    reloadData();
  };

  const handleCountryChange = (country: CountryCode) => {
    setCountry(country);
    reloadData();
  };

  const handleSelectDefaultTemplate = (templateId: string) => {
    const updated: AppSettings = {
      ...settings,
      defaultTemplateId: templateId,
    };
    saveSettings(updated);
    setSettings(updated);
  };

  // Onboarding Complete
  const handleOnboardingStartFree = (country: CountryCode) => {
    handleCountryChange(country);
    setOnboarded(true);
    setShowOnboarding(false);
    setCurrentTab('dashboard');
  };

  const handleOnboardingSeePlans = (country: CountryCode) => {
    handleCountryChange(country);
    setOnboarded(true);
    setShowOnboarding(false);
    setCurrentTab('pricing');
  };

  const handleOpenLegalDocFromAnywhere = (type: LegalDocType) => {
    setIsCreatingInvoice(false);
    setActiveInvoiceForEdit(null);
    setActiveInvoiceForPreview(null);
    setCurrentTab('settings');
    if (type === 'databackup') {
      setSettingsTab('legal_backup');
    } else {
      setSettingsTab(type as SettingsTabId);
    }
  };

  // Active Template for Preview
  const activeTemplate =
    templates.find((t) => t.id === activeInvoiceForPreview?.templateId) ||
    templates.find((t) => t.id === settings.defaultTemplateId) ||
    templates[0];

  // Dummy fallback invoice for templates playground
  const fallbackSampleInvoice: Invoice = invoices[0] || {
    id: 'sample-001',
    invoiceNumber: 'INV-SAMPLE',
    customerId: customers[0]?.id || 'c1',
    customerSnapshot: customers[0] || {
      id: 'c1',
      name: 'Sample Client',
      company: 'Client Corp',
      email: 'client@example.com',
      phone: '+1 555-0100',
      address: '100 Main St, City',
      taxId: 'TAX-001',
      createdAt: '2026-10-11',
    },
    date: '2026-10-11',
    dueDate: '2026-10-25',
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    paymentTerms: 'Net 14',
    items: [
      {
        id: 's1',
        description: 'Product Engineering & Design Services',
        quantity: 1,
        rate: 2400,
        taxPercent: 0,
        discountPercent: 0,
        amount: 2400,
      },
    ],
    subtotal: 2400,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 2400,
    notes: 'Thank you for your business.',
    paymentDetails: business.bankDetails,
    status: 'paid',
    templateId: 'minimal',
    country: settings.country,
    createdAt: '2026-10-11',
    updatedAt: '2026-10-11',
  };

  return (
    <div className="min-h-screen bg-neutral-50/80 text-neutral-900 flex flex-col md:flex-row antialiased">
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <OnboardingModal
          initialCountry={settings.country}
          onStartFree={handleOnboardingStartFree}
          onSeePlans={handleOnboardingSeePlans}
        />
      )}

      {/* Navigation (Sidebar Desktop + Mobile Header/Nav) */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setIsCreatingInvoice(false);
          setActiveInvoiceForEdit(null);
          setActiveInvoiceForPreview(null);
          setCurrentTab(tab);
          if (tab === 'settings') {
            setSettingsTab('profile');
          }
        }}
        onCreateInvoice={handleStartCreateInvoice}
        currentPlan={settings.plan}
        onUpgradeClick={() => {
          setIsCreatingInvoice(false);
          setActiveInvoiceForEdit(null);
          setActiveInvoiceForPreview(null);
          setCurrentTab('pricing');
        }}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 md:pl-64 w-full min-w-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Subtle Local Storage Backup Warning for Free Users */}
          {!activeInvoiceForPreview && !isCreatingInvoice && currentTab !== 'settings' && (
            <BackupReminderBanner
              plan={settings.plan}
              onLearnMore={() => {
                setCurrentTab('settings');
                setSettingsTab('data_backup');
              }}
            />
          )}

          {/* Active Invoice Preview Modal / Full View */}
          {activeInvoiceForPreview ? (
            <InvoicePreview
              invoice={activeInvoiceForPreview}
              business={business}
              template={activeTemplate}
              plan={settings.plan}
              onBack={() => setActiveInvoiceForPreview(null)}
              onEdit={() => handleStartEditInvoice(activeInvoiceForPreview)}
              onDuplicate={() => handleDuplicateInvoice(activeInvoiceForPreview.id)}
              onStatusChange={handleStatusChangeOnPreview}
              onTemplateChange={handleTemplateChangeOnPreview}
              availableTemplates={templates}
            />
          ) : isCreatingInvoice ? (
            /* Invoice Builder / Editor */
            <InvoiceEditor
              initialInvoice={activeInvoiceForEdit || undefined}
              business={business}
              customers={customers}
              settings={settings}
              onSave={handleSaveInvoice}
              onCancel={handleCancelEditor}
              onCustomerCreated={(newCust) => {
                setCustomers(getCustomers());
              }}
            />
          ) : (
            /* Standard Tab Views */
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  invoices={invoices}
                  business={business}
                  settings={settings}
                  plan={settings.plan}
                  onCreateInvoice={handleStartCreateInvoice}
                  onViewInvoice={handleViewInvoice}
                  onEditInvoice={handleStartEditInvoice}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onGoToInvoices={() => setCurrentTab('invoices')}
                  onGoToPricing={() => setCurrentTab('pricing')}
                />
              )}

              {currentTab === 'invoices' && (
                <InvoicesListView
                  invoices={invoices}
                  settings={settings}
                  onCreateInvoice={handleStartCreateInvoice}
                  onViewInvoice={handleViewInvoice}
                  onEditInvoice={handleStartEditInvoice}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              )}

              {currentTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  invoices={invoices}
                  settings={settings}
                  onCustomerUpdated={reloadData}
                />
              )}

              {currentTab === 'templates' && (
                <TemplatesView
                  currentPlan={settings.plan}
                  selectedTemplateId={settings.defaultTemplateId}
                  allTemplates={templates}
                  business={business}
                  sampleInvoice={invoices[0] || fallbackSampleInvoice}
                  onSelectDefaultTemplate={handleSelectDefaultTemplate}
                  onTemplatesUpdated={reloadData}
                  onGoToPricing={() => setCurrentTab('pricing')}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView invoices={invoices} settings={settings} />
              )}

              {currentTab === 'pricing' && (
                <PricingView
                  currentPlan={settings.plan}
                  country={settings.country}
                  onSelectPlan={handlePlanChange}
                  onCountryChange={handleCountryChange}
                  onOpenLegalDoc={handleOpenLegalDocFromAnywhere}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  key={settingsTab}
                  business={business}
                  settings={settings}
                  plan={settings.plan}
                  initialTab={settingsTab}
                  onBusinessUpdated={(updated) => setBusiness(updated)}
                  onSettingsUpdated={(updated) => setSettings(updated)}
                  onDataResetOrCleared={reloadData}
                  onNavigateToTemplates={() => setCurrentTab('templates')}
                  onNavigateToPricing={() => setCurrentTab('pricing')}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
