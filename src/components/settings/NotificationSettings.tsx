import React from 'react';
import { Card } from '../ui/Card';

interface NotificationSettingsProps {
  settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    budgetAlerts: boolean;
    weeklyReports: boolean;
  };
  onUpdate: (settings: any) => void;
}

export function NotificationSettings({ settings, onUpdate }: NotificationSettingsProps) {
  const handleToggle = (key: string) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const ToggleRow = ({ 
    title, 
    description, 
    enabled, 
    onToggle 
  }: { 
    title: string; 
    description?: string; 
    enabled: boolean; 
    onToggle: () => void;
  }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <div>
        <p className="text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
      </label>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-500 mb-2 px-4">Notifications</h2>
      <Card padding={false}>
        <ToggleRow
          title="Push Notifications"
          description="Get notified about important updates"
          enabled={settings.pushNotifications}
          onToggle={() => handleToggle('pushNotifications')}
        />
        <ToggleRow
          title="Email Notifications"
          description="Receive weekly spending summaries"
          enabled={settings.emailNotifications}
          onToggle={() => handleToggle('emailNotifications')}
        />
        <ToggleRow
          title="Budget Alerts"
          description="Get warned when approaching budget limits"
          enabled={settings.budgetAlerts}
          onToggle={() => handleToggle('budgetAlerts')}
        />
        <ToggleRow
          title="Weekly Reports"
          description="Receive detailed spending reports"
          enabled={settings.weeklyReports}
          onToggle={() => handleToggle('weeklyReports')}
        />
      </Card>
    </div>
  );
}
