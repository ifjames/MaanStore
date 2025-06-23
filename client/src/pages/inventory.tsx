import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InventoryTable from "@/components/inventory/inventory-table";
import { ExcelUploadComponent } from "@/components/inventory/excel-upload";
import { AddItemModal } from "@/components/inventory/add-item-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Upload, Package, Trash2, Plus, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { inventoryService, activityLogService, type InventoryItem } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth";
import * as XLSX from 'xlsx';
import type { Inventory } from "@/../../shared/schema";

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

// Adapter function to convert Firestore data to expected interface
const adaptInventoryItem = (item: InventoryItem): Inventory => ({
  id: item.id ? (parseInt(item.id) || hashCode(item.id)) : 0, // Convert string id to number, or use hash if not numeric
  itemName: item.itemName,
  price: item.price,
  stock: item.stock,
  category: item.category,
  createdAt: item.createdAt ? new Date(item.createdAt.seconds * 1000) : null,
  updatedAt: item.updatedAt ? new Date(item.updatedAt.seconds * 1000) : null,
});

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("inventory");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory", { search, sortBy, sortOrder }],
    queryFn: async () => {
      let items = await inventoryService.getAll();
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        items = items.filter(item => 
          item.itemName.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      items.sort((a, b) => {
        let aValue = a[sortBy as keyof typeof a];
        let bValue = b[sortBy as keyof typeof b];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      // Convert to expected format
      return items.map(adaptInventoryItem);
    },
    retry: false,
  });

  const clearInventoryMutation = useMutation({
    mutationFn: async () => {
      await inventoryService.clearAll();
      return { success: true };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      // Log the activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'INVENTORY_CLEAR',
            details: 'Cleared all inventory items'
          });
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        } catch (error) {
          console.warn('Failed to log clear inventory activity:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "All inventory data has been cleared",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExportToExcel = async () => {
    try {
      // Get all inventory data
      const inventoryData = await inventoryService.getAll();
      
      if (inventoryData.length === 0) {
        toast({
          title: "No Data",
          description: "No inventory data to export",
        });
        return;
      }
      
      // Prepare data for Excel export
      const excelData = [
        ['Item Name', 'Price', 'Stock', 'Category'], // Header row
        ...inventoryData.map(item => [
          item.itemName,
          item.price,
          item.stock,
          item.category
        ])
      ];
      
      // Create a new workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      
      // Generate Excel file and trigger download
      const fileName = `inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Log the export activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'INVENTORY_EXPORT',
            details: `Exported ${inventoryData.length} inventory items to Excel`
          });
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        } catch (error) {
          console.warn('Failed to log export activity:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Inventory exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-7xl mx-auto mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Inventory Management</h1>
          <p className="mt-1 text-muted-foreground mobile-text">Manage your store's product inventory</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "inventory" ? "default" : "outline"}
            onClick={() => setActiveTab("inventory")}
            className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
            size="sm"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">View Inventory</span>
            <span className="sm:hidden">Inventory</span>
          </Button>
          <Button
            variant={activeTab === "excel" ? "default" : "outline"}
            onClick={() => setActiveTab("excel")}
            className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
            size="sm"
          >
            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Excel Management</span>
            <span className="sm:hidden">Excel</span>
          </Button>
        </div>

        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search & Filter
                    </div>
                    <AddItemModal>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </AddItemModal>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="search">Search Items</Label>
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search by item name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sortBy">Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="itemName">Item Name</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="stock">Stock Level</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <InventoryTable inventory={inventory || []} isLoading={isLoading} />
            </motion.div>
          </div>
        )}

        {activeTab === "excel" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Upload and Export Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Excel File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelUploadComponent />
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Inventory Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all inventory data as an Excel file for backup or external use.
                  </p>
                  <Button 
                    onClick={handleExportToExcel}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Excel File Format Help */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>📋 Excel File Format Requirements & Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Required Structure:</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                    <div>Row 1: CATEGORY NAME (e.g., "JUNK FOOD - SITSIRYA")</div>
                    <div>Row 2: Product - Items | Retail Price | Stocks</div>
                    <div>Row 3: --- | --- | ---</div>
                    <div>Row 4+: Product Name | Price | Stock Quantity</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">📝 Supported Categories:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• ALCOHOLIC AND BEVERAGES</div>
                    <div>• CIGARETS</div>
                    <div>• JUICES RTD & DAIRY + POWDER</div>
                    <div>• WINE AND RUM</div>
                    <div>• CAN FOODS</div>
                    <div>• SEASONING</div>
                    <div>• FOOD ADDITIVES</div>
                    <div>• NOODLES + VEGETABLE GRAIN</div>
                    <div>• JUNK FOOD - SITSIRYA</div>
                    <div>• PERSONAL HYGIENE ITEMS</div>
                    <div>• DETERGENTS</div>
                    <div>• BREAD AND COOKIES</div>
                    <div>• RICE</div>
                    <div>• OTHER FOODS</div>
                    <div>• COFFEE</div>
                    <div>• OTHER ITEMS</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">🍬 Bulk Pricing Support:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    For items sold in bulk (like candies), use these formats in the price column:
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div>• "4 for 5 pesos" - V Fresh</div>
                    <div>• "4 pieces for 5" - Max Candy</div>
                    <div>• "3 pcs for 10" - Any item</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    The system will automatically calculate unit prices and handle bulk pricing in the price checker.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">✅ Example Row:</h4>
                  <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                    <div>Nova | 18 | 50</div>
                    <div>V Fresh | 4 for 5 pesos | 100</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tips:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Each category should be on its own row followed by products</li>
                    <li>• Price column accepts both numbers and bulk pricing text</li>
                    <li>• Stock column should be a number (leave blank for default 100)</li>
                    <li>• Duplicate items will be skipped during upload</li>
                    <li>• Use the exact category names listed above for proper categorization</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            {/* Clear Inventory Section */}
            <Card className="glass-card border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Trash2 className="h-5 w-5" />
                  Clear All Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Remove all items from the inventory. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => clearInventoryMutation.mutate()}
                  disabled={clearInventoryMutation.isPending}
                >
                  {clearInventoryMutation.isPending ? "Clearing..." : "Clear All Inventory"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
