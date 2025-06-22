import { Link, useLocation } from "wouter";
import { useLogout, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Store, BarChart3, Package, Calculator, LogOut, User, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logout = useLogout();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, current: location === "/" || location === "/dashboard" },
    { name: "Inventory", href: "/inventory", icon: Package, current: location === "/inventory" },
    { name: "Price Checker", href: "/price-checker", icon: Calculator, current: location === "/price-checker" },
    { name: "Settings", href: "/settings", icon: Settings, current: location === "/settings" },
  ];

  const handleLogout = () => {
    logout.mutate();
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
        <span className="ml-3 text-xl font-bold text-gradient">Maans' Store</span>
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
                        : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer`}
                  >
                    <Icon
                      className={`${
                        item.current ? "text-white" : "text-muted-foreground group-hover:text-foreground"
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
        className="flex-shrink-0 flex border-t border-white/10 p-4"
      >
        <div className="flex items-center w-full">
          <div className="h-10 w-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <User className="text-white" size={18} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={logout.isPending}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-white/10 p-2 rounded-lg"
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
          className="store-btn-glass p-2"
          size="sm"
        >
          <Menu size={20} />
        </Button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
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
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 z-50 w-64 h-full"
            >
              <div className="absolute top-4 right-4">
                <Button
                  onClick={closeMobile}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground p-2"
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
