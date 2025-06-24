import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useAuth } from "./lib/auth";
import { initializeApp } from "./lib/app-init";
import { useEffect, useState } from "react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Categories from "@/pages/categories";
import PublicInventory from "@/pages/public-inventory";
import PriceChecker from "@/pages/price-checker";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
// Import debug utility to make debug functions available globally
import "@/lib/debug";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-transparent relative overflow-hidden">
      <div className="floating-shapes absolute inset-0 pointer-events-none" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        {children}
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // Initialize app 
    initializeApp().finally(() => {
      setAppInitialized(true);
    });
  }, []);

  if (isLoading || !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
        <div className="floating-shapes absolute inset-0 pointer-events-none" />
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-muted-foreground">Loading Maans' Store...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/public" component={PublicInventory} />
      
      {isAuthenticated ? (
        <>
          <Route path="/">
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </Route>
          <Route path="/dashboard">
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </Route>
          <Route path="/inventory">
            <AuthenticatedLayout>
              <Inventory />
            </AuthenticatedLayout>
          </Route>
          <Route path="/categories">
            <AuthenticatedLayout>
              <Categories />
            </AuthenticatedLayout>
          </Route>
          <Route path="/price-checker">
            <AuthenticatedLayout>
              <PriceChecker />
            </AuthenticatedLayout>
          </Route>
          <Route path="/logs">
            <AuthenticatedLayout>
              <Logs />
            </AuthenticatedLayout>
          </Route>
          <Route path="/settings">
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </Route>
          {/* Catch-all for authenticated users goes to dashboard */}
          <Route component={() => <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        </>
      ) : (
        <>
          {/* All unauthenticated routes redirect to login */}
          <Route path="/" component={Login} />
          <Route component={Login} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="maans-store-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
