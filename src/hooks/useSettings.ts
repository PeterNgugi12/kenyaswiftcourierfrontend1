import { useState, useEffect, useCallback } from 'react';
import { settingsApi, UserProfile, NotificationPreferences, UpdateProfileData, ChangePasswordData } from '../api/settings';
import { toast } from 'react-hot-toast';

export const useSettings = (role: 'superadmin' | 'company' | 'branch') => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  const roleLabels = {
    superadmin: 'Platform Owner',
    company: 'Company Admin',
    branch: 'Branch Operator'
  };

  const fetchProfile = useCallback(async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const response = await settingsApi.getProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await settingsApi.getNotificationPreferences();
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
      const response = await settingsApi.updateProfile(data);
      if (response.success) {
        setProfile(response.data);
        toast.success(response.message || 'Profile updated successfully');
        return response.data;
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
      const response = await settingsApi.changePassword(data);
      if (response.success) {
        toast.success(response.message || 'Password changed successfully');
        return response;
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
      const response = await settingsApi.updateNotificationPreferences(data);
      if (response.success) {
        setNotifications(response.data);
        toast.success(response.message || 'Notification preferences updated');
        return response.data;
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
      const response = await settingsApi.deleteAccount();
      if (response.success) {
        toast.success(response.message || 'Account deleted successfully');
        // Redirect to login or home page
        window.location.href = '/login';
        return response;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Get initials from full name
  const getInitials = (name: string) => {
    if (!name) return 'SA';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return {
    profile,
    notifications,
    loading,
    roleLabel: roleLabels[role],
    initials: profile?.full_name ? getInitials(profile.full_name) : getInitials(roleLabels[role]),
    updateProfile,
    changePassword,
    updateNotifications,
    deleteAccount,
    refresh: {
      profile: fetchProfile,
      notifications: fetchNotifications
    }
  };
};