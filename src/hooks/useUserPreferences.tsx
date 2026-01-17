import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface UserPreferences {
  id?: string;
  currency: string;
  currency_symbol: string;
  monthly_budget: number;
  budget_alert_threshold: number;
  email_notifications: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'INR',
  currency_symbol: '₹',
  monthly_budget: 0,
  budget_alert_threshold: 0.8,
  email_notifications: true
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          currency: data.currency,
          currency_symbol: data.currency_symbol,
          monthly_budget: Number(data.monthly_budget),
          budget_alert_threshold: Number(data.budget_alert_threshold),
          email_notifications: data.email_notifications
        });
      } else {
        // Create default preferences for new user
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newData) {
          setPreferences({
            id: newData.id,
            currency: newData.currency,
            currency_symbol: newData.currency_symbol,
            monthly_budget: Number(newData.monthly_budget),
            budget_alert_threshold: Number(newData.budget_alert_threshold),
            email_notifications: newData.email_notifications
          });
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...updates }));
      toast({
        title: 'Preferences updated',
        description: 'Your settings have been saved successfully.'
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences.',
        variant: 'destructive'
      });
    }
  }, [user]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: preferences.currency,
      minimumFractionDigits: 2
    }).format(amount);
  }, [preferences.currency]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, loading, updatePreferences, formatCurrency }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
