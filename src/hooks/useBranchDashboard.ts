import { useState, useEffect, useCallback } from 'react';
import { branchDashboardApi, DashboardStats, RecentParcel, BranchInfo } from '../api/branch-dashboard';
import { toast } from 'react-hot-toast';

export interface UseBranchDashboardReturn {
  stats: DashboardStats | null;
  recentParcels: RecentParcel[];
  branchInfo: BranchInfo | null;
  overdueCount: number;
  loading: boolean;
  refreshing: boolean;
  currentDate: string;
  refresh: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
  getPaymentBadge: (status: string) => string;
}

export const useBranchDashboard = (): UseBranchDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentParcels, setRecentParcels] = useState<RecentParcel[]>([]);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await branchDashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard stats');
    }
  }, []);

  const fetchRecentParcels = useCallback(async () => {
    try {
      const response = await branchDashboardApi.getRecentParcels(10);
      if (response.success) {
        setRecentParcels(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch recent parcels:', error);
    }
  }, []);

  const fetchBranchInfo = useCallback(async () => {
    try {
      const response = await branchDashboardApi.getBranchInfo();
      if (response.success) {
        setBranchInfo(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch branch info:', error);
    }
  }, []);

  const fetchOverdueAlerts = useCallback(async () => {
    try {
      const response = await branchDashboardApi.getOverdueAlerts();
      if (response.success) {
        setOverdueCount(response.data.count);
      }
    } catch (error: any) {
      console.error('Failed to fetch overdue alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchRecentParcels(),
      fetchBranchInfo(),
      fetchOverdueAlerts()
    ]);
  }, [fetchStats, fetchRecentParcels, fetchBranchInfo, fetchOverdueAlerts]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchRecentParcels(),
      fetchBranchInfo(),
      fetchOverdueAlerts()
    ]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount: number): string => {
    if (!amount) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'badge-navy',
      'booked': 'badge-navy',
      'in_transit': 'badge-info',
      'arrived': 'badge-success',
      'pending_pickup': 'badge-warning',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getPaymentBadge = (status: string): string => {
    if (status === 'paid') return 'badge-success';
    if (status === 'destination') return 'badge-warning';
    return 'badge-secondary';
  };

  const formatDate = (): string => {
    const date = new Date();
    return date.toLocaleDateString('en-KE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return {
    stats,
    recentParcels,
    branchInfo,
    overdueCount,
    loading,
    refreshing,
    currentDate: formatDate(),
    refresh,
    formatCurrency,
    getStatusBadge,
    getPaymentBadge
  };
};