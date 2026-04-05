import { useState, useEffect, useCallback } from 'react';
import { vehicleApi, Vehicle, CreateVehicleData, Driver } from '../api/vehicles';
import { toast } from 'react-hot-toast';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    in_transit: 0,
    maintenance: 0,
    inactive: 0,
    sold: 0,
    total_trips: 0,
    total_parcels: 0
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [branchId, setBranchId] = useState<string>('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      if (branchId) params.branch_id = branchId;
      
      const response = await vehicleApi.getAll(params);
      if (response.success) {
        setVehicles(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      console.error('Failed to fetch vehicles:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, branchId]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await vehicleApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch vehicle stats:', error);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await vehicleApi.getActiveDrivers();
      if (response.success) {
        setDrivers(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchStats();
    fetchDrivers();
  }, [fetchVehicles, fetchStats, fetchDrivers]);

  const createVehicle = async (data: CreateVehicleData) => {
    try {
      const response = await vehicleApi.create(data);
      if (response.success) {
        toast.success('Vehicle registered successfully');
        fetchVehicles();
        fetchStats();
        fetchDrivers();
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register vehicle');
      throw error;
    }
  };

  const updateVehicle = async (id: string, data: Partial<CreateVehicleData>) => {
    try {
      const response = await vehicleApi.update(id, data);
      if (response.success) {
        toast.success('Vehicle updated successfully');
        fetchVehicles();
        fetchDrivers();
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
      throw error;
    }
  };

  const updateVehicleStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await vehicleApi.updateStatus(id, { status, notes });
      if (response.success) {
        toast.success(`Vehicle status updated to ${status.replace('_', ' ')}`);
        fetchVehicles();
        fetchStats();
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      throw error;
    }
  };

  const deleteVehicle = async (id: string, notes?: string) => {
    try {
      const response = await vehicleApi.delete(id, notes);
      if (response.success) {
        toast.success('Vehicle removed from fleet');
        fetchVehicles();
        fetchStats();
        fetchDrivers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove vehicle');
      throw error;
    }
  };

  // Helper to check if a driver is available for assignment
  const getAvailableDrivers = useCallback(() => {
    return drivers.filter(d => 
      d.status === 'active' && 
      (!d.vehicle_id || d.vehicle_id === 'Unassigned')
    );
  }, [drivers]);

  // Get driver name by ID
  const getDriverNameById = useCallback((driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : '';
  }, [drivers]);

  return {
    vehicles,
    drivers,
    stats,
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
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    getAvailableDrivers,
    getDriverNameById,
    refresh: fetchVehicles
  };
};