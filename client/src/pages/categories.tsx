import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { categoryService, activityLogService, inventoryService, type Category } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const newCategory = await categoryService.create({
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      setCategories([...categories, newCategory]);
      setFormData({ name: "", description: "" });
      setIsAddDialogOpen(false);
      
      // Log the activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'CATEGORY_ADD',
            details: `Added category "${newCategory.name}"`
          });
        } catch (error) {
          console.warn('Failed to log add category activity:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (!editingCategory.id) {
        throw new Error("Category ID is missing");
      }
      
      const newName = formData.name.trim();
      const oldName = editingCategory.name;
      const nameIsChanging = oldName !== newName;

      // Get inventory items with this category to check if any will be updated
      let itemsWithCategory = [];
      if (nameIsChanging) {
        const allInventory = await inventoryService.getAll();
        itemsWithCategory = allInventory.filter(item => item.category === oldName);
      }
      
      // Update the category
      await categoryService.update(editingCategory.id, {
        name: newName,
        description: formData.description.trim()
      });
      
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, name: newName, description: formData.description.trim() }
          : cat
      );
      setCategories(updatedCategories);
      setFormData({ name: "", description: "" });
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      
      // Log the activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'CATEGORY_UPDATE',
            details: `Updated category "${newName}"`
          });
        } catch (error) {
          console.warn('Failed to log update category activity:', error);
        }
      }
      
      // Show appropriate success message
      if (nameIsChanging && itemsWithCategory.length > 0) {
        toast({
          title: "Category Updated",
          description: `Category renamed and ${itemsWithCategory.length} inventory items updated to use the new category name.`,
        });
      } else {
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!category.id) {
        throw new Error("Category ID is missing");
      }
      
      await categoryService.delete(category.id);
      setCategories(categories.filter(cat => cat.id !== category.id));
      
      // Log the activity
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'CATEGORY_DELETE',
            details: `Deleted category "${category.name}"`
          });
        } catch (error) {
          console.warn('Failed to log delete category activity:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name || "", 
      description: category.description || "" 
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto mobile-padding py-6">
        <div className="max-w-7xl mx-auto mobile-content">
          <div className="space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-7xl mx-auto space-y-6 mobile-content">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Category Management</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage product categories for better organization
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] mobile-dialog">
              <form onSubmit={handleAddCategory}>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new product category to organize your inventory items.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Beverages, Electronics, Clothing"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                  {isSubmitting ? "Adding..." : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Categories help organize your inventory items. When you add or edit inventory items, 
          you can assign them to these categories for better organization and filtering.
        </AlertDescription>
      </Alert>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="text-6xl">📂</div>
              <h3 className="text-lg font-semibold">No Categories Yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Start organizing your inventory by creating your first product category.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base sm:text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit text-xs">
                      ID: {category.id}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {category.description && (
                <>
                  <Separator />
                  <CardContent className="pt-3">
                    <CardDescription className="text-xs sm:text-sm">{category.description}</CardDescription>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] mobile-dialog">
          <form onSubmit={handleEditCategory}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beverages, Electronics, Clothing"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
