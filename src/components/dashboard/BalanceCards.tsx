import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BalanceCardsProps {
  balance: number;
  income: number;
  expense: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const BalanceCards = ({ balance, income, expense }: BalanceCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Balance Card */}
      <Card className="glass card-shadow overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card className="glass card-shadow overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-3xl font-bold mt-1 text-income">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-income-light flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-income" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Card */}
      <Card className="glass card-shadow overflow-hidden animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold mt-1 text-expense">
                {formatCurrency(expense)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-expense-light flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-expense" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
