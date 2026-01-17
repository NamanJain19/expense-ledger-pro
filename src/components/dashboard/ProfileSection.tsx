import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <Card className="glass card-shadow">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full mx-auto" />
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass card-shadow animate-fade-up">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarFallback className="text-2xl font-bold gradient-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          <div>
            <Label>Member Since</Label>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'N/A'}
              </span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
