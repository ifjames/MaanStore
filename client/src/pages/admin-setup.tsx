import { useState, useEffect } from "react";
import { createAdminUser, checkIfAdminSetupNeeded } from "@/lib/admin-setup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AdminSetupProps {
  onComplete?: () => void;
}

export default function AdminSetup({ onComplete }: AdminSetupProps) {
  const [email, setEmail] = useState("admin@maanstore.com");
  const [password, setPassword] = useState("admin123");
  const [confirmPassword, setConfirmPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [setupAllowed, setSetupAllowed] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Double-check that admin setup should be allowed
    const verifySetupPermissions = async () => {
      try {
        const setupNeeded = await checkIfAdminSetupNeeded();
        setSetupAllowed(setupNeeded);
        
        if (!setupNeeded) {
          toast({
            variant: "destructive",
            title: "Setup Not Allowed",
            description: "Admin account setup has already been completed",
          });
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (error) {
        console.error('Error verifying setup permissions:', error);
        setSetupAllowed(false);
        toast({
          variant: "destructive",
          title: "Setup Error", 
          description: "Unable to verify setup permissions",
        });
      } finally {
        setCheckingPermissions(false);
      }
    };

    verifySetupPermissions();
  }, [toast]);

  if (checkingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
        <div className="floating-shapes absolute inset-0 pointer-events-none" />
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-muted-foreground">Verifying setup permissions...</p>
        </div>
      </div>
    );
  }

  if (!setupAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
        <div className="floating-shapes absolute inset-0 pointer-events-none" />
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <p className="text-red-500 font-semibold">Admin setup not allowed</p>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final security check before creating account
    try {
      const setupNeeded = await checkIfAdminSetupNeeded();
      
      if (!setupNeeded) {
        toast({
          variant: "destructive", 
          title: "Setup Denied",
          description: "Admin setup has already been completed",
        });
        window.location.href = "/";
        return;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Security Check Failed", 
        description: "Unable to verify system state",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createAdminUser(email, password);
      
      // Call onComplete callback if provided
      if (onComplete) {
        setTimeout(onComplete, 1000); // Small delay to show success message
      }
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Failed to create admin account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden p-6">
      <div className="floating-shapes absolute inset-0 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="store-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-gradient">
              Admin Setup
            </CardTitle>
            <p className="text-muted-foreground">
              Create your admin account for Maan's Store
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Admin Account"}
              </Button>
              
              {onComplete && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onComplete}
                >
                  I already have an account
                </Button>
              )}
            </form>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>This is a one-time setup for your store</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
