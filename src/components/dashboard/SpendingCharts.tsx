import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction } from '@/hooks/useTransactions';

interface SpendingChartsProps {
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

export const SpendingCharts = ({ transactions }: SpendingChartsProps) => {
  const expenseByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[month]) {
        monthMap[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthMap[month].income += Number(t.amount);
      } else {
        monthMap[month].expense += Number(t.amount);
      }
    });

    return Object.entries(monthMap)
      .map(([month, data]) => ({ month, ...data }))
      .reverse()
      .slice(-6);
  }, [transactions]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="glass card-shadow animate-fade-up" style={{ animationDelay: '0.5s' }}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Spending Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-0">
            {expenseByCategory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {expenseByCategory.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expense data to display</p>
            )}
          </TabsContent>

          <TabsContent value="income" className="mt-0">
            {incomeByCategory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {incomeByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {incomeByCategory.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No income data to display</p>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {monthlyData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(142, 70%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data to display</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
