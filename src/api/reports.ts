import api from "./axios";

export interface MonthlyStats {
  month: string;
  parcels: number;
  revenue: number;
  sms_count: number;
  sms_cost: number;
}

export interface ReportSummary {
  current_month: {
    parcels: number;
    revenue: number;
    sms_sent: number;
    growth: number;
  };
  monthly_data: MonthlyStats[];
  top_routes?: Array<{
    route: string;
    count: number;
    revenue: number;
  }>;
  top_branches?: Array<{
    branch_id: string;
    branch_name: string;
    parcels: number;
    revenue: number;
  }>;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  year?: number;
  month?: number;
}

export const reportsApi = {
  // Get company reports summary
  getSummary: async (params?: DateRangeParams): Promise<{ success: boolean; data: ReportSummary }> => {
    const response = await api.get('/company/reports/summary', { params });
    return response.data;
  },

  // Get monthly breakdown
  getMonthlyBreakdown: async (params?: DateRangeParams): Promise<{ success: boolean; data: MonthlyStats[] }> => {
    const response = await api.get('/company/reports/monthly', { params });
    return response.data;
  },

  // Export report as PDF
  exportReport: async (format: 'pdf' | 'csv' = 'pdf', params?: DateRangeParams): Promise<Blob> => {
    const response = await api.get('/company/reports/export', { 
      params: { ...params, format },
      responseType: 'blob' 
    });
    return response.data;
  },

  // Get top performing routes
  getTopRoutes: async (limit: number = 5): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get('/company/reports/top-routes', { params: { limit } });
    return response.data;
  },

  // Get branch performance
  getBranchPerformance: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get('/company/reports/branch-performance');
    return response.data;
  }
};