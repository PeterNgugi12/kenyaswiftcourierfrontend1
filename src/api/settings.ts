import api from "./axios";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  roleLabel?: string;
  is_active: boolean;
  created_at: string;
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

export const settingsApi = {
  // Get user profile
  getProfile: async (): Promise<{ success: boolean; data: UserProfile }> => {
    const response = await api.get('/super-admin/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: UserProfile }> => {
    const response = await api.put('/super-admin/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/super-admin/change-password', data);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<{ success: boolean; data: NotificationPreferences }> => {
    const response = await api.get('/super-admin/notifications');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data: NotificationPreferences): Promise<{ success: boolean; message: string; data: NotificationPreferences }> => {
    const response = await api.put('/super-admin/notifications', data);
    return response.data;
  },

  // Delete account
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/super-admin/account');
    return response.data;
  }
};