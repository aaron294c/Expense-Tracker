import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  KeyIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface SecuritySettingsProps {
  settings: {
    faceId: boolean;
    touchId: boolean;
    autoLock: boolean;
  };
  onUpdate: (settings: any) => void;
}

export function SecuritySettings({ settings, onUpdate }: SecuritySettingsProps) {
  const handleToggle = (key: string) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-500 mb-2 px-4">Security</h2>
        <Card padding={false}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-gray-900">Enable Face ID</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.faceId}
                onChange={() => handleToggle('faceId')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <KeyIcon className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-gray-900">Auto Lock</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoLock}
                onChange={() => handleToggle('autoLock')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-500 mb-2 px-4">Account</h3>
        <Card>
          <Button variant="secondary" className="w-full mb-3">
            Change Password
          </Button>
          <Button variant="secondary" className="w-full mb-3">
            Export Data
          </Button>
          <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50">
            Delete Account
          </Button>
        </Card>
      </div>
    </div>
  );
}
