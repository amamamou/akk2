'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getApiClient } from '@/lib/api-client';
import type { AuthUser, LoginRequest, LoginResponse } from '@/types/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component - wraps app and manages authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = getApiClient();

  // Helper: safe parse JWT expiry
  function isTokenExpired(token: string | null | undefined) {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload || typeof payload !== 'object') return true;
      if (!payload.exp) return false; // treat tokens with no exp as not expired
      return Date.now() / 1000 > payload.exp;
    } catch (e) {
      return true;
    }
  }

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        const token = apiClient.getToken();
        const tenantId = apiClient.getTenantId();
        const tenantSlug = apiClient.getTenantSlug();
        const userEmail = apiClient.getUserEmail();

        if (token) {
          // If token is expired, clear storage and redirect to login immediately
          if (isTokenExpired(token)) {
            try {
              if (typeof window !== 'undefined') {
                const keys = [
                  'akou_access_token','akou_tenant_id','akou_tenant_slug','akou_user','akou_user_email',
                  'fastapi_token','fastapi_tenant_id','fastapi_tenant_slug','fastapi_user','fastapi_user_email'
                ];
                keys.forEach(k => window.localStorage.removeItem(k));
              }
            } catch (e) {
              // ignore
            }
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
              return;
            } else {
              router.push('/login');
              return;
            }
          }
          // Prefer authoritative user data from the backend. Call the single
          // canonical endpoint /auth/me. If it 404s, fall back to any user
          // object persisted at login time (localStorage 'akou_user').
          try {
            const axiosInst = apiClient.getAxiosInstance();
            const resp = await axiosInst.get('/v1/auth/me');
            const body = resp?.data || resp;

            // Support { user, tenant } or flat user object
            let profileUser: any = null;
            let profileTenant: any = null;
            if (body?.user) {
              profileUser = body.user;
              profileTenant = body.tenant || null;
            } else if (body?.id && body?.email) {
              profileUser = body;
            }

            if (profileUser) {
              const userData: AuthUser = {
                id: profileUser.id || '',
                email: profileUser.email || userEmail || '',
                name: profileUser.name || profileUser.email?.split('@')[0] || (userEmail?.split('@')[0] || ''),
                tenantId: profileTenant?.id || tenantId || apiClient.getTenantId() || '',
                tenantSlug: profileTenant?.slug || tenantSlug || apiClient.getTenantSlug() || '',
              };

              setUser(userData);

              // Ensure API client has tenant stored so x-tenant-id is included on requests
              const currentToken = apiClient.getToken();
              if (currentToken && userData.tenantId) {
                try {
                  apiClient.setTokens(currentToken, userData.tenantId, userData.tenantSlug || '', userData.email);
                } catch (e) {
                  // ignore
                }
              }
            } else {
              // response didn't include a user object — fall back below
              const stored = typeof window !== 'undefined' ? window.localStorage.getItem('akou_user') : null;
              if (stored) {
                try {
                  const s = JSON.parse(stored) as AuthUser;
                  setUser(s);
                } catch (e) {
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            }
          } catch (err: any) {
            // If we got a 404 specifically, fall back to the last-login user stored in localStorage
            const status = err?.response?.status;
            if (status === 404) {
              const stored = typeof window !== 'undefined' ? window.localStorage.getItem('akou_user') : null;
              if (stored) {
                try {
                  const s = JSON.parse(stored) as AuthUser;
                  setUser(s);
                } catch (e) {
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            } else {
              // Other errors -> clear user to force login
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [apiClient]);

  // Listen for global unauthorized events (dispatched by api-client interceptor)
  useEffect(() => {
    const onUnauthorized = () => {
      // Perform a full logout so UI state is cleaned up
      try {
        apiClient.logout();
      } catch (e) {
        // ignore
      }
      setUser(null);
      router.push('/login');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('akou:unauthorized', onUnauthorized as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('akou:unauthorized', onUnauthorized as EventListener);
      }
    };
  }, [apiClient, router]);

  // Keep protected routes in sync with token deletion from DevTools or other tabs.
  useEffect(() => {
    if (pathname === '/login') return;

    const enforceAuth = () => {
      if (!apiClient.getToken()) {
        setUser(null);
        router.push('/login');
      }
    };

    enforceAuth();

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes('akou_')) {
        enforceAuth();
      }
    };

    const interval = window.setInterval(enforceAuth, 1000);
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [apiClient, pathname, router]);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: LoginResponse = await apiClient.login(credentials);

      // Extract user and tenant info
      const userData: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        tenantId: response.tenant.id,
        tenantSlug: response.tenant.slug,
      };

      setUser(userData);

      // Persist a lightweight user object so we can fall back if /v1/auth/me is
      // not available immediately. Avoid storing tokens here (apiClient handles it).
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('akou_user', JSON.stringify(userData));
        }
      } catch (e) {
        // ignore storage errors
      }

      // Ensure apiClient has tenant + token set (apiClient.login may already set token)
      try {
        const token = apiClient.getToken();
        if (token) apiClient.setTokens(token, userData.tenantId, userData.tenantSlug || '', userData.email);
      } catch (e) {
        // ignore
      }

      // After token is available, prefer to fetch authoritative profile
      try {
        const axiosInst = apiClient.getAxiosInstance();
        const resp = await axiosInst.get('/v1/auth/me');
        const body = resp?.data || resp;

        let profileUser: any = null;
        let profileTenant: any = null;
        if (body?.user) {
          profileUser = body.user;
          profileTenant = body.tenant || null;
        } else if (body?.id && body?.email) {
          profileUser = body;
        }

        if (profileUser) {
          const fetched: AuthUser = {
            id: profileUser.id || userData.id,
            email: profileUser.email || userData.email,
            name: profileUser.name || userData.name,
            tenantId: profileTenant?.id || userData.tenantId,
            tenantSlug: profileTenant?.slug || userData.tenantSlug,
          };
          setUser(fetched);
          try {
            if (typeof window !== 'undefined') window.localStorage.setItem('akou_user', JSON.stringify(fetched));
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        // If /v1/auth/me is not present (404) or fails, we already have login response user cached above
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error || err?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
      try {
        // Clear api client tokens and any stored user metadata
        try { apiClient.clearTokens(); } catch (e) { /* ignore */ }
        try {
          if (typeof window !== 'undefined') {
            // Remove only auth-related keys so unrelated app data is preserved
            const keys = [
              'akou_access_token','akou_tenant_id','akou_tenant_slug','akou_user','akou_user_email',
              'fastapi_token','fastapi_tenant_id','fastapi_tenant_slug','fastapi_user','fastapi_user_email'
            ];
            keys.forEach(k => window.localStorage.removeItem(k));
          }
        } catch (e) {
          // ignore
        }
      setUser(null);
      setError(null);
      // Perform a hard redirect so React state is fully reset
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context in components
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

