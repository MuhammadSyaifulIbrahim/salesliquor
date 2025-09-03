// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxOQtKOVyeNvbI7q6q5OeBN5kqfhST4i8",
  authDomain: "sales-tracking-saas.firebaseapp.com",
  projectId: "sales-tracking-saas",
  storageBucket: "sales-tracking-saas.firebasestorage.app",
  messagingSenderId: "1058172282529",
  appId: "1:1058172282529:web:4848c5d5f263725f3cf2e0",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
