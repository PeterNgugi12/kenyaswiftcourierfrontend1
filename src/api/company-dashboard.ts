import api from "./axios";

export interface DashboardStats {
  company_name: string;
  parcels_this_month: number;
  parcels_change: number;
  revenue_this_month: number;
  revenue_rate: number;
  active_vehicles: number;
  total_vehicles: number;
  vehicles_in_maintenance: number;
  active_drivers: number;
  drivers_on_leave: number;
  wallet_balance: number;
  wallet_low_balance: boolean;
  weekly_data: Array<{
    day: string;
    parcels: number;
  }>;
  branch_performance: Array<{
    branch_id: string;
    branch_name: string;
    parcels: number;
    percentage: number;
  }>;
  recent_trips: Array<{
    id: string;
    trip_id: string;
    route: string;
    vehicle: string;
    driver: string;
    parcels: number;
    status: string;
  }>;
  active_trips_count: number;
}

export interface WalletInfo {
  balance: number;
  low_balance: boolean;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await api.get('/company/dashboard/stats');
    return response.data;
  },

  // Get wallet info
  getWallet: async (): Promise<{ success: boolean; data: WalletInfo }> => {
    const response = await api.get('/company/dashboard/wallet');
    return response.data;
  },

  // Get weekly data
  getWeeklyData: async (): Promise<{ success: boolean; data: Array<{ day: string; parcels: number }> }> => {
    const response = await api.get('/company/dashboard/weekly');
    return response.data;
  },

  // Get branch performance
  getBranchPerformance: async (): Promise<{ success: boolean; data: Array<{ branch_name: string; parcels: number; percentage: number }> }> => {
    const response = await api.get('/company/dashboard/branch-performance');
    return response.data;
  },

  // Get recent trips
  getRecentTrips: async (): Promise<{ success: boolean; data: Array<any>; active_count: number }> => {
    const response = await api.get('/company/dashboard/recent-trips');
    return response.data;
  }
};