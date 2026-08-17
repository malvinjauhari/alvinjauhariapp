import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4xiGy8oZ5-mBWOldIee0P82_UE5XgXaQ",
  authDomain: "alvinjauhari-app.firebaseapp.com",
  projectId: "alvinjauhari-app",
  storageBucket: "alvinjauhari-app.firebasestorage.app",
  messagingSenderId: "406000351979",
  appId: "1:406000351979:web:a576bcb60286efeb355cae",
  measurementId: "G-X0J0J150M9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
