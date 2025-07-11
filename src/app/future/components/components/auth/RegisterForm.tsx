'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists');
        return;
      }

      // Update profile with additional info
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      setMessage('Registration successful! Please check your email to verify your account.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Finkargo Analytics to optimize your supply chain
        </p>
      </div>

      <form onSubmit={handleRegister} className="mt-8 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email address</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account?</span>{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}