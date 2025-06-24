import { Link, useLocation } from "wouter";
import { useLogout, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Store, BarChart3, Package, Calculator, LogOut, User, Settings, Menu, X, Activity, FolderOpen, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { confirmAction } from "@/lib/notifications";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logout = useLogout();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, current: location === "/" || location === "/dashboard" },
    { name: "Inventory", href: "/inventory", icon: Package, current: location === "/inventory" },
    { name: "Categories", href: "/categories", icon: FolderOpen, current: location === "/categories" },
    { name: "Price Checker", href: "/price-checker", icon: Calculator, current: location === "/price-checker" },
    { name: "Sales", href: "/sales", icon: TrendingUp, current: location === "/sales" },
    { name: "Activity Logs", href: "/logs", icon: Activity, current: location === "/logs" },
    { name: "Settings", href: "/settings", icon: Settings, current: location === "/settings" },
  ];

  const handleLogout = async () => {
    const result = await confirmAction.logout();
    
    if (result.isConfirmed) {
      logout.mutate();
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto glass-sidebar h-full">
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-shrink-0 px-4 mb-8"
      >
        <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <Store className="text-white" size={20} />
        </div>
        <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Maans' Store</span>
      </motion.div>
      
      {/* Navigation */}
      <nav className="mt-5 flex-1">
        <div className="px-2 space-y-2">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href} onClick={closeMobile}>
                  <div
                    className={`${
                      item.current
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                        : "text-foreground/80 hover:bg-background/20 hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/10 dark:hover:text-foreground"
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer`}
                  >
                    <Icon
                      className={`${
                        item.current ? "text-white" : "text-foreground/80 group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-foreground"
                      } mr-3`}
                      size={18}
                    />
                    {item.name}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
      
      {/* User Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex-shrink-0 flex border-t border-border/20 dark:border-white/10 p-4"
      >
        <div className="flex items-center w-full">
          <div className="h-10 w-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <User className="text-white" size={18} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-foreground dark:text-foreground">{user?.email}</p>
            <p className="text-xs text-foreground/60 dark:text-muted-foreground">Administrator</p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={logout.isPending}
            variant="ghost"
            size="sm"
            className="text-foreground/60 hover:text-foreground hover:bg-background/20 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-white/10 p-2 rounded-lg"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileOpen(true)}
          className="bg-background/80 backdrop-blur-md border border-border hover:bg-background/90 text-foreground shadow-lg dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20 dark:text-white"
          size="sm"
        >
          <Menu size={20} />
        </Button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 z-50 w-72 h-full"
            >
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={closeMobile}
                  variant="ghost"
                  size="sm"
                  className="text-foreground/70 hover:text-foreground hover:bg-background/20 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 p-2 rounded-lg"
                >
                  <X size={20} />
                </Button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
