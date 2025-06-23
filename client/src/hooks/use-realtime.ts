import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@shared/firebase';
import type { Inventory } from '@shared/schema';

// Hook for real-time inventory updates
export function useRealtimeInventory() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inventoryRef = ref(realtimeDb, 'inventory');
    
    const unsubscribe = onValue(
      inventoryRef, 
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const inventoryList = Object.values(data).map((item: any) => ({
              id: item.id,
              itemName: item.itemName,
              price: item.price,
              stock: item.stock,
              category: item.category || 'General',
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })) as Inventory[];
            
            // Sort by creation date descending
            inventoryList.sort((a, b) => {
              const aTime = a.createdAt?.getTime() || 0;
              const bTime = b.createdAt?.getTime() || 0;
              return bTime - aTime;
            });
            setInventory(inventoryList);
          } else {
            setInventory([]);
          }
          setError(null);
        } catch (err) {
          setError('Failed to parse inventory data');
          console.error('Error parsing inventory data:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to connect to real-time database');
        setLoading(false);
        console.error('Firebase Realtime Database error:', err);
      }
    );

    return () => {
      off(inventoryRef, 'value', unsubscribe);
    };
  }, []);

  return { inventory, loading, error };
}

// Hook for real-time activity logs
export function useRealtimeActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const logsRef = ref(realtimeDb, 'activityLogs');
    
    const unsubscribe = onValue(
      logsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const logsList = Object.values(data).map((log: any) => ({
              id: log.id,
              userId: log.userId,
              action: log.action,
              details: log.details,
              timestamp: new Date(log.timestamp),
            }));
            
            // Sort by timestamp descending
            logsList.sort((a, b) => {
              const aTime = a.timestamp?.getTime() || 0;
              const bTime = b.timestamp?.getTime() || 0;
              return bTime - aTime;
            });
            setLogs(logsList);
          } else {
            setLogs([]);
          }
          setError(null);
        } catch (err) {
          setError('Failed to parse activity logs');
          console.error('Error parsing activity logs:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to connect to real-time database');
        setLoading(false);
        console.error('Firebase Realtime Database error:', err);
      }
    );

    return () => {
      off(logsRef, 'value', unsubscribe);
    };
  }, []);

  return { logs, loading, error };
}

// Hook for real-time low stock monitoring
export function useRealtimeLowStock(threshold: number = 10) {
  const { inventory, loading, error } = useRealtimeInventory();
  
  const lowStockItems = inventory.filter(item => item.stock <= threshold);
  
  return { 
    lowStockItems, 
    lowStockCount: lowStockItems.length,
    loading, 
    error 
  };
}

// Hook for real-time inventory stats
export function useRealtimeInventoryStats() {
  const { inventory, loading, error } = useRealtimeInventory();
  const { lowStockCount } = useRealtimeLowStock(10);
  
  const stats = {
    totalItems: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + item.stock, 0),
    lowStockCount,
    totalValue: inventory.reduce((sum, item) => sum + (parseFloat(item.price) * item.stock), 0),
  };

  return { stats, loading, error };
}
