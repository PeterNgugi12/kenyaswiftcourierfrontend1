// api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log("=".repeat(50));
    console.log("🚀 REQUEST SENT");
    console.log("=".repeat(50));
    console.log("Method:", config.method?.toUpperCase());
    console.log("URL:", `${config.baseURL}${config.url}`);
    console.log("Headers:", config.headers);
    console.log("Data:", config.data);
    
    // Add token if exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Token added:", token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log("=".repeat(50));
    console.log("✅ RESPONSE RECEIVED");
    console.log("=".repeat(50));
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);
    console.log("Data:", response.data);
    return response;
  },
  (error) => {
    console.log("=".repeat(50));
    console.log("❌ RESPONSE ERROR");
    console.log("=".repeat(50));
    
    if (error.code === 'ECONNABORTED') {
      console.error("Request timeout - Server took too long to respond");
    } else if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server - Check if backend is running");
      console.error("Request:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
    }
    
    console.error("Full error:", error);
    
    return Promise.reject(error);
  }
);

export default api;