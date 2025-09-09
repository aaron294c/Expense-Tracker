// hooks/useHousehold.ts - Fixed version
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseBrowser';
import { useAuth } from '../contexts/AuthContext';

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

      // Get user's household memberships with household details
      const { data: memberships, error: membershipError } = await supabase
        .from('household_members')
        .select(`
          *,
          households (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (membershipError) {
        throw membershipError;
      }

      setUserMemberships(memberships || []);

      // Extract households from memberships
      const householdList = (memberships || [])
        .map(m => m.households)
        .filter(Boolean) as Household[];

      setHouseholds(householdList);

      // Set current household to first one if not already set
      if (!currentHousehold && householdList.length > 0) {
        const savedHouseholdId = localStorage.getItem('currentHouseholdId');
        const savedHousehold = savedHouseholdId 
          ? householdList.find(h => h.id === savedHouseholdId) 
          : null;
        
        setCurrentHousehold(savedHousehold || householdList[0]);
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