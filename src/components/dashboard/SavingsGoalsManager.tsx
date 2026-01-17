import { useState } from 'react';
import { useSavingsGoals, SavingsGoalInput } from '@/hooks/useSavingsGoals';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trash2, TrendingUp, Check, PiggyBank, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const GOAL_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const GOAL_ICONS = [
  'piggy-bank', 'home', 'car', 'plane', 'graduation-cap', 'heart', 'gift', 'briefcase'
];

export const SavingsGoalsManager = () => {
  const { goals, loading, addGoal, addToGoal, deleteGoal, totalSavings, totalTarget } = useSavingsGoals();
  const { formatCurrency } = useUserPreferences();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addAmountDialogOpen, setAddAmountDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState(0);
  const [formData, setFormData] = useState<SavingsGoalInput>({
    title: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    color: GOAL_COLORS[0],
    icon: GOAL_ICONS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.target_amount <= 0) return;

    await addGoal(formData);
    setFormData({
      title: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      color: GOAL_COLORS[0],
      icon: GOAL_ICONS[0]
    });
    setDialogOpen(false);
  };

  const handleAddAmount = async () => {
    if (!selectedGoalId || addAmount <= 0) return;
    await addToGoal(selectedGoalId, addAmount);
    setAddAmount(0);
    setSelectedGoalId(null);
    setAddAmountDialogOpen(false);
  };

  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <Card className="glass card-shadow">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass card-shadow animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Savings Goals
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>
              <div>
                <Label htmlFor="target_amount">Target Amount (₹)</Label>
                <Input
                  id="target_amount"
                  type="number"
                  min="1"
                  value={formData.target_amount || ''}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_amount">Current Savings (₹)</Label>
                <Input
                  id="current_amount"
                  type="number"
                  min="0"
                  value={formData.current_amount || ''}
                  onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="target_date">Target Date (Optional)</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date || ''}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {GOAL_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        {goals.length > 0 && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Savings Progress</span>
              <span className="text-sm font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(totalSavings)} saved</span>
              <span>Goal: {formatCurrency(totalTarget)}</span>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No savings goals yet</p>
            <p className="text-sm">Create your first goal to start saving</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border ${goal.is_completed ? 'bg-income-light border-income' : 'bg-secondary/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.is_completed && (
                        <Badge className="bg-income text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!goal.is_completed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setAddAmountDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Add
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-2 mb-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                    {goal.target_date && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  {!goal.is_completed && remaining > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(remaining)} remaining
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Amount Dialog */}
        <Dialog open={addAmountDialogOpen} onOpenChange={setAddAmountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Savings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add_amount">Amount (₹)</Label>
                <Input
                  id="add_amount"
                  type="number"
                  min="1"
                  value={addAmount || ''}
                  onChange={(e) => setAddAmount(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
              </div>
              <Button onClick={handleAddAmount} className="w-full">Add Amount</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
