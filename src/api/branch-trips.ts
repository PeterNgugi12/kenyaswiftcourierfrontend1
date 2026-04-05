import api from "./axios";

export interface Trip {
  success: any;
  id: string;
  trip_number: string;
  origin_branch_id: string;
  origin_branch_name: string;
  destination_branch_id: string;
  destination_branch_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_type: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  departure_time: string;
  arrival_time?: string;
  parcels_count: number;
  status: 'scheduled' | 'departed' | 'in_transit' | 'arrived' | 'cancelled';
  created_at: string;
}

export interface CreateTripData {
  destination_branch_id: string;
  vehicle_id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  departure_date: string;
  departure_time: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  status: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  town: string;
}

export const branchTripsApi = {
  // Get all trips
  getTrips: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ success: boolean; data: { total: number; page: number; limit: number; data: Trip[] } }> => {
    const response = await api.get('/branch/trips', { params });
    return response.data;
  },

  // Get trip by ID
  getTripById: async (id: string): Promise<{ success: boolean; data: Trip }> => {
    const response = await api.get(`/branch/trips/${id}`);
    return response.data;
  },

  // Create new trip
  createTrip: async (data: CreateTripData): Promise<{ success: boolean; message: string; data: Trip }> => {
    const response = await api.post('/branch/trips', data);
    return response.data;
  },

  // Update trip status (arrive)
  updateTripStatus: async (id: string, status: string): Promise<{ success: boolean; message: string; data: Trip }> => {
    const response = await api.patch(`/branch/trips/${id}/status`, { status });
    return response.data;
  },

  // Get available vehicles
  getAvailableVehicles: async (): Promise<{ success: boolean; data: Vehicle[] }> => {
    const response = await api.get('/branch/trips/available-vehicles');
    return response.data;
  },

  // Get available drivers
  getAvailableDrivers: async (): Promise<{ success: boolean; data: Driver[] }> => {
    const response = await api.get('/branch/trips/available-drivers');
    return response.data;
  },

  // Get destination branches
  getDestinationBranches: async (): Promise<{ success: boolean; data: Branch[] }> => {
    const response = await api.get('/branch/trips/destination-branches');
    return response.data;
  },

  // Get trip statistics
  getTripStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/branch/trips/stats');
    return response.data;
  }
};