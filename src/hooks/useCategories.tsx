import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
}

export interface CategoryInput {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

// Default categories
const defaultIncomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'];
const defaultExpenseCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      toast({
        title: 'Error fetching categories',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category: CategoryInput) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...category,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error adding category',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setCategories(prev => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    toast({
      title: 'Category added',
      description: `${category.name} has been added.`
    });
    return { error: null };
  };

  const updateCategory = async (id: string, category: Partial<CategoryInput>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating category',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setCategories(prev => 
      prev.map(c => c.id === id ? (data as Category) : c)
    );
    toast({
      title: 'Category updated',
      description: 'Your category has been updated.'
    });
    return { error: null };
  };

  const deleteCategory = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting category',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    toast({
      title: 'Category deleted',
      description: 'Your category has been deleted.'
    });
    return { error: null };
  };

  // Combine custom categories with defaults
  const getCategoriesForType = useCallback((type: 'income' | 'expense') => {
    const customCats = categories.filter(c => c.type === type).map(c => c.name);
    const defaults = type === 'income' ? defaultIncomeCategories : defaultExpenseCategories;
    return [...new Set([...customCats, ...defaults])];
  }, [categories]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesForType,
    refetch: fetchCategories
  };
};
