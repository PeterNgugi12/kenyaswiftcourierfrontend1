import { useEffect, useState } from "react";
import { 
  Wallet as WalletIcon, DollarSign, TrendingUp, AlertTriangle, 
  Building2, Search, ArrowUpRight, Edit3, X, Check, Loader2, Filter, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useWallets } from "@/hooks/useWallets";
import { formatCurrency } from "@/lib/utils";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;
const PARCEL_PROCESSING_FEE = 5; // KES per parcel

const SuperAdminWallets = () => {
  const { 
    wallets, 
    loading, 
    total, 
    page, 
    setPage, 
    search, 
    setSearch, 
    status, 
    setStatus,
    platformRevenue,
    stats,
    adjustWallet,
    refresh 
  } = useWallets();

  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug: Log the first wallet to see its structure
  useEffect(() => {
    if (wallets.length > 0) {
      console.log('=== WALLET DATA DEBUG ===');
      console.log('First wallet (raw):', wallets[0]);
      console.log('All wallets:', wallets);
      console.log('Available keys in first wallet:', Object.keys(wallets[0]));
      
      // Check for company name variations
      const firstWallet = wallets[0];
      console.log('Possible company name fields:', {
        company_name: firstWallet.company_name,
        companyName: (firstWallet as any).companyName,
        company: (firstWallet as any).company,
        'company?.name': (firstWallet as any).company?.name,
        'company?.company_name': (firstWallet as any).company?.company_name
      });
    }
  }, [wallets]);

  // Helper function to safely get company name
  const getCompanyName = (wallet: any): string => {
    if (!wallet) return 'Unknown Company';
    
    // Check if we have the enriched company_name
    if (wallet.company_name && wallet.company_name !== 'Unknown Company') {
      return wallet.company_name;
    }
    
    // Fallback to company data if available
    if (wallet._company?.name) {
      return wallet._company.name;
    }
    
    return 'Unknown Company';
  };

  // Helper function to safely get company code
  const getCompanyCode = (wallet: any): string => {
    if (!wallet) return '---';
    
    // Check if we have the enriched company_code
    if (wallet.company_code && wallet.company_code !== '---') {
      return wallet.company_code;
    }
    
    // Fallback to company data if available
    if (wallet._company?.code) {
      return wallet._company.code;
    }
    
    return '---';
  };

  // Helper function to get initials for avatar
  const getInitials = (wallet: any): string => {
    const name = getCompanyName(wallet);
    if (name === 'Unknown Company') return 'CO';
    
    // Extract initials from company name
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Filter wallets for display (client-side filtering)
  const filtered = wallets.filter((w: any) => {
    if (!w) return false;
    
    const companyName = getCompanyName(w).toLowerCase();
    const companyCode = getCompanyCode(w).toLowerCase();
    const searchLower = search.toLowerCase();
    
    const matchesSearch = 
      companyName.includes(searchLower) ||
      companyCode.includes(searchLower);
    
    const matchesStatus = !status || w.status === status;
    
    return matchesSearch && matchesStatus;
  });

  // Add debugging for filtered results
  useEffect(() => {
    console.log('Filtered wallets:', filtered.length);
    if (filtered.length > 0) {
      console.log('First filtered wallet:', {
        name: getCompanyName(filtered[0]),
        code: getCompanyCode(filtered[0]),
        status: filtered[0].status,
        balance: filtered[0].balance
      });
    }
  }, [filtered]);
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const handleAdjust = async (walletId: string) => {
    if (!adjustAmount || !adjustReason) {
      toast.error('Please enter amount and reason');
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await adjustWallet(walletId, amount, adjustReason);
      setAdjusting(null);
      setAdjustAmount("");
      setAdjustReason("");
      toast.success('Wallet adjusted successfully');
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAdjust = () => {
    setAdjusting(null);
    setAdjustAmount("");
    setAdjustReason("");
  };

  // Mobile wallet card component
  const MobileWalletCard = ({ wallet }: { wallet: any }) => {
    const isLowBalance = wallet.balance < 500;
    
    return (
      <div 
        className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
        onClick={() => {
          setSelectedWallet(wallet);
          setShowDetailsModal(true);
        }}
      >
        {/* Header with Company Info and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "hsl(var(--navy))", color: "white" }}
            >
              {getInitials(wallet)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm truncate">
                {getCompanyName(wallet)}
              </div>
              <div className="text-xs text-muted-foreground">
                {getCompanyCode(wallet)}
              </div>
            </div>
          </div>
          <span className={wallet.status === "active" ? "badge-success" : "badge-danger"}>
            {wallet.status}
          </span>
        </div>

        {/* Balance */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Current Balance</div>
          <div className={`text-2xl font-bold ${isLowBalance ? "text-red-600" : "text-foreground"}`}>
            {isLowBalance && <AlertTriangle className="w-4 h-4 inline mr-1 text-red-600" />}
            {formatCurrency(wallet.balance)}
          </div>
        </div>

        {/* Credits and Deductions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-2 rounded-lg">
            <div className="text-xs text-muted-foreground">Total Credits</div>
            <div className="text-sm font-semibold text-emerald-600">
              {formatCurrency(wallet.total_credits)}
            </div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <div className="text-xs text-muted-foreground">Total Deductions</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(wallet.total_deductions)}
            </div>
          </div>
        </div>

        {/* Footer with indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Tap for details & actions
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  // Mobile Wallet Details Modal
  const WalletDetailsModal = () => {
    if (!selectedWallet) return null;
    const isLowBalance = selectedWallet.balance < 500;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Wallet Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Company Header */}
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: "hsl(var(--navy))", color: "white" }}
              >
                {getInitials(selectedWallet)}
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {getCompanyName(selectedWallet)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Code: {getCompanyCode(selectedWallet)}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={selectedWallet.status === "active" ? "badge-success" : "badge-danger"}>
                {selectedWallet.status}
              </span>
            </div>

            {/* Balance */}
            <div className={`p-4 rounded-lg ${isLowBalance ? 'bg-red-50' : 'bg-blue-50'}`}>
              <div className="text-xs text-muted-foreground mb-1">Current Balance</div>
              <div className={`text-3xl font-bold ${isLowBalance ? 'text-red-600' : 'text-blue-600'}`}>
                {isLowBalance && <AlertTriangle className="w-5 h-5 inline mr-2" />}
                {formatCurrency(selectedWallet.balance)}
              </div>
              {isLowBalance && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Low balance alert - Action recommended
                </p>
              )}
            </div>

            {/* Credits and Deductions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Credits</div>
                <div className="text-xl font-bold text-emerald-600">
                  {formatCurrency(selectedWallet.total_credits)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Deductions</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(selectedWallet.total_deductions)}
                </div>
              </div>
            </div>

            {/* Adjust Wallet Section */}
            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3">Adjust Wallet</h4>
              
              {adjusting === selectedWallet.id ? (
                <div className="space-y-3">
                  <Input 
                    type="number" 
                    placeholder="Amount (KES)" 
                    className="h-10 text-sm" 
                    value={adjustAmount} 
                    onChange={e => setAdjustAmount(e.target.value)}
                    disabled={submitting}
                  />
                  <Input 
                    placeholder="Reason for adjustment" 
                    className="h-10 text-sm" 
                    value={adjustReason} 
                    onChange={e => setAdjustReason(e.target.value)}
                    disabled={submitting}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAdjust(selectedWallet.id)} 
                      className="flex-1 h-10 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Confirm
                    </button>
                    <button 
                      onClick={handleCancelAdjust} 
                      className="flex-1 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"
                      disabled={submitting}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-10"
                  onClick={() => setAdjusting(selectedWallet.id)}
                >
                  <Edit3 className="w-4 h-4" />
                  Adjust Wallet Balance
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && wallets.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Wallet Management</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'Company wallets & revenue' : 'Company wallets, balances & platform revenue'}
          </p>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          Fee: KES {PARCEL_PROCESSING_FEE} / parcel
        </div>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Wallet Liabilities */}
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{formatCurrency(stats.totalBalance)}</div>
          <div className="kpi-label text-xs sm:text-sm">Total Liabilities</div>
          <div className="kpi-change text-xs text-muted-foreground truncate">Across all companies</div>
        </div>

        {/* Total Revenue Earned */}
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{formatCurrency(platformRevenue?.total_revenue || stats.totalRevenue)}</div>
          <div className="kpi-label text-xs sm:text-sm">Revenue Earned</div>
          <div className="kpi-change text-emerald-600 text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            From parcel fees
          </div>
        </div>

        {/* Company Wallets */}
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{stats.totalWallets}</div>
          <div className="kpi-label text-xs sm:text-sm">Company Wallets</div>
          <div className="kpi-change text-xs text-muted-foreground">
            {stats.activeWalletsCount} active
          </div>
        </div>

        {/* Low Balance Alerts */}
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className={`kpi-value text-lg sm:text-2xl ${stats.lowBalanceCount > 0 ? "text-red-600" : ""}`}>
            {stats.lowBalanceCount}
          </div>
          <div className="kpi-label text-xs sm:text-sm">Low Balance Alerts</div>
          <div className={`kpi-change text-xs ${stats.lowBalanceCount > 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {stats.lowBalanceCount > 0 ? "Action required" : "All healthy"}
          </div>
        </div>
      </div>

      {/* Mobile Search & Filters */}
      {isMobile && (
        <div className="form-section p-3 mb-4">
          <div className="relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search company..." 
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
            {showMobileFilters ? 'Hide Filters' : `Filter: ${status || 'All Status'}`}
          </Button>
          
          {showMobileFilters && (
            <div className="mt-3 animate-slide-down">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    status === '' 
                      ? 'bg-navy text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => {
                    setStatus('');
                    setPage(1);
                    setShowMobileFilters(false);
                  }}
                >
                  All
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    status === 'active' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => {
                    setStatus('active');
                    setPage(1);
                    setShowMobileFilters(false);
                  }}
                >
                  Active
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    status === 'frozen' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => {
                    setStatus('frozen');
                    setPage(1);
                    setShowMobileFilters(false);
                  }}
                >
                  Frozen
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    status === 'closed' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => {
                    setStatus('closed');
                    setPage(1);
                    setShowMobileFilters(false);
                  }}
                >
                  Closed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Search & Filter */}
      {!isMobile && (
        <div className="form-section p-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">All Company Wallets</h3>
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 border rounded-lg bg-background text-sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="closed">Closed</option>
              </select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search company..." 
                  className="pl-9" 
                  value={search} 
                  onChange={e => { 
                    setSearch(e.target.value); 
                    setPage(1); 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallets Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map((wallet: any) => (
              <MobileWalletCard key={wallet.id} wallet={wallet} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No wallets found</p>
              {search && (
                <div className="mt-2">
                  <p className="text-xs mb-2">Try adjusting your search</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearch('');
                      toast('Search cleared', { icon: '🧹' });
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="form-section p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-xs">Company</th>
                  <th className="text-xs">Status</th>
                  <th className="text-xs text-right">Balance (KES)</th>
                  <th className="text-xs text-right">Total Credits</th>
                  <th className="text-xs text-right">Total Deducted</th>
                  <th className="text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map((w: any) => (
                    <tr key={w.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: "hsl(var(--navy))", color: "white" }}
                          >
                            {getInitials(w)}
                          </div>
                          <div>
                            <span className="font-medium text-foreground text-sm">{getCompanyName(w)}</span>
                            <div className="text-xs text-muted-foreground">{getCompanyCode(w)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={w.status === "active" ? "badge-success" : "badge-danger"}>
                          {w.status}
                        </span>
                      </td>
                      <td className={`text-right font-semibold text-sm ${w.balance < 500 ? "text-red-600" : "text-foreground"}`}>
                        {w.balance < 500 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {formatCurrency(w.balance)}
                      </td>
                      <td className="text-right text-muted-foreground text-sm">
                        {formatCurrency(w.total_credits)}
                      </td>
                      <td className="text-right text-muted-foreground text-sm">
                        {formatCurrency(w.total_deductions)}
                      </td>
                      <td className="text-right">
                        {adjusting === w.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input 
                              type="number" 
                              placeholder="Amount" 
                              className="w-20 h-8 text-xs" 
                              value={adjustAmount} 
                              onChange={e => setAdjustAmount(e.target.value)}
                              disabled={submitting}
                            />
                            <Input 
                              placeholder="Reason" 
                              className="w-28 h-8 text-xs" 
                              value={adjustReason} 
                              onChange={e => setAdjustReason(e.target.value)}
                              disabled={submitting}
                            />
                            <button 
                              onClick={() => handleAdjust(w.id)} 
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              disabled={submitting}
                            >
                              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={handleCancelAdjust} 
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100"
                              disabled={submitting}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1.5 text-xs h-8" 
                            onClick={() => setAdjusting(w.id)}
                          >
                            <Edit3 className="w-3 h-3" />
                            Adjust
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No wallets found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <WalletDetailsModal />}

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-xl shadow-sm;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
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

export default SuperAdminWallets;