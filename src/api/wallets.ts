import api from "./axios";

export interface Wallet {
  walletCompany(arg0: string, walletCompany: any): unknown;
  id: string;
  company_id: string;
  company_name: string;  // This will now be populated
  company_code: string;  // This will now be populated
  balance: number;
  total_credits: number;
  total_deductions: number;
  status: 'active' | 'frozen' | 'closed';
  low_balance: boolean;
  created_at?: string;
  // Keep original data if needed (this holds the raw response with walletCompany)
  _original?: any;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'fee_deduction' | 'adjustment';
  reason: string;
  reference?: string;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
  };
}

export interface WalletsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: Wallet[];
  };
}

export interface WalletResponse {
  success: boolean;
  data: Wallet & {
    recent_transactions?: WalletTransaction[];
  };
}

export interface TransactionsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: WalletTransaction[];
  };
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

export const walletApi = {
  // Get all wallets with pagination and filters
  // In api/wallets.ts
getAll: async (params?: { 
  page?: number; 
  limit?: number; 
  status?: string;
  search?: string;
}): Promise<WalletsResponse> => {
  console.log('📡 API Call: GET /wallets with params:', params);
  
  const response = await api.get('/wallets', { params });
  
  console.log('📡 API Response received:', response.data);
  
  // Transform the response to flatten the company data
  if (response.data?.success) {
    // Check where the wallets array is located
    let walletsArray = [];
    
    if (response.data.data?.data && Array.isArray(response.data.data.data)) {
      // Structure: { success: true, data: { data: [...], total, page, limit } }
      walletsArray = response.data.data.data;
      console.log('Found wallets in response.data.data.data:', walletsArray.length);
    } else if (Array.isArray(response.data.data)) {
      // Structure: { success: true, data: [...] }
      walletsArray = response.data.data;
      console.log('Found wallets in response.data.data:', walletsArray.length);
    } else {
      console.log('No wallets array found');
      return response.data;
    }
    
    // Transform each wallet
    const transformedWallets = walletsArray.map((wallet: any) => {
      console.log('Processing wallet:', wallet.id);
      console.log('Raw wallet data:', JSON.stringify(wallet, null, 2));
      
      // Check for company data in various possible locations
      let companyName = 'Unknown Company';
      let companyCode = '---';
      
      // From your SQL, the data comes as walletCompany in the response
      if (wallet.walletCompany) {
        companyName = wallet.walletCompany.name || 'Unknown Company';
        companyCode = wallet.walletCompany.code || '---';
        console.log('Found company in wallet.walletCompany:', { name: companyName, code: companyCode });
      } 
      // Check if company data is directly on the wallet
      else if (wallet.company) {
        companyName = wallet.company.name || wallet.company.company_name || 'Unknown Company';
        companyCode = wallet.company.code || wallet.company.company_code || '---';
        console.log('Found company in wallet.company:', { name: companyName, code: companyCode });
      }
      // Check for direct fields
      else if (wallet.company_name || wallet.company_code) {
        companyName = wallet.company_name || 'Unknown Company';
        companyCode = wallet.company_code || '---';
        console.log('Found company in direct fields:', { name: companyName, code: companyCode });
      }
      
      const transformed = {
        id: wallet.id,
        company_id: wallet.company_id,
        company_name: companyName,
        company_code: companyCode,
        balance: wallet.balance || 0,
        total_credits: wallet.total_credits || 0,
        total_deductions: wallet.total_deductions || 0,
        status: wallet.status || 'active',
        low_balance: (wallet.balance || 0) < 500,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at,
        _original: wallet
      };
      
      console.log('Transformed wallet:', transformed);
      return transformed;
    });
    
    // Update the response with transformed data
    if (response.data.data?.data) {
      response.data.data.data = transformedWallets;
    } else if (Array.isArray(response.data.data)) {
      response.data.data = transformedWallets;
    }
    
    console.log('✅ Transformation complete. First wallet:', transformedWallets[0]);
  } else {
    console.log('❌ No data to transform. Response structure:', response.data);
  }
  
  return response.data;
},

  // Get wallet by ID
  getById: async (id: string): Promise<WalletResponse> => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },

  // Get wallet by company ID
  getByCompanyId: async (companyId: string): Promise<WalletResponse> => {
    const response = await api.get(`/wallets/company/${companyId}`);
    return response.data;
  },

  // Adjust wallet balance
  adjust: async (id: string, data: { amount: number; reason: string }): Promise<{ 
    success: boolean; 
    message: string; 
    data: Wallet 
  }> => {
    const response = await api.post(`/wallets/${id}/adjust`, data);
    return response.data;
  },

  // Get wallet transactions
  getTransactions: async (id: string, params?: { 
    page?: number; 
    limit?: number 
  }): Promise<TransactionsResponse> => {
    const response = await api.get(`/wallets/${id}/transactions`, { params });
    return response.data;
  },

  // Get platform revenue
  getPlatformRevenue: async (): Promise<{ 
    success: boolean; 
    data: PlatformRevenue 
  }> => {
    const response = await api.get('/wallets/revenue/platform');
    return response.data;
  }
};