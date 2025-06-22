import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useAuth } from "./lib/auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import PublicInventory from "@/pages/public-inventory";
import PriceChecker from "@/pages/price-checker";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-transparent relative overflow-hidden">
      <div className="floating-shapes absolute inset-0 pointer-events-none" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
      
      {user ? (
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
          <Route path="/price-checker">
            <AuthenticatedLayout>
              <PriceChecker />
            </AuthenticatedLayout>
          </Route>
          <Route path="/settings">
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </Route>
        </>
      ) : (
        <Route path="/" component={Login} />
      )}
      
      <Route component={NotFound} />
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
