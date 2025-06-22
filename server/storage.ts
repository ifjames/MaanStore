import { users, inventory, type User, type InsertUser, type Inventory, type InsertInventory } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Inventory operations
  getAllInventory(): Promise<Inventory[]>;
  getInventoryById(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  searchInventory(query: string): Promise<Inventory[]>;
  getLowStockItems(threshold?: number): Promise<Inventory[]>;
  syncInventoryData(items: InsertInventory[]): Promise<Inventory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventory: Map<number, Inventory>;
  private currentUserId: number;
  private currentInventoryId: number;

  constructor() {
    this.users = new Map();
    this.inventory = new Map();
    this.currentUserId = 1;
    this.currentInventoryId = 1;
    
    // Initialize with admin user
    this.initializeData();
  }

  private async initializeData() {
    // Create admin user
    await this.createUser({
      email: "admin",
      password: "admin123", // In production, this should be hashed
    });

    // Initialize with sample inventory data
    const sampleInventory = [
      { itemName: "Coca Cola 500ml", price: "1.50", stock: 3 },
      { itemName: "Bread - White Loaf", price: "2.25", stock: 7 },
      { itemName: "Milk - 2% 1L", price: "3.75", stock: 5 },
      { itemName: "Bananas (per lb)", price: "0.89", stock: 45 },
      { itemName: "Cereal - Corn Flakes", price: "4.99", stock: 23 },
      { itemName: "Chicken Breast (per lb)", price: "7.49", stock: 18 },
      { itemName: "Rice - White 2lb", price: "3.25", stock: 12 },
      { itemName: "Pasta - Spaghetti", price: "1.75", stock: 25 },
      { itemName: "Ground Beef (per lb)", price: "5.99", stock: 8 },
      { itemName: "Tomatoes (per lb)", price: "2.49", stock: 30 },
      { itemName: "Cheese - Cheddar", price: "4.25", stock: 15 },
      { itemName: "Yogurt - Greek", price: "1.99", stock: 20 },
    ];

    for (const item of sampleInventory) {
      await this.createInventoryItem(item);
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
}

export const storage = new MemStorage();
