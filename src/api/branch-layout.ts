import api from "./axios";

export interface BranchOperatorProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  branch: {
    id: string;
    name: string;
    code: string;      // This must be present
    town: string;
    company: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface BranchNotifications {
  pending_pickups: number;
  pending_deliveries: number;
  recent_alerts: Array<{
    id: string;
    type: string;
    message: string;
    created_at: string;
  }>;
}

export const branchLayoutApi = {
  // Get branch operator profile
  getProfile: async (): Promise<{ success: boolean; data: BranchOperatorProfile }> => {
    const response = await api.get('/branch/auth/profile');
    return response.data;
  },

  // Get branch notifications/counts
  getNotifications: async (): Promise<{ success: boolean; data: BranchNotifications }> => {
    const response = await api.get('/branch/notifications');
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/branch/auth/logout');
    return response.data;
  }
};