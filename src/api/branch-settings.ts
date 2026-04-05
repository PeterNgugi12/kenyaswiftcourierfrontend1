// src/api/branch-settings.ts
import api from "./axios";

export interface BranchProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  branch: {
    id: string;
    name: string;
    code: string;
    company_id: string;
    company_name?: string;
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

export const branchSettingsApi = {
  // Get branch operator profile
  getProfile: async (): Promise<{ success: boolean; data: BranchProfile }> => {
    const response = await api.get('/branch/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: BranchProfile }> => {
    const response = await api.put('/branch/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/branch/auth/change-password', data);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<{ success: boolean; data: NotificationPreferences }> => {
    const response = await api.get('/branch/auth/notifications');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data: NotificationPreferences): Promise<{ success: boolean; message: string; data: NotificationPreferences }> => {
    const response = await api.put('/branch/auth/notifications', data);
    return response.data;
  },

  // Delete account (deactivate)
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/branch/auth/account');
    return response.data;
  }
};