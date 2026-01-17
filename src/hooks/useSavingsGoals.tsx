import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  color: string;
  icon: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  title: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  color?: string;
  icon?: string;
}

export const useSavingsGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load savings goals.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(async (goal: SavingsGoalInput) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          ...goal,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setGoals(prev => [data, ...prev]);
        toast({
          title: 'Goal created',
          description: `${goal.title} has been added to your goals.`
        });
      }
    } catch (error) {
      console.error('Error adding savings goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add savings goal.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoalInput>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
      toast({
        title: 'Goal updated',
        description: 'Savings goal has been updated.'
      });
    } catch (error) {
      console.error('Error updating savings goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update savings goal.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    if (!user) return;

    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.target_amount;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === id ? { 
        ...g, 
        current_amount: newAmount,
        is_completed: isCompleted
      } : g));

      if (isCompleted) {
        toast({
          title: '🎉 Goal Completed!',
          description: `Congratulations! You've reached your ${goal.title} goal!`
        });
      } else {
        toast({
          title: 'Progress added',
          description: `Added ₹${amount.toLocaleString()} to ${goal.title}.`
        });
      }
    } catch (error) {
      console.error('Error updating savings goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update savings goal.',
        variant: 'destructive'
      });
    }
  }, [user, goals]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== id));
      toast({
        title: 'Goal deleted',
        description: 'Savings goal has been removed.'
      });
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete savings goal.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const totalSavings = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    addToGoal,
    deleteGoal,
    totalSavings,
    totalTarget,
    activeGoals,
    completedGoals,
    refetch: fetchGoals
  };
};
