import React, { useState } from 'react';
import { InvoiceTemplate, PlanTier, TemplateConfig, BusinessProfile, Invoice } from '../types';
import { DEFAULT_TEMPLATES } from '../lib/constants';
import { saveCustomTemplate, deleteCustomTemplate } from '../lib/storage';
import { InvoicePreview } from './InvoicePreview';
import {
  LayoutTemplate,
  Crown,
  Check,
  Palette,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Lock,
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
}) => {
  const isPro = currentPlan === 'pro';
  const [activeTab, setActiveTab] = useState<'gallery' | 'builder'>('gallery');

  // Custom Template Builder state
  const [customName, setCustomName] = useState('My Custom Brand');
  const [primaryColor, setPrimaryColor] = useState('#1e293b');
  const [font, setFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [headerLayout, setHeaderLayout] = useState<'standard' | 'split' | 'compact'>('split');
  const [tableStyle, setTableStyle] = useState<'clean' | 'striped' | 'bordered'>('clean');
  const [showLogo, setShowLogo] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);

  // Live preview template object
  const liveCustomTemplate: InvoiceTemplate = {
    id: `custom-preview`,
    name: customName || 'Custom Template',
    description: 'Customized layout design',
    isPremium: true,
    style: 'custom',
    config: {
      primaryColor,
      font,
      showLogo,
      showTaxBreakdown,
      showPaymentDetails,
      headerLayout,
      tableStyle,
      accentIntensity: 'bold',
    },
  };

  const handleSaveCustom = () => {
    const newTemplate: InvoiceTemplate = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'My Custom Brand',
      description: 'Handcrafted custom invoice styling',
      isPremium: true,
      style: 'custom',
      config: {
        primaryColor,
        font,
        showLogo,
        showTaxBreakdown,
        showPaymentDetails,
        headerLayout,
        tableStyle,
        accentIntensity: 'bold',
      },
    };
    saveCustomTemplate(newTemplate);
    onTemplatesUpdated();
    onSelectDefaultTemplate(newTemplate.id);
    setActiveTab('gallery');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this custom template?')) {
      deleteCustomTemplate(id);
      onTemplatesUpdated();
    }
  };

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
            Choose from standard and premium invoice formats or create a custom layout with Pro.
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

      {/* Pro Upsell Alert if on Free/Drive and looking at builder */}
      {!isPro && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-neutral-700 rounded-lg text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Unlock Premium Templates & Custom Builder
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Pro plan includes zero watermarks, corporate & contractor layouts, and live styling customization.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTemplates.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            const isLocked = tmpl.isPremium && !isPro;

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
                    </div>

                    <div className="flex items-center gap-1">
                      {tmpl.id.startsWith('custom-') && (
                        <button
                          onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
      ) : (
        /* Custom Template Builder */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Builder Controls */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-500" />
                Template Styling
              </h3>
              {!isPro && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Pro Feature Preview
                </span>
              )}
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
                placeholder="e.g. Acme Minimal Black"
                className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Primary Accent Color */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Primary Accent Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                {['#0f172a', '#1e3a8a', '#0d9488', '#4f46e5', '#7c2d12', '#18181b'].map((hex) => (
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

            {/* Typography */}
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
                Header Layout
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'split', label: 'Split Two-Column' },
                  { id: 'standard', label: 'Standard Stacked' },
                  { id: 'compact', label: 'Compact Band' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setHeaderLayout(l.id as any)}
                    className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-colors cursor-pointer ${
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
                Table Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'clean', label: 'Clean Lines' },
                  { id: 'striped', label: 'Zebra Striped' },
                  { id: 'bordered', label: 'Full Bordered' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTableStyle(t.id as any)}
                    className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-colors cursor-pointer ${
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

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="flex items-center justify-between text-xs font-medium text-neutral-700 cursor-pointer">
                <span>Show Tax Breakdown</span>
                <input
                  type="checkbox"
                  checked={showTaxBreakdown}
                  onChange={(e) => setShowTaxBreakdown(e.target.checked)}
                  className="rounded text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-medium text-neutral-700 cursor-pointer">
                <span>Show Payment Instructions</span>
                <input
                  type="checkbox"
                  checked={showPaymentDetails}
                  onChange={(e) => setShowPaymentDetails(e.target.checked)}
                  className="rounded text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-neutral-100">
              {isPro ? (
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save & Apply Custom Template
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToPricing}
                  className="w-full py-2.5 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" /> Upgrade to Pro to Save Template
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-7 bg-neutral-100/60 p-4 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-500 font-medium">
              <span>Live Interactive Layout Preview</span>
              <span className="font-mono text-[11px]">{customName}</span>
            </div>
            <div className="overflow-hidden rounded-lg">
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
