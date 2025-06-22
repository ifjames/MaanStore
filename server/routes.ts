import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertInventorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple session-based authentication
  let currentUser: any = null;

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = currentUser;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      currentUser = user;
      res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    currentUser = null;
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: { id: currentUser.id, email: currentUser.email, isAdmin: currentUser.isAdmin } });
  });

  // Public inventory route (no auth required)
  app.get("/api/inventory/public", async (req, res) => {
    try {
      const inventory = await storage.getAllInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching public inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Protected inventory routes
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const { search, sortBy, sortOrder } = req.query;
      
      let inventory = search 
        ? await storage.searchInventory(search as string)
        : await storage.getAllInventory();

      // Sort functionality
      if (sortBy) {
        inventory.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortOrder === 'desc' 
              ? bVal.localeCompare(aVal)
              : aVal.localeCompare(bVal);
          }
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
          }
          
          return 0;
        });
      }

      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", requireAuth, async (req, res) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      const lowStockItems = await storage.getLowStockItems(threshold);
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/inventory/stats", requireAuth, async (req, res) => {
    try {
      const inventory = await storage.getAllInventory();
      const lowStockItems = await storage.getLowStockItems(10);
      
      const stats = {
        totalItems: inventory.length,
        totalStock: inventory.reduce((sum, item) => sum + item.stock, 0),
        lowStockCount: lowStockItems.length,
        totalValue: inventory.reduce((sum, item) => sum + (parseFloat(item.price) * item.stock), 0),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post("/api/inventory/sync", requireAuth, async (req, res) => {
    try {
      // Mock Google Sheets sync - in production this would call Google Sheets API
      const mockGoogleSheetsData = [
        { itemName: "Coca Cola 500ml", price: "1.50", stock: 15 },
        { itemName: "Bread - White Loaf", price: "2.25", stock: 20 },
        { itemName: "Milk - 2% 1L", price: "3.75", stock: 25 },
        { itemName: "Bananas (per lb)", price: "0.89", stock: 50 },
        { itemName: "Cereal - Corn Flakes", price: "4.99", stock: 30 },
        { itemName: "Chicken Breast (per lb)", price: "7.49", stock: 12 },
        { itemName: "Rice - White 2lb", price: "3.25", stock: 40 },
        { itemName: "Pasta - Spaghetti", price: "1.75", stock: 35 },
        { itemName: "Ground Beef (per lb)", price: "5.99", stock: 10 },
        { itemName: "Tomatoes (per lb)", price: "2.49", stock: 25 },
      ];

      // Validate data
      const validatedData = mockGoogleSheetsData.map(item => 
        insertInventorySchema.parse(item)
      );

      const updatedInventory = await storage.syncInventoryData(validatedData);
      res.json({ 
        message: "Inventory synced successfully", 
        itemCount: updatedInventory.length 
      });
    } catch (error) {
      console.error("Error syncing inventory:", error);
      res.status(500).json({ message: "Failed to sync inventory" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
