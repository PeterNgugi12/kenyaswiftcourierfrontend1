import { useState, useEffect } from "react";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, AlertTriangle, 
  History, Plus, Search, Filter, Loader2, Smartphone, ChevronRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useCompanyWallet } from "@/hooks/useCompanyWallet";
import { formatCurrency } from "@/lib/utils";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;
const PARCEL_PROCESSING_FEE = 5;

const CompanyWallet = () => {
  const { 
    stats, 
    transactions,
    loading,
    page, 
    setPage, 
    filterType, 
    setFilterType,
    search, 
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    initiateTopUp,
    formatTransactionForDisplay,
    refresh
  } = useCompanyWallet();

  const [showTopUp, setShowTopUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [topUpData, setTopUpData] = useState({
    amount: '',
    phone_number: ''
  });

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isLow = stats.isLow;

  const filtered = transactions
    .map(t => formatTransactionForDisplay(t))
    .filter(t => {
      if (search) {
        const searchLower = search.toLowerCase();
        return (t.reference?.toLowerCase().includes(searchLower) || 
                t.reason?.toLowerCase().includes(searchLower));
      }
      return true;
    });
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const handleTopUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTopUpData(prev => ({ ...prev, [name]: value }));
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topUpData.amount || !topUpData.phone_number) {
      toast.error('Please enter amount and phone number');
      return;
    }

    const amount = parseFloat(topUpData.amount);
    if (amount < 10) {
      toast.error('Minimum top-up amount is KES 10');
      return;
    }

    if (amount > 150000) {
      toast.error('Maximum top-up amount is KES 150,000');
      return;
    }

    setSubmitting(true);
    try {
      await initiateTopUp({
        amount,
        phone_number: topUpData.phone_number
      });
      setShowTopUp(false);
      setTopUpData({ amount: '', phone_number: '' });
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile transaction card component
  const MobileTransactionCard = ({ transaction }: { transaction: any }) => (
    <div className="mobile-card p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={transaction.badgeClass}>
            {transaction.typeLabel}
          </span>
          <span className="text-xs text-muted-foreground">{transaction.formattedDate}</span>
        </div>
        <span className={`font-semibold ${transaction.amountClass}`}>
          {transaction.formattedAmount}
        </span>
      </div>

      {/* Reference & Description */}
      <div className="mb-2">
        {transaction.reference && (
          <div className="font-mono text-xs text-muted-foreground mb-1">
            Ref: {transaction.reference}
          </div>
        )}
        <div className="text-sm text-foreground">{transaction.reason}</div>
      </div>

      {/* Balance After */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Balance after</span>
        <span className="text-sm font-medium">{formatCurrency(transaction.balance_after)}</span>
      </div>
    </div>
  );

  if (loading.wallet && !stats.balance) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Company Wallet</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'Prepaid balance & transactions' : 'Prepaid balance & transaction history'}
          </p>
        </div>
        <Button 
          onClick={() => setShowTopUp(true)} 
          className="w-full sm:w-auto gap-2 h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Top Up Wallet
        </Button>
      </div>

      {/* Low Balance Alert */}
      {isLow && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200 mb-4 sm:mb-6">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs sm:text-sm font-semibold text-red-800">Low Wallet Balance</div>
            <div className="text-xs text-red-600 mt-0.5">
              Your balance is below KES 500. Please top up immediately.
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {isLow ? (
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            ) : (
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            )}
          </div>
          <div className={`kpi-value text-lg sm:text-2xl ${isLow ? "text-red-600" : ""}`}>
            {formatCurrency(stats.balance)}
          </div>
          <div className="kpi-label text-xs sm:text-sm">Current Balance</div>
          <div className={`kpi-change text-xs ${isLow ? "text-red-500" : "text-emerald-600"}`}>
            {isLow ? "⚠ Below minimum" : "✓ Sufficient balance"}
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{formatCurrency(stats.totalCredits)}</div>
          <div className="kpi-label text-xs sm:text-sm">Total Credits</div>
          <div className="kpi-change text-xs text-muted-foreground">All-time top-ups</div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{formatCurrency(stats.totalDeductions)}</div>
          <div className="kpi-label text-xs sm:text-sm">Total Deductions</div>
          <div className="kpi-change text-xs text-muted-foreground">
            @ KES {PARCEL_PROCESSING_FEE}/parcel
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="form-section p-3 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Transaction History</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} transactions
          </span>
        </div>

        {/* Mobile Filters */}
        {isMobile && (
          <div className="space-y-3 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9 h-10 text-sm" 
                value={search} 
                onChange={e => { 
                  setSearch(e.target.value); 
                  setPage(1); 
                }} 
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full gap-2 h-10"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="w-4 h-4" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            {showMobileFilters && (
              <div className="space-y-3 animate-slide-down">
                <div>
                  <label className="text-xs font-medium mb-1 block">Transaction Type</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                    value={filterType}
                    onChange={e => { 
                      setFilterType(e.target.value); 
                      setPage(1); 
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Top-Ups</option>
                    <option value="fee_deduction">Parcel Fees</option>
                    <option value="adjustment">Adjustments</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">From</label>
                    <Input
                      type="date"
                      className="h-10 text-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">To</label>
                    <Input
                      type="date"
                      className="h-10 text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Filters */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by reference or description..." 
                className="pl-9 h-10" 
                value={search} 
                onChange={e => { 
                  setSearch(e.target.value); 
                  setPage(1); 
                }} 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
                value={filterType}
                onChange={e => { 
                  setFilterType(e.target.value); 
                  setPage(1); 
                }}
              >
                <option value="all">All Types</option>
                <option value="credit">Top-Ups</option>
                <option value="fee_deduction">Parcel Fees</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>

            <Input
              type="date"
              className="w-40 h-10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
            />
            <Input
              type="date"
              className="w-40 h-10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
            />
          </div>
        )}

        {/* Transactions Display - Mobile Cards or Desktop Table */}
        {isMobile ? (
          <div className="space-y-3">
            {paged.length > 0 ? (
              paged.map(t => (
                <MobileTransactionCard key={t.id} transaction={t} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No transactions found</p>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-xs">Date</th>
                  <th className="text-xs">Type</th>
                  <th className="text-xs">Reference</th>
                  <th className="text-xs">Description</th>
                  <th className="text-xs text-right">Amount</th>
                  <th className="text-xs text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(t => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
                        {t.formattedDate}
                      </td>
                      <td>
                        <span className={t.badgeClass}>
                          {t.typeLabel}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{t.reference || '—'}</td>
                      <td className="text-xs sm:text-sm">{t.reason}</td>
                      <td className={`text-right font-semibold text-sm ${t.amountClass}`}>
                        {t.formattedAmount}
                      </td>
                      <td className="text-right text-muted-foreground text-xs sm:text-sm">
                        {formatCurrency(t.balance_after)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="mt-4">
            <TablePagination 
              currentPage={page} 
              totalItems={filtered.length} 
              pageSize={PAGE_SIZE} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      {/* M-Pesa Top-Up Modal - Mobile Optimized */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5" />
              M-Pesa Top-Up
            </DialogTitle>
            <DialogDescription className="text-sm">
              Enter your M-Pesa registered phone number and amount to receive an STK push.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleTopUpSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                name="phone_number"
                value={topUpData.phone_number}
                onChange={handleTopUpChange}
                placeholder="e.g. 0712345678"
                required
                className="h-10 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the M-Pesa registered phone number
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Amount (KES) <span className="text-red-500">*</span>
              </label>
              <Input
                name="amount"
                type="number"
                value={topUpData.amount}
                onChange={handleTopUpChange}
                placeholder="e.g. 1000"
                min="10"
                step="10"
                required
                className="h-10 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: KES 10 | Max: KES 150,000
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> After submitting, you'll receive an STK push on your phone. 
                Enter your M-Pesa PIN to complete the transaction.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTopUp(false)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                style={{ background: "hsl(var(--navy))", color: "white" }}
                disabled={submitting}
                className="w-full sm:w-auto gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Pay with M-Pesa
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-xl shadow-sm;
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CompanyWallet;