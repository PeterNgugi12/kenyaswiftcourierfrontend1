import { useState, useEffect, useCallback } from 'react';
import { companyApi, CompanyProfile } from '../api/company';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useCompany = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companyApi.getProfile();
      console.log('🔍 Company Profile API Response:', response); // Debug log
      
      if (response.success) {
        setProfile(response.data);
        console.log('✅ Profile data set:', response.data); // Debug log
        console.log('🏢 Company name:', response.data?.userCompany?.name); // Debug log
        console.log('👤 Admin name:', response.data?.full_name); // Debug log
        setError(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch company profile:', error);
      setError(error.response?.data?.message || 'Failed to load profile');
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await companyApi.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      navigate('/login');
    }
  };

  // Get initials from company name or admin name
  const getInitials = (): string => {
    // Try to get from company name first
    if (profile?.userCompany?.name) {
      const words = profile.userCompany.name.split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return profile.userCompany.name.slice(0, 2).toUpperCase();
    }
    // Fallback to admin name
    if (profile?.full_name) {
      const words = profile.full_name.split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    return 'CA';
  };

  return {
    profile,
    loading,
    error,
    // Try different possible paths to the company name
    companyName: profile?.userCompany?.name || profile?.company?.name || 'Company Name',
    companyCode: profile?.userCompany?.code || profile?.company?.code || '',
    companyLogo: profile?.userCompany?.logo_url || profile?.company?.logo_url,
    adminName: profile?.full_name || 'Company Admin',
    adminEmail: profile?.email || '',
    adminRole: 'Company Admin',
    initials: getInitials(),
    refresh: fetchProfile,
    logout: handleLogout
  };
};