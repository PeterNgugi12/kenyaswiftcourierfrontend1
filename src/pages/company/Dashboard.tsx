import { Package, TrendingUp, Truck, Users, DollarSign, GitBranch, ArrowUpRight, Clock, CheckCircle, Wallet, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useCompanyDashboard } from "@/hooks/useCompanyDashboard";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

const CompanyDashboard = () => {
  const { 
    stats, 
    loading, 
    weekData, 
    branchData, 
    recentTrips, 
    activeTripsCount,
    wallet,
    formatDate 
  } = useCompanyDashboard();

  const [isMobile, setIsMobile] = useState(false);
  const [showAllBranches, setShowAllBranches] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLow = wallet.isLow;
  const companyName = stats?.company_name || "Company";

  // Limit branches shown on mobile
  const displayedBranches = isMobile && !showAllBranches 
    ? branchData.slice(0, 3) 
    : branchData;

  // Mobile trip card component
  const MobileTripCard = ({ trip }: { trip: any }) => (
    <div className="mobile-trip-card p-3 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--navy)/0.1)" }}>
          <Truck className="w-5 h-5" style={{ color: "hsl(var(--navy))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm truncate">{trip.route}</span>
            <span className="font-mono text-xs text-muted-foreground">{trip.trip_id}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {trip.vehicle} • {trip.driver}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{trip.parcels} parcels</span>
            <span className={
              trip.status === "arrived" || trip.status === "delivered" ? "badge-success text-xs" :
              trip.status === "in_transit" ? "badge-info text-xs" : 
              trip.status === "departed" ? "badge-warning text-xs" : "badge-secondary text-xs"
            }>
              {trip.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Company Dashboard</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? companyName : `${companyName} • ${new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          Today: {formatDate()}
        </div>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{stats?.parcels_this_month?.toLocaleString() || '0'}</div>
          <div className="kpi-label text-xs sm:text-sm">Parcels This Month</div>
          <div className="kpi-change text-xs text-muted-foreground">
            {stats?.parcels_change > 0 ? '+' : ''}{stats?.parcels_change}% vs last month
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{formatCurrency(stats?.revenue_this_month || 0)}</div>
          <div className="kpi-label text-xs sm:text-sm">Revenue</div>
          <div className="kpi-change text-xs text-muted-foreground">@ KES {stats?.revenue_rate || 5}/parcel</div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{stats?.active_vehicles || 0} / {stats?.total_vehicles || 0}</div>
          <div className="kpi-label text-xs sm:text-sm">Active Vehicles</div>
          <div className="kpi-change text-xs text-muted-foreground">{stats?.vehicles_in_maintenance || 0} on maintenance</div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-lg sm:text-2xl">{stats?.active_drivers || 0}</div>
          <div className="kpi-label text-xs sm:text-sm">Active Drivers</div>
          <div className="kpi-change text-xs text-muted-foreground">{stats?.drivers_on_leave || 0} on leave</div>
        </div>
      </div>

      {/* Charts Row - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4 mb-4 sm:mb-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">Parcels This Week</h3>
          <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Daily booking volume</p>
          <div className="h-[180px] sm:h-[200px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={isMobile ? 20 : 28}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={isMobile ? 30 : 40}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="parcels" fill="hsl(220,70%,18%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Performance */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-4">Branch Performance</h3>
          <div className="space-y-3">
            {displayedBranches.map((b, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground truncate max-w-[150px]">{b.branch_name}</span>
                  <span className="text-muted-foreground">{b.parcels}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${b.percentage}%`, background: "hsl(var(--navy))" }} 
                  />
                </div>
              </div>
            ))}
            
            {/* Show more/less button on mobile */}
            {isMobile && branchData.length > 3 && (
              <button
                onClick={() => setShowAllBranches(!showAllBranches)}
                className="w-full mt-2 text-xs text-navy font-medium py-2 border-t border-border"
              >
                {showAllBranches ? 'Show Less' : `Show ${branchData.length - 3} More Branches`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="form-section p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Recent Trips</h3>
          <span className="badge-info text-xs">{activeTripsCount} active today</span>
        </div>
        
        {isMobile ? (
          /* Mobile Trip Cards */
          <div className="space-y-2">
            {recentTrips.length > 0 ? (
              recentTrips.slice(0, 3).map((t, index) => (
                <MobileTripCard key={index} trip={t} />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent trips found
              </div>
            )}
            
            {recentTrips.length > 3 && (
              <button className="w-full mt-2 text-xs text-navy font-medium py-2 border-t border-border">
                View All Trips →
              </button>
            )}
          </div>
        ) : (
          /* Desktop Trip List */
          <div className="space-y-3">
            {recentTrips.length > 0 ? (
              recentTrips.map((t, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--navy)/0.1)" }}>
                    <Truck className="w-5 h-5" style={{ color: "hsl(var(--navy))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{t.route}</span>
                      <span className="font-mono text-xs text-muted-foreground">{t.trip_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.vehicle} • {t.driver} • {t.parcels} parcels
                    </div>
                  </div>
                  <span className={
                    t.status === "arrived" || t.status === "delivered" ? "badge-success" :
                    t.status === "in_transit" ? "badge-info" : 
                    t.status === "departed" ? "badge-warning" : "badge-secondary"
                  }>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent trips found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet Status Card - Mobile Optimized */}
      <div className="mt-4 form-section p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLow ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Wallet Balance</div>
              <div className={`text-xl sm:text-2xl font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>
                {formatCurrency(wallet.balance)}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isLow && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg w-full sm:w-auto">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Low balance — top up now</span>
              </div>
            )}
            <a href="/company/wallet" className="badge-navy inline-flex items-center gap-1 px-4 py-2 w-full sm:w-auto justify-center">
              View Wallet
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Quick Stats Row */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Branches</div>
            <div className="text-lg font-bold text-foreground">{branchData.length}</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Active Today</div>
            <div className="text-lg font-bold text-foreground">{activeTripsCount}</div>
          </div>
        </div>
      )}

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-trip-card {
          @apply bg-card border border-border rounded-xl;
        }
      `}</style>
    </div>
  );
};

export default CompanyDashboard;