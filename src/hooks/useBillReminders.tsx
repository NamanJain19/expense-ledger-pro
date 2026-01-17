import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  frequency: string;
  category: string;
  is_active: boolean;
  notify_days_before: number;
  last_notified_at?: string;
  created_at: string;
}

export interface BillReminderInput {
  title: string;
  amount: number;
  due_date: string;
  frequency: string;
  category: string;
  is_active?: boolean;
  notify_days_before?: number;
}

export const useBillReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching bill reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bill reminders.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = useCallback(async (reminder: BillReminderInput) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .insert({
          ...reminder,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setReminders(prev => [...prev, data].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ));
        toast({
          title: 'Bill reminder added',
          description: `${reminder.title} has been added.`
        });
      }
    } catch (error) {
      console.error('Error adding bill reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to add bill reminder.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const updateReminder = useCallback(async (id: string, updates: Partial<BillReminderInput>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bill_reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast({
        title: 'Reminder updated',
        description: 'Bill reminder has been updated.'
      });
    } catch (error) {
      console.error('Error updating bill reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bill reminder.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const deleteReminder = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bill_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Reminder deleted',
        description: 'Bill reminder has been removed.'
      });
    } catch (error) {
      console.error('Error deleting bill reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill reminder.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const sendNotification = useCallback(async (reminder: BillReminder) => {
    try {
      const { error } = await supabase.functions.invoke('send-bill-reminder', {
        body: { reminderId: reminder.id }
      });

      if (error) throw error;
      toast({
        title: 'Notification sent',
        description: `Reminder for ${reminder.title} has been sent.`
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive'
      });
    }
  }, []);

  // Get upcoming reminders (next 7 days)
  const upcomingReminders = reminders.filter(r => {
    if (!r.is_active) return false;
    const dueDate = new Date(r.due_date);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek;
  });

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    sendNotification,
    upcomingReminders,
    refetch: fetchReminders
  };
};
