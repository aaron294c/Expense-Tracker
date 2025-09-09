// pages/setup.tsx - Fixed version with working demo household integration
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');
    
    try {
      const response = await fetch('/api/setup/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join demo household');
      }

      setSuccess('Successfully joined demo household! Redirecting...');
      
      // Wait a moment for user to see success message, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Failed to join demo household:', error);
      setError(error instanceof Error ? error.message : 'Failed to join demo household');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewHousehold = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // First create the household
      const householdResponse = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${user?.email?.split('@')[0]}'s Household`,
          base_currency: 'USD'
        }),
      });

      if (!householdResponse.ok) {
        const errorData = await householdResponse.json();
        throw new Error(errorData.error || 'Failed to create household');
      }

      const { data: household } = await householdResponse.json();

      // Add user as owner of the household
      const memberResponse = await fetch('/api/household-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: household.id,
          user_id: user?.id,
          role: 'owner'
        }),
      });

      if (!memberResponse.ok) {
        throw new Error('Failed to add user to household');
      }

      setSuccess('Household created successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Failed to create household:', error);
      setError(error instanceof Error ? error.message : 'Failed to create household');
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

        {/* Success Message */}
        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
            {success}
          </div>
        )}

        {/* Setup Options */}
        <div className="space-y-4">
          <div 
            className="card p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200" 
            onClick={!isLoading ? joinDemoHousehold : undefined}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Join Demo Household</h3>
                <p className="text-sm text-gray-600">Start with sample data to explore features</p>
                <div className="text-xs text-green-600 mt-1">
                  ✓ Sample transactions ✓ Budget setup ✓ Categories
                </div>
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </div>

          <div 
            className="card p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200" 
            onClick={!isLoading ? createNewHousehold : undefined}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">🏗️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Create New Household</h3>
                <p className="text-sm text-gray-600">Start fresh with your own budget</p>
                <div className="text-xs text-blue-600 mt-1">
                  ✓ Clean slate ✓ Custom setup ✓ Full control
                </div>
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Signed in as <span className="font-medium">{user.email}</span></p>
          <button 
            onClick={handleSignOut}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign Out
          </button>
        </div>

        {/* Help Text */}
        <div className="card p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">🤔 Not sure which to choose?</h4>
          <p className="text-sm text-blue-800">
            We recommend starting with the <strong>Demo Household</strong> to explore all features 
            with sample data. You can always create a new household later!
          </p>
        </div>
      </div>
    </div>
  );
}