import api from "./axios";

export interface CompanyMonthlyData {
  month: string;
  [key: string]: string | number; // For dynamic company keys
}

export interface MarketShareData {
  name: string;
  value: number;
  color: string;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

export interface AnalyticsData {
  monthlyData: CompanyMonthlyData[];
  marketShare: MarketShareData[];
  revenueTrend: RevenueTrend[];
}

export const analyticsApi = {
  // Get company comparison data for charts
  getCompanyComparison: async (months: number = 6): Promise<{ success: boolean; data: CompanyMonthlyData[] }> => {
    const response = await api.get(`/analytics/company-comparison?months=${months}`);
    return response.data;
  },

  // Get market share data
  getMarketShare: async (): Promise<{ success: boolean; data: MarketShareData[] }> => {
    const response = await api.get('/analytics/market-share');
    return response.data;
  },

  // Get revenue trend
  getRevenueTrend: async (): Promise<{ success: boolean; data: RevenueTrend[] }> => {
    const response = await api.get('/dashboard/trends');
    return response.data;
  },

  // Get all analytics data in one call
  getAllAnalytics: async (): Promise<{ success: boolean; data: AnalyticsData }> => {
    const [comparison, marketShare, revenue] = await Promise.all([
      api.get('/analytics/company-comparison?months=7'),
      api.get('/analytics/market-share'),
      api.get('/dashboard/trends')
    ]);

    return {
      success: true,
      data: {
        monthlyData: comparison.data.data,
        marketShare: marketShare.data.data,
        revenueTrend: revenue.data.data
      }
    };
  }
};