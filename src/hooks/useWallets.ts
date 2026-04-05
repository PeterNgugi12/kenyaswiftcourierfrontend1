import { useState, useEffect, useCallback } from 'react';
import { walletApi } from '../api/wallets';
import { companyApi } from '../api/companies'; // Import the company API
import { Wallet, PlatformRevenue } from '../api/wallets';
import { toast } from 'react-hot-toast';

// Define local types if needed
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

export const useWallets = (): UseWalletsReturn => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [platformRevenue, setPlatformRevenue] = useState<PlatformRevenue | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [companiesLoaded, setCompaniesLoaded] = useState(false);

  // Fetch all companies to create a lookup map
  const fetchCompanies = useCallback(async () => {
    try {
      console.log('Fetching companies for wallet enrichment...');
      const response = await companyApi.getAll({ limit: 100 }); // Get all companies
      
      if (response?.success && response.data?.data) {
        const companyMap: Record<string, any> = {};
        response.data.data.forEach((company: any) => {
          companyMap[company.id] = company;
        });
        console.log('Companies loaded:', Object.keys(companyMap).length);
        setCompanies(companyMap);
        setCompaniesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setCompaniesLoaded(true); // Still mark as loaded to proceed
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      
      console.log('Fetching wallets with params:', params);
      
      const response = await walletApi.getAll(params);
      
      if (response?.success) {
        let walletsData: Wallet[] = [];
        
        // Extract wallets from response
        if (response.data?.data && Array.isArray(response.data.data)) {
          walletsData = response.data.data;
          setTotal(response.data.total || walletsData.length);
        } else if (Array.isArray(response.data)) {
          walletsData = response.data;
          setTotal(walletsData.length);
        }
        
        // Enrich wallets with company data
        const enrichedWallets = walletsData.map((wallet: any) => {
          const company = companies[wallet.company_id];
          
          // Create enriched wallet with company data
          return {
            ...wallet,
            company_name: company?.name || 'Unknown Company',
            company_code: company?.code || '---',
            // Keep original data
            _original: wallet,
            _company: company // Store company data for reference
          } as Wallet;
        });
        
        console.log('Enriched wallets:', enrichedWallets.map(w => ({
          id: w.id,
          name: w.company_name,
          code: w.company_code,
          balance: w.balance
        })));
        
        setWallets(enrichedWallets);
      }
    } catch (error: any) {
      console.error('Failed to fetch wallets:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, companies]);

  const fetchPlatformRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const response = await walletApi.getPlatformRevenue();
      console.log('Platform Revenue Response:', response);
      
      if (response?.success && response.data) {
        setPlatformRevenue(response.data);
      } else {
        setPlatformRevenue(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch platform revenue:', error);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  // Fetch wallets when companies are loaded or when filters change
  useEffect(() => {
    if (companiesLoaded) {
      fetchWallets();
    }
  }, [fetchWallets, companiesLoaded]);

  useEffect(() => {
    fetchPlatformRevenue();
  }, [fetchPlatformRevenue]);

  const adjustWallet = async (walletId: string, amount: number, reason: string) => {
    try {
      const response = await walletApi.adjust(walletId, { amount, reason });
      console.log('Adjust wallet response:', response);
      
      if (response?.success) {
        toast.success(response.message || 'Wallet adjusted successfully');
        // Refresh both wallets and platform revenue
        await fetchWallets();
        await fetchPlatformRevenue();
        return response.data;
      } else {
        throw new Error('Failed to adjust wallet');
      }
    } catch (error: any) {
      console.error('Adjust wallet error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to adjust wallet');
      throw error;
    }
  };

  const refresh = useCallback(() => {
    fetchCompanies(); // Refresh companies first
    fetchPlatformRevenue();
  }, [fetchCompanies, fetchPlatformRevenue]);

  // Calculate statistics with safe checks
  const totalBalance = wallets?.reduce((sum, w) => sum + (w?.balance || 0), 0) || 0;
  const totalRevenue = wallets?.reduce((sum, w) => sum + (w?.total_deductions || 0), 0) || 0;
  const lowBalanceCount = wallets?.filter(w => (w?.balance || 0) < 500).length || 0;
  const activeWalletsCount = wallets?.filter(w => w?.status === 'active').length || 0;

  const stats: WalletsStats = {
    totalBalance,
    totalRevenue,
    lowBalanceCount,
    activeWalletsCount,
    totalWallets: total
  };

  return {
    wallets,
    loading: loading || !companiesLoaded, // Show loading while companies are being fetched
    total,
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    platformRevenue,
    revenueLoading,
    stats,
    adjustWallet,
    refresh
  };
};