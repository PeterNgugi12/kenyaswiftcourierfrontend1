import { useState, useEffect, useCallback } from 'react';
import { branchApi, Branch, CreateBranchData } from '../api/branches';
import { toast } from 'react-hot-toast';

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      
      const response = await branchApi.getAll(params);
      setBranches(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error('Failed to fetch branches:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = async (data: CreateBranchData) => {
    try {
      const response = await branchApi.create(data);
      toast.success('Branch created successfully');
      fetchBranches();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create branch');
      throw error;
    }
  };

  const updateBranchStatus = async (id: string, newStatus: string) => {
    try {
      await branchApi.updateStatus(id, newStatus);
      toast.success(`Branch status updated to ${newStatus}`);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      throw error;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await branchApi.delete(id);
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
      throw error;
    }
  };

  // Calculate statistics
  const stats = {
    totalBranches: branches.length,
    activeBranches: branches.filter(b => b.status === 'active').length,
    totalParcels: branches.reduce((sum, b) => sum + (b.parcel_count || 0), 0),
    totalRevenue: branches.reduce((sum, b) => sum + (b.revenue || 0), 0),
    totalOperators: branches.reduce((sum, b) => sum + (b.operator_count || 0), 0)
  };

  return {
    branches,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    stats,
    createBranch,
    updateBranchStatus,
    deleteBranch,
    refresh: fetchBranches
  };
};