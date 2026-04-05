import api from "./axios";

export interface CompanyWallet {
  id: string;
  company_id: string;
  balance: number;
  total_credits: number;
  total_deductions: number;
  status: 'active' | 'frozen' | 'closed';
  low_balance: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'fee_deduction' | 'adjustment';
  reason: string;
  reference?: string;
  balance_after: number;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
  };
}

export interface TopUpRequest {
  amount: number;
  phone_number: string;
}

export interface MpesaSTKResponse {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  responseCode?: string;
  responseDescription?: string;
}

export interface WalletStats {
  balance: number;
  total_credits: number;
  total_deductions: number;
  today: {
    credits: number;
    debits: number;
    count: number;
  };
  this_month: {
    credits: number;
    debits: number;
  };
}

export const companyWalletApi = {
  getMyWallet: async (): Promise<{ success: boolean; data: CompanyWallet }> => {
    const response = await api.get('/company/wallet');
    return response.data;
  },

  getMyTransactions: async (params?: { 
    page?: number; 
    limit?: number; 
    type?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; data: { total: number; page: number; limit: number; data: Transaction[] } }> => {
    const response = await api.get('/company/wallet/transactions', { params });
    return response.data;
  },

  initiateMpesaTopUp: async (data: TopUpRequest): Promise<{ success: boolean; message: string; data: MpesaSTKResponse }> => {
    const response = await api.post('/company/wallet/mpesa-topup', data);
    return response.data;
  },

  checkTransactionStatus: async (checkoutRequestID: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`/company/wallet/mpesa-status/${checkoutRequestID}`);
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: WalletStats }> => {
    const response = await api.get('/company/wallet/stats');
    return response.data;
  }
};