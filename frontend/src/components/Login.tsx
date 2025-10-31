import { useState, type FormEvent } from "react";
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        (import.meta as any).env?.VITE_API_URL
          ? `${(import.meta as any).env.VITE_API_URL}/api/auth/login`
          : "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Invalid email or password");
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      if (data?.user) {
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
        } catch {}
      }

      toast.success("Login successful!");
      onLogin();
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
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
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
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
                name="login_email"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
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
                name="login_password"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
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
