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

const GUEST_STORAGE_KEY = 'expense-tracker-guest-transactions';

const getGuestTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveGuestTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(transactions));
};

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !user;

  const fetchTransactions = useCallback(async () => {
    if (isGuest) {
      setTransactions(getGuestTransactions());
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
  }, [user, isGuest]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: TransactionInput) => {
    if (isGuest) {
      const newTransaction: Transaction = {
        ...transaction,
        id: crypto.randomUUID(),
        user_id: 'guest',
        created_at: new Date().toISOString()
      };
      const updated = [newTransaction, ...transactions];
      setTransactions(updated);
      saveGuestTransactions(updated);
      toast({
        title: 'Transaction added',
        description: `${transaction.title} has been added (Guest Mode).`
      });
      return { error: null };
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user!.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error adding transaction', description: error.message, variant: 'destructive' });
      return { error };
    }

    setTransactions(prev => [data as Transaction, ...prev]);
    toast({ title: 'Transaction added', description: `${transaction.title} has been added successfully.` });
    return { error: null };
  };

  const updateTransaction = async (id: string, transaction: Partial<TransactionInput>) => {
    if (isGuest) {
      const updated = transactions.map(t => t.id === id ? { ...t, ...transaction } : t);
      setTransactions(updated);
      saveGuestTransactions(updated);
      toast({ title: 'Transaction updated' });
      return { error: null };
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error updating transaction', description: error.message, variant: 'destructive' });
      return { error };
    }

    setTransactions(prev => prev.map(t => t.id === id ? (data as Transaction) : t));
    toast({ title: 'Transaction updated' });
    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    if (isGuest) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      saveGuestTransactions(updated);
      toast({ title: 'Transaction deleted' });
      return { error: null };
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);

    if (error) {
      toast({ title: 'Error deleting transaction', description: error.message, variant: 'destructive' });
      return { error };
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Transaction deleted' });
    return { error: null };
  };

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions, totals, balance };
};
