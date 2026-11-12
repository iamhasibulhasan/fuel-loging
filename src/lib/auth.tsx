import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { firebaseConfig, GOOGLE_WEB_CLIENT_ID, isFirebaseConfigured, isGoogleConfigured } from '../config/firebase';

const GUEST_KEY = 'fuellog:guest';

export interface AccountInfo {
  uid: string;
  name: string;
  email: string;
  provider: 'password' | 'google';
}

type Status = 'loading' | 'signedOut' | 'guest' | 'user';

interface AuthStore {
  status: Status;
  account: AccountInfo | null;
  configured: boolean;
  googleAvailable: boolean;
  signIn: (email: string, password: string) => Promise<AccountInfo>;
  signUp: (name: string, email: string, password: string) => Promise<AccountInfo>;
  signInWithGoogle: () => Promise<AccountInfo | null>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthStore | null>(null);

let authInstance: Auth | null = null;
function auth(): Auth {
  if (!isFirebaseConfigured) throw new Error('Login is not set up yet. Please continue as guest.');
  if (authInstance) return authInstance;
  if (getApps().length) {
    authInstance = getAuth(getApp());
  } else {
    const app = initializeApp(firebaseConfig);
    // keep users signed in across app restarts
    authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
  return authInstance;
}

const toAccount = (u: User): AccountInfo => ({
  uid: u.uid,
  name: u.displayName ?? '',
  email: u.email ?? '',
  provider: u.providerData.some((p) => p.providerId === 'google.com') ? 'google' : 'password',
});

// Google Sign-In is a native module: it exists in the APK, not in Expo Go.
const isExpoGo = isRunningInExpoGo();
const googleAvailable = isGoogleConfigured && !isExpoGo;

async function google() {
  const mod = await import('@react-native-google-signin/google-signin');
  mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  return mod;
}

/** Turns Firebase error codes into messages people understand. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/missing-password': 'Please enter your password.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'No internet connection. Check your network and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    DEVELOPER_ERROR: 'Google sign-in is not fully set up (check SHA-1 and Web client ID in Firebase).',
  };
  if (map[code]) return map[code];
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const guestRef = useRef(false); // latest guest flag for the auth listener

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      const guest = (await AsyncStorage.getItem(GUEST_KEY).catch(() => null)) === '1';
      guestRef.current = guest;
      if (!isFirebaseConfigured) {
        if (!cancelled) setStatus(guest ? 'guest' : 'signedOut');
        return;
      }
      unsub = onAuthStateChanged(auth(), (u) => {
        if (u) {
          setAccount(toAccount(u));
          setStatus('user');
        } else {
          setAccount(null);
          setStatus(guestRef.current ? 'guest' : 'signedOut');
        }
      });
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const becameUser = useCallback(async (u: User) => {
    guestRef.current = false;
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
    const acc = toAccount(u);
    setAccount(acc);
    setStatus('user');
    return acc;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => becameUser((await signInWithEmailAndPassword(auth(), email.trim(), password)).user),
    [becameUser],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { user } = await createUserWithEmailAndPassword(auth(), email.trim(), password);
      if (name.trim()) await updateProfile(user, { displayName: name.trim() });
      return becameUser(user);
    },
    [becameUser],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!googleAvailable) throw new Error(isExpoGo ? 'Google sign-in works in the installed app (APK), not in Expo Go.' : 'Google sign-in is not set up yet.');
    const { GoogleSignin } = await google();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return null; // cancelled
    if (!res.data.idToken) throw new Error('Google did not return a token. Check the Web client ID.');
    const cred = GoogleAuthProvider.credential(res.data.idToken);
    return becameUser((await signInWithCredential(auth(), cred)).user);
  }, [becameUser]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth(), email.trim());
  }, []);

  const continueAsGuest = useCallback(async () => {
    guestRef.current = true;
    await AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
    setStatus('guest');
  }, []);

  const signOut = useCallback(async () => {
    guestRef.current = false;
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
    if (isFirebaseConfigured && account) {
      if (account.provider === 'google' && googleAvailable) {
        await (await google()).GoogleSignin.signOut().catch(() => {});
      }
      await fbSignOut(auth());
    }
    setAccount(null);
    setStatus('signedOut');
  }, [account]);

  const value = useMemo<AuthStore>(
    () => ({
      status,
      account,
      configured: isFirebaseConfigured,
      googleAvailable,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      continueAsGuest,
      signOut,
    }),
    [status, account, signIn, signUp, signInWithGoogle, resetPassword, continueAsGuest, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthStore {
  const a = useContext(Ctx);
  if (!a) throw new Error('useAuth must be used inside AuthProvider');
  return a;
}
