import { useState, useEffect, useCallback } from 'react';
import { companyApi, Company } from '../api/companies';
import { toast } from 'react-hot-toast'; // or your toast library

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      
      const response = await companyApi.getAll(params);
      setCompanies(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (formData: FormData) => {
    try {
      const response = await companyApi.create(formData);
      toast.success('Company created successfully');
      fetchCompanies();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create company');
      throw error;
    }
  };

  const updateCompanyStatus = async (id: string, newStatus: string) => {
    try {
      await companyApi.updateStatus(id, newStatus);
      toast.success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return {
    companies,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    createCompany,
    updateCompanyStatus,
    refresh: fetchCompanies,
  };
};