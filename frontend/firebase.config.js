// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase config comes from environment variables. The API key may be set
// as VITE_FIREBASE_API_KEY or FIREBASE_API_KEY (the latter is explicitly
// exposed by vite.config.js); the other values use VITE_* keys.
// No secrets live in source — see frontend/.env.example.
// Firebase API keys are public identifiers; access is enforced by Firebase
// Security Rules + backend JWT checks, never by hiding the key.
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.keys(firebaseConfig).filter(
  (key) => !firebaseConfig[key]
);
const isFirebaseConfigured = missingFirebaseKeys.length === 0;
if (!isFirebaseConfigured) {
  console.error(
    "Firebase is not configured. Missing config values:",
    missingFirebaseKeys.join(", ")
  );
}
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Enable IndexedDB persistence so Firestore can serve cached reads when
// the client is temporarily offline instead of failing outright.
if (db) {
  try {
    enableIndexedDbPersistence(db);
  } catch (error) {
    if (error.code !== "failed-precondition" && error.code !== "unimplemented") {
      console.error("Firebase persistence could not be enabled:", error);
    }
  }
}