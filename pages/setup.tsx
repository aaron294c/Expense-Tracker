// pages/setup.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const joinDemoHousehold = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/setup/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join demo household');
      }

      // Redirect to dashboard after successful setup
      router.push('/dashboard/overview');
    } catch (error) {
      console.error('Failed to join demo household:', error);
      setError(error instanceof Error ? error.message : 'Failed to join demo household');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Expense Tracker</h1>
          <p className="text-gray-600 mt-2">Let's get your budget set up.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Setup Options */}
        <div className="space-y-4">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={joinDemoHousehold}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Join Demo Household</h3>
                <p className="text-sm text-gray-600">Start with sample data to explore features</p>
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </Card>

          <Card className="p-4 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Create New Household</h3>
                <p className="text-sm text-gray-600">Start fresh with your own budget (Coming Soon)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* User Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Signed in as {user.email}</p>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="mt-2">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}