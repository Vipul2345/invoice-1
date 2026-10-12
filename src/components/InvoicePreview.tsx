import React, { useState } from 'react';
import { Invoice, InvoiceTemplate, PlanTier, BusinessProfile } from '../types';
import { COUNTRIES } from '../lib/constants';
import { formatCurrency } from '../lib/storage';
import { downloadInvoicePdf } from '../lib/pdfGenerator';
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
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfStatus, setPdfStatus] = React.useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const countryConfig = COUNTRIES[invoice.country] || COUNTRIES.OTHER;
  const isIndia = invoice.country === 'IN';
  const showWatermark = plan !== 'pro';

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
    // In Capacitor Android WebView, window.print() is unsupported by default.
    // Instead, route directly to the native PDF generator which triggers the Android print/save sheet.
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

  const primaryColor = template.config.primaryColor || '#0f172a';
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
      {/* Top Action & Controls Bar (Hidden during print) */}
      <div className="no-print mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
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
                Style:
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
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  invoice.status === 'paid' ? 'bg-white shadow-xs text-emerald-700' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mark Paid
              </button>
              <button
                onClick={() => onStatusChange('pending')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  invoice.status === 'pending' ? 'bg-white shadow-xs text-amber-700' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Pending
              </button>
            </div>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
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

      {/* Mobile Sticky Action Bar for Android & Mobile Web */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 flex items-center justify-between gap-2 shadow-lg no-print">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 active:bg-neutral-200 rounded-xl transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-neutral-950 active:bg-neutral-800 rounded-xl shadow-md transition-colors disabled:opacity-70"
        >
          {isGeneratingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloadSuccess ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isGeneratingPdf ? (pdfStatus || 'Generating...') : downloadSuccess ? 'PDF Ready!' : 'Download PDF'}
        </button>
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
          {/* Header Layout Variations */}
          {template.style === 'modern' || template.config.headerLayout === 'split' ? (
            <div className="border-b border-neutral-200 pb-8 mb-8">
              {logoPosition === 'center' && renderLogo('center')}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div>
                  {logoPosition === 'left' && renderLogo('left')}
                  <div
                    className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md text-white mb-3"
                    style={{ backgroundColor: primaryColor }}
                  >
                    TAX INVOICE
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                    {business.name || 'Your Business Name'}
                  </h1>
                  <div className="mt-2 text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                    {business.address}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {business.email && <span>{business.email} · </span>}
                    {business.phone && <span>{business.phone}</span>}
                  </div>
                  {business.taxId && (
                    <div className="mt-1 text-xs font-semibold text-neutral-700">
                      {countryConfig.taxIdLabel}: {business.taxId}
                    </div>
                  )}
                </div>

                <div className="sm:text-right">
                  {logoPosition === 'right' && renderLogo('right')}
                  <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                    Invoice Number
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 mt-0.5">
                    {invoice.invoiceNumber}
                  </div>

                  <div className="mt-4 space-y-1 text-xs">
                    <div className="text-neutral-600">
                      <span className="text-neutral-400">Date Issued:</span>{' '}
                      <span className="font-semibold text-neutral-800">{invoice.date}</span>
                    </div>
                    <div className="text-neutral-600">
                      <span className="text-neutral-400">Due Date:</span>{' '}
                      <span className="font-semibold text-neutral-800">{invoice.dueDate}</span>
                    </div>
                    <div className="text-neutral-600">
                      <span className="text-neutral-400">Terms:</span>{' '}
                      <span className="font-medium text-neutral-800">{invoice.paymentTerms}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard / Minimal / Corporate Header */
            <div className="border-b border-neutral-200 pb-8 mb-8">
              {logoPosition === 'center' && renderLogo('center')}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div>
                  {logoPosition === 'left' && renderLogo('left')}
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                    {business.name || 'Your Business Name'}
                  </h1>
                  <div className="mt-2 text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                    {business.address}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {business.email && <span>{business.email} · </span>}
                    {business.phone && <span>{business.phone}</span>}
                  </div>
                  {business.taxId && (
                    <div className="mt-1 text-xs font-semibold text-neutral-700">
                      {countryConfig.taxIdLabel}: {business.taxId}
                    </div>
                  )}
                </div>

                <div className="sm:text-right">
                  {logoPosition === 'right' && renderLogo('right')}
                  <div className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-900">
                    INVOICE
                  </div>
                  <div className="text-sm font-mono font-bold text-neutral-700 mt-1">
                    #{invoice.invoiceNumber}
                  </div>

                  <div className="mt-4 space-y-1 text-xs">
                    <div>
                      <span className="text-neutral-500">Date:</span>{' '}
                      <span className="font-medium text-neutral-900">{invoice.date}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Due Date:</span>{' '}
                      <span className="font-medium text-neutral-900">{invoice.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Terms:</span>{' '}
                      <span className="font-medium text-neutral-900">{invoice.paymentTerms}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer / Billed To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Billed To
              </div>
              <div className="text-base font-bold text-neutral-900">
                {invoice.customerSnapshot.name}
              </div>
              {invoice.customerSnapshot.company && (
                <div className="text-xs font-medium text-neutral-700 mt-0.5">
                  {invoice.customerSnapshot.company}
                </div>
              )}
              {invoice.customerSnapshot.address && (
                <div className="text-xs text-neutral-600 whitespace-pre-line mt-1.5 leading-relaxed">
                  {invoice.customerSnapshot.address}
                </div>
              )}
              <div className="text-xs text-neutral-600 mt-1">
                {invoice.customerSnapshot.email && <div>{invoice.customerSnapshot.email}</div>}
                {invoice.customerSnapshot.phone && <div>{invoice.customerSnapshot.phone}</div>}
              </div>
              {invoice.customerSnapshot.taxId && (
                <div className="text-xs font-semibold text-neutral-700 mt-2">
                  {countryConfig.taxIdLabel}: {invoice.customerSnapshot.taxId}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col justify-end items-start sm:items-end">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Amount Due
              </div>
              <div className="text-3xl font-extrabold tracking-tight font-mono text-neutral-950">
                {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Due by <span className="font-medium text-neutral-800">{invoice.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-neutral-900">
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-8">#</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider">Description</th>
                  {isIndia && <th className="py-3 px-2 font-bold uppercase tracking-wider text-center">HSN/SAC</th>}
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-16">Qty</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-24">Rate</th>
                  {template.config.showTaxBreakdown && (
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-16">
                      {countryConfig.taxLabel}
                    </th>
                  )}
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {invoice.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={
                      template.config.tableStyle === 'striped' && idx % 2 === 1
                        ? 'bg-neutral-50'
                        : ''
                    }
                  >
                    <td className="py-3 px-2 text-neutral-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium text-neutral-900 whitespace-pre-line">
                      {item.description}
                    </td>
                    {isIndia && (
                      <td className="py-3 px-2 text-center text-neutral-600 font-mono">
                        {item.hsnSac || '—'}
                      </td>
                    )}
                    <td className="py-3 px-2 text-right font-mono text-neutral-800">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neutral-800">
                      {formatCurrency(item.rate, invoice.currency, invoice.currencySymbol)}
                    </td>
                    {template.config.showTaxBreakdown && (
                      <td className="py-3 px-2 text-right font-mono text-neutral-600">
                        {item.taxPercent > 0 ? `${item.taxPercent}%` : '—'}
                      </td>
                    )}
                    <td className="py-3 px-2 text-right font-bold font-mono text-neutral-950">
                      {formatCurrency(item.amount, invoice.currency, invoice.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 border-t border-neutral-200 pt-6">
            <div className="sm:col-span-7 space-y-4">
              {/* Payment Details */}
              {template.config.showPaymentDetails && invoice.paymentDetails && (
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
              {invoice.notes && (
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-neutral-400 mb-1">
                    Notes
                  </div>
                  <p className="whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Calculations Summary */}
            <div className="sm:col-span-5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Subtotal</span>
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
                    <span>{countryConfig.taxLabel}</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(invoice.totalTax, invoice.currency, invoice.currencySymbol)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-neutral-900 pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-2xl font-black font-mono text-neutral-950 tracking-tight">
                    {formatCurrency(invoice.grandTotal, invoice.currency, invoice.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark Section (Free & Drive Plan Only) */}
          {showWatermark ? (
            <div className="mt-16 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-neutral-400 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium">
                <span>Created with</span>
                <span className="font-bold text-neutral-700 tracking-tight">InvoiceFlow</span>
                <span>·</span>
                <span>Simple Offline Invoicing</span>
              </div>
              <div className="no-print mt-1 sm:mt-0 text-[10px] text-neutral-400">
                (Upgrade to Pro to remove watermark)
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
