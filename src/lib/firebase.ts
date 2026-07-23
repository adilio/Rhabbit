import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

// Use the branded production host for OAuth so Google shows
// "Continue to rhabbit.4dl.ca" instead of the Firebase project hostname.
// Local development and deploy previews keep using the configured Firebase
// domain because they do not proxy the reserved /__/auth helper routes.
const authDomain =
  window.location.hostname === "rhabbit.4dl.ca"
    ? window.location.hostname
    : configuredAuthDomain;

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Offline-first: cached app shell + cached data means the Today screen
// opens instantly and logs queue up until the network returns.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
