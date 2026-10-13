import {
  getQuotations,
  saveQuotation,
  getQuotationById,
  convertQuotationToInvoice,
  getInvoiceById,
  generateExportPayload,
  importBackupPayload,
} from '../src/lib/storage';
import { Quotation, Invoice } from '../src/types';

// Mock localStorage for Node environment
const storageMock: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => { storageMock[key] = value; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: 0,
};
global.window = {
  dispatchEvent: () => true,
} as any;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function runStorageTests() {
  console.log('--- RUNNING QUOTATION & CONVERSION TESTS ---');

  // 1. Initial quotations check
  const quotations = getQuotations();
  assert(quotations.length > 0, 'Initial quotations loaded');

  const testQuo: Quotation = {
    id: 'test-quo-999',
    quotationNumber: 'QUO-0999',
    customerId: 'cust-123',
    customerSnapshot: {
      id: 'cust-123',
      name: 'Alice Johnson',
      company: 'Wonderland Design',
      email: 'alice@wonderland.io',
      phone: '+1 555-0199',
      address: '100 Rabbit Hole Way',
      taxId: 'TAX-998877',
      createdAt: '2026-10-01',
    },
    date: '2026-10-12',
    validUntil: '2026-11-12',
    currency: 'USD',
    currencySymbol: '$',
    paymentTerms: 'Net 30',
    items: [
      {
        id: 'item-q1',
        description: 'Brand Identity Strategy',
        itemCode: 'BRAND-01',
        unit: 'hrs',
        quantity: 10,
        rate: 200,
        taxPercent: 10,
        discountPercent: 5,
        pricingMode: 'exclusive',
        taxAmount: 190,
        taxableAmount: 1900,
        amount: 2090,
      },
    ],
    subtotal: 2000,
    totalDiscount: 100,
    totalTax: 190,
    grandTotal: 2090,
    notes: 'Quotation valid for 30 days',
    paymentDetails: {},
    status: 'sent',
    templateId: 'clean-professional',
    country: 'US',
    createdAt: '2026-10-12',
    updatedAt: '2026-10-12',
  };

  saveQuotation(testQuo);
  const loadedQuo = getQuotationById('test-quo-999');
  assert(!!loadedQuo, 'Quotation saved and retrieved successfully');
  assert(loadedQuo?.quotationNumber === 'QUO-0999', 'Quotation number matches');

  // 2. Convert Quotation to Invoice
  const convResult1 = convertQuotationToInvoice('test-quo-999');
  assert(convResult1.success, 'Quotation converted successfully');
  assert(!!convResult1.invoice, 'Generated invoice object returned');
  const generatedInv = convResult1.invoice!;

  assert(generatedInv.id !== testQuo.id, 'Invoice ID is NEVER equal to Quotation ID');
  assert(generatedInv.invoiceNumber.startsWith('INV-'), 'Invoice has unique invoice number with prefix');
  assert(generatedInv.customerSnapshot.name === 'Alice Johnson', 'Customer copied accurately');
  assert(generatedInv.items.length === 1, 'Line items copied');
  assert(generatedInv.items[0].description === 'Brand Identity Strategy', 'Item details preserved');
  assert(generatedInv.grandTotal === 2090, 'Grand total preserved');
  assert(generatedInv.subtotal === 2000, 'Subtotal preserved');
  assert(generatedInv.totalTax === 190, 'Tax preserved');
  assert(generatedInv.paymentTerms === 'Net 30', 'Payment terms preserved');

  // Check quotation updated status & link
  const afterConvQuo = getQuotationById('test-quo-999');
  assert(afterConvQuo?.status === 'accepted', 'Quotation status updated to accepted');
  assert(afterConvQuo?.convertedInvoiceId === generatedInv.id, 'Quotation stores convertedInvoiceId link');

  // 3. Prevent duplicate conversion
  const convResult2 = convertQuotationToInvoice('test-quo-999');
  assert(!convResult2.success, 'Duplicate conversion attempt blocked');
  assert(convResult2.error?.includes('already converted') ?? false, 'Helpful error returned on duplicate attempt');

  // 4. JSON Backup Export & Import with Quotations
  const exportPayload = generateExportPayload();
  assert(!!exportPayload.quotations, 'Export payload contains quotations array');
  assert(exportPayload.quotations?.some(q => q.id === 'test-quo-999') ?? false, 'Export payload includes saved quotation');

  // 5. Backward compatibility test: Import an older payload that lacks `quotations`
  const olderLegacyPayload = {
    version: '1.0.0',
    exportedAt: '2026-09-01T00:00:00.000Z',
    business: exportPayload.business,
    customers: exportPayload.customers,
    invoices: [
      {
        ...generatedInv,
        items: [
          {
            id: 'legacy-item-1',
            description: 'Legacy item without pricingMode',
            quantity: 1,
            rate: 500,
            taxPercent: 0,
            amount: 500,
          },
        ],
      },
    ],
    settings: exportPayload.settings,
    customTemplates: [],
  };

  const importResult = importBackupPayload(olderLegacyPayload as any);
  assert(importResult, 'Older legacy backup imported successfully without errors');
  const migratedInvoice = getInvoiceById(generatedInv.id);
  assert(migratedInvoice?.items[0].pricingMode === 'exclusive', 'Legacy line item migrated with default pricingMode: exclusive');

  console.log('ALL QUOTATION AND STORAGE TESTS PASSED SUCCESSFULLY!');
}

runStorageTests();
