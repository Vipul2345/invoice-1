import React, { useState } from 'react';
import {
  Invoice,
  InvoiceItem,
  Customer,
  BusinessProfile,
  AppSettings,
  PricingMode,
} from '../types';
import { COUNTRIES } from '../lib/constants';
import { saveCustomer, formatCurrency } from '../lib/storage';
import {
  calculateLineItem,
  calculateDocumentTotals,
} from '../lib/taxCalculations';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  Building,
  AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Calculator,
} from 'lucide-react';
import { showToast } from './ToastNotification';

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

  // India Inter-State (IGST) vs Intra-State (CGST + SGST) toggle
  const [isInterState, setIsInterState] = useState(false);

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
    initialInvoice?.templateId || settings.defaultTemplateId || 'clean-professional'
  );
  const [notes, setNotes] = useState(
    initialInvoice?.notes ?? settings.defaultNotes
  );

  // Payment details
  const [bankName, setBankName] = useState(
    initialInvoice?.paymentDetails?.bankName || business.bankDetails.bankName || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    initialInvoice?.paymentDetails?.accountNumber ||
      business.bankDetails.accountNumber ||
      ''
  );
  const [routingCode, setRoutingCode] = useState(
    initialInvoice?.paymentDetails?.routingCode ||
      business.bankDetails.routingCode ||
      ''
  );
  const [upiId, setUpiId] = useState(
    initialInvoice?.paymentDetails?.upiId || business.bankDetails.upiId || ''
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialInvoice?.paymentDetails?.instructions ||
      business.bankDetails.instructions ||
      ''
  );

  // Initialize line items with full calculation engine guarantees
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const rawItems = initialInvoice?.items || [
      {
        id: `item-${Date.now()}-1`,
        description: 'Professional Consulting Services',
        itemCode: 'SRV-001',
        unit: 'hrs',
        quantity: 1,
        rate: 1000,
        taxPercent: isIndia ? 18 : 0,
        discountPercent: 0,
        hsnSac: isIndia ? '998311' : '',
        pricingMode: 'exclusive' as PricingMode,
        amount: 1000,
      },
    ];

    return rawItems.map((it) => {
      const mode = it.pricingMode || 'exclusive';
      const calc = calculateLineItem({
        quantity: it.quantity,
        rate: it.rate,
        taxPercent: it.taxPercent,
        discountPercent: it.discountPercent,
        pricingMode: mode,
        enteredTotal: it.enteredTotal ?? it.amount,
      });
      return {
        ...it,
        pricingMode: mode,
        rate: calc.rate,
        amount: calc.finalLineTotal,
        taxAmount: calc.lineTax,
        taxableAmount: calc.taxableLineTotal,
        enteredTotal: calc.enteredTotal,
      };
    });
  });

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Two-way calculation row update handler
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem | 'modeSwitch',
    value: any
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'modeSwitch') {
      const newMode = value as PricingMode;
      const currentCalc = calculateLineItem(item);
      item.pricingMode = newMode;
      if (newMode === 'inclusive_line') {
        item.enteredTotal = currentCalc.finalLineTotal;
      } else if (newMode === 'inclusive_unit') {
        item.enteredTotal = currentCalc.inclusiveUnitPrice;
      } else {
        // Mode A: exclusive
        item.rate = currentCalc.rate;
        item.enteredTotal = currentCalc.finalLineTotal;
      }
    } else {
      (item as any)[field] = value;
    }

    // Run unified calculation engine
    const calc = calculateLineItem({
      quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
      rate: typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0,
      taxPercent: typeof item.taxPercent === 'number' ? item.taxPercent : parseFloat(item.taxPercent) || 0,
      discountPercent: typeof item.discountPercent === 'number' ? item.discountPercent : parseFloat(item.discountPercent as any) || 0,
      pricingMode: item.pricingMode || 'exclusive',
      enteredTotal: typeof item.enteredTotal === 'number' ? item.enteredTotal : parseFloat(item.enteredTotal as any) || 0,
    });

    item.rate = calc.rate;
    item.amount = calc.finalLineTotal;
    item.taxAmount = calc.lineTax;
    item.taxableAmount = calc.taxableLineTotal;
    if (item.pricingMode === 'inclusive_line' || item.pricingMode === 'inclusive_unit') {
      item.enteredTotal = calc.enteredTotal;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = (
    preset?: { description: string; rate: number; taxPercent: number; itemCode?: string; unit?: string }
  ) => {
    const initialRate = preset?.rate || 0;
    const initialTax = preset?.taxPercent ?? (isIndia ? 18 : 0);
    const calc = calculateLineItem({
      quantity: 1,
      rate: initialRate,
      taxPercent: initialTax,
      discountPercent: 0,
      pricingMode: 'exclusive',
    });

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      description: preset?.description || '',
      itemCode: preset?.itemCode || '',
      unit: preset?.unit || 'units',
      quantity: 1,
      rate: calc.rate,
      taxPercent: calc.taxPercent,
      discountPercent: 0,
      hsnSac: isIndia ? '998311' : '',
      pricingMode: 'exclusive',
      enteredTotal: calc.finalLineTotal,
      taxAmount: calc.lineTax,
      taxableAmount: calc.taxableLineTotal,
      amount: calc.finalLineTotal,
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

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
  };

  // Grand totals calculation from unified engine
  const docTotals = calculateDocumentTotals(items, { isIndia, isInterState });
  const subtotal = docTotals.subtotal;
  const totalDiscount = docTotals.totalDiscount;
  const totalTax = docTotals.totalTax;
  const grandTotal = docTotals.grandTotal;

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
        showToast(`Customer "${createdCustomer.name}" created!`, 'info');
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
      subtotal,
      totalDiscount,
      totalTax,
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
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {isEditing ? `Edit ${invoiceNumber}` : 'Create New Invoice'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Two-way GST calculations & multiple pricing modes. Saves locally offline.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(initialInvoice?.status || 'pending', true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Preview & PDF
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
          {/* Business Info */}
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
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
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
                      className="text-neutral-900 font-semibold underline ml-1 cursor-pointer"
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Invoice Parameters
            </h3>
            {isIndia && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500 font-medium">GST Type:</span>
                <button
                  type="button"
                  onClick={() => setIsInterState(false)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    !isInterState ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Intra-State (CGST + SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setIsInterState(true)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    isInterState ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            )}
          </div>

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

        {/* Section 3: Line Items with Two-Way GST Calculator Connected to Item Rows */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Line Items & Two-Way GST Calculator
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose <span className="font-semibold text-neutral-700">Mode A</span> (enter unit price before tax) or <span className="font-semibold text-neutral-700">Mode B</span> (enter GST-inclusive total or unit price). Rows update immediately.
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
                    description: 'Technical Consulting & Advisory',
                    itemCode: 'SRV-CONS',
                    unit: 'hrs',
                    rate: 150,
                    taxPercent: isIndia ? 18 : 0,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                + Consulting
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddItem({
                    description: 'Diagnostic & Service Call Labor',
                    itemCode: 'SRV-LABOR',
                    unit: 'calls',
                    rate: 120,
                    taxPercent: isIndia ? 18 : 0,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                + Service Call
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddItem({
                    description: 'Replacement Hardware & Parts',
                    itemCode: 'PRT-MAT',
                    unit: 'pcs',
                    rate: 280,
                    taxPercent: isIndia ? 18 : 5,
                  })
                }
                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                + Parts
              </button>
            </div>
          </div>

          {/* Items Table with Connected Row Calculator */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const currentMode: PricingMode = item.pricingMode || 'exclusive';
              const isModeExclusive = currentMode === 'exclusive';
              const isModeInclusiveLine = currentMode === 'inclusive_line';
              const isModeInclusiveUnit = currentMode === 'inclusive_unit';

              return (
                <div
                  key={item.id}
                  className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-xl text-xs space-y-3 transition-colors hover:border-neutral-300"
                >
                  {/* Top Row Toolbar: Item Index, Item Code, Unit, Mode Selector, Reorder, Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-200/70">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-400 bg-neutral-200/60 px-2 py-0.5 rounded text-[11px]">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Item Code / SKU"
                          value={item.itemCode || ''}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                          className="w-28 bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-800 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          title="Item code, SKU or catalog number"
                        />
                        <input
                          type="text"
                          placeholder="Unit (pcs, hrs)"
                          value={item.unit || ''}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-24 bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          title="Unit of measurement"
                        />
                      </div>
                    </div>

                    {/* Pricing Mode Toggle: Mode A vs Mode B */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-neutral-500 mr-1">
                        Pricing Mode:
                      </span>
                      <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-[11px] font-medium">
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'modeSwitch', 'exclusive')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isModeExclusive
                              ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                          title="Mode A: Enter base unit price before GST; calculates tax and total"
                        >
                          Mode A: Excl. Tax
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'modeSwitch', 'inclusive_line')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isModeInclusiveLine
                              ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                          title="Mode B: Enter final line total including GST; calculates base unit price"
                        >
                          Mode B: Final Line Total (Incl.)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'modeSwitch', 'inclusive_unit')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isModeInclusiveUnit
                              ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                          title="Mode B (Unit): Enter final unit price including GST"
                        >
                          Mode B: Unit Price (Incl.)
                        </button>
                      </div>

                      {/* Reorder and Delete controls */}
                      <div className="flex items-center gap-0.5 ml-2">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Move item up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Move item down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                          title="Delete line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Inputs Row */}
                  <div className="grid grid-cols-12 gap-3 items-start">
                    {/* Description */}
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Description *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Description of item, service, materials, or hours..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs"
                      />
                    </div>

                    {/* HSN / SAC (India specific) */}
                    {isIndia && (
                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          HSN/SAC
                        </label>
                        <input
                          type="text"
                          placeholder="998311"
                          value={item.hsnSac || ''}
                          onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    {/* Contextual Input Field: Mode A vs Mode B */}
                    <div className={`col-span-6 ${isIndia ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
                      {isModeExclusive ? (
                        <>
                          <label className="block text-[11px] font-semibold text-neutral-800 mb-1">
                            Unit price before GST ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </>
                      ) : isModeInclusiveLine ? (
                        <>
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                            Final line total incl. GST ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.enteredTotal ?? item.amount}
                            onChange={(e) =>
                              handleItemChange(index, 'enteredTotal', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-emerald-50/50 border border-emerald-400 rounded-md p-2 text-neutral-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                            Final unit price incl. GST ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.enteredTotal ?? item.rate}
                            onChange={(e) =>
                              handleItemChange(index, 'enteredTotal', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-emerald-50/50 border border-emerald-400 rounded-md p-2 text-neutral-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </>
                      )}
                    </div>

                    {/* Tax % */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        {countryConfig.taxLabel} %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={item.taxPercent}
                        onChange={(e) =>
                          handleItemChange(index, 'taxPercent', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Disc. %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={item.discountPercent || 0}
                        onChange={(e) =>
                          handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-neutral-300 rounded-md p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    {/* Live Row Output Strip */}
                    <div className="col-span-12 sm:col-span-2 text-right flex flex-col justify-end">
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                        Final Line Total
                      </label>
                      <div className="py-2 font-mono font-bold text-neutral-950 text-sm">
                        {formatCurrency(item.amount, currency, currencySymbol)}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Values Summary Strip for Full Transparency */}
                  <div className="p-2 bg-white rounded-lg border border-neutral-200/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-600">
                    <div>
                      <span className="text-neutral-400">Taxable Unit Price (excl):</span>{' '}
                      <span className="font-mono font-semibold text-neutral-900">
                        {formatCurrency(item.rate, currency, currencySymbol)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Taxable Subtotal:</span>{' '}
                      <span className="font-mono font-semibold text-neutral-900">
                        {formatCurrency(item.taxableAmount || (item.quantity * item.rate), currency, currencySymbol)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Line {countryConfig.taxLabel} ({item.taxPercent}%):</span>{' '}
                      <span className="font-mono font-semibold text-neutral-900">
                        {formatCurrency(item.taxAmount || 0, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="font-bold text-neutral-900">
                      <span>Line Total: </span>
                      <span className="font-mono text-emerald-700">
                        {formatCurrency(item.amount, currency, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>
        </div>

        {/* Section 4: Totals & Notes & Payment Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Template Selection in Editor */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-xs">
              <label className="block font-bold text-neutral-900 uppercase tracking-wider mb-2">
                Document Template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="clean-professional">Clean Professional (Emerald Green accent & alternating rows)</option>
                <option value="detailed-business">Detailed Business (Item codes, units & comprehensive tax breakdown)</option>
                <option value="modern-minimal">Modern Minimal (Generous whitespace & premium typography)</option>
                <option value="minimal">Minimal Clean</option>
                <option value="modern">Modern Accent</option>
                <option value="corporate">Corporate Executive</option>
              </select>
            </div>

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

          {/* Grand Totals Box with Multi-Tax Breakdown */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Summary & Tax Breakdown
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Subtotal (Base)</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(subtotal, currency, currencySymbol)}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">
                      -{formatCurrency(totalDiscount, currency, currencySymbol)}
                    </span>
                  </div>
                )}

                {/* Tax Breakdown per tax group */}
                {docTotals.taxGroups.map((tg) => (
                  <div key={tg.taxPercent} className="space-y-1 pt-1 border-t border-neutral-100 text-neutral-600">
                    <div className="flex justify-between">
                      <span>{countryConfig.taxLabel} ({tg.taxPercent}%) on {formatCurrency(tg.taxableAmount, currency, currencySymbol)}</span>
                      <span className="font-mono font-medium text-neutral-900">
                        {formatCurrency(tg.taxAmount, currency, currencySymbol)}
                      </span>
                    </div>
                    {isIndia && tg.cgstAmount !== undefined && tg.cgstAmount > 0 && (
                      <div className="pl-3 text-[11px] text-neutral-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>CGST ({tg.taxPercent / 2}%)</span>
                          <span className="font-mono">{formatCurrency(tg.cgstAmount, currency, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST ({tg.taxPercent / 2}%)</span>
                          <span className="font-mono">{formatCurrency(tg.sgstAmount || 0, currency, currencySymbol)}</span>
                        </div>
                      </div>
                    )}
                    {isIndia && tg.igstAmount !== undefined && tg.igstAmount > 0 && (
                      <div className="pl-3 text-[11px] text-neutral-500 flex justify-between">
                        <span>IGST ({tg.taxPercent}%)</span>
                        <span className="font-mono">{formatCurrency(tg.igstAmount, currency, currencySymbol)}</span>
                      </div>
                    )}
                  </div>
                ))}

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
                  className="w-full py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Preview & Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="w-full py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
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
