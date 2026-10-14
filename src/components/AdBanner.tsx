import React, { useState } from 'react';
import { PlanTier } from '../types';
import { Crown, ExternalLink, Sparkles, X, Shield, ArrowRight } from 'lucide-react';

interface AdBannerProps {
  plan: PlanTier;
  onUpgradeClick?: () => void;
  className?: string;
}

interface SponsorAd {
  id: string;
  badge: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  iconBg: string;
}

const SAMPLE_ADS: SponsorAd[] = [
  {
    id: 'ad-gst',
    badge: 'Sponsored Partner',
    title: 'FastGST — Automated E-Invoicing & GST Returns',
    description: 'Reconcile GSTINs, generate E-way bills in seconds, and file monthly returns with 100% compliance guarantee.',
    ctaText: 'Explore FastGST',
    ctaUrl: 'https://gst.gov.in',
    iconBg: 'bg-emerald-600',
  },
  {
    id: 'ad-cloud',
    badge: 'Featured Sponsor',
    title: 'CloudNode — Premium NVMe SSD Hosting for Business',
    description: 'Ultra-fast web servers with 99.99% uptime, free SSL certificates, and 24/7 dedicated enterprise engineering support.',
    ctaText: 'Get 50% Off Cloud',
    ctaUrl: 'https://cloud.google.com',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'ad-payments',
    badge: 'Payment Partner',
    title: 'PaySwift — Collect Payments Directly on Invoices',
    description: 'Integrate UPI, Credit Cards, and NetBanking checkout links directly into your customer communications with instant settlement.',
    ctaText: 'Start Accepting UPI',
    ctaUrl: 'https://www.npci.org.in',
    iconBg: 'bg-indigo-600',
  },
];

export const AdBanner: React.FC<AdBannerProps> = ({
  plan,
  onUpgradeClick,
  className = '',
}) => {
  const [adIndex, setAdIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // CRITICAL RULE: If user is on Pro Gold Program ('pro'), NO ADS ARE SHOWN!
  if (plan === 'pro' || isDismissed) {
    return null;
  }

  const currentAd = SAMPLE_ADS[adIndex % SAMPLE_ADS.length];

  const handleNextAd = () => {
    setAdIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
  };

  return (
    <div
      className={`my-4 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 border border-neutral-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs relative overflow-hidden transition-all ${className}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Ad Content */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl ${currentAd.iconBg} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs`}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700">
                {currentAd.badge}
              </span>
              <span className="text-[10px] text-neutral-400">
                Ads appear on Free & Drive plans
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight truncate">
              {currentAd.title}
            </h4>
            <p className="text-xs text-neutral-600 line-clamp-2 md:line-clamp-1 mt-0.5">
              {currentAd.description}
            </p>
          </div>
        </div>

        {/* Right Side: Ad Action + Remove Ads with Pro Gold */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200/60">
          <a
            href={currentAd.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <span>{currentAd.ctaText}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer group"
              title="Upgrade to Pro Gold Program to remove all ads and watermarks"
            >
              <Crown className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950 group-hover:scale-110 transition-transform" />
              <span>Remove Ads with Pro Gold</span>
            </button>
          )}

          {/* Quick cycle or dismiss */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNextAd}
              className="text-[10px] text-neutral-400 hover:text-neutral-700 px-1 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Next sponsored partner"
            >
              Next Ad
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Dismiss for this session"
              aria-label="Dismiss advertisement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
