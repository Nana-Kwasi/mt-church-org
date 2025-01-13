
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyC4n-zSIxE9EEL0aV407wKILEzGrcQP1jc",
  authDomain: "mt-zion-methodist-church.firebaseapp.com",
  projectId: "mt-zion-methodist-church",
  storageBucket: "mt-zion-methodist-church.firebasestorage.app",
  messagingSenderId: "760378892397",
  appId: "1:760378892397:web:3a1b25662e44fb5008df64"
  };

const app = initializeApp(firebaseConfig);
export default app;