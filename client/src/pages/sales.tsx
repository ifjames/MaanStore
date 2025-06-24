import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, TrendingUp, DollarSign, BarChart3, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, confirmAction } from "@/lib/notifications";
import { debugLog } from "@/lib/debug";
import { useAuth } from "@/lib/auth";
import { salesService, type DailySales } from "@/lib/firestore-service";
import * as XLSX from 'xlsx';

// Add/Edit Sales Modal Component
function AddEditSalesModal({ 
  salesData, 
  open, 
  onOpenChange 
}: { 
  salesData?: DailySales | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    date: '',
    beginning: '',
    purchases: '',
    ending: '',
    remarks: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (salesData) {
      setFormData({
        date: salesData.date,
        beginning: salesData.beginning.toString(),
        purchases: salesData.purchases.toString(),
        ending: salesData.ending.toString(),
        remarks: salesData.remarks || ''
      });
    } else {
      // Reset form for new entry
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        beginning: '',
        purchases: '',
        ending: '',
        remarks: ''
      });
    }
  }, [salesData, open]);
  
  const mutation = useMutation({
    mutationFn: async () => {
      const beginning = parseFloat(formData.beginning) || 0;
      const purchases = parseFloat(formData.purchases) || 0;
      const ending = parseFloat(formData.ending) || 0;
      
      // Calculate based on Excel formula: Sale in Cash = End + Purchase - Beginning (SUM(D4+C4-B4))
      const saleInCash = Math.max(0, ending + purchases - beginning); // Prevent negative sales
      // Calculate profit (10% of sale in cash as shown in Excel)
      const profit = Math.max(0, saleInCash * 0.1); // Prevent negative profit
      
      const date = new Date(formData.date);
      const month = `${date.toLocaleString('default', { month: 'long' })}-${date.getFullYear()}`;
      
      const salesRecord = {
        date: formData.date,
        month,
        beginning,
        purchases,
        ending,
        saleInCash,
        profit,
        remarks: formData.remarks
      };
      
      if (salesData) {
        if (!salesData.id) throw new Error('Sales record ID is missing');
        return await salesService.update(salesData.id, salesRecord);
      } else {
        return await salesService.create(salesRecord);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Success",
        description: `Sales record ${salesData ? 'updated' : 'created'} successfully`,
      });
      onOpenChange(false);
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
    
    if (!formData.date || !formData.beginning || !formData.ending) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate();
  };
  
  // Calculate preview values using Excel formula: Sale in Cash = End + Purchase - Beginning (SUM(D4+C4-B4))
  const beginning = parseFloat(formData.beginning) || 0;
  const purchases = parseFloat(formData.purchases) || 0;
  const ending = parseFloat(formData.ending) || 0;
  const saleInCash = Math.max(0, ending + purchases - beginning); // Prevent negative sales
  const profit = Math.max(0, saleInCash * 0.1); // Prevent negative profit
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{salesData ? 'Edit' : 'Add'} Daily Sales</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="beginning">Beginning Inventory *</Label>
            <Input
              id="beginning"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.beginning}
              onChange={(e) => setFormData(prev => ({ ...prev, beginning: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="purchases">Purchases</Label>
            <Input
              id="purchases"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.purchases}
              onChange={(e) => setFormData(prev => ({ ...prev, purchases: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="ending">Ending Inventory *</Label>
            <Input
              id="ending"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.ending}
              onChange={(e) => setFormData(prev => ({ ...prev, ending: e.target.value }))}
              required
            />
          </div>
          
          {/* Preview calculations */}
          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Calculated Values:</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Sales in Cash:</span>
                <span className="font-medium">{formatCurrency(saleInCash, 'PHP')}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit (10%):</span>
                <span className="font-medium text-green-600">{formatCurrency(profit, 'PHP')}</span>
              </div>
              {(ending + purchases - beginning) < 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  ⚠️ Note: Calculated value would be negative. Sales and profit are set to ₱0.00 to prevent negative records.
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Optional notes..."
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={2}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : (salesData ? 'Update' : 'Add')} Sales
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Sales() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [editingSales, setEditingSales] = useState<DailySales | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  // Fetch sales data (only if user is authenticated)
  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: salesService.getAll,
    enabled: !!user // Only run query if user is authenticated
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: salesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Success",
        description: "Sales record deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter and process sales data
  const processedSales = useMemo(() => {
    let filtered = [...salesData];
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(sale => sale.month === selectedMonth);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return filtered;
  }, [salesData, selectedMonth]);
  
  // Calculate totals
  const totals = useMemo(() => {
    return processedSales.reduce((acc, sale) => ({
      totalSales: acc.totalSales + sale.saleInCash,
      totalProfit: acc.totalProfit + sale.profit,
      totalPurchases: acc.totalPurchases + sale.purchases
    }), { totalSales: 0, totalProfit: 0, totalPurchases: 0 });
  }, [processedSales]);
  
  // Get unique months for filter
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(salesData.map(sale => sale.month)));
    return months.sort().reverse();
  }, [salesData]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Optional: show a toast message
      toast({
        title: "Authentication Required",
        description: "Please login to access sales management",
        variant: "destructive",
      });
    }
  }, [user, authLoading, toast]);
  
  debugLog('Sales', 'Auth state:', { user: user?.email, authLoading, salesCount: salesData.length });
  
  // Show loading message while checking authentication
  if (authLoading) {
    return (
      <div className="flex-1 overflow-y-auto mobile-padding py-6">
        <div className="max-w-7xl mx-auto mobile-content">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Checking authentication status</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show login message if not authenticated
  if (!user) {
    return (
      <div className="flex-1 overflow-y-auto mobile-padding py-6">
        <div className="max-w-7xl mx-auto mobile-content">
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please login to access sales management</p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Export to Excel
  const handleExportToExcel = () => {
    if (processedSales.length === 0) {
      toast({
        title: "No Data",
        description: "No sales data to export",
      });
      return;
    }
    
    const excelData = [
      ['Date', 'Beginning', 'Dedn-Purchase', 'End', 'Sale in Cash(SUM(D4+C4-B4))', 'Profit(E4*0.1)', 'Remarks'],
      ...processedSales.map(sale => [
        sale.date,
        sale.beginning,
        sale.purchases,
        sale.ending,
        sale.saleInCash,
        sale.profit,
        sale.remarks || ''
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
    
    const fileName = `daily-sales-${selectedMonth !== 'all' ? selectedMonth : 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Success",
      description: "Sales data exported successfully",
    });
  };
  
  const handleEdit = (sales: DailySales) => {
    setEditingSales(sales);
    setModalOpen(true);
  };
  
  const handleDelete = async (sales: DailySales) => {
    if (!sales.id) {
      toast({
        title: "Error",
        description: "Sales record ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    const result = await confirmAction.delete(
      `sales record for ${new Date(sales.date).toLocaleDateString()}`, 
      'sales record'
    );
    
    if (result.isConfirmed) {
      deleteMutation.mutate(sales.id);
    }
  };
  
  const handleAddNew = () => {
    setEditingSales(null);
    setModalOpen(true);
  };
  
  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-7xl mx-auto mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Sales Management</h1>
          <p className="mt-1 text-muted-foreground mobile-text">Track and manage your daily sales records</p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totals.totalSales, 'PHP')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalProfit, 'PHP')}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Records</p>
                  <p className="text-2xl font-bold text-blue-600">{processedSales.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filters & Actions
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Sales
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Label htmlFor="month-filter">Filter by Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {availableMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleExportToExcel} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Daily Sales Records</CardTitle>
              {selectedMonth !== 'all' && (
                <p className="text-sm text-muted-foreground">Showing records for {selectedMonth}</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading sales data...</p>
                </div>
              ) : processedSales.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No sales records found</p>
                  <Button onClick={handleAddNew} className="mt-4">
                    Add Your First Sales Record
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30 dark:bg-muted/20">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Beginning</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ending</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sales</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {processedSales.map((sale, index) => (
                          <tr key={sale.id} className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              <div>
                                {new Date(sale.date).toLocaleDateString()}
                                <div className="text-xs text-muted-foreground">{sale.month}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatCurrency(sale.beginning, 'PHP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatCurrency(sale.purchases, 'PHP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatCurrency(sale.ending, 'PHP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                              {formatCurrency(sale.saleInCash, 'PHP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(sale.profit, 'PHP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(sale)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(sale)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4 p-4">
                    {processedSales.map((sale, index) => (
                      <Card key={sale.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {new Date(sale.date).toLocaleDateString()}
                            </h3>
                            <p className="text-xs text-muted-foreground">{sale.month}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(sale)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(sale)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Beginning</p>
                            <p className="font-medium">{formatCurrency(sale.beginning, 'PHP')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Purchase</p>
                            <p className="font-medium">{formatCurrency(sale.purchases, 'PHP')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Ending</p>
                            <p className="font-medium">{formatCurrency(sale.ending, 'PHP')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Sales</p>
                            <p className="font-medium text-primary">{formatCurrency(sale.saleInCash, 'PHP')}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-muted-foreground text-xs">Profit (10%)</p>
                              <p className="font-medium text-green-600">{formatCurrency(sale.profit, 'PHP')}</p>
                            </div>
                            {sale.remarks && (
                              <div className="text-right max-w-32">
                                <p className="text-xs text-muted-foreground">Remarks</p>
                                <p className="text-xs truncate" title={sale.remarks}>{sale.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add/Edit Modal */}
      <AddEditSalesModal
        salesData={editingSales}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
