import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/hooks/useTransactions';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps {
  transactions: Transaction[];
}

export const ExportButton = ({ transactions }: ExportButtonProps) => {
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Add some transactions first.',
        variant: 'destructive'
      });
      return;
    }

    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`, // Escape quotes in title
      t.type,
      t.category,
      t.type === 'expense' ? `-${t.amount}` : t.amount.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: `Exported ${transactions.length} transactions to CSV.`
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
};
