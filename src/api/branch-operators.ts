import api from "./axios";

export interface BranchOperator {
  parcels: number;
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  branch_id: string;
  branch_name?: string;
  branch_code?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface CreateOperatorData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  branch_id: string;
}

export interface UpdateOperatorData {
  full_name?: string;
  email?: string;
  phone?: string;
  branch_id?: string;
  is_active?: boolean;
}

export const branchOperatorApi = {
  // Get all operators for a company
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    branch_id?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await api.get('/company/branch-operators', { params });
    return response.data;
  },

  // Get operator by ID
  getById: async (id: string) => {
    const response = await api.get(`/company/branch-operators/${id}`);
    return response.data;
  },

  // Create new operator
  create: async (data: CreateOperatorData) => {
    const response = await api.post('/company/branch-operators', data);
    return response.data;
  },

  // Update operator
  update: async (id: string, data: UpdateOperatorData) => {
    const response = await api.put(`/company/branch-operators/${id}`, data);
    return response.data;
  },

  // Update operator status (suspend/activate)
  updateStatus: async (id: string, is_active: boolean) => {
    const response = await api.patch(`/company/branch-operators/${id}/status`, { is_active });
    return response.data;
  },

  // Delete operator
  delete: async (id: string) => {
    const response = await api.delete(`/company/branch-operators/${id}`);
    return response.data;
  },

  // Reset operator password
  resetPassword: async (id: string, newPassword: string) => {
    const response = await api.post(`/company/branch-operators/${id}/reset-password`, { password: newPassword });
    return response.data;
  },

  // Get operator statistics
  getStats: async () => {
    const response = await api.get('/company/branch-operators/stats');
    return response.data;
  }
};