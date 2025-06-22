import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import PublicInventory from "@/pages/public-inventory";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50]"></div>
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
