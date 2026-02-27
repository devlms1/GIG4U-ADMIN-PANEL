'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserType } from '@/types/user';
import { TokenService } from '@/lib/auth/token';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (params: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

function syncToCookie(state: Partial<AuthState>) {
  if (typeof document === 'undefined') return;
  const payload = JSON.stringify({ state });
  document.cookie = `gig4u-auth=${encodeURIComponent(payload)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'gig4u-auth=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: ({ user, accessToken, refreshToken }) => {
        TokenService.setTokens(accessToken, refreshToken);
        const next = {
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        };
        syncToCookie(next);
        set(next);
      },

      updateUser: (user) => set({ user }),

      clearAuth: () => {
        TokenService.clearTokens();
        clearCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'gig4u-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          syncToCookie({
            user: state.user,
            accessToken: state.accessToken,
            isAuthenticated: true,
          });
        }
      },
    },
  ),
);

/** Helper to derive the dashboard path from a user type. */
export function getDashboardPath(
  userType: UserType,
  roleName?: string,
): string {
  switch (userType) {
    case 'CLIENT':
      return '/client';
    case 'SP':
      return '/sp';
    case 'ADMIN': {
      const roleMap: Record<string, string> = {
        SUPER_ADMIN: '/admin/super',
        ADMIN_KYC: '/admin/kyc',
        ADMIN_FINANCE: '/admin/finance',
        ADMIN_OPS: '/admin/operations',
        ADMIN_SUPPORT: '/admin/support',
        ADMIN_MESSAGING: '/admin/messaging',
      };
      return roleName ? (roleMap[roleName] ?? '/admin/super') : '/admin/super';
    }
    default:
      return '/login';
  }
}
