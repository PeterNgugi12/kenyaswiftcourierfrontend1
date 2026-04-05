// In branch-parcels.ts
import api from "./axios";
import { toast } from 'react-hot-toast';

export interface Parcel {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string;
  destination_branch: string;
  destination_branch_name?: string;
  weight?: number;
  amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'destination';
  status: 'pending' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';
  trip_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  receipt_number: string;
  tracking_number: string;
  generated_at: string;
  company: {
    name: string;
    code: string;
    logo: string | null;
    contact: {
      phone: string;
      email: string;
      website: string;
    };
  };
  origin_branch: {
    name: string;
    code: string;
    town: string;
    address: string;
  };
  served_by: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  sender: {
    name: string;
    phone: string;
  };
  receiver: {
    name: string;
    phone: string;
  };
  parcel: {
    tracking_number: string;
    description: string;
    weight: string;
    amount: string;
    payment_method: string;
    payment_status: string;
    status: string;
    destination: string;
    booked_at: string;
  };
  footer: {
    thank_you: string;
    message: string;
    website: string;
    support: string;
    disclaimer: string;
  };
  qr_data: string;
}

export interface CreateParcelResponse {
  success: boolean;
  message: string;
  data: {
    parcel: Parcel;
    receipt: Receipt;
  };
}

export interface CreateParcelData {
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string;
  destination_branch: string;
  weight?: number;
  amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'destination';
  trip_id?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  town: string;
}

export interface Trip {
  origin_branch_id: any;
  destination_branch_id: any;
  id: string;
  trip_number: string;
  route: string;
  vehicle_plate: string;
  driver_name: string;
}

export const branchParcelsApi = {
  // Get all branches for destination dropdown
  getBranches: async (): Promise<{ success: boolean; data: Branch[] }> => {
    const response = await api.get('/branch/parcels/branches');
    return response.data;
  },

  // Get available trips for assignment
  getAvailableTrips: async (): Promise<{ success: boolean; data: Trip[] }> => {
    const response = await api.get('/branch/parcels/trips/available');
    return response.data;
  },

  // Create new parcel - Updated with correct return type
  createParcel: async (data: CreateParcelData): Promise<CreateParcelResponse> => {
  console.log("=".repeat(50));
  console.log("📤 FRONTEND: Creating parcel");
  console.log("=".repeat(50));
  console.log("Request data:", JSON.stringify(data, null, 2));
  console.log("URL: POST /branch/parcels");
  
  try {
    const response = await api.post('/branch/parcels', data);
    console.log("✅ Response received:", {
      status: response.status,
      data: response.data
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Request failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    throw error;
  }
},

  // Get wallet info for balance check
  getWalletInfo: async (): Promise<{ success: boolean; data: { balance: number; low_balance: boolean } }> => {
    const response = await api.get('/branch/parcels/wallet');
    return response.data;
  },

  // Generate tracking number preview
  previewTracking: async (destinationBranch: string): Promise<{ success: boolean; data: { tracking_number: string } }> => {
    const response = await api.get('/branch/parcels/preview-tracking', { 
      params: { destination: destinationBranch } 
    });
    return response.data;
  }
};