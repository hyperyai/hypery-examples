import { useEffect, useState } from 'react';
import { useLocalStorage } from './use-local-storage';
import { refreshToken as refreshOAuthToken, TokenResponse } from '../lib/oauth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export function useAuth() {
  const [authState, setAuthState] = useLocalStorage<AuthState>('auth', {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired or about to expire
  const isTokenExpired = () => {
    if (!authState.expiresAt) return true;
    // Consider expired if less than 5 minutes remaining
    return Date.now() >= authState.expiresAt - 5 * 60 * 1000;
  };

  // Check auth on mount only
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const setTokens = (tokens: TokenResponse) => {
    setAuthState({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });
  };

  const logout = () => {
    setAuthState({ accessToken: null, refreshToken: null, expiresAt: null });
    // Clear session storage as well
    sessionStorage.clear();
    // Redirect to home page (which will show login prompt)
    window.location.href = '/';
  };

  return {
    accessToken: authState.accessToken,
    isAuthenticated: !!authState.accessToken && !isTokenExpired(),
    isLoading,
    setTokens,
    logout,
  };
}
