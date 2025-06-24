import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showNotification } from '@/lib/notifications';
import { inventoryService, categoryService, activityLogService, type Category as FirestoreCategory } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth';
import type { Inventory } from '@/../../shared/schema';
import { debugLog } from '@/lib/debug';

interface EditInventoryModalProps {
  item: Inventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInventoryModal({ item, open, onOpenChange }: EditInventoryModalProps) {
  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    stock: '',
    category: 'General',
    isBulkPricing: false,
    bulkQuantity: '',
    bulkPrice: ''
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  useEffect(() => {
    if (item) {
      // Detect if this is a bulk pricing item
      const bulkMatch = item.itemName.match(/\((\d+) for ([\d.]+)\)$/);
      
      if (bulkMatch) {
        const [, quantity, price] = bulkMatch;
        const itemNameWithoutBulk = item.itemName.replace(/\s*\(\d+ for [\d.]+\)$/, '');
        
        setFormData({
          itemName: itemNameWithoutBulk,
          price: item.price,
          stock: item.stock.toString(),
          category: item.category || 'General',
          isBulkPricing: true,
          bulkQuantity: quantity,
          bulkPrice: price
        });
      } else {
        setFormData({
          itemName: item.itemName,
          price: item.price,
          stock: item.stock.toString(),
          category: item.category || 'General',
          isBulkPricing: false,
          bulkQuantity: '',
          bulkPrice: ''
        });
      }
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!item) throw new Error('No item to update');

      // Find the actual Firestore document ID since we're using an adapter 
      // that converts string IDs to numbers
      const firestoreItems = await inventoryService.getAll();
      const firestoreItem = firestoreItems.find(fi => fi.itemName === item.itemName);
      
      if (!firestoreItem || !firestoreItem.id) {
        console.error('Failed to find Firestore item for update:', {
          searchedItemName: item.itemName,
          availableItems: firestoreItems.map(i => ({ id: i.id, itemName: i.itemName }))
        });
        throw new Error(`Item "${item.itemName}" not found in database`);
      }

      debugLog('EditInventoryModal', 'Updating item with Firestore ID:', firestoreItem.id);

      let finalPrice = data.price;
      let finalItemName = data.itemName;
      
      // Handle bulk pricing
      if (data.isBulkPricing && data.bulkQuantity && data.bulkPrice) {
        const bulkQty = parseInt(data.bulkQuantity);
        const bulkPriceNum = parseFloat(data.bulkPrice);
        const unitPrice = bulkPriceNum / bulkQty;
        
        finalPrice = unitPrice.toFixed(2);
        finalItemName = `${data.itemName} (${bulkQty} for ${bulkPriceNum})`;
      }

      const updateData = {
        itemName: finalItemName,
        price: finalPrice, // Keep as string since that's what Firestore expects
        stock: parseInt(data.stock),
        category: data.category
      };

      return await inventoryService.update(firestoreItem.id, updateData);
    },
    onSuccess: async (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      
      // Log the activity
      if (user && item) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'INVENTORY_UPDATE',
            details: `Updated item "${item.itemName}" (ID: ${item.id})`
          });
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        } catch (error) {
          console.warn('Failed to log update item activity:', error);
        }
      }
      
      showNotification.success('Item updated', 'Inventory item updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      showNotification.error('Update failed', error.message || 'Failed to update inventory item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.itemName.trim()) {
      showNotification.error('Validation error', 'Item name is required');
      return;
    }
    
    if (formData.isBulkPricing) {
      if (!formData.bulkQuantity || parseInt(formData.bulkQuantity) <= 0) {
        showNotification.error('Validation error', 'Valid bulk quantity is required');
        return;
      }
      
      if (!formData.bulkPrice || parseFloat(formData.bulkPrice) <= 0) {
        showNotification.error('Validation error', 'Valid bulk price is required');
        return;
      }
    } else {
      if (!formData.price || parseFloat(formData.price) < 0) {
        showNotification.error('Validation error', 'Valid price is required');
        return;
      }
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      showNotification.error('Validation error', 'Valid stock quantity is required');
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the item details below to modify your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => handleInputChange('itemName', e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="bulk-pricing-edit"
              checked={formData.isBulkPricing}
              onCheckedChange={(checked) => handleInputChange('isBulkPricing', checked)}
            />
            <Label htmlFor="bulk-pricing-edit">Bulk Pricing (e.g., "4 for 5 pesos")</Label>
          </div>

          {formData.isBulkPricing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkQuantity">Bulk Quantity</Label>
                  <Input
                    id="bulkQuantity"
                    type="number"
                    min="1"
                    value={formData.bulkQuantity}
                    onChange={(e) => handleInputChange('bulkQuantity', e.target.value)}
                    placeholder="4"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice">Bulk Price (₱)</Label>
                  <Input
                    id="bulkPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bulkPrice}
                    onChange={(e) => handleInputChange('bulkPrice', e.target.value)}
                    placeholder="5.00"
                    required
                  />
                </div>
              </div>
              {formData.bulkQuantity && formData.bulkPrice && (
                <div className="text-sm text-muted-foreground">
                  Unit price: ₱{(parseFloat(formData.bulkPrice) / parseInt(formData.bulkQuantity || "1")).toFixed(2)} each
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="price">Price (₱)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: FirestoreCategory) => (
                  <SelectItem key={category.id || category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
