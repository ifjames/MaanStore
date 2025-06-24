import { useState, useEffect } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Globe, 
  Shield, 
  Monitor, 
  Sun, 
  Moon, 
  Smartphone,
  Check,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { confirmAction } from "@/lib/notifications";
import { migrateLegacySettings } from "@/lib/settings";
import { useQueryClient } from "@tanstack/react-query";
import { useLowStockThreshold } from "@/hooks/use-settings";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lowStockThreshold, setLowStockThreshold } = useLowStockThreshold();
  const [localThreshold, setLocalThreshold] = useState<string>('10');

  // Load settings on component mount
  useEffect(() => {
    migrateLegacySettings();
    setLocalThreshold(lowStockThreshold.toString());
  }, [lowStockThreshold]);

  const handleSaveSettings = async () => {
    const result = await confirmAction.saveSettings();
    
    if (!result.isConfirmed) {
      return;
    }
    
    try {
      // Save the low stock threshold
      setLowStockThreshold(parseInt(localThreshold));
      
      // Invalidate relevant queries to refresh data with new threshold
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-4xl mx-auto space-y-6 mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <SettingsIcon className="text-white" size={16} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Settings</h1>
          </div>
          <p className="text-muted-foreground mobile-text">Customize your store management experience</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="store-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="text-purple-500" size={20} />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your preferred theme
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={theme === option.value ? "default" : "outline"}
                          className={`h-16 flex-col gap-2 ${
                            theme === option.value 
                              ? "store-btn-primary" 
                              : "store-btn-glass"
                          }`}
                          onClick={() => setTheme(option.value as any)}
                        >
                          <Icon size={16} />
                          <span className="text-xs">{option.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="store-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="text-blue-500" size={20} />
                  System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Low Stock Threshold</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alert when stock falls below this number
                  </p>
                  <Select value={localThreshold} onValueChange={setLocalThreshold}>
                    <SelectTrigger className="store-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 items</SelectItem>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="15">15 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Preview */}
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        Preview
                      </Badge>
                      <span className="text-muted-foreground">
                        Items with {localThreshold} or fewer units will be marked as "Low Stock"
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* About & Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="store-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="text-green-500" size={20} />
                  About Maans' Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Smartphone className="text-white" size={24} />
                    </div>
                    <h3 className="font-semibold mb-1">Mobile Ready</h3>
                    <p className="text-sm text-muted-foreground">
                      Optimized for all devices
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <RefreshCw className="text-white" size={24} />
                    </div>
                    <h3 className="font-semibold mb-1">Real-time Sync</h3>
                    <p className="text-sm text-muted-foreground">
                      Live inventory updates
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-cyan-500 to-green-500 flex items-center justify-center">
                      <Check className="text-white" size={24} />
                    </div>
                    <h3 className="font-semibold mb-1">Reliable</h3>
                    <p className="text-sm text-muted-foreground">
                      Built for business use
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">v2.0.0</Badge>
                  <Badge variant="outline">React 18</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Glassmorphism</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center pt-6"
        >
          <Button onClick={handleSaveSettings} className="store-btn-primary min-w-[200px]">
            <Check className="mr-2" size={16} />
            Save Settings
          </Button>
        </motion.div>
      </div>
    </div>
  );
}