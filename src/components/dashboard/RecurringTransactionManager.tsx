import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Repeat, Play, Pause, Loader2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RecurringTransaction, RecurringTransactionInput, useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useCategories } from '@/hooks/useCategories';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const RecurringTransactionManager = () => {
  const {
    recurringTransactions,
    loading,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleActive,
    processDueTransactions
  } = useRecurringTransactions();
  
  const { getCategoriesForType } = useCategories();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState<RecurringTransactionInput>({
    title: '',
    amount: 0,
    type: 'expense',
    category: '',
    frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getCategoriesForType(formData.type);

  // Process due transactions on mount
  useEffect(() => {
    processDueTransactions();
  }, []);

  const handleOpenAdd = () => {
    setEditing(null);
    setFormData({
      title: '',
      amount: 0,
      type: 'expense',
      category: '',
      frequency: 'monthly',
      next_date: new Date().toISOString().split('T')[0]
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (rt: RecurringTransaction) => {
    setEditing(rt);
    setFormData({
      title: rt.title,
      amount: rt.amount,
      type: rt.type,
      category: rt.category,
      frequency: rt.frequency,
      next_date: rt.next_date
    });
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || formData.amount <= 0 || !formData.category) return;
    
    setIsSubmitting(true);
    if (editing) {
      await updateRecurringTransaction(editing.id, formData);
    } else {
      await addRecurringTransaction(formData);
    }
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <>
      <Card className="glass card-shadow animate-fade-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Recurring Transactions
          </CardTitle>
          <Button size="sm" onClick={handleOpenAdd} className="gap-2 gradient-primary">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recurringTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Repeat className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recurring transactions yet</p>
              <p className="text-sm mt-1">Set up automatic weekly or monthly transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTransactions.map(rt => (
                <div
                  key={rt.id}
                  className={`flex items-center justify-between p-4 rounded-xl bg-secondary/50 transition-opacity ${
                    !rt.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rt.type === 'income' ? 'bg-income-light' : 'bg-expense-light'
                    }`}>
                      {rt.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-income" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-expense" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{rt.title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{rt.frequency}</span>
                        <span>•</span>
                        <span>{rt.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next: {formatDate(rt.next_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${
                      rt.type === 'income' ? 'text-income' : 'text-expense'
                    }`}>
                      {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount)}
                    </p>
                    <Switch
                      checked={rt.is_active}
                      onCheckedChange={(checked) => toggleActive(rt.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(rt)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{rt.title}"? This won't affect already created transactions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteRecurringTransaction(rt.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                className={`p-3 rounded-lg font-medium transition-all ${
                  formData.type === 'income'
                    ? 'gradient-income text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                className={`p-3 rounded-lg font-medium transition-all ${
                  formData.type === 'expense'
                    ? 'gradient-expense text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Expense
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rt-title">Title</Label>
              <Input
                id="rt-title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Monthly Rent"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rt-amount">Amount ($)</Label>
              <Input
                id="rt-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: 'weekly' | 'monthly') => 
                  setFormData(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rt-date">Start Date</Label>
              <Input
                id="rt-date"
                type="date"
                value={formData.next_date}
                onChange={e => setFormData(prev => ({ ...prev, next_date: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${formData.type === 'income' ? 'gradient-income' : 'gradient-expense'}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title.trim() || formData.amount <= 0 || !formData.category}
              >
                {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
