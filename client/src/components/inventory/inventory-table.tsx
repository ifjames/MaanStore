import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, Edit, Trash2 } from "lucide-react";
import { formatCurrency, confirmAction } from "@/lib/notifications";
import { EditInventoryModal } from "./edit-inventory-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showNotification } from "@/lib/notifications";
import { inventoryService, activityLogService } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth";
import type { Inventory } from "@/../../shared/schema";
import { useLowStockThreshold } from "@/hooks/use-settings";
import { debugLog } from "@/lib/debug";

interface InventoryTableProps {
  inventory: Inventory[];
  isLoading: boolean;
}

export default function InventoryTable({ inventory, isLoading }: InventoryTableProps) {
  const [editItem, setEditItem] = useState<Inventory | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Debug logging for InventoryTable
  debugLog('InventoryTable', '🔍 InventoryTable render - received:', inventory.length, 'items');
  debugLog('InventoryTable', '🔍 InventoryTable items details:', inventory.map((item, idx) => 
    `[${idx}] "${item.itemName}" - ID: ${item.id}, Stock: ${item.stock}, Price: ${item.price}`
  ));
  
  if (inventory.length > 0) {
    debugLog('InventoryTable', '🔍 First item in InventoryTable:', inventory[0]);
  }
  
  // Get user's low stock threshold reactively
  const { lowStockThreshold } = useLowStockThreshold();

  const deleteMutation = useMutation({
    mutationFn: async (item: Inventory) => {
      // Convert the numeric ID to the Firestore document ID
      // Since we're using an adapter that converts string IDs to numbers,
      // we need to find the actual Firestore document
      const firestoreItems = await inventoryService.getAll();
      const firestoreItem = firestoreItems.find(fi => fi.itemName === item.itemName);
      
      if (!firestoreItem || !firestoreItem.id) {
        throw new Error('Item not found in database');
      }
      
      await inventoryService.delete(firestoreItem.id);
      return item; // Return item for logging
    },
    onSuccess: async (deletedItem) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] }); // Refresh logs since delete is logged in service
      
      showNotification.success('Item deleted', 'Inventory item deleted successfully');
    },
    onError: (error: Error) => {
      showNotification.error('Delete failed', error.message || 'Failed to delete inventory item');
    },
  });

  const handleEdit = (item: Inventory) => {
    setEditItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = async (item: Inventory) => {
    const result = await confirmAction.delete(item.itemName, 'inventory item');
    
    if (result.isConfirmed) {
      deleteMutation.mutate(item);
    }
  };
  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    }
    if (stock <= lowStockThreshold) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        icon: AlertTriangle,
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      icon: CheckCircle,
    };
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg bg-card dark:bg-card border border-border">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-border bg-muted/30 dark:bg-muted/20">
            <h3 className="text-lg font-medium text-foreground">Current Inventory</h3>
          </div>
          <div className="p-8 text-center bg-background dark:bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-card dark:bg-card border border-border">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border bg-muted/30 dark:bg-muted/20">
          <h3 className="text-lg font-medium text-foreground">Current Inventory</h3>
        </div>
        <div>
          {inventory.length === 0 ? (
            <div className="p-8 text-center bg-background dark:bg-background">
              <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30 dark:bg-muted/20">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Item Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background dark:bg-background divide-y divide-border">
                    {inventory.map((item, index) => {
                      debugLog('InventoryTable', `🔍 Rendering table row ${index + 1}/${inventory.length} for: "${item.itemName}" (ID: ${item.id})`);
                      
                      const status = getStockStatus(item.stock);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr 
                          key={`${item.id}-${item.itemName}`}
                          className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors border-b border-border"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-foreground">
                            {item.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {item.category || 'General'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-foreground">
                            {formatCurrency(item.price, localStorage.getItem('currency') || 'PHP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-foreground">
                            {item.stock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={status.variant} className="inline-flex items-center">
                              <StatusIcon size={12} className="mr-1" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {inventory.map((item, index) => {
                  debugLog('InventoryTable', `🔍 Rendering mobile card ${index + 1}/${inventory.length} for: "${item.itemName}" (ID: ${item.id})`);
                  
                  const status = getStockStatus(item.stock);
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={`${item.id}-${item.itemName}-mobile`} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-foreground">{item.itemName}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category || 'General'}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Price</p>
                          <p className="font-medium text-foreground">
                            {formatCurrency(item.price, localStorage.getItem('currency') || 'PHP')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Stock</p>
                          <p className="font-medium text-foreground">{item.stock}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-muted-foreground text-xs">Status</p>
                            <Badge variant={status.variant} className="inline-flex items-center text-xs mt-1">
                              <StatusIcon size={12} className="mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <EditInventoryModal
        item={editItem}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </Card>
  );
}
