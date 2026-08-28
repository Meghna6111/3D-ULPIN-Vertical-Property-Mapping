import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Public client credentials via Vite env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA0x8C1xXZZ7Q1-drIPbnWkyNPfqx8Iziw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'propertymap-system.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'propertymap-system',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'propertymap-system.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '18308437207',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:18308437207:web:c89b13c96cede33a3b4c92',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
