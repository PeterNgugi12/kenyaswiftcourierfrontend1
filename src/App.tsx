import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from 'react-hot-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Super Admin
import SuperAdminLayout from "./components/layouts/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import SuperAdminCompanies from "./pages/superadmin/Companies";
import SuperAdminAnalytics from "./pages/superadmin/Analytics";
import SuperAdminSMS from "./pages/superadmin/SMS";
import SuperAdminWallets from "./pages/superadmin/Wallets";
import SuperAdminSettings from "./pages/superadmin/Settings";

// Company Admin
import CompanyLayout from "./components/layouts/CompanyLayout";
import CompanyDashboard from "./pages/company/Dashboard";
import CompanyBranches from "./pages/company/Branches";
import CompanyVehicles from "./pages/company/Vehicles";
import CompanyDrivers from "./pages/company/Drivers";
import CompanyUsers from "./pages/company/Users";
import CompanyReports from "./pages/company/Reports";
import CompanyWallet from "./pages/company/Wallet";
import CompanySettings from "./pages/company/Settings";

// Branch Operator
import BranchLayout from "./components/layouts/BranchLayout";
import BranchDashboard from "./pages/branch/Dashboard";
import BookParcel from "./pages/branch/BookParcel";
import Trips from "./pages/branch/Trips";
import ReceiveParcels from "./pages/branch/ReceiveParcels";
import ReleaseParcel from "./pages/branch/ReleaseParcel";
import ParcelList from "./pages/branch/ParcelList";
import BranchSettings from "./pages/branch/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> {/* shadcn/ui toaster */}
      <Sonner /> {/* sonner toaster */}
      <HotToaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      /> {/* react-hot-toast toaster */}
      <BrowserRouter>
 
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Super Admin Routes */}
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="companies" element={<SuperAdminCompanies />} />
            <Route path="analytics" element={<SuperAdminAnalytics />} />
            <Route path="sms" element={<SuperAdminSMS />} />
            <Route path="wallets" element={<SuperAdminWallets />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Company Admin Routes */}
          <Route path="/company" element={<CompanyLayout />}>
            <Route index element={<Navigate to="/company/dashboard" replace />} />
            <Route path="dashboard" element={<CompanyDashboard />} />
            <Route path="branches" element={<CompanyBranches />} />
            <Route path="vehicles" element={<CompanyVehicles />} />
            <Route path="drivers" element={<CompanyDrivers />} />
            <Route path="users" element={<CompanyUsers />} />
            <Route path="reports" element={<CompanyReports />} />
            <Route path="wallet" element={<CompanyWallet />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>

          {/* Branch Operator Routes */}
          <Route path="/branch" element={<BranchLayout />}>
            <Route index element={<Navigate to="/branch/dashboard" replace />} />
            <Route path="dashboard" element={<BranchDashboard />} />
            <Route path="book-parcel" element={<BookParcel />} />
            <Route path="trips" element={<Trips />} />
            <Route path="receive" element={<ReceiveParcels />} />
            <Route path="release" element={<ReleaseParcel />} />
            <Route path="parcels" element={<ParcelList />} />
            <Route path="settings" element={<BranchSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
       
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
