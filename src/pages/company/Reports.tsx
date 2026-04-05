import { useState, useEffect } from "react";
import { 
  Download, TrendingUp, Package, DollarSign, MessageSquare,
  Calendar, Loader2, FileText, Filter, ChevronDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from "recharts";
import { useReports } from "@/hooks/useReports";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CompanyReports = () => {
  const { 
    stats, 
    chartData, 
    loading, 
    exporting, 
    dateRange,
    exportReport,
    refresh 
  } = useReports();

  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = async (format: 'pdf' | 'csv') => {
    await exportReport(format);
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Reports & Financials</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'Performance summary' : 'Performance summary & analytics'}
          </p>
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            <Calendar className="w-3.5 h-3.5" />
            {isMobile ? 'Date' : 'Date Range'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isMobile ? 'PDF' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Date Range Filter - Mobile Optimized */}
      {showDateFilter && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-xl border animate-fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block">From</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => dateRange.setStartDate(e.target.value)}
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block">To</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => dateRange.setEndDate(e.target.value)}
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refresh();
                setShowDateFilter(false);
              }}
              className="w-full sm:w-auto h-9 sm:h-10 mt-1 sm:mt-0"
            >
              <Filter className="w-3.5 h-3.5 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-2 sm:mb-3">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            {formatNumber(stats.parcelsThisMonth)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Parcels This Month
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 mb-2 sm:mb-3">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            {stats.revenueThisMonth}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Platform Fee
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-2 sm:mb-3">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            {formatNumber(stats.smsThisMonth)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            SMS Sent
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-2 sm:mb-3">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            {stats.growth}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Growth MoM
          </div>
        </div>
      </div>

      {/* Charts - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4">
        <div className="form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Monthly Parcels</h3>
          <div className="h-[180px] sm:h-[220px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={isMobile ? 20 : 28}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={isMobile ? 1 : 0}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={isMobile ? 30 : 40}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), "Parcels"]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="parcels" fill="hsl(220,70%,18%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Platform Fee (KES)</h3>
          <div className="h-[180px] sm:h-[220px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={isMobile ? 1 : 0}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={isMobile ? 35 : 45}
                />
                <Tooltip 
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(38,95%,52%)" 
                  strokeWidth={isMobile ? 2 : 3} 
                  dot={{ fill: "hsl(38,95%,52%)", r: isMobile ? 3 : 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats - Mobile Optimized */}
      {chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Average Monthly Parcels</p>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {formatNumber(Math.round(chartData.reduce((sum, item) => sum + item.parcels, 0) / chartData.length))}
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Average Monthly Revenue</p>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {formatCurrency(Math.round(chartData.reduce((sum, item) => sum + item.revenue, 0) / chartData.length))}
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Best Performing Month</p>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {chartData.reduce((max, item) => item.parcels > max.parcels ? item : max, chartData[0])?.month}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Quick Actions */}
      {isMobile && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="gap-2 h-10 text-sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2 h-10 text-sm"
            onClick={() => refresh()}
          >
            <Filter className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      )}

      {/* Data Freshness Indicator */}
      <div className="mt-4 text-center text-xs text-muted-foreground border-t border-border pt-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default CompanyReports;
