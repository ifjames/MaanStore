import { auth } from '@shared/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeDefaultCategories } from './firestore-service';

export const initializeApp = async () => {
  return new Promise<void>((resolve) => {
    // Wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Only run once
      
      try {
        if (user) {
          // User is signed in, initialize default categories
          await initializeDefaultCategories();
          console.log('App initialization completed for authenticated user');
        } else {
          console.log('No user authenticated, skipping initialization');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
      
      resolve();
    });
  });
};
