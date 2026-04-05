import api from "./axios";
import { toast } from 'react-hot-toast';

export interface BranchOperator {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  branch: {
    id: string;
    name: string;
    code: string;
    town: string;
    company_id: string;
    company_name: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: BranchOperator;
    token: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export const branchAuthApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/branch/auth/login', credentials);
    return response.data;
  },

  // Get profile
  getProfile: async (): Promise<{ success: boolean; data: BranchOperator }> => {
    const response = await api.get('/branch/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: { full_name?: string; phone?: string }): Promise<{ success: boolean; message: string; data: BranchOperator }> => {
    const response = await api.put('/branch/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/branch/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/branch/auth/logout');
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ success: boolean; data: { token: string; expiresIn: string } }> => {
    const response = await api.post('/branch/auth/refresh-token', { refreshToken });
    return response.data;
  }
};