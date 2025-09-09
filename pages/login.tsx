// pages/login.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('test.user+ux@demo.local'); // Pre-fill for demo
  const [password, setPassword] = useState('demo-password-123'); // Pre-fill for demo
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard/overview');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
        if (!result.error) {
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Start tracking your expenses today' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            minLength={6}
          />

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Demo credentials notice */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm">
            <strong>Demo credentials:</strong><br />
            Email: test.user+ux@demo.local<br />
            Password: demo-password-123
          </p>
        </div>
      </Card>
    </div>
  );
}