import { useState, useEffect } from "react";
import { 
  Plus, UserCog, Search, Users, UserCheck, UserX, Shield, 
  Clock, Mail, Settings, MoreHorizontal, Edit, Trash2, 
  Power, PowerOff, RefreshCw, Loader2, AlertCircle, Eye, EyeOff,
  Filter, ChevronRight, X
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
import { useBranchOperators } from "@/hooks/useBranchOperators";
import { useBranches } from "@/hooks/useBranches";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 5;

const CompanyUsers = () => {
  const { 
    operators, 
    loading, 
    total,
    page, 
    setPage, 
    search, 
    setSearch,
    branchId,
    setBranchId,
    status,
    setStatus,
    createOperator,
    updateOperator,
    updateOperatorStatus,
    deleteOperator,
    resetOperatorPassword,
    refresh
  } = useBranchOperators();

  const { branches } = useBranches();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    branch_id: ''
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter operators for display
  const filtered = operators.filter(op => {
    const matchSearch = search === '' || 
      op.full_name.toLowerCase().includes(search.toLowerCase()) ||
      op.email.toLowerCase().includes(search.toLowerCase()) ||
      (op.phone && op.phone.includes(search));
    
    const matchStatus = status === 'all' || 
      (status === 'active' && op.is_active) ||
      (status === 'inactive' && !op.is_active);
    
    const matchBranch = !branchId || op.branch_id === branchId;
    
    return matchSearch && matchStatus && matchBranch;
  });
  
  const paged = paginate(filtered, page, PAGE_SIZE);

  // Calculate stats
  const totalUsers = operators.length;
  const activeUsers = operators.filter(op => op.is_active).length;
  const inactiveUsers = operators.filter(op => !op.is_active).length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      branch_id: ''
    });
    setSelectedOperator(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password || !formData.branch_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await createOperator(formData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (operator: any) => {
    setSelectedOperator(operator);
    setFormData({
      full_name: operator.full_name,
      email: operator.email,
      phone: operator.phone || '',
      password: '',
      branch_id: operator.branch_id
    });
    setShowEditModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    setSubmitting(true);
    try {
      await updateOperator(selectedOperator.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branch_id
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (operator: any) => {
    setSelectedOperator(operator);
    setShowStatusModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedOperator) return;

    setSubmitting(true);
    try {
      await updateOperatorStatus(selectedOperator.id, !selectedOperator.is_active);
      setShowStatusModal(false);
      setSelectedOperator(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (operator: any) => {
    setSelectedOperator(operator);
    setShowDeleteModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOperator) return;

    setSubmitting(true);
    try {
      await deleteOperator(selectedOperator.id);
      setShowDeleteModal(false);
      setSelectedOperator(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = (operator: any) => {
    setSelectedOperator(operator);
    setPasswordData({ new_password: '', confirm_password: '' });
    setShowPasswordModal(true);
    if (isMobile) setShowDetailsModal(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedOperator) return;

    if (!passwordData.new_password || !passwordData.confirm_password) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetOperatorPassword(selectedOperator.id, passwordData.new_password);
      setShowPasswordModal(false);
      setSelectedOperator(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile user card component
  const MobileUserCard = ({ user }: { user: any }) => {
    const branchName = branches.find(b => b.id === user.branch_id)?.name || 'Unknown';
    
    return (
      <div 
        className="mobile-card p-4 mb-3 cursor-pointer active:bg-muted/50 transition-colors"
        onClick={() => {
          setSelectedOperator(user);
          setShowDetailsModal(true);
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "hsl(var(--navy))" }}>
              {user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-foreground text-base">{user.full_name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" /> {user.email}
              </div>
            </div>
          </div>
          <span className={user.is_active ? "badge-success" : "badge-danger"}>
            {user.is_active ? 'active' : 'inactive'}
          </span>
        </div>

        {/* Branch & Role */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 p-2 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Branch</div>
            <div className="text-sm font-medium">{branchName}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Role</div>
            <span className="badge-navy text-xs">Branch Operator</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Parcels Handled</div>
            <div className="text-lg font-bold text-foreground">{formatNumber(user.parcels || 0)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Last Login</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {user.last_login ? formatDate(user.last_login) : 'Never'}
            </div>
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
  };

  // Mobile User Details Modal
  const UserDetailsModal = () => {
    if (!selectedOperator) return null;
    
    const branchName = branches.find(b => b.id === selectedOperator.branch_id)?.name || 'Unknown';

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowDetailsModal(false)}
        />
        <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">User Details</h3>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* User Header */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "hsl(var(--navy))" }}>
                {selectedOperator.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{selectedOperator.full_name}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" /> {selectedOperator.email}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <span className={selectedOperator.is_active ? "badge-success" : "badge-danger"}>
                {selectedOperator.is_active ? 'active' : 'inactive'}
              </span>
            </div>

            {/* Branch Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">BRANCH ASSIGNMENT</h4>
              <div>
                <div className="text-sm font-medium">{branchName}</div>
                <div className="text-xs text-muted-foreground mt-1">Branch Operator</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Parcels Handled</div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(selectedOperator.parcels || 0)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Last Login</div>
                <div className="text-sm font-medium mt-1">
                  {selectedOperator.last_login ? formatDate(selectedOperator.last_login) : 'Never'}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {selectedOperator.phone && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">CONTACT</h4>
                <div className="text-sm">{selectedOperator.phone}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleEdit(selectedOperator)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleResetPassword(selectedOperator)}
              >
                <RefreshCw className="w-4 h-4" />
                Reset Password
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedOperator.is_active ? (
                <Button
                  variant="outline"
                  className="gap-2 text-amber-600"
                  onClick={() => handleStatusChange(selectedOperator)}
                >
                  <PowerOff className="w-4 h-4" />
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 text-emerald-600"
                  onClick={() => handleStatusChange(selectedOperator)}
                >
                  <Power className="w-4 h-4" />
                  Activate
                </Button>
              )}
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => handleDelete(selectedOperator)}
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

  if (loading && operators.length === 0) {
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
          <h1 className="page-title text-xl sm:text-2xl">Branch Users</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? `Manage ${totalUsers} users` : `Manage ${totalUsers} users across all branches`}
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="w-full sm:w-auto gap-2 h-10 sm:h-11 text-sm" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {/* Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">Users</p>
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
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{activeUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--success))15` }}>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--success))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{inactiveUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">Deactivated</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--destructive))15` }}>
              <UserX className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Branches</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{branches.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Locations</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--warning))15` }}>
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--warning))" }} />
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
              placeholder="Search name, email, branch..." 
              className="pl-9 h-10 text-sm" 
            />
          </div>
          
          <Button
            variant="outline"
            className="w-full gap-2 h-10"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4" />
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {showMobileFilters && (
            <div className="mt-3 animate-slide-down space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refresh()}
                className="w-full gap-2 h-10"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Desktop Filters */}
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
                placeholder="Search name, email, branch..." 
                className="pl-9 h-10" 
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select
                value={branchId}
                onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refresh()}
                className="gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Display - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-3 mb-4">
          {paged.length > 0 ? (
            paged.map(user => (
              <MobileUserCard key={user.id} user={user} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No users found</p>
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
                  <th className="text-xs">User</th>
                  <th className="text-xs">Branch</th>
                  <th className="text-xs">Role</th>
                  <th className="text-xs">Parcels</th>
                  <th className="text-xs">Last Login</th>
                  <th className="text-xs">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--navy))" }}>
                            {u.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{u.full_name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />{u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-foreground text-sm font-medium">
                        {branches.find(b => b.id === u.branch_id)?.name || 'Unknown'}
                      </td>
                      <td>
                        <span className="badge-navy text-xs">Branch Operator</span>
                      </td>
                      <td className="font-semibold text-foreground text-sm">{formatNumber(u.parcels || 0)}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {u.last_login ? formatDate(u.last_login) : 'Never'}
                        </div>
                      </td>
                      <td>
                        <span className={u.is_active ? "badge-success" : "badge-danger"}>
                          {u.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              <Settings className="w-3 h-3" />
                              Edit
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(u)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {u.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(u)}
                                className="text-amber-600"
                              >
                                <PowerOff className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(u)}
                                className="text-emerald-600"
                              >
                                <Power className="w-4 h-4 mr-2" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(u)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      No users found
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
      {isMobile && showDetailsModal && <UserDetailsModal />}

      {/* Create User Modal - Mobile Optimized */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Create Branch User</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new operator to a branch. They will use these credentials to log in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Full Name *</label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Faith Ochieng"
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Email *</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="faith@company.co.ke"
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Phone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254 700 000000"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Assign Branch *</label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleInputChange}
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="">— Select Branch —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Set Password *</label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
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
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                type="submit"
                style={{ background: "hsl(var(--navy))", color: "white" }}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal - Mobile Optimized */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update details for {selectedOperator?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
              className="h-9 sm:h-10 text-sm"
            />
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
              className="h-9 sm:h-10 text-sm"
            />
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone"
              className="h-9 sm:h-10 text-sm"
            />
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleInputChange}
              className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
              required
            >
              <option value="">— Select Branch —</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" style={{ background: "hsl(var(--navy))", color: "white" }} className="w-full sm:w-auto">
                Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal - Mobile Optimized */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedOperator?.is_active ? 'Suspend User' : 'Activate User'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to {selectedOperator?.is_active ? 'suspend' : 'activate'} {selectedOperator?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowStatusModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={handleToggleStatus}
              style={{ 
                background: selectedOperator?.is_active ? "hsl(var(--warning))" : "hsl(var(--success))",
                color: "white"
              }}
              className="w-full sm:w-auto"
            >
              {selectedOperator?.is_active ? 'Suspend' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal - Mobile Optimized */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Reset Password</DialogTitle>
            <DialogDescription className="text-sm">
              Set a new password for {selectedOperator?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="h-9 sm:h-10 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Re-enter password"
                  className="h-9 sm:h-10 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                onClick={handleConfirmResetPassword}
                style={{ background: "hsl(var(--navy))", color: "white" }}
                className="w-full sm:w-auto"
              >
                Reset Password
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - Mobile Optimized */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete User</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete {selectedOperator?.full_name}? This action cannot be undone.
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete User'}
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

export default CompanyUsers;
