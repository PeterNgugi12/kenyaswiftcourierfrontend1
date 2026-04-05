import { useState, useEffect } from "react";
import { Truck, Package, CheckCircle, MessageSquare, Search, ArrowDownToLine, Clock, PackageCheck, Filter, Loader2, AlertTriangle, Calendar, History, Download, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useBranchAuth } from "@/hooks/useBranchAuth";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import api from "@/api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Types
interface Trip {
  id: string;
  trip_number: string;
  origin_branch_id: string;
  origin_branch_name: string;
  destination_branch_id: string;
  destination_branch_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_type: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  departure_time: string;
  arrival_time?: string;
  parcels_count: number;
  status: 'scheduled' | 'departed' | 'in_transit' | 'arrived' | 'cancelled';
  parcels?: Parcel[];
  confirmed_at?: string;
  confirmed_by?: string;
}

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
  arrived_at?: string;
  picked_up_at?: string;
  sms_sent?: boolean;
  sms_sent_at?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: Trip[];
  };
}

interface ParcelApiResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    data: Parcel[];
  };
}

interface HistoryFilters {
  startDate: Date | null;
  endDate: Date | null;
  search: string;
  paymentStatus: 'all' | 'paid' | 'pending';
  smsStatus: 'all' | 'sent' | 'not_sent';
}

const PAGE_SIZE = 5;

const ReceiveParcels = () => {
  const { user } = useBranchAuth();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Pending trips state
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingPage, setPendingPage] = useState(1);
  const [totalPending, setTotalPending] = useState(0);
  
  // History state
  const [historyTrips, setHistoryTrips] = useState<Trip[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalHistory, setTotalHistory] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days default
    endDate: new Date(),
    search: "",
    paymentStatus: 'all',
    smsStatus: 'all'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Shared state
  const [smsSent, setSmsSent] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripParcels, setSelectedTripParcels] = useState<Parcel[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [confirmingTrip, setConfirmingTrip] = useState<string | null>(null);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [parcelPage, setParcelPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch pending/unconfirmed trips
  const fetchPendingTrips = async () => {
    setLoadingPending(true);
    try {
      const params: any = {
        page: pendingPage,
        limit: PAGE_SIZE,
        destination: user?.branch?.id,
        status: 'in_transit',
        date: 'today', // Only today's pending trips
        confirmed: false
      };
      
      if (search) params.search = search;
      
      const response = await api.get<ApiResponse>('/branch/trips/incoming', { params });
      
      if (response.data.success) {
        const unconfirmedTrips = response.data.data.data.filter(trip => 
          trip.status !== 'arrived' && trip.status !== 'cancelled'
        );
        
        setPendingTrips(unconfirmedTrips);
        setTotalPending(response.data.data.total);
        setBranchName(user?.branch?.name || 'Branch');
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch pending trips:", error);
      toast.error(error.response?.data?.message || 'Failed to load incoming trips');
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch history/arrived trips with filters
  const fetchHistoryTrips = async () => {
    setLoadingHistory(true);
    try {
      const params: any = {
        page: historyPage,
        limit: PAGE_SIZE,
        destination: user?.branch?.id,
        status: 'arrived',
        sort: 'arrival_time',
        order: 'DESC'
      };
      
      // Date filters
      if (historyFilters.startDate) {
        params.start_date = historyFilters.startDate.toISOString().split('T')[0];
      }
      if (historyFilters.endDate) {
        params.end_date = historyFilters.endDate.toISOString().split('T')[0];
      }
      
      // Search
      if (historyFilters.search) {
        params.search = historyFilters.search;
      }
      
      // Payment status filter
      if (historyFilters.paymentStatus !== 'all') {
        params.payment_status = historyFilters.paymentStatus;
      }
      
      // SMS status filter
      if (historyFilters.smsStatus !== 'all') {
        params.sms_status = historyFilters.smsStatus === 'sent' ? 'sent' : 'pending';
      }
      
      const response = await api.get<ApiResponse>('/branch/trips/history', { params });
      
      if (response.data.success) {
        setHistoryTrips(response.data.data.data);
        setTotalHistory(response.data.data.total);
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch history:", error);
      toast.error(error.response?.data?.message || 'Failed to load trip history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch parcels for selected trip
  const fetchTripParcels = async (tripId: string) => {
    setLoadingParcels(true);
    try {
      const response = await api.get<ParcelApiResponse>(`/branch/trips/${tripId}/parcels`);
      
      if (response.data.success) {
        setSelectedTripParcels(response.data.data.data);
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch parcels:", error);
      toast.error(error.response?.data?.message || 'Failed to load trip parcels');
    } finally {
      setLoadingParcels(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingTrips();
    } else {
      fetchHistoryTrips();
    }
  }, [activeTab, pendingPage, historyPage, historyFilters]);

  // Debounced search for pending trips
  useEffect(() => {
    if (activeTab === 'pending') {
      const timer = setTimeout(() => {
        if (search !== undefined) {
          setPendingPage(1);
          fetchPendingTrips();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [search, activeTab]);

  // Fetch parcels when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      fetchTripParcels(selectedTrip);
    } else {
      setSelectedTripParcels([]);
    }
  }, [selectedTrip]);

  // Confirm arrival
  const confirmArrival = async (tripNumber: string) => {
    setConfirmingTrip(tripNumber);
    try {
      const trip = pendingTrips.find(t => t.trip_number === tripNumber);
      
      if (!trip) {
        toast.error("Trip not found");
        setConfirmingTrip(null);
        return;
      }
      
      const response = await api.post(`/branch/trips/${trip.id}/confirm-arrival`);
      
      if (response.data.success) {
        toast.success(`✅ Trip confirmed! ${response.data.data.parcels_updated || 0} parcels updated`);
        
        // Remove from pending list
        setPendingTrips(prev => prev.filter(t => t.trip_number !== tripNumber));
        
        // Clear selection if this was selected
        if (selectedTrip === trip.id) {
          setSelectedTrip(null);
          setSelectedTripParcels([]);
        }
        
        // Refresh pending list
        await fetchPendingTrips();
      }
    } catch (error: any) {
      console.error("❌ Failed to confirm arrival:", error);
      toast.error(error.response?.data?.message || 'Failed to confirm arrival');
      setShowManualOverride(true);
    } finally {
      setConfirmingTrip(null);
    }
  };

  // Manual override
  const manualMarkArrived = async () => {
    if (!selectedTrip) return;
    
    try {
      toast.loading('Manually updating parcels...', { id: 'manual-update' });
      
      const response = await api.post(`/branch/trips/${selectedTrip}/manual-arrival`, {
        trip_id: selectedTrip,
        branch_id: user?.branch?.id
      });
      
      if (response.data.success) {
        toast.success('✅ Parcels manually marked as arrived', { id: 'manual-update' });
        
        setPendingTrips(prev => prev.filter(t => t.id !== selectedTrip));
        setSelectedTrip(null);
        setSelectedTripParcels([]);
        await fetchPendingTrips();
        setShowManualOverride(false);
      }
    } catch (error: any) {
      toast.error('❌ Manual update failed', { id: 'manual-update' });
      console.error("Manual update error:", error);
    }
  };

  // Send SMS notification
  const sendSMS = async (tracking: string, phone: string, receiverName: string) => {
    try {
      const response = await api.post('/branch/trips/sms/send-pickup-notification', {
        tracking_number: tracking,
        phone_number: phone,
        receiver_name: receiverName
      });
      
      if (response.data.success) {
        setSmsSent(p => [...p, tracking]);
        toast.success(`SMS sent to ${receiverName}`);
      }
    } catch (error: any) {
      console.error("❌ Failed to send SMS:", error);
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    }
  };

  // Send SMS to all receivers in a trip
  const sendAllSMS = async (parcels: Parcel[]) => {
    const unsentParcels = parcels.filter(p => !smsSent.includes(p.tracking_number));
    
    for (const parcel of unsentParcels) {
      await sendSMS(parcel.tracking_number, parcel.receiver_phone, parcel.receiver_name);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Resend SMS for history items
  const resendSMS = async (tracking: string, phone: string, receiverName: string) => {
    await sendSMS(tracking, phone, receiverName);
    // Refresh history to update SMS status
    if (activeTab === 'history') {
      fetchHistoryTrips();
    }
  };

  // Export history to CSV
  const exportHistory = () => {
    try {
      const dataToExport = historyTrips.flatMap(trip => 
        (trip.parcels || []).map(parcel => ({
          'Trip Number': trip.trip_number,
          'Arrival Date': formatDate(trip.arrival_time || ''),
          'Tracking Number': parcel.tracking_number,
          'Receiver Name': parcel.receiver_name,
          'Receiver Phone': parcel.receiver_phone,
          'Amount': formatCurrency(parcel.amount),
          'Payment Status': parcel.payment_status,
          'SMS Sent': smsSent.includes(parcel.tracking_number) ? 'Yes' : 'No',
          'Status': parcel.status
        }))
      );

      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }

      const csv = convertToCSV(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parcel-history-${formatDate(new Date().toISOString())}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${dataToExport.length} records`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  // Helper to convert to CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  // Quick date filters
  const setQuickDateRange = (range: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(today.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    setHistoryFilters({
      ...historyFilters,
      startDate,
      endDate
    });
    setShowDatePicker(false);
  };

  // Clear history filters
  const clearHistoryFilters = () => {
    setHistoryFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
      search: "",
      paymentStatus: 'all',
      smsStatus: 'all'
    });
    setHistoryPage(1);
  };

  // Mobile trip card component for pending trips
  const MobilePendingTripCard = ({ trip }: { trip: Trip }) => {
    const isConfirming = confirmingTrip === trip.trip_number;
    
    return (
      <div 
        className={`mobile-card p-4 mb-3 cursor-pointer transition-all ${
          selectedTrip === trip.id ? 'border-l-4' : ''
        }`}
        style={selectedTrip === trip.id ? { borderLeftColor: "hsl(var(--navy))" } : {}}
        onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-muted-foreground">Trip</span>
            <div className="font-mono text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>
              {trip.trip_number}
            </div>
          </div>
          <span className="badge-warning">En Route</span>
        </div>

        {/* Route */}
        <div className="bg-slate-50 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">FROM</div>
              <div className="text-sm font-medium truncate">{trip.origin_branch_name}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">TO</div>
              <div className="text-sm font-medium truncate">{branchName}</div>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <span className="text-xs text-muted-foreground block">🚛 Vehicle</span>
            <span className="text-sm font-medium">{trip.vehicle_plate}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">👤 Driver</span>
            <span className="text-sm font-medium truncate">{trip.driver_name}</span>
          </div>
        </div>

        {/* Parcels & Actions */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{trip.parcels_count || 0} parcels</span>
          </div>
          <Button
            size="sm"
            className="text-xs gap-1.5 h-9 px-4"
            style={{ background: "hsl(142,71%,38%)", color: "white" }}
            onClick={(e) => {
              e.stopPropagation();
              confirmArrival(trip.trip_number);
            }}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Confirm
          </Button>
        </div>
      </div>
    );
  };

  // Mobile trip card component for history
  const MobileHistoryTripCard = ({ trip }: { trip: Trip }) => {
    const hasSentSMS = trip.parcels?.some(p => smsSent.includes(p.tracking_number));
    
    return (
      <div 
        className={`mobile-card p-4 mb-3 cursor-pointer transition-all ${
          selectedTrip === trip.id ? 'border-l-4' : ''
        }`}
        style={selectedTrip === trip.id ? { borderLeftColor: "hsl(var(--navy))" } : {}}
        onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-muted-foreground">Arrived</span>
            <div className="text-sm font-medium">{formatDateTime(trip.arrival_time || '')}</div>
          </div>
          <span className={hasSentSMS ? "badge-success" : "badge-warning"}>
            {hasSentSMS ? 'SMS Sent' : 'SMS Pending'}
          </span>
        </div>

        {/* Trip Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>
            {trip.trip_number}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm">{trip.vehicle_plate}</span>
        </div>

        {/* Route */}
        <div className="flex items-center gap-1 text-sm mb-2">
          <span className="text-foreground">{trip.origin_branch_name}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground">{branchName}</span>
        </div>

        {/* Driver & Parcels */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {trip.driver_name}
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{trip.parcels_count || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  // Mobile parcel card component
  const MobileParcelCard = ({ parcel, tripStatus }: { parcel: Parcel; tripStatus: string }) => {
    const smsAlreadySent = smsSent.includes(parcel.tracking_number);
    const isArrived = tripStatus === 'arrived';
    
    return (
      <div className="mobile-card p-3 mb-2">
        {/* Tracking and Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
            #{parcel.tracking_number}
          </span>
          <span className={isArrived ? "badge-success" : "badge-info"}>
            {isArrived ? "Arrived" : "In Transit"}
          </span>
        </div>

        {/* Receiver Info */}
        <div className="mb-2">
          <span className="text-xs text-muted-foreground block">Receiver</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{parcel.receiver_name}</span>
            <span className="text-xs text-muted-foreground">{parcel.receiver_phone}</span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <span className="text-xs text-muted-foreground block">Description</span>
            <span className="text-sm">{parcel.description || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Amount</span>
            <span className="text-sm font-semibold">{formatCurrency(parcel.amount)}</span>
          </div>
        </div>

        {/* Payment & Arrival */}
        <div className="flex items-center justify-between mb-2">
          <span className={parcel.payment_status === 'paid' ? "badge-success" : "badge-warning"}>
            {parcel.payment_status === 'paid' ? "Paid" : "Pay on pickup"}
          </span>
          {parcel.arrived_at && (
            <span className="text-xs text-muted-foreground">
              {formatDateTime(parcel.arrived_at)}
            </span>
          )}
        </div>

        {/* Action Button */}
        {isArrived && (
          <Button
            variant={smsAlreadySent ? "outline" : "default"}
            size="sm"
            className="w-full mt-2 text-xs gap-1.5 h-9"
            style={smsAlreadySent ? {} : { background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
            onClick={() => smsAlreadySent ? 
              resendSMS(parcel.tracking_number, parcel.receiver_phone, parcel.receiver_name) : 
              sendSMS(parcel.tracking_number, parcel.receiver_phone, parcel.receiver_name)
            }
          >
            <MessageSquare className="w-3 h-3" />
            {smsAlreadySent ? "Resend SMS" : "Send SMS"}
          </Button>
        )}
      </div>
    );
  };

  // Calculate stats
  const totalPendingParcels = pendingTrips.reduce((sum, trip) => sum + (trip.parcels_count || 0), 0);
  const totalHistoryParcels = historyTrips.reduce((sum, trip) => sum + (trip.parcels_count || 0), 0);

  const stats = [
    { label: "Pending Confirmation", value: pendingTrips.length, icon: Clock, color: "hsl(38,95%,52%)" },
    { label: "Parcels Awaiting", value: totalPendingParcels, icon: Package, color: "hsl(var(--navy))" },
    { label: "Arrival History", value: totalHistory, icon: History, color: "hsl(142,71%,38%)" },
    { label: "Total Received", value: totalHistoryParcels, icon: PackageCheck, color: "hsl(var(--navy))" },
  ];

  const tabs = [
    { label: "Pending Confirmation", value: "pending" as const, icon: Clock },
    { label: "Arrival History", value: "history" as const, icon: History },
  ];

  const paginatedPendingTrips = paginate(pendingTrips, pendingPage, PAGE_SIZE);
  const paginatedHistoryTrips = paginate(historyTrips, historyPage, PAGE_SIZE);
  const activeTripData = selectedTrip ? 
    (activeTab === 'pending' ? pendingTrips.find(t => t.id === selectedTrip) : historyTrips.find(t => t.id === selectedTrip)) 
    : null;
  const paginatedParcels = paginate(selectedTripParcels, parcelPage, PAGE_SIZE);

  if (loadingPending && pendingTrips.length === 0 && activeTab === 'pending') {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Receive Parcels</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            Confirm vehicle arrivals and manage parcel pickup at {branchName}
          </p>
        </div>
      </div>

      {/* Manual Override Dialog */}
      {showManualOverride && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Manual Override</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The automatic confirmation failed. Would you like to manually mark this trip and its parcels as arrived?
            </p>
            <p className="text-xs text-muted-foreground mb-4 bg-slate-50 p-2 rounded">
              Trip: {activeTripData?.trip_number}<br />
              Parcels: {selectedTripParcels.length}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowManualOverride(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                style={{ background: "hsl(142,71%,38%)", color: "white" }}
                onClick={manualMarkArrived}
              >
                Yes, Mark Arrived
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map(s => (
          <div key={s.label} className="form-section flex items-center gap-2 sm:gap-3 !p-3 sm:!p-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground leading-none">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs - Mobile Friendly */}
      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-border">
        {tabs.map(tab => (
          <Button
            key={tab.value}
            variant="ghost"
            className={`relative px-3 sm:px-4 py-2 rounded-none border-b-2 transition-colors text-xs sm:text-sm ${
              activeTab === tab.value 
                ? "border-primary text-foreground font-semibold" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setActiveTab(tab.value);
              setSelectedTrip(null);
              setSearch("");
            }}
          >
            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            {isMobile ? tab.value : tab.label}
          </Button>
        ))}
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <>
          {/* Search for pending - Mobile */}
          {isMobile ? (
            <div className="form-section !p-3 mb-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pending trips..."
                  value={search}
                  onChange={e => { 
                    setSearch(e.target.value); 
                    setSelectedTrip(null); 
                    setPendingPage(1);
                  }}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          ) : (
            <div className="form-section !p-4 mb-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pending trips by trip #, driver, vehicle..."
                  value={search}
                  onChange={e => { 
                    setSearch(e.target.value); 
                    setSelectedTrip(null); 
                    setPendingPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Pending Trips - Mobile Cards */}
          {isMobile ? (
            <div className="space-y-3 mb-4">
              {paginatedPendingTrips.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{search ? "No matching trips found" : "No pending trips for today"}</p>
                </div>
              ) : (
                paginatedPendingTrips.map(trip => (
                  <MobilePendingTripCard key={trip.id} trip={trip} />
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="form-section !p-0 mb-4 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Awaiting Confirmation (Today)</span>
                <span className="ml-auto text-xs text-muted-foreground">{pendingTrips.length} trip{pendingTrips.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Trip</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Route</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Vehicle</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Driver</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Parcels</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPendingTrips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          {search ? "No matching trips found" : "No pending trips for today"}
                        </TableCell>
                      </TableRow>
                    ) : paginatedPendingTrips.map(trip => {
                      const isSelected = selectedTrip === trip.id;
                      const isConfirming = confirmingTrip === trip.trip_number;
                      
                      return (
                        <TableRow
                          key={trip.id}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-l-2" : "hover:bg-muted/30"}`}
                          style={isSelected ? { borderLeftColor: "hsl(var(--navy))" } : {}}
                          onClick={() => { 
                            setSelectedTrip(isSelected ? null : trip.id); 
                            setParcelPage(1); 
                          }}
                        >
                          <TableCell>
                            <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
                              {trip.trip_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="font-medium text-foreground">{trip.origin_branch_name}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-foreground">{branchName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{trip.vehicle_plate}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-foreground">{trip.driver_name}</div>
                            <div className="text-xs text-muted-foreground">{trip.driver_phone}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--navy)/0.1)", color: "hsl(var(--navy))" }}>
                              {trip.parcels_count || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="badge-warning">
                              En Route
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <Button
                              size="sm"
                              className="text-xs gap-1.5 h-8"
                              style={{ background: "hsl(142,71%,38%)", color: "white" }}
                              onClick={() => confirmArrival(trip.trip_number)}
                              disabled={isConfirming}
                            >
                              {isConfirming ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              {isConfirming ? "Confirming..." : "Confirm Arrival"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4">
                <TablePagination 
                  currentPage={pendingPage} 
                  totalItems={totalPending} 
                  pageSize={PAGE_SIZE} 
                  onPageChange={setPendingPage} 
                />
              </div>
            </div>
          )}

          {/* Mobile Pagination */}
          {isMobile && (
            <div className="mt-3">
              <TablePagination 
                currentPage={pendingPage} 
                totalItems={totalPending} 
                pageSize={PAGE_SIZE} 
                onPageChange={setPendingPage} 
              />
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {/* History Filters - Mobile */}
          {isMobile ? (
            <>
              <div className="form-section !p-3 mb-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 h-10"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Filter className="w-4 h-4" />
                  {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                
                {showMobileFilters && (
                  <div className="mt-3 space-y-3 animate-slide-down">
                    {/* Date Range */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Date Range</label>
                      <div className="flex items-center gap-2">
                        <DatePicker
                          selected={historyFilters.startDate}
                          onChange={(date) => setHistoryFilters({...historyFilters, startDate: date})}
                          selectsStart
                          startDate={historyFilters.startDate}
                          endDate={historyFilters.endDate}
                          placeholderText="Start"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          dateFormat="yyyy-MM-dd"
                        />
                        <span className="text-muted-foreground">-</span>
                        <DatePicker
                          selected={historyFilters.endDate}
                          onChange={(date) => setHistoryFilters({...historyFilters, endDate: date})}
                          selectsEnd
                          startDate={historyFilters.startDate}
                          endDate={historyFilters.endDate}
                          minDate={historyFilters.startDate}
                          placeholderText="End"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>

                    {/* Quick Dates */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setQuickDateRange('today')}>
                        Today
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setQuickDateRange('yesterday')}>
                        Yesterday
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setQuickDateRange('thisWeek')}>
                        This Week
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setQuickDateRange('thisMonth')}>
                        This Month
                      </Button>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Search</label>
                      <Input
                        placeholder="Search..."
                        value={historyFilters.search}
                        onChange={e => {
                          setHistoryFilters({...historyFilters, search: e.target.value});
                          setHistoryPage(1);
                        }}
                        className="h-10"
                      />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="px-3 py-2 border rounded-lg text-sm bg-background"
                        value={historyFilters.paymentStatus}
                        onChange={e => setHistoryFilters({...historyFilters, paymentStatus: e.target.value as any})}
                      >
                        <option value="all">All Payments</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                      <select
                        className="px-3 py-2 border rounded-lg text-sm bg-background"
                        value={historyFilters.smsStatus}
                        onChange={e => setHistoryFilters({...historyFilters, smsStatus: e.target.value as any})}
                      >
                        <option value="all">All SMS</option>
                        <option value="sent">SMS Sent</option>
                        <option value="not_sent">SMS Not Sent</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHistoryFilters}
                        className="flex-1 gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={exportHistory}
                        className="flex-1 gap-1"
                        style={{ background: "hsl(var(--navy))", color: "white" }}
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* History Trips - Mobile Cards */}
              <div className="space-y-3 mb-4">
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : paginatedHistoryTrips.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No arrival history found</p>
                  </div>
                ) : (
                  paginatedHistoryTrips.map(trip => (
                    <MobileHistoryTripCard key={trip.id} trip={trip} />
                  ))
                )}
              </div>

              {/* Mobile Pagination */}
              <div className="mt-3">
                <TablePagination 
                  currentPage={historyPage} 
                  totalItems={totalHistory} 
                  pageSize={PAGE_SIZE} 
                  onPageChange={setHistoryPage} 
                />
              </div>
            </>
          ) : (
            /* Desktop History View */
            <>
              {/* History Filters - Desktop */}
              <div className="form-section !p-4 mb-4">
                <div className="flex flex-col gap-4">
                  {/* Date Range */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date Range:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <DatePicker
                        selected={historyFilters.startDate}
                        onChange={(date) => setHistoryFilters({...historyFilters, startDate: date})}
                        selectsStart
                        startDate={historyFilters.startDate}
                        endDate={historyFilters.endDate}
                        placeholderText="Start Date"
                        className="px-3 py-2 border rounded-lg text-sm"
                        dateFormat="yyyy-MM-dd"
                      />
                      <span className="text-muted-foreground">to</span>
                      <DatePicker
                        selected={historyFilters.endDate}
                        onChange={(date) => setHistoryFilters({...historyFilters, endDate: date})}
                        selectsEnd
                        startDate={historyFilters.startDate}
                        endDate={historyFilters.endDate}
                        minDate={historyFilters.startDate}
                        placeholderText="End Date"
                        className="px-3 py-2 border rounded-lg text-sm"
                        dateFormat="yyyy-MM-dd"
                      />
                      
                      {/* Quick Date Selection Dropdown */}
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                          Quick Dates
                        </Button>
                        
                        {showDatePicker && (
                          <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10 py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => setQuickDateRange('today')}
                            >
                              Today
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => setQuickDateRange('yesterday')}
                            >
                              Yesterday
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => setQuickDateRange('thisWeek')}
                            >
                              This Week
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => setQuickDateRange('thisMonth')}
                            >
                              This Month
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => setQuickDateRange('lastMonth')}
                            >
                              Last Month
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by trip #, tracking, receiver..."
                        value={historyFilters.search}
                        onChange={e => {
                          setHistoryFilters({...historyFilters, search: e.target.value});
                          setHistoryPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        className="px-3 py-2 border rounded-lg text-sm bg-background"
                        value={historyFilters.paymentStatus}
                        onChange={e => setHistoryFilters({...historyFilters, paymentStatus: e.target.value as any})}
                      >
                        <option value="all">All Payments</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                      <select
                        className="px-3 py-2 border rounded-lg text-sm bg-background"
                        value={historyFilters.smsStatus}
                        onChange={e => setHistoryFilters({...historyFilters, smsStatus: e.target.value as any})}
                      >
                        <option value="all">All SMS</option>
                        <option value="sent">SMS Sent</option>
                        <option value="not_sent">SMS Not Sent</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHistoryFilters}
                        className="gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={exportHistory}
                        className="gap-1"
                        style={{ background: "hsl(var(--navy))", color: "white" }}
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Trips Table */}
              <div className="form-section !p-0 mb-4 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Arrival History</span>
                  <span className="ml-auto text-xs text-muted-foreground">{totalHistory} trip{totalHistory !== 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Arrival Date</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Trip</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Route</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Vehicle</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Driver</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Parcels</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">SMS Status</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : paginatedHistoryTrips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            No arrival history found for selected filters
                          </TableCell>
                        </TableRow>
                      ) : paginatedHistoryTrips.map(trip => {
                        const isSelected = selectedTrip === trip.id;
                        
                        return (
                          <TableRow
                            key={trip.id}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-l-2" : "hover:bg-muted/30"}`}
                            style={isSelected ? { borderLeftColor: "hsl(var(--navy))" } : {}}
                            onClick={() => { 
                              setSelectedTrip(isSelected ? null : trip.id); 
                              setParcelPage(1); 
                            }}
                          >
                            <TableCell>
                              <span className="text-sm">
                                {formatDateTime(trip.arrival_time || '')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
                                {trip.trip_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <span className="font-medium text-foreground">{trip.origin_branch_name}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium text-foreground">{branchName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{trip.vehicle_plate}</TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-foreground">{trip.driver_name}</div>
                              <div className="text-xs text-muted-foreground">{trip.driver_phone}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--navy)/0.1)", color: "hsl(var(--navy))" }}>
                                {trip.parcels_count || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={trip.parcels?.some(p => smsSent.includes(p.tracking_number)) ? "badge-success" : "badge-warning"}>
                                {trip.parcels?.some(p => smsSent.includes(p.tracking_number)) ? 'Sent' : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1.5 h-8"
                                onClick={() => {
                                  setSelectedTrip(trip.id);
                                  setParcelPage(1);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="px-4">
                  <TablePagination 
                    currentPage={historyPage} 
                    totalItems={totalHistory} 
                    pageSize={PAGE_SIZE} 
                    onPageChange={setHistoryPage} 
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Expanded Parcel Detail Panel - Mobile Cards */}
      {activeTripData && (
        <div className="form-section !p-0 overflow-hidden animate-fade-in mt-4">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ background: "hsl(var(--navy)/0.04)" }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{ background: activeTripData.status === 'arrived' ? "hsl(142,71%,38%)" : "hsl(var(--navy))" }}>
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {isMobile ? activeTripData.trip_number : `${activeTripData.trip_number} — Parcels`}
                </div>
                {!isMobile && (
                  <div className="text-xs text-muted-foreground">
                    {activeTripData.origin_branch_name} • {activeTripData.vehicle_plate} • {activeTripData.driver_name}
                    {activeTripData.arrival_time && ` • Arrived: ${formatDateTime(activeTripData.arrival_time)}`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loadingParcels && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {selectedTripParcels.length}
              </span>
              {activeTripData.status === 'arrived' && selectedTripParcels.length > 0 && !isMobile && (
                <Button
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  style={{ background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
                  onClick={() => sendAllSMS(selectedTripParcels)}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Notify All
                </Button>
              )}
            </div>
          </div>

          {/* Parcels Display - Mobile Cards */}
          {isMobile ? (
            <div className="p-4 space-y-3">
              {loadingParcels ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : paginatedParcels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No parcels found for this trip
                </div>
              ) : (
                <>
                  {paginatedParcels.map(p => (
                    <MobileParcelCard key={p.id} parcel={p} tripStatus={activeTripData.status} />
                  ))}
                  
                  {/* Send All SMS Button for Mobile */}
                  {activeTripData.status === 'arrived' && selectedTripParcels.length > 0 && (
                    <Button
                      size="sm"
                      className="w-full mt-3 text-sm gap-1.5 h-10"
                      style={{ background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
                      onClick={() => sendAllSMS(selectedTripParcels)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send SMS to All Receivers
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Desktop Parcels Table */
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Tracking #</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Receiver</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Amount</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Payment</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Arrived At</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Notify</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingParcels ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : paginatedParcels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No parcels found for this trip
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedParcels.map(p => {
                        const smsAlreadySent = smsSent.includes(p.tracking_number);
                        const isArrived = activeTripData.status === 'arrived';
                        return (
                          <TableRow key={p.id} className="hover:bg-muted/20">
                            <TableCell>
                              <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--navy))" }}>
                                {p.tracking_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-foreground">{p.receiver_name}</div>
                              <div className="text-xs text-muted-foreground">{p.receiver_phone}</div>
                            </TableCell>
                            <TableCell className="text-sm text-foreground">{p.description || '—'}</TableCell>
                            <TableCell className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="text-center">
                              <span className={p.payment_status === 'paid' ? "badge-success" : "badge-warning"}>
                                {p.payment_status === 'paid' ? "Paid" : "Pay on pickup"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={isArrived ? "badge-success" : "badge-info"}>
                                {isArrived ? "Arrived" : "In Transit"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {p.arrived_at ? formatDateTime(p.arrived_at) : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {isArrived && (
                                <Button
                                  variant={smsAlreadySent ? "outline" : "default"}
                                  size="sm"
                                  className="text-xs gap-1.5 h-8"
                                  style={smsAlreadySent ? {} : { background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
                                  onClick={() => smsAlreadySent ? 
                                    resendSMS(p.tracking_number, p.receiver_phone, p.receiver_name) : 
                                    sendSMS(p.tracking_number, p.receiver_phone, p.receiver_name)
                                  }
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {smsAlreadySent ? "Resend" : "SMS"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4">
                <TablePagination 
                  currentPage={parcelPage} 
                  totalItems={selectedTripParcels.length} 
                  pageSize={PAGE_SIZE} 
                  onPageChange={setParcelPage} 
                />
              </div>
            </>
          )}

          {/* Info Message */}
          {activeTripData.status === 'arrived' && selectedTripParcels.length > 0 && (
            <div className="mx-4 mb-4 mt-2 flex items-center gap-2 p-3 rounded-lg border" style={{ background: "hsl(142,71%,38%,0.06)", borderColor: "hsl(142,71%,38%,0.2)" }}>
              <PackageCheck className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(142,71%,38%)" }} />
              <p className="text-xs" style={{ color: "hsl(142,50%,30%)" }}>
                {activeTab === 'pending' ? 
                  "Vehicle arrived and parcels confirmed. Send SMS to notify receivers for pickup." :
                  "Historical record. You can resend SMS notifications if needed."
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-xl shadow-sm;
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

export default ReceiveParcels;