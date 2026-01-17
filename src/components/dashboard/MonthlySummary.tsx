import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Transaction } from '@/hooks/useTransactions';
import { 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';

interface MonthlySummaryProps {
  transactions: Transaction[];
}

export const MonthlySummary = ({ transactions }: MonthlySummaryProps) => {
  const { formatCurrency, preferences } = useUserPreferences();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category breakdown
    const categoryExpenses: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + Number(t.amount);
      });

    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Compare with previous month
    const prevMonthStart = startOfMonth(subMonths(currentMonth, 1));
    const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
    
    const prevMonthExpense = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && isWithinInterval(date, { start: prevMonthStart, end: prevMonthEnd });
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange = prevMonthExpense > 0 
      ? ((expense - prevMonthExpense) / prevMonthExpense) * 100 
      : 0;

    return {
      income,
      expense,
      savings,
      savingsRate,
      topCategories,
      expenseChange,
      transactionCount: monthTransactions.length
    };
  }, [transactions, currentMonth]);

  const budgetUsage = preferences.monthly_budget > 0 
    ? (monthData.expense / preferences.monthly_budget) * 100 
    : 0;

  return (
    <Card className="glass card-shadow animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Monthly Summary
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-32 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            disabled={currentMonth >= new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-income mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Income</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(monthData.income)}</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-expense mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Expenses</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(monthData.expense)}</p>
            {monthData.expenseChange !== 0 && (
              <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${monthData.expenseChange > 0 ? 'text-expense' : 'text-income'}`}>
                {monthData.expenseChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(monthData.expenseChange).toFixed(1)}% vs last month
              </div>
            )}
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm">Savings</span>
            </div>
            <p className={`text-xl font-bold ${monthData.savings >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(monthData.savings)}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">Savings Rate</span>
            </div>
            <p className={`text-xl font-bold ${monthData.savingsRate >= 20 ? 'text-income' : monthData.savingsRate >= 0 ? 'text-foreground' : 'text-expense'}`}>
              {monthData.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Budget Progress */}
        {preferences.monthly_budget > 0 && (
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget Usage</span>
              <Badge variant={budgetUsage >= 100 ? 'destructive' : budgetUsage >= 80 ? 'secondary' : 'outline'}>
                {budgetUsage.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(monthData.expense)} spent</span>
              <span>Budget: {formatCurrency(preferences.monthly_budget)}</span>
            </div>
          </div>
        )}

        {/* Top Spending Categories */}
        {monthData.topCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Top Spending Categories</h4>
            <div className="space-y-2">
              {monthData.topCategories.map(([category, amount]) => {
                const percentage = monthData.expense > 0 ? (amount / monthData.expense) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category}</span>
                      <Badge variant="outline" className="text-xs">
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {monthData.transactionCount} transactions this month
        </div>
      </CardContent>
    </Card>
  );
};
