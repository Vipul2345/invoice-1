import React, { useState } from 'react';
import { Invoice, AppSettings } from '../types';
import { formatCurrency } from '../lib/storage';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
  settings: AppSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ invoices, settings }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Filter invoices by timeframe
  const now = new Date();
  const filtered = invoices.filter((inv) => {
    if (timeframe === 'all') return true;
    const invDate = new Date(inv.date);
    if (isNaN(invDate.getTime())) return true;

    if (timeframe === 'week') {
      const diffMs = now.getTime() - invDate.getTime();
      return diffMs <= 7 * 86400000;
    }
    if (timeframe === 'month') {
      return (
        invDate.getMonth() === now.getMonth() &&
        invDate.getFullYear() === now.getFullYear()
      );
    }
    if (timeframe === 'year') {
      return invDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalInvoiced = filtered.reduce((sum, i) => sum + i.grandTotal, 0);
  const paidInvoices = filtered.filter((i) => i.status === 'paid');
  const pendingInvoices = filtered.filter((i) => i.status === 'pending');
  const overdueInvoices = filtered.filter((i) => i.status === 'overdue');

  const paidAmount = paidInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Status percentages for distribution bar
  const paidPct = totalInvoiced > 0 ? (paidAmount / totalInvoiced) * 100 : 0;
  const pendingPct = totalInvoiced > 0 ? (pendingAmount / totalInvoiced) * 100 : 0;
  const overduePct = totalInvoiced > 0 ? (overdueAmount / totalInvoiced) * 100 : 0;

  // Top clients aggregation
  const clientRevenueMap: Record<string, { name: string; company: string; count: number; total: number }> = {};
  filtered.forEach((inv) => {
    const custId = inv.customerId;
    const name = inv.customerSnapshot?.name || 'Unknown';
    const company = inv.customerSnapshot?.company || '';
    if (!clientRevenueMap[custId]) {
      clientRevenueMap[custId] = { name, company, count: 0, total: 0 };
    }
    clientRevenueMap[custId].count += 1;
    clientRevenueMap[custId].total += inv.grandTotal;
  });

  const topClients = Object.values(clientRevenueMap).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Overview of cash flow, settled receivables, and outstanding balances.
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                timeframe === t.id
                  ? 'bg-white text-neutral-950 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Total Invoiced
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-neutral-950">
            {formatCurrency(totalInvoiced, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {filtered.length} total invoices in period
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Collected (Paid)
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-emerald-600">
            {formatCurrency(paidAmount, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {paidInvoices.length} invoices paid
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Pending Collection
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-neutral-900">
            {formatCurrency(pendingAmount, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {pendingInvoices.length} invoices awaiting
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Overdue Balance
          </div>
          <div className="mt-2 text-2xl font-black font-mono tracking-tight text-rose-600">
            {formatCurrency(overdueAmount, settings.currency, settings.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {overdueInvoices.length} overdue invoices
          </div>
        </div>
      </div>

      {/* Cash Flow Distribution Bar */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Receivables Distribution
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              Paid ({Math.round(paidPct)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs" />
              Pending ({Math.round(pendingPct)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
              Overdue ({Math.round(overduePct)}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
          {paidPct > 0 && (
            <div
              style={{ width: `${paidPct}%` }}
              className="h-full bg-emerald-500 transition-all duration-300"
              title={`Paid: ${Math.round(paidPct)}%`}
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="h-full bg-amber-400 transition-all duration-300"
              title={`Pending: ${Math.round(pendingPct)}%`}
            />
          )}
          {overduePct > 0 && (
            <div
              style={{ width: `${overduePct}%` }}
              className="h-full bg-rose-500 transition-all duration-300"
              title={`Overdue: ${Math.round(overduePct)}%`}
            />
          )}
        </div>
      </div>

      {/* Client Revenue Contribution Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Client Invoicing Breakdown
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {topClients.length} clients
          </span>
        </div>

        {topClients.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No invoicing activity recorded in this timeframe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4 text-center">Invoices</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Share of Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {topClients.map((client, idx) => {
                  const share = totalInvoiced > 0 ? (client.total / totalInvoiced) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {client.name}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {client.company || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-700">
                        {client.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                        {formatCurrency(client.total, settings.currency, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-500">
                        {Math.round(share)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
