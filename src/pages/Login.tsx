import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroBanner from "@/assets/hero-banner.jpg";
import api from "@/api/axios";
import toast from 'react-hot-toast';

type Role = "superadmin" | "company" | "branch";

const roles = [
  { id: "superadmin" as Role, label: "Super Admin", color: "from-purple-600 to-purple-800", desc: "Platform management" },
  { id: "company" as Role, label: "Company Admin", color: "from-navy to-navy-dark", desc: "Company operations" },
  { id: "branch" as Role, label: "Branch Operator", color: "from-amber to-orange-600", desc: "Branch operations" },
];

const Login = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>("superadmin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    if (!email || !password) {
      toast.error('Please enter both email and password');
      setLoading(false);
      return;
    }

    const loginToast = toast.loading('Signing in...');

    try {
      console.log(`Attempting login for ${selectedRole} with email: ${email}`);
      
      let endpoint = "";
      let redirectPath = "";

      // Set endpoint based on role
      switch(selectedRole) {
        case "superadmin":
          endpoint = "/super-admin/login";
          redirectPath = "/superadmin/dashboard";
          break;
        case "company":
          endpoint = "/company/auth/login";
          redirectPath = "/company/dashboard";
          break;
        case "branch":
          endpoint = "/branch/auth/login";
          redirectPath = "/branch/dashboard";
          break;
      }

      const response = await api.post(endpoint, {
        email,
        password,
      });

      console.log("Login response:", response.data);

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;

        // Save token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", selectedRole);
        localStorage.setItem("companyId", user.company?.id || user.company_id);

        // Set default authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Show success toast
        toast.success(`Welcome back, ${user.name || user.email}!`, {
          icon: '👋',
          duration: 3000,
        });

        // Dismiss loading toast
        toast.dismiss(loginToast);

        // Redirect based on role
        navigate(redirectPath);
      } else {
        throw new Error("Invalid response structure");
      }

    } catch (error: any) {
      // Dismiss loading toast
      toast.dismiss(loginToast);

      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Handle different error scenarios with appropriate toast messages
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to the server. Please ensure the backend is running on http://localhost:5000', {
          duration: 6000,
        });
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password. Please use the credentials provided by your Super Admin.', {
          duration: 5000,
        });
      } else if (error.response?.status === 403) {
        toast.error('Your account has been deactivated. Please contact Super Admin.', {
          duration: 5000,
        });
      } else if (error.response?.status === 404) {
        toast.error('Login endpoint not found. Please check the API URL', {
          duration: 5000,
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message, {
          duration: 5000,
        });
      } else {
        toast.error(error.message || "Login failed. Please try again.", {
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo helper to show what credentials to use
  const getRoleHint = () => {
    switch(selectedRole) {
      case "superadmin":
        return "Use the Super Admin credentials you registered with";
      case "company":
        return "Use the email and password provided by your Super Admin when creating your company";
      case "branch":
        return "Use the credentials provided by your Company Admin";
      default:
        return "";
    }
  };

  const handleForgotPassword = () => {
    toast.custom((t) => (
      <div className={`bg-white rounded-lg shadow-lg p-4 max-w-md border-l-4 border-amber-500 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Forgot Password?
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please contact your {selectedRole === "company" ? "Super Admin" : "Company Admin"} to reset your password.
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-4 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden">
        <img src={heroBanner} alt="Kenya Courier OS" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark/90 via-navy/80 to-navy/60" />
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--amber))" }}>
              <Package className="w-6 h-6" style={{ color: "hsl(220 50% 8%)" }} />
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-none">CourierOS</div>
              <div className="text-xs" style={{ color: "hsl(var(--amber))" }}>Kenya</div>
            </div>
          </div>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-5xl font-bold text-white leading-tight mb-6">
              Kenya's Premier<br />
              <span style={{ color: "hsl(var(--amber))" }}>Courier Operating</span><br />
              System
            </div>
            <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-md">
              Multi-tenant parcel management built for Kenyan transport companies. 
              Track every parcel, every trip, every driver — in real time.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: "Secure Pickup Verification" },
                { icon: Zap, label: "Auto SMS Alerts" },
                { icon: Globe, label: "Multi-Branch Network" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <Icon className="w-5 h-5 mb-2" style={{ color: "hsl(var(--amber))" }} />
                  <div className="text-white text-xs font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-white/40 text-xs">© 2024 CourierOS Kenya. All rights reserved.</div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--navy))" }}>
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-foreground text-lg leading-none">CourierOS Kenya</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to your courier management portal</p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <Label className="text-sm font-semibold text-foreground mb-3 block">Sign in as</Label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id);
                    setEmail("");
                    setPassword("");
                    toast.dismiss(); // Dismiss any existing toasts
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedRole === r.id
                      ? "border-amber bg-amber/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className={`text-xs font-bold mb-0.5 ${selectedRole === r.id ? "text-foreground" : "text-foreground"}`}>
                    {r.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              {getRoleHint()}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1.5 h-11"
                placeholder={`Enter your ${selectedRole} email`}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button 
                  type="button" 
                  className="text-xs font-medium hover:underline" 
                  style={{ color: "hsl(var(--amber))" }}
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 pr-11"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold gap-2 mt-2"
              style={{ background: "hsl(var(--navy))", color: "white" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In as {roles.find(r => r.id === selectedRole)?.label} <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          {/* Help text for company admins - now using toast instead of static alert */}
          {selectedRole === "company" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800">
                <strong>Note for Company Admins:</strong> Use the email and password that your Super Admin provided when creating your company account. 
                If you don't have these credentials, please contact your Super Administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;