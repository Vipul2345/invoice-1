import React, { useState } from 'react';
import { PlanTier, CountryCode } from '../types';
import { COUNTRIES } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Cloud, HardDrive, MapPin, Globe, Sparkles, ShieldCheck, ShieldAlert, FileText, RotateCcw, AlertTriangle, Lock, Clock, LogIn } from 'lucide-react';
import { LegalDocType } from './LegalDocumentViewer';

interface PricingViewProps {
  currentPlan: PlanTier;
  country: CountryCode;
  onSelectPlan: (plan: PlanTier) => void;
  onCountryChange?: (country: CountryCode) => void;
  onOpenLegalDoc?: (type: LegalDocType) => void;
  onRequestAuth?: (plan: PlanTier) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentPlan,
  country,
  onSelectPlan,
  onCountryChange,
  onOpenLegalDoc,
  onRequestAuth,
}) => {
  const { currentUser } = useAuth();
  const [selectedPlanNotice, setSelectedPlanNotice] = useState<string | null>(null);

  const isIndia = country === 'IN';
  const currentCountryConfig = COUNTRIES[country] || COUNTRIES.OTHER;

  const handleFreeSelect = () => {
    onSelectPlan('free');
    setSelectedPlanNotice('Free Plan active: 100% offline local storage.');
    setTimeout(() => setSelectedPlanNotice(null), 4000);
  };

  const handlePaidSelect = (plan: 'drive' | 'pro') => {
    if (!currentUser) {
      if (onRequestAuth) {
        onRequestAuth(plan);
      } else {
        alert('Please create an account or sign in to continue.');
      }
      return;
    }

    onSelectPlan(plan);
    setSelectedPlanNotice(
      plan === 'pro'
        ? '✓ Pro Gold Program activated! Enjoy 100% ad-free & watermark-free exports.'
        : '✓ Drive Plan selected! Connect Google Drive to enable automated cloud backups.'
    );
    setTimeout(() => setSelectedPlanNotice(null), 4000);
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

        {selectedPlanNotice && (
          <div className="p-3 bg-neutral-900 text-white text-xs rounded-xl inline-flex items-center gap-2 font-medium shadow-md animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{selectedPlanNotice}</span>
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
              <div className="text-xs text-neutral-400 mt-0.5">Forever / No account required</div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited local invoices & quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Two-way GST line calculation</span>
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
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Subtle InvoiceFlow watermark</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Sponsored partner banner ads</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleFreeSelect}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                currentPlan === 'free'
                  ? 'bg-neutral-100 text-neutral-900 cursor-default'
                  : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              {currentPlan === 'free' ? 'Current Active Plan' : 'Start Free (No Account)'}
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
              <h3 className="text-lg font-bold text-neutral-900">Drive Plan</h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Google Drive
              </span>
            </div>
            <p className="text-xs text-neutral-500 min-h-[32px]">
              Automatic cloud synchronization using your personal Google Drive.
            </p>

            <div className="my-6">
              <div className="text-3xl font-extrabold font-mono text-neutral-950">
                {isIndia ? '₹49' : '$2.99'}
                <span className="text-xs font-normal text-neutral-500">/mo</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Authentication & Drive permission required</div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 font-medium text-neutral-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everything in Free</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Google Drive backup destination</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Permission to save & modify backups</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cross-device restore & sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Default country templates</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Subtle InvoiceFlow watermark</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="w-4 h-4 text-center text-xs shrink-0 font-bold">·</span>
                <span>Sponsored partner banner ads</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <button
              onClick={() => handlePaidSelect('drive')}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                currentPlan === 'drive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {currentUser ? (
                currentPlan === 'drive' ? (
                  <span>Current Active Plan</span>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Select Drive Plan</span>
                  </>
                )
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in to continue</span>
                </>
              )}
            </button>
            <div className="text-[10px] text-center text-neutral-400">
              {currentUser ? 'Logged in · Requests Google Drive backup permission' : 'Requires authenticated account'}
            </div>
          </div>
        </div>

        {/* PRO GOLD PROGRAM */}
        <div
          className={`bg-white rounded-2xl border-2 p-6 flex flex-col justify-between shadow-md transition-all relative ${
            currentPlan === 'pro'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-neutral-900'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black text-[11px] px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Top Tier</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-1.5">
                Pro Gold Program <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              </h3>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded">
                Zero Ads · Zero Watermark
              </span>
            </div>
            <p className="text-xs text-neutral-500 min-h-[32px]">
              Full branding control, custom builder, unbranded PDFs, and 100% ad-free experience.
            </p>

            <div className="my-6">
              <div className="text-3xl font-extrabold font-mono text-neutral-950">
                {isIndia ? '₹99' : '$4.99'}
                <span className="text-xs font-normal text-neutral-500">/mo</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Authentication required</div>
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
              <div className="flex items-center gap-2 font-bold text-amber-950 bg-amber-50/70 p-1 rounded-md">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                <span>100% Ad-Free (Zero sponsored ads)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All premium invoice & quotation templates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Custom Template Builder (all toggles)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloud Data Sync (Saved in our cloud)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom colors, fonts, layouts & signatures</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <button
              onClick={() => handlePaidSelect('pro')}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                currentPlan === 'pro'
                  ? 'bg-amber-500 text-neutral-950 font-extrabold'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800'
              }`}
            >
              {currentUser ? (
                currentPlan === 'pro' ? (
                  <span>Current Active Plan</span>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Select Pro Gold Program</span>
                  </>
                )
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in to continue</span>
                </>
              )}
            </button>
            <div className="text-[10px] text-center text-neutral-400">
              {currentUser ? 'Logged in · Activates unbranded exports & ad-free UI' : 'Requires authenticated account'}
            </div>
          </div>
        </div>
      </div>

      {/* Honest Transparency Notice */}
      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-600 max-w-2xl mx-auto space-y-1">
        <span className="font-bold text-neutral-800 block">Transparent Testing Architecture</span>
        <p>
          Free mode works 100% offline without registration. Drive & Pro tiers require account creation. Subscriptions will only activate when real payment gateways are connected.
        </p>
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
