import { Link, useLocation } from "wouter";
import { useLogout, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Store, BarChart3, Package, LogOut, User } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const logout = useLogout();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, current: location === "/" || location === "/dashboard" },
    { name: "Inventory", href: "/inventory", icon: Package, current: location === "/inventory" },
  ];

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="h-10 w-10 bg-[#4CAF50] rounded-lg flex items-center justify-center">
            <Store className="text-white text-lg" size={20} />
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">Maans' Store</span>
        </div>
        
        {/* Navigation */}
        <nav className="mt-5 flex-1">
          <div className="px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`${
                      item.current
                        ? "bg-[#4CAF50] text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <Icon
                      className={`${
                        item.current ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                      } mr-3`}
                      size={16}
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* User Section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 text-sm" size={16} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <p className="text-xs text-gray-500">Admin User</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={logout.isPending}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
