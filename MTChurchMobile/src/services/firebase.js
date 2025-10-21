import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (same as web version)
const firebaseConfig = {
  apiKey: "AIzaSyAh9GsRLNoyz3MjrShTtpBb13wnfDRiW2g",
  authDomain: "mt-zion-14355.firebaseapp.com",
  projectId: "mt-zion-14355",
  storageBucket: "mt-zion-14355.firebasestorage.app",
  messagingSenderId: "766720097480",
  appId: "1:766720097480:web:30719777b63116e84c39fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
