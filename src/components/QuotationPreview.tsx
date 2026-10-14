import React, { useState } from 'react';
import { Quotation, InvoiceTemplate, PlanTier, BusinessProfile, QuotationStatus } from '../types';
import { COUNTRIES } from '../lib/constants';
import { formatCurrency } from '../lib/storage';
import { downloadQuotationPdf } from '../lib/pdfGenerator';
import { calculateDocumentTotals } from '../lib/taxCalculations';
import {
  Printer,
  Download,
  Share2,
  Edit3,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Loader2,
  Check,
  FileCheck,
  XCircle,
} from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  business: BusinessProfile;
  template: InvoiceTemplate;
  plan: PlanTier;
  onEdit?: () => void;
  onBack?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (status: QuotationStatus) => void;
  onConvertToInvoice?: (quotationId: string) => void;
  onTemplateChange?: (templateId: string) => void;
  availableTemplates?: InvoiceTemplate[];
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  business,
  template,
  plan,
  onEdit,
  onBack,
  onDuplicate,
  onStatusChange,
  onConvertToInvoice,
  onTemplateChange,
  availableTemplates = [],
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const countryConfig = COUNTRIES[quotation.country] || COUNTRIES.OTHER;
  const isIndia = quotation.country === 'IN';
  const showWatermark = plan !== 'pro';

  // Compute live tax breakdown from lines
  const docTotals = calculateDocumentTotals(quotation.items, { isIndia });

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfStatus('Generating Quotation PDF...');
    try {
      const result = await downloadQuotationPdf({
        quotation,
        elementId: 'quotation-document',
        onProgress: (status) => setPdfStatus(status),
      });

      if (result.success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } else {
        alert(`Could not generate PDF: ${result.error || 'Please try again'}`);
      }
    } catch (err) {
      console.error('Quotation PDF error:', err);
      alert('Unable to generate PDF. Please ensure browser permissions are allowed.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfStatus('');
    }
  };

  const handlePrint = () => {
    if (
      typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.isNativePlatform?.()
    ) {
      handleDownloadPdf();
      return;
    }
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `Quotation ${quotation.quotationNumber}
To: ${quotation.customerSnapshot.name} (${quotation.customerSnapshot.company})
Date: ${quotation.date}
Valid Until: ${quotation.validUntil}
Amount: ${formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
Status: ${quotation.status.toUpperCase()}
Subject to agreement and terms.`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: QuotationStatus) => {
    if (quotation.convertedInvoiceId) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
          <FileCheck className="w-3.5 h-3.5 text-blue-600" /> CONVERTED
        </span>
      );
    }

    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> SENT
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md">
            <FileText className="w-3.5 h-3.5" /> DRAFT
          </span>
        );
    }
  };

  const isCustom = template.style === 'custom' || template.id.startsWith('custom-');
  const isCleanProfessional = !isCustom && (template.style === 'clean-professional' || template.id === 'clean-professional');
  const isDetailedBusiness = !isCustom && (template.style === 'detailed-business' || template.id === 'detailed-business');
  const isModernMinimal = !isCustom && !isCleanProfessional && !isDetailedBusiness;

  const primaryColor = isCustom
    ? (template.config.primaryColor || '#1e293b')
    : (isCleanProfessional ? '#15803d' : '#0f172a');

  // Custom component toggles
  const showBusinessDetails = isCustom ? (template.config.showBusinessDetails !== false) : true;
  const showCustomerDetails = isCustom ? (template.config.showCustomerDetails !== false) : true;
  const showDocTitle = isCustom ? (template.config.showDocTitle !== false) : true;
  const showInvoiceMeta = isCustom ? (template.config.showInvoiceMeta !== false) : true;
  const showDueDate = isCustom ? (template.config.showDueDate !== false) : true;
  const showPaymentTerms = isCustom ? (template.config.showPaymentTerms !== false) : true;
  const showItemCode = isCustom ? (template.config.showItemCode !== false) : isDetailedBusiness;
  const showUnit = isCustom ? (template.config.showUnit !== false) : isDetailedBusiness;
  const showTaxColumn = isCustom ? (template.config.showTaxColumn !== false) : true;
  const showDiscountColumn = isCustom ? (template.config.showDiscountColumn === true) : false;
  const showTaxBreakdown = isCustom ? (template.config.showTaxBreakdown !== false) : true;
  const showPaymentDetails = template.config.showPaymentDetails !== false;
  const showNotes = isCustom ? (template.config.showNotes !== false) : true;
  const showTerms = isCustom ? (template.config.showTerms !== false) : true;
  const showSignatory = isCustom ? (template.config.showSignatory === true) : isDetailedBusiness;
  const headerLayout = isCustom ? (template.config.headerLayout || 'split') : 'split';
  const tableStyle = isCustom ? (template.config.tableStyle || 'clean') : 'clean';

  const fontClass =
    template.config.font === 'serif'
      ? 'font-serif'
      : template.config.font === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const shouldShowLogo = template.config.showLogo !== false && !!business.logoUrl;
  const logoPosition = template.config.logoPosition || 'left';
  const logoSize = template.config.logoSize || 'medium';
  const logoSizeClass =
    logoSize === 'small'
      ? 'max-h-11 max-w-[140px]'
      : logoSize === 'large'
      ? 'max-h-24 max-w-[280px]'
      : 'max-h-16 max-w-[200px]';

  const renderLogo = (alignment: 'left' | 'center' | 'right') => {
    if (!shouldShowLogo) return null;
    return (
      <div className={`mb-3 flex ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-start sm:justify-end' : 'justify-start'}`}>
        <img
          src={business.logoUrl}
          alt={business.name || 'Company Logo'}
          className={`${logoSizeClass} object-contain rounded-xs`}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Top Controls Bar */}
      <div className="no-print mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
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
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                {quotation.quotationNumber}
              </h2>
              {getStatusBadge(quotation.status)}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Quotation / Estimate · Valid until {quotation.validUntil} · {quotation.customerSnapshot.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent Convert to Invoice Button */}
          {onConvertToInvoice && (
            <button
              onClick={() => onConvertToInvoice(quotation.id)}
              disabled={!!quotation.convertedInvoiceId}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer ${
                quotation.convertedInvoiceId
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={
                quotation.convertedInvoiceId
                  ? 'Quotation has already been converted to an invoice'
                  : 'Convert this quotation into an official invoice'
              }
            >
              <FileCheck className="w-4 h-4" />
              <span>{quotation.convertedInvoiceId ? 'Converted to Invoice' : 'Convert to Invoice'}</span>
            </button>
          )}

          {availableTemplates.length > 0 && onTemplateChange && (
            <div className="flex items-center gap-1.5 mr-2">
              <label htmlFor="quo-template-select" className="text-xs font-medium text-neutral-500">
                Template:
              </label>
              <select
                id="quo-template-select"
                value={template.id}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onStatusChange && !quotation.convertedInvoiceId && (
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => onStatusChange('accepted')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  quotation.status === 'accepted' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => onStatusChange('sent')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  quotation.status === 'sent' ? 'bg-white shadow-xs text-indigo-700 font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Sent
              </button>
            </div>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-75"
            title="Generate and download A4 Quotation PDF"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isGeneratingPdf ? (pdfStatus || 'Generating...') : downloadSuccess ? 'PDF Ready!' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Print quotation"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900">Share Quotation</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Download quotation PDF file or copy text summary.
            </p>

            <div className="mt-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 font-mono text-xs text-neutral-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Document:</span>
                <span className="font-bold">{quotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Client:</span>
                <span>{quotation.customerSnapshot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Valid Until:</span>
                <span>{quotation.validUntil}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Quoted Total:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  handleDownloadPdf();
                }}
                disabled={isGeneratingPdf}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Quotation PDF
              </button>

              <button
                onClick={handleCopySummary}
                className="w-full py-2.5 px-4 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Summary Copied to Clipboard!' : 'Copy Text Summary'}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Paper Canvas */}
      <div className="flex justify-center w-full overflow-x-auto pb-12">
        <div
          id="quotation-document"
          className={`invoice-print-container w-full max-w-[820px] bg-white rounded-lg shadow-md border border-neutral-200 p-8 md:p-12 text-neutral-900 relative ${fontClass}`}
          style={{ minHeight: '1050px' }}
        >
          {/* Header clearly identifies document as QUOTATION / ESTIMATE */}
          {isCleanProfessional ? (
            <div>
              <div className="border-b-2 border-emerald-600 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    {renderLogo('left')}
                    <div className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded bg-emerald-600 text-white mb-2">
                      OFFICIAL QUOTATION
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                      {business.name || 'Your Business Name'}
                    </h1>
                    <div className="mt-1 text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                      {business.address}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">
                      {business.email && <span>{business.email} · </span>}
                      {business.phone && <span>{business.phone}</span>}
                    </div>
                    {business.taxId && (
                      <div className="mt-1 text-xs font-semibold text-emerald-800">
                        {countryConfig.taxIdLabel}: {business.taxId}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 min-w-[210px]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Quotation Number
                    </div>
                    <div className="text-2xl font-black font-mono tracking-tight text-neutral-950 mt-0.5">
                      {quotation.quotationNumber}
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      <div>
                        <span className="text-neutral-500">Date Issued:</span>{' '}
                        <span className="font-semibold text-neutral-900">{quotation.date}</span>
                      </div>
                      <div className="text-emerald-900 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded mt-1">
                        <span>Valid Until:</span>{' '}
                        <span>{quotation.validUntil}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Quoted For
                  </div>
                  <div className="text-base font-bold text-neutral-900">
                    {quotation.customerSnapshot.name}
                  </div>
                  {quotation.customerSnapshot.company && (
                    <div className="text-xs font-semibold text-neutral-700">
                      {quotation.customerSnapshot.company}
                    </div>
                  )}
                  {quotation.customerSnapshot.address && (
                    <div className="text-xs text-neutral-600 whitespace-pre-line mt-1 leading-relaxed">
                      {quotation.customerSnapshot.address}
                    </div>
                  )}
                  <div className="text-xs text-neutral-600 mt-1">
                    {quotation.customerSnapshot.email && <div>{quotation.customerSnapshot.email}</div>}
                    {quotation.customerSnapshot.phone && <div>{quotation.customerSnapshot.phone}</div>}
                  </div>
                  {quotation.customerSnapshot.taxId && (
                    <div className="text-xs font-semibold text-neutral-800 mt-1.5">
                      {countryConfig.taxIdLabel}: {quotation.customerSnapshot.taxId}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-emerald-600 text-white rounded-xl flex flex-col justify-between items-start sm:items-end">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    Total Estimated Amount
                  </div>
                  <div className="text-3xl font-black tracking-tight font-mono">
                    {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                  </div>
                  <div className="text-xs text-emerald-100">
                    Pricing guaranteed through <span className="font-bold text-white">{quotation.validUntil}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isDetailedBusiness ? (
            <div>
              <div className="border-b-2 border-neutral-900 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    {renderLogo('left')}
                    <div className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">
                      FORMAL PRICE ESTIMATE / QUOTATION
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
                      {business.name || 'Your Business Name'}
                    </h1>
                    <div className="mt-1 text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                      {business.address}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600 space-x-2">
                      {business.email && <span>Email: {business.email}</span>}
                      {business.phone && <span>· Phone: {business.phone}</span>}
                    </div>
                    {business.taxId && (
                      <div className="mt-1 text-xs font-mono font-bold text-neutral-800">
                        {countryConfig.taxIdLabel}: {business.taxId}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right border-l-2 border-neutral-200 pl-4 space-y-1 text-xs">
                    <div className="text-sm font-black font-mono uppercase text-neutral-900">
                      QUOTATION #{quotation.quotationNumber}
                    </div>
                    <div>Date: <span className="font-semibold text-neutral-900">{quotation.date}</span></div>
                    <div className="text-amber-800 font-bold">Valid Until: <span>{quotation.validUntil}</span></div>
                    <div>Terms: <span className="font-medium text-neutral-800">{quotation.paymentTerms || 'Net 14'}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Client Details
                  </div>
                  <div className="text-sm font-bold text-neutral-900">{quotation.customerSnapshot.name}</div>
                  {quotation.customerSnapshot.company && (
                    <div className="text-xs font-medium text-neutral-700">{quotation.customerSnapshot.company}</div>
                  )}
                  {quotation.customerSnapshot.address && (
                    <div className="text-xs text-neutral-600 whitespace-pre-line mt-1">{quotation.customerSnapshot.address}</div>
                  )}
                </div>

                <div className="sm:text-right flex flex-col justify-end">
                  <div className="text-[11px] text-neutral-500">Estimated Total:</div>
                  <div className="text-2xl font-black font-mono text-neutral-950">
                    {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                  </div>
                </div>
              </div>
            </div>
          ) : isCustom ? (
            /* ============================================================== */
            /* TEMPLATE CUSTOM: USER CONFIGURED DYNAMIC QUOTATION             */
            /* ============================================================== */
            <div>
              {/* Custom Header Layout */}
              {headerLayout === 'split' ? (
                <div
                  className="pb-6 mb-6"
                  style={{ borderBottom: `2px solid ${primaryColor}` }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      {showLogo && renderLogo(logoPosition)}
                      {showDocTitle && (
                        <div
                          className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded text-white mb-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                          QUOTATION / ESTIMATE
                        </div>
                      )}
                      {showBusinessDetails && (
                        <>
                          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                            {business.name || 'Your Business Name'}
                          </h1>
                          {business.address && (
                            <div className="mt-1 text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                              {business.address}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-neutral-600">
                            {business.email && <span>{business.email} · </span>}
                            {business.phone && <span>{business.phone}</span>}
                            {business.website && <span> · {business.website}</span>}
                          </div>
                          {business.taxId && (
                            <div className="mt-1 text-xs font-semibold" style={{ color: primaryColor }}>
                              {countryConfig.taxIdLabel}: {business.taxId}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {showInvoiceMeta && (
                      <div
                        className="sm:text-right p-4 rounded-xl border min-w-[200px]"
                        style={{
                          borderColor: `${primaryColor}33`,
                          backgroundColor: `${primaryColor}0d`,
                        }}
                      >
                        <div
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: primaryColor }}
                        >
                          Quotation Number
                        </div>
                        <div className="text-2xl font-black font-mono tracking-tight text-neutral-950 mt-0.5">
                          {quotation.quotationNumber}
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <div>
                            <span className="text-neutral-500">Date:</span>{' '}
                            <span className="font-semibold text-neutral-900">{quotation.date}</span>
                          </div>
                          {showDueDate && (
                            <div>
                              <span className="text-neutral-500">Valid Until:</span>{' '}
                              <span className="font-semibold text-neutral-900">{quotation.validUntil}</span>
                            </div>
                          )}
                          {showPaymentTerms && (
                            <div>
                              <span className="text-neutral-500">Terms:</span>{' '}
                              <span className="font-medium text-neutral-800">{quotation.paymentTerms || 'Net 14'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : headerLayout === 'standard' ? (
                <div
                  className="pb-6 mb-6"
                  style={{ borderBottom: `2px solid ${primaryColor}` }}
                >
                  <div className="mb-4">
                    {showLogo && renderLogo(logoPosition)}
                    {showBusinessDetails && (
                      <div className={logoPosition === 'center' ? 'text-center' : logoPosition === 'right' ? 'text-right' : 'text-left'}>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                          {business.name || 'Your Business Name'}
                        </h1>
                        {business.address && (
                          <div className="mt-1 text-xs text-neutral-600 whitespace-pre-line">
                            {business.address}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-neutral-600">
                          {business.email && <span>{business.email} · </span>}
                          {business.phone && <span>{business.phone}</span>}
                          {business.website && <span> · {business.website}</span>}
                        </div>
                        {business.taxId && (
                          <div className="mt-1 text-xs font-semibold" style={{ color: primaryColor }}>
                            {countryConfig.taxIdLabel}: {business.taxId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-neutral-200">
                    {showDocTitle && (
                      <div
                        className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        QUOTATION / ESTIMATE
                      </div>
                    )}
                    {showInvoiceMeta && (
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-neutral-500">QUOTATION:</span>{' '}
                          <span className="font-bold text-neutral-900">{quotation.quotationNumber}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">DATE:</span>{' '}
                          <span className="font-semibold">{quotation.date}</span>
                        </div>
                        {showDueDate && (
                          <div>
                            <span className="text-neutral-500">VALID:</span>{' '}
                            <span className="font-semibold">{quotation.validUntil}</span>
                          </div>
                        )}
                        {showPaymentTerms && (
                          <div>
                            <span className="text-neutral-500">TERMS:</span>{' '}
                            <span className="font-medium">{quotation.paymentTerms || 'Net 14'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Compact Strip Header */
                <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: `${primaryColor}40` }}>
                  <div
                    className="p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      {showLogo && renderLogo('left')}
                      <div>
                        {showDocTitle && (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                            QUOTATION / ESTIMATE
                          </div>
                        )}
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {business.name || 'Your Business Name'}
                        </h1>
                      </div>
                    </div>
                    {showInvoiceMeta && (
                      <div className="sm:text-right font-mono">
                        <div className="text-lg font-black text-white">{quotation.quotationNumber}</div>
                        <div className="text-xs text-white/90">Date: {quotation.date}</div>
                        {showDueDate && <div className="text-xs text-white/90">Valid: {quotation.validUntil}</div>}
                      </div>
                    )}
                  </div>
                  {showBusinessDetails && (
                    <div className="bg-neutral-50 p-3 text-xs text-neutral-600 flex flex-wrap justify-between gap-2 border-t border-neutral-200">
                      <div>{business.address}</div>
                      <div>
                        {business.email && <span>{business.email} · </span>}
                        {business.phone && <span>{business.phone}</span>}
                        {business.taxId && <span> · {countryConfig.taxIdLabel}: {business.taxId}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Details & Amount Due Box */}
              {showCustomerDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div
                      className="text-[11px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: primaryColor }}
                    >
                      Prepared For
                    </div>
                    <div className="text-base font-bold text-neutral-900">
                      {quotation.customerSnapshot.name}
                    </div>
                    {quotation.customerSnapshot.company && (
                      <div className="text-xs font-semibold text-neutral-700">
                        {quotation.customerSnapshot.company}
                      </div>
                    )}
                    {quotation.customerSnapshot.address && (
                      <div className="text-xs text-neutral-600 whitespace-pre-line mt-1 leading-relaxed">
                        {quotation.customerSnapshot.address}
                      </div>
                    )}
                    <div className="text-xs text-neutral-600 mt-1">
                      {quotation.customerSnapshot.email && <div>{quotation.customerSnapshot.email}</div>}
                      {quotation.customerSnapshot.phone && <div>{quotation.customerSnapshot.phone}</div>}
                    </div>
                    {quotation.customerSnapshot.taxId && (
                      <div className="text-xs font-semibold text-neutral-800 mt-1.5">
                        {countryConfig.taxIdLabel}: {quotation.customerSnapshot.taxId}
                      </div>
                    )}
                  </div>

                  <div
                    className="p-4 text-white rounded-xl flex flex-col justify-between items-start sm:items-end shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Total Estimated Amount
                    </div>
                    <div className="text-3xl font-black tracking-tight font-mono">
                      {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                    </div>
                    {showDueDate && (
                      <div className="text-xs text-white/90">
                        Valid until <span className="font-bold text-white">{quotation.validUntil}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modern Minimal */
            <div>
              <div className="pb-8 mb-8 border-b border-neutral-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div>
                    {renderLogo('left')}
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
                      QUOTATION / ESTIMATE
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                      {business.name || 'Your Business Name'}
                    </h1>
                    <div className="mt-1 text-xs text-neutral-500 whitespace-pre-line">
                      {business.address}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-2xl font-bold font-mono tracking-tight text-neutral-950">
                      {quotation.quotationNumber}
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                      <div>Issued: <span className="text-neutral-900 font-medium">{quotation.date}</span></div>
                      <div className="text-emerald-700 font-semibold">Valid Until: {quotation.validUntil}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-6 border-b border-neutral-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Prepared For
                  </div>
                  <div className="text-base font-bold text-neutral-900">{quotation.customerSnapshot.name}</div>
                  {quotation.customerSnapshot.company && (
                    <div className="text-xs text-neutral-600">{quotation.customerSnapshot.company}</div>
                  )}
                  {quotation.customerSnapshot.address && (
                    <div className="text-xs text-neutral-500 whitespace-pre-line mt-1">{quotation.customerSnapshot.address}</div>
                  )}
                </div>

                <div className="sm:text-right flex flex-col justify-end">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                    Total Estimated Amount
                  </div>
                  <div className="text-3xl font-extrabold font-mono tracking-tight text-neutral-950">
                    {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Line Items Table */}
          <div className="overflow-x-auto mb-8">
            <table
              className={`w-full text-left text-xs border-collapse ${
                isCustom && tableStyle === 'bordered' ? 'border border-neutral-200' : ''
              }`}
            >
              <thead>
                <tr
                  className={
                    isCustom && tableStyle === 'bordered'
                      ? 'bg-neutral-100 text-neutral-900 border-b border-neutral-200'
                      : isCustom && tableStyle === 'striped'
                      ? 'text-white border-y'
                      : 'border-b-2 border-neutral-900 text-neutral-900'
                  }
                  style={{
                    backgroundColor: isCustom && tableStyle === 'striped' ? primaryColor : undefined,
                    borderColor: isCustom && tableStyle === 'clean' ? primaryColor : undefined,
                  }}
                >
                  <th className={`py-3 px-2 font-bold uppercase tracking-wider w-8 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>#</th>
                  <th className={`py-3 px-2 font-bold uppercase tracking-wider ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Item & Scope Description</th>
                  {showItemCode && (
                    <th className={`py-3 px-2 font-bold uppercase tracking-wider text-center w-24 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                      {isIndia ? 'HSN/SAC' : 'Code'}
                    </th>
                  )}
                  {showUnit && (
                    <th className={`py-3 px-2 font-bold uppercase tracking-wider text-center w-14 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                      Unit
                    </th>
                  )}
                  <th className={`py-3 px-2 font-bold uppercase tracking-wider text-right w-16 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Qty</th>
                  <th className={`py-3 px-2 font-bold uppercase tracking-wider text-right w-24 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Rate</th>
                  {showTaxColumn && (
                    <th className={`py-3 px-2 font-bold uppercase tracking-wider text-right w-16 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>{countryConfig.taxLabel}</th>
                  )}
                  {showDiscountColumn && (
                    <th className={`py-3 px-2 font-bold uppercase tracking-wider text-right w-16 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Disc %</th>
                  )}
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className={isCustom && tableStyle === 'bordered' ? 'divide-y divide-neutral-200' : 'divide-y divide-neutral-100'}>
                {quotation.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      backgroundColor:
                        isCustom && tableStyle === 'striped' && idx % 2 === 1
                          ? `${primaryColor}0d`
                          : undefined,
                    }}
                    className={
                      isCleanProfessional && idx % 2 === 1
                        ? 'bg-emerald-50/20'
                        : isCustom && tableStyle === 'bordered'
                        ? 'hover:bg-neutral-50/50'
                        : ''
                    }
                  >
                    <td className={`py-3 px-2 text-neutral-400 font-mono ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>{idx + 1}</td>
                    <td className={`py-3 px-2 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                      <div className="font-medium text-neutral-900 whitespace-pre-line">{item.description}</div>
                      {item.itemCode && (
                        <div className="text-[10px] font-mono text-neutral-500">Code: {item.itemCode}</div>
                      )}
                    </td>
                    {showItemCode && (
                      <td className={`py-3 px-2 text-center text-neutral-600 font-mono ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                        {item.hsnSac || item.itemCode || '—'}
                      </td>
                    )}
                    {showUnit && (
                      <td className={`py-3 px-2 text-center text-neutral-600 font-mono ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                        {item.unit || 'units'}
                      </td>
                    )}
                    <td className={`py-3 px-2 text-right font-mono text-neutral-800 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                      {item.quantity}
                    </td>
                    <td className={`py-3 px-2 text-right font-mono text-neutral-800 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                      {formatCurrency(item.rate, quotation.currency, quotation.currencySymbol)}
                    </td>
                    {showTaxColumn && (
                      <td className={`py-3 px-2 text-right font-mono text-neutral-600 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                        {item.taxPercent > 0 ? `${item.taxPercent}%` : '0%'}
                      </td>
                    )}
                    {showDiscountColumn && (
                      <td className={`py-3 px-2 text-right font-mono text-emerald-700 ${isCustom && tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                        {item.discountPercent ? `${item.discountPercent}%` : '—'}
                      </td>
                    )}
                    <td className="py-3 px-2 text-right font-bold font-mono text-neutral-950">
                      {formatCurrency(item.amount, quotation.currency, quotation.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown Summary */}
          {showTaxBreakdown && docTotals.taxGroups.length > 0 && docTotals.totalTax > 0 && (
            <div className="mb-6 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200/80 text-xs">
              <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-500 mb-2">
                Applicable Tax Breakdown
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-neutral-500 border-b border-neutral-200">
                      <th className="pb-1 font-semibold">Tax Rate</th>
                      <th className="pb-1 font-semibold text-right">Taxable Value</th>
                      <th className="pb-1 font-semibold text-right">{countryConfig.taxLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {docTotals.taxGroups.map((tg) => (
                      <tr key={tg.taxPercent}>
                        <td className="py-1 font-mono">{tg.taxPercent}%</td>
                        <td className="py-1 font-mono text-right">{formatCurrency(tg.taxableAmount, quotation.currency, quotation.currencySymbol)}</td>
                        <td className="py-1 font-mono font-bold text-right text-neutral-900">{formatCurrency(tg.taxAmount, quotation.currency, quotation.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 border-t border-neutral-200 pt-6">
            <div className="sm:col-span-7 space-y-4">
              {showPaymentDetails && business.bankDetails && (
                <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-100 text-xs">
                  <div className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] mb-2">
                    Payment Instructions
                  </div>
                  {business.bankDetails.bankName && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">Bank:</span> {business.bankDetails.bankName}
                    </div>
                  )}
                  {business.bankDetails.accountNumber && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">Account:</span>{' '}
                      <span className="font-mono font-medium">{business.bankDetails.accountNumber}</span>
                    </div>
                  )}
                  {business.bankDetails.routingCode && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">IFSC / Routing:</span>{' '}
                      <span className="font-mono font-medium">{business.bankDetails.routingCode}</span>
                    </div>
                  )}
                  {business.bankDetails.upiId && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">UPI ID:</span>{' '}
                      <span className="font-mono font-semibold text-neutral-900">{business.bankDetails.upiId}</span>
                    </div>
                  )}
                </div>
              )}

              {showNotes && quotation.notes && (
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-400 mb-1">
                    Quotation Terms & Notes
                  </div>
                  <p className="whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}

              {showTerms && business.terms && (
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-400 mb-1">
                    Standard Terms & Conditions
                  </div>
                  <p className="whitespace-pre-line">{business.terms}</p>
                </div>
              )}

              {showSignatory && (
                <div className="pt-8">
                  <div className="border-t border-neutral-300 w-48 pt-1 text-[11px] text-neutral-500 text-center font-medium">
                    Authorized Signatory
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Subtotal (Base)</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(quotation.subtotal, quotation.currency, quotation.currencySymbol)}
                  </span>
                </div>

                {quotation.totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">
                      -{formatCurrency(quotation.totalDiscount, quotation.currency, quotation.currencySymbol)}
                    </span>
                  </div>
                )}

                {quotation.totalTax > 0 && (
                  <div className="flex justify-between py-1 text-neutral-600">
                    <span>Total {countryConfig.taxLabel}</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(quotation.totalTax, quotation.currency, quotation.currencySymbol)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-neutral-900 pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                    Total Quoted
                  </span>
                  <span className="text-2xl font-black font-mono text-neutral-950 tracking-tight">
                    {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark Section */}
          {showWatermark ? (
            <div className="mt-16 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-neutral-400 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium">
                <span>Created with</span>
                <span className="font-bold text-neutral-700 tracking-tight">InvoiceFlow</span>
                <span>·</span>
                <span>Simple Offline Quotations & Invoicing</span>
              </div>
              <div className="no-print mt-1 sm:mt-0 text-[10px] text-neutral-400">
                (Upgrade to Pro Gold Program to remove watermark and ads)
              </div>
            </div>
          ) : (
            <div className="mt-16 pt-6 border-t border-neutral-100 text-center text-[10px] text-neutral-400">
              Quotation valid until {quotation.validUntil}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
