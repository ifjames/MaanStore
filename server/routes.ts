import type { Express } from "express";
import { createServer, type Server } from "http";
import { activeStorage } from "./storage";
import { loginSchema, insertInventorySchema } from "@shared/schema";
import { excelUploadService } from "./excel-upload";
import multer from "multer";
import * as XLSX from "xlsx";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Global session storage that persists across route registrations
const activeSessions = new Map<string, any>();

// Generate session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    const sessionId = typeof req.headers['x-session-id'] === 'string' 
      ? req.headers['x-session-id'] 
      : (Array.isArray(req.headers['x-session-id']) ? req.headers['x-session-id'][0] : null);
    
    const user = sessionId ? activeSessions.get(sessionId) : null;
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = user;
    req.sessionId = sessionId;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Check by username (email field) or email
      let user = await activeStorage.getUserByEmail(email);
      if (!user) {
        // Try to find by username if not found by email
        const allUsers = await activeStorage.getAllUsers?.() || [];
        user = allUsers.find((u: any) => u.email === email || u.email.split('@')[0] === email);
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const sessionId = generateSessionId();
      activeSessions.set(sessionId, user);
      
      // Log the login action
      await activeStorage.logAction?.({
        userId: user.id,
        action: 'LOGIN',
        details: `User ${user.email} logged in`,
        timestamp: new Date()
      });
      
      // Set session and return user data with session ID
      res.json({ 
        user: { id: user.id, email: user.email, isAdmin: user.isAdmin },
        sessionId: sessionId
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = typeof req.headers['x-session-id'] === 'string' 
      ? req.headers['x-session-id'] 
      : (Array.isArray(req.headers['x-session-id']) ? req.headers['x-session-id'][0] : null);
    if (sessionId) {
      activeSessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/user", (req, res) => {
    const sessionId = typeof req.headers['x-session-id'] === 'string' 
      ? req.headers['x-session-id'] 
      : (Array.isArray(req.headers['x-session-id']) ? req.headers['x-session-id'][0] : null);
    
    const user = sessionId ? activeSessions.get(sessionId) : null;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
  });

  // Public inventory route (no auth required)
  app.get("/api/inventory/public", async (req, res) => {
    try {
      const inventory = await activeStorage.getAllInventory();
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
        ? await activeStorage.searchInventory(search as string)
        : await activeStorage.getAllInventory();

      // Sort functionality
      if (sortBy) {
        inventory.sort((a: any, b: any) => {
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
      const lowStockItems = await activeStorage.getLowStockItems(threshold);
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/inventory/stats", requireAuth, async (req, res) => {
    try {
      const inventory = await activeStorage.getAllInventory();
      const lowStockItems = await activeStorage.getLowStockItems(10);
      
      const stats = {
        totalItems: inventory.length,
        totalStock: inventory.reduce((sum: number, item: any) => sum + item.stock, 0),
        lowStockCount: lowStockItems.length,
        totalValue: inventory.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.stock), 0),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Excel upload route to replace Google Sheets sync
  app.post("/api/inventory/upload", requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      console.log('📊 Processing uploaded Excel file...');
      
      // Parse Excel file
      const parsedData = await excelUploadService.parseExcelFile(req.file.buffer);
      
      // Ensure all categories from the Excel exist in the database
      await excelUploadService.ensureCategoriesExist(parsedData, activeStorage);
      
      // Get existing inventory to check for duplicates
      const existingInventory = await activeStorage.getAllInventory();
      
      // Remove duplicates
      const uniqueData = excelUploadService.removeDuplicates(parsedData, existingInventory);
      
      if (uniqueData.length === 0) {
        return res.json({ 
          message: "No new items to add - all items already exist", 
          itemCount: 0,
          duplicatesSkipped: parsedData.length 
        });
      }

      // Validate data
      const validatedData = uniqueData.map(item => 
        insertInventorySchema.parse(item)
      );

      console.log(`📦 Adding ${validatedData.length} new items to inventory`);
      const updatedInventory = await activeStorage.syncInventoryData(validatedData);
      
      // Log the upload action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'INVENTORY_UPLOAD',
        details: `Uploaded ${updatedInventory.length} items from Excel file (${parsedData.length - uniqueData.length} duplicates skipped)`,
        timestamp: new Date()
      });
      
      res.json({ 
        message: "Inventory uploaded successfully from Excel file", 
        itemCount: updatedInventory.length,
        duplicatesSkipped: parsedData.length - uniqueData.length,
        source: "Excel Upload"
      });
    } catch (error) {
      console.error("❌ Error uploading Excel file:", error);
      res.status(500).json({ message: "Failed to upload Excel file" });
    }
  });

  // Export inventory to Excel
  app.get("/api/inventory/export", requireAuth, async (req, res) => {
    try {
      const inventory = await activeStorage.getAllInventory();
      
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Group items by category
      const categorizedItems: { [key: string]: any[] } = {};
      inventory.forEach((item: any) => {
        const category = item.category || 'Miscellaneous';
        if (!categorizedItems[category]) {
          categorizedItems[category] = [];
        }
        categorizedItems[category].push(item);
      });
      
      // Create worksheet data
      const worksheetData: any[][] = [];
      
      Object.entries(categorizedItems).forEach(([category, items]) => {
        // Add category header
        worksheetData.push([category.toUpperCase()]);
        worksheetData.push(['Product - Items', 'Retail Price', 'Stocks']);
        worksheetData.push(['---', '---', '---']);
        
        // Add items
        items.forEach((item: any) => {
          worksheetData.push([item.itemName, parseFloat(item.price), item.stock]);
        });
        
        // Add empty row between categories
        worksheetData.push(['']);
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Log the export action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'INVENTORY_EXPORT',
        details: `Exported ${inventory.length} items to Excel file`,
        timestamp: new Date()
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("❌ Error exporting inventory to Excel:", error);
      res.status(500).json({ message: "Failed to export inventory" });
    }
  });

  // Activity logs endpoint
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const logs = await activeStorage.getActivityLogs?.() || [];
      // Sort by timestamp descending (newest first)
      const sortedLogs = logs.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      res.json(sortedLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Inventory CRUD operations
  app.post("/api/inventory", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const newItem = await activeStorage.createInventoryItem(validatedData);
      
      // Log the action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'INVENTORY_ADD',
        details: `Added new item: ${newItem.itemName} (${newItem.stock} units at $${newItem.price})`,
        timestamp: new Date()
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(400).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const updatedItem = await activeStorage.updateInventoryItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Log the action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'INVENTORY_UPDATE',
        details: `Updated item: ${updatedItem.itemName}`,
        timestamp: new Date()
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await activeStorage.getInventoryById(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      const deleted = await activeStorage.deleteInventoryItem(id);
      
      if (deleted) {
        // Log the action
        await activeStorage.logAction?.({
          userId: (req as any).user.id,
          action: 'INVENTORY_DELETE',
          details: `Deleted item: ${item.itemName}`,
          timestamp: new Date()
        });
        
        res.json({ message: "Inventory item deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete inventory item" });
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Category management routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await activeStorage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const newCategory = await activeStorage.createCategory({
        name: name.trim(),
        description: description?.trim() || ""
      });
      
      // Log the action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'CATEGORY_ADD',
        details: `Added new category: ${newCategory.name}`,
        timestamp: new Date()
      });
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const { name, description } = req.body;
      
      if (!name?.trim()) {
        return res.status(400).json({ message: "Category name is required" });
      }

      // Get the existing category to compare names
      const existingCategory = await activeStorage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const oldCategoryName = existingCategory.name;
      const newCategoryName = name.trim();
      
      // Update the category
      const updatedCategory = await activeStorage.updateCategory(id, {
        name: newCategoryName,
        description: description?.trim() || ""
      });
      
      // If the category name changed, update all inventory items with this category
      if (oldCategoryName !== newCategoryName) {
        // Get all inventory items with the old category name
        const allInventory = await activeStorage.getAllInventory();
        const itemsToUpdate = allInventory.filter(item => item.category === oldCategoryName);
        
        // Update each item with the new category name
        const updatePromises = itemsToUpdate.map(item => 
          activeStorage.updateInventoryItem(item.id, { category: newCategoryName })
        );
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        // Log the category name cascade update
        await activeStorage.logAction?.({
          userId: (req as any).user.id,
          action: 'CATEGORY_CASCADE_UPDATE',
          details: `Updated category name from "${oldCategoryName}" to "${newCategoryName}" across ${itemsToUpdate.length} inventory items`,
          timestamp: new Date()
        });
      }
      
      // Log the action
      await activeStorage.logAction?.({
        userId: (req as any).user.id,
        action: 'CATEGORY_UPDATE',
        details: `Updated category: ${newCategoryName}`,
        timestamp: new Date()
      });
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const category = await activeStorage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const deleted = await activeStorage.deleteCategory(id);
      
      if (deleted) {
        // Log the action
        await activeStorage.logAction?.({
          userId: (req as any).user.id,
          action: 'CATEGORY_DELETE',
          details: `Deleted category: ${category.name}`,
          timestamp: new Date()
        });
        
        res.json({ message: "Category deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete category" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Clear all inventory data
  app.post("/api/inventory/clear", requireAuth, async (req, res) => {
    try {
      const success = await activeStorage.clearAllInventory();
      
      if (success) {
        // Log the clear action
        await activeStorage.logAction?.({
          userId: (req as any).user.id,
          action: 'INVENTORY_CLEAR',
          details: 'All inventory data cleared',
          timestamp: new Date()
        });
        
        res.json({ message: "All inventory data cleared successfully" });
      } else {
        res.status(500).json({ message: "Failed to clear inventory data" });
      }
    } catch (error) {
      console.error("❌ Error clearing inventory:", error);
      res.status(500).json({ message: "Failed to clear inventory data" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
