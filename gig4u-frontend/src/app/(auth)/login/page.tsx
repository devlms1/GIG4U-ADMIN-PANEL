'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RoleSelectionModal } from '@/components/auth/RoleSelectionModal';
import {
  isRoleSelectionResponse,
  type AuthSuccessData,
  type RoleSelectionData,
} from '@/types/user';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [roleSelection, setRoleSelection] = useState<RoleSelectionData | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (formData: LoginFormData) => {
    setServerError('');
    try {
      const res = await authApi.login(formData);
      const data = res.data!;

      if (isRoleSelectionResponse(data)) {
        setRoleSelection(data);
        return;
      }

      const authData = data as AuthSuccessData;
      setAuth({
        user: authData.user,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });

      const roleName = authData.selectedRole?.name;
      router.push(getDashboardPath(authData.user.userType, roleName));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr.response?.data?.message || 'Login failed. Please try again.',
      );
    }
  };

  return (
    <>
      <div>
        {/* Mobile branding */}
        <div className="lg:hidden text-center mb-6">
          <h1 className="text-3xl font-bold text-navy-900">
            GIG<span className="text-accent-500">4U</span>
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-8">
          Sign in to your GIG4U account.
        </p>

        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            id="phone"
            label="Phone Number"
            placeholder="9876543210"
            maxLength={10}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div>
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="mt-1.5 text-right">
              <Link
                href="#"
                className="text-xs text-accent-600 hover:text-accent-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full bg-navy-900 hover:bg-navy-800 focus:ring-navy-500"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-accent-600 hover:text-accent-500"
          >
            Sign up
          </Link>
        </p>
      </div>

      {roleSelection && (
        <RoleSelectionModal
          roles={roleSelection.availableRoles}
          tempToken={roleSelection.tempToken}
          onClose={() => setRoleSelection(null)}
        />
      )}
    </>
  );
}
