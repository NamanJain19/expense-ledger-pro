import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudget } from '@/hooks/useBudget';
import { Header } from '@/components/dashboard/Header';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { TransactionForm } from '@/components/dashboard/TransactionForm';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { TransactionFilters } from '@/components/dashboard/TransactionFilters';
import { BudgetSettings } from '@/components/dashboard/BudgetSettings';
import { SpendingCharts } from '@/components/dashboard/SpendingCharts';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totals,
    balance
  } = useTransactions();

  const { budget, setBudget, checkBudgetStatus } = useBudget();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(query) && 
            !t.category.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Date range filter
      if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) {
        return false;
      }
      if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) {
        return false;
      }

      // Category filter
      if (categoryFilter && categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      // Type filter
      if (typeFilter && typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, dateRange, categoryFilter, typeFilter]);

  // Current month expense for budget
  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  // Budget alert
  useEffect(() => {
    const status = checkBudgetStatus(currentMonthExpense);
    if (status?.status === 'exceeded') {
      toast({
        title: '⚠️ Budget Exceeded!',
        description: `You've spent ${Math.round(status.percentage * 100)}% of your monthly budget.`,
        variant: 'destructive'
      });
    } else if (status?.status === 'warning') {
      toast({
        title: '⚡ Budget Alert',
        description: status.message
      });
    }
  }, [currentMonthExpense, checkBudgetStatus]);

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setCategoryFilter('');
    setTypeFilter('');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground">Track your income and expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton transactions={filteredTransactions} />
              <TransactionForm onSubmit={addTransaction} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Balance Cards */}
            <BalanceCards
              balance={balance}
              income={totals.income}
              expense={totals.expense}
            />

            {/* Budget Settings */}
            <BudgetSettings
              monthlyLimit={budget.monthlyLimit}
              alertThreshold={budget.alertThreshold}
              currentExpense={currentMonthExpense}
              onSave={setBudget}
            />

            {/* Spending Charts */}
            <SpendingCharts transactions={transactions} />

            {/* Filters */}
            <TransactionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              onClearFilters={clearFilters}
            />

            {/* Transaction List */}
            <TransactionList
              transactions={filteredTransactions}
              loading={transactionsLoading}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
