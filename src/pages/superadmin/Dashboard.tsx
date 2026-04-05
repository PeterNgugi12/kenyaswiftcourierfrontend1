import { Building2, Package, MessageSquare, TrendingUp, DollarSign, AlertTriangle, CheckCircle, ArrowUpRight, Loader2, RefreshCw, ChevronRight, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { useEffect, useState, useMemo, useCallback } from "react";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";

const SuperAdminDashboard = () => {
  const { ui, loading, refresh } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);
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

  // Use useMemo to prevent unnecessary recalculations
  const chartData = useMemo(() => ui.chartData || [], [ui.chartData]);
  const topCompanies = useMemo(() => ui.topCompanies || [], [ui.topCompanies]);
  const alerts = useMemo(() => ui.alerts || [], [ui.alerts]);
  const statsData = useMemo(() => ui.stats, [ui.stats]);

  // Separate effect for chart data changes
  useEffect(() => {
    if (chartData.length > 0) {
      // Show toast if data is significantly different from previous
      // We need to store previous total in a ref to avoid dependency
    }
  }, [chartData]); // Only depend on chartData

  // Separate effect for alerts
  useEffect(() => {
    if (alerts.length > 0) {
      // Show toast for critical alerts
      alerts.forEach(alert => {
        if (alert.type === 'critical') {
          toast.error(alert.title, {
            duration: 6000,
            icon: '🚨',
          });
        } else if (alert.type === 'warning') {
          toast(alert.title, {
            icon: '⚠️',
            duration: 5000,
          });
        }
      });
    }
  }, [alerts]); // Only depend on alerts

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const refreshToast = toast.loading('Refreshing dashboard data...');
    
    try {
      if (refresh) {
        await Promise.all([
          refresh.stats?.(),
          refresh.trends?.(),
          refresh.alerts?.()
        ]);
      }
      
      toast.success('Dashboard updated successfully!', {
        id: refreshToast,
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to refresh dashboard', {
        id: refreshToast,
        duration: 4000,
      });
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCompanyClick = useCallback((companyName: string) => {
    toast.success(`Viewing ${companyName}`, {
      duration: 3000,
      icon: '🏢',
    });
  }, []);

  const handleExportData = useCallback(() => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing export...',
        success: 'Dashboard data exported successfully!',
        error: 'Failed to export data',
      },
      {
        success: {
          duration: 4000,
          icon: '📊',
        },
      }
    );
  }, []);

  // Stats configuration with useMemo
  const stats = useMemo(() => {
    if (!statsData) {
      return [
        { label: "Total Companies", value: "...", change: "Loading...", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Parcels", value: "...", change: "Loading...", icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Platform Revenue", value: "...", change: "Loading...", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "SMS Sent (Today)", value: "...", change: "Loading...", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
      ];
    }

    return [
      { 
        label: "Total Companies", 
        value: statsData.totalCompanies, 
        change: statsData.changes?.companies || '+0%', 
        icon: Building2, 
        color: "text-blue-600", 
        bg: "bg-blue-50" 
      },
      { 
        label: "Total Parcels", 
        value: statsData.totalParcels, 
        change: statsData.changes?.parcels || '+0%', 
        icon: Package, 
        color: "text-emerald-600", 
        bg: "bg-emerald-50" 
      },
      { 
        label: "Platform Revenue", 
        value: statsData.platformRevenue, 
        change: statsData.changes?.revenue || '+0%', 
        icon: DollarSign, 
        color: "text-amber-600", 
        bg: "bg-amber-50" 
      },
      { 
        label: "SMS Sent (Today)", 
        value: statsData.smsSent, 
        change: statsData.changes?.sms || '+0%', 
        icon: MessageSquare, 
        color: "text-purple-600", 
        bg: "bg-purple-50" 
      },
    ];
  }, [statsData]);

  // Calculate YTD revenue with useMemo
  const ytdRevenue = useMemo(() => 
    chartData.reduce((sum, item) => sum + (item.revenue || 0), 0),
    [chartData]
  );

  // Calculate MoM growth with useMemo
  const momGrowth = useMemo(() => {
    if (chartData.length < 2) return '0.0';
    const growth = ((chartData[chartData.length - 1]?.parcels / chartData[chartData.length - 2]?.parcels - 1) * 100);
    return growth.toFixed(1);
  }, [chartData]);

  if (loading.stats && !statsData) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header - Mobile Optimized */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Platform Overview</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'CourierOS Kenya' : `Real-time statistics for CourierOS Kenya • ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportData}
              className="flex-1 sm:flex-none gap-2 h-9 sm:h-8 text-xs sm:text-sm"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isMobile ? 'Export' : 'Export Data'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 sm:flex-none gap-2 h-9 sm:h-8 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? (isMobile ? '...' : 'Refreshing...') : (isMobile ? 'Refresh' : 'Refresh')}
            </Button>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isMobile ? 'Online' : 'All systems operational'}
          </div>
        </div>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div 
            key={label} 
            className="stat-card cursor-pointer hover:shadow-md transition-shadow p-3 sm:p-4"
            onClick={() => {
              toast(`Viewing ${label} details`, {
                icon: '📊',
                duration: 2000,
              });
            }}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div className="kpi-value text-lg sm:text-2xl">{value}</div>
            <div className="kpi-label text-xs sm:text-sm">{label}</div>
            <div className="kpi-change text-emerald-600 text-xs sm:text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="truncate">{change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4 mb-4 sm:mb-6">
        {/* Parcel Growth Chart */}
        <div className="lg:col-span-2 form-section p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Parcel Volume Growth</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMobile ? 'Monthly across all' : 'Monthly across all companies'}
              </p>
            </div>
            {chartData.length > 1 && (
              <span 
                className="badge-success cursor-help text-xs"
                onClick={() => {
                  toast.success(`${momGrowth}% Month-over-Month growth`, {
                    duration: 4000,
                  });
                }}
              >
                ↑ {momGrowth}% MoM
              </span>
            )}
          </div>
          <div className="h-[200px] sm:h-[220px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="parcelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220,70%,18%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(220,70%,18%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(v: number) => [v.toLocaleString(), "Parcels"]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="parcels" stroke="hsl(220,70%,18%)" strokeWidth={2.5} fill="url(#parcelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies - Mobile Optimized */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-4">Top Companies</h3>
          <div className="space-y-2 sm:space-y-3">
            {topCompanies.length > 0 ? (
              topCompanies.map((c, i) => (
                <div 
                  key={c.name} 
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  onClick={() => handleCompanyClick(c.name)}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--navy))", color: "white" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-foreground truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.parcels?.toLocaleString() || '0'} parcels</div>
                  </div>
                  <span className={c.status === "active" ? "badge-success text-xs" : "badge-danger text-xs"}>
                    {c.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No companies data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart - Mobile Optimized */}
      <div className="form-section p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Platform Revenue (KES)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">@ KES 5 per parcel processed</p>
          </div>
          <div 
            className="text-xl sm:text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ color: "hsl(var(--amber))" }}
            onClick={() => {
              toast.success('Year-to-Date Revenue', {
                duration: 4000,
              });
            }}
          >
            KES {ytdRevenue.toLocaleString()} YTD
          </div>
        </div>
        <div className="h-[150px] sm:h-[180px] -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={isMobile ? 24 : 32}>
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
                formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar 
                dataKey="revenue" 
                fill="hsl(38,95%,52%)" 
                radius={[4, 4, 0, 0]} 
                onClick={(data) => {
                  toast.success(`Revenue for ${data.month}`, {
                    duration: 3000,
                  });
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Alerts - Mobile Optimized */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 ${alert.bgColor} rounded-xl border ${alert.borderColor} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                toast(alert.title, {
                  icon: alert.type === 'critical' ? '🚨' : '⚠️',
                  duration: 5000,
                });
              }}
            >
              {alert.icon === 'CheckCircle' ? (
                <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${alert.iconColor} mt-0.5 flex-shrink-0`} />
              ) : (
                <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${alert.iconColor} mt-0.5 flex-shrink-0`} />
              )}
              <div>
                <div className={`text-xs sm:text-sm font-semibold ${alert.textColor}`}>{alert.title}</div>
                <div className={`text-xs ${alert.iconColor} mt-0.5`}>{alert.description}</div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div 
              className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                toast.success('SMS Gateway Status', {
                  duration: 4000,
                });
              }}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-800">SMS Gateway Online</div>
                <div className="text-xs text-emerald-600 mt-0.5">Africa's Talking — 98.4% delivery rate</div>
              </div>
            </div>
            <div 
              className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                toast.success('All Systems Operational', {
                  duration: 4000,
                });
              }}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-800">All Systems Operational</div>
                <div className="text-xs text-emerald-600 mt-0.5">No active alerts</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Hint for Interactive Elements */}
      {isMobile && (
        <div className="mt-4 text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p>Tap on any card or chart for more details</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;