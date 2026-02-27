'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/store';
import type { RoleInfo } from '@/types/user';
import { cn } from '@/lib/utils';

interface RoleSelectionModalProps {
  roles: RoleInfo[];
  tempToken: string;
  onClose: () => void;
}

export function RoleSelectionModal({
  roles,
  tempToken,
  onClose,
}: RoleSelectionModalProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelect = async (role: RoleInfo) => {
    setError('');
    setLoadingRoleId(role.id);
    try {
      const meRes = await authApi.getMe();

      const res = await authApi.selectRole({ roleId: role.id }, tempToken);
      const data = res.data!;

      setAuth({
        user: meRes.data!,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      router.push(getDashboardPath('ADMIN', role.name));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || 'Failed to select role',
      );
      setLoadingRoleId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Select Your Admin Role
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            You have multiple roles. Choose one to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              disabled={loadingRoleId !== null}
              onClick={() => handleSelect(role)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all',
                loadingRoleId === role.id
                  ? 'border-accent-500 bg-accent-50'
                  : 'border-gray-200 hover:border-accent-300 hover:bg-gray-50',
                loadingRoleId !== null &&
                  loadingRoleId !== role.id &&
                  'opacity-50',
              )}
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {role.displayName || role.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{role.name}</p>
              </div>
              {loadingRoleId === role.id && (
                <svg
                  className="animate-spin h-5 w-5 text-accent-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
