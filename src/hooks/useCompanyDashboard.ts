import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, DashboardStats } from '../api/company-dashboard';
import { toast } from 'react-hot-toast';

export interface UseDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  refreshing: boolean;
  weekData: Array<{ day: string; parcels: number }>;
  branchData: Array<{ branch_name: string; parcels: number; percentage: number }>;
  recentTrips: Array<any>;
  activeTripsCount: number;
  wallet: {
    balance: number;
    isLow: boolean;
  };
  refresh: () => Promise<void>;
  formatDate: () => string;
}

export const useCompanyDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekData, setWeekData] = useState<Array<{ day: string; parcels: number }>>([]);
  const [branchData, setBranchData] = useState<Array<{ branch_name: string; parcels: number; percentage: number }>>([]);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [wallet, setWallet] = useState({ balance: 0, isLow: false });

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
        setWeekData(response.data.weekly_data);
        setBranchData(response.data.branch_performance);
        setRecentTrips(response.data.recent_trips);
        setActiveTripsCount(response.data.active_trips_count);
        setWallet({
          balance: response.data.wallet_balance,
          isLow: response.data.wallet_low_balance
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekData = useCallback(async () => {
    try {
      const response = await dashboardApi.getWeeklyData();
      if (response.success) {
        setWeekData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch week data:', error);
    }
  }, []);

  const fetchBranchData = useCallback(async () => {
    try {
      const response = await dashboardApi.getBranchPerformance();
      if (response.success) {
        setBranchData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch branch data:', error);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      const response = await dashboardApi.getRecentTrips();
      if (response.success) {
        setRecentTrips(response.data);
        setActiveTripsCount(response.active_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch recent trips:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchWeekData();
    fetchBranchData();
    fetchRecentTrips();
  }, [fetchDashboardData, fetchWeekData, fetchBranchData, fetchRecentTrips]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchWeekData(),
      fetchBranchData(),
      fetchRecentTrips()
    ]);
    setRefreshing(false);
  };

  const formatDate = (): string => {
    const today = new Date();
    return today.toLocaleDateString('en-KE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const defaultWeekData = [
    { day: "Mon", parcels: 0 }, { day: "Tue", parcels: 0 },
    { day: "Wed", parcels: 0 }, { day: "Thu", parcels: 0 },
    { day: "Fri", parcels: 0 }, { day: "Sat", parcels: 0 },
    { day: "Sun", parcels: 0 }
  ];

  const defaultBranchData = [
    { branch_name: "Nairobi CBD", parcels: 0, percentage: 0 },
    { branch_name: "Westlands", parcels: 0, percentage: 0 },
    { branch_name: "Kisumu", parcels: 0, percentage: 0 },
    { branch_name: "Mombasa", parcels: 0, percentage: 0 },
    { branch_name: "Eldoret", parcels: 0, percentage: 0 }
  ];

  return {
    stats,
    loading,
    refreshing,
    weekData: weekData.length > 0 ? weekData : defaultWeekData,
    branchData: branchData.length > 0 ? branchData : defaultBranchData,
    recentTrips: recentTrips.length > 0 ? recentTrips : [],
    activeTripsCount,
    wallet,
    refresh,
    formatDate
  };
};