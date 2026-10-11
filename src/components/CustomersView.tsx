import React, { useState } from 'react';
import { Customer, Invoice, AppSettings } from '../types';
import { formatCurrency, saveCustomer, deleteCustomer } from '../lib/storage';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit2,
  Trash2,
  FileText,
  X,
  CheckCircle,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  settings: AppSettings;
  onCustomerUpdated: () => void;
  onCustomerSelect?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  settings,
  onCustomerUpdated,
  onCustomerSelect,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setCompany(customer.company);
    setEmail(customer.email);
    setPhone(customer.phone);
    setAddress(customer.address);
    setTaxId(customer.taxId);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    const payload: Customer = {
      id: editingCustomer ? editingCustomer.id : `customer-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      taxId: taxId.trim(),
      createdAt: editingCustomer?.createdAt || new Date().toISOString().split('T')[0],
    };

    saveCustomer(payload);
    setIsModalOpen(false);
    onCustomerUpdated();
  };

  const handleDelete = (id: string, customerName: string) => {
    if (confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
      deleteCustomer(id);
      onCustomerUpdated();
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q)
    );
  });

  // Calculate statistics per customer
  const getCustomerMetrics = (customerId: string) => {
    const custInvoices = invoices.filter((i) => i.customerId === customerId);
    const totalBilled = custInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const paidCount = custInvoices.filter((i) => i.status === 'paid').length;
    return {
      count: custInvoices.length,
      totalBilled,
      paidCount,
    };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your client directory, contact details, tax numbers, and billing histories.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <span className="text-xs text-neutral-500 font-medium">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'client' : 'clients'}
        </span>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center shadow-2xs">
          <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">No customers found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Add a customer to speed up invoice generation with one-click autofill.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            + Add First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const metrics = getCustomerMetrics(cust.id);
            return (
              <div
                key={cust.id}
                className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs hover:border-neutral-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-950">
                        {cust.name}
                      </h3>
                      {cust.company && (
                        <div className="text-xs font-medium text-neutral-600 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-neutral-400" />
                          <span>{cust.company}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cust.id, cust.name)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-neutral-600">
                    {cust.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                    {cust.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-neutral-500">{cust.address}</span>
                      </div>
                    )}
                    {cust.taxId && (
                      <div className="text-[11px] font-mono text-neutral-500 pt-1">
                        Tax ID: <span className="font-semibold text-neutral-800">{cust.taxId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-6 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-neutral-400 font-medium">Invoiced</span>
                    <div className="font-mono font-bold text-neutral-950">
                      {formatCurrency(metrics.totalBilled, settings.currency, settings.currencySymbol)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 font-medium">History</span>
                    <div className="font-medium text-neutral-700">
                      {metrics.count} {metrics.count === 1 ? 'invoice' : 'invoices'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Customer / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cyberdyne Systems"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, Suite, City, State, ZIP/Postal Code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Tax Registration Number (GSTIN / VAT / EIN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29AABCG1234F1Z5 or US-EIN-123456"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
