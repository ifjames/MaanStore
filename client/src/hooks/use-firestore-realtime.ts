import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where, 
  Timestamp, 
  limit, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '@shared/firebase';
import type { Inventory, Category } from '@shared/schema';

// Helper function to create a numeric hash from a string
const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Hook for real-time inventory updates using Firestore
export function useFirestoreInventory() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Create a query against the inventory collection, ordered by creation date
    const inventoryQuery = query(
      collection(db, 'inventory'),
      orderBy('createdAt', 'desc')
    );
    
    // Create a real-time listener
    const unsubscribe = onSnapshot(
      inventoryQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert string ID to number for compatibility with the schema
            // If ID isn't a valid number, use a hash of the string instead
            const numId = parseInt(doc.id);
            return {
              id: isNaN(numId) ? hashCode(doc.id) : numId,
              itemName: data.itemName,
              price: String(data.price),
              stock: Number(data.stock),
              category: data.category || 'General',
              createdAt: data.createdAt?.toDate() || null,
              updatedAt: data.updatedAt?.toDate() || null,
            } as Inventory;
          });
          
          setInventory(items);
          setError(null);
        } catch (err) {
          setError('Failed to parse inventory data');
          console.error('Error parsing inventory data:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Failed to connect to Firestore: ${err.message}`);
        setLoading(false);
        console.error('Firestore error:', err);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return { inventory, loading, error };
}

// Hook for real-time categories updates using Firestore
export function useFirestoreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Create a query against the categories collection
    const categoriesQuery = query(
      collection(db, 'categories'),
      orderBy('name', 'asc')
    );
    
    // Create a real-time listener
    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              // Pass description as-is, could be string, undefined, or null
              description: data.description,
              createdAt: data.createdAt?.toDate() || null,
              updatedAt: data.updatedAt?.toDate() || null,
            } as Category;
          });
          
          setCategories(items);
          setError(null);
        } catch (err) {
          setError('Failed to parse categories data');
          console.error('Error parsing categories data:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Failed to connect to Firestore: ${err.message}`);
        setLoading(false);
        console.error('Firestore error:', err);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return { categories, loading, error };
}

// Hook for real-time low stock alerts using Firestore
export function useFirestoreLowStock(threshold: number = 10) {
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Create a query for low stock items
    const lowStockQuery = query(
      collection(db, 'inventory'),
      where('stock', '<=', threshold),
      orderBy('stock', 'asc')
    );
    
    // Create a real-time listener
    const unsubscribe = onSnapshot(
      lowStockQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert string ID to number for compatibility with the schema
            // If ID isn't a valid number, use a hash of the string instead
            const numId = parseInt(doc.id);
            return {
              id: isNaN(numId) ? hashCode(doc.id) : numId,
              itemName: data.itemName,
              price: String(data.price),
              stock: Number(data.stock),
              category: data.category || 'General',
              createdAt: data.createdAt?.toDate() || null,
              updatedAt: data.updatedAt?.toDate() || null,
            } as Inventory;
          });
          
          setLowStockItems(items);
          setError(null);
        } catch (err) {
          setError('Failed to parse low stock data');
          console.error('Error parsing low stock data:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Failed to connect to Firestore: ${err.message}`);
        setLoading(false);
        console.error('Firestore error:', err);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [threshold]);

  return { 
    lowStockItems, 
    lowStockCount: lowStockItems.length,
    loading, 
    error 
  };
}

// Hook for real-time activity logs using Firestore
export function useFirestoreActivityLogs(limitCount: number = 100) {
  const [logs, setLogs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Create a query for activity logs, ordered by timestamp
    const logsQuery = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    // Create a real-time listener
    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              userEmail: data.userEmail,
              action: data.action,
              details: data.details,
              timestamp: data.timestamp?.toDate() || null,
            };
          });
          
          setLogs(items);
          setError(null);
        } catch (err) {
          setError('Failed to parse activity logs');
          console.error('Error parsing activity logs:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Failed to connect to Firestore: ${err.message}`);
        setLoading(false);
        console.error('Firestore error:', err);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [limitCount]);

  return { logs, loading, error };
}

// Hook for real-time inventory statistics
export function useFirestoreInventoryStats() {
  const { inventory, loading, error } = useFirestoreInventory();
  const { lowStockCount } = useFirestoreLowStock(10);
  
  // Calculate statistics from inventory data
  const stats = {
    totalItems: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    lowStockCount,
    totalValue: inventory.reduce((sum, item) => {
      const price = parseFloat(String(item.price)) || 0;
      const stock = Number(item.stock) || 0;
      return sum + (price * stock);
    }, 0),
  };

  return { stats, loading, error };
}
