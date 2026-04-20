import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmcJnxB2tvviOgvooHgAiawWv2uuMnYBc",
  authDomain: "prompt-wars-493408.firebaseapp.com",
  projectId: "prompt-wars-493408",
  storageBucket: "prompt-wars-493408.firebasestorage.app",
  messagingSenderId: "820901016043",
  appId: "1:820901016043:web:b0c9172e3d5c6802c4a9ae",
  databaseURL: "https://prompt-wars-493408-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

console.log("✅ Firebase initialized — Firestore + RTDB + Auth + Storage active");
