import api from "./axios";

export interface SMSLog {
  id: string;
  phone_number: string;
  receiver_name: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  cost: number;
  created_at: string;
  sent_at?: string;
  company?: {
    id: string;
    name: string;
    code: string;
  };
  parcel?: {
    id: string;
    tracking_number: string;
  };
}

export interface SMSStats {
  today: {
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    total_cost: number;
  };
  weekly: {
    sent: number;
    delivered: number;
    failed: number;
    delivery_rate: number;
  };
  monthly: {
    sent: number;
    delivered: number;
    failed: number;
    total_cost: number;
  };
  delivery_rate: number;
}

export interface SMSLogsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: SMSLog[];
  };
}

export interface SMSStatsResponse {
  success: boolean;
  data: SMSStats;
}

export const smsApi = {
  // Get SMS logs with pagination and filters
  getLogs: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    company_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<SMSLogsResponse> => {
    const response = await api.get('/sms', { params });
    return response.data;
  },

  // Get SMS statistics
  getStats: async (): Promise<SMSStatsResponse> => {
    const response = await api.get('/sms/stats');
    return response.data;
  },

  // Resend failed SMS
  resendSMS: async (id: string): Promise<{ success: boolean; message: string; data: SMSLog }> => {
    const response = await api.post(`/sms/${id}/resend`);
    return response.data;
  }
};