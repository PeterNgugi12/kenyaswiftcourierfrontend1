import { useState, useEffect, useCallback } from 'react';
import { branchLayoutApi, BranchOperatorProfile, BranchNotifications } from '../api/branch-layout';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export interface BranchInfo {
  name: string;
  code: string;
  town: string;
}

export interface UseBranchLayoutReturn {
  profile: BranchOperatorProfile | null;
  notifications: BranchNotifications;
  loading: boolean;
  companyName: string;
  branchName: string;
  branchCode: string;
  branchInfo: BranchInfo;  // Add this
  operatorName: string;
  initials: string;
  pendingPickups: number;
  handleLogout: () => Promise<void>;
}

export const useBranchLayout = (): UseBranchLayoutReturn => {
  const [profile, setProfile] = useState<BranchOperatorProfile | null>(null);
  const [notifications, setNotifications] = useState<BranchNotifications>({
    pending_pickups: 0,
    pending_deliveries: 0,
    recent_alerts: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      const response = await branchLayoutApi.getProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await branchLayoutApi.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role === 'branch') {
      Promise.all([fetchProfile(), fetchNotifications()]);
    } else {
      navigate('/login');
    }
  }, [fetchProfile, fetchNotifications, navigate]);

  const handleLogout = async () => {
    try {
      await branchLayoutApi.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const getInitials = () => {
    if (!profile?.full_name) return 'BO';
    return profile.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Compute values with fallbacks
  const companyName = profile?.branch?.company?.name || 'Company';
  const branchName = profile?.branch?.name || 'Branch';
  const branchCode = profile?.branch?.code || '';
  const branchInfo = {
    name: branchName,
    code: branchCode,
    town: profile?.branch?.town || ''
  };
  const operatorName = profile?.full_name || 'Operator';
  const initials = getInitials();
  const pendingPickups = notifications.pending_pickups || 0;

  return {
    profile,
    notifications,
    loading,
    companyName,
    branchName,
    branchCode,
    branchInfo,  // Now included
    operatorName,
    initials,
    pendingPickups,
    handleLogout
  };
};