import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate credentials
    if (email === "admin@buzzinga.com" && password === "buzzinga2025") {
      setIsLoading(true);
      
      // Simulate login delay
      setTimeout(() => {
        toast.success("Login successful!");
        onLogin();
        setIsLoading(false);
      }, 800);
    } else {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-blue-500 mb-4">
            <span className="text-2xl text-white">B</span>
          </div>
          <h1 className="text-neutral-900 mb-2">Buzzinga CMS</h1>
          <p className="text-neutral-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-neutral-50 border-neutral-300 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-neutral-50 border-neutral-300 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-neutral-200">
          <div className="text-center">
            <p className="text-sm text-neutral-600 mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-sm text-neutral-900">
                <span className="text-neutral-500">Email:</span> admin@buzzinga.com
              </p>
              <p className="text-sm text-neutral-900">
                <span className="text-neutral-500">Password:</span> buzzinga2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
