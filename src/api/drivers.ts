import api from "./axios";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  vehicle_id?: string;
  route: string;
  trips: number;
  status: 'active' | 'on_trip' | 'on_leave' | 'inactive';
  rating: number;
  license: string;
  branch?: {
    id: string;
    name: string;
    code: string;
    town: string;
  };
  hire_date?: string;
  leave_start?: string;
  leave_end?: string;
  leave_reason?: string;
}

export interface CreateDriverData {
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_expiry?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  route?: string;
  branch_id?: string;
  notes?: string;
}

export interface UpdateStatusData {
  status: string;
  leave_reason?: string;
  leave_end?: string;
}

export const driverApi = {
  // Get all drivers
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
    branch_id?: string;
  }) => {
    const response = await api.get('/company/drivers', { params });
    return response.data;
  },

  // Get driver by ID
  getById: async (id: string) => {
    const response = await api.get(`/company/drivers/${id}`);
    return response.data;
  },

  // Create driver
  create: async (data: CreateDriverData) => {
    const response = await api.post('/company/drivers', data);
    return response.data;
  },

  // Update driver
  update: async (id: string, data: Partial<Driver>) => {
    const response = await api.put(`/company/drivers/${id}`, data);
    return response.data;
  },

  // Update driver status
  updateStatus: async (id: string, data: UpdateStatusData) => {
    const response = await api.patch(`/company/drivers/${id}/status`, data);
    return response.data;
  },

  // Delete driver
  delete: async (id: string) => {
    const response = await api.delete(`/company/drivers/${id}`);
    return response.data;
  },

  // Get driver statistics
  getStats: async () => {
    const response = await api.get('/company/drivers/stats');
    return response.data;
  },

  // Get available vehicles for assignment
  getAvailableVehicles: async () => {
    const response = await api.get('/company/drivers/available-vehicles');
    return response.data;
  }
};