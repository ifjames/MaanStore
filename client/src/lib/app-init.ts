import { auth } from '@shared/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeDefaultCategories } from './firestore-service';
import { debugLog } from './debug';

export const initializeApp = async () => {
  return new Promise<void>((resolve) => {
    // Wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Only run once
      
      try {
        if (user) {
          // User is signed in, initialize default categories
          await initializeDefaultCategories();
          debugLog('AppInit', 'App initialization completed for authenticated user');
        } else {
          debugLog('AppInit', 'No user authenticated, skipping initialization');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
      
      resolve();
    });
  });
};
