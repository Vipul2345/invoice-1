import React, { useState } from 'react';
import { InvoiceTemplate, PlanTier, BusinessProfile, Invoice } from '../types';
import { saveCustomTemplate, deleteCustomTemplate, saveBusinessProfile } from '../lib/storage';
import { InvoicePreview } from './InvoicePreview';
import { LogoUploader } from './LogoUploader';
import { showToast } from './ToastNotification';
import {
  Crown,
  Check,
  Sliders,
  Plus,
  Trash2,
  Lock,
  Image as ImageIcon,
  Edit3,
  RotateCcw,
  Layout,
  Table as TableIcon,
  UserCheck,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';

interface TemplatesViewProps {
  currentPlan: PlanTier;
  selectedTemplateId: string;
  allTemplates: InvoiceTemplate[];
  business: BusinessProfile;
  sampleInvoice: Invoice;
  onSelectDefaultTemplate: (templateId: string) => void;
  onTemplatesUpdated: () => void;
  onGoToPricing: () => void;
  onBusinessUpdated?: (business: BusinessProfile) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  currentPlan,
  selectedTemplateId,
  allTemplates,
  business,
  sampleInvoice,
  onSelectDefaultTemplate,
  onTemplatesUpdated,
  onGoToPricing,
  onBusinessUpdated,
}) => {
  const isPro = currentPlan === 'pro';
  const [activeTab, setActiveTab] = useState<'gallery' | 'builder'>('gallery');

  // Custom Template Builder state
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('My Custom Brand');
  const [primaryColor, setPrimaryColor] = useState('#1e293b');
  const [font, setFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [headerLayout, setHeaderLayout] = useState<'standard' | 'split' | 'compact'>('split');
  const [tableStyle, setTableStyle] = useState<'clean' | 'striped' | 'bordered'>('clean');

  // Component Toggles
  const [showLogo, setShowLogo] = useState(true);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showBusinessDetails, setShowBusinessDetails] = useState(true);
  const [showDocTitle, setShowDocTitle] = useState(true);
  const [showInvoiceMeta, setShowInvoiceMeta] = useState(true);
  const [showDueDate, setShowDueDate] = useState(true);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [showItemCode, setShowItemCode] = useState(true);
  const [showUnit, setShowUnit] = useState(true);
  const [showTaxColumn, setShowTaxColumn] = useState(true);
  const [showDiscountColumn, setShowDiscountColumn] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showSignatory, setShowSignatory] = useState(false);

  const handleLogoChange = (newLogoUrl: string | undefined) => {
    const updated: BusinessProfile = {
      ...business,
      logoUrl: newLogoUrl,
    };
    saveBusinessProfile(updated);
    onBusinessUpdated?.(updated);
  };

  // Reset all builder values to recommended standard
  const handleResetDefaults = () => {
    setPrimaryColor('#1e293b');
    setFont('sans');
    setHeaderLayout('split');
    setTableStyle('clean');
    setShowLogo(true);
    setLogoPosition('left');
    setLogoSize('medium');
    setShowBusinessDetails(true);
    setShowDocTitle(true);
    setShowInvoiceMeta(true);
    setShowDueDate(true);
    setShowPaymentTerms(true);
    setShowCustomerDetails(true);
    setShowItemCode(true);
    setShowUnit(true);
    setShowTaxColumn(true);
    setShowDiscountColumn(true);
    setShowTaxBreakdown(true);
    setShowPaymentDetails(true);
    setShowNotes(true);
    setShowTerms(true);
    setShowSignatory(false);
    showToast('Reset template controls to default!', 'info');
  };

  // Load an existing custom template into the editor
  const handleEditTemplate = (tmpl: InvoiceTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomId(tmpl.id);
    setCustomName(tmpl.name);
    setPrimaryColor(tmpl.config.primaryColor || '#1e293b');
    setFont(tmpl.config.font || 'sans');
    setHeaderLayout(tmpl.config.headerLayout || 'split');
    setTableStyle(tmpl.config.tableStyle || 'clean');
    setShowLogo(tmpl.config.showLogo !== false);
    setLogoPosition(tmpl.config.logoPosition || 'left');
    setLogoSize(tmpl.config.logoSize || 'medium');
    setShowBusinessDetails(tmpl.config.showBusinessDetails !== false);
    setShowDocTitle(tmpl.config.showDocTitle !== false);
    setShowInvoiceMeta(tmpl.config.showInvoiceMeta !== false);
    setShowDueDate(tmpl.config.showDueDate !== false);
    setShowPaymentTerms(tmpl.config.showPaymentTerms !== false);
    setShowCustomerDetails(tmpl.config.showCustomerDetails !== false);
    setShowItemCode(tmpl.config.showItemCode !== false);
    setShowUnit(tmpl.config.showUnit !== false);
    setShowTaxColumn(tmpl.config.showTaxColumn !== false);
    setShowDiscountColumn(tmpl.config.showDiscountColumn ?? true);
    setShowTaxBreakdown(tmpl.config.showTaxBreakdown !== false);
    setShowPaymentDetails(tmpl.config.showPaymentDetails !== false);
    setShowNotes(tmpl.config.showNotes !== false);
    setShowTerms(tmpl.config.showTerms !== false);
    setShowSignatory(tmpl.config.showSignatory === true);
    setActiveTab('builder');
  };

  const handleStartNewCustom = () => {
    setEditingCustomId(null);
    setCustomName('My Custom Brand');
    handleResetDefaults();
    setActiveTab('builder');
  };

  // Live preview template object with real-time toggles
  const liveCustomTemplate: InvoiceTemplate = {
    id: editingCustomId || `custom-preview`,
    name: customName || 'Custom Template',
    description: 'Customized layout design',
    isPremium: true,
    style: 'custom',
    config: {
      primaryColor,
      font,
      showLogo,
      logoPosition,
      logoSize,
      headerLayout,
      tableStyle,
      accentIntensity: 'bold',
      showBusinessDetails,
      showCustomerDetails,
      showDocTitle,
      showInvoiceMeta,
      showDueDate,
      showPaymentTerms,
      showItemCode,
      showUnit,
      showTaxColumn,
      showDiscountColumn,
      showTaxBreakdown,
      showPaymentDetails,
      showNotes,
      showTerms,
      showSignatory,
    },
  };

  const handleSaveCustom = () => {
    const newTemplate: InvoiceTemplate = {
      id: editingCustomId || `custom-${Date.now()}`,
      name: customName.trim() || 'My Custom Brand',
      description: 'Handcrafted custom invoice layout',
      isPremium: true,
      style: 'custom',
      config: {
        primaryColor,
        font,
        showLogo,
        logoPosition,
        logoSize,
        headerLayout,
        tableStyle,
        accentIntensity: 'bold',
        showBusinessDetails,
        showCustomerDetails,
        showDocTitle,
        showInvoiceMeta,
        showDueDate,
        showPaymentTerms,
        showItemCode,
        showUnit,
        showTaxColumn,
        showDiscountColumn,
        showTaxBreakdown,
        showPaymentDetails,
        showNotes,
        showTerms,
        showSignatory,
      },
    };
    saveCustomTemplate(newTemplate);
    onTemplatesUpdated();
    onSelectDefaultTemplate(newTemplate.id);
    showToast(`Custom template "${newTemplate.name}" saved and applied!`, 'success');
    setActiveTab('gallery');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this custom template?')) {
      deleteCustomTemplate(id);
      onTemplatesUpdated();
      showToast('Custom template deleted.', 'info');
    }
  };

  // Helper toggle switch component
  const ComponentToggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div
      onClick={() => onChange(!checked)}
      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
        checked
          ? 'bg-neutral-900/5 border-neutral-300 text-neutral-950'
          : 'bg-neutral-50/70 border-neutral-200/70 text-neutral-400 opacity-70'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold tracking-tight">{label}</div>
        {description && <div className="text-[10px] text-neutral-500 mt-0.5">{description}</div>}
      </div>
      <div
        className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
          checked ? 'bg-neutral-900 justify-end' : 'bg-neutral-300 justify-start'
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
              Invoice Templates
            </h1>
            {isPro && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Crown className="w-3 h-3" /> Pro Active
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Choose from ready-to-use professional templates or customize every layout component.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'gallery'
                ? 'bg-white text-neutral-950 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Template Gallery
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'builder'
                ? 'bg-white text-neutral-950 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Custom Builder {!isPro && '🔒'}
          </button>
        </div>
      </div>

      {/* Pro Upsell Alert if on Free and looking at builder */}
      {!isPro && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-neutral-700 rounded-lg text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Unlock Custom Template Builder & Pro Templates
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Pro plan includes clean multi-component customization, company branding, and zero watermarks.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToPricing}
            className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Upgrade to Pro ({sampleInvoice.country === 'IN' ? '₹99/mo' : '$4.99/mo'})
          </button>
        </div>
      )}

      {activeTab === 'gallery' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">
              Available Templates ({allTemplates.length})
            </span>
            <button
              onClick={handleStartNewCustom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Custom Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTemplates.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              const isLocked = tmpl.isPremium && !isPro;
              const isCustom = tmpl.id.startsWith('custom-');

              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    if (isLocked) {
                      onGoToPricing();
                    } else {
                      onSelectDefaultTemplate(tmpl.id);
                    }
                  }}
                  className={`bg-white rounded-xl border p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                      : 'border-neutral-200/90 hover:border-neutral-300'
                  }`}
                >
                  {/* Header of card */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-neutral-950">
                          {tmpl.name}
                        </h3>
                        {tmpl.isPremium && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Pro
                          </span>
                        )}
                        {isCustom && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <>
                            <button
                              onClick={(e) => handleEditTemplate(tmpl, e)}
                              className="p-1 text-neutral-400 hover:text-neutral-900 rounded transition-colors"
                              title="Edit in Custom Builder"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Custom Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isSelected ? (
                          <span className="p-1 bg-neutral-900 text-white rounded-full">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-neutral-400" />
                        ) : null}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                      {tmpl.description}
                    </p>

                    {/* Visual Layout Mockup Snapshot */}
                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 text-[9px] font-mono space-y-2 select-none pointer-events-none">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                        <div
                          className="w-12 h-2.5 rounded-xs"
                          style={{ backgroundColor: tmpl.config.primaryColor }}
                        />
                        <div className="w-8 h-2 bg-neutral-300 rounded-xs" />
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-1.5 bg-neutral-200 rounded-xs col-span-1" />
                        <div className="h-1.5 bg-neutral-200 rounded-xs col-span-2" />
                      </div>
                      <div className="space-y-1 py-1">
                        <div className="h-2 bg-neutral-200 rounded-xs w-full" />
                        <div className="h-2 bg-neutral-100 rounded-xs w-full" />
                        <div className="h-2 bg-neutral-200 rounded-xs w-full" />
                      </div>
                      <div className="flex justify-end pt-1 border-t border-neutral-200">
                        <div
                          className="w-14 h-2.5 rounded-xs"
                          style={{ backgroundColor: tmpl.config.primaryColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Selection Button */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Font: {tmpl.config.font.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      className={`font-semibold px-2.5 py-1 rounded-md text-xs transition-colors ${
                        isSelected
                          ? 'bg-neutral-900 text-white'
                          : isLocked
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {isSelected ? 'Active Default' : isLocked ? 'Unlock with Pro' : 'Set as Default'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Custom Template Builder */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Builder Controls */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neutral-600" />
                  Custom Template Builder
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Add, remove, or customize any invoice component
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                  title="Reset to recommended defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. My Modern Clean Brand"
                className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 font-medium"
              />
            </div>

            {/* 1. Base Styling: Color, Font, Layout, Table */}
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" /> Styling & Typography
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {['#0f172a', '#1e3a8a', '#0d9488', '#15803d', '#4f46e5', '#7c2d12', '#b45309'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setPrimaryColor(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        primaryColor === hex ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-neutral-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-xs bg-neutral-50 border border-neutral-300 rounded-md px-2 py-1.5 w-28 text-neutral-900"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Font Family
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sans', label: 'Modern Sans' },
                    { id: 'serif', label: 'Editorial Serif' },
                    { id: 'mono', label: 'Tabular Mono' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFont(f.id as any)}
                      className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                        font === f.id
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header Layout */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Header Layout Structure
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'split', label: 'Split 2-Column' },
                    { id: 'standard', label: 'Stacked Header' },
                    { id: 'compact', label: 'Compact Strip' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setHeaderLayout(l.id as any)}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                        headerLayout === l.id
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Style */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Line Items Table Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'clean', label: 'Clean Lines' },
                    { id: 'striped', label: 'Zebra Striped' },
                    { id: 'bordered', label: 'Full Grid' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTableStyle(t.id as any)}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                        tableStyle === t.id
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Header & Branding Components Toggles */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Header & Branding Components
              </div>

              <ComponentToggle
                label="Company Logo"
                description="Show business logo on document header"
                checked={showLogo}
                onChange={setShowLogo}
              />

              {showLogo && (
                <div className="pl-4 pr-1 py-2 space-y-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1.5">
                      Company Logo File
                    </label>
                    <LogoUploader
                      logoUrl={business.logoUrl}
                      onLogoChange={handleLogoChange}
                      compact={true}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Logo Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['left', 'center', 'right'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setLogoPosition(pos)}
                          className={`text-[11px] py-1 px-2 rounded border font-medium capitalize cursor-pointer ${
                            logoPosition === pos
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Logo Size
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['small', 'medium', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setLogoSize(sz)}
                          className={`text-[11px] py-1 px-2 rounded border font-medium capitalize cursor-pointer ${
                            logoSize === sz
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <ComponentToggle
                label="Business Details"
                description="Company name, address, phone, email & tax ID"
                checked={showBusinessDetails}
                onChange={setShowBusinessDetails}
              />

              <ComponentToggle
                label="Document Title Badge"
                description="'TAX INVOICE' / 'COMMERCIAL INVOICE' title banner"
                checked={showDocTitle}
                onChange={setShowDocTitle}
              />

              <ComponentToggle
                label="Invoice Meta Card"
                description="Invoice number, issue date, and payment status"
                checked={showInvoiceMeta}
                onChange={setShowInvoiceMeta}
              />

              <ComponentToggle
                label="Due Date / Expiry"
                description="Show due date or quotation validity date"
                checked={showDueDate}
                onChange={setShowDueDate}
              />

              <ComponentToggle
                label="Payment Terms"
                description="Show terms like 'Net 14' or 'Due on Receipt'"
                checked={showPaymentTerms}
                onChange={setShowPaymentTerms}
              />
            </div>

            {/* 3. Customer / Client Section */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Client / Customer Section
              </div>

              <ComponentToggle
                label="Customer Details Card"
                description="Billed To client name, company, address & GSTIN"
                checked={showCustomerDetails}
                onChange={setShowCustomerDetails}
              />
            </div>

            {/* 4. Line Items Table Columns */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5" /> Item Table Columns
              </div>

              <ComponentToggle
                label="Item Code / HSN Column"
                description="Display SKU, product code or HSN/SAC numbers"
                checked={showItemCode}
                onChange={setShowItemCode}
              />

              <ComponentToggle
                label="Units Column / Badge"
                description="Display item unit (hrs, pcs, kg, units)"
                checked={showUnit}
                onChange={setShowUnit}
              />

              <ComponentToggle
                label="Tax / GST % Column"
                description="Display item tax rate percentage"
                checked={showTaxColumn}
                onChange={setShowTaxColumn}
              />

              <ComponentToggle
                label="Discount Column"
                description="Display discount per item row"
                checked={showDiscountColumn}
                onChange={setShowDiscountColumn}
              />
            </div>

            {/* 5. Summary & Footer Sections */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" /> Summary & Footer Sections
              </div>

              <ComponentToggle
                label="Tax Breakdown Summary"
                description="Show detailed CGST, SGST, IGST tax breakdown table"
                checked={showTaxBreakdown}
                onChange={setShowTaxBreakdown}
              />

              <ComponentToggle
                label="Payment Instructions"
                description="Bank name, account number, IFSC, UPI ID"
                checked={showPaymentDetails}
                onChange={setShowPaymentDetails}
              />

              <ComponentToggle
                label="Document Notes"
                description="Custom invoice / quotation notes entered by user"
                checked={showNotes}
                onChange={setShowNotes}
              />

              <ComponentToggle
                label="Terms & Conditions"
                description="Standard legal / business terms and policy"
                checked={showTerms}
                onChange={setShowTerms}
              />

              <ComponentToggle
                label="Authorized Signatory"
                description="Signature box and authorized signatory stamp line"
                checked={showSignatory}
                onChange={setShowSignatory}
              />
            </div>

            {/* Save / Apply Button */}
            <div className="pt-4 border-t border-neutral-100">
              {isPro ? (
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full py-3 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save & Apply Custom Template
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToPricing}
                  className="w-full py-3 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" /> Upgrade to Pro to Save Template
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-7 bg-neutral-100/70 p-4 sm:p-6 rounded-xl border border-neutral-200 sticky top-4">
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Dynamic Template Preview
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                {customName}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
              <InvoicePreview
                invoice={sampleInvoice}
                business={business}
                template={liveCustomTemplate}
                plan={currentPlan}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
