// pages/api/categories.ts - Category management
import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../lib/auth-middleware';

async function categoriesHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { supabase } = req;
  const method = req.method ?? 'GET';
  const household_id = req.query.household_id ? String(req.query.household_id) : '';
  const id = req.query.id ? String(req.query.id) : '';

  if (!household_id && method !== 'PUT' && method !== 'DELETE') {
    return res.status(400).json({ error: 'household_id is required' });
  }

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', household_id)
        .order('position');

      if (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      return res.status(200).json({ data: data || [] });
    }

    if (method === 'POST') {
      const { name, kind, icon = 'folder', color = '#6B7280', position } = req.body;

      if (!name || !kind) {
        return res.status(400).json({ error: 'name and kind are required' });
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          household_id,
          name,
          kind,
          icon,
          color,
          position: position || 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ error: 'Failed to create category' });
      }

      return res.status(201).json({ data });
    }

    if (method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required for updates' });
      }

      const { name, icon, color, position } = req.body;
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (position !== undefined) updateData.position = position;

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ error: 'Failed to update category' });
      }

      return res.status(200).json({ data });
    }

    if (method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required for deletion' });
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ error: 'Failed to delete category' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(categoriesHandler);