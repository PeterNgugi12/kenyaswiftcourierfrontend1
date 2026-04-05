import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, PackagePlus, Truck, PackageCheck,
  Unlock, Package, LogOut, Bell, ChevronRight, List, Settings, Loader2, Menu, X
} from "lucide-react";
import { useBranchLayout } from "@/hooks/useBranchLayout";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/branch/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/branch/book-parcel", icon: PackagePlus, label: "Book Parcel" },
  { to: "/branch/trips", icon: Truck, label: "Trips" },
  { to: "/branch/parcels", icon: List, label: "All Parcels" },
  { to: "/branch/receive", icon: PackageCheck, label: "Receive Parcels" },
  { to: "/branch/release", icon: Unlock, label: "Release Parcel" },
];

const BranchLayout = () => {
  const navigate = useNavigate();
  const { 
    profile, 
    companyName, 
    branchName, 
    branchCode,
    operatorName, 
    initials, 
    pendingPickups,
    handleLogout,
    loading 
  } = useBranchLayout();

  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('menu-button');
        
        if (sidebar && !sidebar.contains(e.target) && !menuButton?.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "hsl(var(--amber))" }} />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside 
          id="mobile-sidebar"
          className={`fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ background: "hsl(var(--sidebar-background))" }}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--amber))" }}>
                <Package className="w-4 h-4" style={{ color: "hsl(220 50% 8%)" }} />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none truncate max-w-[120px]">
                  {branchName}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--amber))" }}>
                  Branch Operator
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
              Operations
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            <NavLink to="/branch/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">{operatorName}</div>
                <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>
                  {branchCode} Branch
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "hsl(220 20% 60%)" }}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="top-nav px-4">
            <button
              id="menu-button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="truncate max-w-[100px]">{branchName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {pendingPickups > 0 && (
                <div className="badge-warning flex items-center gap-1.5 px-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs">{pendingPickups}</span>
                </div>
              )}
              <div className="relative">
                <button 
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {pendingPickups > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border p-4 z-50">
                    <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                    {pendingPickups > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        <p>• {pendingPickups} parcel(s) pending pickup</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No new notifications</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-64 flex flex-col flex-shrink-0" style={{ background: "hsl(var(--sidebar-background))" }}>
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--amber))" }}>
              <Package className="w-4 h-4" style={{ color: "hsl(220 50% 8%)" }} />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none truncate max-w-[120px]">
                {branchName}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--amber))" }}>
                Branch Operator
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
            Operations
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <NavLink to="/branch/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{operatorName}</div>
              <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>
                {branchCode} Branch
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "hsl(220 20% 60%)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Desktop Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="top-nav">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{companyName}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{branchName}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Operator</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingPickups > 0 && (
              <div className="badge-warning flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingPickups} Pending Pickups
              </div>
            )}
            <div className="relative">
              <button 
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
                {pendingPickups > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border p-4 z-50">
                  <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                  {pendingPickups > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <p>• {pendingPickups} parcel(s) pending pickup</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BranchLayout;
