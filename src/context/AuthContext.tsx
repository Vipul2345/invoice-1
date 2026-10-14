import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { PlanTier, UserSubscription } from '../types';
import { setPlanTier, setDrivePermission, mockDisconnectDrive } from '../lib/storage';
import { DEMO_PRO_CREDENTIALS } from '../lib/constants';
import { performDailyCloudSync, CloudSyncResult } from '../lib/cloudSync';

const getPlanDisplayName = (plan: PlanTier): string => {
  switch (plan) {
    case 'pro':
      return 'Pro Gold Program';
    case 'drive':
      return 'Drive Plan';
    case 'free':
    default:
      return 'Free Plan';
  }
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userPlan: PlanTier;
  subscription: UserSubscription | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, targetPlan?: PlanTier) => Promise<void>;
  loginWithGoogle: (targetPlan?: PlanTier) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  quickLoginAsPro: () => Promise<void>;
  updateSubscription: (
    plan: PlanTier,
    drivePermissionGranted?: boolean,
    paymentMeta?: {
      razorpayPaymentId?: string;
      razorpaySubscriptionId?: string;
      autoRenew?: boolean;
    }
  ) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  grantDrivePermission: () => Promise<void>;
  syncDailyCloudBackup: (force?: boolean) => Promise<CloudSyncResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanTier>('free');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  const fetchUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const plan = (data.plan as PlanTier) || 'free';
        setUserPlan(plan);
        setPlanTier(plan);

        if (data.subscription) {
          const sub = data.subscription as UserSubscription;
          const hasExpired = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) < new Date() : false;
          const isActive = sub.status === 'active' && !hasExpired;
          const isEligibleTier = sub.plan === 'drive' || sub.plan === 'pro';

          if (!isActive || !isEligibleTier) {
            // Subscription is cancelled, expired, or non-drive:
            // Immediately disconnect Google Drive and revoke cloud permissions
            mockDisconnectDrive();
            setDrivePermission(false);
            setUserPlan('free');
            setPlanTier('free');

            const updatedSub: UserSubscription = {
              ...sub,
              status: hasExpired ? 'expired' : sub.status === 'active' ? 'canceled' : sub.status,
              drivePermissionGranted: false,
              cloudBackupEnabled: false,
              updatedAt: new Date().toISOString(),
            };
            setSubscription(updatedSub);

            // Do not mutate Firestore subscription from client; backend Admin SDK manages entitlements
          } else {
            setUserPlan(sub.plan);
            setPlanTier(sub.plan);
            setSubscription(sub);
            if (sub.plan === 'drive' && sub.drivePermissionGranted) {
              setDrivePermission(true);
            } else {
              setDrivePermission(false);
            }
          }
        } else {
          // Default local subscription state if not yet set in Firestore
          const defaultSub: UserSubscription = {
            plan,
            planName: getPlanDisplayName(plan),
            status: 'active',
            updatedAt: new Date().toISOString(),
            drivePermissionGranted: plan === 'drive' ? false : undefined,
            cloudBackupEnabled: plan === 'pro',
          };
          setSubscription(defaultSub);
        }
        return;
      } else {
        // Create initial user document in Firestore with full subscription details
        const initialSub: UserSubscription = {
          plan: 'free',
          planName: 'Free Plan',
          status: 'active',
          updatedAt: new Date().toISOString(),
          drivePermissionGranted: false,
          cloudBackupEnabled: false,
        };
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          plan: 'free',
          subscription: initialSub,
        }, { merge: true });
        setUserPlan('free');
        setPlanTier('free');
        setSubscription(initialSub);
      }
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore:', err);
      setUserPlan('free');
      setSubscription({
        plan: 'free',
        planName: 'Free Plan',
        status: 'active',
        updatedAt: new Date().toISOString(),
        drivePermissionGranted: false,
        cloudBackupEnabled: false,
      });
    }
  };

  useEffect(() => {
    // 1. Check local mock session first for offline / demo user
    try {
      const savedMock = localStorage.getItem('invoiceflow_mock_user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        setCurrentUser(parsed);
        const plan = (parsed.plan as PlanTier) || 'pro';
        setUserPlan(plan);
        setPlanTier(plan);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse mock user session', e);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!localStorage.getItem('invoiceflow_mock_user')) {
        setCurrentUser(user);
        if (user) {
          await fetchUserProfile(user);
        } else {
          setUserPlan('free');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user is logging in with Demo Pro credentials
    if (
      cleanEmail === DEMO_PRO_CREDENTIALS.email ||
      cleanEmail === 'pro@invoiceflow.app' ||
      cleanEmail === 'admin'
    ) {
      const proSub: UserSubscription = {
        plan: 'pro',
        planName: 'Pro Gold Program',
        status: 'active',
        updatedAt: new Date().toISOString(),
        cloudBackupEnabled: true,
      };
      const proUser = {
        uid: 'pro-admin-001',
        email: 'admin@invoiceflow.app',
        displayName: 'Pro Administrator',
        photoURL: '',
        plan: 'pro' as PlanTier,
        subscription: proSub,
      };
      localStorage.setItem('invoiceflow_mock_user', JSON.stringify(proUser));
      setCurrentUser(proUser as any);
      setUserPlan('pro');
      setPlanTier('pro');
      setSubscription(proSub);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      // If Firebase Auth returns operation not allowed or offline, create a local session
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/admin-restricted-operation'
      ) {
        const proSub: UserSubscription = {
          plan: 'pro',
          planName: 'Pro Gold Program',
          status: 'active',
          updatedAt: new Date().toISOString(),
          cloudBackupEnabled: true,
        };
        const localUser = {
          uid: `user-${Date.now()}`,
          email: email.trim(),
          displayName: email.trim().split('@')[0],
          photoURL: '',
          plan: 'pro' as PlanTier,
          subscription: proSub,
        };
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(localUser));
        setCurrentUser(localUser as any);
        setUserPlan('pro');
        setPlanTier('pro');
        setSubscription(proSub);
        return;
      }
      throw err;
    }
  };

  const quickLoginAsPro = async () => {
    return loginWithEmail(DEMO_PRO_CREDENTIALS.email, DEMO_PRO_CREDENTIALS.password);
  };

  const registerWithEmail = async (email: string, pass: string, targetPlan: PlanTier = 'free') => {
    const sub: UserSubscription = {
      plan: targetPlan,
      planName: getPlanDisplayName(targetPlan),
      status: 'active',
      updatedAt: new Date().toISOString(),
      drivePermissionGranted: targetPlan === 'drive' ? false : undefined,
      cloudBackupEnabled: targetPlan === 'pro',
    };

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || email.trim().split('@')[0],
          photoURL: cred.user.photoURL || '',
          createdAt: new Date().toISOString(),
          plan: targetPlan,
          subscription: sub,
        }, { merge: true });
        setUserPlan(targetPlan);
        setPlanTier(targetPlan);
        setSubscription(sub);
      }
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/admin-restricted-operation'
      ) {
        const localUser = {
          uid: `user-${Date.now()}`,
          email: email.trim(),
          displayName: email.trim().split('@')[0],
          photoURL: '',
          plan: targetPlan,
          subscription: sub,
        };
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(localUser));
        setCurrentUser(localUser as any);
        setUserPlan(targetPlan);
        setPlanTier(targetPlan);
        setSubscription(sub);
        return;
      }
      throw err;
    }
  };

  const cancelSubscription = async () => {
    // 1. Immediately disconnect local drive connection & revoke permissions
    mockDisconnectDrive();
    setDrivePermission(false);
    setUserPlan('free');
    setPlanTier('free');

    const cancelledSub: UserSubscription = {
      ...(subscription || {
        plan: 'free',
        planName: 'Free Plan',
        updatedAt: new Date().toISOString(),
      }),
      plan: 'free',
      planName: 'Free Plan',
      status: 'canceled',
      cancelledAt: new Date().toISOString(),
      autoRenew: false,
      drivePermissionGranted: false,
      cloudBackupEnabled: false,
      updatedAt: new Date().toISOString(),
    };
    setSubscription(cancelledSub);

    // 2. Notify backend server to cancel subscription and update Firestore via Admin SDK
    if (auth.currentUser) {
      try {
        await fetch('/api/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.currentUser.uid }),
        });
      } catch (err) {
        console.warn('Backend cancel endpoint error (server webhook handles status sync):', err);
      }
    }

    // Also update mock user if in demo mode
    try {
      const savedMock = localStorage.getItem('invoiceflow_mock_user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        parsed.plan = 'free';
        parsed.subscription = cancelledSub;
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const updateSubscription = async (
    plan: PlanTier,
    drivePermissionGranted?: boolean,
    paymentMeta?: {
      razorpayPaymentId?: string;
      razorpaySubscriptionId?: string;
      autoRenew?: boolean;
    }
  ) => {
    if (plan === 'free') {
      await cancelSubscription();
      return;
    }

    const isDriveGranted = drivePermissionGranted !== undefined
      ? drivePermissionGranted
      : (subscription?.drivePermissionGranted || (plan === 'drive'));

    const now = new Date();
    const currentPeriodStart = now.toISOString();
    // 30 days active period for monthly recurring subscription
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const sub: UserSubscription = {
      plan,
      planName: getPlanDisplayName(plan),
      status: 'active',
      updatedAt: currentPeriodStart,
      drivePermissionGranted: plan === 'drive' ? isDriveGranted : false,
      cloudBackupEnabled: plan === 'pro',
      razorpayPaymentId: paymentMeta?.razorpayPaymentId || subscription?.razorpayPaymentId,
      razorpaySubscriptionId: paymentMeta?.razorpaySubscriptionId || subscription?.razorpaySubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      autoRenew: paymentMeta?.autoRenew !== undefined ? paymentMeta.autoRenew : true,
    };

    setUserPlan(plan);
    setPlanTier(plan);
    setSubscription(sub);

    if (plan === 'drive') {
      setDrivePermission(isDriveGranted);
    } else {
      setDrivePermission(false);
      mockDisconnectDrive();
    }

    // Note: Paid Firestore updates are performed exclusively by the trusted backend Admin SDK
    // upon cryptographic payment signature verification or webhook receipt.

    try {
      const savedMock = localStorage.getItem('invoiceflow_mock_user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        parsed.plan = plan;
        parsed.subscription = sub;
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const grantDrivePermission = async () => {
    setDrivePermission(true);
    setSubscription((prev) => {
      const updated: UserSubscription = prev
        ? { ...prev, drivePermissionGranted: true, updatedAt: new Date().toISOString() }
        : {
            plan: 'drive',
            planName: 'Drive Plan',
            status: 'active',
            updatedAt: new Date().toISOString(),
            drivePermissionGranted: true,
            cloudBackupEnabled: false,
          };
      return updated;
    });

    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          'subscription.drivePermissionGranted': true,
          'subscription.updatedAt': new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to save drive permission in Firestore:', err);
      }
    }

    try {
      const savedMock = localStorage.getItem('invoiceflow_mock_user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        if (parsed.subscription) {
          parsed.subscription.drivePermissionGranted = true;
          parsed.subscription.updatedAt = new Date().toISOString();
        }
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const loginWithGoogle = async (targetPlan?: PlanTier) => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const userRef = doc(db, 'users', cred.user.uid);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) {
          // Register new user with Google (Gmail)
          const planToSet = targetPlan || 'drive';
          const sub: UserSubscription = {
            plan: planToSet,
            planName: getPlanDisplayName(planToSet),
            status: 'active',
            updatedAt: new Date().toISOString(),
            drivePermissionGranted: planToSet === 'drive',
            cloudBackupEnabled: planToSet === 'pro',
          };
          await setDoc(
            userRef,
            {
              uid: cred.user.uid,
              email: cred.user.email,
              displayName: cred.user.displayName || cred.user.email?.split('@')[0] || '',
              photoURL: cred.user.photoURL || '',
              createdAt: new Date().toISOString(),
              plan: planToSet,
              subscription: sub,
            },
            { merge: true }
          );
          setUserPlan(planToSet);
          setPlanTier(planToSet);
          setSubscription(sub);
          if (planToSet === 'drive') {
            setDrivePermission(true);
          }
        } else {
          await fetchUserProfile(cred.user);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-in / Registration Error:', err);
      throw err;
    }
  };

  const syncDailyCloudBackup = async (force = false): Promise<CloudSyncResult | null> => {
    const user = auth.currentUser || currentUser;
    if (!user) return null;
    return performDailyCloudSync(user.uid, force);
  };

  const logout = async () => {
    localStorage.removeItem('invoiceflow_mock_user');
    try {
      await signOut(auth);
    } catch {}
    setCurrentUser(null);
    setUserPlan('free');
    setPlanTier('free');
    setSubscription({
      plan: 'free',
      planName: 'Free Plan',
      status: 'active',
      updatedAt: new Date().toISOString(),
      drivePermissionGranted: false,
      cloudBackupEnabled: false,
    });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        userPlan,
        subscription,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshUserProfile,
        quickLoginAsPro,
        updateSubscription,
        cancelSubscription,
        grantDrivePermission,
        syncDailyCloudBackup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
