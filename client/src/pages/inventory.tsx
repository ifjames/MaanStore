import { useState, useMemo, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import InventoryTable from "@/components/inventory/inventory-table";
import { ExcelUploadComponent } from "@/components/inventory/excel-upload";
import { AddItemModal } from "@/components/inventory/add-item-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Upload, Package, Trash2, Plus, Download, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { inventoryService, activityLogService, type InventoryItem } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth";
import { useFirestoreInventory } from "@/hooks/use-firestore-realtime";
import * as XLSX from 'xlsx';
import type { Inventory } from "@/../../shared/schema";
import { debugLog } from "@/lib/debug";
import { confirmAction } from "@/lib/notifications";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exactMatchOnly, setExactMatchOnly] = useState(false);
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("inventory");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Use real-time Firestore hook for auto-refreshing inventory data
  const { inventory: firestoreInventory, loading: firestoreLoading, error: firestoreError } = useFirestoreInventory();
  
  // Debounce search input to improve performance (reduced delay for better responsiveness)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150); // Reduced from 300ms to 150ms for faster response

    return () => clearTimeout(timer);
  }, [search]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
  }, []);

  // Debug logging for search issues
  useEffect(() => {
    if (debouncedSearch) {
      debugLog('Inventory', `Search term: "${debouncedSearch}"`);
      debugLog('Inventory', 'Total inventory items:', firestoreInventory.length);
      
      // Log items that contain the search term
      const matchingItems = firestoreInventory.filter(item => 
        item.itemName && item.itemName.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      debugLog('Inventory', `Items matching "${debouncedSearch}":`, matchingItems.map(item => item.itemName));
    }
  }, [debouncedSearch, firestoreInventory]);
  // Smart search and sort logic that handles partial names and parentheses
  const processedInventory = useMemo(() => {
    debugLog('Inventory', 'Processing inventory with search:', debouncedSearch);
    
    // Use Firestore items and convert to the expected format safely
    let items = firestoreInventory.map(item => ({
      id: item.id ? (parseInt(String(item.id)) || hashCode(String(item.id))) : 0,
      itemName: item.itemName,
      price: item.price,
      stock: item.stock,
      category: item.category,
      createdAt: null, // Simplified for now
      updatedAt: null, // Simplified for now
    } as Inventory));
    
    if (debouncedSearch && debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase().trim();
      
      debugLog('Inventory', `Searching for: "${searchLower}"`);
      debugLog('Inventory', 'Available items:', items.map(item => `"${item.itemName}"`).join(', '));
      
      // Helper function to extract base name (remove parentheses content)
      const getBaseName = (itemName: string) => {
        return itemName.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
      };
      
      // Helper function to check if search matches item (smart matching)
      const isSmartMatch = (itemName: string, searchTerm: string) => {
        const itemLower = itemName.toLowerCase();
        const baseName = getBaseName(itemName);
        
        // Direct matches
        if (itemLower === searchTerm) return { type: 'exact', score: 10000 };
        if (itemLower.startsWith(searchTerm)) return { type: 'prefix', score: 5000 };
        if (itemLower.includes(searchTerm)) return { type: 'contains', score: 2000 };
        
        // Base name matches (ignoring parentheses)
        if (baseName === searchTerm) return { type: 'base-exact', score: 9000 };
        if (baseName.startsWith(searchTerm)) return { type: 'base-prefix', score: 4000 };
        if (baseName.includes(searchTerm)) return { type: 'base-contains', score: 1500 };
        
        return null;
      };
      
      // Score all items
      const scoredItems = items
        .map(item => {
          const itemName = item.itemName || '';
          let totalScore = 0;
          let matchType = '';
          
          // Check for smart match
          const smartMatch = isSmartMatch(itemName, searchLower);
          if (smartMatch) {
            totalScore = smartMatch.score;
            matchType = smartMatch.type;
            
            debugLog('Inventory', `${smartMatch.type} match found: "${itemName}" (score: ${totalScore})`);
            
            // If exact match only is enabled, only return exact or base-exact matches
            if (exactMatchOnly && !['exact', 'base-exact'].includes(smartMatch.type)) {
              return null;
            }
            
            return { item, score: totalScore, matchType, hasMatch: true };
          }
          
          // Multi-term search (only if no smart match found)
          const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
          if (searchTerms.length > 1) {
            let termMatches = 0;
            let termScore = 0;
            
            for (const term of searchTerms) {
              const termMatch = isSmartMatch(itemName, term);
              if (termMatch) {
                termMatches++;
                termScore += termMatch.score / searchTerms.length; // Divide by number of terms
              } else {
                // Check other fields for this term
                const categoryLower = (item.category || '').toLowerCase();
                const priceStr = String(item.price || '');
                const stockStr = String(item.stock || '');
                
                if (categoryLower.includes(term) || priceStr.includes(term) || stockStr.includes(term)) {
                  termMatches++;
                  termScore += 50; // Lower score for non-name matches
                }
              }
            }
            
            // Only include if ALL search terms match
            if (termMatches === searchTerms.length) {
              debugLog('Inventory', `Multi-term match found: "${itemName}" (score: ${termScore})`);
              return { item, score: termScore, matchType: 'multi-term', hasMatch: true };
            }
          }
          
          return null;
        })
        .filter(entry => entry !== null) // Remove non-matches
        .sort((a, b) => {
          // Sort by score first (descending)
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Then by name alphabetically for items with same score
          return (a.item.itemName || '').localeCompare(b.item.itemName || '');
        });
      
      debugLog('Inventory', 'Filtered and scored items:', scoredItems.map(entry => 
        `"${entry.item.itemName}" (${entry.matchType}, score: ${entry.score})`
      ));
      
      const finalItems = scoredItems.map(entry => entry.item);
      debugLog('Inventory', 'Final filtered items being returned:', finalItems.map(item => 
        `"${item.itemName}" - ID: ${item.id}, Stock: ${item.stock}`
      ));
      
      return finalItems;
    } else {
      // No search - apply normal sorting
      items.sort((a, b) => {
        let aValue: any = a[sortBy as keyof typeof a];
        let bValue: any = b[sortBy as keyof typeof b];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    
    debugLog('Inventory', 'Final processed items count:', items.length);
    debugLog('Inventory', 'Items being returned from processedInventory:', items.map(item => 
      `"${item.itemName}" - ID: ${item.id}, Stock: ${item.stock}, Category: ${item.category}`
    ));
    return items;
  }, [firestoreInventory, debouncedSearch, exactMatchOnly, sortBy, sortOrder]);

  // Debug what's being passed to InventoryTable
  useEffect(() => {
    debugLog('Inventory', 'processedInventory state updated:', processedInventory.length, 'items');
    debugLog('Inventory', 'Items in processedInventory:', processedInventory.map(item => 
      `"${item.itemName}" - ID: ${item.id}`
    ));
  }, [processedInventory]);

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
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          type="text"
                          placeholder="Type item name (e.g., Max Candy, V Fresh)..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10 pr-8"
                        />
                        {search && (
                          <button 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={clearSearch}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {search && (
                        <div className="text-xs text-muted-foreground mt-2 space-y-2">
                          <p>🔍 <strong>Searching for:</strong> "{search}"</p>
                          <p>🧠 <strong>Smart search enabled:</strong> finds "Max Candy (4 for 5)" when you type "max candy"</p>
                          {debouncedSearch !== search && (
                            <p className="text-blue-600">⏳ Searching...</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant={exactMatchOnly ? "default" : "outline"}
                              size="sm"
                              onClick={() => setExactMatchOnly(!exactMatchOnly)}
                              className="text-xs h-7"
                            >
                              {exactMatchOnly ? "📍 Exact Names" : "🎯 Smart Search"}
                            </Button>
                            <span className="text-xs">
                              {exactMatchOnly ? "Only exact name matches (ignores parentheses)" : "Smart matching with all relevant results"}
                            </span>
                          </div>
                        </div>
                      )}
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
                  
                  {/* Search Results Summary */}
                  {debouncedSearch && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        📊 Found <strong>{processedInventory.length}</strong> item(s) matching "{debouncedSearch}"
                        {exactMatchOnly && (
                          <span className="font-semibold"> (exact name matches only)</span>
                        )}
                        {processedInventory.length > 0 && !exactMatchOnly && (
                          <span> - smart ranked results</span>
                        )}
                      </p>
                      {processedInventory.length > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          💡 Tip: Search works with partial names - "max candy" finds "Max Candy (4 for 5)"
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {firestoreError && (
                <Card className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <p>Error loading inventory data: {firestoreError}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <InventoryTable 
                inventory={processedInventory} 
                isLoading={firestoreLoading} 
              />
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
                  onClick={async () => {
                    const result = await confirmAction.clearAll('Inventory Items', processedInventory.length);
                    
                    if (result.isConfirmed) {
                      clearInventoryMutation.mutate();
                    }
                  }}
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
