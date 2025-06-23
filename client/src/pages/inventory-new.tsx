import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InventoryTable from "@/components/inventory/inventory-table";
import { ExcelUploadComponent } from "@/components/inventory/excel-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");

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

  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gradient">Inventory Management</h1>
          <p className="mt-1 text-muted-foreground mobile-text">Manage your store's product inventory</p>
        </motion.div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              View Inventory
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {/* Search and Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Filter
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
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
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
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
