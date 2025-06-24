import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, User, Clock, FileText, Loader, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useFirestoreActivityLogs } from "@/hooks/use-firestore-realtime";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { activityLogService, type ActivityLog as FirestoreActivityLog } from "@/lib/firestore-service";

interface ActivityLog {
  id: number;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'LOGIN':
      return <User className="h-4 w-4" />;
    case 'INVENTORY_ADD':
    case 'INVENTORY_UPDATE':
    case 'INVENTORY_DELETE':
      return <FileText className="h-4 w-4" />;
    case 'INVENTORY_UPLOAD':
    case 'INVENTORY_EXPORT':
    case 'INVENTORY_CLEAR':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'LOGIN':
      return 'bg-blue-500';
    case 'INVENTORY_ADD':
      return 'bg-green-500';
    case 'INVENTORY_UPDATE':
      return 'bg-yellow-500';
    case 'INVENTORY_DELETE':
    case 'INVENTORY_CLEAR':
      return 'bg-red-500';
    case 'INVENTORY_UPLOAD':
    case 'INVENTORY_EXPORT':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'LOGIN':
      return 'Login';
    case 'INVENTORY_ADD':
      return 'Item Added';
    case 'INVENTORY_UPDATE':
      return 'Item Updated';
    case 'INVENTORY_DELETE':
      return 'Item Deleted';
    case 'INVENTORY_UPLOAD':
      return 'Bulk Upload';
    case 'INVENTORY_EXPORT':
      return 'Export';
    case 'INVENTORY_CLEAR':
      return 'Clear All';
    default:
      return action;
  }
};

export default function Logs() {
  // Use Firestore real-time hook for auto-refreshing activity logs
  const { logs: firestoreLogs, loading: isLoading, error } = useFirestoreActivityLogs(100);
  
  // Convert to expected format for display
  const logs = firestoreLogs.map((log): ActivityLog => ({
    id: parseInt(log.id || '0'),
    userId: log.userId || 'unknown',
    action: log.action,
    details: log.details,
    timestamp: log.timestamp ? log.timestamp.toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-6xl mx-auto mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Activity Logs</h1>
              <p className="mt-1 text-muted-foreground mobile-text">
                Track all system activities and user actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Updating in real-time...</span>
                </div>
              ) : (
                <Badge variant="outline" className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-xs">Real-time updates active</span>
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading activity logs: {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Log Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {logs?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {logs?.filter((log: ActivityLog) => log.action.includes('ADD')).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Items Added</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {logs?.filter((log: ActivityLog) => log.action.includes('UPLOAD')).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Bulk Uploads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {logs?.filter((log: ActivityLog) => log.action === 'LOGIN').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Logins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {logs.map((log: ActivityLog, index: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-4 p-4 bg-white/5 dark:bg-black/5 rounded-lg border border-border/50"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {log.userId}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{log.details}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activity logs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
