// src/hooks/useBranchSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { branchSettingsApi, BranchProfile, NotificationPreferences, UpdateProfileData, ChangePasswordData } from '../api/branch-settings';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export interface UseBranchSettingsReturn {
  profile: BranchProfile | null;
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

export const useBranchSettings = (): UseBranchSettingsReturn => {
  const [profile, setProfile] = useState<BranchProfile | null>(null);
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
  const roleLabel = 'Branch Operator';

  const fetchProfile = useCallback(async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const response = await branchSettingsApi.getProfile();
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
      const response = await branchSettingsApi.getNotificationPreferences();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Don't show error toast for notifications fetch failure
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
      const response = await branchSettingsApi.updateProfile(data);
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
      const response = await branchSettingsApi.changePassword(data);
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
      const response = await branchSettingsApi.updateNotificationPreferences(data);
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
      const response = await branchSettingsApi.deleteAccount();
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

  // Get initials from operator name
  const getInitials = (): string => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return 'BO';
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