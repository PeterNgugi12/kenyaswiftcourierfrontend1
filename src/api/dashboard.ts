import api from "./axios";

export interface DashboardStats {
  companies: {
    total: number;
    active: number;
    suspended: number;
  };
  parcels: {
    total: number;
    total_revenue: number;
    monthly: Array<{
      month: string;
      parcels: number;
      revenue: number;
    }>;
  };
  wallets: {
    total_balance: number;
    platform_revenue: number;
    low_balance_count: number;
  };
  sms: {
    sent_today: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate: number;
    total_cost: number;
  };
  top_companies: Array<{
    id: string;
    name: string;
    parcels: number;
    status: string;
  }>;
}

export interface MonthlyTrend {
  month: string;
  parcels: number;
  revenue: number;
  [key: string]: any; // For company-specific data
}

export interface SystemAlert {
  low_balance_wallets: Array<{
    company_id: string;
    company_name: string;
    balance: number;
    status: string;
  }>;
  suspended_companies: Array<{
    id: string;
    name: string;
    code: string;
    suspended_at: string;
  }>;
  failed_sms_24h: number;
  sms_gateway: {
    status: string;
    delivery_rate: number;
    provider: string;
  };
}

export const dashboardApi = {
  // Get platform statistics
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get monthly trends
  getTrends: async (): Promise<{ success: boolean; data: MonthlyTrend[] }> => {
    const response = await api.get('/dashboard/trends');
    return response.data;
  },

  // Get system alerts
  getAlerts: async (): Promise<{ success: boolean; data: SystemAlert }> => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  }
};