import { useState, useEffect } from "react";
import { 
  Plus, MapPin, Phone, Users, Package, Eye, EyeOff, 
  Search, Building2, TrendingUp, Loader2, Filter, ChevronRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useBranches } from "@/hooks/useBranches";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;

const CompanyBranches = () => {
  const { 
    branches, 
    loading, 
    stats,
    page, 
    setPage, 
    search, 
    setSearch, 
    status, 
    setStatus,
    createBranch,
    updateBranchStatus 
  } = useBranches();

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    town: '',
    phone: '',
    address: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    manager_password: ''
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

  // Filter branches for display
  const filtered = branches.filter(b => {
    const matchSearch = search === '' || 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.town.toLowerCase().includes(search.toLowerCase()) ||
      b.manager_name.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = status === 'all' || b.status === status;
    return matchSearch && matchStatus;
  });
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
  };

  const resetModal = () => {
    setShowModal(false);
    setShowPassword(false);
    setFormData({
      name: '',
      code: '',
      town: '',
      phone: '',
      address: '',
      manager_name: '',
      manager_email: '',
      manager_phone: '',
      manager_password: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.code || !formData.town || 
        !formData.manager_name || !formData.manager_email || !formData.manager_password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createBranch(formData);
      resetModal();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile branch card component
  const MobileBranchCard = ({ branch }: { branch: any }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => {
        setSelectedBranch(branch);
        setShowDetailsModal(true);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" 
            style={{ background: "hsl(var(--navy))" }}
          >
            {branch.code.slice(0, 3)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-base">{branch.name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              {branch.town}
            </div>
          </div>
        </div>
        <span className={branch.status === "active" ? "badge-success" : "badge-danger"}>
          {branch.status}
        </span>
      </div>

      {/* Manager Info */}
      <div className="bg-slate-50 p-3 rounded-lg mb-3">
        <div className="text-xs text-muted-foreground mb-1">Branch Manager</div>
        <div className="font-medium text-foreground text-sm">{branch.manager_name}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Phone className="w-3 h-3" />
          {branch.phone || 'N/A'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Operators</div>
          <div className="text-sm font-bold text-foreground">{branch.operator_count}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Parcels</div>
          <div className="text-sm font-bold text-foreground">{formatNumber(branch.parcel_count)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Revenue</div>
          <div className="text-sm font-bold text-emerald-600">{formatCurrency(branch.revenue)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Tap for details
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );

  // Mobile Branch Details Modal
  const BranchDetailsModal = () => {
    if (!selectedBranch) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Branch Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Branch Header */}
            <div className="flex items-center gap-3">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0" 
                style={{ background: "hsl(var(--navy))" }}
              >
                {selectedBranch.code.slice(0, 3)}
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{selectedBranch.name}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {selectedBranch.town}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={selectedBranch.status === "active" ? "badge-success" : "badge-danger"}>
                {selectedBranch.status}
              </span>
            </div>

            {/* Manager Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">BRANCH MANAGER</h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="text-sm font-medium">{selectedBranch.manager_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm">{selectedBranch.phone || 'N/A'}</div>
                </div>
                {selectedBranch.address && (
                  <div>
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="text-sm">{selectedBranch.address}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Operators</div>
                <div className="text-xl font-bold text-foreground">{selectedBranch.operator_count}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Parcels</div>
                <div className="text-xl font-bold text-foreground">{formatNumber(selectedBranch.parcel_count)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-xl font-bold text-emerald-600">{formatCurrency(selectedBranch.revenue)}</div>
              </div>
            </div>

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

  if (loading && branches.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">Branches</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'Manage branch locations' : 'Manage all your branch locations across Kenya'}
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="w-full sm:w-auto gap-2 h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </Button>
      </div>

      {/* Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.totalBranches}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.activeBranches} active</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--navy))15` }}>
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--navy))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcels</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{formatNumber(stats.totalParcels)}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--amber))15` }}>
              <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--amber))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operators</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stats.totalOperators}</p>
              <p className="text-xs text-muted-foreground mt-1">Across branches</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--info))15` }}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--info))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--success))15` }}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--success))" }} />
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
              placeholder="Search branches..." 
              className="pl-9 h-10 text-sm" 
            />
          </div>
          
          <Button
            variant="outline"
            className="w-full gap-2 h-10"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4" />
            {showMobileFilters ? 'Hide Filters' : `Filter: ${status === 'all' ? 'All' : status}`}
          </Button>
          
          {showMobileFilters && (
            <div className="mt-3 animate-slide-down">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "inactive", label: "Inactive" },
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
                placeholder="Search branches, town, manager..." 
                className="pl-9 h-10" 
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "inactive", label: "Inactive" },
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

      {/* Branches Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map(branch => (
              <MobileBranchCard key={branch.id} branch={branch} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No branches found</p>
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
                  <th className="text-xs">Branch</th>
                  <th className="text-xs">Manager</th>
                  <th className="text-xs">Contact</th>
                  <th className="text-xs">Operators</th>
                  <th className="text-xs">Parcels</th>
                  <th className="text-xs">Revenue</th>
                  <th className="text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(b => (
                    <tr key={b.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" 
                            style={{ background: "hsl(var(--navy))" }}
                          >
                            {b.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{b.name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {b.town}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-foreground">
                          {b.manager_name}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {b.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span className="badge-navy text-xs">{b.operator_count} users</span>
                      </td>
                      <td className="font-semibold text-foreground text-sm">{formatNumber(b.parcel_count)}</td>
                      <td className="font-semibold text-foreground text-sm">{formatCurrency(b.revenue)}</td>
                      <td>
                        <span className={b.status === "active" ? "badge-success" : "badge-danger"}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No branches found
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

      {/* Add Branch Modal - Mobile Optimized */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-elevated animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-1">Add New Branch</h2>
            <p className="text-sm text-muted-foreground mb-4">Register a new branch location with manager credentials</p>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1.5">Branch Name *</label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Kisumu Branch" 
                    required
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1.5">Branch Code *</label>
                  <Input 
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. KSM" 
                    className="uppercase font-mono h-9 sm:h-10 text-sm" 
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1.5">Town / City *</label>
                  <Input 
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    placeholder="e.g. Kisumu" 
                    required
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1.5">Branch Phone</label>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+254 700 000000" 
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1.5">Physical Address</label>
                <Input 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Oginga Odinga St, Kisumu" 
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              
              <div className="border-t border-border pt-3 sm:pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Manager Credentials
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1.5">Manager Full Name *</label>
                    <Input 
                      name="manager_name"
                      value={formData.manager_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Agnes Auma" 
                      required
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1.5">Manager Email *</label>
                    <Input 
                      name="manager_email"
                      type="email"
                      value={formData.manager_email}
                      onChange={handleInputChange}
                      placeholder="manager@company.co.ke" 
                      required
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1.5">Manager Phone</label>
                    <Input 
                      name="manager_phone"
                      value={formData.manager_phone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000000" 
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1.5">Manager Login Password *</label>
                    <div className="relative">
                      <Input 
                        name="manager_password"
                        type={showPassword ? "text" : "password"} 
                        value={formData.manager_password}
                        onChange={handleInputChange}
                        placeholder="Set a strong password" 
                        required
                        className="h-9 sm:h-10 text-sm pr-10"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      The branch manager will use this to log in.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-9 sm:h-10 text-sm" 
                  onClick={resetModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 h-9 sm:h-10 text-sm" 
                  style={{ background: "hsl(var(--navy))", color: "white" }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Branch'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <BranchDetailsModal />}

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

export default CompanyBranches;
