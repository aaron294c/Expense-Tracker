// pages/setup.tsx - Updated setup page with proper auth
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { authenticatedFetch } from '../lib/api';

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const joinDemoHousehold = async () => {
    if (!user) {
      setError('No user found. Please sign in again.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    setDebugInfo('Starting demo household setup...');
    
    try {
      console.log('Joining demo household for user:', user.id);
      
      // Use authenticated fetch
      const data = await authenticatedFetch('/api/setup/demo', {
        method: 'POST',
      });

      console.log('Demo setup response:', data);
      setDebugInfo(`Response: ${JSON.stringify(data)}`);
      setSuccess('Successfully joined demo household! Redirecting...');
      
      // Wait a moment for user to see success message, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Failed to join demo household:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join demo household';
      setError(errorMessage);
      setDebugInfo(prev => prev + '\nError: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewHousehold = async () => {
    if (!user) {
      setError('No user found. Please sign in again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Creating new household for user:', user.id);
      
      const data = await authenticatedFetch('/api/households', {
        method: 'POST',
        body: JSON.stringify({
          name: `${user.email?.split('@')[0]}'s Household`,
          base_currency: 'USD'
        }),
      });

      console.log('Household creation response:', data);
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

        {/* Debug Info */}
        {debugInfo && (
          <div className="text-xs bg-gray-100 p-3 rounded-lg">
            <details>
              <summary className="cursor-pointer font-medium">Debug Info</summary>
              <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
            </details>
          </div>
        )}

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
          <button
            onClick={joinDemoHousehold}
            disabled={isLoading}
            className="w-full card p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Join Demo Household</h3>
                <p className="text-sm text-gray-600">Start with sample data to explore features</p>
                <div className="text-xs text-green-600 mt-1">
                  ✓ Sample transactions ✓ Budget setup ✓ Categories
                </div>
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </button>

          <button
            onClick={createNewHousehold}
            disabled={isLoading}
            className="w-full card p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">🏗️</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Create New Household</h3>
                <p className="text-sm text-gray-600">Start fresh with your own budget</p>
                <div className="text-xs text-blue-600 mt-1">
                  ✓ Clean slate ✓ Custom setup ✓ Full control
                </div>
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </button>
        </div>

        {/* User Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Signed in as <span className="font-medium">{user.email}</span></p>
          <p className="text-xs">User ID: {user.id}</p>
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

// hooks/useHousehold.ts - Updated with authenticated fetch
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../lib/api';

interface Household {
  id: string;
  name: string;
  base_currency: string;
  created_at: string;
  settings?: any;
}

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
  invited_by?: string;
  households?: Household;
}

export function useHousehold() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [userMemberships, setUserMemberships] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholds = async () => {
    if (!user) {
      setHouseholds([]);
      setCurrentHousehold(null);
      setUserMemberships([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use authenticated fetch for households
      const data = await authenticatedFetch('/api/households');
      
      setHouseholds(data.data || []);

      // Set current household to first one if not already set
      if (!currentHousehold && data.data?.length > 0) {
        const savedHouseholdId = localStorage.getItem('currentHouseholdId');
        const savedHousehold = savedHouseholdId 
          ? data.data.find(h => h.id === savedHouseholdId) 
          : null;
        
        setCurrentHousehold(savedHousehold || data.data[0]);
      }

    } catch (err) {
      console.error('Error fetching households:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch households');
    } finally {
      setIsLoading(false);
    }
  };

  const switchHousehold = (householdId: string) => {
    const household = households.find(h => h.id === householdId);
    if (household) {
      setCurrentHousehold(household);
      localStorage.setItem('currentHouseholdId', householdId);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  // Save current household to localStorage when it changes
  useEffect(() => {
    if (currentHousehold) {
      localStorage.setItem('currentHouseholdId', currentHousehold.id);
    }
  }, [currentHousehold]);

  return {
    households,
    currentHousehold,
    userMemberships,
    isLoading,
    error,
    setCurrentHousehold: switchHousehold,
    switchHousehold,
    refetch: fetchHouseholds
  };
}