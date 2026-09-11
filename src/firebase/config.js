import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "invoice-app-d64f0.firebaseapp.com",
  projectId: "invoice-app-d64f0",
  storageBucket: "invoice-app-d64f0.firebasestorage.app",
  messagingSenderId: "549361625179",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
