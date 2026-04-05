import { useState, useEffect, useCallback } from 'react';
import { companySettingsApi, CompanyProfile, NotificationPreferences, UpdateProfileData, ChangePasswordData } from '../api/company-settings';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export interface UseCompanySettingsReturn {
  profile: CompanyProfile | null;
  notifications: NotificationPreferences;
  loading: {
    profile: boolean;
    update: boolean;
    password: boolean;
    notifications: boolean;
    delete: boolean;
  };
  roleLabel: string;
  initials: string;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateNotifications: (data: NotificationPreferences) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => void;
}

export const useCompanySettings = (): UseCompanySettingsReturn => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: true,
    low_balance_alerts: true
  });
  const [loading, setLoading] = useState({
    profile: false,
    update: false,
    password: false,
    notifications: false,
    delete: false
  });

  const navigate = useNavigate();
  const roleLabel = 'Company Admin';

  const fetchProfile = useCallback(async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const response = await companySettingsApi.getProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await companySettingsApi.getNotificationPreferences();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, [fetchProfile, fetchNotifications]);

  const updateProfile = async (data: UpdateProfileData) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const response = await companySettingsApi.updateProfile(data);
      if (response.success) {
        setProfile(response.data);
        toast.success(response.message || 'Profile updated successfully');
        fetchProfile(); // Refresh to get latest data
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    setLoading(prev => ({ ...prev, password: true }));
    try {
      const response = await companySettingsApi.changePassword(data);
      if (response.success) {
        toast.success(response.message || 'Password changed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const updateNotifications = async (data: NotificationPreferences) => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await companySettingsApi.updateNotificationPreferences(data);
      if (response.success) {
        setNotifications(response.data);
        toast.success(response.message || 'Notification preferences updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update notifications');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const deleteAccount = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const response = await companySettingsApi.deleteAccount();
      if (response.success) {
        toast.success(response.message || 'Account deleted successfully');
        // Clear local storage and redirect to login
        localStorage.clear();
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Get initials from company name or admin name
  const getInitials = (): string => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return 'CA';
  };

  const refresh = () => {
    fetchProfile();
    fetchNotifications();
  };

  return {
    profile,
    notifications,
    loading,
    roleLabel,
    initials: getInitials(),
    updateProfile,
    changePassword,
    updateNotifications,
    deleteAccount,
    refresh
  };
};