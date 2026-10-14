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
import { setPlanTier, setDrivePermission } from '../lib/storage';
import { DEMO_PRO_CREDENTIALS } from '../lib/constants';

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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  quickLoginAsPro: () => Promise<void>;
  updateSubscription: (plan: PlanTier, drivePermissionGranted?: boolean) => Promise<void>;
  grantDrivePermission: () => Promise<void>;
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
          setSubscription(sub);
          if (sub.drivePermissionGranted) {
            setDrivePermission(true);
          }
        } else {
          // Backfill subscription data in Firestore if missing
          const defaultSub: UserSubscription = {
            plan,
            planName: getPlanDisplayName(plan),
            status: 'active',
            updatedAt: new Date().toISOString(),
            drivePermissionGranted: plan === 'drive' ? false : undefined,
            cloudBackupEnabled: plan === 'pro',
          };
          setSubscription(defaultSub);
          await setDoc(userRef, { subscription: defaultSub }, { merge: true });
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

  const updateSubscription = async (plan: PlanTier, drivePermissionGranted?: boolean) => {
    const isDriveGranted = drivePermissionGranted !== undefined
      ? drivePermissionGranted
      : (subscription?.drivePermissionGranted || false);

    const sub: UserSubscription = {
      plan,
      planName: getPlanDisplayName(plan),
      status: 'active',
      updatedAt: new Date().toISOString(),
      drivePermissionGranted: plan === 'drive' ? isDriveGranted : undefined,
      cloudBackupEnabled: plan === 'pro',
    };

    setUserPlan(plan);
    setPlanTier(plan);
    setSubscription(sub);

    if (plan === 'drive') {
      setDrivePermission(isDriveGranted);
    }

    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          plan,
          subscription: sub,
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to update subscription in Firestore:', err);
      }
    }

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

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      await fetchUserProfile(cred.user);
    }
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
        grantDrivePermission,
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
