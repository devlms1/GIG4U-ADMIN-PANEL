'use client';

import { useEffect, useState, useCallback } from 'react';
import { profileApi } from '@/lib/api';
import { PageHeader, Card, Avatar, StatusBadge, Button } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { cn } from '@/lib/utils';

interface SpProfileData {
  userId: string;
  fullName: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  profilePhotoUrl: string | null;
  spStatus: string;
  behaviorScore: string;
  ratingAvg: string;
  totalCompleted: number;
  user: { phone: string; email: string | null; createdAt: string };
}

const KYC_STEPS = [
  'PROFILE_INCOMPLETE',
  'KYC_PENDING',
  'KYC_SUBMITTED',
  'KYC_APPROVED',
  'ACTIVE',
];

function KycTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = KYC_STEPS.indexOf(currentStatus);
  const labels: Record<string, string> = {
    PROFILE_INCOMPLETE: 'Complete Profile',
    KYC_PENDING: 'KYC Pending',
    KYC_SUBMITTED: 'Under Review',
    KYC_APPROVED: 'Approved',
    ACTIVE: 'Active',
  };

  return (
    <div className="flex items-center gap-0">
      {KYC_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                  done
                    ? 'bg-success-500 border-success-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400',
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight w-16">
                {labels[step]}
              </span>
            </div>
            {i < KYC_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1',
                  i < currentIdx ? 'bg-success-500' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn('w-4 h-4', star <= rating ? 'text-yellow-400' : 'text-gray-200')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function SpProfilePage() {
  const [profile, setProfile] = useState<SpProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    city: '',
    state: '',
    pincode: '',
    gender: '',
    dateOfBirth: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await profileApi.getSpProfile();
      const d = res.data as unknown as SpProfileData;
      setProfile(d);
      setForm({
        fullName: d.fullName ?? '',
        city: d.city ?? '',
        state: d.state ?? '',
        pincode: d.pincode ?? '',
        gender: d.gender ?? '',
        dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
      });
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v) payload[k] = v;
      }
      await profileApi.updateSpProfile(payload);
      await fetchProfile();
      setToast('Profile updated successfully');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to update profile');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-gray-500">Profile not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: 'Dashboard', href: '/sp' }, { label: 'Profile' }]}
      />

      {toast && (
        <div className={cn(
          'mb-4 rounded-md p-3 text-sm',
          toast.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        )}>
          {toast}
        </div>
      )}

      {/* Profile header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile.fullName}
            src={profile.profilePhotoUrl}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {profile.fullName || 'Complete your profile'}
            </h2>
            <p className="text-sm text-gray-500">{profile.user.phone}</p>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={profile.spStatus} />
              <StarRating rating={parseFloat(profile.ratingAvg)} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" htmlFor="fullName" required>
                <input
                  id="fullName"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </FormField>

              <FormField label="Gender" htmlFor="gender">
                <select
                  id="gender"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField label="City" htmlFor="city" required>
                <input
                  id="city"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </FormField>

              <FormField label="State" htmlFor="state" required>
                <input
                  id="state"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </FormField>

              <FormField label="Pincode" htmlFor="pincode" required>
                <input
                  id="pincode"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </FormField>

              <FormField label="Date of Birth" htmlFor="dateOfBirth">
                <input
                  id="dateOfBirth"
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </FormField>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                isLoading={saving}
                className="bg-navy-900 hover:bg-navy-800"
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-6">
          <Card title="KYC Status">
            <KycTimeline currentStatus={profile.spStatus} />
          </Card>

          <Card title="Performance">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tasks Completed</span>
                <span className="text-lg font-bold text-gray-900">
                  {profile.totalCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rating</span>
                <StarRating rating={parseFloat(profile.ratingAvg)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Behavior Score</span>
                <span className="text-lg font-bold text-accent-600">
                  {parseFloat(profile.behaviorScore).toFixed(1)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
