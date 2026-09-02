import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvY0ORiNJPAUAoSGTWQ_p5-8Y05DxF_2M",
  authDomain: "espetim-do-nin.firebaseapp.com",
  projectId: "espetim-do-nin",
  storageBucket: "espetim-do-nin.firebasestorage.app",
  messagingSenderId: "296544880019",
  appId: "1:296544880019:web:63d43fe045035a1f901466",
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE_AQUI");

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = isFirebaseConfigured ? getFirestore(firebaseApp) : null;