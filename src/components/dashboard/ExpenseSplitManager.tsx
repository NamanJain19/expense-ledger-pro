import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Receipt, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SplitPerson {
  id: string;
  name: string;
}

interface SplitExpense {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  participants: string[];
  splitAmounts: Record<string, number>;
  date: string;
}

const STORAGE_KEY = 'expense-tracker-splits';

const loadSplits = (): SplitExpense[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveSplits = (splits: SplitExpense[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
};

const FRIENDS_KEY = 'expense-tracker-friends';
const loadFriends = (): SplitPerson[] => {
  try { return JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]'); } catch { return []; }
};
const saveFriends = (f: SplitPerson[]) => localStorage.setItem(FRIENDS_KEY, JSON.stringify(f));

export const ExpenseSplitManager = () => {
  const [splits, setSplits] = useState<SplitExpense[]>(loadSplits);
  const [friends, setFriends] = useState<SplitPerson[]>(loadFriends);
  const [newFriend, setNewFriend] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const addFriend = () => {
    if (!newFriend.trim()) return;
    if (friends.some(f => f.name.toLowerCase() === newFriend.trim().toLowerCase())) {
      toast({ title: 'Friend already exists', variant: 'destructive' });
      return;
    }
    const updated = [...friends, { id: crypto.randomUUID(), name: newFriend.trim() }];
    setFriends(updated);
    saveFriends(updated);
    setNewFriend('');
  };

  const removeFriend = (id: string) => {
    const updated = friends.filter(f => f.id !== id);
    setFriends(updated);
    saveFriends(updated);
  };

  const toggleParticipant = (name: string) => {
    setSelectedParticipants(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const addSplit = () => {
    if (!title.trim() || !amount || !paidBy || selectedParticipants.length === 0) {
      toast({ title: 'Please fill all fields and select participants', variant: 'destructive' });
      return;
    }
    const total = parseFloat(amount);
    const perPerson = total / selectedParticipants.length;
    const splitAmounts: Record<string, number> = {};
    selectedParticipants.forEach(name => {
      splitAmounts[name] = perPerson;
    });

    const newSplit: SplitExpense = {
      id: crypto.randomUUID(),
      title: title.trim(),
      totalAmount: total,
      paidBy,
      participants: selectedParticipants,
      splitAmounts,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [newSplit, ...splits];
    setSplits(updated);
    saveSplits(updated);
    setTitle('');
    setAmount('');
    setPaidBy('');
    setSelectedParticipants([]);
    setShowForm(false);
    toast({ title: 'Expense split added!' });
  };

  const deleteSplit = (id: string) => {
    const updated = splits.filter(s => s.id !== id);
    setSplits(updated);
    saveSplits(updated);
  };

  // Calculate balances: who owes whom
  const balances = (() => {
    const owes: Record<string, Record<string, number>> = {};
    splits.forEach(split => {
      split.participants.forEach(person => {
        if (person !== split.paidBy) {
          if (!owes[person]) owes[person] = {};
          owes[person][split.paidBy] = (owes[person][split.paidBy] || 0) + split.splitAmounts[person];
        }
      });
    });
    return owes;
  })();

  const allNames = ['You', ...friends.map(f => f.name)];

  return (
    <div className="space-y-6">
      {/* Friends Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Friends</CardTitle>
          <CardDescription>Add friends to split expenses with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Friend's name" value={newFriend} onChange={e => setNewFriend(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFriend()} />
            <Button onClick={addFriend} size="sm"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {friends.map(f => (
              <Badge key={f.id} variant="secondary" className="gap-1 py-1 px-3">
                {f.name}
                <button onClick={() => removeFriend(f.id)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {friends.length === 0 && <p className="text-sm text-muted-foreground">No friends added yet.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Add Split */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" /> Split Expenses</CardTitle>
            <CardDescription>Divide bills and track who owes what</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" variant={showForm ? 'secondary' : 'default'}>
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> New Split</>}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="space-y-4 border border-border rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Description</Label>
                  <Input placeholder="e.g. Dinner" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Total Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Paid By</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allNames.map(name => (
                    <Badge key={name} variant={paidBy === name ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setPaidBy(name)}>
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Split Between</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allNames.map(name => (
                    <Badge key={name} variant={selectedParticipants.includes(name) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleParticipant(name)}>
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={addSplit} className="w-full">Split Expense</Button>
            </div>
          )}

          {/* Balance Summary */}
          {Object.keys(balances).length > 0 && (
            <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-2">💰 Who Owes What</h4>
              {Object.entries(balances).map(([person, owedTo]) =>
                Object.entries(owedTo).map(([to, amt]) => (
                  <p key={`${person}-${to}`} className="text-sm py-1">
                    <span className="font-medium">{person}</span> owes <span className="font-medium">{to}</span>: <span className="text-primary font-bold">₹{amt.toFixed(2)}</span>
                  </p>
                ))
              )}
            </div>
          )}

          {/* Split History */}
          <div className="space-y-3">
            {splits.map(split => (
              <div key={split.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{split.title}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{split.totalAmount.toFixed(2)} paid by {split.paidBy} · {split.date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Split: {split.participants.join(', ')} (₹{(split.totalAmount / split.participants.length).toFixed(2)} each)
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteSplit(split.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {splits.length === 0 && <p className="text-center text-muted-foreground py-6">No split expenses yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
