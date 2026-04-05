export interface Wallet {
  companyCode: string;
  companyName: string;
  id: string;
  company_id: string;
  company_name: string;
  company_code: string;
  balance: number;
  total_credits: number;
  total_deductions: number;
  status: 'active' | 'frozen' | 'closed';
  low_balance: boolean;
  created_at?: string;
}

export interface PlatformRevenue {
  total_revenue: number;
  total_transactions: number;
  monthly: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  ytd: number;
  fee_per_parcel: number;
}

export interface WalletsStats {
  totalBalance: number;
  totalRevenue: number;
  lowBalanceCount: number;
  activeWalletsCount: number;
  totalWallets: number;
}

export interface UseWalletsReturn {
  wallets: Wallet[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  status: string;
  setStatus: (status: string) => void;
  platformRevenue: PlatformRevenue | null;
  revenueLoading: boolean;
  stats: WalletsStats;
  adjustWallet: (walletId: string, amount: number, reason: string) => Promise<any>;
  refresh: () => void;
}