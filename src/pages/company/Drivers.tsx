import { useState, useEffect } from "react";
import { 
  Plus, Phone, Truck, Search, Users, Navigation, Coffee, 
  UserCheck, Settings, MapPin, MoreHorizontal, Edit, Trash2, 
  Calendar, Loader2, AlertCircle, X, Filter, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useDrivers } from "@/hooks/useDrivers";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;

const CompanyDrivers = () => {
  const { 
    drivers, 
    stats, 
    availableVehicles,
    loading, 
    page, 
    setPage, 
    search, 
    setSearch, 
    status, 
    setStatus,
    createDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver 
  } = useDrivers();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    vehicle_id: '',
    route: '',
    branch_id: '',
    notes: ''
  });

  const [statusData, setStatusData] = useState({
    status: '',
    leave_reason: '',
    leave_end: ''
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

  // Filter drivers
  const filtered = drivers.filter(d => {
    const matchSearch = search === '' || 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search);
    
    const matchStatus = status === 'all' || d.status === status;
    return matchSearch && matchStatus;
  });
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const statusBadge: Record<string, string> = {
    active: "badge-success",
    on_trip: "badge-info",
    on_leave: "badge-warning",
    inactive: "badge-secondary"
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      license_number: '',
      license_expiry: '',
      vehicle_id: '',
      route: '',
      branch_id: '',
      notes: ''
    });
    setSelectedDriver(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.license_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createDriver(formData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      license_number: driver.license,
      license_expiry: '',
      vehicle_id: driver.vehicle_id || '',
      route: driver.route === '—' ? '' : driver.route,
      branch_id: driver.branch?.id || '',
      notes: ''
    });
    setShowEditModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    setSubmitting(true);
    try {
      await updateDriver(selectedDriver.id, formData);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (driver: any) => {
    setSelectedDriver(driver);
    setStatusData({ status: '', leave_reason: '', leave_end: '' });
    setShowStatusModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleLeave = (driver: any) => {
    setSelectedDriver(driver);
    setStatusData({ status: 'on_leave', leave_reason: '', leave_end: '' });
    setShowLeaveModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedDriver || !statusData.status) return;

    setSubmitting(true);
    try {
      await updateDriverStatus(
        selectedDriver.id, 
        statusData.status, 
        statusData.leave_reason,
        statusData.leave_end
      );
      setShowStatusModal(false);
      setSelectedDriver(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!selectedDriver) return;

    setSubmitting(true);
    try {
      await updateDriverStatus(
        selectedDriver.id, 
        'on_leave', 
        statusData.leave_reason,
        statusData.leave_end
      );
      setShowLeaveModal(false);
      setSelectedDriver(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (driver: any) => {
    setSelectedDriver(driver);
    setShowDeleteModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDriver) return;

    setSubmitting(true);
    try {
      await deleteDriver(selectedDriver.id);
      setShowDeleteModal(false);
      setSelectedDriver(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile driver card component
  const MobileDriverCard = ({ driver }: { driver: any }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => {
        setSelectedDriver(driver);
        setShowDetailsModal(true);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "hsl(var(--navy))" }}>
            {driver.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-base">{driver.name}</div>
            <div className="text-xs text-muted-foreground">{driver.license}</div>
          </div>
        </div>
        <span className={statusBadge[driver.status] || "badge-info"}>
          {driver.status.replace("_", " ")}
        </span>
      </div>

      {/* Contact & Vehicle */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Phone</div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {driver.phone}
          </div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Vehicle</div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Truck className="w-3 h-3 text-muted-foreground" />
            <span className={driver.vehicle === "Unassigned" ? "text-muted-foreground italic" : ""}>
              {driver.vehicle}
            </span>
          </div>
        </div>
      </div>

      {/* Route & Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Route</div>
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            {driver.route}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Trips / Rating</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{driver.trips} trips</span>
            <span className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span className="text-sm font-semibold">{driver.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Leave reason if on leave */}
      {driver.leave_reason && driver.status === 'on_leave' && (
        <div className="mt-2 text-xs text-muted-foreground bg-amber-50 p-2 rounded-lg">
          📝 {driver.leave_reason}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Tap for details & actions
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );

  // Mobile Driver Details Modal
  const DriverDetailsModal = () => {
    if (!selectedDriver) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Driver Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Driver Header */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "hsl(var(--navy))" }}>
                {selectedDriver.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{selectedDriver.name}</div>
                <div className="text-sm text-muted-foreground">{selectedDriver.license}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={statusBadge[selectedDriver.status] || "badge-info"}>
                {selectedDriver.status.replace("_", " ")}
              </span>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">CONTACT INFORMATION</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedDriver.phone}</span>
                </div>
                {selectedDriver.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">✉️</span>
                    <span className="text-sm">{selectedDriver.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">ASSIGNMENT</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className={`text-sm ${selectedDriver.vehicle === "Unassigned" ? "text-muted-foreground italic" : ""}`}>
                    {selectedDriver.vehicle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedDriver.route}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Total Trips</div>
                <div className="text-2xl font-bold text-foreground">{selectedDriver.trips}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Rating</div>
                <div className="text-2xl font-bold text-amber-500">{selectedDriver.rating.toFixed(1)}</div>
              </div>
            </div>

            {/* Leave Info */}
            {selectedDriver.leave_reason && selectedDriver.status === 'on_leave' && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-amber-800 mb-2">LEAVE INFORMATION</h4>
                <div className="space-y-1">
                  <div className="text-sm text-amber-700">{selectedDriver.leave_reason}</div>
                  {selectedDriver.leave_end && (
                    <div className="text-xs text-amber-600">
                      Expected return: {new Date(selectedDriver.leave_end).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleEdit(selectedDriver)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleStatusChange(selectedDriver)}
              >
                <Settings className="w-4 h-4" />
                Status
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleLeave(selectedDriver)}
              >
                <Calendar className="w-4 h-4" />
                Leave
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => handleDelete(selectedDriver)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && drivers.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">Drivers</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? `Team of ${stats.total} drivers` : `Manage your team of ${stats.total} registered drivers`}
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="w-full sm:w-auto gap-2 h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      {/* Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Registered</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--navy))15` }}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--navy))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--success))15` }}>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--success))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Trip</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.on_trip}</p>
              <p className="text-xs text-muted-foreground mt-1">Driving</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--info))15` }}>
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--info))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Leave</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.on_leave}</p>
              <p className="text-xs text-muted-foreground mt-1">Away</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--warning))15` }}>
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--warning))" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search & Filters */}
      {isMobile && (
        <div className="form-section p-3 mb-4">
          <div className="relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => { 
                setSearch(e.target.value); 
                setPage(1); 
              }} 
              placeholder="Search driver, vehicle, phone..." 
              className="pl-9 h-10 text-sm" 
            />
          </div>
          
          <Button
            variant="outline"
            className="w-full gap-2 h-10"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4" />
            {showMobileFilters ? 'Hide Filters' : `Filter: ${status === 'all' ? 'All' : status.replace('_', ' ')}`}
          </Button>
          
          {showMobileFilters && (
            <div className="mt-3 animate-slide-down">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "on_trip", label: "On Trip" },
                  { key: "on_leave", label: "On Leave" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => { 
                      setStatus(f.key); 
                      setPage(1); 
                      setShowMobileFilters(false);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      status === f.key 
                        ? "bg-navy text-white" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Search & Filter */}
      {!isMobile && (
        <div className="form-section p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={e => { 
                  setSearch(e.target.value); 
                  setPage(1); 
                }} 
                placeholder="Search driver, vehicle, phone..." 
                className="pl-9 h-10" 
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "on_trip", label: "On Trip" },
                { key: "on_leave", label: "On Leave" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => { setStatus(f.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    status === f.key 
                      ? "text-white border-transparent" 
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
                  style={status === f.key ? { background: "hsl(var(--navy))" } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drivers Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map(driver => (
              <MobileDriverCard key={driver.id} driver={driver} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No drivers found</p>
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
        <div className="form-section p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-xs">Driver</th>
                  <th className="text-xs">Contact</th>
                  <th className="text-xs">Vehicle</th>
                  <th className="text-xs">Route</th>
                  <th className="text-xs">Trips</th>
                  <th className="text-xs">Rating</th>
                  <th className="text-xs">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--navy))" }}>
                            {d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{d.name}</div>
                            <div className="text-xs text-muted-foreground">{d.license}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{d.phone}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={`text-sm font-mono font-bold ${d.vehicle === "Unassigned" ? "text-muted-foreground italic" : "text-foreground"}`}>
                            {d.vehicle}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />{d.route}
                        </div>
                      </td>
                      <td className="font-semibold text-foreground text-sm">{d.trips}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 text-xs">★</span>
                          <span className="text-sm font-semibold text-foreground">{d.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={statusBadge[d.status] || "badge-info"}>
                          {d.status.replace("_", " ")}
                        </span>
                        {d.leave_reason && d.status === 'on_leave' && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={d.leave_reason}>
                            {d.leave_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(d)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(d)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleLeave(d)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Put on Leave
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(d)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Driver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      No drivers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-4">
          <TablePagination 
            currentPage={page} 
            totalItems={filtered.length} 
            pageSize={PAGE_SIZE} 
            onPageChange={setPage} 
          />
        </div>
      )}

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <DriverDetailsModal />}

      {/* Create Driver Modal - Mobile Optimized */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Register New Driver</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new driver to your team. All fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Mwangi"
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254 700 000000"
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  License Number <span className="text-red-500">*</span>
                </label>
                <Input
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="e.g. DL/123456"
                  className="font-mono h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Assign Vehicle</label>
                <select
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">— Select Vehicle —</option>
                  {availableVehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Email (Optional)</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="driver@company.com"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Primary Route</label>
              <Input
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                placeholder="e.g. NBO ↔ KSM"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                style={{ background: "hsl(var(--navy))", color: "white" }}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Modal - Mobile Optimized */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Driver</DialogTitle>
            <DialogDescription className="text-sm">
              Update details for {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Full Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Phone Number</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">License Number</label>
                <Input
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="font-mono h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Assign Vehicle</label>
                <select
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">— Select Vehicle —</option>
                  {availableVehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Primary Route</label>
              <Input
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" style={{ background: "hsl(var(--navy))", color: "white" }} className="w-full sm:w-auto">
                Update Driver
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal - Mobile Optimized */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Change Driver Status</DialogTitle>
            <DialogDescription className="text-sm">
              Update status for {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">New Status</label>
              <select
                value={statusData.status}
                onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="on_trip">On Trip</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowStatusModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                onClick={handleUpdateStatus}
                style={{ background: "hsl(var(--navy))", color: "white" }}
                className="w-full sm:w-auto"
              >
                Update Status
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Modal - Mobile Optimized */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Put Driver on Leave</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedDriver?.name} will be marked as on leave
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Reason for Leave</label>
              <Input
                value={statusData.leave_reason}
                onChange={(e) => setStatusData({ ...statusData, leave_reason: e.target.value })}
                placeholder="e.g. Annual leave, sick leave..."
                className="h-10 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Expected Return Date (Optional)</label>
              <Input
                type="date"
                value={statusData.leave_end}
                onChange={(e) => setStatusData({ ...statusData, leave_end: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowLeaveModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                onClick={handleApplyLeave}
                style={{ background: "hsl(var(--navy))", color: "white" }}
                className="w-full sm:w-auto"
              >
                Apply Leave
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - Mobile Optimized */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Remove Driver</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to remove {selectedDriver?.name} from the system?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default CompanyDrivers;
