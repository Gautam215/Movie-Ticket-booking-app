import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type UserCredential } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const requiredConfigKeys: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const hasFirebaseConfig = requiredConfigKeys.every(key => Boolean(firebaseConfig[key]));
const firebaseApp = hasFirebaseConfig ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const isFirebaseConfigured = Boolean(firebaseAuth);
export const firebaseAnalytics = firebaseApp && typeof window !== 'undefined'
  ? isAnalyticsSupported().then(supported => supported ? getAnalytics(firebaseApp) : null).catch(() => null)
  : Promise.resolve(null);

export async function signInWithGoogle(): Promise<UserCredential> {
  if (!firebaseAuth) {
    throw new Error('Google Sign-In is not configured. Add the VITE_FIREBASE_* values to client/.env.local.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    return await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    throw new Error(firebaseAuthErrorMessage(error));
  }
}

export async function signOutFromFirebase(): Promise<void> {
  if (firebaseAuth) await signOut(firebaseAuth);
}

function firebaseAuthErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user': return 'Google Sign-In was cancelled.';
    case 'auth/popup-blocked': return 'Your browser blocked the Google Sign-In popup.';
    case 'auth/unauthorized-domain': return 'Add this site to Firebase Authentication authorized domains.';
    case 'auth/operation-not-allowed': return 'Enable Google as a sign-in provider in Firebase Authentication.';
    case 'auth/network-request-failed': return 'Google Sign-In could not reach Firebase. Check your connection.';
    default: return 'Google Sign-In failed. Try again.';
  }
}
