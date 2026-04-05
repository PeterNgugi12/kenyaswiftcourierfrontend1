import api from "./axios";

export interface Company {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  status: 'active' | 'suspended' | 'inactive';
  phone?: string;
  email?: string;
  address?: string;
  branches_count: number;
  vehicles_count: number;
  drivers_count: number;
  parcels_this_month?: number;
  revenue_this_month?: string;
  created_at: string;
  wallet?: {
    balance: number;
    total_credits: number;
    total_deductions: number;
    status: string;
  };
}

export interface CompaniesResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: Company[];
  };
}

export const companyApi = {
  // Get all companies with pagination and filters
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }) => {
    const response = await api.get<CompaniesResponse>('/companies', { params });
    return response.data;
  },

  // Get single company
  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  create: async (formData: FormData) => {
    const response = await api.post('/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update company
  update: async (id: string, data: any) => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  // Update company status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/companies/${id}/status`, { status });
    return response.data;
  },

  // Get company statistics
  getStats: async (id: string) => {
    const response = await api.get(`/companies/${id}/stats`);
    return response.data;
  },
};