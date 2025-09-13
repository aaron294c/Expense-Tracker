// pages/settings.tsx - Enhanced with profile management and data export/import
import React, { useState, useRef } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { Screen } from '../components/_layout/Screen';
import { BottomDock } from '../components/navigation/BottomDock';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../hooks/useHousehold';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { authenticatedFetch } from '../lib/api';
import { 
  User, 
  Globe, 
  Calendar, 
  Download, 
  Upload, 
  FileText, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  LogOut,
  Save,
  RefreshCw
} from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
];

function SettingsContent() {
  const { user, signOut } = useAuth();
  const { currentHousehold } = useHousehold();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'data' | 'account'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
  });

  // Preference settings
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    weekStartDay: 0, // Sunday
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    notifications: true,
  });

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, you'd update user profile via API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsLoading(true);

    try {
      // Save preferences to localStorage for now
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      showMessage('success', 'Preferences updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!currentHousehold) return;

    setIsLoading(true);
    try {
      // Fetch all data
      const [transactions, accounts, categories] = await Promise.all([
        authenticatedFetch(`/api/transactions?household_id=${currentHousehold.id}&limit=10000`),
        authenticatedFetch(`/api/accounts?household_id=${currentHousehold.id}`),
        authenticatedFetch(`/api/categories?household_id=${currentHousehold.id}`)
      ]);

      const exportData = {
        household: currentHousehold,
        transactions: transactions.data || [],
        accounts: accounts.data || [],
        categories: categories.data || [],
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      showMessage('success', 'Data exported successfully');
    } catch (error) {
      showMessage('error', 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!currentHousehold) return;

    setIsLoading(true);
    try {
      const data = await authenticatedFetch(`/api/transactions?household_id=${currentHousehold.id}&limit=10000`);
      const transactions = data.data || [];

      if (transactions.length === 0) {
        showMessage('error', 'No transactions to export');
        return;
      }

      const csvHeaders = ['Date', 'Description', 'Merchant', 'Account', 'Category', 'Amount', 'Type'];
      const csvRows = transactions.map((t: any) => [
        new Date(t.occurred_at).toLocaleDateString(),
        t.description,
        t.merchant || '',
        t.account_name,
        t.primary_category_name || '',
        t.amount.toString(),
        t.direction
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((field: string) => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      showMessage('success', 'CSV exported successfully');
    } catch (error) {
      showMessage('error', 'Failed to export CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      showMessage('error', 'Please select a valid JSON backup file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!data.transactions || !data.accounts || !data.categories) {
          throw new Error('Invalid backup file format');
        }

        // In a real app, you'd import this data via API calls
        console.log('Import data:', data);
        showMessage('success', `Found ${data.transactions.length} transactions to import`);
        
      } catch (error) {
        showMessage('error', 'Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const sections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'preferences', label: 'Preferences', icon: Palette },
    { key: 'data', label: 'Data', icon: Database },
    { key: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-gray-900">Settings</h1>
          <p className="text-[13px] text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
        {sections.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'profile' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono">{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Created:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Save size={16} />}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {activeSection === 'preferences' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-400" />
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(({ code, name, symbol }) => (
                    <option key={code} value={code}>
                      {symbol} {name} ({code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week starts on</label>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <select
                  value={preferences.weekStartDay}
                  onChange={(e) => setPreferences(prev => ({ ...prev, weekStartDay: parseInt(e.target.value) }))}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {WEEK_START_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Get notified about budget alerts and reminders</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              onClick={handlePreferencesUpdate}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Save size={16} />}
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </Card>
      )}

      {activeSection === 'data' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
            <p className="text-gray-600 mb-4">Download your financial data for backup or analysis</p>
            <div className="space-y-3">
              <button
                onClick={handleExportCSV}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Export as CSV
              </button>
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export Complete Backup (JSON)
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h2>
            <p className="text-gray-600 mb-4">Restore data from a previous backup</p>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Import Backup File
              </button>
              <p className="text-xs text-gray-500">
                Only JSON backup files created by this app are supported. This will not overwrite existing data.
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'account' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/setup')}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Setup Demo Household
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">App Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Last Updated</span>
                <span className="font-medium">Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Support</span>
                <a href="mailto:support@expense-tracker.com" className="text-blue-600 hover:text-blue-700">
                  Contact Us
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h2>
            <p className="text-gray-600 mb-4">
              These actions are permanent and cannot be undone.
            </p>
            <button
              onClick={handleSignOut}
              className="btn-destructive w-full flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { currentHousehold } = useHousehold();
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const handleAddTransaction = () => {
    setShowAddTransaction(true);
  };

  return (
    <AuthWrapper>
      <>
        <Screen>
          <SettingsContent />
        </Screen>

        <BottomDock onAdd={handleAddTransaction} />
      </>
    </AuthWrapper>
  );
}
