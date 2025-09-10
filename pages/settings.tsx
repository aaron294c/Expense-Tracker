// pages/settings.tsx
import React from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

function SettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-mono text-xs text-gray-600">{user?.id}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">App</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-gray-900">Version</p>
            <span className="text-gray-500">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-900">Privacy Policy</p>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-900">Terms of Service</p>
            <span className="text-gray-400">→</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={() => router.push('/setup')}>
            Setup Demo Household
          </Button>
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <AppLayout title="Settings">
        <SettingsContent />
      </AppLayout>
    </AuthWrapper>
  );
}
