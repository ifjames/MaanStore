import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/stats-card";
import LowStockAlert from "@/components/dashboard/low-stock-alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, Warehouse, AlertTriangle, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { showNotification, formatCurrency } from "@/lib/notifications";
import { motion } from "framer-motion";

export default function Dashboard() {
  const queryClient = useQueryClient();


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
      showNotification.success("Sync successful", `Updated ${data.itemCount} items from Google Sheets`);
    },
    onError: (error: Error) => {
      showNotification.error("Sync failed", error.message || "Failed to sync inventory data");
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
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="mt-1 text-muted-foreground mobile-text">Monitor your store's inventory and performance</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard
              title="Total Items"
              value={(stats as any)?.totalItems || 0}
              icon={Package}
              color="primary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatsCard
              title="Total Stock"
              value={(stats as any)?.totalStock || 0}
              icon={Warehouse}
              color="secondary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatsCard
              title="Low Stock Items"
              value={(stats as any)?.lowStockCount || 0}
              icon={AlertTriangle}
              color="danger"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatsCard
              title="Inventory Value"
              value={formatCurrency((stats as any)?.totalValue || 0, localStorage.getItem('currency') || 'PHP')}
              icon={DollarSign}
              color="accent"
            />
          </motion.div>
        </div>

        {/* Low Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="store-card mb-8"
        >
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="text-destructive mr-2" size={20} />
                <h3 className="text-lg font-medium">Low Stock Alerts</h3>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-destructive">
                  {(stats as any)?.lowStockCount || 0} items
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
                  <div key={i} className="h-20 glass-card animate-pulse"></div>
                ))}
              </div>
            ) : (lowStockItems as any) && (lowStockItems as any).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(lowStockItems as any).map((item: any) => (
                  <LowStockAlert key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No low stock items at this time</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
