import { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, DollarSign, Bell, AlertTriangle, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];

export const PreferencesSettings = () => {
  const { preferences, loading, updatePreferences } = useUserPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);

  // Sync local state with preferences when they change
  useState(() => {
    setLocalPrefs(preferences);
  });

  const handleSave = async () => {
    setSaving(true);
    await updatePreferences(localPrefs);
    setSaving(false);
  };

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code);
    if (currency) {
      setLocalPrefs({
        ...localPrefs,
        currency: currency.code,
        currency_symbol: currency.symbol
      });
    }
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
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Settings */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Currency
          </h3>
          <div>
            <Label htmlFor="currency">Display Currency</Label>
            <Select 
              value={localPrefs.currency} 
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Budget Settings */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Budget Alerts
          </h3>
          <div>
            <Label htmlFor="monthly_budget">Monthly Budget Limit ({localPrefs.currency_symbol})</Label>
            <Input
              id="monthly_budget"
              type="number"
              min="0"
              value={localPrefs.monthly_budget || ''}
              onChange={(e) => setLocalPrefs({ 
                ...localPrefs, 
                monthly_budget: parseFloat(e.target.value) || 0 
              })}
              placeholder="Enter monthly budget"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set to 0 to disable budget alerts
            </p>
          </div>
          <div>
            <Label>Alert Threshold: {Math.round(localPrefs.budget_alert_threshold * 100)}%</Label>
            <Slider
              value={[localPrefs.budget_alert_threshold * 100]}
              onValueChange={(value) => setLocalPrefs({ 
                ...localPrefs, 
                budget_alert_threshold: value[0] / 100 
              })}
              min={50}
              max={95}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get warned when spending reaches this percentage
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive bill reminders via email
              </p>
            </div>
            <Switch
              checked={localPrefs.email_notifications}
              onCheckedChange={(checked) => setLocalPrefs({ 
                ...localPrefs, 
                email_notifications: checked 
              })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};
