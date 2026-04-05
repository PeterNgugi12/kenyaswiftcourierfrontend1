import api from "./axios";

export interface CompanyProfile {
  userCompany: any;
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  company: {
    id: string;
    name: string;
    code: string;
    logo_url?: string;
    status: string;
  };
}

export const companyApi = {
  // Get company admin profile with company details
  getProfile: async (): Promise<{ success: boolean; data: CompanyProfile }> => {
    const response = await api.get('/company/auth/profile');
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/company/auth/logout');
    return response.data;
  }
};