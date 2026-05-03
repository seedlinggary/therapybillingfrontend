import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { getMyTherapistProfile, updateTherapistProfile, getCalendarConnectUrl, getStripeConnectUrl, manualConnectStripe } from '../../api/clients'
import { CheckCircle, Calendar, CreditCard, User, ChevronDown } from 'lucide-react'
import type { Therapist } from '../../types'

const profileSchema = z.object({
  name: z.string().min(2),
  timezone: z.string().min(1),
  phone: z.string().optional(),
  license_number: z.string().optional(),
  bio: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
]

function StepIndicator({ step, label, done }: { step: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle className="w-6 h-6 text-green-500" />
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
          {step}
        </div>
      )}
      <span className={`text-sm font-medium ${done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{label}</span>
    </div>
  )
}

export function TherapistOnboarding() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const currentStep = params.get('step')
  const errorCode = params.get('error')
  const [showManualStripe, setShowManualStripe] = useState(false)
  const [manualAccountId, setManualAccountId] = useState('')

  const ONBOARDING_ERRORS: Record<string, string> = {
    calendar_api_disabled:
      'The Google Calendar API is not enabled on your Google Cloud project. Go to Google Cloud Console → APIs & Services → Enable "Google Calendar API", then try connecting again.',
    calendar_api_error:
      'Could not access Google Calendar. Make sure the Calendar API is enabled in your Google Cloud project.',
    calendar_token_failed:
      'Failed to complete Google Calendar authorization. Please try again.',
    calendar_denied:
      'Google Calendar access was denied. Please approve the calendar permissions to continue.',
    stripe_failed:
      'Stripe connection failed. Please try again.',
  }

  const { data: profile } = useQuery({
    queryKey: ['therapist-profile'],
    queryFn: getMyTherapistProfile,
  })

  // Force-refresh profile after OAuth redirects back with ?step=... so connected badges appear immediately
  useEffect(() => {
    if (currentStep) {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
    }
  }, [currentStep])

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      name: profile.name,
      timezone: profile.timezone,
      phone: profile.phone || '',
      license_number: profile.license_number || '',
      bio: profile.bio || '',
    } : undefined,
  })

  const profileMutation = useMutation({
    mutationFn: updateTherapistProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Profile saved')
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const handleCalendarConnect = async () => {
    try {
      const { auth_url } = await getCalendarConnectUrl()
      window.location.href = auth_url
    } catch {
      toast.error('Failed to initiate Google Calendar connection')
    }
  }

  const handleStripeConnect = async () => {
    try {
      const { auth_url } = await getStripeConnectUrl()
      window.location.href = auth_url
    } catch {
      toast.error('Failed to initiate Stripe connection')
    }
  }

  const manualStripeMutation = useMutation({
    mutationFn: () => manualConnectStripe(manualAccountId.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Stripe account connected')
      setShowManualStripe(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Invalid Stripe account ID')
    },
  })

  if (!profile) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Setup</h1>
          <p className="text-gray-500 mt-1">Complete these steps to start using TherapyBilling.</p>
        </div>
          {profile.onboarding_completed && (
          <button onClick={() => navigate('/therapist')} className="btn-secondary text-sm">
            Go to Dashboard →
          </button>
        )}
      </div>

      {errorCode && ONBOARDING_ERRORS[errorCode] && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Setup error</p>
          <p className="text-sm text-red-700">{ONBOARDING_ERRORS[errorCode]}</p>
        </div>
      )}

      {/* Progress */}
      <div className="card mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Setup Progress</h2>
        <div className="space-y-3">
          <StepIndicator step={1} label="Profile Information" done={!!profile.name} />
          <StepIndicator step={2} label="Connect Google Calendar" done={profile.google_calendar_connected} />
          <StepIndicator step={3} label="Connect Stripe Payments" done={profile.stripe_connected} />
        </div>
        {profile.onboarding_completed && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800 font-medium">Setup complete! You're ready to start.</p>
          </div>
        )}
      </div>

      {/* Profile form */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Profile Information</h2>
        </div>
        <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Timezone *</label>
              <select {...register('timezone')} className="input">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+1 555-0100" />
            </div>
            <div>
              <label className="label">License Number</label>
              <input {...register('license_number')} className="input" placeholder="LPC-12345" />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea {...register('bio')} className="input h-24 resize-none" placeholder="Tell clients about yourself..." />
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Google Calendar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Google Calendar</h2>
              <p className="text-sm text-gray-500">Connect to sync availability and create events automatically</p>
            </div>
          </div>
          {profile.google_calendar_connected ? (
            <span className="badge-green">Connected</span>
          ) : (
            <button onClick={handleCalendarConnect} className="btn-primary text-sm">
              Connect Calendar
            </button>
          )}
        </div>
      </div>

      {/* Stripe */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Stripe Payments</h2>
              <p className="text-sm text-gray-500">Connect your Stripe account to receive payments from clients</p>
            </div>
          </div>
          {profile.stripe_connected ? (
            <span className="badge-green">Connected</span>
          ) : (
            <button onClick={handleStripeConnect} className="btn-primary text-sm">
              Connect Stripe
            </button>
          )}
        </div>

        {!profile.stripe_connected && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowManualStripe(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showManualStripe ? 'rotate-180' : ''}`} />
              Or enter your Stripe account ID directly (local dev)
            </button>

            {showManualStripe && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">
                  Find your account ID in the{' '}
                  <span className="font-mono bg-gray-100 px-1 rounded">Settings → Business</span> section
                  of your Stripe dashboard. It starts with <span className="font-mono">acct_</span>.
                </p>
                <div className="flex gap-2">
                  <input
                    value={manualAccountId}
                    onChange={e => setManualAccountId(e.target.value)}
                    placeholder="acct_1AbcDef..."
                    className="input flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => manualStripeMutation.mutate()}
                    disabled={!manualAccountId.trim() || manualStripeMutation.isPending}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    {manualStripeMutation.isPending ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
