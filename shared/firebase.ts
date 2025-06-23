import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBaltJ3EvJRpQYfGQYrk4Fm1dysPK1GO1I",
  authDomain: "maanstore-b6ea0.firebaseapp.com",
  databaseURL: "https://maanstore-b6ea0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maanstore-b6ea0",
  storageBucket: "maanstore-b6ea0.firebasestorage.app",
  messagingSenderId: "447184175011",
  appId: "1:447184175011:web:571b3410c4895e32d5a416"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const auth = getAuth(app);

// In development, you can connect to Firebase emulators
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Uncomment these lines if you want to use Firebase emulators in development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;
