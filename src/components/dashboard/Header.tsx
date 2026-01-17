import { LogOut, Wallet, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Expense Tracker</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.email}
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
