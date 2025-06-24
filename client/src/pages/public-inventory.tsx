import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store, Search, Clock } from "lucide-react";
import { settingsService } from "@/lib/settings";
import { formatCurrency } from "@/lib/notifications";

export default function PublicInventory() {
  const [search, setSearch] = useState("");
  
  // Get user's low stock threshold for consistent display
  const lowStockThreshold = settingsService.getLowStockThreshold();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory/public"],
  });

  const filteredInventory = Array.isArray(inventory) ? inventory.filter((item: any) =>
    item.itemName.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getAvailabilityStatus = (stock: number) => {
    if (stock <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= lowStockThreshold) return { label: "Limited Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-[#4CAF50] rounded-full flex items-center justify-center mb-4">
            <Store className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Maans' Store</h1>
          <p className="text-xl text-gray-600">Current Inventory & Pricing</p>
        </div>

        {/* Search */}
        <Card className="shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="max-w-md mx-auto">
              <Label htmlFor="publicSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={16} />
                </div>
                <Input
                  type="text"
                  id="publicSearch"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] text-lg"
                  placeholder="Search for products..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Inventory Table */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Available Products</h3>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading inventory...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="p-8 text-center">
                  <Store size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {search ? "No products found matching your search" : "No products available"}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Availability
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredInventory.map((item: any) => {
                      const status = getAvailabilityStatus(item.stock);
                      return (
                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {item.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatCurrency(parseFloat(item.price), 'PHP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground flex items-center justify-center">
            <Clock size={16} className="mr-1" />
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
