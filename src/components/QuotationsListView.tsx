import React, { useState } from 'react';
import { Quotation, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';
import {
  Plus,
  FileCheck,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

interface QuotationsListViewProps {
  quotations: Quotation[];
  settings: AppSettings;
  onCreateQuotation: () => void;
  onViewQuotation: (quotation: Quotation) => void;
  onEditQuotation: (quotation: Quotation) => void;
  onDuplicateQuotation: (id: string) => void;
  onDeleteQuotation: (id: string) => void;
  onConvertToInvoice: (id: string) => void;
}

export const QuotationsListView: React.FC<QuotationsListViewProps> = ({
  quotations,
  settings,
  onCreateQuotation,
  onViewQuotation,
  onEditQuotation,
  onDuplicateQuotation,
  onDeleteQuotation,
  onConvertToInvoice,
}) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>('all');
  const [search, setSearch] = useState('');

  // Status badges
  const getStatusBadge = (status: Quotation['status'], convertedId?: string) => {
    if (convertedId) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
          <FileCheck className="w-3 h-3 text-blue-600" /> Converted
        </span>
      );
    }

    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" /> Accepted
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> Sent
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" /> Expired
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  // Filtered quotations
  const filteredQuotations = quotations.filter((quo) => {
    if (filter !== 'all' && quo.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = quo.quotationNumber.toLowerCase().includes(q);
      const matchCust = quo.customerSnapshot?.name.toLowerCase().includes(q);
      const matchComp = quo.customerSnapshot?.company.toLowerCase().includes(q);
      const matchAmt = quo.grandTotal.toString().includes(q);
      return matchNum || matchCust || matchComp || matchAmt;
    }
    return true;
  });

  const totalQuotedValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const acceptedQuotations = quotations.filter((q) => q.status === 'accepted' || !!q.convertedInvoiceId);
  const acceptedValue = acceptedQuotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const pendingQuotations = quotations.filter((q) => q.status === 'draft' || q.status === 'sent');
  const pendingValue = pendingQuotations.reduce((sum, q) => sum + q.grandTotal, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
            Quotations & Estimates
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create, track, and convert price quotes to formal invoices with full two-way GST calculations.
          </p>
        </div>

        <button
          onClick={onCreateQuotation}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Quotation</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Total Quotations
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-neutral-950">
            {quotations.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatCurrency(totalQuotedValue, settings.currency, settings.currencySymbol)} quoted
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Accepted
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-emerald-600">
            {acceptedQuotations.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatCurrency(acceptedValue, settings.currency, settings.currencySymbol)} value
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Pending Decision
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-neutral-900">
            {pendingQuotations.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatCurrency(pendingValue, settings.currency, settings.currencySymbol)} pipeline
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Converted to Invoice
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-blue-600">
            {quotations.filter((q) => !!q.convertedInvoiceId).length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Official billing generated
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotation #, client, amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 w-full"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs overflow-x-auto">
            {(['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filter === s
                    ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quotations Table */}
        {filteredQuotations.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No quotations found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Create an estimate or quotation to send to potential clients.
            </p>
            <button
              onClick={onCreateQuotation}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              + Create Quotation Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Quoted Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredQuotations.map((quo) => (
                  <tr
                    key={quo.id}
                    className="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
                    onClick={() => onViewQuotation(quo)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {quo.quotationNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">
                        {quo.customerSnapshot?.name || 'Unknown Client'}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {quo.customerSnapshot?.company || ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                      {quo.date}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                      {quo.validUntil}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-950 whitespace-nowrap">
                      {formatCurrency(quo.grandTotal, quo.currency, quo.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(quo.status, quo.convertedInvoiceId)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Convert to Invoice Button */}
                        {!quo.convertedInvoiceId ? (
                          <button
                            onClick={() => onConvertToInvoice(quo.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs cursor-pointer"
                            title="Convert quotation to a new official invoice"
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>Convert to Invoice</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                            Converted
                          </span>
                        )}

                        <button
                          onClick={() => onViewQuotation(quo)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Preview, Download PDF & Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditQuotation(quo)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Edit Quotation"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateQuotation(quo.id)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteQuotation(quo.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
