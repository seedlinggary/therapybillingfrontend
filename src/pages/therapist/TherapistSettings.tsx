import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getMyTherapistProfile, updateTherapistProfile,
  getCalendarConnectUrl, getStripeConnectUrl, manualConnectStripe,
  disconnectGoogleCalendar, disconnectStripe,
  connectPayMe, disconnectPayMe,
  connectPayPal, disconnectPayPal,
} from '../../api/clients'
import {
  connectAccounting, disconnectAccounting, getAccountingStatus, updateGreenInvoiceDocType,
} from '../../api/accounting'
import { getExchangeRate } from '../../api/clients'
import { listServiceTypes, createServiceType, updateServiceType, deleteServiceType } from '../../api/serviceTypes'
import type { ServiceType } from '../../api/serviceTypes'
import { CreditCard, User, Calendar, Link2, CheckCircle, AlertCircle, Clock, BookOpen, Briefcase, Plus, Pencil, Trash2, Check, X as XIcon, Bell } from 'lucide-react'
import type { BillingFrequency } from '../../types'

interface SettingsForm {
  name: string
  business_type: string
  phone: string
  license_number: string
  bio: string
  timezone: string
  payment_instructions: string
  country: string
  default_currency: string
  default_session_price: number
  default_billing_frequency: BillingFrequency
  default_billing_anchor_day: number
  show_conversion_note: boolean
  reminder_frequency_days: number
  reminder_repeat: boolean
}

const TIMEZONES = [
  'Asia/Jerusalem',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
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
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState(50)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [editName, setEditName] = useState('')
  const [editDuration, setEditDuration] = useState(50)
  const [showICountForm, setShowICountForm] = useState(false)
  const [iCountForm, setICountForm] = useState({ company_id: '', username: '', api_key: '' })
  const [showGreenInvoiceForm, setShowGreenInvoiceForm] = useState(false)
  const [greenInvoiceForm, setGreenInvoiceForm] = useState({ api_key_id: '', api_key_secret: '' })
  const [greenInvoiceDocType, setGreenInvoiceDocType] = useState('receipt')
  const [showPayMeForm, setShowPayMeForm] = useState(false)
  const [payMeForm, setPayMeForm] = useState({ seller_id: '', api_key: '' })
  const [showPayPalForm, setShowPayPalForm] = useState(false)
  const [payPalEmail, setPayPalEmail] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['therapist-profile'],
    queryFn: getMyTherapistProfile,
    staleTime: 60_000,
  })

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
    staleTime: 300_000,
  })

  const addServiceMutation = useMutation({
    mutationFn: () => createServiceType({ name: newServiceName.trim(), duration_minutes: newServiceDuration }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-types'] })
      toast.success('Service added')
      setNewServiceName('')
      setNewServiceDuration(50)
    },
    onError: () => toast.error('Failed to add service'),
  })

  const saveServiceMutation = useMutation({
    mutationFn: (svc: ServiceType) => updateServiceType(svc.id, { name: editName.trim(), duration_minutes: editDuration }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-types'] })
      toast.success('Service updated')
      setEditingService(null)
    },
    onError: () => toast.error('Failed to update service'),
  })

  const removeServiceMutation = useMutation({
    mutationFn: deleteServiceType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-types'] })
      toast.success('Service removed')
    },
    onError: () => toast.error('Failed to remove service'),
  })

  const isIL = (profile?.country || 'US').toUpperCase() === 'IL'

  const { data: accountingStatuses = [] } = useQuery({
    queryKey: ['accounting-status'],
    queryFn: getAccountingStatus,
    enabled: isIL,
    staleTime: 60_000,
  })
  const iCountStatus = accountingStatuses.find(s => s.provider === 'icount')
  const greenInvoiceStatus = accountingStatuses.find(s => s.provider === 'green_invoice')
  // The "in use" provider is the most recently updated active one (matches factory logic)
  const activeProvider = accountingStatuses[0]?.provider ?? null

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<SettingsForm>()
  const billingFreq = watch('default_billing_frequency')
  const anchorDay = watch('default_billing_anchor_day')
  const reminderDays = watch('reminder_frequency_days')
  const reminderRepeat = watch('reminder_repeat')
  const watchedCountry = watch('country')
  const watchedCurrency = watch('default_currency')
  const watchedConversionNote = watch('show_conversion_note')

  const otherCurrency = watchedCurrency === 'ILS' ? 'USD' : 'ILS'
  const { data: rateData } = useQuery({
    queryKey: ['exchange-rate', watchedCurrency, otherCurrency],
    queryFn: () => getExchangeRate(watchedCurrency || 'USD', otherCurrency),
    staleTime: 5 * 60 * 1000,
    enabled: watchedConversionNote,
  })

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? '',
        business_type: profile.business_type ?? '',
        phone: profile.phone ?? '',
        license_number: profile.license_number ?? '',
        bio: profile.bio ?? '',
        timezone: profile.timezone ?? 'America/New_York',
        payment_instructions: profile.payment_instructions ?? '',
        country: profile.country ?? 'US',
        default_currency: profile.default_currency ?? 'USD',
        default_session_price: profile.default_session_price ?? 0,
        default_billing_frequency: profile.default_billing_frequency ?? 'same_day',
        default_billing_anchor_day: profile.default_billing_anchor_day ?? 0,
        show_conversion_note: profile.show_conversion_note ?? false,
        reminder_frequency_days: profile.reminder_frequency_days ?? 0,
        reminder_repeat: profile.reminder_repeat ?? true,
      })
    }
  }, [profile])

  useEffect(() => {
    if (greenInvoiceStatus?.green_invoice_doc_type) {
      setGreenInvoiceDocType(greenInvoiceStatus.green_invoice_doc_type)
    }
  }, [greenInvoiceStatus])

  const saveMutation = useMutation({
    mutationFn: (d: SettingsForm) => updateTherapistProfile({ ...d, reminder_repeat: reminderRepeat ?? true }),
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

  const greenInvoiceConnectMutation = useMutation({
    mutationFn: () => connectAccounting({
      provider: 'green_invoice',
      company_id: greenInvoiceForm.api_key_id,
      username: '',
      api_key: greenInvoiceForm.api_key_secret,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-status'] })
      toast.success('Green Invoice connected')
      setShowGreenInvoiceForm(false)
      setGreenInvoiceForm({ api_key_id: '', api_key_secret: '' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Connection failed'),
  })

  const greenInvoiceDisconnectMutation = useMutation({
    mutationFn: () => disconnectAccounting('green_invoice'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-status'] })
      toast.success('Green Invoice disconnected')
    },
    onError: () => toast.error('Failed to disconnect Green Invoice'),
  })

  const greenInvoiceDocTypeMutation = useMutation({
    mutationFn: (docType: string) => updateGreenInvoiceDocType(docType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-status'] })
      toast.success('Document type updated')
    },
    onError: () => toast.error('Failed to update document type'),
  })

  const payMeConnectMutation = useMutation({
    mutationFn: () => connectPayMe(payMeForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('PayMe connected')
      setShowPayMeForm(false)
      setPayMeForm({ seller_id: '', api_key: '' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to connect PayMe'),
  })

  const payMeDisconnectMutation = useMutation({
    mutationFn: disconnectPayMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('PayMe disconnected — switched back to Stripe')
    },
    onError: () => toast.error('Failed to disconnect PayMe'),
  })

  const payPalConnectMutation = useMutation({
    mutationFn: () => connectPayPal({ paypal_email: payPalEmail }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('PayPal connected')
      setShowPayPalForm(false)
      setPayPalEmail('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to connect PayPal'),
  })

  const payPalDisconnectMutation = useMutation({
    mutationFn: disconnectPayPal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-profile'] })
      toast.success('PayPal disconnected — switched back to Stripe')
    },
    onError: () => toast.error('Failed to disconnect PayPal'),
  })

  if (!profile) return <div className="p-8 text-gray-400">Loading...</div>

  const billingDescription = () => {
    if (billingFreq === 'same_day')
      return 'Invoice is sent automatically the moment you mark an appointment complete. Best for clients who pay per session.'
    if (billingFreq === 'next_day')
      return 'Invoice is sent at 2:00 AM UTC the morning after you mark an appointment complete.'
    if (billingFreq === 'weekly') {
      const day = DOW_LABELS[anchorDay ?? 0]
      return `All completed appointments from the week are batched into one invoice emailed at 2:00 AM UTC every ${day}.`
    }
    if (billingFreq === 'biweekly') {
      const day = DOW_LABELS[anchorDay ?? 0]
      return `All completed appointments are batched into one invoice emailed every other ${day} at 2:00 AM UTC.`
    }
    if (billingFreq === 'monthly') {
      const d = anchorDay ?? 1
      return `All completed appointments from the month are batched into one invoice emailed at 2:00 AM UTC on the ${d}${ordinal(d)} of each month.`
    }
    return ''
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
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
                <label className="label">Business Type</label>
                <input {...register('business_type')} className="input" placeholder="e.g. Therapy Practice, Barbershop, Nail Salon" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="label">Default Currency</label>
                <select {...register('default_currency')} className="input">
                  <option value="ILS">₪ ILS — Israeli Shekel</option>
                  <option value="USD">$ USD — US Dollar</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">USD invoices are converted to ILS at the live daily rate for iCount.</p>
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

        {/* ── Services ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Services</h2>
              <p className="text-sm text-gray-500">What you offer and the default duration for each.</p>
            </div>
          </div>

          {serviceTypes.length > 0 && (
            <div className="mb-4 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {serviceTypes.map(svc => (
                <div key={svc.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  {editingService?.id === svc.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="input flex-1 text-sm py-1"
                      />
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={editDuration}
                        onChange={e => setEditDuration(Number(e.target.value))}
                        className="input w-20 text-sm py-1"
                      />
                      <span className="text-xs text-gray-400">min</span>
                      <button
                        onClick={() => saveServiceMutation.mutate(svc)}
                        disabled={!editName.trim() || saveServiceMutation.isPending}
                        className="text-green-600 hover:text-green-800 p-1"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingService(null)} className="text-gray-400 hover:text-gray-600 p-1">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-500">{svc.duration_minutes} min</p>
                      </div>
                      <button
                        onClick={() => { setEditingService(svc); setEditName(svc.name); setEditDuration(svc.duration_minutes) }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeServiceMutation.mutate(svc.id)}
                        disabled={removeServiceMutation.isPending}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">Service Name</label>
              <input
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                className="input"
                placeholder="e.g. Haircut, Individual Session, Manicure"
              />
            </div>
            <div className="w-28">
              <label className="label">Duration (min)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={newServiceDuration}
                onChange={e => setNewServiceDuration(Number(e.target.value))}
                className="input"
              />
            </div>
            <button
              onClick={() => addServiceMutation.mutate()}
              disabled={!newServiceName.trim() || addServiceMutation.isPending}
              className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
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
                <option value="same_day">Same Day — invoice sent instantly on completion</option>
                <option value="next_day">Next Day</option>
                <option value="weekly">Weekly — batch into one invoice per week</option>
                <option value="biweekly">Biweekly — batch every 2 weeks</option>
                <option value="monthly">Monthly — batch into one invoice per month</option>
              </select>
            </div>

            {(billingFreq === 'weekly' || billingFreq === 'biweekly') && (
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

        {/* ── Payment Reminders ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Payment Reminders</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Automatically email clients with unpaid invoices. One email per client lists all outstanding balances. Set to 0 to disable.
          </p>
          <div className="space-y-4">
            <div>
              <label className="label">Send reminders every</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="365"
                  {...register('reminder_frequency_days', { valueAsNumber: true })}
                  className="input w-24"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600">days</span>
                <div className="flex gap-1.5 ml-2">
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValue('reminder_frequency_days', d, { shouldDirty: true })}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${reminderDays === d ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {reminderDays > 0 && (
              <div>
                <label className="label">Reminder mode</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      checked={reminderRepeat !== false}
                      onChange={() => setValue('reminder_repeat', true, { shouldDirty: true })}
                      className="mt-0.5 accent-primary-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Keep sending every {reminderDays} day{reminderDays === 1 ? '' : 's'} until paid</p>
                      <p className="text-xs text-gray-500">Client will receive repeated reminders until the invoice is marked paid.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      checked={reminderRepeat === false}
                      onChange={() => setValue('reminder_repeat', false, { shouldDirty: true })}
                      className="mt-0.5 accent-primary-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Send once, {reminderDays} day{reminderDays === 1 ? '' : 's'} after invoice</p>
                      <p className="text-xs text-gray-500">Each invoice gets exactly one reminder. No further emails after that.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              {!reminderDays || reminderDays === 0
                ? 'Reminders are disabled.'
                : reminderRepeat
                  ? `Clients with unpaid invoices will receive a reminder email every ${reminderDays} day${reminderDays === 1 ? '' : 's'} until they pay.`
                  : `Each invoice will receive one reminder email ${reminderDays} day${reminderDays === 1 ? '' : 's'} after it is issued. No repeat emails.`}
            </div>
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

        {/* ── Currency Conversion Note ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">💱</span>
            <h2 className="font-semibold text-gray-900">Currency Conversion Note</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Automatically appends a live exchange rate line to every invoice email.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <input
              id="show_conversion_note"
              type="checkbox"
              {...register('show_conversion_note')}
              className="w-4 h-4 accent-primary-600"
            />
            <label htmlFor="show_conversion_note" className="text-sm font-medium text-gray-700">
              Include conversion note on invoice emails
            </label>
          </div>

          {/* Live preview */}
          <div className={`rounded-lg border px-4 py-3 text-sm transition-colors ${watchedConversionNote ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Preview</p>
            {rateData ? (() => {
              const sym = (c: string) => c === 'ILS' ? '₪' : c === 'USD' ? '$' : c
              const sampleAmount = 100
              const converted = (sampleAmount * rateData.rate).toFixed(2)
              return (
                <p className={watchedConversionNote ? 'text-green-800' : 'text-gray-400'}>
                  💱 Today's conversion from {rateData.from} to {rateData.to} is {rateData.rate.toFixed(4)} —{' '}
                  {sym(rateData.from)}{sampleAmount}.00 = {sym(rateData.to)}{converted}
                </p>
              )
            })() : (
              <p className="text-gray-400">
                💱 Today's conversion from {watchedCurrency || 'USD'} to {otherCurrency} is{' '}
                {rateData === undefined && watchedConversionNote ? 'loading…' : '—'}{' '}
                {watchedConversionNote ? '' : '(enable to see live rate)'}
              </p>
            )}
          </div>
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
          <div className="py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                  <p className="text-xs text-gray-500">Sync appointments automatically — creates and removes events as you schedule.</p>
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
            {!profile.google_calendar_connected && (
              <div className="mt-2 ml-8 text-xs text-gray-500">
                <span className="font-medium">Setup:</span> Click Connect above and authorize access with your Google account.{' '}
                No configuration needed — your calendar syncs immediately after authorization.
              </div>
            )}
          </div>

          {/* Stripe */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Stripe</p>
                  <p className="text-xs text-gray-500">Accept online credit/debit card payments — clients get a payment link on every invoice.</p>
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
            {!profile.stripe_connected && (
              <div className="mt-2 ml-8 text-xs text-gray-500">
                <span className="font-medium">Setup:</span> Create a free account at{' '}
                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">stripe.com</a>
                , then click <em>Connect via OAuth</em> above. For manual setup, find your Account ID in Stripe Dashboard → Settings → Account details (starts with <code className="font-mono">acct_</code>).
              </div>
            )}
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

          {/* PayPal + Venmo */}
          <div className="py-3 border-t border-gray-100 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">PayPal (Not working yet) <span className="text-xs font-normal text-blue-600 ml-1">+ Venmo</span></p>
                  <p className="text-xs text-gray-500">Accept PayPal &amp; Venmo payments — clients see a PayPal checkout button on their invoices.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profile.paypal_connected ? (
                  <>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                    {profile.paypal_email && (
                      <span className="text-xs text-gray-400">{profile.paypal_email}</span>
                    )}
                    <button
                      onClick={() => { setPayPalEmail(profile.paypal_email ?? ''); setShowPayPalForm(v => !v) }}
                      className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
                      Edit
                    </button>
                    <button
                      onClick={() => confirm('Disconnect PayPal? Clients will be billed via Stripe instead.') && payPalDisconnectMutation.mutate()}
                      disabled={payPalDisconnectMutation.isPending}
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
                      onClick={() => setShowPayPalForm(v => !v)}
                      className="btn-primary text-xs px-3 py-1.5">
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
            {!profile.paypal_connected && (
              <div className="mt-2 ml-8 text-xs text-gray-500">
                <span className="font-medium">Setup:</span> Create a{' '}
                <a href="https://www.paypal.com/us/webapps/mpp/merchant" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">PayPal Business account</a>
                , then enter your PayPal email above. Venmo appears automatically for eligible US buyers.
              </div>
            )}
          </div>

          {/* PayPal credentials form */}
          {showPayPalForm && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-blue-800 font-medium">
                {profile.paypal_connected ? 'Update PayPal Business email' : 'Enter your PayPal Business email'}
              </p>
              <p className="text-xs text-blue-700">
                Clients pay via PayPal's hosted checkout — Venmo appears automatically for eligible buyers.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={payPalEmail}
                  onChange={e => setPayPalEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => payPalConnectMutation.mutate()}
                  disabled={!payPalEmail || payPalConnectMutation.isPending}
                  className="btn-primary px-4 text-sm">
                  {payPalConnectMutation.isPending
                    ? 'Saving...'
                    : profile.paypal_connected ? 'Update' : 'Save & Activate'}
                </button>
                <button onClick={() => setShowPayPalForm(false)} className="btn-secondary px-4 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Both connected — explain which is in use */}
          {isIL && iCountStatus && greenInvoiceStatus && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Both iCount and Green Invoice are connected. The one most recently saved is used for billing — currently <strong>{activeProvider === 'icount' ? 'iCount' : 'Green Invoice'}</strong>.
                To switch, save the other provider's credentials again or disconnect the one you don't want.
              </span>
            </div>
          )}

          {/* iCount — Israel only */}
          {isIL && (
            <div className="py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">iCount</p>
                    <p className="text-xs text-gray-500">Certified Israeli invoicing — legally compliant tax invoices (חשבונית מס), receipts, and VAT reporting.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {iCountStatus ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Connected
                      </span>
                      {activeProvider === 'icount' && (
                        <span className="text-xs bg-primary-100 text-primary-700 font-medium px-2 py-0.5 rounded-full">In use</span>
                      )}
                      <span className="text-xs text-gray-400 font-mono">{iCountStatus.company_id}</span>
                      <button
                        onClick={() => {
                          setICountForm(f => ({ ...f, company_id: iCountStatus.company_id ?? '' }))
                          setShowICountForm(v => !v)
                          setShowGreenInvoiceForm(false)
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
                        onClick={() => { setShowICountForm(v => !v); setShowGreenInvoiceForm(false) }}
                        className="btn-primary text-xs px-3 py-1.5">
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!iCountStatus && (
                <div className="mt-2 ml-8 text-xs text-gray-500">
                  <span className="font-medium">Setup:</span> Log in to{' '}
                  <a href="https://www.icount.co.il" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">icount.co.il</a>
                  {' '}→ Settings → API. Copy your <strong>Company ID (cid)</strong>, <strong>username</strong>, and your iCount <strong>password</strong> and enter them above.
                </div>
              )}
            </div>
          )}

          {/* PayMe — Israel only */}
          {isIL && (
            <div className="py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">PayMe (פייMי) (Not working yet)</p>
                    <p className="text-xs text-gray-500">Accept card &amp; Bit payments via PayMe — clients pay directly from their invoice.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {profile.payment_provider === 'payme' ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                      {profile.payme_seller_id && (
                        <span className="text-xs text-gray-400 font-mono">{profile.payme_seller_id}</span>
                      )}
                      <button
                        onClick={() => setShowPayMeForm(v => !v)}
                        className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
                        Edit
                      </button>
                      <button
                        onClick={() => confirm('Disconnect PayMe? Clients will be billed via Stripe instead.') && payMeDisconnectMutation.mutate()}
                        disabled={payMeDisconnectMutation.isPending}
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
                        onClick={() => setShowPayMeForm(v => !v)}
                        className="btn-primary text-xs px-3 py-1.5">
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
              {profile.payment_provider !== 'payme' && (
                <div className="mt-2 ml-8 text-xs text-gray-500">
                  <span className="font-medium">Setup:</span> Contact{' '}
                  <a href="https://payme.co.il" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">PayMe</a>
                  {' '}to open a seller account. Once approved, you'll receive a <strong>Seller ID</strong> and <strong>API Key</strong> from your PayMe dashboard.
                </div>
              )}
            </div>
          )}

          {/* PayMe credentials form */}
          {isIL && showPayMeForm && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-blue-800 font-medium">
                {profile.payment_provider === 'payme' ? 'Update PayMe credentials' : 'Enter your PayMe seller credentials'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Seller ID</label>
                  <input
                    value={payMeForm.seller_id}
                    onChange={e => setPayMeForm(f => ({ ...f, seller_id: e.target.value }))}
                    placeholder="e.g. MPL12345"
                    className="input text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="label text-xs">API Key</label>
                  <input
                    type="password"
                    value={payMeForm.api_key}
                    onChange={e => setPayMeForm(f => ({ ...f, api_key: e.target.value }))}
                    placeholder="••••••••"
                    className="input text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => payMeConnectMutation.mutate()}
                  disabled={!payMeForm.seller_id || !payMeForm.api_key || payMeConnectMutation.isPending}
                  className="btn-primary text-sm px-4">
                  {payMeConnectMutation.isPending
                    ? 'Saving...'
                    : profile.payment_provider === 'payme' ? 'Update Credentials' : 'Save & Activate'}
                </button>
                <button onClick={() => setShowPayMeForm(false)} className="btn-secondary text-sm px-4">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* iCount credentials form — shown for both connect and edit */}
          {isIL && showICountForm && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-blue-800 font-medium">
                {iCountStatus ? 'Update iCount credentials' : 'Enter your iCount credentials'}
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
                  <label className="label text-xs">Password</label>
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
                  {iCountConnectMutation.isPending ? 'Saving...' : iCountStatus ? 'Update Credentials' : 'Save & Connect'}
                </button>
                <button onClick={() => setShowICountForm(false)} className="btn-secondary text-sm px-4">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Green Invoice — Israel only */}
          {isIL && (
            <div className="py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Green Invoice (חשבונית ירוקה)</p>
                    <p className="text-xs text-gray-500">Certified Israeli invoicing — digital receipts and tax documents sent directly to clients.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {greenInvoiceStatus ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Connected
                      </span>
                      {activeProvider === 'green_invoice' && (
                        <span className="text-xs bg-primary-100 text-primary-700 font-medium px-2 py-0.5 rounded-full">In use</span>
                      )}
                      <button
                        onClick={() => { setShowGreenInvoiceForm(v => !v); setShowICountForm(false) }}
                        className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
                        Edit
                      </button>
                      <button
                        onClick={() => confirm('Disconnect Green Invoice?') && greenInvoiceDisconnectMutation.mutate()}
                        disabled={greenInvoiceDisconnectMutation.isPending}
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
                        onClick={() => { setShowGreenInvoiceForm(v => !v); setShowICountForm(false) }}
                        className="btn-primary text-xs px-3 py-1.5">
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!greenInvoiceStatus && (
                <div className="mt-2 ml-8 text-xs text-gray-500">
                  <span className="font-medium">Setup:</span> Log in to{' '}
                  <a href="https://app.greeninvoice.co.il" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Green Invoice</a>
                  {' '}→ Settings → Developer Tools → API Keys → Create new key. Copy the <strong>Key ID</strong> and <strong>Secret</strong> and enter them above.
                </div>
              )}
              {greenInvoiceStatus && (
                <div className="mt-3 ml-8 flex items-center gap-3">
                  <label className="text-xs text-gray-600 font-medium whitespace-nowrap">Document type:</label>
                  <select
                    value={greenInvoiceDocType}
                    onChange={e => {
                      setGreenInvoiceDocType(e.target.value)
                      greenInvoiceDocTypeMutation.mutate(e.target.value)
                    }}
                    className="input text-xs py-1 w-auto"
                  >
                    <option value="receipt">קבלה (Receipt — type 400, works for all business types)</option>
                    <option value="receipt_invoice">חשבון קבלה (Receipt Invoice — type 320)</option>
                    <option value="invoice">חשבונית מס (Tax Invoice — type 305, עוסק מורשה only)</option>
                  </select>
                  {greenInvoiceDocTypeMutation.isPending && <span className="text-xs text-gray-400">Saving...</span>}
                </div>
              )}
            </div>
          )}

          {/* Green Invoice credentials form */}
          {isIL && showGreenInvoiceForm && (
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-green-800 font-medium">
                {greenInvoiceStatus ? 'Update Green Invoice credentials' : 'Enter your Green Invoice API credentials'}
              </p>
              <p className="text-xs text-green-700">
                Find your API Key ID and Secret in Green Invoice → Settings → Developer Tools → API Keys.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">API Key ID</label>
                  <input
                    value={greenInvoiceForm.api_key_id}
                    onChange={e => setGreenInvoiceForm(f => ({ ...f, api_key_id: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="input text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="label text-xs">API Key Secret</label>
                  <input
                    type="password"
                    value={greenInvoiceForm.api_key_secret}
                    onChange={e => setGreenInvoiceForm(f => ({ ...f, api_key_secret: e.target.value }))}
                    placeholder="••••••••"
                    className="input text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => greenInvoiceConnectMutation.mutate()}
                  disabled={!greenInvoiceForm.api_key_id || !greenInvoiceForm.api_key_secret || greenInvoiceConnectMutation.isPending}
                  className="btn-primary text-sm px-4">
                  {greenInvoiceConnectMutation.isPending ? 'Saving...' : greenInvoiceStatus ? 'Update Credentials' : 'Save & Connect'}
                </button>
                <button onClick={() => setShowGreenInvoiceForm(false)} className="btn-secondary text-sm px-4">
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
