import { useState, useEffect, useCallback } from 'react';
import { branchOperatorApi, BranchOperator, CreateOperatorData, UpdateOperatorData } from '../api/branch-operators';
import { toast } from 'react-hot-toast';

export const useBranchOperators = () => {
  const [operators, setOperators] = useState<BranchOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState<string>('');
  const [status, setStatus] = useState<string>('all');

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (branchId) params.branch_id = branchId;
      if (status !== 'all') params.status = status;
      
      const response = await branchOperatorApi.getAll(params);
      setOperators(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error('Failed to fetch operators:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch operators');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, branchId, status]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const createOperator = async (data: CreateOperatorData) => {
    try {
      const response = await branchOperatorApi.create(data);
      toast.success('Branch operator created successfully');
      fetchOperators();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create operator');
      throw error;
    }
  };

  const updateOperator = async (id: string, data: UpdateOperatorData) => {
    try {
      const response = await branchOperatorApi.update(id, data);
      toast.success('Operator updated successfully');
      fetchOperators();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update operator');
      throw error;
    }
  };

  const updateOperatorStatus = async (id: string, is_active: boolean) => {
    try {
      const response = await branchOperatorApi.updateStatus(id, is_active);
      toast.success(`Operator ${is_active ? 'activated' : 'suspended'} successfully`);
      fetchOperators();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      throw error;
    }
  };

  const deleteOperator = async (id: string) => {
    try {
      await branchOperatorApi.delete(id);
      toast.success('Operator removed successfully');
      fetchOperators();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove operator');
      throw error;
    }
  };

  const resetOperatorPassword = async (id: string, newPassword: string) => {
    try {
      const response = await branchOperatorApi.resetPassword(id, newPassword);
      toast.success('Password reset successfully');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  };

  return {
    operators,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    branchId,
    setBranchId,
    status,
    setStatus,
    createOperator,
    updateOperator,
    updateOperatorStatus,
    deleteOperator,
    resetOperatorPassword,
    refresh: fetchOperators
  };
};