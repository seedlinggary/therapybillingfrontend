import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getMyTherapistProfile, updateTherapistProfile,
  getCalendarConnectUrl, getStripeConnectUrl, manualConnectStripe,
  disconnectGoogleCalendar, disconnectStripe,
} from '../../api/clients'
import {
  connectAccounting, disconnectAccounting, getAccountingStatus,
} from '../../api/accounting'
import { CreditCard, User, Calendar, Link2, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react'
import type { BillingFrequency } from '../../types'

interface SettingsForm {
  name: string
  phone: string
  license_number: string
  bio: string
  timezone: string
  payment_instructions: string
  country: string
  default_currency: string
  ils_exchange_rate: number
  default_session_price: number
  default_billing_frequency: BillingFrequency
  default_billing_anchor_day: number
}

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
  'Asia/Jerusalem',
]

const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ordinal(n: number) {
  if (n === 1 || n === 21) return 'st'
  if (n === 2 || n === 22) return 'nd'
  if (n === 3 || n === 23) return 'rd'
  return 'th'
}

export function TherapistSettings() {
  const qc = useQueryClient()
  const [manualStripeId, setManualStripeId] = useState('')
  const [showManualStripe, setShowManualStripe] = useState(false)
  const [showICountForm, setShowICountForm] = useState(false)
  const [iCountForm, setICountForm] = useState({ company_id: '', username: '', api_key: '' })

  const { data: profile } = useQuery({
    queryKey: ['therapist-profile'],
    queryFn: getMyTherapistProfile,
  })

  const isIL = (profile?.country || 'US').toUpperCase() === 'IL'

  const { data: accountingStatus } = useQuery({
    queryKey: ['accounting-status'],
    queryFn: getAccountingStatus,
    enabled: isIL,
  })

  const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<SettingsForm>()
  const billingFreq = watch('default_billing_frequency')
  const anchorDay = watch('default_billing_anchor_day')
  const watchedCountry = watch('country')
  const watchedCurrency = watch('default_currency')

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        license_number: profile.license_number ?? '',
        bio: profile.bio ?? '',
        timezone: profile.timezone ?? 'America/New_York',
        payment_instructions: profile.payment_instructions ?? '',
        country: profile.country ?? 'US',
        default_currency: profile.default_currency ?? 'USD',
        ils_exchange_rate: profile.ils_exchange_rate ?? 3.70,
        default_session_price: profile.default_session_price ?? 0,
        default_billing_frequency: profile.default_billing_frequency ?? 'same_day',
        default_billing_anchor_day: profile.default_billing_anchor_day ?? 0,
      })
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: updateTherapistProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const calConnectMutation = useMutation({
    mutationFn: getCalendarConnectUrl,
    onSuccess: ({ auth_url }) => { window.location.href = auth_url },
    onError: () => toast.error('Failed to start Google Calendar connection'),
  })

  const calDisconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Google Calendar disconnected')
    },
    onError: () => toast.error('Failed to disconnect Google Calendar'),
  })

  const stripeConnectMutation = useMutation({
    mutationFn: getStripeConnectUrl,
    onSuccess: ({ auth_url }) => { window.location.href = auth_url },
    onError: () => toast.error('Failed to start Stripe connection'),
  })

  const stripeManualMutation = useMutation({
    mutationFn: () => manualConnectStripe(manualStripeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Stripe account connected')
      setShowManualStripe(false)
      setManualStripeId('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Invalid Stripe account ID'),
  })

  const stripeDisconnectMutation = useMutation({
    mutationFn: disconnectStripe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('Stripe disconnected')
    },
    onError: () => toast.error('Failed to disconnect Stripe'),
  })

  const iCountConnectMutation = useMutation({
    mutationFn: () => connectAccounting({
      provider: 'icount',
      company_id: iCountForm.company_id,
      username: iCountForm.username,
      api_key: iCountForm.api_key,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-status'] })
      toast.success('iCount connected')
      setShowICountForm(false)
      setICountForm({ company_id: '', username: '', api_key: '' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Connection failed'),
  })

  const iCountDisconnectMutation = useMutation({
    mutationFn: () => disconnectAccounting('icount'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-status'] })
      toast.success('iCount disconnected')
    },
    onError: () => toast.error('Failed to disconnect iCount'),
  })

  if (!profile) return <div className="p-8 text-gray-400">Loading...</div>

  const billingDescription = () => {
    if (billingFreq === 'same_day')
      return 'A separate invoice is created and emailed at 2:00 AM UTC the same day you mark each session complete. Best for clients who pay per session.'
    if (billingFreq === 'next_day')
      return 'A separate invoice is created and emailed at 2:00 AM UTC the morning after you mark each session complete.'
    if (billingFreq === 'weekly') {
      const day = DOW_LABELS[anchorDay ?? 0]
      return `All completed sessions from the week are batched into one invoice and emailed at 2:00 AM UTC every ${day}. Clients receive one invoice per week instead of one per session.`
    }
    if (billingFreq === 'monthly') {
      const d = anchorDay ?? 1
      return `All completed sessions from the month are batched into one invoice and emailed at 2:00 AM UTC on the ${d}${ordinal(d)} of each month. Clients receive one invoice per month.`
    }
    return ''
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-6">

        {/* ── Profile ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input {...register('name')} className="input" />
              </div>
              <div>
                <label className="label">Timezone</label>
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
              <label className="label">Country</label>
              <select {...register('country')} className="input">
                <option value="US">🇺🇸 United States</option>
                <option value="IL">🇮🇱 Israel</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Israel requires connecting iCount for legally-compliant invoicing.
              </p>
            </div>

            {/* Currency — IL therapists can bill in ILS or USD */}
            {watchedCountry === 'IL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Default Currency</label>
                  <select {...register('default_currency')} className="input">
                    <option value="ILS">₪ ILS — Israeli Shekel</option>
                    <option value="USD">$ USD — US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="label">USD → ILS Rate</label>
                  <input
                    {...register('ils_exchange_rate', { valueAsNumber: true })}
                    type="number" step="0.01" min="0" className="input"
                    placeholder="3.70"
                  />
                  <p className="text-xs text-gray-400 mt-1">Used to convert invoices for iCount (always ILS internally)</p>
                </div>
              </div>
            )}

            <div>
              <label className="label">Default Session Price ({watchedCurrency === 'ILS' ? '₪' : '$'})</label>
              <input
                {...register('default_session_price', { valueAsNumber: true })}
                type="number" step="0.01" min="0" className="input"
                placeholder="150.00"
              />
              <p className="text-xs text-gray-400 mt-1">Applied when creating new clients. Can be overridden per client.</p>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea {...register('bio')} className="input h-20 resize-none"
                placeholder="Tell clients about yourself..." />
            </div>
          </div>
        </div>

        {/* ── Default Billing ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Default Billing Schedule</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Applied to new clients automatically. You can override this per-client from the Clients page.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Billing Frequency</label>
              <select {...register('default_billing_frequency')} className="input">
                <option value="same_day">Same Day — invoice when session completes</option>
                <option value="next_day">Next Day</option>
                <option value="weekly">Weekly — batch into one invoice per week</option>
                <option value="monthly">Monthly — batch into one invoice per month</option>
              </select>
            </div>

            {billingFreq === 'weekly' && (
              <div>
                <label className="label">Bill on (day of week)</label>
                <select {...register('default_billing_anchor_day', { valueAsNumber: true })} className="input">
                  {DOW_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            )}

            {billingFreq === 'monthly' && (
              <div>
                <label className="label">Bill on (day of month)</label>
                <select {...register('default_billing_anchor_day', { valueAsNumber: true })} className="input">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {billingFreq && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
                {billingDescription()}
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Instructions ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Payment Instructions</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Shown on <strong>every invoice email and PDF</strong> regardless of whether Stripe is connected.
          </p>
          <textarea
            {...register('payment_instructions')}
            className="input h-28 resize-none font-mono text-sm"
            placeholder={`e.g.:\nZelle: payments@yourpractice.com\nVenmo: @YourName\nCheck payable to: Jane Smith, LCSW`}
          />
          <p className="text-xs text-gray-400 mt-2">
            Leave blank if you only accept Stripe payments.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saveMutation.isPending || !isDirty} className="btn-primary px-6">
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* ── Integrations (outside the form — separate actions) ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Link2 className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Integrations</h2>
        </div>

        <div className="space-y-5">
          {/* Google Calendar */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                <p className="text-xs text-gray-500">Sync appointments automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile.google_calendar_connected ? (
                <>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected
                  </span>
                  <button
                    onClick={() => confirm('Disconnect Google Calendar? Future appointments will not sync.') && calDisconnectMutation.mutate()}
                    disabled={calDisconnectMutation.isPending}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Not connected
                  </span>
                  <button
                    onClick={() => calConnectMutation.mutate()}
                    disabled={calConnectMutation.isPending}
                    className="btn-primary text-xs px-3 py-1.5">
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stripe */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Stripe</p>
                <p className="text-xs text-gray-500">Accept online payments via Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile.stripe_connected ? (
                <>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected
                  </span>
                  <button
                    onClick={() => confirm('Disconnect Stripe? Clients will no longer be able to pay online.') && stripeDisconnectMutation.mutate()}
                    disabled={stripeDisconnectMutation.isPending}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                    Disconnect
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Not connected
                  </span>
                  <button
                    onClick={() => stripeConnectMutation.mutate()}
                    disabled={stripeConnectMutation.isPending}
                    className="btn-primary text-xs px-3 py-1.5">
                    Connect via OAuth
                  </button>
                  <button
                    onClick={() => setShowManualStripe(v => !v)}
                    className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg">
                    Manual
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Stripe entry */}
          {showManualStripe && !profile.stripe_connected && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600">Enter your Stripe Connect account ID (starts with <code>acct_</code>)</p>
              <div className="flex gap-2">
                <input
                  value={manualStripeId}
                  onChange={e => setManualStripeId(e.target.value)}
                  placeholder="acct_1ABC..."
                  className="input flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => stripeManualMutation.mutate()}
                  disabled={!manualStripeId || stripeManualMutation.isPending}
                  className="btn-primary px-4">
                  {stripeManualMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* iCount — Israel only */}
          {isIL && (
            <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">iCount (חשבונית ירוקה)</p>
                  <p className="text-xs text-gray-500">Required for legally-compliant Israeli invoicing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {accountingStatus?.is_active ? (
                  <>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Connected
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{accountingStatus.company_id}</span>
                    <button
                      onClick={() => {
                        setICountForm(f => ({ ...f, company_id: accountingStatus.company_id ?? '' }))
                        setShowICountForm(v => !v)
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
                      Edit
                    </button>
                    <button
                      onClick={() => confirm('Disconnect iCount?') && iCountDisconnectMutation.mutate()}
                      disabled={iCountDisconnectMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Not connected
                    </span>
                    <button
                      onClick={() => setShowICountForm(v => !v)}
                      className="btn-primary text-xs px-3 py-1.5">
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* iCount credentials form — shown for both connect and edit */}
          {isIL && showICountForm && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-blue-800 font-medium">
                {accountingStatus?.is_active ? 'Update iCount credentials' : 'Enter your iCount credentials'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label text-xs">Company ID (cid)</label>
                  <input
                    value={iCountForm.company_id}
                    onChange={e => setICountForm(f => ({ ...f, company_id: e.target.value }))}
                    placeholder="12345"
                    className="input text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="label text-xs">Username</label>
                  <input
                    value={iCountForm.username}
                    onChange={e => setICountForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="user@example.com"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">API Key / Password</label>
                  <input
                    type="password"
                    value={iCountForm.api_key}
                    onChange={e => setICountForm(f => ({ ...f, api_key: e.target.value }))}
                    placeholder="••••••••"
                    className="input text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => iCountConnectMutation.mutate()}
                  disabled={!iCountForm.company_id || !iCountForm.username || !iCountForm.api_key || iCountConnectMutation.isPending}
                  className="btn-primary text-sm px-4">
                  {iCountConnectMutation.isPending
                    ? 'Saving...'
                    : accountingStatus?.is_active ? 'Update Credentials' : 'Save & Connect'}
                </button>
                <button onClick={() => setShowICountForm(false)} className="btn-secondary text-sm px-4">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
