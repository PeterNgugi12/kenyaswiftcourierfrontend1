import api from "./axios";

export interface Branch {
  id: string;
  name: string;
  code: string;
  town: string;
  phone?: string;
  address?: string;
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
  operator_count: number;
  parcel_count: number;
  revenue: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CreateBranchData {
  name: string;
  code: string;
  town: string;
  phone?: string;
  address?: string;
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
  manager_password: string;
}

export const branchApi = {
  // Get all branches
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }) => {
    const response = await api.get('/company/branches', { params });
    return response.data;
  },

  // Get branch by ID
  getById: async (id: string) => {
    const response = await api.get(`/company/branches/${id}`);
    return response.data;
  },

  // Create branch
  create: async (data: CreateBranchData) => {
    const response = await api.post('/company/branches', data);
    return response.data;
  },

  // Update branch
  update: async (id: string, data: Partial<Branch>) => {
    const response = await api.put(`/company/branches/${id}`, data);
    return response.data;
  },

  // Update branch status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/company/branches/${id}/status`, { status });
    return response.data;
  },

  // Delete branch
  delete: async (id: string) => {
    const response = await api.delete(`/company/branches/${id}`);
    return response.data;
  }
};