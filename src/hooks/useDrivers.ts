import { useState, useEffect, useCallback } from 'react';
import { driverApi, Driver, CreateDriverData } from '../api/drivers';
import { toast } from 'react-hot-toast';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    on_trip: 0,
    on_leave: 0,
    inactive: 0,
    total_trips: 0,
    avg_rating: 0
  });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [branchId, setBranchId] = useState<string>('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      if (branchId) params.branch_id = branchId;
      
      const response = await driverApi.getAll(params);
      setDrivers(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, branchId]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await driverApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch driver stats:', error);
    }
  }, []);

  const fetchAvailableVehicles = useCallback(async () => {
    try {
      const response = await driverApi.getAvailableVehicles();
      if (response.success) {
        setAvailableVehicles(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch available vehicles:', error);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchStats();
    fetchAvailableVehicles();
  }, [fetchDrivers, fetchStats, fetchAvailableVehicles]);

  const createDriver = async (data: CreateDriverData) => {
    try {
      const response = await driverApi.create(data);
      toast.success('Driver registered successfully');
      fetchDrivers();
      fetchStats();
      fetchAvailableVehicles();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register driver');
      throw error;
    }
  };

  const updateDriver = async (id: string, data: Partial<Driver>) => {
    try {
      const response = await driverApi.update(id, data);
      toast.success('Driver updated successfully');
      fetchDrivers();
      fetchAvailableVehicles();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update driver');
      throw error;
    }
  };

  const updateDriverStatus = async (id: string, status: string, leave_reason?: string, leave_end?: string) => {
    try {
      const response = await driverApi.updateStatus(id, { status, leave_reason, leave_end });
      toast.success(`Driver status updated to ${status.replace('_', ' ')}`);
      fetchDrivers();
      fetchStats();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      throw error;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await driverApi.delete(id);
      toast.success('Driver removed successfully');
      fetchDrivers();
      fetchStats();
      fetchAvailableVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove driver');
      throw error;
    }
  };

  return {
    drivers,
    stats,
    availableVehicles,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    branchId,
    setBranchId,
    createDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    refresh: fetchDrivers
  };
};