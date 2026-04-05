import { useState, useEffect } from "react";
import { Search, Package, Filter, Loader2, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useBranchAuth } from "@/hooks/useBranchAuth";
import { formatCurrency } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import api from "@/api/axios";

// Types for parcel data from backend
interface Parcel {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description: string;
  origin_branch: string;
  destination_branch: string;
  weight: number;
  amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'destination';
  status: 'pending' | 'booked' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: Parcel[];
  };
}

const statusOptions = ["all", "booked", "in_transit", "arrived", "pending_pickup", "delivered"];
const PAGE_SIZE = 5;

const ParcelList = () => {
  const { user } = useBranchAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch parcels from backend
  const fetchParcels = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };
      
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      console.log("📡 Fetching parcels with params:", params);
      const response = await api.get<ApiResponse>('/branch/parcels', { params });
      
      if (response.data.success) {
        console.log("✅ Parcels fetched:", response.data.data);
        setParcels(response.data.data.data);
        setTotal(response.data.data.total);
        setBranchName(user?.branch?.name || 'Branch');
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch parcels:", error);
      toast.error(error.response?.data?.message || 'Failed to load parcels');
    } finally {
      setLoading(false);
    }
  };

  // Fetch parcels when filters change
  useEffect(() => {
    fetchParcels();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setPage(1);
        fetchParcels();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Map backend status to UI status
  const mapStatus = (backendStatus: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'booked',
      'booked': 'booked',
      'picked_up': 'in_transit',
      'in_transit': 'in_transit',
      'arrived': 'arrived',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[backendStatus] || backendStatus;
  };

  // Format date to "DD MMM" format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Format full date for details
  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge style
  const getStatusBadge = (status: string): string => {
    const uiStatus = mapStatus(status);
    switch (uiStatus) {
      case 'delivered':
        return 'badge-success';
      case 'arrived':
        return 'badge-info';
      case 'in_transit':
        return 'badge-navy';
      case 'pending_pickup':
      case 'booked':
        return 'badge-warning';
      default:
        return 'badge-navy';
    }
  };

  const handleFilterChange = (s: string) => { 
    setStatusFilter(s); 
    setPage(1); 
    setShowMobileFilters(false);
  };

  const handleSearchChange = (v: string) => { 
    setSearch(v); 
  };

  const handleParcelClick = (parcel: Parcel) => {
    if (isMobile) {
      setSelectedParcel(parcel);
      setShowDetailsModal(true);
    }
  };

  // Count parcels by status (approximate based on current page for counts)
  const getStatusCount = (status: string): number => {
    if (status === 'all') return total;
    return parcels.filter(p => mapStatus(p.status) === status).length;
  };

  // Mobile parcel card component
  const MobileParcelCard = ({ parcel }: { parcel: Parcel }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => handleParcelClick(parcel)}
    >
      {/* Header with Tracking and Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" style={{ color: "hsl(var(--navy))" }} />
          <span className="font-mono text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>
            {parcel.tracking_number}
          </span>
        </div>
        <span className={getStatusBadge(parcel.status)}>
          {mapStatus(parcel.status).replace("_", " ")}
        </span>
      </div>

      {/* Sender & Receiver */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <span className="text-xs text-muted-foreground block">Sender</span>
          <span className="text-sm font-medium truncate">{parcel.sender_name}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Receiver</span>
          <span className="text-sm font-medium truncate">{parcel.receiver_name}</span>
        </div>
      </div>

      {/* Destination & Amount */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-xs text-muted-foreground block">Destination</span>
          <span className="text-sm truncate">{parcel.destination_branch}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Amount</span>
          <span className="font-semibold text-sm">{formatCurrency(parcel.amount)}</span>
        </div>
      </div>

      {/* Footer with Date and Payment */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatDate(parcel.created_at)}
        </span>
        <span className={parcel.payment_status === 'paid' ? "badge-success text-xs" : "badge-warning text-xs"}>
          {parcel.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
        </span>
      </div>
    </div>
  );

  // Mobile Details Modal
  const ParcelDetailsModal = () => {
    if (!selectedParcel) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Parcel Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Tracking */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-xs text-blue-600 mb-1">Tracking Number</div>
              <div className="text-xl font-mono font-bold" style={{ color: "hsl(var(--navy))" }}>
                {selectedParcel.tracking_number}
              </div>
            </div>

            {/* Status & Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <span className={getStatusBadge(selectedParcel.status)}>
                  {mapStatus(selectedParcel.status).replace("_", " ")}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Payment</div>
                <span className={selectedParcel.payment_status === 'paid' ? "badge-success" : "badge-warning"}>
                  {selectedParcel.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>

            {/* Route */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">Route</div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-xs text-muted-foreground">FROM</div>
                  <div className="font-medium text-sm">{selectedParcel.origin_branch}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center flex-1">
                  <div className="text-xs text-muted-foreground">TO</div>
                  <div className="font-medium text-sm">{selectedParcel.destination_branch}</div>
                </div>
              </div>
            </div>

            {/* Sender & Receiver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">📤 Sender</div>
                <div className="font-medium text-sm">{selectedParcel.sender_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{selectedParcel.sender_phone}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">📥 Receiver</div>
                <div className="font-medium text-sm">{selectedParcel.receiver_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{selectedParcel.receiver_phone}</div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">📦 Parcel Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Description:</span>
                  <span className="text-sm font-medium">{selectedParcel.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Weight:</span>
                  <span className="text-sm font-medium">{selectedParcel.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Amount:</span>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(selectedParcel.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Payment Method:</span>
                  <span className="text-sm font-medium">{selectedParcel.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div className="text-center text-xs text-muted-foreground border-t pt-3">
              Created: {formatFullDate(selectedParcel.created_at)}
            </div>
          </div>

          {/* Close Button */}
          <div className="p-4 border-t">
            <Button 
              onClick={() => setShowDetailsModal(false)} 
              className="w-full"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && parcels.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">All Parcels</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {total} parcels at {branchName || 'Branch'}
          </p>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && (
        <div className="flex gap-2 mb-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2 h-10"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? 'All Parcels' : `Filter: ${statusFilter.replace('_', ' ')}`}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input 
              value={search} 
              onChange={e => handleSearchChange(e.target.value)} 
              placeholder="Search..." 
              className="pl-9 w-full h-10"
            />
          </div>
        </div>
      )}

      {/* Status Filters - Mobile Dropdown */}
      {isMobile && showMobileFilters && (
        <div className="mobile-card p-3 mb-4 animate-slide-down">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <button 
                key={s} 
                onClick={() => handleFilterChange(s)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all capitalize flex-1 ${
                  statusFilter === s 
                    ? "text-white" 
                    : "bg-muted text-muted-foreground"
                }`}
                style={statusFilter === s ? { background: "hsl(var(--navy))" } : {}}
              >
                {s.replace("_", " ")} 
                <span className="ml-1 text-xs opacity-75">({getStatusCount(s)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Search and Filters */}
      {!isMobile && (
        <div className="form-section p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={e => handleSearchChange(e.target.value)} 
                placeholder="Search tracking, sender, receiver..." 
                className="pl-9 h-10" 
              />
            </div>
            <Button variant="outline" className="gap-2 h-10">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Desktop Status Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {statusOptions.map(s => (
              <button 
                key={s} 
                onClick={() => handleFilterChange(s)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all capitalize ${
                  statusFilter === s 
                    ? "text-white" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={statusFilter === s ? { background: "hsl(var(--navy))" } : {}}
              >
                {s.replace("_", " ")} ({getStatusCount(s)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parcels Display */}
      <div className="form-section p-0 sm:p-4 overflow-hidden">
        {isMobile ? (
          // Mobile Card View
          <div className="p-4">
            {parcels.length === 0 && !loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No parcels found</p>
                {search && (
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                )}
              </div>
            ) : (
              parcels.map(parcel => <MobileParcelCard key={parcel.id} parcel={parcel} />)
            )}
            
            <div className="mt-4">
              <TablePagination 
                currentPage={page} 
                totalItems={total} 
                pageSize={PAGE_SIZE} 
                onPageChange={setPage} 
              />
            </div>
          </div>
        ) : (
          // Desktop Table View
          <>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="text-xs">Tracking</th>
                    <th className="text-xs">Sender</th>
                    <th className="text-xs">Receiver</th>
                    <th className="text-xs">Destination</th>
                    <th className="text-xs">Date</th>
                    <th className="text-xs">Amount</th>
                    <th className="text-xs">Payment</th>
                    <th className="text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <td>
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
                            {p.tracking_number}
                          </span>
                        </div>
                      </td>
                      <td className="text-foreground text-sm">{p.sender_name}</td>
                      <td className="text-foreground text-sm font-medium">{p.receiver_name}</td>
                      <td className="text-muted-foreground text-sm">{p.destination_branch}</td>
                      <td className="text-muted-foreground text-xs">{formatDate(p.created_at)}</td>
                      <td className="font-semibold text-foreground text-sm">{formatCurrency(p.amount)}</td>
                      <td>
                        <span className={p.payment_status === 'paid' ? "badge-success" : "badge-warning"}>
                          {p.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(p.status)}>
                          {mapStatus(p.status).replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {parcels.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No parcels found</p>
                  {search && (
                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-4 pb-2">
              <TablePagination 
                currentPage={page} 
                totalItems={total} 
                pageSize={PAGE_SIZE} 
                onPageChange={setPage} 
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <ParcelDetailsModal />}

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-xl shadow-sm;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ParcelList;