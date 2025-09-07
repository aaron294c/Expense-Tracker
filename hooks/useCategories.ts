// hooks/useCategories.ts
import { useState, useEffect, useCallback } from 'react';
import type { API, Hooks, Category, CategoryKind } from '@/types/app.contracts';

export function useCategories(householdId: string | null): Hooks.UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!householdId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ household_id: householdId });
      const response = await fetch(`/api/categories?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch categories');
      }

      const result: API.CategoriesResponse = await response.json();
      setCategories(result.data);

    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  const createCategory = useCallback(async (
    data: API.CreateCategoryRequest
  ): Promise<Category | null> => {
    if (!householdId) return null;

    try {
      setError(null);

      const params = new URLSearchParams({ household_id: householdId });
      const response = await fetch(`/api/categories?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      const result = await response.json();
      const newCategory = result.data;

      // Add to the list in the correct position
      setCategories(prev => {
        const updated = [...prev, newCategory];
        return updated.sort((a, b) => {
          if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
          if (a.position !== b.position) return a.position - b.position;
          return a.name.localeCompare(b.name);
        });
      });
      
      return newCategory;

    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
      return null;
    }
  }, [householdId]);

  const updateCategory = useCallback(async (
    id: string, 
    data: API.UpdateCategoryRequest
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      const result = await response.json();
      const updatedCategory = result.data;

      // Update in the list
      setCategories(prev => 
        prev.map(category => 
          category.id === id ? { ...category, ...updatedCategory } : category
        ).sort((a, b) => {
          if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
          if (a.position !== b.position) return a.position - b.position;
          return a.name.localeCompare(b.name);
        })
      );
      
      return true;

    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Remove from the list
      setCategories(prev => prev.filter(category => category.id !== id));
      
      return true;

    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    }
  }, []);

  const getCategoriesByKind = useCallback((kind: CategoryKind): Category[] => {
    return categories.filter(category => category.kind === kind);
  }, [categories]);

  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByKind
  };
}