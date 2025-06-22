import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

interface InventoryItem {
  id: number;
  itemName: string;
  price: string;
  stock: number;
}

interface InventoryTableProps {
  inventory: InventoryItem[];
  isLoading: boolean;
}

export default function InventoryTable({ inventory, isLoading }: InventoryTableProps) {
  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    }
    if (stock <= 10) {
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
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Inventory</h3>
          </div>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          {inventory.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No inventory items found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const status = getStockStatus(item.stock);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={status.variant} className="inline-flex items-center">
                          <StatusIcon size={12} className="mr-1" />
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
  );
}
