import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Added databaseURL
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Added measurementId
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: ReturnType<typeof initializeApp> | undefined;
if (isConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig as any);
  } else {
    // apps already initialized in HMR/dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app = getApps()[0] as any;
  }
}

export const firebaseAvailable = isConfigured;
export const auth = isConfigured ? getAuth(app) : undefined;
export const googleProvider = isConfigured ? new GoogleAuthProvider() : undefined; // googleProvider is still exported but will be undefined if not configured
export const db = isConfigured ? getFirestore(app) : undefined;
export const storage = isConfigured ? getStorage(app) : undefined;

export default {
  firebaseAvailable,
  auth,
  googleProvider,
  db,
  storage,
};