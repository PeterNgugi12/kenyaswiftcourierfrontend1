// In useParcelBooking.ts
import { useState, useEffect, useCallback } from 'react';
import { branchParcelsApi, Branch, Trip, CreateParcelData, CreateParcelResponse, Parcel, Receipt } from '../api/branch-parcels';
import { toast } from 'react-hot-toast';

export const useParcelBooking = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState({
    branches: false,
    trips: false,
    wallet: false,
    submit: false
  });

  const fetchBranches = useCallback(async () => {
    setLoading(prev => ({ ...prev, branches: true }));
    try {
      console.log("🔍 Fetching branches for destination...");
      const response = await branchParcelsApi.getBranches();
      console.log("📦 Branches API response:", response);
      
      if (response.success) {
        console.log("✅ Branches loaded:", response.data);
        setBranches(response.data);
      } else {
        console.warn("⚠️ No branches returned");
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch branches:', error);
      toast.error('Failed to load destination branches');
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(prev => ({ ...prev, trips: true }));
    try {
      const response = await branchParcelsApi.getAvailableTrips();
      if (response.success) {
        setTrips(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(prev => ({ ...prev, trips: false }));
    }
  }, []);

  const fetchWalletInfo = useCallback(async () => {
    setLoading(prev => ({ ...prev, wallet: true }));
    try {
      const response = await branchParcelsApi.getWalletInfo();
      if (response.success) {
        setWalletBalance(response.data.balance);
      }
    } catch (error: any) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, []);

  useEffect(() => {
    console.log("📋 useParcelBooking mounted, fetching data...");
    fetchBranches();
    fetchTrips();
    fetchWalletInfo();
  }, [fetchBranches, fetchTrips, fetchWalletInfo]);
// In useParcelBooking.ts
const createParcel = async (data: CreateParcelData) => {
  setLoading(prev => ({ ...prev, submit: true }));
  try {
    console.log("📤 Creating parcel with data:", data);
    const response = await branchParcelsApi.createParcel(data);
    console.log("📥 Create parcel response:", response);
    
    if (response.success) {
      toast.success(
        `Parcel booked successfully!\nTracking: ${response.data.parcel.tracking_number}`,
        { duration: 5000, icon: '📦' }
      );
      
      // Refresh wallet balance after booking
      fetchWalletInfo();
      
      // Return the full response data (includes both parcel and receipt)
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create parcel');
    }
  } catch (error: any) {
    console.error('❌ Failed to create parcel:', error);
    toast.error(error.response?.data?.message || error.message || 'Failed to book parcel');
    throw error;
  } finally {
    setLoading(prev => ({ ...prev, submit: false }));
  }
};

  const generateTrackingPreview = async (destinationBranch: string) => {
    try {
      const response = await branchParcelsApi.previewTracking(destinationBranch);
      if (response.success) {
        return response.data.tracking_number;
      }
    } catch (error) {
      console.error('Failed to generate tracking preview:', error);
    }
    return null;
  };

  // Temporarily always true
  const canBookParcel = true;

  return {
    branches,
    trips,
    walletBalance,
    loading,
    canBookParcel,
    createParcel,
    generateTrackingPreview,
    refresh: {
      branches: fetchBranches,
      trips: fetchTrips,
      wallet: fetchWalletInfo
    }
  };
};