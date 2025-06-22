import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/stats-card";
import LowStockAlert from "@/components/dashboard/low-stock-alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, Warehouse, AlertTriangle, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/inventory/stats"],
  });

  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
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

  if (statsLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor your store's inventory and performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Items"
            value={stats?.totalItems || 0}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title="Total Stock"
            value={stats?.totalStock || 0}
            icon={Warehouse}
            color="secondary"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats?.lowStockCount || 0}
            icon={AlertTriangle}
            color="danger"
          />
          <StatsCard
            title="Inventory Value"
            value={`$${stats?.totalValue?.toFixed(2) || '0.00'}`}
            icon={DollarSign}
            color="accent"
          />
        </div>

        {/* Low Stock Alerts */}
        <div className="store-card mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="text-[#F44336] mr-2" size={20} />
                <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[#F44336]">
                  {stats?.lowStockCount || 0} items
                </span>
              </div>
              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="store-btn-secondary text-sm"
              >
                {syncMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                ) : (
                  <RefreshCw size={16} className="mr-1" />
                )}
                Sync Data
              </Button>
            </div>
          </div>
          <div className="p-6">
            {lowStockLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item: any) => (
                  <LowStockAlert key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No low stock items at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
