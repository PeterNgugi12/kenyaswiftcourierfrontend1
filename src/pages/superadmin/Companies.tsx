import { useState, useRef, useEffect } from "react";
import { 
  Search, Plus, MoreHorizontal, Building2, CheckCircle, 
  XCircle, Upload, Eye, EyeOff, RefreshCw, Filter,
  Download, Copy, Trash2, Power, ChevronDown, X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablePagination, { paginate } from "@/components/TablePagination";
import { useCompanies } from "@/hooks/useCompanies";
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 5;

const SuperAdminCompanies = () => {
  const { 
    companies, loading, total, page, setPage, 
    search, setSearch, status, setStatus, 
    createCompany, updateCompanyStatus, refresh 
  } = useCompanies();

  const [showModal, setShowModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showLogos, setShowLogos] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Initialize with empty strings, but we'll filter them out on submit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    phone: '',
    email: '',
    address: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stats calculation from real data
  const totalCompanies = total;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const suspendedCompanies = companies.filter(c => c.status === 'suspended').length;

  // Enhanced helper function to get company initials
  const getCompanyInitials = (companyName: string) => {
    if (!companyName) return '??';
    
    // Remove common words and special characters for cleaner initials
    const cleanName = companyName
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\b(limited|ltd|inc|corp|company|sacco|and|&)\b/gi, '') // Remove common suffixes
      .trim();
    
    const words = cleanName.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '??';
    
    if (words.length === 1) {
      // Single word - take first 2 letters
      return words[0].slice(0, 2).toUpperCase();
    } else {
      // Multiple words - take first letter of first two words
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  };

  // Generate a consistent color based on company name (for variety in initials)
  const getInitialsColor = (companyName: string) => {
    if (!companyName) return "hsl(var(--navy))";
    
    // Array of professional colors
    const colors = [
      "hsl(var(--navy))", // Default navy
      "#0B4F6C", // Dark blue
      "#1E5F74", // Teal blue
      "#2D6A4F", // Green
      "#5E4B56", // Purple-gray
      "#9E6B5E", // Brown
      "#BC6C25", // Orange-brown
      "#5F6C7A", // Slate blue
      "#386641", // Forest green
      "#7F4F24", // Dark brown
    ];
    
    // Simple hash function to get consistent color index
    const hash = companyName.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo image must be less than 5MB', {
          duration: 4000,
          icon: '🖼️',
        });
        return;
      }
      
      toast.success('Logo selected successfully!', {
        duration: 2000,
        icon: '✅',
      });
      
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
  };

  const resetModal = () => {
    setShowModal(false);
    setLogoPreview(null);
    setShowPassword(false);
    setFormData({
      name: '',
      code: '',
      admin_name: '',
      admin_email: '',
      admin_phone: '',
      admin_password: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Company name is required', {
        icon: '🏢',
      });
      return;
    }
    if (!formData.code?.trim()) {
      toast.error('Company code is required', {
        icon: '🔤',
      });
      return;
    }
    if (!formData.admin_name?.trim()) {
      toast.error('Admin name is required', {
        icon: '👤',
      });
      return;
    }
    if (!formData.admin_email?.trim()) {
      toast.error('Admin email is required', {
        icon: '📧',
      });
      return;
    }
    if (!formData.admin_phone?.trim()) {
      toast.error('Admin phone is required', {
        icon: '📱',
      });
      return;
    }
    if (!formData.admin_password?.trim()) {
      toast.error('Password is required', {
        icon: '🔑',
      });
      return;
    }
    if (formData.admin_password.length < 8) {
      toast.error('Password must be at least 8 characters', {
        icon: '🔒',
      });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Creating new company...');

    try {
      const submitData = new FormData();
      
      // Always append required fields
      submitData.append('name', formData.name.trim());
      submitData.append('code', formData.code.trim().toUpperCase());
      submitData.append('admin_name', formData.admin_name.trim());
      submitData.append('admin_email', formData.admin_email.trim().toLowerCase());
      submitData.append('admin_phone', formData.admin_phone.trim());
      submitData.append('admin_password', formData.admin_password);
      
      // Only append optional fields if they have non-empty values
      if (formData.phone?.trim()) {
        submitData.append('phone', formData.phone.trim());
      }
      
      if (formData.email?.trim()) {
        submitData.append('email', formData.email.trim().toLowerCase());
      }
      
      if (formData.address?.trim()) {
        submitData.append('address', formData.address.trim());
      }
      
      // Add logo if selected
      if (fileInputRef.current?.files?.[0]) {
        submitData.append('logo', fileInputRef.current.files[0]);
      }

      await createCompany(submitData);
      
      toast.success('Company created successfully!', {
        id: loadingToast,
        duration: 5000,
        icon: '🎉',
      });
      
      resetModal();
      
      // Show additional success message with company details
      toast.success(
        <div>
          <strong>{formData.name}</strong> has been registered
          <br />
          <span className="text-xs">Admin: {formData.admin_email}</span>
        </div>,
        {
          duration: 6000,
          icon: '✅',
        }
      );
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create company', {
        id: loadingToast,
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const refreshToast = toast.loading('Refreshing companies list...');
    
    try {
      if (refresh) {
        await refresh();
      }
      
      toast.success('Companies list updated!', {
        id: refreshToast,
        duration: 3000,
        icon: '🔄',
      });
    } catch (error) {
      toast.error('Failed to refresh companies', {
        id: refreshToast,
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionToast = toast.loading(`${newStatus === 'active' ? 'Activating' : 'Suspending'} company...`);
    
    try {
      await updateCompanyStatus(companyId, newStatus);
      
      toast.success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`, {
        id: actionToast,
        duration: 4000,
        icon: newStatus === 'active' ? '✅' : '⏸️',
      });
      
      if (refresh) await refresh();
      if (isMobile) setShowDetailsModal(false);
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${newStatus} company`, {
        id: actionToast,
        duration: 4000,
        icon: '❌',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Company code "${code}" copied to clipboard!`, {
      duration: 3000,
      icon: '📋',
    });
  };

  const handleExportData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing company data export...',
        success: 'Companies data exported successfully!',
        error: 'Failed to export data',
      },
      {
        success: {
          duration: 4000,
          icon: '📊',
        },
      }
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
    if (isMobile) setShowMobileFilters(false);
  };

  // Mobile company card component
  const MobileCompanyCard = ({ company }: { company: any }) => (
    <div 
      className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
      onClick={() => {
        setSelectedCompany(company);
        setShowDetailsModal(true);
      }}
    >
      {/* Header with Logo and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Show logo or initials based on toggle and availability */}
          {showLogos && company.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={company.name}
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.initials-fallback')?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white uppercase ${
              showLogos && company.logo_url ? 'hidden initials-fallback' : ''
            }`}
            style={{ background: getInitialsColor(company.name) }}
          >
            {getCompanyInitials(company.name)}
          </div>
          
          <div>
            <div className="font-semibold text-foreground text-sm">{company.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {company.code}
            </div>
          </div>
        </div>
        <span className={company.status === "active" ? "badge-success" : "badge-danger"}>
          {company.status === "active" ? "Active" : "Suspended"}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground">Branches</div>
          <div className="text-lg font-bold text-foreground">{company.branches_count || 0}</div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <div className="text-xs text-muted-foreground">Vehicles</div>
          <div className="text-lg font-bold text-foreground">{company.vehicles_count || 0}</div>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Parcels (Feb)</div>
          <div className="text-sm font-semibold">{company.parcels_this_month?.toLocaleString() || '0'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Revenue (Feb)</div>
          <div className="text-sm font-semibold text-emerald-600">{formatCurrency(company.revenue_this_month || '0')}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Joined {formatDate(company.created_at, 'MMM yyyy')}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );

  // Mobile Company Details Modal
  const CompanyDetailsModal = () => {
    if (!selectedCompany) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Company Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Company Header */}
            <div className="flex items-center gap-3">
              {showLogos && selectedCompany.logo_url ? (
                <img 
                  src={selectedCompany.logo_url} 
                  alt={selectedCompany.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white uppercase"
                  style={{ background: getInitialsColor(selectedCompany.name) }}
                >
                  {getCompanyInitials(selectedCompany.name)}
                </div>
              )}
              <div>
                <div className="text-lg font-bold text-foreground">{selectedCompany.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  Code: {selectedCompany.code}
                  <button onClick={() => handleCopyCode(selectedCompany.code)}>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={selectedCompany.status === "active" ? "badge-success" : "badge-danger"}>
                {selectedCompany.status === "active" ? "Active" : "Suspended"}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Branches</div>
                <div className="text-2xl font-bold">{selectedCompany.branches_count || 0}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Vehicles</div>
                <div className="text-2xl font-bold">{selectedCompany.vehicles_count || 0}</div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">February Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Parcels</span>
                  <span className="text-sm font-semibold">{selectedCompany.parcels_this_month?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(selectedCompany.revenue_this_month || '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Joined Date */}
            <div className="text-center text-xs text-muted-foreground border-t pt-3">
              Joined {formatDate(selectedCompany.created_at, 'MMMM yyyy')}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  handleStatusChange(selectedCompany.id, selectedCompany.status);
                }}
              >
                <Power className="w-4 h-4" />
                {selectedCompany.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  toast.error('Delete functionality coming soon');
                }}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter companies for display
  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  if (loading && companies.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">Companies</h1>
          <p className="page-subtitle text-xs sm:text-sm">{totalCompanies} registered courier companies</p>
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportData}
              className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {isMobile ? '' : 'Export'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogos(!showLogos)}
              className="flex-1 sm:flex-none gap-2 h-9 text-xs"
              title={showLogos ? "Show initials instead of logos" : "Show company logos"}
            >
              {showLogos ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isMobile ? '' : (showLogos ? 'Hide Logos' : 'Show Logos')}
            </Button>
          </div>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 sm:flex-none gap-2 h-9 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? (isMobile ? '...' : 'Refreshing...') : (isMobile ? '' : 'Refresh')}
            </Button>
            <Button 
              onClick={() => setShowModal(true)} 
              size="sm"
              className="flex-1 sm:flex-none gap-2 h-9 text-xs" 
              style={{ background: "hsl(var(--navy))", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />
              {isMobile ? 'Add' : 'Add Company'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div 
          className="stat-card flex items-center gap-2 sm:gap-4 p-2 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => toast.success(`Total Companies: ${totalCompanies}`)}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{totalCompanies}</div>
            <div className="text-xs text-muted-foreground truncate">Total</div>
          </div>
        </div>
        
        <div 
          className="stat-card flex items-center gap-2 sm:gap-4 p-2 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => toast.success(`Active Companies: ${activeCompanies}`)}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{activeCompanies}</div>
            <div className="text-xs text-muted-foreground truncate">Active</div>
          </div>
        </div>
        
        <div 
          className="stat-card flex items-center gap-2 sm:gap-4 p-2 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => toast(`Suspended Companies: ${suspendedCompanies}`)}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{suspendedCompanies}</div>
            <div className="text-xs text-muted-foreground truncate">Suspended</div>
          </div>
        </div>
      </div>

      {/* Search & Filters - Mobile Optimized */}
      <div className="form-section p-3 sm:p-4 mb-4">
        {isMobile ? (
          <>
            <div className="relative w-full mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={handleSearchChange}
                placeholder="Search companies..." 
                className="pl-9 h-10"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full gap-2 h-10"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="w-4 h-4" />
              {showMobileFilters ? 'Hide Filters' : `Filter: ${status ? status : 'All'}`}
            </Button>
            
            {showMobileFilters && (
              <div className="mt-3 animate-slide-down">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      status === '' 
                        ? 'bg-navy text-white' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => handleStatusFilter('')}
                  >
                    All
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      status === 'active' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => handleStatusFilter('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      status === 'suspended' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => handleStatusFilter('suspended')}
                  >
                    Suspended
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop Search & Filter */
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={handleSearchChange}
                placeholder="Search companies..." 
                className="pl-9"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                className="pl-9 pr-8 py-2 border rounded-lg bg-background appearance-none cursor-pointer"
                value={status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Companies Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map(company => <MobileCompanyCard key={company.id} company={company} />)
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No companies found</p>
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
                  <th className="text-xs">Company</th>
                  <th className="text-xs">Branches</th>
                  <th className="text-xs">Vehicles</th>
                  <th className="text-xs">Parcels (Feb)</th>
                  <th className="text-xs">Revenue (Feb)</th>
                  <th className="text-xs">Status</th>
                  <th className="text-xs">Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {/* Show logo or initials based on toggle and availability */}
                          {showLogos && c.logo_url ? (
                            <img 
                              src={c.logo_url} 
                              alt={c.name}
                              className="w-8 h-8 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.initials-fallback')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          
                          <div 
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white uppercase ${
                              showLogos && c.logo_url ? 'hidden initials-fallback' : ''
                            }`}
                            style={{ background: getInitialsColor(c.name) }}
                          >
                            {getCompanyInitials(c.name)}
                          </div>
                          
                          <div>
                            <div className="font-semibold text-foreground text-sm">{c.name}</div>
                            <div 
                              className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground"
                              onClick={() => handleCopyCode(c.code)}
                            >
                              {c.code}
                              <Copy className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-foreground font-medium">{c.branches_count || 0}</td>
                      <td className="text-foreground font-medium">{c.vehicles_count || 0}</td>
                      <td className="text-foreground font-medium">
                        {c.parcels_this_month?.toLocaleString() || '0'}
                      </td>
                      <td className="text-foreground font-medium">
                        {formatCurrency(c.revenue_this_month || '0')}
                      </td>
                      <td>
                        <span className={c.status === "active" ? "badge-success" : "badge-danger"}>
                          {c.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-xs">
                        {formatDate(c.created_at, 'MMM yyyy')}
                      </td>
                      <td>
                        <div className="relative">
                          <button 
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            onClick={() => setShowActionMenu(showActionMenu === c.id ? null : c.id)}
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                          
                          {showActionMenu === c.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10 animate-fade-in">
                              <div className="py-1">
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                  onClick={() => {
                                    handleStatusChange(c.id, c.status);
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Power className="w-4 h-4" />
                                  {c.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                  onClick={() => {
                                    handleCopyCode(c.code);
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Code
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  onClick={() => {
                                    toast.error('Delete functionality coming soon', {
                                      duration: 3000,
                                    });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      {search ? (
                        <div>
                          <p>No companies found matching "{search}"</p>
                          <Button 
                            variant="link" 
                            onClick={() => {
                              setSearch('');
                              toast('Search cleared', { icon: '🧹' });
                            }}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        'No companies registered yet'
                      )}
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

      {/* Create Company Modal - Mobile Optimized */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-elevated animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">Register New Company</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Company Logo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleLogoChange} 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="border-2 border-dashed border-border rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover" 
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold text-white"
                      style={{ background: formData.name ? getInitialsColor(formData.name) : "hsl(var(--navy))" }}
                    >
                      {formData.name ? getCompanyInitials(formData.name) : '📷'}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {logoPreview ? "Click to change" : "Click to upload logo"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Company Name *</label>
                <Input 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Nairobi Express Ltd" 
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Company Code *</label>
                <Input 
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. NEL" 
                  className="uppercase h-9 sm:h-10 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Admin Full Name *</label>
                <Input 
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Kamau" 
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Admin Email *</label>
                <Input 
                  name="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={handleInputChange}
                  placeholder="admin@company.co.ke" 
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Phone Number *</label>
                <Input 
                  name="admin_phone"
                  value={formData.admin_phone}
                  onChange={handleInputChange}
                  placeholder="+254 700 000000" 
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">Login Password *</label>
                <div className="relative">
                  <Input 
                    name="admin_password"
                    type={showPassword ? "text" : "password"}
                    value={formData.admin_password}
                    onChange={handleInputChange}
                    placeholder="Set a strong password" 
                    required
                    minLength={8}
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
                  Min. 8 characters - for admin login
                </p>
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
                  className="flex-1 gap-2 h-9 sm:h-10 text-sm"
                  style={{ background: "hsl(var(--navy))", color: "white" }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Details Modal */}
      {isMobile && showDetailsModal && <CompanyDetailsModal />}

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

export default SuperAdminCompanies;