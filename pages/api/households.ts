// pages/api/households.ts - Fixed households endpoint
import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../lib/auth-middleware';

async function householdsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user, supabase } = req;

  try {
    console.log(`[${req.method}] /api/households - User: ${user.id} (${user.email})`);

    if (req.method === 'GET') {
      // Get user's households
      const { data: memberships, error } = await supabase
        .from('household_members')
        .select(`
          *,
          households (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching households:', error);
        return res.status(500).json({ error: 'Failed to fetch households', details: error.message });
      }

      const households = (memberships || [])
        .map(m => ({
          ...m.households,
          role: m.role,
          joined_at: m.joined_at
        }))
        .filter(Boolean);

      console.log(`Found ${households.length} households for user ${user.id}`);
      return res.status(200).json({ data: households });
    }

    if (req.method === 'POST') {
      const { name, base_currency = 'USD' } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Household name is required' });
      }

      console.log(`Creating new household for user: ${user.id}`);

      // Start a transaction-like operation
      try {
        // Create the household
        const { data: household, error: householdError } = await supabase
          .from('households')
          .insert({
            name: name.trim(),
            base_currency
          })
          .select()
          .single();

        if (householdError) {
          console.error('Error creating household:', householdError);
          return res.status(500).json({ 
            error: 'Failed to create household', 
            details: householdError.message 
          });
        }

        console.log(`Household created with ID: ${household.id}`);

        // Add the user as the owner
        const { data: membership, error: memberError } = await supabase
          .from('household_members')
          .insert({
            household_id: household.id,
            user_id: user.id,
            role: 'owner'
          })
          .select()
          .single();

        if (memberError) {
          console.error('Error adding user to household:', memberError);
          
          // Try to clean up the household if adding member fails
          await supabase.from('households').delete().eq('id', household.id);
          
          return res.status(500).json({ 
            error: 'Failed to create household membership', 
            details: memberError.message 
          });
        }

        console.log(`User ${user.id} added as owner to household ${household.id}`);

        // Return the household with membership info
        const householdWithMembership = {
          ...household,
          role: membership.role,
          joined_at: membership.joined_at
        };

        return res.status(201).json({ data: householdWithMembership });

      } catch (error) {
        console.error('Transaction error in household creation:', error);
        return res.status(500).json({ 
          error: 'Failed to create household', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error in households handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(householdsHandler);