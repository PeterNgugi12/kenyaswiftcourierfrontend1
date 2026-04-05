import { useState, useEffect, useCallback } from 'react';
import { analyticsApi, CompanyMonthlyData, MarketShareData, RevenueTrend } from '../api/analytics';
import { toast } from 'react-hot-toast';

export const useAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [marketShare, setMarketShare] = useState<MarketShareData[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState({
    monthly: false,
    marketShare: false,
    revenue: false
  });

  const fetchMonthlyData = useCallback(async () => {
    setLoading(prev => ({ ...prev, monthly: true }));
    try {
      const response = await analyticsApi.getCompanyComparison(7);
      if (response.success) {
        setMonthlyData(response.data);
        
        // Extract unique companies from the data
        if (response.data.length > 0) {
          const firstMonth = response.data[0];
          const companyKeys = Object.keys(firstMonth).filter(key => 
            !key.includes('month') && !key.includes('fullMonth') && !key.includes('_name')
          );
          
          const companiesList = companyKeys.map(key => ({
            id: key,
            name: firstMonth[`${key}_name`] || key,
            dataKey: key
          }));
          
          setCompanies(companiesList);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch monthly data:', error);
      toast.error('Failed to load company comparison data');
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  }, []);

  const fetchMarketShare = useCallback(async () => {
    setLoading(prev => ({ ...prev, marketShare: true }));
    try {
      const response = await analyticsApi.getMarketShare();
      if (response.success) {
        setMarketShare(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch market share:', error);
      setMarketShare([]);
    } finally {
      setLoading(prev => ({ ...prev, marketShare: false }));
    }
  }, []);

  const fetchRevenueTrend = useCallback(async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    try {
      const response = await analyticsApi.getRevenueTrend();
      if (response.success) {
        setRevenueTrend(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch revenue trend:', error);
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  }, []);

  useEffect(() => {
    fetchMonthlyData();
    fetchMarketShare();
    fetchRevenueTrend();
  }, [fetchMonthlyData, fetchMarketShare, fetchRevenueTrend]);

  // Transform data to match UI format
  const getChartData = useCallback(() => {
    if (monthlyData.length === 0) {
      // Return empty data with month names
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      return months.map(month => ({
        month,
        ...companies.reduce((acc, company) => ({
          ...acc,
          [company.dataKey]: 0
        }), {})
      }));
    }

    return monthlyData;
  }, [monthlyData, companies]);

  const getMarketShareData = useCallback(() => {
    return marketShare;
  }, [marketShare]);

  const getRevenueData = useCallback(() => {
    if (revenueTrend.length === 0) {
      // Return empty data with month names
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      return months.map(month => ({ month, revenue: 0 }));
    }

    return revenueTrend.map(item => ({
      month: new Date(item.month).toLocaleString('default', { month: 'short' }),
      revenue: item.revenue
    }));
  }, [revenueTrend]);

  return {
    monthlyData,
    companies,
    marketShare,
    revenueTrend,
    loading,
    refresh: {
      monthly: fetchMonthlyData,
      marketShare: fetchMarketShare,
      revenue: fetchRevenueTrend
    },
    // Transformed data for UI
    ui: {
      chartData: getChartData(),
      marketShareData: getMarketShareData(),
      revenueData: getRevenueData()
    }
  };
};