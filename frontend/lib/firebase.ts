// frontend/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmcJnxB2tvviOgvooHgAiawWv2uuMnYBc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prompt-wars-493408.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prompt-wars-493408",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prompt-wars-493408.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "820901016043",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:820901016043:web:b0c9172e3d5c6802c4a9ae",
  databaseURL: "https://prompt-wars-493408-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore (this is what we use for live swarm data)
export const db = getFirestore(app);

console.log("✅ Firebase Firestore connected successfully");
