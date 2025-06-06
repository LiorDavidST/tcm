// firebase.js

// ייבוא מודולים נדרשים מפיירבייס
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// קונפיגורציית Firebase שלך – החלף בפרטים מה-Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tcm-solutions.firebaseapp.com",
  projectId: "tcm-solutions",
  storageBucket: "tcm-solutions.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// אתחול אפליקציית Firebase
const app = initializeApp(firebaseConfig);

// ייצוא שירותי Firebase שבהם נשתמש בפרויקט
export const auth = getAuth(app);         // Authentication (משתמשים)
export const db = getFirestore(app);      // Firestore (בסיס נתונים)
