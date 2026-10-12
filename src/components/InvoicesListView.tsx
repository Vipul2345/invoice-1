import React, { useState } from 'react';
import { Invoice, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';
import {
  Plus,
  Search,
  Printer,
  Copy,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowUpDown,
} from 'lucide-react';

interface InvoicesListViewProps {
  invoices: Invoice[];
  settings: AppSettings;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  settings,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filtered = invoices
    .filter((inv) => {
      if (filter !== 'all' && inv.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerSnapshot?.name.toLowerCase().includes(q) ||
          inv.customerSnapshot?.company.toLowerCase().includes(q) ||
          inv.grandTotal.toString().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.grandTotal - a.grandTotal;
      if (sortBy === 'amount-asc') return a.grandTotal - b.grandTotal;
      return 0;
    });

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
            Invoices
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage, duplicate, search and generate professional PDFs for all invoices.
          </p>
        </div>

        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Create Invoice
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, company, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs">
            {(['all', 'paid', 'pending', 'overdue', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filter === s
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 px-2.5 py-1.5 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-neutral-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No invoices found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              No invoices match your current search and filter criteria.
            </p>
            <button
              onClick={onCreateInvoice}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              + Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                    onClick={() => onViewInvoice(inv)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">
                        {inv.customerSnapshot?.name || 'Unknown Client'}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {inv.customerSnapshot?.company || ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                      {inv.dueDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-950 whitespace-nowrap">
                      {formatCurrency(inv.grandTotal, inv.currency, inv.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Preview, Download PDF & Print"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateInvoice(inv.id)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
