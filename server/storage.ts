import { users, inventory, categories, type User, type InsertUser, type Inventory, type InsertInventory, type Category, type InsertCategory } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers?(): Promise<User[]>;
  
  // Inventory operations
  getAllInventory(): Promise<Inventory[]>;
  getInventoryById(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  searchInventory(query: string): Promise<Inventory[]>;
  getLowStockItems(threshold?: number): Promise<Inventory[]>;
  syncInventoryData(items: InsertInventory[]): Promise<Inventory[]>;
  clearAllInventory(): Promise<boolean>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Activity logging
  logAction?(log: { userId: number; action: string; details: string; timestamp: Date }): Promise<void>;
  getActivityLogs?(): Promise<any[]>;
  
  // Real-time subscriptions (Firebase specific)
  subscribeToInventoryChanges?(callback: (inventory: Inventory[]) => void): () => void;
  subscribeToActivityLogs?(callback: (logs: any[]) => void): () => void;
  subscribeToCategoryChanges?(callback: (categories: Category[]) => void): () => void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventory: Map<number, Inventory>;
  private categories: Map<string, Category>;
  private activityLogs: Map<number, any>;
  private currentUserId: number;
  private currentInventoryId: number;
  private currentCategoryId: number;
  private currentLogId: number;
  private initialized = false;

  constructor() {
    this.users = new Map();
    this.inventory = new Map();
    this.categories = new Map();
    this.activityLogs = new Map();
    this.currentUserId = 1;
    this.currentInventoryId = 1;
    this.currentCategoryId = 1;
    this.currentLogId = 1;
    
    // Initialize with admin user and data
    this.initializeData();
  }

  private async initializeData() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Create admin user
    await this.createUser({
      email: "admin",
      password: "admin123", // In production, this should be hashed
    });

    // Initialize default categories
    console.log('🔧 Initializing with default categories...');
    
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
        await this.createCategory(category);
      }

    // Only initialize with sample inventory data if no data exists and not in production
    if (this.inventory.size === 0 && process.env.NODE_ENV !== 'production') {
      console.log('🔧 Initializing with sample inventory data for development...');
      
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
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryById(id: number): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const id = this.currentInventoryId++;
    const inventoryItem: Inventory = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inventory.set(id, inventoryItem);
    return inventoryItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const existingItem = this.inventory.get(id);
    if (!existingItem) return undefined;

    const updatedItem: Inventory = {
      ...existingItem,
      ...item,
      updatedAt: new Date(),
    };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventory.delete(id);
  }

  async searchInventory(query: string): Promise<Inventory[]> {
    const allItems = Array.from(this.inventory.values());
    if (!query) return allItems;
    
    const lowerQuery = query.toLowerCase();
    return allItems.filter(item => 
      item.itemName.toLowerCase().includes(lowerQuery)
    );
  }

  async getLowStockItems(threshold: number = 10): Promise<Inventory[]> {
    const allItems = Array.from(this.inventory.values());
    return allItems.filter(item => item.stock <= threshold);
  }

  async syncInventoryData(items: InsertInventory[]): Promise<Inventory[]> {
    // Clear existing inventory
    this.inventory.clear();
    this.currentInventoryId = 1;
    
    // Add new items
    const result: Inventory[] = [];
    for (const item of items) {
      const newItem = await this.createInventoryItem(item);
      result.push(newItem);
    }
    
    return result;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = `cat_${this.currentCategoryId++}`;
    const newCategory: Category = {
      ...category,
      id,
      description: category.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory: Category = {
      ...existingCategory,
      ...category,
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async logAction(log: { userId: number; action: string; details: string; timestamp: Date }): Promise<void> {
    const activityLog = {
      id: this.currentLogId++,
      userId: log.userId,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp,
    };
    this.activityLogs.set(activityLog.id, activityLog);
  }

  async getActivityLogs(): Promise<any[]> {
    return Array.from(this.activityLogs.values());
  }

  async clearAllInventory(): Promise<boolean> {
    this.inventory.clear();
    this.currentInventoryId = 1;
    console.log('🗑️ All inventory data cleared');
    return true;
  }
}

export const storage = new MemStorage();

// Import and export Firebase storage
import { FirebaseStorage } from './firebase-storage';

// Use Firebase storage in production or when FIREBASE_ENABLED is true
const useFirebase = process.env.NODE_ENV === 'production' || process.env.FIREBASE_ENABLED === 'true';

export const firebaseStorage = new FirebaseStorage();

// Export the storage instance to use
export const activeStorage: IStorage = useFirebase ? firebaseStorage : storage;
