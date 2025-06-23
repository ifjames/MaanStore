import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@shared/firebase';

/**
 * Check if any admin users exist in the system
 * This prevents unauthorized admin account creation
 */
export const checkAdminExists = async (): Promise<boolean> => {
  try {
    // Check if there are any users in the system by looking at activity logs
    // (since we log user activities, if logs exist, users exist)
    const logsQuery = query(collection(db, 'activityLogs'), limit(1));
    const logsSnapshot = await getDocs(logsQuery);
    
    // If there are any activity logs, it means at least one user has logged in
    return logsSnapshot.size > 0;
  } catch (error) {
    console.error('Error checking for existing admin:', error);
    // If we can't check, assume admin exists for security
    return true;
  }
};

/**
 * Alternative method: check if there are any inventory items or categories
 * If data exists, it means an admin has been using the system
 */
export const checkSystemHasData = async (): Promise<boolean> => {
  try {
    const [inventorySnapshot, categoriesSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'inventory'), limit(1))),
      getDocs(query(collection(db, 'categories'), limit(1)))
    ]);
    
    return inventorySnapshot.size > 0 || categoriesSnapshot.size > 0;
  } catch (error) {
    console.error('Error checking system data:', error);
    return true; // Assume system has data for security
  }
};
