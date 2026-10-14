import React, { useState } from 'react';
import { Quotation, InvoiceTemplate, PlanTier, BusinessProfile, QuotationStatus } from '../types';
import { COUNTRIES } from '../lib/constants';
import { formatCurrency } from '../lib/storage';
import { downloadQuotationPdf, shareQuotationPdf } from '../lib/pdfGenerator';
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
  MessageCircle,
  Mail,
  ExternalLink,
  X,
  Send,
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
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [shareStatus, setShareStatus] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

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

  const handleSharePdf = async () => {
    if (isSharingPdf || isGeneratingPdf) return;
    setIsSharingPdf(true);
    setShareStatus('Preparing Quotation PDF...');
    setShareFeedback(null);
    try {
      const result = await shareQuotationPdf({
        quotation,
        elementId: 'quotation-document',
        onProgress: (status) => setShareStatus(status),
      });

      if (result.success) {
        if (result.fallbackToDownload) {
          setShareFeedback({
            message: 'PDF downloaded! Since native app sharing is unavailable on this browser/OS, you can attach the file directly to WhatsApp or Gmail using the buttons below.',
            type: 'info',
          });
        } else {
          setShareFeedback({
            message: 'Share sheet opened successfully!',
            type: 'success',
          });
          setTimeout(() => setShareFeedback(null), 4000);
        }
      } else {
        setShareFeedback({
          message: result.error || 'Could not launch system share sheet. Please use the WhatsApp or Gmail buttons below.',
          type: 'warning',
        });
      }
    } catch (err: any) {
      console.error('Quotation share error:', err);
      setShareFeedback({
        message: 'Failed to share quotation. Please try direct WhatsApp or Gmail below.',
        type: 'warning',
      });
    } finally {
      setIsSharingPdf(false);
      setShareStatus('');
    }
  };

  const handleShareWhatsApp = () => {
    const customerName = quotation.customerSnapshot.name;
    const companyName = quotation.customerSnapshot.company ? ` (${quotation.customerSnapshot.company})` : '';
    const totalStr = formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol);

    const msg = `📋 *QUOTATION / ESTIMATE: ${quotation.quotationNumber}*
From: ${business.name || 'InvoiceFlow'}
To: ${customerName}${companyName}

💰 *Quoted Total:* ${totalStr}
📅 *Valid Until:* ${quotation.validUntil}
📊 *Status:* ${quotation.status.toUpperCase()}

Please find your quotation estimate above. Please let us know if you have any questions or when you would like to proceed. Thank you!`;

    let rawPhone = (quotation.customerSnapshot.phone || '').replace(/[^0-9]/g, '');
    if (rawPhone.length === 10 && quotation.country === 'IN') {
      rawPhone = '91' + rawPhone;
    }

    const waUrl = rawPhone.length >= 10
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const getEmailSubjectAndBody = () => {
    const customerName = quotation.customerSnapshot.name;
    const totalStr = formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol);
    const subject = `Quotation ${quotation.quotationNumber} from ${business.name || 'InvoiceFlow'}`;
    const body = `Dear ${customerName},

Please find our quotation / price estimate (${quotation.quotationNumber}) detailed below:

• Quotation Number: ${quotation.quotationNumber}
• Date: ${quotation.date}
• Valid Until: ${quotation.validUntil}
• Total Quoted Amount: ${totalStr}
• Status: ${quotation.status.toUpperCase()}

${quotation.paymentTerms ? `Payment Terms: ${quotation.paymentTerms}\n` : ''}${business.bankDetails?.bankName ? `Payment Details:
Bank: ${business.bankDetails.bankName}
Account Number: ${business.bankDetails.accountNumber || 'N/A'}
IFSC / Routing: ${business.bankDetails.routingCode || 'N/A'}
` : ''}
We look forward to working with you. Please let us know if you would like to accept this quote or have any questions.

Best regards,
${business.name || 'InvoiceFlow'}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.email ? `Email: ${business.email}` : ''}`;

    return { subject, body, email: quotation.customerSnapshot.email || '' };
  };

  const handleShareGmailWeb = () => {
    const { subject, body, email } = getEmailSubjectAndBody();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmailClient = () => {
    const { subject, body, email } = getEmailSubjectAndBody();
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
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
  const showLogo = isCustom ? (template.config.showLogo !== false) : (template.config.showLogo !== false);
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

  const shouldShowLogo = showLogo && !!business.logoUrl;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900">Share Quotation</h3>
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Share the quotation PDF directly to apps or send details to your client.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareFeedback(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Snapshot Card */}
            <div className="mt-3.5 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80 text-xs text-neutral-700 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Quotation:</span>
                <span className="font-bold text-neutral-900">{quotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Client:</span>
                <span className="font-semibold text-neutral-800">{quotation.customerSnapshot.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Quoted Total:</span>
                <span className="font-extrabold text-emerald-700">
                  {formatCurrency(quotation.grandTotal, quotation.currency, quotation.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-500">
                <span>Valid Until: {quotation.validUntil}</span>
                {quotation.customerSnapshot.phone && <span>Tel: {quotation.customerSnapshot.phone}</span>}
              </div>
            </div>

            {/* Status Feedback Notice (if any) */}
            {shareFeedback && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  shareFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : shareFeedback.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {shareFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{shareFeedback.message}</span>
              </div>
            )}

            {/* Sharing Methods */}
            <div className="mt-4 space-y-2.5">
              {/* 1. Primary: System Share Sheet with PDF Attached */}
              <button
                onClick={handleSharePdf}
                disabled={isSharingPdf || isGeneratingPdf}
                className="w-full p-3 text-left rounded-xl border border-neutral-900 bg-neutral-900 hover:bg-neutral-800 text-white transition-all shadow-sm flex items-center justify-between gap-3 cursor-pointer disabled:opacity-75 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    {isSharingPdf ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Share PDF via Apps</span>
                      <span className="text-[10px] font-normal text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">
                        WhatsApp, Gmail, etc.
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 mt-0.5">
                      {isSharingPdf ? (shareStatus || 'Preparing Quotation PDF...') : 'Opens system share sheet with PDF file attached'}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
              </button>

              {/* 2. Direct Messaging Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* WhatsApp Direct */}
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <span>WhatsApp</span>
                      <Send className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-emerald-800 truncate">
                      {quotation.customerSnapshot.phone ? `Send to ${quotation.customerSnapshot.phone}` : 'Open pre-filled chat'}
                    </p>
                  </div>
                </button>

                {/* Gmail Web Compose */}
                <button
                  onClick={handleShareGmailWeb}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-left transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-rose-950 flex items-center gap-1">
                      <span>Gmail Web</span>
                      <Send className="w-3 h-3 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-rose-800 truncate">
                      {quotation.customerSnapshot.email ? quotation.customerSnapshot.email : 'Open Gmail compose'}
                    </p>
                  </div>
                </button>
              </div>

              {/* 3. Secondary Actions: Default Email App, Download PDF & Copy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleShareEmailClient}
                  className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Open in your default mail application (Outlook, Apple Mail, etc.)"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Default Mail</span>
                </button>

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    handleDownloadPdf();
                  }}
                  disabled={isGeneratingPdf}
                  className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Direct download quotation PDF"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy formatted quotation message summary to clipboard"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
              <span>🔒 100% Free · Direct from device</span>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareFeedback(null);
                }}
                className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
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
