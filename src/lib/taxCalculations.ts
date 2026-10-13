/**
 * Tax & Two-Way GST Calculation Engine for InvoiceFlow
 * Supports:
 * - Mode A: Enter unit price before tax -> calculates tax and final line total
 * - Mode B: Enter final total including tax (or inclusive unit price) -> calculates base unit price before tax
 * - Discounts applied consistently without double-counting
 * - Non-negative validations, zero GST safe handling
 * - Multi-country tax breakdown (including India CGST/SGST/IGST split)
 */

export type PricingMode = 'exclusive' | 'inclusive_line' | 'inclusive_unit';

export interface LineItemTaxInput {
  quantity: number;
  rate: number; // Base taxable unit price before tax
  taxPercent: number; // e.g. 18 for 18%
  discountPercent?: number; // e.g. 5 for 5%
  pricingMode?: PricingMode;
  enteredTotal?: number; // In inclusive_line or inclusive_unit mode
}

export interface LineItemTaxResult {
  quantity: number;
  rate: number; // Base taxable unit price before tax (rounded to 2 decimal places)
  taxPercent: number;
  discountPercent: number;
  pricingMode: PricingMode;
  enteredTotal: number;

  // Breakdown values
  baseLineTotal: number; // quantity * rate
  discountAmount: number; // baseLineTotal * (discountPercent / 100)
  taxableLineTotal: number; // baseLineTotal - discountAmount
  lineTax: number; // taxableLineTotal * (taxPercent / 100)
  finalLineTotal: number; // taxableLineTotal + lineTax
  
  // Per-unit breakdown
  taxPerUnit: number;
  inclusiveUnitPrice: number;
}

/**
 * Standard monetary rounding to 2 decimal places.
 */
export function roundCurrency(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Compute line item values based on pricing mode.
 * 
 * Mode A ('exclusive'):
 *   User entered base unit price (rate).
 *   baseLineTotal = quantity * rate
 *   discount = baseLineTotal * (discountPercent / 100)
 *   taxableLineTotal = baseLineTotal - discount
 *   lineTax = taxableLineTotal * (taxPercent / 100)
 *   finalLineTotal = taxableLineTotal + lineTax
 * 
 * Mode B ('inclusive_line'):
 *   User entered final line total including tax (enteredTotal).
 *   Accounting for discount D and tax rate T:
 *   finalLineTotal = enteredTotal
 *   taxableLineTotal = finalLineTotal / (1 + taxPercent / 100)
 *   lineTax = finalLineTotal - taxableLineTotal
 *   baseLineTotal = discountPercent > 0 ? taxableLineTotal / (1 - discountPercent / 100) : taxableLineTotal
 *   baseUnitPrice = baseLineTotal / quantity
 * 
 * Mode B ('inclusive_unit'):
 *   User entered final unit price including tax (enteredTotal).
 *   inclusiveUnitPrice = enteredTotal
 *   finalLineTotal = inclusiveUnitPrice * quantity
 *   taxableLineTotal = finalLineTotal / (1 + taxPercent / 100)
 *   lineTax = finalLineTotal - taxableLineTotal
 *   baseLineTotal = discountPercent > 0 ? taxableLineTotal / (1 - discountPercent / 100) : taxableLineTotal
 *   baseUnitPrice = baseLineTotal / quantity
 */
export function calculateLineItem(input: LineItemTaxInput): LineItemTaxResult {
  const quantity = Math.max(0.0001, isNaN(input.quantity) ? 1 : input.quantity);
  const taxPercent = Math.max(0, isNaN(input.taxPercent) ? 0 : input.taxPercent);
  const discountPercent = Math.min(100, Math.max(0, isNaN(input.discountPercent || 0) ? 0 : input.discountPercent || 0));
  const pricingMode = input.pricingMode || 'exclusive';

  const taxMultiplier = 1 + taxPercent / 100;
  const discountMultiplier = discountPercent > 0 ? 1 - discountPercent / 100 : 1;

  let rate = Math.max(0, isNaN(input.rate) ? 0 : input.rate);
  let enteredTotal = input.enteredTotal !== undefined && !isNaN(input.enteredTotal) ? Math.max(0, input.enteredTotal) : 0;
  let finalLineTotal = 0;
  let taxableLineTotal = 0;
  let lineTax = 0;
  let discountAmount = 0;
  let baseLineTotal = 0;

  if (pricingMode === 'inclusive_line') {
    // Authoritative source: enteredTotal is the final line total including GST
    finalLineTotal = roundCurrency(enteredTotal);
    taxableLineTotal = roundCurrency(finalLineTotal / taxMultiplier);
    lineTax = roundCurrency(finalLineTotal - taxableLineTotal);

    if (discountMultiplier > 0 && discountMultiplier < 1) {
      baseLineTotal = roundCurrency(taxableLineTotal / discountMultiplier);
      discountAmount = roundCurrency(baseLineTotal - taxableLineTotal);
    } else {
      baseLineTotal = taxableLineTotal;
      discountAmount = 0;
    }
    rate = roundCurrency(baseLineTotal / quantity);
  } else if (pricingMode === 'inclusive_unit') {
    // Authoritative source: enteredTotal is the final unit price including GST
    const inclusiveUnitPrice = roundCurrency(enteredTotal);
    finalLineTotal = roundCurrency(inclusiveUnitPrice * quantity);
    taxableLineTotal = roundCurrency(finalLineTotal / taxMultiplier);
    lineTax = roundCurrency(finalLineTotal - taxableLineTotal);

    if (discountMultiplier > 0 && discountMultiplier < 1) {
      baseLineTotal = roundCurrency(taxableLineTotal / discountMultiplier);
      discountAmount = roundCurrency(baseLineTotal - taxableLineTotal);
    } else {
      baseLineTotal = taxableLineTotal;
      discountAmount = 0;
    }
    rate = roundCurrency(baseLineTotal / quantity);
  } else {
    // Mode A: exclusive - authoritative source: rate (unit price before GST)
    rate = roundCurrency(rate);
    baseLineTotal = roundCurrency(quantity * rate);
    discountAmount = roundCurrency(baseLineTotal * (discountPercent / 100));
    taxableLineTotal = roundCurrency(baseLineTotal - discountAmount);
    lineTax = roundCurrency(taxableLineTotal * (taxPercent / 100));
    finalLineTotal = roundCurrency(taxableLineTotal + lineTax);
    enteredTotal = finalLineTotal;
  }

  const taxPerUnit = quantity > 0 ? roundCurrency(lineTax / quantity) : 0;
  const inclusiveUnitPrice = quantity > 0 ? roundCurrency(finalLineTotal / quantity) : 0;

  return {
    quantity,
    rate,
    taxPercent,
    discountPercent,
    pricingMode,
    enteredTotal,
    baseLineTotal,
    discountAmount,
    taxableLineTotal,
    lineTax,
    finalLineTotal,
    taxPerUnit,
    inclusiveUnitPrice,
  };
}

export interface TaxGroupBreakdown {
  taxPercent: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

export interface DocumentTotals {
  subtotal: number; // Sum of base line amounts before discount
  totalDiscount: number; // Sum of discounts
  taxableSubtotal: number; // subtotal - totalDiscount
  totalTax: number; // Sum of line taxes
  grandTotal: number; // taxableSubtotal + totalTax
  taxGroups: TaxGroupBreakdown[]; // Breakdown grouped by tax %
}

/**
 * Calculates document-wide totals and tax breakdowns from line items.
 */
export function calculateDocumentTotals(
  items: Array<{
    quantity: number;
    rate: number;
    taxPercent: number;
    discountPercent?: number;
    pricingMode?: PricingMode;
    enteredTotal?: number;
  }>,
  options?: { isIndia?: boolean; isInterState?: boolean }
): DocumentTotals {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const groupsMap = new Map<number, { taxableAmount: number; taxAmount: number }>();

  items.forEach((item) => {
    const calc = calculateLineItem(item);
    subtotal += calc.baseLineTotal;
    totalDiscount += calc.discountAmount;
    totalTax += calc.lineTax;

    const current = groupsMap.get(calc.taxPercent) || { taxableAmount: 0, taxAmount: 0 };
    current.taxableAmount += calc.taxableLineTotal;
    current.taxAmount += calc.lineTax;
    groupsMap.set(calc.taxPercent, current);
  });

  subtotal = roundCurrency(subtotal);
  totalDiscount = roundCurrency(totalDiscount);
  totalTax = roundCurrency(totalTax);
  const taxableSubtotal = roundCurrency(subtotal - totalDiscount);
  const grandTotal = roundCurrency(taxableSubtotal + totalTax);

  const isIndia = options?.isIndia ?? false;
  const isInterState = options?.isInterState ?? false;

  const taxGroups: TaxGroupBreakdown[] = Array.from(groupsMap.entries())
    .map(([taxPercent, data]) => {
      const taxable = roundCurrency(data.taxableAmount);
      const tax = roundCurrency(data.taxAmount);
      const group: TaxGroupBreakdown = {
        taxPercent,
        taxableAmount: taxable,
        taxAmount: tax,
      };

      if (isIndia && taxPercent > 0) {
        if (isInterState) {
          group.igstAmount = tax;
          group.cgstAmount = 0;
          group.sgstAmount = 0;
        } else {
          const half = roundCurrency(tax / 2);
          group.cgstAmount = half;
          group.sgstAmount = roundCurrency(tax - half);
          group.igstAmount = 0;
        }
      }

      return group;
    })
    .sort((a, b) => a.taxPercent - b.taxPercent);

  return {
    subtotal,
    totalDiscount,
    taxableSubtotal,
    totalTax,
    grandTotal,
    taxGroups,
  };
}
