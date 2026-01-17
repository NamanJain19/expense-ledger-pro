import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/dashboard/Header';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { PreferencesSettings } from '@/components/dashboard/PreferencesSettings';
import { CategoryManager } from '@/components/dashboard/CategoryManager';
import { RecurringTransactionManager } from '@/components/dashboard/RecurringTransactionManager';
import { BillRemindersManager } from '@/components/dashboard/BillRemindersManager';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile & Preferences */}
            <div className="space-y-6">
              <ProfileSection />
              <PreferencesSettings />
            </div>

            {/* Categories & Recurring */}
            <div className="space-y-6">
              <CategoryManager />
              <RecurringTransactionManager />
            </div>

            {/* Bill Reminders - Full Width */}
            <div className="lg:col-span-2">
              <BillRemindersManager />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
