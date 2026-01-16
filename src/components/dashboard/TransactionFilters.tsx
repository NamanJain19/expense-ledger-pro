import { Search, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

const allCategories = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Gift',
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'
];

export const TransactionFilters = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  onClearFilters
}: TransactionFiltersProps) => {
  const hasActiveFilters = searchQuery || dateRange.start || dateRange.end || categoryFilter || typeFilter;

  return (
    <div className="glass card-shadow rounded-xl p-4 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            placeholder="Start date"
            value={dateRange.start}
            onChange={e => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            placeholder="End date"
            value={dateRange.end}
            onChange={e => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {allCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
