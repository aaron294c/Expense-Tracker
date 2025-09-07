// pages/settings.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const router = useRouter();
  const { user, currentHousehold, households, signOut, switchHousehold, isLoading: authLoading } = useAuth();
  
  const [settings, setSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    pushNotifications: true,
    emailNotifications: false,
    faceId: true
  });

  const [showHouseholdSwitch, setShowHouseholdSwitch] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <SettingsSkeleton />;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  const handleHouseholdSwitch = (householdId: string) => {
    switchHousehold(householdId);
    setShowHouseholdSwitch(false);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center p-4">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <span className="text-gray-600">←</span>
          </button>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 flex-1">
            Settings
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-24">
        {/* Account Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">Account</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img 
                  alt="User avatar" 
                  className="h-12 w-12 rounded-full object-cover bg-gray-200" 
                  src={`https://ui-avatars.com/api/?name=${user.email}&background=random`}
                />
                <div>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    {currentHousehold?.name || 'No household selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Household Switcher */}
            {households.length > 1 && (
              <button
                onClick={() => setShowHouseholdSwitch(true)}
                className="flex items-center justify-between p-4 border-b border-gray-100 w-full text-left hover:bg-gray-50"
              >
                <div>
                  <p className="text-gray-900">Switch Household</p>
                  <p className="text-sm text-gray-500">
                    Currently: {currentHousehold?.name}
                  </p>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            )}

            {/* Sign Out */}
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50"
            >
              <p className="text-red-600">Sign Out</p>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">Preferences</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <SettingRow
              label="Currency"
              value={settings.currency}
              onClick={() => {/* Could open currency picker */}}
            />
            <SettingRow
              label="Date Format"
              value={settings.dateFormat}
              onClick={() => {/* Could open date format picker */}}
              showBorder
            />
            <SettingRow
              label="Time Format"
              value={settings.timeFormat}
              onClick={() => {/* Could open time format picker */}}
            />
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">Notifications</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <ToggleRow
              label="Push Notifications"
              enabled={settings.pushNotifications}
              onChange={(enabled) => updateSetting('pushNotifications', enabled)}
              showBorder
            />
            <ToggleRow
              label="Email Notifications"
              enabled={settings.emailNotifications}
              onChange={(enabled) => updateSetting('emailNotifications', enabled)}
            />
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">Security</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <ToggleRow
              label="Enable Face ID"
              enabled={settings.faceId}
              onChange={(enabled) => updateSetting('faceId', enabled)}
            />
          </div>
        </section>

        {/* App Information */}
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">App</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <SettingRow
              label="Privacy Policy"
              onClick={() => {/* Open privacy policy */}}
              showBorder
            />
            <SettingRow
              label="Terms of Service"
              onClick={() => {/* Open terms */}}
              showBorder
            />
            <SettingRow
              label="App Version"
              value="1.0.0"
            />
          </div>
        </section>

        {/* Debug Info (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <section>
            <h2 className="text-lg font-semibold text-gray-500 mb-4 px-4">Debug</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-2">User ID: {user.id}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Household ID: {currentHousehold?.id}
                </p>
                <p className="text-sm text-gray-500">
                  Total Households: {households.length}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Household Switch Modal */}
      {showHouseholdSwitch && (
        <Modal
          title="Switch Household"
          onClose={() => setShowHouseholdSwitch(false)}
        >
          <div className="space-y-2">
            {households.map((membership) => (
              <button
                key={membership.household_id}
                onClick={() => handleHouseholdSwitch(membership.household_id)}
                className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 ${
                  currentHousehold?.id === membership.household_id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'border border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">
                  {membership.households?.name}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {membership.role}
                </p>
                {currentHousehold?.id === membership.household_id && (
                  <p className="text-xs text-blue-600 mt-1">Current</p>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <Modal
          title="Sign Out"
          onClose={() => setShowSignOutConfirm(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to sign out? You'll need to sign back in to access your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="settings" />
    </div>
  );
}

// Setting Row Component
function SettingRow({ 
  label, 
  value, 
  onClick, 
  showBorder = false 
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  showBorder?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 ${
        showBorder ? 'border-b border-gray-100' : ''
      }`}
      disabled={!onClick}
    >
      <p className="text-gray-900">{label}</p>
      <div className="flex items-center space-x-2">
        {value && <span className="text-gray-500">{value}</span>}
        {onClick && <span className="text-gray-400">›</span>}
      </div>
    </button>
  );
}

// Toggle Row Component
function ToggleRow({ 
  label, 
  enabled, 
  onChange, 
  showBorder = false 
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  showBorder?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 ${
      showBorder ? 'border-b border-gray-100' : ''
    }`}>
      <p className="text-gray-900">{label}</p>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
      </label>
    </div>
  );
}

// Modal Component
function Modal({ 
  title, 
  children, 
  onClose 
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Bottom Navigation
function BottomNavigation({ currentPage }: { currentPage: string }) {
  const router = useRouter();

  const navItems = [
    { icon: '🏠', label: 'Home', page: 'home', href: '/dashboard' },
    { icon: '📊', label: 'Insights', page: 'insights', href: '/insights' },
    { icon: '+', label: 'Add', page: 'add', href: '/transactions/new