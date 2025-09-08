import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { Card } from '../components/ui/Card';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour'
  });

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    budgetAlerts: true,
    weeklyReports: true
  });

  const [security, setSecurity] = useState({
    faceId: true,
    touchId: false,
    autoLock: true
  });

  return (
    <Layout title="Settings">
      <div className="p-4 space-y-8">
        <PreferencesSection 
          preferences={preferences}
          onUpdate={setPreferences}
        />
        
        <NotificationSettings 
          settings={notifications}
          onUpdate={setNotifications}
        />
        
        <SecuritySettings 
          settings={security}
          onUpdate={setSecurity}
        />

        {/* App Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-2 px-4">App</h2>
          <Card padding={false}>
            <a 
              href="#" 
              className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <p className="text-gray-900">Privacy Policy</p>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </a>
            <a 
              href="#" 
              className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <p className="text-gray-900">Terms of Service</p>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </a>
            <div className="flex items-center justify-between p-4">
              <p className="text-gray-900">App Version</p>
              <span className="text-gray-500">1.0.0</span>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
