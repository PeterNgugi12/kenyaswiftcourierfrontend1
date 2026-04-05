import api from "./axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    token: string;
    expiresIn: string;
  };
}

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<LoginResponse>('/super-admin/login', credentials);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await api.get('/super-admin/profile');
    return response.data;
  },

  // Logout
  logout: async () => {
    localStorage.removeItem('token');
    const response = await api.post('/super-admin/logout');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: any) => {
    const response = await api.put('/super-admin/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    const response = await api.post('/super-admin/change-password', data);
    return response.data;
  },
};