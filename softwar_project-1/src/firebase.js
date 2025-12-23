// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAm8QKRVv4y2TSa4obNJeGRQHHRxyZWwFo",
  authDomain: "ruwwad-5deaa.firebaseapp.com",
  projectId: "ruwwad-5deaa",
  storageBucket: "ruwwad-5deaa.firebasestorage.app",
  messagingSenderId: "861166704979",
  appId: "1:861166704979:web:0568b32ea062e827f229a6",
  measurementId: "G-DYZQ7J2F3H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;