'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthSuccessData } from '@/types/user';

const USER_TYPES = [
  {
    value: 'CLIENT' as const,
    label: 'Client',
    desc: 'Hire & manage service providers',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    value: 'SP' as const,
    label: 'Service Provider',
    desc: 'Find work & grow your career',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
] as const;

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: '', color: 'bg-gray-200' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-accent-500' },
    { label: 'Strong', color: 'bg-success-500' },
  ];
  return { score, ...levels[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { userType: 'CLIENT', phone: '', password: '', confirmPassword: '' },
  });

  const selectedType = watch('userType');
  const passwordValue = watch('password') || '';
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (formData: SignupFormData) => {
    setServerError('');
    try {
      const res = await authApi.signup({
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        userType: formData.userType,
        companyName: formData.companyName || undefined,
      });

      const authData = res.data as AuthSuccessData;
      setAuth({
        user: authData.user,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });

      router.push(getDashboardPath(authData.user.userType));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr.response?.data?.message || 'Signup failed. Please try again.',
      );
    }
  };

  return (
    <div>
      {/* Mobile branding */}
      <div className="lg:hidden text-center mb-6">
        <h1 className="text-3xl font-bold text-navy-900">
          GIG<span className="text-accent-500">4U</span>
        </h1>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Create your account
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Get started with GIG4U in seconds.
      </p>

      {/* Actor type selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {USER_TYPES.map((ut) => (
          <button
            key={ut.value}
            type="button"
            onClick={() => setValue('userType', ut.value, { shouldValidate: true })}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all',
              selectedType === ut.value
                ? 'border-accent-500 bg-accent-50 text-accent-600'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
            )}
          >
            {ut.icon}
            <span className="text-sm font-semibold">{ut.label}</span>
            <span className="text-xs leading-tight">{ut.desc}</span>
          </button>
        ))}
      </div>

      {serverError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {selectedType === 'CLIENT' && (
          <Input
            id="companyName"
            label="Company Name"
            placeholder="Acme Corp"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
        )}

        <Input
          id="phone"
          label="Phone Number"
          placeholder="9876543210"
          maxLength={10}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          id="email"
          label="Email (optional)"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            error={errors.password?.message}
            {...register('password')}
          />
          {passwordValue.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i <= strength.score ? strength.color : 'bg-gray-200',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{strength.label}</span>
            </div>
          )}
        </div>

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full bg-navy-900 hover:bg-navy-800 focus:ring-navy-500"
          size="lg"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-accent-600 hover:text-accent-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
