import { useState } from 'react';
import { Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface BudgetSettingsProps {
  monthlyLimit: number;
  alertThreshold: number;
  currentExpense: number;
  onSave: (budget: { monthlyLimit: number; alertThreshold: number }) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const BudgetSettings = ({ monthlyLimit, alertThreshold, currentExpense, onSave }: BudgetSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(monthlyLimit.toString());
  const [threshold, setThreshold] = useState((alertThreshold * 100).toString());

  const handleSave = () => {
    onSave({
      monthlyLimit: parseFloat(limit) || 0,
      alertThreshold: (parseFloat(threshold) || 80) / 100
    });
    setOpen(false);
  };

  const percentage = monthlyLimit > 0 ? (currentExpense / monthlyLimit) * 100 : 0;
  const remaining = monthlyLimit - currentExpense;

  const getStatusIcon = () => {
    if (percentage >= 100) return <XCircle className="w-5 h-5 text-expense" />;
    if (percentage >= alertThreshold * 100) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-income" />;
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-[hsl(var(--expense))]';
    if (percentage >= alertThreshold * 100) return 'bg-yellow-500';
    return 'bg-[hsl(var(--income))]';
  };

  if (monthlyLimit <= 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Set Budget
          </Button>
        </DialogTrigger>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Monthly Budget Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Monthly Spending Limit ($)</Label>
              <Input
                id="limit"
                type="number"
                min="0"
                step="100"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                placeholder="e.g., 2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Alert Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="50"
                max="100"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                placeholder="e.g., 80"
              />
              <p className="text-xs text-muted-foreground">
                You'll receive a warning when spending reaches this percentage
              </p>
            </div>
            <Button onClick={handleSave} className="w-full gradient-primary">
              Save Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="glass card-shadow animate-fade-up">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Monthly Budget</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle>Monthly Budget Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">Monthly Spending Limit ($)</Label>
                  <Input
                    id="limit"
                    type="number"
                    min="0"
                    step="100"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Alert Threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="50"
                    max="100"
                    value={threshold}
                    onChange={e => setThreshold(e.target.value)}
                  />
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary">
                  Save Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {formatCurrency(currentExpense)} spent
            </span>
            <span className={remaining >= 0 ? 'text-income' : 'text-expense'}>
              {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
