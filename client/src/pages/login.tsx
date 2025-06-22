import { useState } from "react";
import { useLogin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const login = useLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset functionality would be implemented here",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-[#4CAF50] rounded-full flex items-center justify-center mb-4">
            <Store className="text-white text-2xl" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Maans' Store</h2>
          <p className="text-gray-600">Admin Login Portal</p>
        </div>

        {/* Login Form */}
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="store-input"
                    placeholder="admin@maansstore.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="store-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-700">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-[#2196F3] hover:text-[#1976D2] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={login.isPending}
                className="store-btn-primary w-full flex justify-center py-3 px-4"
              >
                {login.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                ) : (
                  <Store className="mr-2" size={16} />
                )}
                {login.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
