import { useState, useEffect, useCallback } from 'react';
import { branchAuthApi, BranchOperator } from '../api/branch-auth';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useBranchAuth = () => {
  const [user, setUser] = useState<BranchOperator | null>(null);
  const [loading, setLoading] = useState({
    profile: false,
    login: false,
    update: false,
    password: false
  });
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const response = await branchAuthApi.getProfile();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'branch') {
      fetchProfile();
    }
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    setLoading(prev => ({ ...prev, login: true }));
    try {
      const response = await branchAuthApi.login({ email, password });
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('role', 'branch');
        localStorage.setItem('branchId', response.data.user.branch.id);
        
        setUser(response.data.user);
        
        toast.success(
          `Welcome back, ${response.data.user.full_name}! (${response.data.user.branch.name} Branch)`,
          { duration: 5000, icon: '👋' }
        );
        
        navigate('/branch/dashboard');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      
      toast.error(`Login Failed: ${errorMessage}`, { duration: 5000 });
      
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  const logout = async () => {
    try {
      await branchAuthApi.logout();
      toast.success('Logged Out - See you next time!', { duration: 3000 });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      setUser(null);
      navigate('/login');
    }
  };

  const updateProfile = async (data: { full_name?: string; phone?: string }) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const response = await branchAuthApi.updateProfile(data);
      if (response.success) {
        setUser(response.data);
        toast.success('Profile Updated - Your changes have been saved', { duration: 3000 });
        return response.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const changePassword = async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    setLoading(prev => ({ ...prev, password: true }));
    try {
      const response = await branchAuthApi.changePassword(data);
      if (response.success) {
        toast.success('Password Changed - Your password has been updated successfully', { duration: 3000 });
        return response;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const getInitials = () => {
    if (!user) return 'BO';
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return {
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    fetchProfile,
    initials: getInitials(),
    isAuthenticated: !!user
  };
};