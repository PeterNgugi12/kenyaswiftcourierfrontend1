import { useState, useEffect } from "react";
import { Plus, Truck, Package, MapPin, Clock, Search, Eye, ArrowRight, TrendingUp, Loader2, X, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useTrips } from "@/hooks/useTrips";
import { useBranchAuth } from "@/hooks/useBranchAuth";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import api from "@/api/axios";

const PAGE_SIZE = 5;

const Trips = () => {
  const { user } = useBranchAuth();
  const { 
    trips,
    filtered,
    vehicles,
    drivers,
    destBranches,
    stats,
    loading,
    page, 
    setPage, 
    search, 
    setSearch, 
    status, 
    setStatus,
    createTrip,
    markAsArrived,
    fetchVehicles,
    fetchDrivers,
    fetchDestBranches,
    resetPage,
    refresh
  } = useTrips();

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departingTripId, setDepartingTripId] = useState<string | null>(null);
  const [departingSubmitting, setDepartingSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({
    destination_branch_id: "",
    vehicle_id: "",
    driver_id: "",
    driver_name: "",
    driver_phone: "",
    departure_date: "",
    departure_time: ""
  });

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (showModal) {
      console.log("Modal opened, fetching dropdown data...");
      fetchVehicles();
      fetchDrivers();
      fetchDestBranches();
    }
  }, [showModal, fetchVehicles, fetchDrivers, fetchDestBranches]);

  // Log when destBranches changes
  useEffect(() => {
    console.log("Destination branches updated:", destBranches);
    if (destBranches.length === 0 && !loading.branches) {
      console.log("No destination branches available");
    }
  }, [destBranches, loading.branches]);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const paged = paginate(filtered, page, PAGE_SIZE);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔍 Form data before submission:", form);
    
    if (!form.destination_branch_id || !form.vehicle_id || !form.driver_id || 
        !form.driver_name || !form.driver_phone || !form.departure_date || !form.departure_time) {
      console.log("❌ Missing fields:", {
        destination_branch_id: !form.destination_branch_id,
        vehicle_id: !form.vehicle_id,
        driver_id: !form.driver_id,
        driver_name: !form.driver_name,
        driver_phone: !form.driver_phone,
        departure_date: !form.departure_date,
        departure_time: !form.departure_time
      });
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      console.log("🚀 Sending create trip request with data:", form);
      const result = await createTrip(form);
      console.log("✅ Trip created successfully:", result);
      
      setShowModal(false);
      setForm({
        destination_branch_id: "",
        vehicle_id: "",
        driver_id: "",
        driver_name: "",
        driver_phone: "",
        departure_date: "",
        departure_time: ""
      });
      toast.success('Trip created successfully');
    } catch (error: any) {
      console.error("❌ Error creating trip:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle trip departure (scheduled → in_transit)
  const handleDepartTrip = async (tripId: string) => {
    setDepartingTripId(tripId);
    setDepartingSubmitting(true);
    try {
      console.log("🚀 Marking trip as departed:", tripId);
      const response = await api.patch(`/branch/trips/${tripId}/status`, { status: 'in_transit' });
      
      if (response.data.success) {
        toast.success('Trip marked as in transit');
        refresh(); // Refresh the trips list
      }
    } catch (error: any) {
      console.error("❌ Failed to mark trip as departed:", error);
      toast.error(error.response?.data?.message || 'Failed to update trip status');
    } finally {
      setDepartingTripId(null);
      setDepartingSubmitting(false);
    }
  };

  const handleMarkArrived = async (tripId: string) => {
    await markAsArrived(tripId);
  };

  const handleRefreshDestinations = () => {
    fetchDestBranches();
    toast.loading('Refreshing destinations...', { duration: 2000 });
  };

  // Mobile card view for trips
  const renderMobileTripCard = (trip: any) => (
    <div key={trip.id} className="mobile-card mb-3 p-4">
      {/* Header with Trip ID and Status */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs text-muted-foreground">Trip ID</span>
          <div className="font-mono text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>
            {trip.trip_number}
          </div>
        </div>
        <span className={
          trip.status === "in_transit" ? "badge-info" :
          trip.status === "arrived" ? "badge-success" :
          trip.status === "scheduled" ? "badge-warning" : "badge-secondary"
        }>
          {trip.status.replace("_", " ")}
        </span>
      </div>

      {/* Route */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xs text-muted-foreground">FROM</div>
            <div className="font-semibold text-sm truncate">{trip.origin_branch_name || user?.branch?.name}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
          <div className="text-center flex-1">
            <div className="text-xs text-muted-foreground">TO</div>
            <div className="font-semibold text-sm truncate">{trip.destination_branch_name}</div>
          </div>
        </div>
      </div>

      {/* Vehicle & Driver */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">🚛 Vehicle</div>
          <div className="font-medium text-sm">{trip.vehicle_plate}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">👤 Driver</div>
          <div className="font-medium text-sm truncate">{trip.driver_name}</div>
          <div className="text-xs text-muted-foreground">{trip.driver_phone}</div>
        </div>
      </div>

      {/* Parcels & Departure Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{trip.parcels_count || 0} parcels</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {formatTime(trip.departure_time)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {trip.status === "scheduled" && (
          <Button 
            size="sm" 
            className="flex-1 gap-1 text-xs h-9" 
            style={{ background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
            onClick={() => handleDepartTrip(trip.id)}
            disabled={departingTripId === trip.id}
          >
            {departingTripId === trip.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Depart
          </Button>
        )}
        {trip.status === "in_transit" && (
          <Button 
            size="sm" 
            className="flex-1 gap-1 text-xs h-9" 
            style={{ background: "hsl(142,71%,38%)", color: "white" }}
            onClick={() => handleMarkArrived(trip.id)}
          >
            <MapPin className="w-3 h-3" />
            Arrive
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-9">
          <Eye className="w-3 h-3" />
          View
        </Button>
      </div>
    </div>
  );

  if (loading.trips && trips.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Trip Management</h1>
          <p className="page-subtitle text-xs sm:text-sm">Track departures, vehicles and parcels in transit</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="gap-2 w-full sm:w-auto h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Create Trip
        </Button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card relative overflow-hidden p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trips Today</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.trips_today || 0}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--navy))15` }}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--navy))" }} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: "hsl(var(--navy))", opacity: 0.6 }} />
        </div>

        <div className="stat-card relative overflow-hidden p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Transit</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.in_transit || 0}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ background: `hsl(35, 92%, 50%)15` }}>
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(35, 92%, 50%)" }} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: "hsl(35, 92%, 50%)", opacity: 0.6 }} />
        </div>

        <div className="stat-card relative overflow-hidden p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Arrived</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.arrived || 0}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ background: `hsl(142, 71%, 38%)15` }}>
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(142, 71%, 38%)" }} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: "hsl(142, 71%, 38%)", opacity: 0.6 }} />
        </div>

        <div className="stat-card relative overflow-hidden p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Parcels</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.total_parcels || 0}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ background: `hsl(250, 55%, 55%)15` }}>
              <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(250, 55%, 55%)" }} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: "hsl(250, 55%, 55%)", opacity: 0.6 }} />
        </div>
      </div>

      {/* Search & Filter Bar - Responsive */}
      <div className="form-section p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              className="pl-9 h-9 sm:h-10 text-sm"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "scheduled", "in_transit", "arrived"].map(s => (
              <Button
                key={s}
                variant={status === s ? "default" : "outline"}
                size="sm"
                className="text-xs capitalize flex-1 sm:flex-none"
                style={status === s ? { background: "hsl(var(--navy))", color: "white" } : {}}
                onClick={() => { setStatus(s); resetPage(); }}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Trips Display - Mobile Cards or Desktop Table */}
      <div className="form-section p-0 overflow-hidden">
        {isMobile ? (
          // Mobile Card View
          <div className="p-4">
            {paged.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No trips found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              paged.map(trip => renderMobileTripCard(trip))
            )}
            <div className="mt-4">
              <TablePagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </div>
        ) : (
          // Desktop Table View
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ background: "hsl(var(--navy)/0.04)" }}>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Trip ID</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Route</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Vehicle</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Driver</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Parcels</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Departed</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No trips found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : paged.map(t => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-mono text-xs font-semibold" style={{ color: "hsl(var(--navy))" }}>
                      {t.trip_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-foreground">{t.origin_branch_name || user?.branch?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{t.destination_branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        {t.vehicle_plate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-foreground">{t.driver_name}</div>
                        <div className="text-xs text-muted-foreground">{t.driver_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--navy)/0.08)", color: "hsl(var(--navy))" }}>
                        {t.parcels_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(t.departure_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        t.status === "in_transit" ? "badge-info" :
                        t.status === "arrived" ? "badge-success" :
                        t.status === "scheduled" ? "badge-warning" : "badge-secondary"
                      }>
                        {t.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status === "scheduled" && (
                          <Button 
                            size="sm" 
                            className="gap-1 text-xs h-8" 
                            style={{ background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
                            onClick={() => handleDepartTrip(t.id)}
                            disabled={departingTripId === t.id}
                          >
                            {departingTripId === t.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Depart
                          </Button>
                        )}
                        {t.status === "in_transit" && (
                          <Button 
                            size="sm" 
                            className="gap-1 text-xs h-8" 
                            style={{ background: "hsl(142,71%,38%)", color: "white" }}
                            onClick={() => handleMarkArrived(t.id)}
                          >
                            <MapPin className="w-3 h-3" />
                            Arrive
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-2">
              <TablePagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Create Trip Modal - Mobile Optimized */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Trip</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Schedule a new trip from {user?.branch?.name || 'your branch'} to another destination.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateTrip} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Origin Branch</Label>
                <Input value={user?.branch?.name || 'Nairobi CBD'} disabled className="bg-muted h-9 sm:h-10 text-sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs sm:text-sm font-medium">Destination Branch *</Label>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={handleRefreshDestinations}
                    disabled={loading.branches}
                  >
                    {loading.branches ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
                <select 
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm" 
                  value={form.destination_branch_id} 
                  onChange={e => update("destination_branch_id", e.target.value)}
                  required
                  disabled={submitting || loading.branches}
                >
                  <option value="">— Select Destination —</option>
                  {destBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.town})</option>
                  ))}
                </select>
                {destBranches.length === 0 && !loading.branches && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No destination branches available
                  </p>
                )}
                {loading.branches && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading branches...
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Vehicle *</Label>
              <select 
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm" 
                value={form.vehicle_id} 
                onChange={e => update("vehicle_id", e.target.value)}
                required
                disabled={submitting || loading.vehicles}
              >
                <option value="">— Select Vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate_number} — {v.type}</option>
                ))}
              </select>
              {vehicles.length === 0 && !loading.vehicles && (
                <p className="text-xs text-amber-600 mt-1">No vehicles available</p>
              )}
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Driver *</Label>
              <select 
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm" 
                value={form.driver_id} 
                onChange={e => {
                  const driver = drivers.find(d => d.id === e.target.value);
                  update("driver_id", e.target.value);
                  if (driver) {
                    update("driver_name", driver.name);
                    update("driver_phone", driver.phone);
                  }
                }}
                required
                disabled={submitting || loading.drivers}
              >
                <option value="">— Select Driver —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>
                ))}
              </select>
              {drivers.length === 0 && !loading.drivers && (
                <p className="text-xs text-amber-600 mt-1">No drivers available</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Departure Date *</Label>
                <Input 
                  type="date" 
                  value={form.departure_date} 
                  onChange={e => update("departure_date", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={submitting}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Departure Time *</Label>
                <Input 
                  type="time" 
                  value={form.departure_time} 
                  onChange={e => update("departure_time", e.target.value)}
                  required
                  disabled={submitting}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                style={{ background: "hsl(var(--navy))", color: "white" }}
                disabled={submitting || destBranches.length === 0 || vehicles.length === 0 || drivers.length === 0}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add mobile card styles */}
      <style jsx>{`
        .mobile-card {
          @apply bg-card border border-border rounded-xl shadow-sm;
        }
      `}</style>
    </div>
  );
};

export default Trips;