import { useState, useEffect } from "react";
import { 
  Plus, Truck, Search, Car, Wrench, Navigation, Settings, 
  MoreHorizontal, Edit, Trash2, AlertCircle, Loader2, X, Check,
  Calendar, User, MapPin, Gauge, Filter, ChevronRight
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
import { useVehicles } from "@/hooks/useVehicles";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;

const CompanyVehicles = () => {
  const { 
    vehicles, 
    drivers,
    stats, 
    loading, 
    page, 
    setPage, 
    search, 
    setSearch, 
    status, 
    setStatus,
    getAvailableDrivers,
    getDriverNameById,
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle 
  } = useVehicles();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    plate_number: '',
    type: 'Bus',
    route: '',
    capacity: '',
    capacity_unit: 'units',
    branch_id: '',
    driver_id: '',
    driver_name: ''
  });

  const [statusData, setStatusData] = useState({
    status: '',
    notes: ''
  });

  const [deleteNotes, setDeleteNotes] = useState('');

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to get driver initials
  const getDriverInitials = (driverName: string) => {
    if (!driverName || driverName === 'Unassigned') return '?';
    return driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Filter vehicles
  const filtered = vehicles.filter(v => {
    const matchSearch = search === '' || 
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = status === 'all' || v.status === status;
    return matchSearch && matchStatus;
  });
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const statusColors: Record<string, string> = {
    active: "badge-success",
    in_transit: "badge-info",
    maintenance: "badge-warning",
    inactive: "badge-secondary",
    sold: "badge-destructive"
  };

  const typeIcons: Record<string, string> = {
    Bus: "🚌",
    Matatu: "🚐",
    Lorry: "🚛",
    Van: "🚚",
    Pickup: "🛻",
    Motorcycle: "🏍️"
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If driver is selected, also set driver_name
    if (name === 'driver_id') {
      const selectedDriver = drivers.find(d => d.id === value);
      setFormData(prev => ({
        ...prev,
        driver_id: value,
        driver_name: selectedDriver ? selectedDriver.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      plate_number: '',
      type: 'Bus',
      route: '',
      capacity: '',
      capacity_unit: 'units',
      branch_id: '',
      driver_id: '',
      driver_name: ''
    });
    setSelectedVehicle(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plate_number || !formData.type || !formData.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createVehicle({
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      setShowModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate,
      type: vehicle.type,
      route: vehicle.route === 'Not assigned' ? '' : vehicle.route,
      capacity: vehicle.capacity.toString(),
      capacity_unit: vehicle.capacity_unit || 'units',
      branch_id: vehicle.branch?.id || '',
      driver_id: vehicle.driver_id || '',
      driver_name: vehicle.driver === 'Unassigned' ? '' : vehicle.driver
    });
    setShowEditModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setSubmitting(true);
    try {
      await updateVehicle(selectedVehicle.id, {
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setStatusData({ status: '', notes: '' });
    setShowStatusModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedVehicle || !statusData.status) return;

    setSubmitting(true);
    try {
      await updateVehicleStatus(selectedVehicle.id, statusData.status, statusData.notes);
      setShowStatusModal(false);
      setSelectedVehicle(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDeleteNotes('');
    setShowDeleteModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedVehicle) return;

    setSubmitting(true);
    try {
      await deleteVehicle(selectedVehicle.id, deleteNotes);
      setShowDeleteModal(false);
      setSelectedVehicle(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  // Get available drivers (active and not assigned to any vehicle)
  const availableDrivers = getAvailableDrivers();

  // Mobile vehicle card component
  const MobileVehicleCard = ({ vehicle }: { vehicle: any }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => {
        setSelectedVehicle(vehicle);
        setShowDetailsModal(true);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: "hsl(var(--navy)/0.08)" }}>
            {typeIcons[vehicle.type] || "🚗"}
          </div>
          <div>
            <div className="font-bold font-mono text-foreground text-base">{vehicle.plate}</div>
            <span className="badge-navy text-xs mt-1 inline-block">{vehicle.type}</span>
          </div>
        </div>
        <span className={statusColors[vehicle.status] || "badge-info"}>
          {vehicle.status.replace("_", " ")}
        </span>
      </div>

      {/* Route */}
      <div className="bg-slate-50 p-3 rounded-lg mb-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{vehicle.route}</span>
        </div>
      </div>

      {/* Driver and Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Driver</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "hsl(var(--navy))" }}>
              {getDriverInitials(vehicle.driver)}
            </div>
            <span className="text-sm font-medium truncate">{vehicle.driver}</span>
          </div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Capacity</div>
          <div className="text-sm font-medium">{vehicle.capacity} {vehicle.capacity_unit}</div>
        </div>
      </div>

      {/* Trips and Parcels */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Trips</div>
          <div className="text-lg font-bold text-foreground">{vehicle.trips}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Parcels</div>
          <div className="text-lg font-bold text-foreground">{vehicle.parcels.toLocaleString()}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Tap for details & actions
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );

  // Mobile Vehicle Details Modal
  const VehicleDetailsModal = () => {
    if (!selectedVehicle) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Vehicle Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Vehicle Header */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl" style={{ background: "hsl(var(--navy)/0.08)" }}>
                {typeIcons[selectedVehicle.type] || "🚗"}
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-foreground">{selectedVehicle.plate}</div>
                <span className="badge-navy text-sm mt-1 inline-block">{selectedVehicle.type}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={statusColors[selectedVehicle.status] || "badge-info"}>
                {selectedVehicle.status.replace("_", " ")}
              </span>
            </div>

            {/* Route */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PRIMARY ROUTE</h4>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{selectedVehicle.route}</span>
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">ASSIGNED DRIVER</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(var(--navy))" }}>
                  {getDriverInitials(selectedVehicle.driver)}
                </div>
                <div>
                  <div className="text-sm font-medium">{selectedVehicle.driver}</div>
                  <div className="text-xs text-muted-foreground">Driver ID: {selectedVehicle.driver_id || 'Not assigned'}</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Trips</div>
                <div className="text-xl font-bold text-foreground">{selectedVehicle.trips}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Parcels</div>
                <div className="text-xl font-bold text-foreground">{selectedVehicle.parcels.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Capacity</div>
                <div className="text-xl font-bold text-foreground">{selectedVehicle.capacity}</div>
                <div className="text-xs text-muted-foreground">{selectedVehicle.capacity_unit}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleEdit(selectedVehicle)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleStatusChange(selectedVehicle)}
              >
                <Wrench className="w-4 h-4" />
                Status
              </Button>
            </div>
            
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => handleDelete(selectedVehicle)}
            >
              <Trash2 className="w-4 h-4" />
              Remove from Fleet
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && vehicles.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">Vehicles</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? `Fleet of ${stats.total} vehicles` : `Manage your fleet of ${stats.total} registered vehicles`}
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="w-full sm:w-auto gap-2 h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Register Vehicle
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
              <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--navy))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--success))15` }}>
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--success))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Transit</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.in_transit}</p>
              <p className="text-xs text-muted-foreground mt-1">On route</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--info))15` }}>
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--info))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Maintenance</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.maintenance}</p>
              <p className="text-xs text-muted-foreground mt-1">In service</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--warning))15` }}>
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--warning))" }} />
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
              placeholder="Search plate, driver, type..." 
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
                  { key: "in_transit", label: "In Transit" },
                  { key: "maintenance", label: "Maintenance" },
                  { key: "sold", label: "Sold" },
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
                placeholder="Search plate, driver, type..." 
                className="pl-9 h-10" 
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "in_transit", label: "In Transit" },
                { key: "maintenance", label: "Maintenance" },
                { key: "sold", label: "Sold" },
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

      {/* Vehicles Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map(vehicle => (
              <MobileVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No vehicles found</p>
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
                  <th className="text-xs">Vehicle</th>
                  <th className="text-xs">Type</th>
                  <th className="text-xs">Route</th>
                  <th className="text-xs">Driver</th>
                  <th className="text-xs">Trips</th>
                  <th className="text-xs">Parcels</th>
                  <th className="text-xs">Capacity</th>
                  <th className="text-xs">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "hsl(var(--navy)/0.08)" }}>
                            {typeIcons[v.type] || "🚗"}
                          </div>
                          <span className="font-bold font-mono text-foreground">{v.plate}</span>
                        </div>
                      </td>
                      <td><span className="badge-navy text-xs">{v.type}</span></td>
                      <td className="text-foreground font-medium text-sm">{v.route}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "hsl(var(--navy))" }}>
                            {getDriverInitials(v.driver)}
                          </div>
                          <span className="text-sm text-foreground truncate max-w-[100px]">{v.driver}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-foreground text-sm">{v.trips}</td>
                      <td className="font-semibold text-foreground text-sm">{v.parcels.toLocaleString()}</td>
                      <td className="text-muted-foreground text-sm">{v.capacity} {v.capacity_unit}</td>
                      <td>
                        <span className={statusColors[v.status] || "badge-info"}>
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(v)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(v)}>
                              <Wrench className="w-4 h-4 mr-2" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(v)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from Fleet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      No vehicles found
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
      {isMobile && showDetailsModal && <VehicleDetailsModal />}

      {/* Create Vehicle Modal - Mobile Optimized */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Register New Vehicle</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new vehicle to your fleet. All fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Number Plate <span className="text-red-500">*</span>
                </label>
                <Input
                  name="plate_number"
                  value={formData.plate_number}
                  onChange={handleInputChange}
                  placeholder="e.g. KAZ 123Y"
                  className="uppercase font-mono h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="Bus">Bus</option>
                  <option value="Matatu">Matatu</option>
                  <option value="Lorry">Lorry</option>
                  <option value="Van">Van</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <Input
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g. 50"
                  min="1"
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Unit</label>
                <select
                  name="capacity_unit"
                  value={formData.capacity_unit}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="units">Units</option>
                  <option value="kg">Kilograms</option>
                  <option value="tons">Tons</option>
                  <option value="passengers">Passengers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Assign Driver</label>
              <select
                name="driver_id"
                value={formData.driver_id}
                onChange={handleInputChange}
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">— Select Driver —</option>
                {availableDrivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.phone}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {availableDrivers.length === 0 ? 'No available drivers' : `${availableDrivers.length} driver(s) available`}
              </p>
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
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Modal - Mobile Optimized */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Vehicle</DialogTitle>
            <DialogDescription className="text-sm">
              Update vehicle details for {selectedVehicle?.plate}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Number Plate</label>
                <Input
                  name="plate_number"
                  value={formData.plate_number}
                  onChange={handleInputChange}
                  className="uppercase font-mono h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Vehicle Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="Bus">Bus</option>
                  <option value="Matatu">Matatu</option>
                  <option value="Lorry">Lorry</option>
                  <option value="Van">Van</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>
            </div>
            
            <Input
              name="route"
              value={formData.route}
              onChange={handleInputChange}
              placeholder="Route"
              className="h-9 sm:h-10 text-sm"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Capacity"
                required
                className="h-9 sm:h-10 text-sm"
              />
              <div>
                <label className="text-sm font-medium block mb-1.5">Driver</label>
                <select
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">— Select Driver —</option>
                  {drivers
                    .filter(d => d.status === 'active' && (!d.vehicle_id || d.vehicle_id === selectedVehicle?.id))
                    .map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.phone}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" style={{ background: "hsl(var(--navy))", color: "white" }} className="w-full sm:w-auto">
                Update Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal - Mobile Optimized */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Change Vehicle Status</DialogTitle>
            <DialogDescription className="text-sm">
              Update status for {selectedVehicle?.plate}
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
                <option value="in_transit">In Transit</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {statusData.status === 'maintenance' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Maintenance Notes</label>
                <Input
                  value={statusData.notes}
                  onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                  placeholder="e.g. Oil change, brake repair..."
                  className="h-10 text-sm"
                />
              </div>
            )}
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

      {/* Delete Confirmation Modal - Mobile Optimized */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Remove Vehicle from Fleet</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to remove {selectedVehicle?.plate}? This action can be reversed by updating the status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Reason for removal (optional)</label>
              <Input
                value={deleteNotes}
                onChange={(e) => setDeleteNotes(e.target.value)}
                placeholder="e.g. Vehicle sold, decommissioned..."
                className="h-10 text-sm"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove Vehicle'}
              </Button>
            </DialogFooter>
          </div>
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

export default CompanyVehicles;
