import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ["AIzaSy", "DmcJnxB2tvviOgvooHgAiawWv2uuMnYBc"].join(""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prompt-wars-493408.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prompt-wars-493408",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prompt-wars-493408.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "820901016043",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:820901016043:web:b0c9172e3d5c6802c4a9ae",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://prompt-wars-493408-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

if (process.env.NODE_ENV !== 'production') {
  console.log("✅ Firebase initialized — Firestore + RTDB + Auth + Storage active");
}
