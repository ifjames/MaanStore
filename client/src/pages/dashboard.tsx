import StatsCard from "@/components/dashboard/stats-card";
import LowStockAlert from "@/components/dashboard/low-stock-alert";
import { Button } from "@/components/ui/button";
import { Package, Warehouse, AlertTriangle, DollarSign, BarChart3, Clock, AlertCircle, Loader } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { activityLogService } from "@/lib/firestore-service";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useLowStockThreshold } from "@/hooks/use-settings";
import { useFirestoreLowStock, useFirestoreInventoryStats, useFirestoreActivityLogs } from "@/hooks/use-firestore-realtime";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Get user's low stock threshold reactively
  const { lowStockThreshold } = useLowStockThreshold();

  // Use Firestore real-time hooks for auto-refreshing data
  const { stats, loading: statsLoading, error: statsError } = useFirestoreInventoryStats();
  
  // Custom hook to get low stock items with user threshold
  const { 
    lowStockItems, 
    loading: lowStockLoading, 
    error: lowStockError 
  } = useFirestoreLowStock(lowStockThreshold);
  
  // Get recent activity logs
  const { 
    logs: recentActivity, 
    loading: activityLoading, 
    error: activityError 
  } = useFirestoreActivityLogs(5); // Limit to 5 for dashboard

  const isLoading = statsLoading || lowStockLoading || activityLoading;
  
  // Combine all errors for display
  const errors = [statsError, lowStockError, activityError].filter(Boolean);

  // Remove Google Sheets sync and export mutations - replaced with Excel upload
  // const syncMutation = ... (removed)
  // const exportMutation = ... (removed)

  if (isLoading) {
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
      <div className="max-w-7xl mx-auto mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="mt-1 text-muted-foreground mobile-text">Monitor your store's inventory and performance</p>
        </motion.div>

        {/* Error display */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading dashboard data: {errors.join('. ')}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center my-8"
          >
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Loading real-time data...</span>
            </div>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard
              title="Total Items"
              value={stats?.totalItems || 0}
              icon={Package}
              color="primary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatsCard
              title="Total Stock"
              value={formatCompactNumber(stats?.totalStock || 0)}
              icon={Warehouse}
              color="secondary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatsCard
              title="Low Stock Items"
              value={stats?.lowStockCount || 0}
              icon={AlertTriangle}
              color="danger"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatsCard
              title="Total Value"
              value={formatCurrency(stats?.totalValue || 0)}
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
                  {stats?.lowStockCount || 0} items
                </span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  ≤ {lowStockThreshold} threshold
                </span>
              </div>
              {/* Google Sheets sync/export buttons removed - replaced with Excel upload in inventory page */}
            </div>
          </div>
          <div className="p-6">
            {lowStockLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 glass-card animate-pulse"></div>
                ))}
              </div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {/* Show first 6 items to prevent lag */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockItems.map((item: any, index: number) => (
                    <LowStockAlert key={item.id || `low-stock-${index}`} item={item} />
                  ))}
                </div>
                {(stats?.lowStockCount || 0) > 6 && (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm mb-2">
                      Showing 6 of {stats?.lowStockCount || 0} low stock items.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation('/inventory')}
                      className="text-xs"
                    >
                      View All in Inventory
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No low stock items at this time</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="store-card mb-8"
        >
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="text-primary mr-2" size={20} />
                <h3 className="text-lg font-medium">Recent Activity</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/logs')}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log: any, index: number) => (
                  <div key={log.id || `activity-${index}`} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-shrink-0">
                      <Clock className="text-muted-foreground" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {log.action?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {log.userEmail}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1 truncate">
                        {log.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="store-card"
        >
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center">
              <Package className="text-secondary mr-2" size={20} />
              <h3 className="text-lg font-medium">Quick Actions</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => setLocation('/inventory')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Package size={18} />
                <span>View Inventory</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/inventory')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Warehouse size={18} />
                <span>Add New Item</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/sales')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <BarChart3 size={18} />
                <span>View Sales</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
