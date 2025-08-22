import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AxiosInstance } from "axios";

interface AuthContextType {
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  api: AxiosInstance; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const isAuthenticated = Boolean(accessToken);

  // Create authenticated axios instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:8000',
    });

    // Add request interceptor
    instance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          console.log('🔑 Adding auth header to:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for auth errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🚫 401 Unauthorized - attempting token refresh');
          // Attempt to refresh token
          refreshToken();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken]); // Recreate when token changes

    // --- Debug function to check cookies ---
  const debugCookies = () => {
    console.log("=== COOKIE DEBUG ===");
    console.log("All document.cookie:", document.cookie);
    console.log("Cookies parsed:");
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    console.log(cookies);
    console.log("refresh_token specifically:", cookies['refresh_token']);
    console.log("===================");
  };


 const login = async (email: string, password: string) => {
    setIsLoading(true); // Set loading during login
    try {
      const resp = await axios.post(
        "http://localhost:8000/auth/login",
        { email, password },
        { withCredentials: true }
      );
      console.log("Login response access_token:", resp.data.access_token);
      setAccessToken(resp.data.access_token);

      // Debug cookies after login
      setTimeout(() => {
        console.log("🍪 Checking cookies after login:");
        debugCookies();
      }, 100);
    } finally {
      setIsLoading(false); // Always stop loading
    }
  };


    // --- Refresh token using HttpOnly cookie ---
  const refreshToken = async () => {
    try {
      console.log("🔄 Attempting token refresh...");
      const resp = await axios.post(
        "http://localhost:8000/auth/refresh",
        {},
        { withCredentials: true }
      );
      console.log("✅ Token refresh successful");
      setAccessToken(resp.data.access_token);
    } catch (err) {
      console.log("❌ Refresh failed - user not authenticated");
      setAccessToken(null);
    } finally {
      setIsLoading(false); // Stop loading whether success or failure
    }
  };
  
  // --- Logout user ---
  const logout = () => {
    setAccessToken(null);
    setIsLoading(false);
    // Optionally call backend logout endpoint to clear cookie
    axios.post("http://localhost:8000/auth/logout", {}, { withCredentials: true });
  };

  // --- Try to refresh token on first load ---
  useEffect(() => {
    refreshToken();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      accessToken, 
      login, 
      logout, 
      refreshToken, 
      isAuthenticated, 
      isLoading,
      api
    }}>
      {children}
    </AuthContext.Provider>
  );


};

// Hook for easy use
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};