import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '@shared/firebase';

export interface InventoryItem {
  id?: string;
  itemName: string;
  price: string;
  stock: number;
  category: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  createdAt?: any;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: any;
}

// Inventory operations
export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
  },

  async getById(id: string): Promise<InventoryItem | null> {
    const docSnap = await getDoc(doc(db, 'inventory', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as InventoryItem : null;
  },

  async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const docRef = await addDoc(collection(db, 'inventory'), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log the action
    await this.logAction('INVENTORY_ADD', `Added new item: ${item.itemName}`);
    
    return { id: docRef.id, ...item };
  },

  async update(id: string, updates: Partial<InventoryItem> & { _suppressLog?: boolean }): Promise<void> {
    // Extract _suppressLog and prepare the data for Firestore
    const { _suppressLog, ...updateData } = updates;
    
    await updateDoc(doc(db, 'inventory', id), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    // Log the action unless suppressed
    if (!_suppressLog) {
      await this.logAction('INVENTORY_UPDATE', `Updated item: ${updates.itemName || id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const item = await this.getById(id);
      await deleteDoc(doc(db, 'inventory', id));
      
      // Log the action (don't let logging errors break the delete)
      try {
        await this.logAction('INVENTORY_DELETE', `Deleted item: ${item?.itemName || id}`);
      } catch (logError) {
        console.warn('Failed to log delete action:', logError);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  async search(searchTerm: string): Promise<InventoryItem[]> {
    // Firestore doesn't have great text search, so we'll get all and filter
    const items = await this.getAll();
    return items.filter(item => 
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  async getLowStock(threshold: number = 10): Promise<InventoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.stock <= threshold);
  },

  async clearAll(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Log the action
    await this.logAction('INVENTORY_CLEAR', 'All inventory data cleared');
  },

  async logAction(action: string, details: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'activityLogs'), {
      userId: user.uid,
      userEmail: user.email,
      action,
      details,
      timestamp: serverTimestamp()
    });
  }
};

// Category operations
export const categoryService = {
  async getAll(): Promise<Category[]> {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async getById(id: string): Promise<Category | null> {
    const docSnap = await getDoc(doc(db, 'categories', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Category : null;
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...category,
      createdAt: serverTimestamp()
    });
    
    // Log the action
    await inventoryService.logAction('CATEGORY_ADD', `Added new category: ${category.name}`);
    
    return { id: docRef.id, ...category };
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    // Get the current category to check if name changed
    const oldCategory = await this.getById(id);
    if (!oldCategory) {
      throw new Error("Category not found");
    }
    
    // Update the category first
    await updateDoc(doc(db, 'categories', id), updates);
    
    // If the category name is changing, update all inventory items with this category
    if (updates.name && oldCategory.name !== updates.name) {
      // Get all inventory items with this category
      const allInventory = await inventoryService.getAll();
      const itemsToUpdate = allInventory.filter(item => item.category === oldCategory.name);
      
      // Update each item with the new category name
      for (const item of itemsToUpdate) {
        if (item.id) {
          await inventoryService.update(item.id, { 
            category: updates.name,
            _suppressLog: true 
          });
        }
      }
      
      // Log the bulk category name update only if there were items to update
      if (itemsToUpdate.length > 0) {
        await inventoryService.logAction(
          'CATEGORY_CASCADE_UPDATE',
          `Updated category name from "${oldCategory.name}" to "${updates.name}" across ${itemsToUpdate.length} inventory items`
        );
      }
    }
    
    // Log the action
    await inventoryService.logAction('CATEGORY_UPDATE', `Updated category: ${updates.name || id}`);
  },

  async delete(id: string): Promise<void> {
    const category = await this.getById(id);
    await deleteDoc(doc(db, 'categories', id));
    
    // Log the action
    await inventoryService.logAction('CATEGORY_DELETE', `Deleted category: ${category?.name || id}`);
  }
};

// Activity log operations
export const activityLogService = {
  async getAll(): Promise<ActivityLog[]> {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  },

  async create(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const docRef = await addDoc(collection(db, 'activityLogs'), {
      ...log,
      timestamp: serverTimestamp()
    });
    const doc = await getDoc(docRef);
    return { id: doc.id, ...doc.data() } as ActivityLog;
  }
};

// Initialize default categories
export const initializeDefaultCategories = async (): Promise<void> => {
  const existingCategories = await categoryService.getAll();
  if (existingCategories.length > 0) return; // Already initialized

  const defaultCategories = [
    { name: "Alcoholic and Beverages", description: "Soft drinks, alcoholic beverages, and other drinks" },
    { name: "Cigarettes", description: "Cigarettes and tobacco products" },
    { name: "Juices RTD & Dairy + Powder", description: "Ready-to-drink juices, dairy products, and powder mixes" },
    { name: "Alcohol and Beer", description: "Alcoholic beverages including gin and beer" },
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
    { name: "Candies", description: "Candies" },
    { name: "General", description: "General merchandise and uncategorized items" }
  ];

  for (const category of defaultCategories) {
    await categoryService.create(category);
  }
};
