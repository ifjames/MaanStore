import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { inventoryService, categoryService, activityLogService, type Category as FirestoreCategory } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth";

interface AddItemModalProps {
  children?: React.ReactNode;
}

interface FormData {
  itemName: string;
  price: string;
  stock: string;
  category: string;
  isBulkPricing: boolean;
  bulkQuantity: string;
  bulkPrice: string;
}

export function AddItemModal({ children }: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    itemName: "",
    price: "",
    stock: "",
    category: "",
    isBulkPricing: false,
    bulkQuantity: "",
    bulkPrice: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
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
      
      const newItem = {
        itemName: finalItemName,
        price: finalPrice,
        stock: parseInt(data.stock),
        category: data.category
      };
      
      return await inventoryService.create(newItem);
    },
    onSuccess: async (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      // Log the activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'INVENTORY_ADD',
            details: `Added item "${newItem.itemName}" with stock ${newItem.stock}`
          });
          // Invalidate logs to refresh the activity feed
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        } catch (error) {
          console.warn('Failed to log add item activity:', error);
        }
      }
      
      toast({
        title: "Success",
        description: `Item "${newItem.itemName}" has been added to inventory`,
      });
      
      // Reset form and close modal
      setFormData({
        itemName: "",
        price: "",
        stock: "",
        category: "",
        isBulkPricing: false,
        bulkQuantity: "",
        bulkPrice: ""
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.itemName.trim()) {
      toast({
        title: "Validation Error",
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.isBulkPricing) {
      if (!formData.bulkQuantity || parseInt(formData.bulkQuantity) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid bulk quantity",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.bulkPrice || parseFloat(formData.bulkPrice) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid bulk price",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
    addItemMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === "isBulkPricing" ? value === "true" : value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new item to your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name *</Label>
            <Input
              id="itemName"
              type="text"
              placeholder="Enter item name"
              value={formData.itemName}
              onChange={(e) => handleInputChange("itemName", e.target.value)}
              className="mt-1"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="bulk-pricing"
              checked={formData.isBulkPricing}
              onCheckedChange={(checked) => handleInputChange("isBulkPricing", checked.toString())}
            />
            <Label htmlFor="bulk-pricing">Bulk Pricing (e.g., "4 for 5 pesos")</Label>
          </div>
          
          {formData.isBulkPricing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulkQuantity">Bulk Quantity *</Label>
                <Input
                  id="bulkQuantity"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={formData.bulkQuantity}
                  onChange={(e) => handleInputChange("bulkQuantity", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bulkPrice">Bulk Price (₱) *</Label>
                <Input
                  id="bulkPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  value={formData.bulkPrice}
                  onChange={(e) => handleInputChange("bulkPrice", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              {formData.bulkQuantity && formData.bulkPrice && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Unit price: ₱{(parseFloat(formData.bulkPrice) / parseInt(formData.bulkQuantity || "1")).toFixed(2)} each
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="price">Price (₱) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="mt-1"
                required
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="stock">Stock Quantity *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock}
              onChange={(e) => handleInputChange("stock", e.target.value)}
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className="mt-1">
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
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={addItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
