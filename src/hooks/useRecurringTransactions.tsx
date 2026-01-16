import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'weekly' | 'monthly';
  next_date: string;
  is_active: boolean;
  created_at: string;
  last_processed_at: string | null;
}

export interface RecurringTransactionInput {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'weekly' | 'monthly';
  next_date: string;
}

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecurringTransactions = useCallback(async () => {
    if (!user) {
      setRecurringTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_date');

    if (error) {
      toast({
        title: 'Error fetching recurring transactions',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setRecurringTransactions(data as RecurringTransaction[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const addRecurringTransaction = async (transaction: RecurringTransactionInput) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        ...transaction,
        user_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error adding recurring transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setRecurringTransactions(prev => [...prev, data as RecurringTransaction]);
    toast({
      title: 'Recurring transaction added',
      description: `${transaction.title} will repeat ${transaction.frequency}.`
    });
    return { error: null };
  };

  const updateRecurringTransaction = async (id: string, transaction: Partial<RecurringTransactionInput & { is_active: boolean }>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(transaction)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating recurring transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setRecurringTransactions(prev => 
      prev.map(t => t.id === id ? (data as RecurringTransaction) : t)
    );
    toast({
      title: 'Recurring transaction updated',
      description: 'Your recurring transaction has been updated.'
    });
    return { error: null };
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting recurring transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: 'Recurring transaction deleted',
      description: 'Your recurring transaction has been deleted.'
    });
    return { error: null };
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateRecurringTransaction(id, { is_active: isActive });
  };

  // Process due recurring transactions (creates actual transactions)
  const processDueTransactions = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const dueTransactions = recurringTransactions.filter(
      t => t.is_active && t.next_date <= today
    );

    for (const recurring of dueTransactions) {
      // Create the actual transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          title: recurring.title,
          amount: recurring.amount,
          type: recurring.type,
          category: recurring.category,
          date: recurring.next_date
        });

      if (insertError) {
        console.error('Error creating transaction from recurring:', insertError);
        continue;
      }

      // Calculate next date
      const nextDate = new Date(recurring.next_date);
      if (recurring.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      // Update the recurring transaction
      await supabase
        .from('recurring_transactions')
        .update({
          next_date: nextDate.toISOString().split('T')[0],
          last_processed_at: new Date().toISOString()
        })
        .eq('id', recurring.id)
        .eq('user_id', user.id);
    }

    if (dueTransactions.length > 0) {
      toast({
        title: 'Recurring transactions processed',
        description: `Created ${dueTransactions.length} transaction(s) from recurring entries.`
      });
      fetchRecurringTransactions();
    }
  };

  return {
    recurringTransactions,
    loading,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleActive,
    processDueTransactions,
    refetch: fetchRecurringTransactions
  };
};
