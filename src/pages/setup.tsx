import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function SetupPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const joinDemoHousehold = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/setup/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to join demo household');
      }

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Failed to join demo household:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    router.push('/login');
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Stitch</h1>
          <p className="text-gray-600 mt-2">Let's get your budget set up.</p>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-4">
          <Button
            onClick={joinDemoHousehold}
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            <Card className="w-full text-left p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Join Demo Household</h3>
                  <p className="text-sm text-gray-600">Start with sample data to explore features</p>
                </div>
              </div>
            </Card>
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => {/* TODO: Implement household creation */}}
          >
            <Card className="w-full text-left p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create New Household</h3>
                  <p className="text-sm text-gray-600">Start fresh with your own budget</p>
                </div>
              </div>
            </Card>
          </Button>
        </div>

        {/* User Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Signed in as {user.email}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="mt-2">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
