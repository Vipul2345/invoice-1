import React, { useState } from 'react';
import {
  Invoice,
  InvoiceItem,
  Customer,
  BusinessProfile,
  CountryCode,
  AppSettings,
} from '../types';
import { COUNTRIES } from '../lib/constants';
import { saveCustomer, formatCurrency } from '../lib/storage';
import {
  Plus,
  Trash2,
  UserPlus,
  ArrowLeft,
  FileCheck,
  Eye,
  Building,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface InvoiceEditorProps {
  initialInvoice?: Invoice;
  business: BusinessProfile;
  customers: Customer[];
  settings: AppSettings;
  onSave: (invoice: Invoice, previewImmediately?: boolean) => void;
  onCancel: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  business,
  customers,
  settings,
  onSave,
  onCancel,
  onCustomerCreated,
}) => {
  const isEditing = !!initialInvoice;
  const countryConfig = COUNTRIES[settings.country] || COUNTRIES.OTHER;
  const isIndia = settings.country === 'IN';

  // Customer selection mode
  const [customerMode, setCustomerMode] = useState<'select' | 'new'>(
    initialInvoice ? 'select' : customers.length > 0 ? 'select' : 'new'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialInvoice?.customerId || (customers.length > 0 ? customers[0].id : '')
  );

  // New customer inline form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTaxId, setNewCustTaxId] = useState('');

  // Invoice metadata
  const defaultNum = `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(4, '0')}`;
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || defaultNum
  );
  const [date, setDate] = useState(
    initialInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ||
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialInvoice?.paymentTerms || settings.defaultPaymentTerms || 'Net 14'
  );
  const [currency, setCurrency] = useState(
    initialInvoice?.currency || settings.currency || 'USD'
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    initialInvoice?.currencySymbol || settings.currencySymbol || '$'
  );
  const [templateId, setTemplateId] = useState(
    initialInvoice?.templateId || settings.defaultTemplateId || 'minimal'
  );
  const [notes, setNotes] = useState(
    initialInvoice?.notes ?? settings.defaultNotes
  );

  // Payment details
  const [bankName, setBankName] = useState(
    initialInvoice?.paymentDetails.bankName || business.bankDetails.bankName || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    initialInvoice?.paymentDetails.accountNumber ||
      business.bankDetails.accountNumber ||
      ''
  );
  const [routingCode, setRoutingCode] = useState(
    initialInvoice?.paymentDetails.routingCode ||
      business.bankDetails.routingCode ||
      ''
  );
  const [upiId, setUpiId] = useState(
    initialInvoice?.paymentDetails.upiId || business.bankDetails.upiId || ''
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialInvoice?.paymentDetails.instructions ||
      business.bankDetails.instructions ||
      ''
  );

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: `item-${Date.now()}-1`,
        description: 'Professional Consulting Services',
        quantity: 1,
        rate: 850,
        taxPercent: isIndia ? 18 : 0,
        discountPercent: 0,
        hsnSac: isIndia ? '998311' : '',
        amount: 850,
      },
    ]
  );

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Recalculate row amounts
  const computeItemAmount = (item: InvoiceItem): number => {
    const base = item.quantity * item.rate;
    const discount = base * ((item.discountPercent || 0) / 100);
    const discounted = base - discount;
    const tax = discounted * ((item.taxPercent || 0) / 100);
    return Math.round((discounted + tax) * 100) / 100;
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };
    current.amount = computeItemAmount(current);
    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = (
    preset?: { description: string; rate: number; taxPercent: number }
  ) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      description: preset?.description || '',
      quantity: 1,
      rate: preset?.rate || 0,
      taxPercent: preset?.taxPercent ?? (isIndia ? 18 : 0),
      discountPercent: 0,
      hsnSac: isIndia ? '998311' : '',
      amount: preset?.rate || 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrors({ ...errors, items: 'Invoice must have at least one line item.' });
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Grand totals calculation
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity * item.rate),
    0
  );
  const totalDiscount = items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    return sum + (base * ((item.discountPercent || 0) / 100));
  }, 0);
  const totalTax = items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const discounted = base - (base * ((item.discountPercent || 0) / 100));
    return sum + (discounted * ((item.taxPercent || 0) / 100));
  }, 0);
  const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

  // Handle Terms Change -> Auto update Due Date
  const handleTermsChange = (term: string) => {
    setPaymentTerms(term);
    const baseDate = new Date(date);
    let daysToAdd = 14;
    if (term === 'Due on Receipt') daysToAdd = 0;
    else if (term === 'Net 7') daysToAdd = 7;
    else if (term === 'Net 14') daysToAdd = 14;
    else if (term === 'Net 30') daysToAdd = 30;
    else if (term === 'Net 60') daysToAdd = 60;

    const newDue = new Date(baseDate.getTime() + daysToAdd * 86400000);
    setDueDate(newDue.toISOString().split('T')[0]);
  };

  // Validation and Submission
  const validateForm = (): Customer | null => {
    const newErrors: { [key: string]: string } = {};

    let customerToUse: Customer | null = null;

    if (customerMode === 'select') {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (!found) {
        newErrors.customer = 'Please select an existing customer or create a new one.';
      } else {
        customerToUse = found;
      }
    } else {
      if (!newCustName.trim()) {
        newErrors.customer = 'Please enter a customer name.';
      } else {
        const createdCustomer: Customer = {
          id: `customer-${Date.now()}`,
          name: newCustName.trim(),
          company: newCustCompany.trim(),
          email: newCustEmail.trim(),
          phone: newCustPhone.trim(),
          address: newCustAddress.trim(),
          taxId: newCustTaxId.trim(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        saveCustomer(createdCustomer);
        onCustomerCreated(createdCustomer);
        customerToUse = createdCustomer;
      }
    }

    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required.';
    }

    if (items.length === 0) {
      newErrors.items = 'Add at least one item before generating the invoice.';
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description.trim()) {
          newErrors.items = `Item #${i + 1} needs a description.`;
          break;
        }
        if (isNaN(item.quantity) || item.quantity <= 0) {
          newErrors.items = `Quantity for item #${i + 1} must be greater than 0.`;
          break;
        }
        if (isNaN(item.rate) || item.rate < 0) {
          newErrors.items = `Enter a valid price for item #${i + 1}.`;
          break;
        }
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return null;
    }
    return customerToUse;
  };

  const handleSubmit = (status: Invoice['status'], previewImmediately = false) => {
    const validCustomer = validateForm();
    if (!validCustomer) return;

    const invoicePayload: Invoice = {
      id: initialInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      customerId: validCustomer.id,
      customerSnapshot: validCustomer,
      date,
      dueDate,
      currency,
      currencySymbol,
      paymentTerms,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal,
      notes,
      paymentDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        routingCode: routingCode.trim(),
        upiId: upiId.trim(),
        instructions: paymentInstructions.trim(),
      },
      status,
      templateId,
      country: settings.country,
      createdAt: initialInvoice?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(invoicePayload, previewImmediately);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {isEditing ? `Edit ${invoiceNumber}` : 'Create New Invoice'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fill in line items and customer details. Saves instantly to local storage.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(initialInvoice?.status || 'pending', true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview & Print
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Please fix the following:
            </h4>
            <ul className="text-xs list-disc list-inside mt-1 space-y-0.5">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Business & Customer Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Info (From Local Profile) */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  From (Your Business)
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                Saved in Profile
              </span>
            </div>
            <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex items-start gap-3">
              {business.logoUrl && (
                <div className="w-11 h-11 bg-white rounded-md border border-neutral-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={business.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="font-bold text-neutral-900 text-sm">{business.name || 'Your Business Name'}</div>
                <div className="whitespace-pre-line text-neutral-600">{business.address || 'No address set'}</div>
                <div>{business.email} {business.phone ? `· ${business.phone}` : ''}</div>
                {business.taxId && (
                  <div className="font-medium text-neutral-800 pt-0.5">
                    {countryConfig.taxIdLabel}: {business.taxId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Selection / New Customer */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Bill To (Customer)
              </h3>
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCustomerMode('select')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    customerMode === 'select'
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    customerMode === 'new'
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  + New Customer
                </button>
              </div>
            </div>

            {customerMode === 'select' ? (
              <div className="space-y-3">
                {customers.length === 0 ? (
                  <div className="text-xs text-neutral-500 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
                    No customers saved yet.
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className="text-neutral-900 font-semibold underline ml-1"
                    >
                      Create one now
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Select Customer
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full text-xs font-medium bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Quick preview of selected customer */}
                    {selectedCustomerId && (
                      <div className="mt-2.5 text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-600">
                        {(() => {
                          const c = customers.find((item) => item.id === selectedCustomerId);
                          if (!c) return null;
                          return (
                            <>
                              <div className="font-semibold text-neutral-800">{c.name} · {c.company}</div>
                              <div className="text-neutral-500">{c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                              {c.taxId && <div className="text-[11px] font-medium text-neutral-700">{countryConfig.taxIdLabel}: {c.taxId}</div>}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-0.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-0.5">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={newCustCompany}
                      onChange={(e) => setNewCustCompany(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-0.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-0.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-0.5">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street, City, State, Postal Code"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-0.5">
                    {countryConfig.taxIdLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={`Client's ${countryConfig.taxIdLabel}`}
                    value={newCustTaxId}
                    onChange={(e) => setNewCustTaxId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Invoice Details Strip */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
            Invoice Parameters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Date Issued
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => handleTermsChange(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 14">Net 14 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Line Items
              </h3>
              <p className="text-xs text-neutral-500">
                Itemize products, labor, consulting hours, or services.
              </p>
            </div>

            {/* Quick item presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-neutral-400" /> Presets:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleAddItem({
                    description: 'Technical Consulting & Advisory (Hours)',
                    rate: 150,
                    taxPercent: isIndia ? 18 : 0,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors"
              >
                + Consulting
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddItem({
                    description: 'Service Call & Diagnostic Labor',
                    rate: 120,
                    taxPercent: isIndia ? 18 : 0,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors"
              >
                + Service Call
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddItem({
                    description: 'Hardware Parts & Replacement Materials',
                    rate: 280,
                    taxPercent: isIndia ? 18 : 5,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors"
              >
                + Parts
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-neutral-50/70 border border-neutral-200 rounded-lg text-xs space-y-2"
              >
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. HVAC Repair, Website redesign, or Consultation..."
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs"
                    />
                  </div>

                  {isIndia && (
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                        HSN/SAC
                      </label>
                      <input
                        type="text"
                        placeholder="998311"
                        value={item.hsnSac || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'hsnSac', e.target.value)
                        }
                        className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  )}

                  <div className="col-span-4 sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Rate ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'rate',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Tax %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.taxPercent}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'taxPercent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-1 text-right flex flex-col justify-end">
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Amount
                    </label>
                    <div className="py-2 font-mono font-bold text-neutral-900 text-xs">
                      {formatCurrency(item.amount, currency, currencySymbol)}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-end justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>
        </div>

        {/* Section 4: Totals & Notes & Payment Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Notes */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-xs">
              <label className="block font-bold text-neutral-900 uppercase tracking-wider mb-2">
                Notes & Terms
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business. Provide payment details or warranty notes here..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Payment Details */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-xs space-y-3">
              <h3 className="font-bold text-neutral-900 uppercase tracking-wider">
                Payment Details (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chase Bank, HDFC, Barclays"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    IFSC / Routing / Sort Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234 or 021000021"
                    value={routingCode}
                    onChange={(e) => setRoutingCode(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                {isIndia && (
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      UPI ID (Instant Mobile Pay)
                    </label>
                    <input
                      type="text"
                      placeholder="business@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Payment Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quote invoice number in transaction reference"
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-2 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Grand Totals Box */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(subtotal, currency, currencySymbol)}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700">
                    <span>Discount</span>
                    <span className="font-mono font-medium">
                      -{formatCurrency(totalDiscount, currency, currencySymbol)}
                    </span>
                  </div>
                )}
                {totalTax > 0 && (
                  <div className="flex justify-between py-1 text-neutral-600">
                    <span>Total {countryConfig.taxLabel}</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(totalTax, currency, currencySymbol)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-neutral-900 pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black font-mono text-neutral-950">
                    {formatCurrency(grandTotal, currency, currencySymbol)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('pending', true)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview & Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="w-full py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
