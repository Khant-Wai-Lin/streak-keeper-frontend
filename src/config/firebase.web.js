import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYmJdQcSvgWBMr1aXyMaEYcNzIeJEuzk8",
  authDomain: "streak-keeper-d50f0.firebaseapp.com",
  projectId: "streak-keeper-d50f0",
  storageBucket: "streak-keeper-d50f0.firebasestorage.app",
  messagingSenderId: "932655790375",
  appId: "1:932655790375:web:b00e730ebdba574b591102",
  measurementId: "G-8Z6SS0XTMK",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
