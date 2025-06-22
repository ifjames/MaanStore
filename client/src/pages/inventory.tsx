import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InventoryTable from "@/components/inventory/inventory-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory", { search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      
      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/inventory/sync");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Sync successful",
        description: `Updated ${data.itemCount} items from Google Sheets`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync inventory data",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your store's product inventory</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="store-btn-primary inline-flex items-center justify-center"
              >
                {syncMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Sync from Google Sheets
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Items
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={16} />
                  </div>
                  <Input
                    type="text"
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                    placeholder="Search by item name..."
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="itemName">Item Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-32">
                <Label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Order..." />
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

        {/* Inventory Table */}
        <InventoryTable inventory={inventory || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
