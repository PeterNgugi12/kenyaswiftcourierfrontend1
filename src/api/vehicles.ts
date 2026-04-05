import api from "./axios";

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  route: string;
  driver: string;
  driver_id?: string;
  capacity: number;
  capacity_unit: string;
  status: 'active' | 'in_transit' | 'maintenance' | 'inactive' | 'sold';
  trips: number;
  parcels: number;
  branch?: {
    id: string;
    name: string;
    code: string;
    town: string;
  };
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  status: 'active' | 'on_trip' | 'on_leave' | 'inactive';
  vehicle_id?: string;
  vehicle_plate?: string;
}

export interface CreateVehicleData {
  plate_number: string;
  type: string;
  route?: string;
  capacity: number;
  capacity_unit?: string;
  branch_id?: string;
  driver_id?: string;
  driver_name?: string;
}

export interface UpdateStatusData {
  status: string;
  notes?: string;
}

export const vehicleApi = {
  // Get all vehicles
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
    branch_id?: string;
  }) => {
    const response = await api.get('/company/vehicles', { params });
    return response.data;
  },

  // Get vehicle by ID
  getById: async (id: string) => {
    const response = await api.get(`/company/vehicles/${id}`);
    return response.data;
  },

  // Create vehicle
  create: async (data: CreateVehicleData) => {
    const response = await api.post('/company/vehicles', data);
    return response.data;
  },

  // Update vehicle
  update: async (id: string, data: Partial<CreateVehicleData>) => {
    const response = await api.put(`/company/vehicles/${id}`, data);
    return response.data;
  },

  // Update vehicle status
  updateStatus: async (id: string, data: UpdateStatusData) => {
    const response = await api.patch(`/company/vehicles/${id}/status`, data);
    return response.data;
  },

  // Delete vehicle (mark as sold)
  delete: async (id: string, notes?: string) => {
    const response = await api.delete(`/company/vehicles/${id}`, { data: { notes } });
    return response.data;
  },

  // Get vehicle statistics
  getStats: async () => {
    const response = await api.get('/company/vehicles/stats');
    return response.data;
  },

  // Get all active drivers for assignment
  getActiveDrivers: async () => {
    const response = await api.get('/company/drivers?status=active&limit=100');
    return response.data;
  }
};