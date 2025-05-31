import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDhqzgsgPWZGcCAOzVc9Tpr-2G8w7pdAtQ",
  authDomain: "final-app-f6ff0.firebaseapp.com",
  projectId: "final-app-f6ff0",
  storageBucket: "final-app-f6ff0.firebasestorage.app",
  messagingSenderId: "299835129962",
  appId: "1:299835129962:web:ce39b1462c28b87fcb8a13",
  measurementId: "G-N8WT3YMEKS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);