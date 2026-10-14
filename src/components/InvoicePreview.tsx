import React, { useState } from 'react';
import { Invoice, InvoiceTemplate, PlanTier, BusinessProfile } from '../types';
import { COUNTRIES } from '../lib/constants';
import { formatCurrency } from '../lib/storage';
import { downloadInvoicePdf } from '../lib/pdfGenerator';
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
} from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
  business: BusinessProfile;
  template: InvoiceTemplate;
  plan: PlanTier;
  onEdit?: () => void;
  onBack?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (status: Invoice['status']) => void;
  onTemplateChange?: (templateId: string) => void;
  availableTemplates?: InvoiceTemplate[];
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  business,
  template,
  plan,
  onEdit,
  onBack,
  onDuplicate,
  onStatusChange,
  onTemplateChange,
  availableTemplates = [],
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const countryConfig = COUNTRIES[invoice.country] || COUNTRIES.OTHER;
  const isIndia = invoice.country === 'IN';
  const showWatermark = plan !== 'pro';

  // Compute live tax breakdown from lines
  const docTotals = calculateDocumentTotals(invoice.items, { isIndia });

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfStatus('Generating PDF...');
    try {
      const result = await downloadInvoicePdf({
        invoice,
        elementId: 'invoice-document',
        onProgress: (status) => setPdfStatus(status),
      });

      if (result.success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } else {
        alert(`Could not generate PDF: ${result.error || 'Please try again'}`);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
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
    const summary = `Invoice ${invoice.invoiceNumber}
To: ${invoice.customerSnapshot.name} (${invoice.customerSnapshot.company})
Date: ${invoice.date}
Due Date: ${invoice.dueDate}
Amount: ${formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
Status: ${invoice.status.toUpperCase()}
View or pay according to invoice instructions.`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE
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
                {invoice.invoiceNumber}
              </h2>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Template: <span className="font-medium text-neutral-700">{template.name}</span> · {invoice.customerSnapshot.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {availableTemplates.length > 0 && onTemplateChange && (
            <div className="flex items-center gap-1.5 mr-2">
              <label htmlFor="template-select" className="text-xs font-medium text-neutral-500">
                Template:
              </label>
              <select
                id="template-select"
                value={template.id}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isPremium && plan !== 'pro' ? '(Pro Preview)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onStatusChange && (
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => onStatusChange('paid')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  invoice.status === 'paid' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mark Paid
              </button>
              <button
                onClick={() => onStatusChange('pending')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  invoice.status === 'pending' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Pending
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
            title="Generate and download A4 PDF"
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
            title="Print invoice"
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
            <h3 className="text-base font-bold text-neutral-900">Share or Save Invoice</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Download the PDF document or copy a message summary for {invoice.customerSnapshot.name}.
            </p>

            <div className="mt-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 font-mono text-xs text-neutral-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Invoice:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Client:</span>
                <span>{invoice.customerSnapshot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Amount:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Due:</span>
                <span>{invoice.dueDate}</span>
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
                Download / Share PDF File
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
          id="invoice-document"
          className={`invoice-print-container w-full max-w-[820px] bg-white rounded-lg shadow-md border border-neutral-200 p-8 md:p-12 text-neutral-900 relative ${fontClass}`}
          style={{ minHeight: '1050px' }}
        >
          {/* ============================================================== */}
          {/* TEMPLATE A: CLEAN PROFESSIONAL (Green Accent, Clean Hierarchy) */}
          {/* ============================================================== */}
          {isCleanProfessional ? (
            <div>
              {/* Green Accent Header Bar */}
              <div className="border-b-2 border-emerald-600 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    {renderLogo('left')}
                    <div className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-emerald-600 text-white mb-2">
                      TAX INVOICE
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                      {business.name || 'Your Business Name'}
                    </h1>
                    <div className="mt-1 text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
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

                  <div className="sm:text-right bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 min-w-[200px]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Invoice Number
                    </div>
                    <div className="text-2xl font-black font-mono tracking-tight text-neutral-950 mt-0.5">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      <div>
                        <span className="text-neutral-500">Date:</span>{' '}
                        <span className="font-semibold text-neutral-900">{invoice.date}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Due Date:</span>{' '}
                        <span className="font-semibold text-neutral-900">{invoice.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Terms:</span>{' '}
                        <span className="font-medium text-neutral-800">{invoice.paymentTerms}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Billed To
                  </div>
                  <div className="text-base font-bold text-neutral-900">
                    {invoice.customerSnapshot.name}
                  </div>
                  {invoice.customerSnapshot.company && (
                    <div className="text-xs font-semibold text-neutral-700">
                      {invoice.customerSnapshot.company}
                    </div>
                  )}
                  {invoice.customerSnapshot.address && (
                    <div className="text-xs text-neutral-600 whitespace-pre-line mt-1 leading-relaxed">
                      {invoice.customerSnapshot.address}
                    </div>
                  )}
                  <div className="text-xs text-neutral-600 mt-1">
                    {invoice.customerSnapshot.email && <div>{invoice.customerSnapshot.email}</div>}
                    {invoice.customerSnapshot.phone && <div>{invoice.customerSnapshot.phone}</div>}
                  </div>
                  {invoice.customerSnapshot.taxId && (
                    <div className="text-xs font-semibold text-neutral-800 mt-1.5">
                      {countryConfig.taxIdLabel}: {invoice.customerSnapshot.taxId}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-emerald-600 text-white rounded-xl flex flex-col justify-between items-start sm:items-end">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    Total Amount Due
                  </div>
                  <div className="text-3xl font-black tracking-tight font-mono">
                    {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                  </div>
                  <div className="text-xs text-emerald-100">
                    Payment due by <span className="font-bold text-white">{invoice.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Item Table with Alternating Rows */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/80 text-emerald-950 border-y border-emerald-200">
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider w-8">#</th>
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Item & Description</th>
                      {isIndia && <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-center">HSN/SAC</th>}
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-16">Qty</th>
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-24">Rate</th>
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-16">{countryConfig.taxLabel}</th>
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {invoice.items.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className={idx % 2 === 1 ? 'bg-emerald-50/20' : 'bg-white'}
                      >
                        <td className="py-3 px-3 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-900">{item.description}</div>
                          {item.itemCode && (
                            <div className="text-[10px] font-mono text-neutral-500">Code: {item.itemCode}</div>
                          )}
                        </td>
                        {isIndia && (
                          <td className="py-3 px-3 text-center text-neutral-600 font-mono">
                            {item.hsnSac || '—'}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right font-mono text-neutral-800">
                          {item.quantity} {item.unit ? <span className="text-[10px] text-neutral-500">{item.unit}</span> : ''}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-neutral-800">
                          {formatCurrency(item.rate, invoice.currency, invoice.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-neutral-600">
                          {item.taxPercent > 0 ? `${item.taxPercent}%` : '0%'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-neutral-950">
                          {formatCurrency(item.amount, invoice.currency, invoice.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isDetailedBusiness ? (
            /* ============================================================== */
            /* TEMPLATE B: DETAILED BUSINESS (Codes, Units, Tax Breakdown)    */
            /* ============================================================== */
            <div>
              <div className="border-b-2 border-neutral-900 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    {renderLogo('left')}
                    <div className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">
                      COMMERCIAL INVOICE
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
                      {business.website && <span>· Web: {business.website}</span>}
                    </div>
                    {business.taxId && (
                      <div className="mt-1 text-xs font-mono font-bold text-neutral-800">
                        {countryConfig.taxIdLabel}: {business.taxId}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right border-l-2 border-neutral-200 pl-4 space-y-1 text-xs">
                    <div className="text-sm font-black font-mono uppercase text-neutral-900">
                      INVOICE #{invoice.invoiceNumber}
                    </div>
                    <div>
                      <span className="text-neutral-500">Date Issued:</span>{' '}
                      <span className="font-semibold text-neutral-900">{invoice.date}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Due Date:</span>{' '}
                      <span className="font-semibold text-neutral-900">{invoice.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Terms:</span>{' '}
                      <span className="font-medium text-neutral-800">{invoice.paymentTerms}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Currency:</span>{' '}
                      <span className="font-bold text-neutral-800">{invoice.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Billing Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Buyer / Customer Details
                  </div>
                  <div className="text-sm font-bold text-neutral-900">
                    {invoice.customerSnapshot.name}
                  </div>
                  {invoice.customerSnapshot.company && (
                    <div className="text-xs font-medium text-neutral-700">
                      {invoice.customerSnapshot.company}
                    </div>
                  )}
                  {invoice.customerSnapshot.address && (
                    <div className="text-xs text-neutral-600 whitespace-pre-line mt-1 leading-relaxed">
                      {invoice.customerSnapshot.address}
                    </div>
                  )}
                  <div className="text-xs text-neutral-600 mt-1">
                    {invoice.customerSnapshot.email && <div>Email: {invoice.customerSnapshot.email}</div>}
                    {invoice.customerSnapshot.phone && <div>Phone: {invoice.customerSnapshot.phone}</div>}
                  </div>
                  {invoice.customerSnapshot.taxId && (
                    <div className="text-xs font-mono font-bold text-neutral-800 mt-1.5">
                      {countryConfig.taxIdLabel}: {invoice.customerSnapshot.taxId}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between sm:items-end sm:text-right">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Billing Summary
                    </div>
                    <div className="text-xs text-neutral-600">
                      Payment Status: <span className="font-bold uppercase text-neutral-900">{invoice.status}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200 w-full sm:w-auto">
                    <div className="text-[11px] text-neutral-500">Grand Total Due:</div>
                    <div className="text-2xl font-black font-mono text-neutral-950">
                      {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Item Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-200">
                      <th className="py-2.5 px-2 font-bold uppercase w-8">#</th>
                      <th className="py-2.5 px-2 font-bold uppercase w-28">Item Code / HSN</th>
                      <th className="py-2.5 px-2 font-bold uppercase">Description</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-center w-14">Unit</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-right w-14">Qty</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-right w-20">Unit Price</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-right w-14">{countryConfig.taxLabel} %</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-right w-20">Tax Amt</th>
                      <th className="py-2.5 px-2 font-bold uppercase text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-2 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-2 font-mono text-neutral-700 text-[11px]">
                          {item.itemCode || item.hsnSac || '—'}
                        </td>
                        <td className="py-2.5 px-2 font-medium text-neutral-900">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-2 text-center text-neutral-600 font-mono">
                          {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-neutral-800">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-neutral-800">
                          {formatCurrency(item.rate, invoice.currency, invoice.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-neutral-600">
                          {item.taxPercent}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-neutral-700">
                          {formatCurrency(item.taxAmount || 0, invoice.currency, invoice.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold font-mono text-neutral-950">
                          {formatCurrency(item.amount, invoice.currency, invoice.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isCustom ? (
            /* ============================================================== */
            /* TEMPLATE CUSTOM: USER CONFIGURED DYNAMIC COMPONENTS             */
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
                          TAX INVOICE
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
                          Invoice Number
                        </div>
                        <div className="text-2xl font-black font-mono tracking-tight text-neutral-950 mt-0.5">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <div>
                            <span className="text-neutral-500">Date:</span>{' '}
                            <span className="font-semibold text-neutral-900">{invoice.date}</span>
                          </div>
                          {showDueDate && (
                            <div>
                              <span className="text-neutral-500">Due Date:</span>{' '}
                              <span className="font-semibold text-neutral-900">{invoice.dueDate}</span>
                            </div>
                          )}
                          {showPaymentTerms && (
                            <div>
                              <span className="text-neutral-500">Terms:</span>{' '}
                              <span className="font-medium text-neutral-800">{invoice.paymentTerms}</span>
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
                        TAX INVOICE
                      </div>
                    )}
                    {showInvoiceMeta && (
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-neutral-500">INVOICE:</span>{' '}
                          <span className="font-bold text-neutral-900">{invoice.invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">DATE:</span>{' '}
                          <span className="font-semibold">{invoice.date}</span>
                        </div>
                        {showDueDate && (
                          <div>
                            <span className="text-neutral-500">DUE:</span>{' '}
                            <span className="font-semibold">{invoice.dueDate}</span>
                          </div>
                        )}
                        {showPaymentTerms && (
                          <div>
                            <span className="text-neutral-500">TERMS:</span>{' '}
                            <span className="font-medium">{invoice.paymentTerms}</span>
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
                            TAX INVOICE
                          </div>
                        )}
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {business.name || 'Your Business Name'}
                        </h1>
                      </div>
                    </div>
                    {showInvoiceMeta && (
                      <div className="sm:text-right font-mono">
                        <div className="text-lg font-black text-white">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-white/90">Date: {invoice.date}</div>
                        {showDueDate && <div className="text-xs text-white/90">Due: {invoice.dueDate}</div>}
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
                      Billed To
                    </div>
                    <div className="text-base font-bold text-neutral-900">
                      {invoice.customerSnapshot.name}
                    </div>
                    {invoice.customerSnapshot.company && (
                      <div className="text-xs font-semibold text-neutral-700">
                        {invoice.customerSnapshot.company}
                      </div>
                    )}
                    {invoice.customerSnapshot.address && (
                      <div className="text-xs text-neutral-600 whitespace-pre-line mt-1 leading-relaxed">
                        {invoice.customerSnapshot.address}
                      </div>
                    )}
                    <div className="text-xs text-neutral-600 mt-1">
                      {invoice.customerSnapshot.email && <div>{invoice.customerSnapshot.email}</div>}
                      {invoice.customerSnapshot.phone && <div>{invoice.customerSnapshot.phone}</div>}
                    </div>
                    {invoice.customerSnapshot.taxId && (
                      <div className="text-xs font-semibold text-neutral-800 mt-1.5">
                        {countryConfig.taxIdLabel}: {invoice.customerSnapshot.taxId}
                      </div>
                    )}
                  </div>

                  <div
                    className="p-4 text-white rounded-xl flex flex-col justify-between items-start sm:items-end shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Total Amount Due
                    </div>
                    <div className="text-3xl font-black tracking-tight font-mono">
                      {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                    </div>
                    {showDueDate && (
                      <div className="text-xs text-white/90">
                        Payment due by <span className="font-bold text-white">{invoice.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Line Items Table with Selected Table Style */}
              <div className="overflow-x-auto mb-6">
                <table
                  className={`w-full text-left text-xs border-collapse ${
                    tableStyle === 'bordered' ? 'border border-neutral-200' : ''
                  }`}
                >
                  <thead>
                    <tr
                      className={
                        tableStyle === 'bordered'
                          ? 'bg-neutral-100 text-neutral-900 border-b border-neutral-200'
                          : tableStyle === 'striped'
                          ? 'text-white border-y'
                          : 'border-y-2 text-neutral-950'
                      }
                      style={{
                        backgroundColor: tableStyle === 'striped' ? primaryColor : undefined,
                        borderColor: tableStyle === 'clean' ? primaryColor : undefined,
                      }}
                    >
                      <th className={`py-2.5 px-3 font-bold uppercase tracking-wider w-8 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>#</th>
                      <th className={`py-2.5 px-3 font-bold uppercase tracking-wider ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Item & Description</th>
                      {showItemCode && (
                        <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-center w-24 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          {isIndia ? 'HSN/SAC' : 'Code'}
                        </th>
                      )}
                      {showUnit && (
                        <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-center w-14 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          Unit
                        </th>
                      )}
                      <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-right w-16 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Qty</th>
                      <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-right w-24 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>Rate</th>
                      {showTaxColumn && (
                        <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-right w-16 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          {countryConfig.taxLabel}
                        </th>
                      )}
                      {showDiscountColumn && (
                        <th className={`py-2.5 px-3 font-bold uppercase tracking-wider text-right w-16 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          Disc %
                        </th>
                      )}
                      <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={tableStyle === 'bordered' ? 'divide-y divide-neutral-200' : 'divide-y divide-neutral-100'}>
                    {invoice.items.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{
                          backgroundColor:
                            tableStyle === 'striped' && idx % 2 === 1
                              ? `${primaryColor}0d`
                              : undefined,
                        }}
                        className={tableStyle === 'bordered' ? 'hover:bg-neutral-50/50' : ''}
                      >
                        <td className={`py-3 px-3 text-neutral-400 font-mono ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>{idx + 1}</td>
                        <td className={`py-3 px-3 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          <div className="font-semibold text-neutral-900">{item.description}</div>
                        </td>
                        {showItemCode && (
                          <td className={`py-3 px-3 text-center text-neutral-600 font-mono text-[11px] ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                            {item.itemCode || item.hsnSac || '—'}
                          </td>
                        )}
                        {showUnit && (
                          <td className={`py-3 px-3 text-center font-mono text-neutral-600 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                            {item.unit || 'units'}
                          </td>
                        )}
                        <td className={`py-3 px-3 text-right font-mono text-neutral-800 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          {item.quantity}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono text-neutral-800 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                          {formatCurrency(item.rate, invoice.currency, invoice.currencySymbol)}
                        </td>
                        {showTaxColumn && (
                          <td className={`py-3 px-3 text-right font-mono text-neutral-600 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                            {item.taxPercent > 0 ? `${item.taxPercent}%` : '0%'}
                          </td>
                        )}
                        {showDiscountColumn && (
                          <td className={`py-3 px-3 text-right font-mono text-emerald-700 ${tableStyle === 'bordered' ? 'border-r border-neutral-200' : ''}`}>
                            {item.discountPercent ? `${item.discountPercent}%` : '—'}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right font-bold font-mono text-neutral-950">
                          {formatCurrency(item.amount, invoice.currency, invoice.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* TEMPLATE C / DEFAULT: MODERN MINIMAL (Whitespace, Hierarchy)   */
            /* ============================================================== */
            <div>
              <div className="pb-8 mb-8 border-b border-neutral-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div>
                    {renderLogo('left')}
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                      {business.name || 'Your Business Name'}
                    </h1>
                    <div className="mt-2 text-xs text-neutral-500 leading-relaxed whitespace-pre-line">
                      {business.address}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {business.email && <span>{business.email} · </span>}
                      {business.phone && <span>{business.phone}</span>}
                    </div>
                    {business.taxId && (
                      <div className="mt-1 text-xs font-medium text-neutral-700">
                        {countryConfig.taxIdLabel}: {business.taxId}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                      Invoice
                    </div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-neutral-950 mt-0.5">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="mt-3 space-y-0.5 text-xs text-neutral-500">
                      <div>Date: <span className="text-neutral-900 font-medium">{invoice.date}</span></div>
                      <div>Due: <span className="text-neutral-900 font-medium">{invoice.dueDate}</span></div>
                      <div>Terms: <span className="text-neutral-900 font-medium">{invoice.paymentTerms}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-6 border-b border-neutral-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Billed To
                  </div>
                  <div className="text-base font-bold text-neutral-900">
                    {invoice.customerSnapshot.name}
                  </div>
                  {invoice.customerSnapshot.company && (
                    <div className="text-xs text-neutral-600 font-medium">
                      {invoice.customerSnapshot.company}
                    </div>
                  )}
                  {invoice.customerSnapshot.address && (
                    <div className="text-xs text-neutral-500 whitespace-pre-line mt-1">
                      {invoice.customerSnapshot.address}
                    </div>
                  )}
                  {invoice.customerSnapshot.taxId && (
                    <div className="text-xs font-semibold text-neutral-700 mt-1">
                      {countryConfig.taxIdLabel}: {invoice.customerSnapshot.taxId}
                    </div>
                  )}
                </div>

                <div className="sm:text-right flex flex-col justify-end">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                    Amount Due
                  </div>
                  <div className="text-3xl font-extrabold font-mono tracking-tight text-neutral-950">
                    {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Clean Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-neutral-900">
                      <th className="py-3 px-2 font-bold uppercase tracking-wider w-8">#</th>
                      <th className="py-3 px-2 font-bold uppercase tracking-wider">Description</th>
                      {isIndia && <th className="py-3 px-2 font-bold uppercase tracking-wider text-center">HSN/SAC</th>}
                      <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-16">Qty</th>
                      <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-24">Rate</th>
                      <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-16">{countryConfig.taxLabel}</th>
                      <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3.5 px-2 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-3.5 px-2 font-medium text-neutral-900 whitespace-pre-line">
                          {item.description}
                        </td>
                        {isIndia && (
                          <td className="py-3.5 px-2 text-center text-neutral-500 font-mono">
                            {item.hsnSac || '—'}
                          </td>
                        )}
                        <td className="py-3.5 px-2 text-right font-mono text-neutral-800">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-neutral-800">
                          {formatCurrency(item.rate, invoice.currency, invoice.currencySymbol)}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-neutral-600">
                          {item.taxPercent > 0 ? `${item.taxPercent}%` : '—'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold font-mono text-neutral-950">
                          {formatCurrency(item.amount, invoice.currency, invoice.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAX BREAKDOWN SECTION (Shown if taxes exist or Detailed style) */}
          {/* ============================================================== */}
          {showTaxBreakdown && docTotals.taxGroups.length > 0 && docTotals.totalTax > 0 && (
            <div className="mb-6 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200/80 text-xs">
              <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-500 mb-2">
                Tax Breakdown Summary
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-neutral-500 border-b border-neutral-200">
                      <th className="pb-1 font-semibold">Tax Rate</th>
                      <th className="pb-1 font-semibold text-right">Taxable Amount</th>
                      {isIndia ? (
                        <>
                          <th className="pb-1 font-semibold text-right">CGST</th>
                          <th className="pb-1 font-semibold text-right">SGST</th>
                          <th className="pb-1 font-semibold text-right">IGST</th>
                        </>
                      ) : (
                        <th className="pb-1 font-semibold text-right">{countryConfig.taxLabel} Amount</th>
                      )}
                      <th className="pb-1 font-semibold text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {docTotals.taxGroups.map((tg) => (
                      <tr key={tg.taxPercent}>
                        <td className="py-1 font-mono font-medium">{tg.taxPercent}%</td>
                        <td className="py-1 font-mono text-right">{formatCurrency(tg.taxableAmount, invoice.currency, invoice.currencySymbol)}</td>
                        {isIndia ? (
                          <>
                            <td className="py-1 font-mono text-right">{formatCurrency(tg.cgstAmount || 0, invoice.currency, invoice.currencySymbol)}</td>
                            <td className="py-1 font-mono text-right">{formatCurrency(tg.sgstAmount || 0, invoice.currency, invoice.currencySymbol)}</td>
                            <td className="py-1 font-mono text-right">{formatCurrency(tg.igstAmount || 0, invoice.currency, invoice.currencySymbol)}</td>
                          </>
                        ) : (
                          <td className="py-1 font-mono text-right">{formatCurrency(tg.taxAmount, invoice.currency, invoice.currencySymbol)}</td>
                        )}
                        <td className="py-1 font-mono font-bold text-right text-neutral-900">{formatCurrency(tg.taxAmount, invoice.currency, invoice.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TOTALS & INSTRUCTIONS FOOTER                                   */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 border-t border-neutral-200 pt-6">
            <div className="sm:col-span-7 space-y-4">
              {/* Payment Details */}
              {showPaymentDetails && invoice.paymentDetails && (
                <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-100 text-xs">
                  <div className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] mb-2">
                    Payment Instructions
                  </div>
                  {invoice.paymentDetails.bankName && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">Bank:</span> {invoice.paymentDetails.bankName}
                    </div>
                  )}
                  {invoice.paymentDetails.accountNumber && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">Account:</span>{' '}
                      <span className="font-mono font-medium">{invoice.paymentDetails.accountNumber}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.routingCode && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">IFSC / Routing:</span>{' '}
                      <span className="font-mono font-medium">{invoice.paymentDetails.routingCode}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.upiId && (
                    <div className="text-neutral-700">
                      <span className="text-neutral-500">UPI ID:</span>{' '}
                      <span className="font-mono font-semibold text-neutral-900">{invoice.paymentDetails.upiId}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.instructions && (
                    <div className="text-neutral-600 italic mt-1.5 leading-relaxed">
                      {invoice.paymentDetails.instructions}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {showNotes && invoice.notes && (
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-400 mb-1">
                    Notes
                  </div>
                  <p className="whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              {showTerms && business.terms && (
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-400 mb-1">
                    Terms & Conditions
                  </div>
                  <p className="whitespace-pre-line">{business.terms}</p>
                </div>
              )}

              {/* Authorized Signatory */}
              {showSignatory && (
                <div className="pt-8">
                  <div className="border-t border-neutral-300 w-48 pt-1 text-[11px] text-neutral-500 text-center font-medium">
                    Authorized Signatory
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Summary */}
            <div className="sm:col-span-5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Subtotal (Base)</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(invoice.subtotal, invoice.currency, invoice.currencySymbol)}
                  </span>
                </div>

                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">
                      -{formatCurrency(invoice.totalDiscount, invoice.currency, invoice.currencySymbol)}
                    </span>
                  </div>
                )}

                {invoice.totalTax > 0 && (
                  <div className="flex justify-between py-1 text-neutral-600">
                    <span>Total {countryConfig.taxLabel}</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(invoice.totalTax, invoice.currency, invoice.currencySymbol)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-neutral-900 pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                    Total Due
                  </span>
                  <span className="text-2xl font-black font-mono text-neutral-950 tracking-tight">
                    {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
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
                <span>Simple Offline Invoicing</span>
              </div>
              <div className="no-print mt-1 sm:mt-0 text-[10px] text-neutral-400">
                (Upgrade to Pro Gold Program to remove watermark and ads)
              </div>
            </div>
          ) : (
            <div className="mt-16 pt-6 border-t border-neutral-100 text-center text-[10px] text-neutral-400">
              Thank you for choosing {business.name || 'us'}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
