import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface PreferencesSectionProps {
  preferences: {
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  onUpdate: (preferences: any) => void;
}

export function PreferencesSection({ preferences, onUpdate }: PreferencesSectionProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
  const timeFormats = ['12-hour', '24-hour'];

  const handleUpdate = (key: string, value: string) => {
    onUpdate({ ...preferences, [key]: value });
    setIsEditing(null);
  };

  const PreferenceRow = ({ 
    title, 
    value, 
    options, 
    onSelect 
  }: { 
    title: string; 
    value: string; 
    options: string[]; 
    onSelect: (value: string) => void;
  }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <p className="text-gray-900">{title}</p>
      <div className="flex items-center gap-2">
        {isEditing === title ? (
          <select
            value={value}
            onChange={(e) => onSelect(e.target.value)}
            className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <>
            <span className="text-gray-500">{value}</span>
            <button 
              onClick={() => setIsEditing(title)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-500 mb-2 px-4">Preferences</h2>
      <Card padding={false}>
        <PreferenceRow
          title="Currency"
          value={preferences.currency}
          options={currencies}
          onSelect={(value) => handleUpdate('currency', value)}
        />
        <PreferenceRow
          title="Date Format"
          value={preferences.dateFormat}
          options={dateFormats}
          onSelect={(value) => handleUpdate('dateFormat', value)}
        />
        <PreferenceRow
          title="Time Format"
          value={preferences.timeFormat}
          options={timeFormats}
          onSelect={(value) => handleUpdate('timeFormat', value)}
        />
      </Card>
    </div>
  );
}
