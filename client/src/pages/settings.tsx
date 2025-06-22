import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Globe, 
  Bell, 
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

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'PHP');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') === 'true');
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('autoSync') === 'true');
  const [lowStockThreshold, setLowStockThreshold] = useState(() => localStorage.getItem('lowStockThreshold') || '10');

  const handleSaveSettings = () => {
    localStorage.setItem('currency', currency);
    localStorage.setItem('notifications', notifications.toString());
    localStorage.setItem('autoSync', autoSync.toString());
    localStorage.setItem('lowStockThreshold', lowStockThreshold);
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const currencies = [
    { value: 'PHP', label: 'Philippine Peso (₱)', symbol: '₱' },
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="flex-1 overflow-y-auto mobile-padding py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <SettingsIcon className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          </div>
          <p className="text-muted-foreground mobile-text">
            Customize your Maans' Store experience
          </p>
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

                <Separator />

                <div>
                  <Label className="text-base font-medium">Currency</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select your preferred currency for displaying prices
                  </p>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="store-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{curr.symbol}</span>
                            {curr.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync inventory data
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Low Stock Threshold</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alert when stock falls below this number
                  </p>
                  <Select value={lowStockThreshold} onValueChange={setLowStockThreshold}>
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