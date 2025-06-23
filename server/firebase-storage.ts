import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off 
} from 'firebase/database';
import { db, realtimeDb } from '@shared/firebase';
import { type User, type InsertUser, type Inventory, type InsertInventory } from '@shared/schema';
import { IStorage } from './storage';

export class FirebaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    if (this.initialized) return;
    
    try {
      // Check if admin user exists
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const adminExists = usersSnapshot.docs.some(doc => 
        doc.data().email === 'admin'
      );

      if (!adminExists) {
        // Create admin user
        await this.createUser({
          email: "admin",
          password: "admin123",
        });

        // Initialize default categories
        console.log('🔧 Initializing with default categories...');
        const defaultCategories = [
          { name: "Alcoholic and Beverages", description: "Soft drinks, alcoholic beverages, and other drinks" },
          { name: "Cigarets", description: "Cigarettes and tobacco products" },
          { name: "Juices RTD & Dairy + Powder", description: "Ready-to-drink juices, dairy products, and powder mixes" },
          { name: "Wine and Rum", description: "Alcoholic beverages including wine, rum, gin, and beer" },
          { name: "Can Foods", description: "Canned goods including sardines, corned beef, and other preserved foods" },
          { name: "Seasoning", description: "Spices, seasonings, and flavor enhancers" },
          { name: "Food Additives", description: "Condiments, sauces, and cooking ingredients" },
          { name: "Noodles + Vegetable Grain", description: "Instant noodles, pasta, and grain products" },
          { name: "Junk Food - Sitsirya", description: "Snacks, chips, and junk food items" },
          { name: "Personal Hygiene Items", description: "Soaps, shampoos, toothpaste, and personal care products" },
          { name: "Detergents", description: "Laundry detergents, fabric softeners, and cleaning products" },
          { name: "Bread and Cookies", description: "Baked goods, crackers, and sweet treats" },
          { name: "Rice", description: "Rice varieties and grain products" },
          { name: "Other Foods", description: "Fresh produce, cooking essentials, and miscellaneous food items" },
          { name: "Coffee", description: "Coffee products, instant coffee, and coffee mixes" },
          { name: "Other Items", description: "Hardware items, utilities, and miscellaneous products" },
          { name: "General", description: "General merchandise and uncategorized items" }
        ];

        for (const category of defaultCategories) {
          await this.createCategory(category);
        }

        // Initialize with sample inventory data
        const sampleInventory = [
          { itemName: "Coca Cola Mismo (290 mL)", price: "21", stock: 100, category: "Alcoholic and Beverages" },
          { itemName: "Sprite Mismo (290 mL)", price: "21", stock: 100, category: "Alcoholic and Beverages" },
          { itemName: "Mountain Dew (290 mL)", price: "21", stock: 100, category: "Alcoholic and Beverages" },
          { itemName: "Marlboro Red", price: "10", stock: 100, category: "Cigarets" },
          { itemName: "555 Sardines - Red", price: "28", stock: 100, category: "Can Foods" },
          { itemName: "Magic Sarap (16pcs/pack)", price: "7", stock: 100, category: "Seasoning" },
          { itemName: "Silver Swan Soy Sauce 200 mL Pouch", price: "13", stock: 100, category: "Food Additives" },
          { itemName: "Pancit Canton - All Flavours", price: "18", stock: 100, category: "Noodles + Vegetable Grain" },
          { itemName: "Nova", price: "18", stock: 100, category: "Junk Food - Sitsirya" },
          { itemName: "Silka Soap Orange - 65 grams", price: "23", stock: 100, category: "Personal Hygiene Items" },
          { itemName: "Ariel Powder", price: "16", stock: 100, category: "Detergents" },
          { itemName: "Hansel/Fita/Skyflakes", price: "7", stock: 100, category: "Bread and Cookies" },
          { itemName: "Kopiko Black", price: "15", stock: 100, category: "Coffee" },
          { itemName: "Eggs", price: "10", stock: 100, category: "Other Foods" },
        ];

        for (const item of sampleInventory) {
          await this.createInventoryItem(item);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Firebase data:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDoc = usersSnapshot.docs.find(doc => doc.data().id === id);
      
      if (userDoc) {
        const data = userDoc.data();
        return {
          id: data.id,
          email: data.email,
          password: data.password,
          isAdmin: data.isAdmin,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return {
          id: data.id,
          email: data.email,
          password: data.password,
          isAdmin: data.isAdmin,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Get the next available ID
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const maxId = Math.max(0, ...usersSnapshot.docs.map(doc => doc.data().id || 0));
      const nextId = maxId + 1;

      const userData = {
        id: nextId,
        email: insertUser.email,
        password: insertUser.password,
        isAdmin: true,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'users'), userData);

      return {
        id: nextId,
        email: insertUser.email,
        password: insertUser.password,
        isAdmin: true,
        createdAt: new Date(),
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          email: data.email,
          password: data.password,
          isAdmin: data.isAdmin,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    try {
      const q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          itemName: data.itemName,
          price: data.price,
          stock: data.stock,
          category: data.category || 'General',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Inventory;
      });
    } catch (error) {
      console.error('Error getting all inventory:', error);
      return [];
    }
  }

  async getInventoryById(id: number): Promise<Inventory | undefined> {
    try {
      const q = query(collection(db, 'inventory'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: data.id,
          itemName: data.itemName,
          price: data.price,
          stock: data.stock,
          category: data.category || 'General',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Inventory;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting inventory by id:', error);
      return undefined;
    }
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    try {
      // Get the next available ID
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const maxId = Math.max(0, ...inventorySnapshot.docs.map(doc => doc.data().id || 0));
      const nextId = maxId + 1;

      const inventoryData = {
        id: nextId,
        itemName: item.itemName,
        price: item.price,
        stock: item.stock,
        category: item.category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'inventory'), inventoryData);

      // Also update in Realtime Database for real-time updates
      const realtimeRef = ref(realtimeDb, `inventory/${nextId}`);
      await set(realtimeRef, {
        id: nextId,
        itemName: item.itemName,
        price: item.price,
        stock: item.stock,
        category: item.category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        id: nextId,
        itemName: item.itemName,
        price: item.price,
        stock: item.stock,
        category: item.category,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Inventory;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    try {
      const q = query(collection(db, 'inventory'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const currentData = querySnapshot.docs[0].data();
        
        const updatedData = {
          ...item,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(docRef, updatedData);

        // Also update in Realtime Database
        const realtimeRef = ref(realtimeDb, `inventory/${id}`);
        await update(realtimeRef, {
          ...item,
          updatedAt: Date.now(),
        });

        return {
          id: currentData.id,
          itemName: item.itemName || currentData.itemName,
          price: item.price || currentData.price,
          stock: item.stock !== undefined ? item.stock : currentData.stock,
          category: item.category || currentData.category || 'General',
          createdAt: currentData.createdAt?.toDate() || new Date(),
          updatedAt: new Date(),
        } as Inventory;
      }
      return undefined;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      const q = query(collection(db, 'inventory'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
        
        // Also remove from Realtime Database
        const realtimeRef = ref(realtimeDb, `inventory/${id}`);
        await remove(realtimeRef);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  async searchInventory(searchQuery: string): Promise<Inventory[]> {
    try {
      const allItems = await this.getAllInventory();
      if (!searchQuery) return allItems;
      
      const lowerQuery = searchQuery.toLowerCase();
      return allItems.filter(item => 
        item.itemName.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching inventory:', error);
      return [];
    }
  }

  async getLowStockItems(threshold: number = 10): Promise<Inventory[]> {
    try {
      const allItems = await this.getAllInventory();
      return allItems.filter(item => item.stock <= threshold);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  async syncInventoryData(items: InsertInventory[]): Promise<Inventory[]> {
    try {
      // Clear existing inventory
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const deletePromises = inventorySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Clear Realtime Database inventory
      const realtimeRef = ref(realtimeDb, 'inventory');
      await set(realtimeRef, null);
      
      // Add new items
      const result: Inventory[] = [];
      for (const item of items) {
        const newItem = await this.createInventoryItem(item);
        result.push(newItem);
      }
      
      return result;
    } catch (error) {
      console.error('Error syncing inventory data:', error);
      throw error;
    }
  }

  async clearAllInventory(): Promise<boolean> {
    try {
      // Clear Firestore inventory
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const deletePromises = inventorySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Clear Realtime Database inventory
      const realtimeRef = ref(realtimeDb, 'inventory');
      await set(realtimeRef, null);
      
      console.log('🗑️ All inventory data cleared from Firebase');
      return true;
    } catch (error) {
      console.error('Error clearing inventory data:', error);
      return false;
    }
  }

  // Activity logging
  async logAction(log: { userId: number; action: string; details: string; timestamp: Date }): Promise<void> {
    try {
      // Get the next available ID
      const logsSnapshot = await getDocs(collection(db, 'activityLogs'));
      const maxId = Math.max(0, ...logsSnapshot.docs.map(doc => doc.data().id || 0));
      const nextId = maxId + 1;

      const logData = {
        id: nextId,
        userId: log.userId,
        action: log.action,
        details: log.details,
        timestamp: Timestamp.fromDate(log.timestamp),
      };

      await addDoc(collection(db, 'activityLogs'), logData);

      // Also log to Realtime Database for real-time updates
      const realtimeRef = ref(realtimeDb, `activityLogs/${nextId}`);
      await set(realtimeRef, {
        id: nextId,
        userId: log.userId,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp.getTime(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  async getActivityLogs(): Promise<any[]> {
    try {
      const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          userId: data.userId,
          action: data.action,
          details: data.details,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      });
    } catch (error) {
      console.error('Error getting activity logs:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToInventoryChanges(callback: (inventory: Inventory[]) => void): () => void {
    const realtimeRef = ref(realtimeDb, 'inventory');
    
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventory = Object.values(data).map((item: any) => ({
          id: item.id,
          itemName: item.itemName,
          price: item.price,
          stock: item.stock,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })) as Inventory[];
        
        // Sort by creation date descending
        inventory.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return bTime - aTime;
        });
        callback(inventory);
      } else {
        callback([]);
      }
    });

    return () => off(realtimeRef, 'value', unsubscribe);
  }

  subscribeToActivityLogs(callback: (logs: any[]) => void): () => void {
    const realtimeRef = ref(realtimeDb, 'activityLogs');
    
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logs = Object.values(data).map((log: any) => ({
          id: log.id,
          userId: log.userId,
          action: log.action,
          details: log.details,
          timestamp: new Date(log.timestamp),
        }));
        
        // Sort by timestamp descending
        logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        callback(logs);
      } else {
        callback([]);
      }
    });

    return () => off(realtimeRef, 'value', unsubscribe);
  }

  // Category Management Methods
  async getAllCategories(): Promise<any[]> {
    try {
      const categoriesSnapshot = await getDocs(
        query(collection(db, 'categories'), orderBy('name', 'asc'))
      );
      
      return categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createCategory(categoryData: { name: string; description?: string }): Promise<any> {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newDoc = await getDoc(docRef);
      const newCategory = { id: newDoc.id, ...newDoc.data() };
      
      // Also save to Realtime Database for real-time updates
      const realtimeRef = ref(realtimeDb, `categories/${docRef.id}`);
      await set(realtimeRef, {
        id: docRef.id,
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, categoryData: { name?: string; description?: string }): Promise<any> {
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, {
        ...categoryData,
        updatedAt: serverTimestamp()
      });
      
      // Update in Realtime Database
      const realtimeRef = ref(realtimeDb, `categories/${id}`);
      await update(realtimeRef, {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });
      
      const updatedDoc = await getDoc(categoryRef);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      // Check if any inventory items use this category
      const inventorySnapshot = await getDocs(
        query(collection(db, 'inventory'), where('category', '==', id))
      );
      
      if (!inventorySnapshot.empty) {
        throw new Error('Cannot delete category that is being used by inventory items');
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'categories', id));
      
      // Delete from Realtime Database
      const realtimeRef = ref(realtimeDb, `categories/${id}`);
      await remove(realtimeRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<any | null> {
    try {
      const categoryDoc = await getDoc(doc(db, 'categories', id));
      if (categoryDoc.exists()) {
        return { id: categoryDoc.id, ...categoryDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  subscribeToCategories(callback: (categories: any[]) => void): () => void {
    const realtimeRef = ref(realtimeDb, 'categories');
    
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categories = Object.values(data).map((category: any) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        }));
        
        // Sort by name
        categories.sort((a, b) => a.name.localeCompare(b.name));
        callback(categories);
      } else {
        callback([]);
      }
    });

    return () => off(realtimeRef, 'value', unsubscribe);
  }
}
