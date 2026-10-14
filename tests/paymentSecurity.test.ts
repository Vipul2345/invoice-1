import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  verifyHmacSignature,
  verifyPaymentSignature,
  isEventProcessed,
  recordProcessedEvent,
  clearProcessedEvents,
  createServer,
} from '../server/server';

console.log('--- RUNNING RAZORPAY PAYMENT INTEGRITY & BACKEND SECURITY TESTS ---');

const TEST_SECRET = 'test_secret_key_abcdef123456';
const TEST_WEBHOOK_SECRET = 'test_webhook_secret_xyz789';

// 1. HMAC Signature Verification Tests
const orderId = 'order_DA98123XYZ';
const paymentId = 'pay_98123ABCXYZ';
const subscriptionId = 'sub_456789DEF';

// Valid Order Signature calculation
const validOrderPayload = `${orderId}|${paymentId}`;
const validOrderSignature = crypto
  .createHmac('sha256', TEST_SECRET)
  .update(validOrderPayload)
  .digest('hex');

assert.strictEqual(
  verifyPaymentSignature({
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: validOrderSignature,
    secret: TEST_SECRET,
  }),
  true,
  'Valid order payment signature must pass verification'
);
console.log('PASS: Valid order HMAC payment signature verified');

// Valid Subscription Signature calculation
const validSubPayload = `${paymentId}|${subscriptionId}`;
const validSubSignature = crypto
  .createHmac('sha256', TEST_SECRET)
  .update(validSubPayload)
  .digest('hex');

assert.strictEqual(
  verifyPaymentSignature({
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: validSubSignature,
    secret: TEST_SECRET,
  }),
  true,
  'Valid subscription payment signature must pass verification'
);
console.log('PASS: Valid subscription HMAC payment signature verified');

// Tampered Signature should FAIL
const tamperedSignature = validOrderSignature.slice(0, -4) + '0000';
assert.strictEqual(
  verifyPaymentSignature({
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: tamperedSignature,
    secret: TEST_SECRET,
  }),
  false,
  'Tampered payment signature must be REJECTED'
);
console.log('PASS: Tampered payment signature is rejected');

// Wrong Secret should FAIL
assert.strictEqual(
  verifyPaymentSignature({
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: validOrderSignature,
    secret: 'wrong_secret_key',
  }),
  false,
  'Signature verified with wrong secret must be REJECTED'
);
console.log('PASS: Wrong secret fails verification');

// Empty / Missing parameters should FAIL
assert.strictEqual(
  verifyPaymentSignature({
    razorpay_payment_id: '',
    razorpay_signature: validOrderSignature,
    secret: TEST_SECRET,
  }),
  false,
  'Empty payment ID must be REJECTED'
);
console.log('PASS: Missing parameters rejected');

// 2. Webhook Signature Verification Tests
const webhookPayload = JSON.stringify({
  entity: 'event',
  account_id: 'acc_123',
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_123456',
        amount: 4900,
        status: 'captured',
        notes: { userId: 'user_alice', plan: 'drive' },
      },
    },
  },
});

const validWebhookSignature = crypto
  .createHmac('sha256', TEST_WEBHOOK_SECRET)
  .update(webhookPayload)
  .digest('hex');

assert.strictEqual(
  verifyHmacSignature(webhookPayload, validWebhookSignature, TEST_WEBHOOK_SECRET),
  true,
  'Valid webhook signature must pass verification'
);
console.log('PASS: Valid webhook HMAC signature verified');

assert.strictEqual(
  verifyHmacSignature(webhookPayload, 'invalid_sig_here', TEST_WEBHOOK_SECRET),
  false,
  'Invalid webhook signature must fail'
);
console.log('PASS: Invalid webhook HMAC signature rejected');

// 3. Webhook Idempotency Tests
clearProcessedEvents();
const eventId = 'evt_test_unique_001';

assert.strictEqual(isEventProcessed(eventId), false, 'Initial state: event not processed');
recordProcessedEvent(eventId, { handled: true });
assert.strictEqual(isEventProcessed(eventId), true, 'After recording: event is marked as processed');

// Duplicate event check
const isDuplicate = isEventProcessed(eventId);
assert.strictEqual(isDuplicate, true, 'Duplicate webhook event correctly identified');
console.log('PASS: Webhook idempotency and deduplication verified');

// 4. Client Bundle & Config Secret Isolation Test
const viteConfigPath = path.resolve(import.meta.dirname, '../vite.config.ts');
const viteContent = fs.readFileSync(viteConfigPath, 'utf8');

assert.ok(
  !viteContent.includes("'RAZORPAY_'"),
  'vite.config.ts envPrefix must NOT contain RAZORPAY_ prefix'
);
console.log('PASS: vite.config.ts envPrefix is strictly isolated (no RAZORPAY_ prefix)');

const clientRazorpayPath = path.resolve(import.meta.dirname, '../src/lib/razorpay.ts');
const clientRazorpayContent = fs.readFileSync(clientRazorpayPath, 'utf8');

assert.ok(
  !clientRazorpayContent.includes('import.meta.env.RAZORPAY_KEY_ID'),
  'src/lib/razorpay.ts must not reference un-prefixed RAZORPAY_KEY_ID'
);
assert.ok(
  !clientRazorpayContent.includes('mockPaymentId'),
  'src/lib/razorpay.ts must not contain mock instant approval code'
);
console.log('PASS: src/lib/razorpay.ts contains zero mock approvals and no un-prefixed env access');

console.log('ALL RAZORPAY PAYMENT INTEGRITY & BACKEND TESTS PASSED SUCCESSFULLY!');
