import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, DashboardStats, MonthlyTrend, SystemAlert } from '../api/dashboard';
import { toast } from 'react-hot-toast';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert | null>(null);
  const [loading, setLoading] = useState({
    stats: false,
    trends: false,
    alerts: false
  });
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await dashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoading(prev => ({ ...prev, trends: true }));
    try {
      const response = await dashboardApi.getTrends();
      if (response.success) {
        setTrends(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(prev => ({ ...prev, alerts: true }));
    try {
      const response = await dashboardApi.getAlerts();
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTrends();
    fetchAlerts();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchTrends, fetchAlerts]);

  // Transform backend data to match UI format
  const getStatsForUI = useCallback(() => {
    if (!stats) return null;

    return {
      totalCompanies: stats.companies.total.toString(),
      totalParcels: stats.parcels.total.toLocaleString(),
      platformRevenue: `KES ${stats.parcels.total_revenue.toLocaleString()}`,
      smsSent: stats.sms.sent_today.toLocaleString(),
      changes: {
        companies: `+${stats.companies.active} active`,
        parcels: `+${((stats.parcels.total / (stats.parcels.total - stats.parcels.monthly[0]?.parcels || 1)) * 100).toFixed(1)}% vs last month`,
        revenue: `@ KES 5/parcel`,
        sms: `${stats.sms.delivery_rate}% delivery rate`
      }
    };
  }, [stats]);

  // Transform monthly data for charts
  const getChartData = useCallback(() => {
    if (trends.length === 0) return [];

    return trends.map(trend => ({
      month: new Date(trend.month).toLocaleString('default', { month: 'short' }),
      parcels: trend.parcels,
      revenue: trend.revenue
    }));
  }, [trends]);

  // Transform top companies data
  const getTopCompanies = useCallback(() => {
    if (!stats?.top_companies) return [];

    return stats.top_companies.map((company, index) => ({
      name: company.name,
      parcels: company.parcels,
      status: company.status,
      rank: index + 1
    }));
  }, [stats]);

  // Get system alerts for UI
  const getAlertsForUI = useCallback(() => {
    if (!alerts) return [];

    const alertList = [];

    // SMS Gateway alert
    if (alerts.sms_gateway) {
      alertList.push({
        type: 'success',
        title: 'SMS Gateway Online',
        description: `${alerts.sms_gateway.provider} — ${alerts.sms_gateway.delivery_rate}% delivery rate`,
        icon: 'CheckCircle',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-800',
        iconColor: 'text-emerald-600'
      });
    }

    // Suspended companies alerts
    alerts.suspended_companies?.forEach(company => {
      alertList.push({
        type: 'warning',
        title: `${company.name} — Suspended`,
        description: 'Pending payment verification. Review required.',
        icon: 'AlertTriangle',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600'
      });
    });

    // Low balance alerts
    alerts.low_balance_wallets?.forEach(wallet => {
      alertList.push({
        type: 'warning',
        title: `${wallet.company_name} — Low Balance`,
        description: `Balance: KES ${wallet.balance.toLocaleString()}`,
        icon: 'AlertTriangle',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600'
      });
    });

    return alertList;
  }, [alerts]);

  return {
    stats,
    trends,
    alerts,
    loading,
    error,
    refresh: {
      stats: fetchStats,
      trends: fetchTrends,
      alerts: fetchAlerts
    },
    // Transformed data for UI
    ui: {
      stats: getStatsForUI(),
      chartData: getChartData(),
      topCompanies: getTopCompanies(),
      alerts: getAlertsForUI()
    }
  };
};