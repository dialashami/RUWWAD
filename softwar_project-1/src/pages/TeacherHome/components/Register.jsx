import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BookOpen, Mail, Lock, User, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher',
    subject: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'teacher' && !formData.subject) {
      toast.error('Please select your subject');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const result = register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        subject: formData.subject,
      });

      if (result.success) {
        toast.success('Account created successfully!');
      } else {
        toast.error(result.error || 'Registration failed');
      }

      setIsLoading(false);
    }, 800);
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
          <h1 className="gradient-text mb-2">Join Ruwwad</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Register Card */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[oklch(0.98_0.02_280)] to-[oklch(0.98_0.02_260)] pb-8">
            <CardTitle className="text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Sarah Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 rounded-xl border-[oklch(0.92_0.04_270)] focus:border-[oklch(0.6_0.25_280)] h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 rounded-xl border-[oklch(0.92_0.04_270)] focus:border-[oklch(0.6_0.25_280)] h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="rounded-xl border-[oklch(0.92_0.04_270)] h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'teacher' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="pl-10 rounded-xl border-[oklch(0.92_0.04_270)] h-12">
                        <SelectValue placeholder="Select your subject" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 rounded-xl border-[oklch(0.92_0.04_270)] focus:border-[oklch(0.6_0.25_280)] h-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" required className="mt-1 rounded border-[oklch(0.92_0.04_270)]" />
                <p className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
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
