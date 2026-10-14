import React, { useState } from 'react';
import { CountryCode } from '../types';
import { COUNTRIES } from '../lib/constants';
import { CheckCircle2, ShieldCheck, Zap, Globe, ArrowRight, MapPin } from 'lucide-react';

interface OnboardingModalProps {
  initialCountry: CountryCode;
  onStartFree: (country: CountryCode) => void;
  onSeePlans: (country: CountryCode) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialCountry,
  onStartFree,
  onSeePlans,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry || 'IN');

  const isIndia = selectedCountry === 'IN';
  const countryConfig = COUNTRIES[selectedCountry] || COUNTRIES.OTHER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in duration-200">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-950 text-white font-extrabold text-xl shadow-sm mb-1">
            IF
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-950">
            Create professional invoices in seconds.
          </h2>
          <p className="text-sm font-medium text-neutral-500">
            Simple. Offline. No account required.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="my-6 grid grid-cols-3 gap-2 py-3 px-4 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
          <div>
            <div className="text-xs font-bold text-neutral-900">Local-First</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Works offline</div>
          </div>
          <div className="border-x border-neutral-200">
            <div className="text-xs font-bold text-neutral-900">Zero Sign-Up</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Immediate start</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900">Unlimited</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Free forever</div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Where is your business located?
            </label>
            <span className="text-[10px] text-neutral-500 font-medium">
              Determines pricing & currency
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
            >
              {Object.values(COUNTRIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code === 'IN' ? '🇮🇳 ' : '🌐 '}{c.name} ({c.currencySymbol} {c.currency} · {c.taxLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing indicator banner based on selected location */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-neutral-900">
              {isIndia ? <MapPin className="w-3.5 h-3.5 text-emerald-600" /> : <Globe className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isIndia ? 'India Pricing will be applied:' : 'Global Pricing will be applied:'}</span>
            </div>
            <div className="text-[11px] text-neutral-600 font-mono">
              {isIndia ? (
                <span>Free: ₹0 · Drive Plan: ₹49/mo · Pro Gold: ₹99/mo</span>
              ) : (
                <span>Free: $0 · Drive Plan: $2.99/mo · Pro Gold: $4.99/mo</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => onStartFree(selectedCountry)}
            className="w-full py-3 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeePlans(selectedCountry)}
            className="w-full py-2.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            See Plans for {isIndia ? 'India (₹)' : 'Global ($)'}
          </button>
        </div>
      </div>
    </div>
  );
};
