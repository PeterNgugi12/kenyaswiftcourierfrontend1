import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GitBranch, Truck, Users, FileText, Wallet,
  Package, LogOut, Bell, Settings, ChevronRight, UserCog, Loader2, Menu, X
} from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/company/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/company/branches", icon: GitBranch, label: "Branches" },
  { to: "/company/vehicles", icon: Truck, label: "Vehicles" },
  { to: "/company/drivers", icon: Users, label: "Drivers" },
  { to: "/company/users", icon: UserCog, label: "Branch Users" },
  { to: "/company/wallet", icon: Wallet, label: "Wallet" },
  { to: "/company/reports", icon: FileText, label: "Reports" },
];

// Helper function to get company initials
const getCompanyInitials = (companyName: string) => {
  if (!companyName) return 'CM'; // Default fallback
  
  // Remove common words and special characters for cleaner initials
  const cleanName = companyName
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\b(limited|ltd|inc|corp|company|sacco|and|&)\b/gi, '') // Remove common suffixes
    .trim();
  
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'CM';
  
  if (words.length === 1) {
    // Single word - take first 2 letters
    return words[0].slice(0, 2).toUpperCase();
  } else {
    // Multiple words - take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  }
};

// Generate a consistent color based on company name
const getCompanyColor = (companyName: string) => {
  if (!companyName) return "hsl(var(--amber))";
  
  // Array of professional colors
  const colors = [
    "hsl(var(--amber))", // Default amber
    "#F97316", // Orange
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#14B8A6", // Teal
    "#F59E0B", // Yellow
    "#6366F1", // Indigo
  ];
  
  // Simple hash function to get consistent color index
  const hash = companyName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

const CompanyLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    companyName, 
    adminName, 
    initials: userInitials, 
    loading, 
    logout,
    companyLogo 
  } = useCompany();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoError, setLogoError] = useState(false);

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

  const handleLogout = async () => {
    await logout();
  };

  // Get company initials - either from the companyName or use provided initials
  const companyInitials = companyName ? getCompanyInitials(companyName) : 'CM';
  const companyColor = getCompanyColor(companyName || '');

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
          {/* Logo - Always show initials, never logo URL */}
          <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: companyColor }}
              >
                {companyInitials}
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none truncate max-w-[120px]">
                  {companyName || 'Company'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--amber))" }}>
                  Company Admin
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
              Management
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink 
                key={to} 
                to={to} 
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="text-xs font-semibold uppercase tracking-widest mt-6 mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
              System
            </div>
            <NavLink 
              to="/company/settings"
              className={({ isActive }) => 
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
                style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}
              >
                {userInitials || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">{adminName || 'Admin'}</div>
                <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>
                  Company Admin
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
                <span className="truncate max-w-[120px] font-medium">
                  {companyName || 'Company'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span 
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" 
                    style={{ background: "hsl(var(--amber))" }} 
                  />
                </button>
                
                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border p-4 z-50">
                    <p className="text-sm text-muted-foreground text-center">No new notifications</p>
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
      {/* Sidebar */}
      <aside className="w-64 flex flex-col flex-shrink-0" style={{ background: "hsl(var(--sidebar-background))" }}>
        {/* Logo - Always show initials, never logo URL */}
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: companyColor }}
            >
              {companyInitials}
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none truncate max-w-[120px]">
                {companyName || 'Company'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--amber))" }}>
                Company Admin
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
            Management
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink 
              key={to} 
              to={to} 
              className={({ isActive }) => 
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="text-xs font-semibold uppercase tracking-widest mt-6 mb-3 px-3" style={{ color: "hsl(220 20% 50%)" }}>
            System
          </div>
          <NavLink 
            to="/company/settings"
            className={({ isActive }) => 
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
              style={{ background: "hsl(var(--amber))", color: "hsl(220 50% 8%)" }}
            >
              {userInitials || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{adminName || 'Admin'}</div>
              <div className="text-xs truncate" style={{ color: "hsl(220 20% 55%)" }}>
                Company Admin
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="top-nav">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-medium">{companyName || 'Company'}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Company Admin</span>
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
                  <p className="text-sm text-muted-foreground text-center">No new notifications</p>
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

export default CompanyLayout;
