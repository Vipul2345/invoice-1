import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for server
dotenv.config();

// Determine configuration status
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

// In-memory set for deduplicating webhook events (bounded LRU-style cache)
const MAX_PROCESSED_EVENTS = 1000;
const processedEvents = new Map<string, { timestamp: number; result: any }>();

export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

export function recordProcessedEvent(eventId: string, result: any): void {
  if (processedEvents.size >= MAX_PROCESSED_EVENTS) {
    // Evict oldest entries
    const firstKey = processedEvents.keys().next().value;
    if (firstKey) {
      processedEvents.delete(firstKey);
    }
  }
  processedEvents.set(eventId, { timestamp: Date.now(), result });
}

export function clearProcessedEvents(): void {
  processedEvents.clear();
}

/**
 * Timing-safe HMAC SHA-256 signature verification
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature || typeof payload !== 'string') {
    return false;
  }
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Verify Razorpay payment signature
 * Supports either:
 * - Order payment: order_id + '|' + payment_id
 * - Subscription mandate: payment_id + '|' + subscription_id
 */
export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
  secret: string;
}): boolean {
  const { razorpay_payment_id, razorpay_order_id, razorpay_subscription_id, razorpay_signature, secret } = params;

  if (!razorpay_payment_id || !razorpay_signature || !secret) {
    return false;
  }

  if (razorpay_subscription_id) {
    const payload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    if (verifyHmacSignature(payload, razorpay_signature, secret)) {
      return true;
    }
  }

  if (razorpay_order_id) {
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    if (verifyHmacSignature(payload, razorpay_signature, secret)) {
      return true;
    }
  }

  return false;
}

// Firebase Admin SDK initialization (optional, enabled if service account credentials exist)
let adminApp: any = null;
let adminDb: any = null;

export async function initFirebaseAdmin(): Promise<boolean> {
  if (adminDb) return true;
  try {
    const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(sa),
      });
      adminDb = getFirestore(adminApp);
      return true;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = initializeApp({
        credential: applicationDefault(),
      });
      adminDb = getFirestore(adminApp);
      return true;
    }
  } catch (err: any) {
    console.warn('[Server] Firebase Admin initialization skipped (service account not configured):', err.message);
  }
  return false;
}

/**
 * Updates user entitlement in Firestore using Firebase Admin SDK (bypasses Security Rules safely on server)
 */
export async function updateUserEntitlementInFirestore(
  userId: string,
  plan: 'free' | 'drive' | 'pro',
  subscriptionMeta: {
    razorpayPaymentId?: string;
    razorpaySubscriptionId?: string;
    status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
    currentPeriodEnd?: string;
    autoRenew?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  const isAdminReady = await initFirebaseAdmin();
  if (!isAdminReady || !adminDb) {
    return {
      success: false,
      message: 'Firebase Admin not configured on server. Entitlement record could not be written to Firestore.',
    };
  }

  const now = new Date();
  const currentPeriodStart = now.toISOString();
  const currentPeriodEnd =
    subscriptionMeta.currentPeriodEnd ||
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const userDocRef = adminDb.collection('users').doc(userId);
  await userDocRef.set(
    {
      plan,
      subscription: {
        plan,
        planName: plan === 'pro' ? 'Pro Gold Program' : plan === 'drive' ? 'Drive Plan' : 'Free Plan',
        status: subscriptionMeta.status,
        updatedAt: currentPeriodStart,
        drivePermissionGranted: plan === 'drive',
        cloudBackupEnabled: plan === 'pro',
        razorpayPaymentId: subscriptionMeta.razorpayPaymentId || null,
        razorpaySubscriptionId: subscriptionMeta.razorpaySubscriptionId || null,
        currentPeriodStart,
        currentPeriodEnd,
        autoRenew: subscriptionMeta.autoRenew ?? true,
      },
    },
    { merge: true }
  );

  return { success: true, message: `Successfully updated user ${userId} to plan ${plan} in Firestore.` };
}

export function createServer() {
  const app = express();

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-razorpay-signature, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Raw body capture specifically for Razorpay webhooks (HMAC verification requires raw bytes)
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      razorpayConfigured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      firebaseAdminConfigured: Boolean(adminDb || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  });

  /**
   * POST /api/create-subscription
   * Prepares a Razorpay order or subscription on the trusted backend
   */
  app.post('/api/create-subscription', async (req: Request, res: Response) => {
    const { plan, userId, email, isIndia } = req.body;

    if (!plan || !userId || (plan !== 'drive' && plan !== 'pro')) {
      res.status(400).json({ error: 'Valid plan (drive | pro) and userId are required.' });
      return;
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      res.status(503).json({
        error: 'Razorpay credentials not configured on server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment.',
      });
      return;
    }

    const amountInPaise = plan === 'drive'
      ? (isIndia ? 4900 : 25700)
      : (isIndia ? 9900 : 42900);

    try {
      // Create Razorpay Order via official REST API
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const orderResp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`,
          notes: {
            plan,
            userId,
            email: email || '',
          },
        }),
      });

      const orderData: any = await orderResp.json();
      if (!orderResp.ok) {
        res.status(orderResp.status).json({
          error: orderData.error?.description || 'Failed to create order with Razorpay.',
        });
        return;
      }

      res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key: RAZORPAY_KEY_ID,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Server error creating order: ${err.message}` });
    }
  });

  /**
   * POST /api/verify-payment
   * Verifies the cryptographic HMAC payment signature on the server,
   * then updates the user's plan via Firebase Admin SDK.
   */
  app.post('/api/verify-payment', async (req: Request, res: Response) => {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan,
      userId,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_signature || !userId || !plan) {
      res.status(400).json({
        error: 'Missing required parameters: razorpay_payment_id, razorpay_signature, userId, and plan.',
      });
      return;
    }

    if (!RAZORPAY_KEY_SECRET) {
      res.status(503).json({
        error: 'Server lacks RAZORPAY_KEY_SECRET to verify payment signature.',
      });
      return;
    }

    const isValid = verifyPaymentSignature({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      secret: RAZORPAY_KEY_SECRET,
    });

    if (!isValid) {
      res.status(400).json({
        verified: false,
        error: 'Payment verification failed: Invalid cryptographic signature.',
      });
      return;
    }

    // Update entitlement in Firestore using Admin SDK
    const updateResult = await updateUserEntitlementInFirestore(userId, plan, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySubscriptionId: razorpay_subscription_id,
      status: 'active',
      autoRenew: true,
    });

    res.json({
      verified: true,
      plan,
      message: 'Payment verified successfully.',
      firestoreUpdated: updateResult.success,
      firestoreNotice: updateResult.success ? undefined : updateResult.message,
    });
  });

  /**
   * POST /api/razorpay-webhook
   * Validates webhook signatures, idempotently logs events, and handles
   * captures, renewals, cancellations, and failures.
   */
  app.post('/api/razorpay-webhook', async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody
      ? (req as any).rawBody.toString('utf8')
      : JSON.stringify(req.body);

    if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing webhook signature or server webhook secret unconfigured.' });
      return;
    }

    const isAuthentic = verifyHmacSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isAuthentic) {
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body;
    const eventId = event.event_id || event.id || `evt_${Date.now()}`;

    // Idempotency: Reject or no-op duplicate webhook deliveries
    if (isEventProcessed(eventId)) {
      res.status(200).json({ status: 'already_processed', eventId });
      return;
    }

    try {
      const eventType = event.event;
      let handledResult = 'ignored';

      switch (eventType) {
        case 'payment.captured':
        case 'order.paid': {
          const paymentEntity = event.payload?.payment?.entity;
          const userId = paymentEntity?.notes?.userId;
          const plan = paymentEntity?.notes?.plan;
          if (userId && (plan === 'drive' || plan === 'pro')) {
            await updateUserEntitlementInFirestore(userId, plan, {
              razorpayPaymentId: paymentEntity.id,
              status: 'active',
              autoRenew: true,
            });
            handledResult = 'payment_captured_updated';
          }
          break;
        }

        case 'subscription.charged':
        case 'subscription.activated': {
          const subEntity = event.payload?.subscription?.entity;
          const userId = subEntity?.notes?.userId;
          const plan = subEntity?.notes?.plan;
          if (userId && (plan === 'drive' || plan === 'pro')) {
            const currentPeriodEnd = subEntity.current_end
              ? new Date(subEntity.current_end * 1000).toISOString()
              : undefined;

            await updateUserEntitlementInFirestore(userId, plan, {
              razorpaySubscriptionId: subEntity.id,
              status: 'active',
              currentPeriodEnd,
              autoRenew: true,
            });
            handledResult = 'subscription_charged_updated';
          }
          break;
        }

        case 'subscription.halted':
        case 'subscription.pending': {
          const subEntity = event.payload?.subscription?.entity;
          const userId = subEntity?.notes?.userId;
          const plan = subEntity?.notes?.plan || 'free';
          if (userId) {
            await updateUserEntitlementInFirestore(userId, plan, {
              razorpaySubscriptionId: subEntity.id,
              status: 'past_due',
              autoRenew: false,
            });
            handledResult = 'subscription_past_due_updated';
          }
          break;
        }

        case 'subscription.cancelled': {
          const subEntity = event.payload?.subscription?.entity;
          const userId = subEntity?.notes?.userId;
          if (userId) {
            await updateUserEntitlementInFirestore(userId, 'free', {
              razorpaySubscriptionId: subEntity.id,
              status: 'cancelled',
              autoRenew: false,
            });
            handledResult = 'subscription_cancelled_downgraded';
          }
          break;
        }

        case 'payment.failed': {
          const paymentEntity = event.payload?.payment?.entity;
          console.warn('[Webhook] Payment failed:', paymentEntity?.id, paymentEntity?.error_description);
          handledResult = 'payment_failed_recorded';
          break;
        }

        default:
          handledResult = `unhandled_event_${eventType}`;
      }

      recordProcessedEvent(eventId, { status: handledResult });
      res.status(200).json({ status: 'success', handled: handledResult, eventId });
    } catch (err: any) {
      console.error('[Webhook] Error handling event:', err);
      res.status(500).json({ error: `Internal error processing webhook: ${err.message}` });
    }
  });

  /**
   * POST /api/cancel-subscription
   * Cancels user subscription in Firestore and optionally on Razorpay
   */
  app.post('/api/cancel-subscription', async (req: Request, res: Response) => {
    const { userId, subscriptionId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required to cancel subscription.' });
      return;
    }

    try {
      if (subscriptionId && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
        try {
          const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
          await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({ cancel_at_cycle_end: 0 }),
          });
        } catch (apiErr: any) {
          console.warn('[Server] Could not cancel subscription directly with Razorpay API:', apiErr.message);
        }
      }

      await updateUserEntitlementInFirestore(userId, 'free', {
        razorpaySubscriptionId: subscriptionId,
        status: 'cancelled',
        autoRenew: false,
      });

      res.json({ success: true, message: 'Subscription cancelled successfully.' });
    } catch (err: any) {
      console.error('[Server] Error cancelling subscription:', err);
      res.status(500).json({ error: `Failed to cancel subscription: ${err.message}` });
    }
  });

  return app;
}

// Start server if executed directly
import { fileURLToPath } from 'url';

if (process.env.NODE_ENV !== 'test' && process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('server.ts'))) {
  const PORT = process.env.PORT || 3001;
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`[InvoiceFlow Server] Listening on port ${PORT}`);
  });
}

