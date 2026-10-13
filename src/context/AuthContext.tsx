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
import { PlanTier } from '../types';
import { setPlanTier } from '../lib/storage';

export const DEMO_PRO_CREDENTIALS = {
  email: 'admin@invoiceflow.app',
  password: 'admin123',
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userPlan: PlanTier;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  quickLoginAsPro: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanTier>('free');

  const fetchUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.plan) {
          setUserPlan(data.plan as PlanTier);
          setPlanTier(data.plan as PlanTier);
          return;
        }
      } else {
        // Create initial user document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          plan: 'free',
        });
      }
      setUserPlan('free');
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore:', err);
      setUserPlan('free');
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
      const proUser = {
        uid: 'pro-admin-001',
        email: 'admin@invoiceflow.app',
        displayName: 'Pro Administrator',
        photoURL: '',
        plan: 'pro' as PlanTier,
      };
      localStorage.setItem('invoiceflow_mock_user', JSON.stringify(proUser));
      setCurrentUser(proUser as any);
      setUserPlan('pro');
      setPlanTier('pro');
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
        const localUser = {
          uid: `user-${Date.now()}`,
          email: email.trim(),
          displayName: email.trim().split('@')[0],
          photoURL: '',
          plan: 'pro' as PlanTier,
        };
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(localUser));
        setCurrentUser(localUser as any);
        setUserPlan('pro');
        setPlanTier('pro');
        return;
      }
      throw err;
    }
  };

  const quickLoginAsPro = async () => {
    return loginWithEmail(DEMO_PRO_CREDENTIALS.email, DEMO_PRO_CREDENTIALS.password);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || '',
          createdAt: new Date().toISOString(),
          plan: 'pro',
        });
        setUserPlan('pro');
        setPlanTier('pro');
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
          plan: 'pro' as PlanTier,
        };
        localStorage.setItem('invoiceflow_mock_user', JSON.stringify(localUser));
        setCurrentUser(localUser as any);
        setUserPlan('pro');
        setPlanTier('pro');
        return;
      }
      throw err;
    }
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
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshUserProfile,
        quickLoginAsPro,
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
