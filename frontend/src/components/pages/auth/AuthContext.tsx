import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { jwtDecode } from 'jwt-decode';

const BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL || '';
const API_VERSION = import.meta.env.VITE_API_VERSION_STR || '';

// Type for your JWT payload
interface JwtPayload {
  sub: string;        // user id
  email: string;      // user email  
  token_type: string; // "access" or "refresh"
  iat: number;        // issued at
  exp: number;        // expires at
}

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;   
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>; 
  magic_link: (token: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  api: AxiosInstance; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create authenticated axios instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${BASE_URL}${API_VERSION}`,
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
      async (error) => {
        if (error.response?.status === 401 && !isRefreshing) {
          setIsRefreshing(true);
          try {
            const newToken = await refreshToken();
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return axios.request(error.config);
            }
          } finally {
            setIsRefreshing(false);
          }
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


    // Helper function to decode and extract user info from token
  const updateUserInfoFromToken = (token: string | null) => {
      if (!token) {
        setUserEmail(null);
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        
        console.log('👤 User info updated:', { 
          email: decoded.email, 
        });
      } catch (error) {
        console.warn('⚠️ Failed to decode user info from token');
        setUserEmail(null);
      }
    };

      // Update setAccessToken calls to also extract user info
  const setAccessTokenWithUserInfo = (token: string | null) => {
    setAccessToken(token);
    setIsAuthenticated(Boolean(token));
    updateUserInfoFromToken(token);
  };

  const login = async (email: string, password: string) => {
      setIsLoading(true); // Set loading during login
      try {
        const resp = await axios.post(
          `${BASE_URL}${API_VERSION}/auth/login`,
          { email, password },
          { withCredentials: true }
        );
        console.log("Login response access_token:", resp.data.access_token);
        setAccessTokenWithUserInfo(resp.data.access_token)

        // Debug cookies after login
        setTimeout(() => {
          console.log("🍪 Checking cookies after login:");
          debugCookies();
        }, 100);
      } finally {
        setIsLoading(false); // Always stop loading
      }
    };

  const magic_link = async (token: string) => {
      setIsLoading(true); // Set loading during login
      try {
        const resp = await axios.post(
          `${BASE_URL}${API_VERSION}/auth/verify`,
          { token },
          { withCredentials: true }
        );
        console.log("Login response access_token:", resp.data.access_token);
        setAccessTokenWithUserInfo(resp.data.access_token)

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
    const refreshToken = async (): Promise<string | null> => {
      try {
        console.log("🔄 Attempting token refresh...");
        const resp = await axios.post(
          `${BASE_URL}${API_VERSION}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const token = resp.data.access_token;
        setAccessTokenWithUserInfo(token);
        console.log("✅ Token refresh successful");
        return token;
      } catch {
        console.log("❌ Refresh failed - user not authenticated");
        setAccessToken(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    };

    const logout = async () => {
      try {
        // Clear token immediately for UI responsiveness
        setAccessTokenWithUserInfo(null);
        
        // Then call backend to clear HttpOnly cookie
        await axios.post(`${BASE_URL}${API_VERSION}/auth/logout`, {}, { 
          withCredentials: true 
        });
        console.log('✅ Logout successful');
      } catch (error) {
        console.warn('⚠️ Logout request failed, but user is logged out locally');
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Check for existing session on app load
    useEffect(() => {
      console.log('🚀 App starting - checking for existing session');
      refreshToken();
    }, []);

    // 2. Schedule proactive token refresh
    useEffect(() => {
      if (!accessToken) {
        console.log('📴 No access token - skipping expiry timer');
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);

        if (decoded?.exp) {
          const timeUntilExpiry = decoded.exp * 1000 - Date.now();
          const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

          console.log(
            `⏰ Token expires in ${Math.floor(timeUntilExpiry / 1000)}s, refreshing in ${Math.floor(refreshTime / 1000)}s`
          );

          const timer = setTimeout(() => {
            console.log('🔄 Proactive token refresh triggered');
            refreshToken();
          }, refreshTime);

          return () => {
            console.log('⏹️ Clearing refresh timer');
            clearTimeout(timer);
          };
        } else {
          console.warn('⚠️ No `exp` claim found in token, skipping auto-refresh');
        }
      } catch (error) {
        console.warn('⚠️ Failed to decode access token for expiry handling', error);
      }
    }, [accessToken]);


  return (
    <AuthContext.Provider value={{ 
      accessToken, 
      userEmail,   
      login, 
      logout, 
      refreshToken, 
      magic_link,
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