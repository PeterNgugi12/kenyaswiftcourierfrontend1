import { useState, useEffect, useCallback } from 'react';
import { reportsApi, ReportSummary, MonthlyStats } from '../api/reports';
import { toast } from 'react-hot-toast';
import { generateCompanyPDF } from '../utils/reports/companyPdfGenerator'; // Import the PDF generator

export interface ChartDataPoint {
  month: string;
  parcels: number;
  revenue: number;
  sms_count: number;
}

export interface UseReportsReturn {
  summary: ReportSummary | null;
  monthlyData: MonthlyStats[];
  loading: boolean;
  exporting: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
  };
  refresh: () => void;
  exportReport: (format?: 'pdf' | 'csv') => Promise<void>;
  chartData: ChartDataPoint[];
  stats: {
    parcelsThisMonth: string;
    revenueThisMonth: string;
    smsThisMonth: string;
    growth: string;
    growthClass: string;
  };
}

export const useReports = (): UseReportsReturn => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await reportsApi.getSummary(params);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchMonthlyData = useCallback(async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await reportsApi.getMonthlyBreakdown(params);
      if (response.success) {
        setMonthlyData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch monthly data:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
    fetchMonthlyData();
  }, [fetchSummary, fetchMonthlyData]);

  const exportReport = async (format: 'pdf' | 'csv' = 'pdf') => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        // Use our custom PDF generator
        await generateAndDownloadPDF();
      } else {
        // Use the existing API export for CSV
        await exportCSV();
      }
      
      toast.success(`Report exported as ${format.toUpperCase()} successfully`);
    } catch (error: any) {
      console.error('Failed to export report:', error);
      toast.error(error.response?.data?.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // New function to generate and download PDF using our custom generator
  const generateAndDownloadPDF = async () => {
    try {
      // Format the data for the PDF generator
      const reportData = {
        stats: {
          parcelsThisMonth: summary?.current_month?.parcels || 0,
          revenueThisMonth: `KES ${(summary?.current_month?.revenue || 0).toLocaleString()}`,
          smsThisMonth: summary?.current_month?.sms_sent || 0,
          growth: summary?.current_month?.growth 
            ? `${summary.current_month.growth > 0 ? '+' : ''}${summary.current_month.growth.toFixed(1)}%` 
            : '0%',
        },
        chartData: monthlyData.map(item => ({
          month: new Date(item.month).toLocaleDateString('en-KE', { 
            month: 'short',
            year: 'numeric'
          }),
          parcels: item.parcels,
          revenue: item.revenue,
          sms: item.sms_count
        })),
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        }
      };

      // Generate the PDF
      const doc = await generateCompanyPDF(reportData);
      
      // Download the PDF
      const fileName = `company-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback to API export if custom PDF fails
      await exportCSV();
      toast.success('PDF generation failed, downloaded CSV instead');
    }
  };

  // Keep the existing CSV export function
  const exportCSV = async () => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const blob = await reportsApi.exportReport('csv', params);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Format chart data for display
  const getChartData = useCallback((): ChartDataPoint[] => {
    if (monthlyData.length === 0) {
      // Return last 6 months with zeros
      const months: ChartDataPoint[] = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
          month: d.toLocaleDateString('en-KE', { month: 'short' }),
          parcels: 0,
          revenue: 0,
          sms_count: 0
        });
      }
      return months;
    }

    return monthlyData.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-KE', { month: 'short' }),
      parcels: item.parcels,
      revenue: item.revenue,
      sms_count: item.sms_count
    }));
  }, [monthlyData]);

  const chartData = getChartData();

  const stats = {
    parcelsThisMonth: summary?.current_month?.parcels.toLocaleString() || '0',
    revenueThisMonth: `KES ${(summary?.current_month?.revenue || 0).toLocaleString()}`,
    smsThisMonth: (summary?.current_month?.sms_sent || 0).toLocaleString(),
    growth: summary?.current_month?.growth 
      ? `${summary.current_month.growth > 0 ? '+' : ''}${summary.current_month.growth.toFixed(1)}%` 
      : '0%',
    growthClass: summary?.current_month?.growth && summary.current_month.growth > 0 
      ? 'text-emerald-600' 
      : summary?.current_month?.growth && summary.current_month.growth < 0 
        ? 'text-red-600' 
        : 'text-muted-foreground'
  };

  return {
    summary,
    monthlyData,
    loading,
    exporting,
    dateRange: {
      startDate,
      endDate,
      setStartDate,
      setEndDate
    },
    refresh: () => {
      fetchSummary();
      fetchMonthlyData();
    },
    exportReport,
    chartData,
    stats
  };
};