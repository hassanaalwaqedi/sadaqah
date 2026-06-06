import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATw5_qnrHqD63kd0MDFoZ2fM72TkoGZxU",
  authDomain: "sadaqah-3caee.firebaseapp.com",
  projectId: "sadaqah-3caee",
  storageBucket: "sadaqah-3caee.firebasestorage.app",
  messagingSenderId: "390839886549",
  appId: "1:390839886549:web:3f877e237967b022b7b85c",
  measurementId: "G-DXQ1BNW77L",
};

// Initialize Firebase (singleton — avoid re-init in Next.js HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
