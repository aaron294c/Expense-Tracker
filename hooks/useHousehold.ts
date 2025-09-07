// hooks/useHousehold.ts
import { useState, useEffect } from 'react';
import { supabase } from '../Lib/supabaseBrowser';

// Define types inline since we might not have the full type system set up yet
type Household = {
  id: string;
  name: string;
  base_currency: string;
  created_at: string;
  updated_at: string;
};

type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
  households?: Household;
};

interface UseHouseholdReturn {
  households: Household[];
  currentHousehold: Household | null;
  userMemberships: HouseholdMember[];
  isLoading: boolean;
  error: string | null;
  setCurrentHousehold: (household: Household | null) => void;
  refetch: () => Promise<void>;
}

export function useHousehold(): UseHouseholdReturn {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [userMemberships, setUserMemberships] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholds = async () => {
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
        setCurrentHousehold(householdList[0]);
      }

    } catch (err) {
      console.error('Error fetching households:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch households');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  // Subscribe to real-time updates for household memberships
  useEffect(() => {
    const subscription = supabase
      .channel('household_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members'
        },
        () => {
          fetchHouseholds();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'households'
        },
        () => {
          fetchHouseholds();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    households,
    currentHousehold,
    userMemberships,
    isLoading,
    error,
    setCurrentHousehold,
    refetch: fetchHouseholds
  };
}