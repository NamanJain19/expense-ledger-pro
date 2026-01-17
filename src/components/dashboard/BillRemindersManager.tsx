import { useState } from 'react';
import { useBillReminders, BillReminderInput } from '@/hooks/useBillReminders';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Plus, Trash2, Calendar, Send, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const BILL_CATEGORIES = [
  'Electricity',
  'Water',
  'Internet',
  'Phone',
  'Rent',
  'Insurance',
  'Subscription',
  'Loan',
  'Credit Card',
  'Other'
];

export const BillRemindersManager = () => {
  const { reminders, loading, addReminder, updateReminder, deleteReminder, sendNotification, upcomingReminders } = useBillReminders();
  const { formatCurrency } = useUserPreferences();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BillReminderInput>({
    title: '',
    amount: 0,
    due_date: '',
    frequency: 'monthly',
    category: 'Other',
    notify_days_before: 3
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0 || !formData.due_date) return;

    await addReminder(formData);
    setFormData({
      title: '',
      amount: 0,
      due_date: '',
      frequency: 'monthly',
      category: 'Other',
      notify_days_before: 3
    });
    setDialogOpen(false);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return differenceInDays(due, today);
  };

  const getDueStatus = (daysUntil: number) => {
    if (daysUntil < 0) return { label: 'Overdue', variant: 'destructive' as const };
    if (daysUntil === 0) return { label: 'Due Today', variant: 'destructive' as const };
    if (daysUntil <= 3) return { label: `${daysUntil} days`, variant: 'secondary' as const };
    return { label: `${daysUntil} days`, variant: 'outline' as const };
  };

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
          <Bell className="w-5 h-5 text-primary" />
          Bill Reminders
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bill Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Bill Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Electricity Bill"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notify_days">Notify Before (days)</Label>
                <Input
                  id="notify_days"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.notify_days_before || 3}
                  onChange={(e) => setFormData({ ...formData, notify_days_before: parseInt(e.target.value) || 3 })}
                />
              </div>
              <Button type="submit" className="w-full">Add Reminder</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingReminders.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium">
              {upcomingReminders.length} bill{upcomingReminders.length > 1 ? 's' : ''} due this week
            </span>
          </div>
        )}

        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No bill reminders yet</p>
            <p className="text-sm">Add your first bill to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {reminders.map((reminder) => {
              const daysUntil = getDaysUntilDue(reminder.due_date);
              const status = getDueStatus(daysUntil);

              return (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-lg border ${reminder.is_active ? 'bg-secondary/30' : 'bg-muted/30 opacity-60'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{reminder.title}</h4>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(reminder.amount)}
                        </span>
                        <Badge variant="outline">{reminder.category}</Badge>
                        <Badge variant="outline">{reminder.frequency}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.is_active}
                        onCheckedChange={(checked) => updateReminder(reminder.id, { is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => sendNotification(reminder)}
                        title="Send reminder now"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
