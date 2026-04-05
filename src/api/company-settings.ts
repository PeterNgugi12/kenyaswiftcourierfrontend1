import api from "./axios";

export interface CompanyProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  company: {
    id: string;
    name: string;
    code: string;
    logo_url?: string;
    status: string;
  };
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  low_balance_alerts: boolean;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const companySettingsApi = {
  // Get company admin profile
  getProfile: async (): Promise<{ success: boolean; data: CompanyProfile }> => {
    const response = await api.get('/company/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: CompanyProfile }> => {
    const response = await api.put('/company/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/company/auth/change-password', data);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<{ success: boolean; data: NotificationPreferences }> => {
    const response = await api.get('/company/auth/notifications');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data: NotificationPreferences): Promise<{ success: boolean; message: string; data: NotificationPreferences }> => {
    const response = await api.put('/company/auth/notifications', data);
    return response.data;
  },

  // Delete account (deactivate)
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/company/auth/account');
    return response.data;
  }
};