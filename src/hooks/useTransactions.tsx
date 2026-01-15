import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}

export interface TransactionInput {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching transactions',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: TransactionInput) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error adding transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setTransactions(prev => [data as Transaction, ...prev]);
    toast({
      title: 'Transaction added',
      description: `${transaction.title} has been added successfully.`
    });
    return { error: null };
  };

  const updateTransaction = async (id: string, transaction: Partial<TransactionInput>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setTransactions(prev => 
      prev.map(t => t.id === id ? (data as Transaction) : t)
    );
    toast({
      title: 'Transaction updated',
      description: 'Your transaction has been updated successfully.'
    });
    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: 'Transaction deleted',
      description: 'Your transaction has been deleted.'
    });
    return { error: null };
  };

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += Number(t.amount);
      } else {
        acc.expense += Number(t.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
    totals,
    balance
  };
};
