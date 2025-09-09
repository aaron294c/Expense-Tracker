// components/debug/AuthDebug.tsx - Debug component to test auth
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedFetch } from '../../lib/api';
import { supabase } from '../../lib/supabaseBrowser';

export function AuthDebug() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results = [];

    try {
      // Test 1: Check current session
      results.push({
        test: 'Current Session',
        status: user ? 'PASS' : 'FAIL',
        data: { user: user?.email, id: user?.id }
      });

      // Test 2: Get fresh session
      const { data: { session }, error } = await supabase.auth.getSession();
      results.push({
        test: 'Fresh Session',
        status: session?.access_token ? 'PASS' : 'FAIL',
        data: { hasToken: !!session?.access_token, error: error?.message }
      });

      // Test 3: Test authenticated API call
      try {
        const householdsData = await authenticatedFetch('/api/households');
        results.push({
          test: 'Households API',
          status: 'PASS',
          data: { count: householdsData.data?.length || 0 }
        });
      } catch (error) {
        results.push({
          test: 'Households API',
          status: 'FAIL',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

      // Test 4: Test demo setup API
      try {
        const demoData = await authenticatedFetch('/api/setup/demo', { method: 'POST' });
        results.push({
          test: 'Demo Setup API',
          status: 'PASS',
          data: demoData
        });
      } catch (error) {
        results.push({
          test: 'Demo Setup API',
          status: 'FAIL',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

    } catch (error) {
      results.push({
        test: 'Test Runner',
        status: 'FAIL',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700">Current User Status</h3>
          <p className="text-sm text-gray-600">
            {user ? `✅ Signed in as ${user.email}` : '❌ Not signed in'}
          </p>
          {user && (
            <p className="text-xs text-gray-500">User ID: {user.id}</p>
          )}
        </div>

        <button
          onClick={runTests}
          disabled={isLoading || !user}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Authentication Tests'}
        </button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Test Results</h3>
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.test}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    result.status === 'PASS' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}