import { useState, useEffect } from "react";
import { Package, TrendingUp, Truck, Clock, CheckCircle, Unlock, ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useBranchDashboard } from "@/hooks/useBranchDashboard";
import { useBranchLayout } from "@/hooks/useBranchLayout";

const PAGE_SIZE = 5;

const BranchDashboard = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  
  const { branchInfo } = useBranchLayout();
  const { 
    stats, 
    recentParcels, 
    overdueCount, 
    loading, 
    currentDate,
    formatCurrency,
    getStatusBadge,
    getPaymentBadge
  } = useBranchDashboard();

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

  const statsCards = [
    { 
      label: "Booked Today", 
      value: stats?.booked_today?.toString() || "0", 
      change: stats?.booked_today_change 
        ? `${stats.booked_today_change > 0 ? '+' : ''}${stats.booked_today_change}% vs yesterday`
        : "No bookings yet",
      icon: Package, 
      colorClass: "text-blue-600 bg-blue-50" 
    },
    { 
      label: "Trips Departed", 
      value: stats?.trips_departed?.toString() || "0", 
      change: `${stats?.trips_in_transit || 0} in transit`,
      icon: Truck, 
      colorClass: "text-amber-600 bg-amber-50" 
    },
    { 
      label: "Arrivals Today", 
      value: stats?.arrivals_today?.toString() || "0", 
      change: `${stats?.arrived_parcels || 0} parcels arrived`,
      icon: CheckCircle, 
      colorClass: "text-emerald-600 bg-emerald-50" 
    },
    { 
      label: "Pending Pickup", 
      value: stats?.pending_pickup?.toString() || "0", 
      change: `${stats?.overdue_pickup || 0} overdue ${stats?.overdue_pickup === 1 ? 'day' : 'days'}`,
      icon: Clock, 
      colorClass: "text-red-600 bg-red-50" 
    },
  ];

  const quickActions = [
    { label: "Book Parcel", icon: Package, path: "/branch/book-parcel", color: "hsl(var(--navy))", desc: "New booking" },
    { label: "Create Trip", icon: Truck, path: "/branch/trips", color: "hsl(38,95%,52%)", desc: "Departure" },
    { label: "Receive Parcels", icon: CheckCircle, path: "/branch/receive", color: "hsl(142,71%,38%)", desc: "Mark arrived" },
    { label: "Release Parcel", icon: Unlock, path: "/branch/release", color: "hsl(0,84%,58%)", desc: "Pickup verify" },
  ];

  const paged = paginate(recentParcels, page, PAGE_SIZE);

  // For mobile view, we'll create a card view for recent parcels
  const renderMobileParcels = () => {
    if (paged.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No recent parcels found
        </div>
      );
    }

    return paged.map(p => (
      <div key={p.tracking_number} className="mobile-card mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
            #{p.tracking_number}
          </span>
          <span className={getStatusBadge(p.status)}>
            {p.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="text-xs text-muted-foreground block">From</span>
            <span className="font-medium text-foreground">{p.sender_name}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">To</span>
            <span className="font-medium text-foreground">{p.receiver_name}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground block">Destination</span>
            <span className="text-sm text-foreground">{p.destination_branch}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Amount</span>
            <span className="font-semibold text-foreground text-sm">
              {formatCurrency(p.amount)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Payment</span>
            <span className={getPaymentBadge(p.payment_status)}>
              {p.payment_status === 'paid' ? 'Paid' : 'Pay at dest'}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Branch Dashboard</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {branchInfo?.name || 'Branch'} • {currentDate}
          </p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 font-medium text-xs sm:text-sm">
              {overdueCount} {overdueCount === 1 ? 'parcel' : 'parcels'} overdue
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {quickActions.map(({ label, icon: Icon, path, color, desc }) => (
          <button 
            key={label} 
            onClick={() => navigate(path)} 
            className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:shadow-elevated transition-all duration-200 text-left group"
          >
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110" 
              style={{ background: color }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="font-semibold text-foreground text-xs sm:text-sm">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{desc}</div>
          </button>
        ))}
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {statsCards.map(({ label, value, change, icon: Icon, colorClass }) => (
          <div key={label} className="stat-card p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </div>
            <div className="kpi-value text-lg sm:text-2xl">{value}</div>
            <div className="kpi-label text-xs sm:text-sm">{label}</div>
            <div className="kpi-change text-xs text-muted-foreground mt-1 truncate">{change}</div>
          </div>
        ))}
      </div>

      {/* Recent Parcels Section */}
      <div className="form-section p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Recent Parcels</h3>
          <button 
            onClick={() => navigate("/branch/parcels")} 
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors" 
            style={{ color: "hsl(var(--navy))" }}
          >
            View all →
          </button>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {renderMobileParcels()}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-xs">Tracking No.</th>
                  <th className="text-xs">Sender</th>
                  <th className="text-xs">Receiver</th>
                  <th className="text-xs">Destination</th>
                  <th className="text-xs">Amount</th>
                  <th className="text-xs">Payment</th>
                  <th className="text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(p => (
                    <tr key={p.tracking_number}>
                      <td>
                        <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
                          {p.tracking_number}
                        </span>
                      </td>
                      <td className="text-foreground text-sm">{p.sender_name}</td>
                      <td className="text-foreground text-sm">{p.receiver_name}</td>
                      <td className="text-muted-foreground text-sm">{p.destination_branch}</td>
                      <td className="font-semibold text-foreground text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span className={getPaymentBadge(p.payment_status)}>
                          {p.payment_status === 'paid' ? 'Paid' : 'Pay at dest'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(p.status)}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No recent parcels found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Works for both views */}
        <div className="mt-4">
          <TablePagination 
            currentPage={page} 
            totalItems={recentParcels.length} 
            pageSize={PAGE_SIZE} 
            onPageChange={setPage} 
          />
        </div>
      </div>

      {/* Add some CSS for mobile cards if not already in your global styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-lg p-3;
        }
      `}</style>
    </div>
  );
};

export default BranchDashboard;
