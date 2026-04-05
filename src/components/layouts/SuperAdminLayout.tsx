import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, BarChart3, MessageSquare, Wallet,
  Package, LogOut, ChevronRight, Bell, Settings, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/superadmin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/superadmin/companies", icon: Building2, label: "Companies" },
  { to: "/superadmin/wallets", icon: Wallet, label: "Wallets" },
  { to: "/superadmin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/superadmin/sms", icon: MessageSquare, label: "SMS Monitor" },
];

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleLogout = () => {
    navigate("/login");
  };

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
          style={{ background: "hsl(var(--navy-dark))" }}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: "hsl(var(--navy-light))" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--amber))" }}>
                <Package className="w-4 h-4" style={{ color: "hsl(220 50% 8%)" }} />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none">CourierOS</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: "hsl(var(--amber))" }}>Super Admin</div>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
              Platform
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="text-xs font-semibold uppercase tracking-widest mt-6 mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
              System
            </div>
            <NavLink to="/superadmin/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t" style={{ borderColor: "hsl(var(--navy-light))" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}>
                SA
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">Super Admin</div>
                <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>Platform Owner</div>
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
          {/* Top Bar */}
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
                <span className="truncate max-w-[120px] font-medium">Platform</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "hsl(var(--amber))" }} />
                </button>
                
                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border p-4 z-50">
                    <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                    <p className="text-sm text-muted-foreground text-center">No new notifications</p>
                  </div>
                )}
              </div>
              <div className="text-xs font-medium text-muted-foreground hidden xs:inline">
                v2.0
              </div>
            </div>
          </header>

          {/* Page Content */}
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
      {/* Sidebar */}
      <aside className="w-64 flex flex-col flex-shrink-0" style={{ background: "hsl(var(--navy-dark))" }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "hsl(var(--navy-light))" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--amber))" }}>
              <Package className="w-4 h-4" style={{ color: "hsl(220 50% 8%)" }} />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">CourierOS</div>
              <div className="text-xs mt-0.5 font-medium" style={{ color: "hsl(var(--amber))" }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
            Platform
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="text-xs font-semibold uppercase tracking-widest mt-6 mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
            System
          </div>
          <NavLink to="/superadmin/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t" style={{ borderColor: "hsl(var(--navy-light))" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}>
              SA
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">Super Admin</div>
              <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>Platform Owner</div>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="top-nav">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>Platform</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "hsl(var(--amber))" }} />
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border p-4 z-50">
                  <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                  <p className="text-sm text-muted-foreground text-center">No new notifications</p>
                </div>
              )}
            </div>
            <div className="text-xs font-medium text-muted-foreground">Platform v2.0</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;