import { calculateLineItem, calculateDocumentTotals, roundCurrency } from '../src/lib/taxCalculations';

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log('--- RUNNING TAX & GST CALCULATION TESTS ---');

  // Test 1: ₹1,000 unit price, quantity 1, GST 18% → ₹180 tax, ₹1,180 total.
  const t1 = calculateLineItem({
    quantity: 1,
    rate: 1000,
    taxPercent: 18,
    pricingMode: 'exclusive',
  });
  assertEqual(t1.rate, 1000, 'Test 1: base unit price is 1000');
  assertEqual(t1.taxableLineTotal, 1000, 'Test 1: taxable subtotal is 1000');
  assertEqual(t1.lineTax, 180, 'Test 1: GST amount is 180');
  assertEqual(t1.finalLineTotal, 1180, 'Test 1: final total is 1180');

  // Test 2: ₹1,000 unit price, quantity 2, GST 18% → ₹360 tax, ₹2,360 total.
  const t2 = calculateLineItem({
    quantity: 2,
    rate: 1000,
    taxPercent: 18,
    pricingMode: 'exclusive',
  });
  assertEqual(t2.rate, 1000, 'Test 2: base unit price is 1000');
  assertEqual(t2.taxableLineTotal, 2000, 'Test 2: taxable subtotal is 2000');
  assertEqual(t2.lineTax, 360, 'Test 2: GST amount is 360');
  assertEqual(t2.finalLineTotal, 2360, 'Test 2: final line total is 2360');

  // Test 3: ₹1,180 inclusive unit price, quantity 1, GST 18% → ₹1,000 base unit price, ₹180 tax.
  const t3 = calculateLineItem({
    quantity: 1,
    rate: 0,
    taxPercent: 18,
    pricingMode: 'inclusive_unit',
    enteredTotal: 1180,
  });
  assertEqual(t3.rate, 1000, 'Test 3: calculated base unit price is 1000');
  assertEqual(t3.taxableLineTotal, 1000, 'Test 3: taxable subtotal is 1000');
  assertEqual(t3.lineTax, 180, 'Test 3: GST amount is 180');
  assertEqual(t3.finalLineTotal, 1180, 'Test 3: final line total is 1180');

  // Test 4: ₹2,360 inclusive line total, quantity 2, GST 18% → ₹1,000 base unit price, ₹360 total tax.
  const t4 = calculateLineItem({
    quantity: 2,
    rate: 0,
    taxPercent: 18,
    pricingMode: 'inclusive_line',
    enteredTotal: 2360,
  });
  assertEqual(t4.rate, 1000, 'Test 4: calculated base unit price is 1000');
  assertEqual(t4.taxableLineTotal, 2000, 'Test 4: taxable subtotal is 2000');
  assertEqual(t4.lineTax, 360, 'Test 4: GST amount is 360');
  assertEqual(t4.finalLineTotal, 2360, 'Test 4: final line total is 2360');

  // Test 5: ₹1,180 inclusive line total, quantity 1, GST 18% → ₹1,000 base unit price, ₹180 tax.
  const t5 = calculateLineItem({
    quantity: 1,
    rate: 0,
    taxPercent: 18,
    pricingMode: 'inclusive_line',
    enteredTotal: 1180,
  });
  assertEqual(t5.rate, 1000, 'Test 5: calculated base unit price is 1000');
  assertEqual(t5.taxableLineTotal, 1000, 'Test 5: taxable subtotal is 1000');
  assertEqual(t5.lineTax, 180, 'Test 5: GST amount is 180');
  assertEqual(t5.finalLineTotal, 1180, 'Test 5: final line total is 1180');

  // Test 6: Zero GST produces correct unchanged total.
  const t6a = calculateLineItem({
    quantity: 3,
    rate: 500,
    taxPercent: 0,
    pricingMode: 'exclusive',
  });
  assertEqual(t6a.rate, 500, 'Test 6a: zero GST exclusive rate 500');
  assertEqual(t6a.lineTax, 0, 'Test 6a: zero GST line tax is 0');
  assertEqual(t6a.finalLineTotal, 1500, 'Test 6a: zero GST final line total is 1500');

  const t6b = calculateLineItem({
    quantity: 4,
    rate: 0,
    taxPercent: 0,
    pricingMode: 'inclusive_line',
    enteredTotal: 2000,
  });
  assertEqual(t6b.rate, 500, 'Test 6b: zero GST inclusive rate 500');
  assertEqual(t6b.lineTax, 0, 'Test 6b: zero GST line tax is 0');
  assertEqual(t6b.finalLineTotal, 2000, 'Test 6b: zero GST final line total is 2000');

  // Test 7: Changing quantity or GST rate updates item row and invoice totals.
  const itemInput = {
    quantity: 2,
    rate: 1000,
    taxPercent: 18,
    pricingMode: 'exclusive' as const,
  };
  const docBefore = calculateDocumentTotals([itemInput]);
  assertEqual(docBefore.grandTotal, 2360, 'Test 7a: initial grand total is 2360');

  // Update quantity to 3
  const docAfterQty = calculateDocumentTotals([{ ...itemInput, quantity: 3 }]);
  assertEqual(docAfterQty.subtotal, 3000, 'Test 7b: updated subtotal is 3000');
  assertEqual(docAfterQty.totalTax, 540, 'Test 7b: updated total tax is 540');
  assertEqual(docAfterQty.grandTotal, 3540, 'Test 7b: updated grand total is 3540');

  // Update GST to 12%
  const docAfterGst = calculateDocumentTotals([{ ...itemInput, quantity: 3, taxPercent: 12 }]);
  assertEqual(docAfterGst.totalTax, 360, 'Test 7c: updated total tax at 12% is 360');
  assertEqual(docAfterGst.grandTotal, 3360, 'Test 7c: updated grand total is 3360');

  // Test 8: Switching pricing modes must not silently reinterpret or corrupt the existing amount.
  // Start in exclusive with rate 1000, qty 2, GST 18% -> finalLineTotal is 2360
  const origExclusive = calculateLineItem({
    quantity: 2,
    rate: 1000,
    taxPercent: 18,
    pricingMode: 'exclusive',
  });
  assertEqual(origExclusive.finalLineTotal, 2360, 'Test 8: initial final total 2360');
  // Switch to inclusive_line: the enteredTotal is set to previous finalLineTotal (2360)
  const switchedToInclusive = calculateLineItem({
    quantity: 2,
    rate: origExclusive.rate,
    taxPercent: 18,
    pricingMode: 'inclusive_line',
    enteredTotal: origExclusive.finalLineTotal,
  });
  assertEqual(switchedToInclusive.rate, 1000, 'Test 8: rate preserved as 1000 when switching to inclusive_line');
  assertEqual(switchedToInclusive.finalLineTotal, 2360, 'Test 8: total preserved as 2360');

  // Switch back to exclusive: rate is preserved from calculated rate
  const switchedBack = calculateLineItem({
    quantity: 2,
    rate: switchedToInclusive.rate,
    taxPercent: 18,
    pricingMode: 'exclusive',
  });
  assertEqual(switchedBack.rate, 1000, 'Test 8: rate preserved as 1000 when switching back to exclusive');
  assertEqual(switchedBack.finalLineTotal, 2360, 'Test 8: final total preserved as 2360');

  // Test 9: Discounts and rounding must not cause the same tax to be counted twice.
  // Rate 1000, qty 2, discount 10%, GST 18%:
  // Base total = 2000. Discount = 200. Taxable subtotal = 1800.
  // Tax (18% of 1800) = 324.
  // Final total = 1800 + 324 = 2124.
  const t9 = calculateLineItem({
    quantity: 2,
    rate: 1000,
    taxPercent: 18,
    discountPercent: 10,
    pricingMode: 'exclusive',
  });
  assertEqual(t9.baseLineTotal, 2000, 'Test 9: base line total is 2000');
  assertEqual(t9.discountAmount, 200, 'Test 9: discount amount is 200');
  assertEqual(t9.taxableLineTotal, 1800, 'Test 9: taxable line total is 1800');
  assertEqual(t9.lineTax, 324, 'Test 9: tax is 324 (18% of 1800, no double counting)');
  assertEqual(t9.finalLineTotal, 2124, 'Test 9: final line total is 2124');

  const docWithDiscount = calculateDocumentTotals([t9], { isIndia: true, isInterState: false });
  assertEqual(docWithDiscount.subtotal, 2000, 'Test 9: doc subtotal is 2000');
  assertEqual(docWithDiscount.totalDiscount, 200, 'Test 9: doc total discount is 200');
  assertEqual(docWithDiscount.taxableSubtotal, 1800, 'Test 9: doc taxable subtotal is 1800');
  assertEqual(docWithDiscount.totalTax, 324, 'Test 9: doc total tax is 324');
  assertEqual(docWithDiscount.grandTotal, 2124, 'Test 9: doc grand total is 2124');
  assertEqual(docWithDiscount.taxGroups[0].cgstAmount, 162, 'Test 9: CGST is 162 (half of 324)');
  assertEqual(docWithDiscount.taxGroups[0].sgstAmount, 162, 'Test 9: SGST is 162 (half of 324)');

  console.log('ALL MANDATORY TAX CALCULATION TESTS PASSED SUCCESSFULLY!');
}

runTests();
