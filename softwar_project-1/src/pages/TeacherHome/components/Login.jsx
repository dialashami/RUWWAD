import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Welcome back!');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login - just fills the form, user clicks Sign In
  const handleDemoLogin = () => {
    setFormData({
      email: 'sarah.johnson@ruwwad.edu',
      password: 'demo123',
    });
    toast.info('Demo credentials filled. Click Sign In to login.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.98_0.02_280)] via-[oklch(0.99_0.01_270)] to-[oklch(0.98_0.02_260)] p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="gradient-text mb-2">Welcome to Ruwwad</h1>
          <p className="text-muted-foreground">Sign in to access your teacher portal</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[oklch(0.98_0.02_280)] to-[oklch(0.98_0.02_260)] pb-8">
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah.johnson@ruwwad.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 rounded-xl border-[oklch(0.92_0.04_270)] focus:border-[oklch(0.6_0.25_280)] h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 rounded-xl border-[oklch(0.92_0.04_270)] focus:border-[oklch(0.6_0.25_280)] h-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded border-[oklch(0.92_0.04_270)]" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[oklch(0.92_0.04_270)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDemoLogin}
                className="w-full rounded-xl h-12 border-[oklch(0.92_0.04_270)] hover:bg-gradient-to-r hover:from-[oklch(0.98_0.02_280)] hover:to-[oklch(0.98_0.02_260)] transition-all"
              >
                Try Demo Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          © 2025 Ruwwad Educational Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
