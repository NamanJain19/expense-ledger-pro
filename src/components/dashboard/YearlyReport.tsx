import { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, PiggyBank, Target, Calendar } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface YearlyReportProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(142, 70%, 50%)',
  'hsl(0, 72%, 55%)',
  'hsl(200, 80%, 50%)',
  'hsl(45, 90%, 50%)',
  'hsl(280, 70%, 55%)',
  'hsl(30, 80%, 50%)',
  'hsl(170, 70%, 45%)',
  'hsl(320, 70%, 55%)',
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const YearlyReport = ({ transactions }: YearlyReportProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear());
    });
    // Add current year if not present
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => 
      new Date(t.date).getFullYear() === parseInt(selectedYear)
    );
  }, [transactions, selectedYear]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((month, index) => {
      const monthTx = yearTransactions.filter(t => 
        new Date(t.date).getMonth() === index
      );
      
      const income = monthTx
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = monthTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return { month, income, expense, savings: income - expense };
    });
  }, [yearTransactions]);

  // Summary stats
  const summary = useMemo(() => {
    const totalIncome = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Calculate average monthly
    const monthsWithData = monthlyData.filter(m => m.income > 0 || m.expense > 0).length || 1;
    const avgMonthlyIncome = totalIncome / monthsWithData;
    const avgMonthlyExpense = totalExpense / monthsWithData;

    return {
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
      avgMonthlyIncome,
      avgMonthlyExpense,
      transactionCount: yearTransactions.length
    };
  }, [yearTransactions, monthlyData]);

  // Top expense categories
  const topExpenseCategories = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    yearTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [yearTransactions]);

  // Top income sources
  const topIncomeSources = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    yearTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [yearTransactions]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="glass card-shadow animate-fade-up" style={{ animationDelay: '0.6s' }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Yearly Financial Report
        </CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-income-light">
            <div className="flex items-center gap-2 text-income mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-income">{formatCurrency(summary.totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(summary.avgMonthlyIncome)}/mo
            </p>
          </div>

          <div className="p-4 rounded-xl bg-expense-light">
            <div className="flex items-center gap-2 text-expense mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-expense">{formatCurrency(summary.totalExpense)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(summary.avgMonthlyExpense)}/mo
            </p>
          </div>

          <div className={`p-4 rounded-xl ${summary.savings >= 0 ? 'bg-income-light' : 'bg-expense-light'}`}>
            <div className={`flex items-center gap-2 ${summary.savings >= 0 ? 'text-income' : 'text-expense'} mb-1`}>
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm font-medium">Net Savings</span>
            </div>
            <p className={`text-2xl font-bold ${summary.savings >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(summary.savings)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Savings Rate</span>
            </div>
            <p className={`text-2xl font-bold ${summary.savingsRate >= 0 ? 'text-income' : 'text-expense'}`}>
              {summary.savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.transactionCount} transactions
            </p>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div>
          <h3 className="text-sm font-medium mb-4">Monthly Income vs Expenses</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="hsl(142, 70%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Savings Trend */}
        <div>
          <h3 className="text-sm font-medium mb-4">Monthly Savings Trend</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Savings"
                  stroke="hsl(200, 80%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(200, 80%, 50%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Expense Categories */}
          <div>
            <h3 className="text-sm font-medium mb-4">Top Expense Categories</h3>
            {topExpenseCategories.length > 0 ? (
              <div className="space-y-2">
                {topExpenseCategories.map((cat, index) => {
                  const percentage = summary.totalExpense > 0 
                    ? (cat.value / summary.totalExpense) * 100 
                    : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No expense data</p>
            )}
          </div>

          {/* Top Income Sources */}
          <div>
            <h3 className="text-sm font-medium mb-4">Top Income Sources</h3>
            {topIncomeSources.length > 0 ? (
              <div className="space-y-2">
                {topIncomeSources.map((cat, index) => {
                  const percentage = summary.totalIncome > 0 
                    ? (cat.value / summary.totalIncome) * 100 
                    : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No income data</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
