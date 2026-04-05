import { useState, useEffect, useCallback } from 'react';
import { branchTripsApi, Trip, CreateTripData, Vehicle, Driver, Branch } from '../api/branch-trips';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface TripStats {
  total: number;
  in_transit: number;
  arrived: number;
  scheduled: number;
  trips_today: number;
  total_parcels: number;
}

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [destBranches, setDestBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<TripStats>({
    total: 0,
    in_transit: 0,
    arrived: 0,
    scheduled: 0,
    trips_today: 0,
    total_parcels: 0
  });
  const [loading, setLoading] = useState({
    trips: false,
    create: false,
    vehicles: false,
    drivers: false,
    branches: false
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const fetchTrips = useCallback(async () => {
    setLoading(prev => ({ ...prev, trips: true }));
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      
      const response = await branchTripsApi.getTrips(params);
      if (response.success) {
        setTrips(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      console.error('Failed to fetch trips:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch trips');
    } finally {
      setLoading(prev => ({ ...prev, trips: false }));
    }
  }, [page, limit, search, status]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await branchTripsApi.getTripStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch trip stats:', error);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(prev => ({ ...prev, vehicles: true }));
    try {
      const response = await branchTripsApi.getAvailableVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(prev => ({ ...prev, vehicles: false }));
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoading(prev => ({ ...prev, drivers: true }));
    try {
      const response = await branchTripsApi.getAvailableDrivers();
      if (response.success) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(prev => ({ ...prev, drivers: false }));
    }
  }, []);

  const fetchDestBranches = useCallback(async () => {
    setLoading(prev => ({ ...prev, branches: true }));
    try {
      const response = await branchTripsApi.getDestinationBranches();
      if (response.success) {
        setDestBranches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch destination branches:', error);
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  }, []);

  useEffect(() => {
    fetchTrips();
    fetchStats();
  }, [fetchTrips, fetchStats]);

  const createTrip = async (data: CreateTripData) => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const response = await branchTripsApi.createTrip(data);
      if (response.success) {
        toast.success(
          `Trip created successfully!\n${response.data.trip_number}`,
          { duration: 5000, icon: '🚛' }
        );
        fetchTrips();
        fetchStats();
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create trip');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const markAsDeparted = async (tripId: string) => {
    try {
      const response = await api.patch(`/branch/trips/${tripId}/status`, { status: 'in_transit' });
      if (response.data.success) {
        toast.success('Trip marked as in transit', { icon: '🚚' });
        fetchTrips();
        fetchStats();
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update trip');
      throw error;
    }
  };

 // In useTrips.ts
const markAsArrived = async (tripId: string) => {
  try {
    // Use the new endpoint that updates both trip AND parcels
    const response = await api.post(`/branch/trips/${tripId}/confirm-arrival`);
    
    if (response.data.success) {
      toast.success(`Trip ${tripId} and parcels marked as arrived`, { icon: '✅' });
      fetchTrips();
      fetchStats();
      return response.data;
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to update trip');
    throw error;
  }
};

  const resetPage = () => setPage(1);

  const filtered = trips.filter(t => {
    const matchSearch = !search || 
      t.trip_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination_branch_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle_plate?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = status === 'all' || t.status === status;
    return matchSearch && matchStatus;
  });

  return {
    trips,
    filtered,
    vehicles,
    drivers,
    destBranches,
    stats,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    createTrip,
    markAsDeparted,
    markAsArrived,
    fetchVehicles,
    fetchDrivers,
    fetchDestBranches,
    resetPage,
    refresh: fetchTrips
  };
};