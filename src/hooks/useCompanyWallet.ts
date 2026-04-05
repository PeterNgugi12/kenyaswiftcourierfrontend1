import { useState, useEffect, useCallback } from 'react';
import { companyWalletApi, CompanyWallet, Transaction, TopUpRequest } from '../api/company-wallet';
import { toast } from 'react-hot-toast';

export interface UseCompanyWalletReturn {
  wallet: CompanyWallet | null;
  transactions: Transaction[];
  loading: {
    wallet: boolean;
    transactions: boolean;
    topup: boolean;
  };
  stats: {
    balance: number;
    totalCredits: number;
    totalDeductions: number;
    isLow: boolean;
    status: string;
  };
  total: number;
  page: number;
  setPage: (page: number) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  search: string;
  setSearch: (search: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  initiateTopUp: (data: TopUpRequest) => Promise<any>;
  formatTransactionForDisplay: (transaction: Transaction) => any;
  refresh: {
    wallet: () => void;
    transactions: () => void;
  };
}

export const useCompanyWallet = (): UseCompanyWalletReturn => {
  const [wallet, setWallet] = useState<CompanyWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState({
    wallet: false,
    transactions: false,
    topup: false
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchWallet = useCallback(async () => {
    setLoading(prev => ({ ...prev, wallet: true }));
    try {
      const response = await companyWalletApi.getMyWallet();
      if (response.success) {
        setWallet(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch wallet:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const params: any = { page, limit };
      if (filterType !== 'all') params.type = filterType;
      if (search) params.search = search;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await companyWalletApi.getMyTransactions(params);
      if (response.success) {
        setTransactions(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [page, limit, filterType, search, startDate, endDate]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  const initiateTopUp = async (data: TopUpRequest) => {
    setLoading(prev => ({ ...prev, topup: true }));
    try {
      const response = await companyWalletApi.initiateMpesaTopUp(data);
      
      if (response.success) {
        toast.success(
          `${response.message}\nPlease check your phone to complete the payment`,
          { duration: 10000 }
        );
        
        if (response.data.checkoutRequestID) {
          pollTransactionStatus(response.data.checkoutRequestID);
        }
        
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate top-up');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, topup: false }));
    }
  };

  const pollTransactionStatus = async (checkoutRequestID: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      try {
        const response = await companyWalletApi.checkTransactionStatus(checkoutRequestID);
        if (response.success && response.data) {
          if (response.data.ResultCode === 0 || response.data.status === 'completed') {
            toast.success('Payment successful! Your wallet has been credited.');
            fetchWallet();
            fetchTransactions();
            return true;
          } else if (response.data.ResultCode !== undefined && response.data.ResultCode !== 0) {
            toast.error('Payment failed. Please try again.');
            return true;
          }
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      const completed = await checkStatus();
      if (completed || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 5000);
  };

  const formatTransactionForDisplay = (transaction: Transaction) => {
    const typeMap: Record<string, { label: string; badge: string }> = {
      credit: { label: 'Top-Up', badge: 'badge-success' },
      debit: { label: 'Withdrawal', badge: 'badge-danger' },
      fee_deduction: { label: 'Parcel Fee', badge: 'badge-navy' },
      adjustment: { label: 'Adjustment', badge: 'badge-warning' }
    };

    const type = typeMap[transaction.type] || { label: transaction.type, badge: 'badge-info' };
    
    return {
      ...transaction,
      typeLabel: type.label,
      badgeClass: type.badge,
      formattedAmount: transaction.amount > 0 ? `+${transaction.amount.toLocaleString()}` : transaction.amount.toLocaleString(),
      amountClass: transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600',
      formattedDate: new Date(transaction.created_at).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const stats = {
    balance: wallet?.balance || 0,
    totalCredits: wallet?.total_credits || 0,
    totalDeductions: wallet?.total_deductions || 0,
    isLow: (wallet?.balance || 0) < 500,
    status: wallet?.status || 'active'
  };

  return {
    wallet,
    transactions,
    loading,
    stats,
    total,
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
    refresh: {
      wallet: fetchWallet,
      transactions: fetchTransactions
    }
  };
};