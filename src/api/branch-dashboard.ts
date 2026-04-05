import api from "./axios";

export interface DashboardStats {
  booked_today: number;
  booked_today_change: number;
  trips_departed: number;
  trips_in_transit: number;
  arrivals_today: number;
  arrived_parcels: number;
  pending_pickup: number;
  overdue_pickup: number;
}

export interface RecentParcel {
  id: string;
  tracking_number: string;
  sender_name: string;
  receiver_name: string;
  destination_branch: string;
  destination_branch_name?: string;
  amount: number;
  payment_status: 'paid' | 'pending' | 'destination';
  status: string;
  created_at: string;
}

export interface BranchInfo {
  name: string;
  code: string;
  town: string;
}

export interface OverdueAlert {
  count: number;
  message: string;
}

export const branchDashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await api.get('/branch/dashboard/stats');
    return response.data;
  },

  // Get recent parcels
  getRecentParcels: async (limit: number = 10): Promise<{ success: boolean; data: RecentParcel[] }> => {
    const response = await api.get('/branch/dashboard/recent-parcels', { params: { limit } });
    return response.data;
  },

  // Get branch info
  getBranchInfo: async (): Promise<{ success: boolean; data: BranchInfo }> => {
    const response = await api.get('/branch/dashboard/branch-info');
    return response.data;
  },

  // Get overdue alerts
  getOverdueAlerts: async (): Promise<{ success: boolean; data: OverdueAlert }> => {
    const response = await api.get('/branch/dashboard/overdue-alerts');
    return response.data;
  }
};