import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { refreshToken as refreshOAuthToken } from '@/lib/oauth';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}

export function useAuth() {
  const [tokens, setTokens] = useLocalStorage<AuthTokens | null>('auth_tokens', null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!tokens) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Check if token is expired or expiring soon (within 5 minutes)
      const now = Date.now();
      const isExpiringSoon = tokens.expires_at < now + 5 * 60 * 1000;
      
      if (isExpiringSoon) {
        // Try to refresh
        try {
          console.log('🔄 [AUTH] Token expired or expiring soon, refreshing...');
          const newTokens = await refreshOAuthToken(tokens.refresh_token);
          const updatedTokens: AuthTokens = {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            expires_at: Date.now() + newTokens.expires_in * 1000,
          };
          setTokens(updatedTokens);
          setIsAuthenticated(true);
          console.log('✅ [AUTH] Token refreshed successfully');
        } catch (error) {
          console.error('❌ [AUTH] Token refresh failed:', error);
          setTokens(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    // Check immediately on mount
    checkAuth();

    // Check every 5 minutes for token expiration
    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens?.refresh_token, tokens?.expires_at, setTokens]);

  const login = (newTokens: { access_token: string; refresh_token: string; expires_in: number }) => {
    const authTokens: AuthTokens = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: Date.now() + newTokens.expires_in * 1000,
    };
    setTokens(authTokens);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setTokens(null);
    setIsAuthenticated(false);
    // Clear session storage as well
    sessionStorage.clear();
    // Redirect to home page (which will show login prompt)
    window.location.href = '/';
  };

  return {
    isAuthenticated,
    isLoading,
    accessToken: tokens?.access_token,
    login,
    logout,
  };
}

