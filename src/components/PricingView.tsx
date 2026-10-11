import React, { useState } from 'react';
import { PlanTier, CountryCode } from '../types';
import { COUNTRIES } from '../lib/constants';
import { Check, Crown, Cloud, HardDrive, MapPin, Globe, Sparkles, ShieldCheck, ShieldAlert, FileText, RotateCcw, AlertTriangle } from 'lucide-react';
import { LegalDocType } from './LegalDocumentViewer';

interface PricingViewProps {
  currentPlan: PlanTier;
  country: CountryCode;
  onSelectPlan: (plan: PlanTier) => void;
  onCountryChange?: (country: CountryCode) => void;
  onOpenLegalDoc?: (type: LegalDocType) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentPlan,
  country,
  onSelectPlan,
  onCountryChange,
  onOpenLegalDoc,
}) => {
  const [justSwitched, setJustSwitched] = useState<string | null>(null);

  const isIndia = country === 'IN';
  const currentCountryConfig = COUNTRIES[country] || COUNTRIES.OTHER;

  const handleSelect = (plan: PlanTier) => {
    onSelectPlan(plan);
    setJustSwitched(plan);
    setTimeout(() => setJustSwitched(null), 3000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
          Simple, Transparent Plans
        </h1>
        <p className="text-sm text-neutral-600">
          Start 100% free with offline local storage. Upgrade for Google Drive sync or Pro watermark-free branding.
        </p>

        {/* Location-based Pricing Banner (India vs Global) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-800 border border-neutral-200">
          {isIndia ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Location: <strong>India</strong> · Showing India Pricing (₹ INR)</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Location: <strong>{currentCountryConfig.name}</strong> · Showing Global Pricing ($ USD)</span>
            </>
          )}

          {/* Quick toggle to test both location pricing states */}
          {onCountryChange && (
            <button
              onClick={() => onCountryChange(isIndia ? 'US' : 'IN')}
              className="ml-2 text-[11px] underline text-neutral-600 hover:text-neutral-950 cursor-pointer font-medium"
            >
              Switch to {isIndia ? 'Global ($)' : 'India (₹)'}
            </button>
          )}
        </div>

        {justSwitched && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg inline-block font-semibold">
            Switched to {justSwitched.toUpperCase()} plan for prototype testing!
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* FREE PLAN */}
        <div
          className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs transition-all relative ${
            currentPlan === 'free'
              ? 'border-neutral-900 ring-2 ring-neutral-900/10'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-neutral-900">Free</h3>
              <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                Always Free
              </span>
            </div>
            <p className="text-xs text-neutral-500 min-h-[32px]">
              Unlimited offline invoicing for freelancers and solo contractors.
            </p>

            <div className="my-6">
              <div className="text-3xl font-extrabold font-mono text-neutral-950">
                {isIndia ? '₹0' : '$0'}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Forever / No credit card</div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited local invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited customer records</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% offline local database</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Clean print & PDF generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Structured JSON backup & restore</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Subtle InvoiceFlow watermark</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelect('free')}
              className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                currentPlan === 'free'
                  ? 'bg-neutral-100 text-neutral-900 cursor-default'
                  : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Continue Free'}
            </button>
          </div>
        </div>

        {/* DRIVE PLAN */}
        <div
          className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs transition-all relative ${
            currentPlan === 'drive'
              ? 'border-neutral-900 ring-2 ring-neutral-900/10'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-neutral-900">Drive</h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Cloud Backup
              </span>
            </div>
            <p className="text-xs text-neutral-500 min-h-[32px]">
              Automatic cloud synchronization using your own Google Drive.
            </p>

            <div className="my-6">
              <div className="text-3xl font-extrabold font-mono text-neutral-950">
                {isIndia ? '₹49' : '$2.99'}
                <span className="text-xs font-normal text-neutral-500">/mo</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Billed monthly</div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 font-medium text-neutral-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everything in Free</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Drive backup & restore</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatic background backup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cross-device restore & sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Default country templates</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Subtle InvoiceFlow watermark</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelect('drive')}
              className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                currentPlan === 'drive'
                  ? 'bg-neutral-100 text-neutral-900 cursor-default'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {currentPlan === 'drive' ? 'Current Plan' : 'Choose Drive'}
            </button>
          </div>
        </div>

        {/* PRO CLOUD PLAN (Highlighted) */}
        <div
          className={`bg-white rounded-2xl border-2 p-6 flex flex-col justify-between shadow-md transition-all relative ${
            currentPlan === 'pro'
              ? 'border-neutral-950 ring-2 ring-neutral-900/10'
              : 'border-neutral-900'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-950 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
            Most Features
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-1.5">
                Pro Cloud <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              </h3>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                Unbranded
              </span>
            </div>
            <p className="text-xs text-neutral-500 min-h-[32px]">
              Full branding control, custom builder, and zero watermarks.
            </p>

            <div className="my-6">
              <div className="text-3xl font-extrabold font-mono text-neutral-950">
                {isIndia ? '₹99' : '$4.99'}
                <span className="text-xs font-normal text-neutral-500">/mo</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Billed monthly</div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 font-medium text-neutral-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everything in Drive</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-neutral-950">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NO InvoiceFlow watermark</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All premium invoice templates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Custom Template Builder</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-device synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom colors, fonts & layouts</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelect('pro')}
              className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                currentPlan === 'pro'
                  ? 'bg-neutral-100 text-neutral-900 cursor-default'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800 shadow-sm'
              }`}
            >
              {currentPlan === 'pro' ? 'Current Plan (Active)' : 'Choose Pro'}
            </button>
          </div>
        </div>
      </div>

      {/* Prototype Testing Notice */}
      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500 max-w-2xl mx-auto">
        <span className="font-semibold text-neutral-700">Prototype Environment Notice:</span>{' '}
        Pricing is tailored to your operating country ({isIndia ? 'India · ₹ INR' : 'Outside India · $ USD'}). Plan selection buttons simulate immediate feature tier activation for testing.
      </div>

      {/* Legal Links Footer */}
      <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
        <button
          type="button"
          onClick={() => onOpenLegalDoc?.('terms')}
          className="hover:text-neutral-900 transition-colors underline cursor-pointer"
        >
          Terms of Service
        </button>
        <span className="text-neutral-300">·</span>
        <button
          type="button"
          onClick={() => onOpenLegalDoc?.('privacy')}
          className="hover:text-neutral-900 transition-colors underline cursor-pointer"
        >
          Privacy Policy
        </button>
        <span className="text-neutral-300">·</span>
        <button
          type="button"
          onClick={() => onOpenLegalDoc?.('refund')}
          className="hover:text-neutral-900 transition-colors underline cursor-pointer"
        >
          Refund Policy
        </button>
        <span className="text-neutral-300">·</span>
        <button
          type="button"
          onClick={() => onOpenLegalDoc?.('disclaimer')}
          className="hover:text-neutral-900 transition-colors underline cursor-pointer"
        >
          Legal & Tax Disclaimer
        </button>
        <span className="text-neutral-300">·</span>
        <button
          type="button"
          onClick={() => onOpenLegalDoc?.('databackup')}
          className="hover:text-neutral-900 transition-colors underline cursor-pointer"
        >
          Data & Backup Policy
        </button>
      </div>
    </div>
  );
};
