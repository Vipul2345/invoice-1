import React, { useState } from 'react';
import { Invoice, BusinessProfile, AppSettings, PlanTier } from '../types';
import { formatCurrency } from '../lib/storage';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Printer,
  Copy,
  Edit3,
  Trash2,
  Search,
  HardDrive,
  Cloud,
  Check,
} from 'lucide-react';

interface DashboardViewProps {
  invoices: Invoice[];
  business: BusinessProfile;
  settings: AppSettings;
  plan: PlanTier;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onGoToInvoices: () => void;
  onGoToPricing: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  business,
  settings,
  plan,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onGoToInvoices,
  onGoToPricing,
}) => {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all');
  const [search, setSearch] = useState('');

  // Greetings logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Metrics calculation
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const pendingInvoices = invoices.filter((i) => i.status === 'pending');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Filtered recent invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = inv.customerSnapshot?.name.toLowerCase().includes(q);
      const matchCompany = inv.customerSnapshot?.company.toLowerCase().includes(q);
      const matchAmount = inv.grandTotal.toString().includes(q);
      return matchNum || matchCust || matchCompany || matchAmount;
    }
    return true;
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
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>{greeting}</span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-800 font-semibold">{business.name || 'Acme Services'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-0.5">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreateInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Total Invoices
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-neutral-950">
            {totalInvoices}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
            <span>{paidInvoices.length} paid</span>
            <span>·</span>
            <span>{pendingInvoices.length} awaiting</span>
          </div>
        </div>

        {/* Paid Revenue */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Revenue (Paid)
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600">
            {formatCurrency(totalRevenue, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Collected across {paidInvoices.length} payments
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Pending
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-neutral-900">
            {formatCurrency(pendingAmount, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {pendingInvoices.length} awaiting payment
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Overdue
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-600">
            {formatCurrency(overdueAmount, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {overdueInvoices.length} requires attention
          </div>
        </div>
      </div>

      {/* Trust & Offline Architecture Card */}
      <div className="bg-neutral-900 text-white p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-neutral-800 rounded-lg text-neutral-200 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                Local-First Architecture
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                100% Offline Capable
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Your invoices and customer records are saved directly in your device’s local database. No cloud account required.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {plan === 'free' ? (
            <button
              onClick={onGoToPricing}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Explore Backup & Pro Plans
            </button>
          ) : (
            <div className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{plan === 'drive' ? 'Drive Backup Active' : 'Pro Cloud Active'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Table Area */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              Recent Invoices
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              ({filteredInvoices.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search #, client, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 w-full sm:w-48"
              />
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs overflow-x-auto">
              {(['all', 'paid', 'pending', 'overdue', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    filter === s
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No invoices match your filter</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Create your first invoice in seconds without signing in.
            </p>
            <button
              onClick={onCreateInvoice}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              + Create Invoice Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
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
                          title="Edit Invoice"
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

        {/* View all invoices link */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Showing {filteredInvoices.length} of {invoices.length} total records
          </span>
          <button
            onClick={onGoToInvoices}
            className="font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
