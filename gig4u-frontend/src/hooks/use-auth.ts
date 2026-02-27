'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';

/**
 * Custom hook for auth actions: fetch profile, logout.
 */
export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getMe();
      if (res.data) {
        const token = useAuthStore.getState().accessToken;
        const refresh = useAuthStore.getState().refreshToken;
        if (token && refresh) {
          setAuth({ user: res.data, accessToken: token, refreshToken: refresh });
        }
      }
    } catch {
      clearAuth();
    }
  }, [setAuth, clearAuth, setLoading]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // swallow — still clear local state
    } finally {
      clearAuth();
      router.push('/login');
    }
  }, [clearAuth, router]);

  return { user, isAuthenticated, isLoading, fetchMe, logout };
}
