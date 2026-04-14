import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
const FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

const missingKeys = [];
if (!FIREBASE_API_KEY) missingKeys.push("EXPO_PUBLIC_FIREBASE_API_KEY");
if (!FIREBASE_AUTH_DOMAIN) missingKeys.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!FIREBASE_PROJECT_ID) missingKeys.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
if (!FIREBASE_STORAGE_BUCKET) missingKeys.push("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!FIREBASE_MESSAGING_SENDER_ID) missingKeys.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!FIREBASE_APP_ID) missingKeys.push("EXPO_PUBLIC_FIREBASE_APP_ID");
if (missingKeys.length > 0) {
  throw new Error(`Missing Firebase env vars: ${missingKeys.join(", ")}`);
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
