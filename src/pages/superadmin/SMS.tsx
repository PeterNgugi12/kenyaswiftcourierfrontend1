import { useState, useEffect } from "react";
import { 
  MessageSquare, CheckCircle, XCircle, Clock, 
  RefreshCw, Filter, Loader2, Search, ChevronDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useSMS } from "@/hooks/useSMS";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;

const SuperAdminSMS = () => {
  const { 
    logs, 
    uiStats, 
    loading, 
    total, 
    page, 
    setPage, 
    status, 
    setStatus,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resendSMS,
    refresh,
    statusOptions
  } = useSMS();

  const [showFilters, setShowFilters] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSMS, setSelectedSMS] = useState<any>(null);
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

  // Filter logs for display (client-side filtering based on search)
  const filtered = logs.filter(log => 
    log.receiver.toLowerCase().includes(search.toLowerCase()) ||
    log.to.includes(search) ||
    log.tracking.toLowerCase().includes(search.toLowerCase())
  );
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await resendSMS(id);
      if (isMobile) setShowDetailsModal(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setResendingId(null);
    }
  };

  const handleRefresh = () => {
    refresh();
    toast.success('SMS logs refreshed');
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'delivered': return 'badge-success';
      case 'failed': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  // Mobile SMS card component
  const MobileSMSCard = ({ sms }: { sms: any }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => {
        setSelectedSMS(sms);
        setShowDetailsModal(true);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-muted-foreground mb-1">SMS ID</div>
          <div className="font-mono text-xs font-medium">{sms.sms_id}</div>
        </div>
        <span className={getStatusBadge(sms.status)}>
          {sms.status}
        </span>
      </div>

      {/* Receiver Info */}
      <div className="mb-2">
        <div className="text-xs text-muted-foreground">Receiver</div>
        <div className="text-sm font-medium">{sms.receiver}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sms.to}</div>
      </div>

      {/* Tracking and Date */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-muted-foreground">Tracking</div>
          <span className="font-mono text-xs badge-navy inline-block mt-1">{sms.tracking}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Time</div>
          <div className="text-xs">{sms.time}</div>
          <div className="text-xs text-muted-foreground">{sms.date}</div>
        </div>
      </div>

      {/* Cost and Actions */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground">Cost</div>
          <div className="text-sm font-semibold">{sms.cost}</div>
        </div>
        {sms.status === "failed" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              handleResend(sms.id);
            }}
            disabled={resendingId === sms.id}
          >
            {resendingId === sms.id ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            Resend
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile SMS Details Modal
  const SMSDetailsModal = () => {
    if (!selectedSMS) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">SMS Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <span className={getStatusBadge(selectedSMS.status)}>
                {selectedSMS.status}
              </span>
            </div>

            {/* SMS Info */}
            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">SMS ID</div>
                <div className="font-mono text-sm">{selectedSMS.sms_id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tracking Number</div>
                <div className="font-mono text-sm badge-navy inline-block">{selectedSMS.tracking}</div>
              </div>
            </div>

            {/* Receiver Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">RECEIVER INFORMATION</h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="text-sm font-medium">{selectedSMS.receiver}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm">{selectedSMS.to}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TIMELINE</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-sm">{selectedSMS.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Time</span>
                  <span className="text-sm">{selectedSMS.time}</span>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Cost</span>
                <span className="text-lg font-bold text-foreground">{selectedSMS.cost}</span>
              </div>
            </div>

            {/* Resend Button for Failed Messages */}
            {selectedSMS.status === "failed" && (
              <Button 
                className="w-full gap-2 h-11"
                onClick={() => handleResend(selectedSMS.id)}
                disabled={resendingId === selectedSMS.id}
              >
                {resendingId === selectedSMS.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                {resendingId === selectedSMS.id ? 'Resending...' : 'Resend SMS'}
              </Button>
            )}

            {/* Close Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading.logs && logs.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">SMS Monitor</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'SMS delivery tracking' : 'Platform-wide SMS delivery tracking'}
          </p>
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? 'Hide' : 'Filters'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            onClick={handleRefresh}
            disabled={loading.logs}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading.logs ? 'animate-spin' : ''}`} />
            {isMobile ? '' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filter Bar - Mobile Optimized */}
      {showFilters && (
        <div className="mb-4 p-3 sm:p-4 bg-card rounded-xl border animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Status</label>
              <select 
                className="w-full h-9 px-3 border rounded-lg bg-background text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">From Date</label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">To Date</label>
              <Input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 text-xs"
                onClick={() => {
                  setStatus('');
                  setFromDate('');
                  setToDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{uiStats.sentToday}</div>
            <div className="text-xs text-muted-foreground truncate">Sent Today</div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{uiStats.deliveredToday}</div>
            <div className="text-xs text-muted-foreground truncate">Delivered</div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{uiStats.failedToday}</div>
            <div className="text-xs text-muted-foreground truncate">Failed</div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{uiStats.pendingToday}</div>
            <div className="text-xs text-muted-foreground truncate">Pending</div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {isMobile && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search receiver, phone, tracking..." 
              className="pl-9 h-10 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* SMS Display - Mobile Cards or Desktop Table */}
      <div className="form-section p-0 sm:p-4 overflow-hidden">
        <div className="p-4 sm:p-0">
          {/* Desktop Header */}
          {!isMobile && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent SMS Logs</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search receiver, phone, tracking..." 
                  className="pl-9 text-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {isMobile ? (
            // Mobile Card View
            <div className="space-y-3">
              {paged.length > 0 ? (
                paged.map((sms) => (
                  <MobileSMSCard key={sms.id} sms={sms} />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No SMS logs found</p>
                  {search && (
                    <div className="mt-2">
                      <p className="text-xs mb-2">Try adjusting your search</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSearch('');
                          toast('Search cleared', { icon: '🧹' });
                        }}
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <>
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-xs">SMS ID</th>
                      <th className="text-xs">Receiver</th>
                      <th className="text-xs">Phone</th>
                      <th className="text-xs">Tracking</th>
                      <th className="text-xs">Time</th>
                      <th className="text-xs">Status</th>
                      <th className="text-xs">Cost</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length > 0 ? (
                      paged.map((s) => (
                        <tr key={s.id}>
                          <td className="font-mono text-xs text-muted-foreground">{s.sms_id}</td>
                          <td className="font-medium text-foreground text-sm">
                            {s.receiver}
                            <div className="text-xs text-muted-foreground">{s.date}</div>
                          </td>
                          <td className="text-muted-foreground text-xs">{s.to}</td>
                          <td>
                            <span className="font-mono text-xs badge-navy">{s.tracking}</span>
                          </td>
                          <td className="text-muted-foreground text-xs">{s.time}</td>
                          <td>
                            <span className={getStatusBadge(s.status)}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-foreground font-medium text-xs">{s.cost}</td>
                          <td>
                            {s.status === "failed" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs h-7 px-2"
                                onClick={() => handleResend(s.id)}
                                disabled={resendingId === s.id}
                              >
                                {resendingId === s.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Resend'
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          No SMS logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-4 px-4 sm:px-0">
              <TablePagination 
                currentPage={page} 
                totalItems={filtered.length} 
                pageSize={PAGE_SIZE} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <SMSDetailsModal />}

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
      `}</style>
    </div>
  );
};

export default SuperAdminSMS;
