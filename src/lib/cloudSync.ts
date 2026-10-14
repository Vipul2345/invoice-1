import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserSubscription, ExportDataPayload, PlanTier } from '../types';
import {
  getBusinessProfile,
  getCustomers,
  getInvoices,
  getQuotations,
  getSettings,
  getAllTemplates,
  saveSettings,
  mockDisconnectDrive,
  setDrivePermission,
  setPlanTier,
} from './storage';

export interface CloudSyncResult {
  success: boolean;
  skipped: boolean;
  message: string;
  syncedAt: string;
  recordCounts?: {
    invoices: number;
    quotations: number;
    customers: number;
  };
}

/**
 * Verifies subscription status against Firebase Firestore.
 * This is the authoritative backend API check that guarantees
 * cloud sync operations only proceed if the subscription is active.
 * If the subscription has been cancelled, expired, or downgraded,
 * it immediately revokes local Drive sync and blocks cloud sync.
 */
export async function verifySubscriptionFromFirebase(userId: string): Promise<UserSubscription> {
  if (!userId) {
    throw new Error('SUBSCRIPTION_ERROR: Valid user ID is required to verify cloud access.');
  }

  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error(`SUBSCRIPTION_ERROR: User account [${userId}] not found in Firebase database.`);
  }

  const data = snapshot.data();
  const sub = data.subscription as UserSubscription | undefined;

  if (!sub) {
    mockDisconnectDrive();
    setDrivePermission(false);
    setPlanTier('free');
    throw new Error('SUBSCRIPTION_INACTIVE: No subscription plan record found. Drive sync has been disconnected.');
  }

  // Check if monthly subscription period has expired
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    mockDisconnectDrive();
    setDrivePermission(false);
    setPlanTier('free');
    await setDoc(userRef, {
      plan: 'free',
      'subscription.status': 'expired',
      'subscription.drivePermissionGranted': false,
      'subscription.cloudBackupEnabled': false,
      'subscription.updatedAt': new Date().toISOString(),
    }, { merge: true });
    throw new Error('SUBSCRIPTION_EXPIRED: Your monthly subscription period has expired. Drive sync has been disconnected.');
  }

  // Verify status is strictly active
  if (sub.status !== 'active') {
    mockDisconnectDrive();
    setDrivePermission(false);
    setPlanTier('free');
    throw new Error(
      `SUBSCRIPTION_INACTIVE: Subscription status is "${sub.status}". Drive sync and cloud backup have been disconnected.`
    );
  }

  // Verify plan is Drive Plan or Pro Gold Program
  const plan = sub.plan as PlanTier;
  if (plan !== 'drive' && plan !== 'pro') {
    mockDisconnectDrive();
    setDrivePermission(false);
    setPlanTier('free');
    throw new Error(
      `SUBSCRIPTION_INACTIVE: Current tier (${plan.toUpperCase()}) does not include cloud sync. Drive sync connection revoked.`
    );
  }

  return sub;
}

/**
 * Performs daily cloud synchronization for the user if subscribed.
 * Checks authoritative Firebase subscription state.
 * If subscription is active, automatically synchronizes data.
 * If subscription is not active, rejects sync and throws an error.
 */
export async function performDailyCloudSync(
  userId: string,
  force = false
): Promise<CloudSyncResult> {
  const today = new Date().toISOString().split('T')[0];
  const lastSyncDateKey = `invoiceflow_last_sync_date_${userId}`;
  const lastSyncDate = localStorage.getItem(lastSyncDateKey);

  if (!force && lastSyncDate === today) {
    return {
      success: true,
      skipped: true,
      message: 'Daily cloud sync has already been executed today.',
      syncedAt: new Date().toISOString(),
    };
  }

  // 1. Authoritative Firebase Subscription Verification
  // Throws error immediately if subscription is inactive or expired
  const validatedSub = await verifySubscriptionFromFirebase(userId);

  // 2. Prepare full user data payload
  const payload: ExportDataPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    business: getBusinessProfile(),
    customers: getCustomers(),
    invoices: getInvoices(),
    quotations: getQuotations(),
    settings: getSettings(),
    customTemplates: getAllTemplates(),
  };

  const invoiceCount = payload.invoices?.length || 0;
  const quotationCount = payload.quotations?.length || 0;
  const customerCount = payload.customers?.length || 0;

  // 3. Persist latest backup snapshot and daily archive to Firestore
  const latestRef = doc(db, 'users', userId, 'cloudData', 'latest');
  const dailyRef = doc(db, 'users', userId, 'cloudData', `daily_${today}`);
  const userRootRef = doc(db, 'users', userId);

  const syncTimestamp = new Date().toISOString();

  // Save latest active snapshot
  await setDoc(
    latestRef,
    {
      ...payload,
      syncDate: today,
      syncedAt: syncTimestamp,
      subscriptionPlan: validatedSub.plan,
    },
    { merge: true }
  );

  // Save daily historical archive
  await setDoc(
    dailyRef,
    {
      ...payload,
      syncDate: today,
      syncedAt: syncTimestamp,
      subscriptionPlan: validatedSub.plan,
    },
    { merge: true }
  );

  // Update root user profile with sync metadata
  await setDoc(
    userRootRef,
    {
      lastCloudSyncAt: syncTimestamp,
      lastDailySyncDate: today,
    },
    { merge: true }
  );

  // 4. Update local storage sync date and display timestamp
  localStorage.setItem(lastSyncDateKey, today);

  const currentSettings = getSettings();
  const formattedSyncTime = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  saveSettings({
    ...currentSettings,
    driveSync: {
      ...currentSettings.driveSync,
      isConnected: true,
      lastBackupAt: formattedSyncTime,
      permissionGranted: true,
    },
  });

  return {
    success: true,
    skipped: false,
    message: `Cloud backup synchronized successfully (${invoiceCount} invoices, ${quotationCount} quotations).`,
    syncedAt: syncTimestamp,
    recordCounts: {
      invoices: invoiceCount,
      quotations: quotationCount,
      customers: customerCount,
    },
  };
}

/**
 * Fetches the user's latest cloud backup snapshot from Firebase.
 * Requires authoritative verification of an active subscription.
 */
export async function fetchCloudData(userId: string): Promise<ExportDataPayload> {
  // Enforce authoritative subscription check before fetching
  await verifySubscriptionFromFirebase(userId);

  const latestRef = doc(db, 'users', userId, 'cloudData', 'latest');
  const snapshot = await getDoc(latestRef);

  if (!snapshot.exists()) {
    throw new Error('No cloud backup found for this account.');
  }

  const data = snapshot.data();
  return {
    version: data.version || '1.0',
    exportedAt: data.syncedAt || data.exportedAt || new Date().toISOString(),
    business: data.business,
    customers: data.customers || [],
    invoices: data.invoices || [],
    quotations: data.quotations || [],
    settings: data.settings,
    customTemplates: data.customTemplates || [],
  };
}
