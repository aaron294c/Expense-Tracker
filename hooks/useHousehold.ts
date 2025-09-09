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