import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface BudgetState {
  monthlyLimit: number;
  alertThreshold: number;
}

const DEFAULT_BUDGET: BudgetState = {
  monthlyLimit: 0,
  alertThreshold: 0.8
};

export const useBudget = () => {
  const { user } = useAuth();
  const [budget, setBudgetState] = useState<BudgetState>(DEFAULT_BUDGET);

  const storageKey = user ? `expense-tracker-budget-${user.id}` : 'expense-tracker-budget-guest';

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setBudgetState(JSON.parse(stored));
      } catch {
        setBudgetState(DEFAULT_BUDGET);
      }
    }
  }, [storageKey]);

  const setBudget = useCallback((newBudget: Partial<BudgetState>) => {
    setBudgetState(prev => {
      const updated = { ...prev, ...newBudget };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const checkBudgetStatus = useCallback((currentExpense: number) => {
    if (budget.monthlyLimit <= 0) return null;
    const percentage = currentExpense / budget.monthlyLimit;
    if (percentage >= 1) return { status: 'exceeded' as const, percentage, message: 'Budget exceeded!' };
    if (percentage >= budget.alertThreshold) return { status: 'warning' as const, percentage, message: `${Math.round(percentage * 100)}% of budget used` };
    return { status: 'safe' as const, percentage, message: `${Math.round(percentage * 100)}% of budget used` };
  }, [budget]);

  return { budget, setBudget, checkBudgetStatus };
};
