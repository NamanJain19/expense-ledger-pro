import { useEffect, useState, useMemo } from 'react';
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
import { YearlyReport } from '@/components/dashboard/YearlyReport';
import { MonthlySummary } from '@/components/dashboard/MonthlySummary';
import { SavingsGoalsManager } from '@/components/dashboard/SavingsGoalsManager';
import { BillRemindersManager } from '@/components/dashboard/BillRemindersManager';
import { ExpenseSplitManager } from '@/components/dashboard/ExpenseSplitManager';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Loader2, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    transactions, loading: transactionsLoading,
    addTransaction, updateTransaction, deleteTransaction,
    totals, balance, refetch: refetchTransactions
  } = useTransactions();

  const { budget, setBudget, checkBudgetStatus } = useBudget();
  const { preferences } = useUserPreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) return false;
      }
      if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) return false;
      if (categoryFilter && categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (typeFilter && typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, dateRange, categoryFilter, typeFilter]);

  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  useEffect(() => {
    const status = checkBudgetStatus(currentMonthExpense);
    if (status?.status === 'exceeded') {
      toast({ title: '⚠️ Budget Exceeded!', description: `You've spent ${Math.round(status.percentage * 100)}% of your monthly budget.`, variant: 'destructive' });
    } else if (status?.status === 'warning') {
      toast({ title: '⚡ Budget Alert', description: status.message });
    }
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setCategoryFilter('');
    setTypeFilter('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {!user && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are using <strong>Guest Mode</strong>. Your data is stored locally.{' '}
                <Link to="/auth" className="text-primary underline font-medium">Sign in</Link> to save your data permanently.
              </AlertDescription>
            </Alert>
          )}

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

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="split">Split Bills</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <BalanceCards balance={balance} income={totals.income} expense={totals.expense} />
              <BudgetSettings monthlyLimit={budget.monthlyLimit} alertThreshold={budget.alertThreshold} currentExpense={currentMonthExpense} onSave={setBudget} />
              <SpendingCharts transactions={transactions} />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <TransactionFilters
                searchQuery={searchQuery} onSearchChange={setSearchQuery}
                dateRange={dateRange} onDateRangeChange={setDateRange}
                categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
                typeFilter={typeFilter} onTypeChange={setTypeFilter}
                onClearFilters={clearFilters}
              />
              <TransactionList transactions={filteredTransactions} loading={transactionsLoading} onUpdate={updateTransaction} onDelete={deleteTransaction} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <MonthlySummary transactions={transactions} />
              <YearlyReport transactions={transactions} />
            </TabsContent>

            <TabsContent value="split" className="space-y-6">
              <ExpenseSplitManager />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user && <SavingsGoalsManager />}
                {user && <BillRemindersManager />}
                {!user && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <p>Sign in to access Savings Goals and Bill Reminders.</p>
                    <Link to="/auth" className="text-primary underline mt-2 inline-block">Sign In</Link>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
