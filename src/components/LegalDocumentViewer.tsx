import React from 'react';
import {
  PRIVACY_POLICY_TEXT,
  TERMS_OF_SERVICE_TEXT,
  DATA_BACKUP_POLICY_TEXT,
  DISCLAIMER_TEXT,
  REFUND_POLICY_TEXT,
  SUPPORT_EMAIL,
  APP_VERSION,
  LAST_UPDATED_DATE,
} from '../lib/legalAndHelpContent';
import {
  ShieldCheck,
  FileText,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  Printer,
  ArrowLeft,
  Mail,
  CheckCircle,
} from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms' | 'databackup' | 'disclaimer' | 'refund';

interface LegalDocumentViewerProps {
  docType: LegalDocType;
  onBack?: () => void;
  onNavigateDoc?: (type: LegalDocType) => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  docType,
  onBack,
  onNavigateDoc,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const docTitles: Record<LegalDocType, { title: string; subtitle: string; icon: any }> = {
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How information is held locally and handled within the InvoiceFlow application.',
      icon: ShieldCheck,
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'The agreement between you and InvoiceFlow governing product usage and responsibilities.',
      icon: FileText,
    },
    databackup: {
      title: 'Data & Backup Responsibility Policy',
      subtitle: 'Clear, transparent explanation of where your invoice records live and how to protect them.',
      icon: HardDrive,
    },
    disclaimer: {
      title: 'Legal & Tax Disclaimer',
      subtitle: 'Statutory non-advice disclaimer and jurisdiction tax compliance responsibility.',
      icon: AlertTriangle,
    },
    refund: {
      title: 'Refund Policy',
      subtitle: 'Commercial subscription cancellation, refund structure, and prototype billing status.',
      icon: RotateCcw,
    },
  };

  const meta = docTitles[docType];
  const Icon = meta.icon;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header & Navigation Bar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-neutral-700" />
              <h1 className="text-xl font-extrabold text-neutral-950 tracking-tight">
                {meta.title}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Document
          </button>
        </div>
      </div>

      {/* Document Tab Switcher */}
      {onNavigateDoc && (
        <div className="no-print flex items-center gap-1 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'privacy' as LegalDocType, label: 'Privacy Policy' },
            { id: 'terms' as LegalDocType, label: 'Terms of Service' },
            { id: 'databackup' as LegalDocType, label: 'Data & Backup' },
            { id: 'disclaimer' as LegalDocType, label: 'Legal Disclaimer' },
            { id: 'refund' as LegalDocType, label: 'Refund Policy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigateDoc(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                docType === tab.id
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-950 bg-white border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Document Body */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-neutral-200/90 shadow-sm text-neutral-800 leading-relaxed text-sm">
        {/* Meta Bar */}
        <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-wrap items-center justify-between text-xs text-neutral-500 gap-2">
          <div>
            <span className="font-semibold text-neutral-700">InvoiceFlow</span> · Version {APP_VERSION}
          </div>
          <div>
            Last Updated: <span className="font-medium text-neutral-800">{LAST_UPDATED_DATE}</span>
          </div>
        </div>

        {/* 1. PRIVACY POLICY */}
        {docType === 'privacy' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700">
              <span className="font-bold text-neutral-900 block mb-1">Architecture Summary:</span>
              InvoiceFlow currently operates as a local-first application prototype. Your invoices, client directories, and business profile details exist on your local device. We do not operate remote user tracking databases or monetize your information.
            </div>

            <div className="space-y-6">
              {PRIVACY_POLICY_TEXT.sections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="font-bold text-neutral-950 text-base">
                    {section.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-xs sm:text-sm">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. TERMS OF SERVICE */}
        {docType === 'terms' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700">
              <span className="font-bold text-neutral-900 block mb-1">Overview:</span>
              These Terms outline your rights, data responsibilities, and appropriate usage of the InvoiceFlow platform. The Free tier provides unlimited local invoices without mandatory account registration.
            </div>

            <div className="space-y-6">
              {TERMS_OF_SERVICE_TEXT.sections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="font-bold text-neutral-950 text-base">
                    {section.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-xs sm:text-sm">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DATA & BACKUP RESPONSIBILITY POLICY */}
        {docType === 'databackup' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-950">
                Data Ownership and Storage Realities
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600">
                {DATA_BACKUP_POLICY_TEXT.overview}
              </p>
            </div>

            {/* Visual Storage Architecture Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Free Plan
                  </span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="font-mono text-xs text-neutral-800 space-y-1 bg-white p-3 rounded-lg border border-neutral-200">
                  <div className="font-bold text-neutral-950">User's Device</div>
                  <div className="text-neutral-400">↓ (Stored locally)</div>
                  <div className="font-semibold text-neutral-900">InvoiceFlow Local DB</div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Your invoices are stored exclusively on this device. No mandatory cloud account is required.
                </p>
              </div>

              {/* Drive Plan */}
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Drive Plan
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    $2.99 / ₹49
                  </span>
                </div>
                <div className="font-mono text-xs text-neutral-800 space-y-1 bg-white p-3 rounded-lg border border-neutral-200">
                  <div className="font-bold text-neutral-950">User's Device</div>
                  <div className="text-neutral-400">↓ (Local DB)</div>
                  <div className="font-semibold text-neutral-900">InvoiceFlow Local</div>
                  <div className="text-neutral-400">↓ (Encrypted archive)</div>
                  <div className="font-bold text-blue-700">User's Google Drive</div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Google Drive backup keeps encrypted copies inside your personal Google account under your authorization. Not stored on InvoiceFlow servers.
                </p>
              </div>

              {/* Pro Cloud Plan */}
              <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Pro Cloud Plan
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Coming Soon
                  </span>
                </div>
                <div className="font-mono text-xs text-neutral-800 space-y-1 bg-white p-3 rounded-lg border border-neutral-200">
                  <div className="font-bold text-neutral-950">User's Device</div>
                  <div className="text-neutral-400">↓ (Continuous Sync)</div>
                  <div className="font-bold text-amber-700">InvoiceFlow Cloud</div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Future managed cloud storage for multi-device collaboration. Clearly marked as a planned roadmap service.
                </p>
              </div>
            </div>

            {/* Critical Data Responsibility Card */}
            <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <h3 className="font-bold text-sm">
                  Important Notice on Local-First Data Risks
                </h3>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Because InvoiceFlow Free does not rely on a centralized cloud database, your data exists solely on the hardware and browser profile you use. Locally stored data can become permanently unavailable if:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-rose-800">
                {DATA_BACKUP_POLICY_TEXT.scenarios.map((sc, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-rose-500">·</span>
                    <span>{sc}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-rose-200/60 text-xs font-semibold text-rose-900">
                InvoiceFlow does not guarantee recovery of data that exists only on your device. Users are responsible for regularly exporting JSON backups.
              </div>
            </div>
          </div>
        )}

        {/* 4. DISCLAIMER */}
        {docType === 'disclaimer' && (
          <div className="space-y-6">
            <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Non-Professional Advice Notice</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {DISCLAIMER_TEXT.statement}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-neutral-950 text-base">
                Tax and Local Jurisdiction Compliance
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {DISCLAIMER_TEXT.jurisdictionNote}
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-2">
              <div className="font-bold text-neutral-900">Summary of User Responsibilities:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Verify your customer's legal tax identification (GSTIN, VAT ID, EIN) before issuing.</li>
                <li>Ensure tax percentages (e.g., CGST, SGST, IGST, State Sales Tax, VAT) match current local rates.</li>
                <li>Retain fiscal copies in accordance with your local jurisdiction's statutory records retention laws.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 5. REFUND POLICY */}
        {docType === 'refund' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700">
              <span className="font-bold text-neutral-900 block mb-1">Status:</span>
              {REFUND_POLICY_TEXT.statusNotice}
            </div>

            <div className="space-y-6">
              {REFUND_POLICY_TEXT.sections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="font-bold text-neutral-950 text-base">
                    {section.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-xs sm:text-sm">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Contact Footer */}
        <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 gap-3">
          <div>
            Have questions about this document? Contact{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-neutral-900 hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="font-mono text-[11px] text-neutral-400">
            InvoiceFlow · {LAST_UPDATED_DATE}
          </div>
        </div>
      </div>
    </div>
  );
};
