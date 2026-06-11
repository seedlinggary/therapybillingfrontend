import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  listTherapistAppointments, createAppointment, updateAppointmentStatus,
  createRecurringAppointments, updateAppointment,
} from '../../api/appointments'
import { billNow } from '../../api/invoices'
import { listMyClients, getMyTherapistProfile } from '../../api/clients'
import { listServiceTypes } from '../../api/serviceTypes'
import { CalendarView } from '../../components/therapist/CalendarView'
import {
  Plus, CheckCircle, XCircle, List, CalendarDays, RefreshCw, Zap,
  Pencil, Ban, ChevronDown, ChevronRight,
} from 'lucide-react'
import type { Appointment } from '../../types'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  start_time: z.string().min(1, 'Required'),
  end_time: z.string().min(1, 'Required'),
  session_type: z.string().default('Individual'),
  override_price: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().optional()),
  tax_exempt: z.boolean().optional(),
  is_recurring: z.boolean().default(false),
  // recurring-only fields
  recurrence_type: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  end_by: z.enum(['date', 'count']).optional(),
  end_date: z.string().optional(),
  occurrence_count: z.coerce.number().int().min(1).max(104).optional(),
}).refine(
  d => !d.start_time || !d.end_time || new Date(d.end_time) > new Date(d.start_time),
  { message: 'End time must be after start time', path: ['end_time'] },
)
type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  start_time: z.string().min(1, 'Required'),
  end_time: z.string().min(1, 'Required'),
  session_type: z.string().default('Individual'),
  override_price: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().optional()),
  session_notes: z.string().optional(),
  tax_exempt: z.boolean().optional(),
}).refine(
  d => !d.start_time || !d.end_time || new Date(d.end_time) > new Date(d.start_time),
  { message: 'End time must be after start time', path: ['end_time'] },
)
type EditForm = z.infer<typeof editSchema>

type ViewMode = 'list' | 'calendar'

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'badge-yellow', completed: 'badge-green',
    canceled: 'badge-red', no_show: 'badge-gray',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status.replace('_', ' ')}</span>
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`} />
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  appt, onClose, currencySymbol = '$',
  serviceTypes = [],
}: {
  appt: Appointment
  onClose: () => void
  currencySymbol?: string
  serviceTypes?: { id: string; name: string; duration_minutes: number }[]
}) {
  const qc = useQueryClient()
  const endManuallyEdited = useRef(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty, dirtyFields } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      start_time: toDatetimeLocal(appt.start_time),
      end_time: toDatetimeLocal(appt.end_time),
      session_type: appt.session_type ?? 'Individual',
      override_price: appt.override_price ?? undefined,
      session_notes: appt.session_notes ?? '',
      tax_exempt: appt.tax_exempt ?? false,
    },
  })
  const taxExempt = watch('tax_exempt')
  const watchedStart = watch('start_time')
  const watchedType = watch('session_type')
  const selectedSvc = serviceTypes.find(s => s.name === watchedType)

  // Auto-update end_time when start or service type changes, unless user manually set end
  useEffect(() => {
    if (endManuallyEdited.current) return
    if (!watchedStart) return
    const start = new Date(watchedStart)
    if (isNaN(start.getTime())) return
    const dur = selectedSvc?.duration_minutes ?? 50
    setValue('end_time', format(new Date(start.getTime() + dur * 60_000), "yyyy-MM-dd'T'HH:mm"))
  }, [watchedStart, watchedType]) // eslint-disable-line

  const saveMutation = useMutation({
    mutationFn: (d: EditForm) => updateAppointment(appt.id, {
      ...(dirtyFields.start_time && { start_time: new Date(d.start_time).toISOString() }),
      ...(dirtyFields.end_time && { end_time: new Date(d.end_time).toISOString() }),
      session_type: d.session_type,
      tax_exempt: d.tax_exempt,
      override_price: d.override_price !== undefined ? d.override_price : null,
      session_notes: d.session_notes || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Appointment updated'); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to update appointment'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      updateAppointmentStatus(appt.id, status, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(vars.status === 'completed' ? 'Session marked complete' : 'Session canceled')
      onClose()
    },
    onError: () => toast.error('Failed to update status'),
  })

  const billNowMutation = useMutation({
    mutationFn: () => billNow(appt.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created and sent')
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create invoice'),
  })

  const anyPending = saveMutation.isPending || statusMutation.isPending || billNowMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Edit Appointment</h2>
          <p className="text-sm text-gray-500">{appt.client_name} · <StatusBadge status={appt.status} /></p>
        </div>

        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start *</label>
              <input {...register('start_time')} type="datetime-local" className="input"
                onChange={e => { endManuallyEdited.current = false; register('start_time').onChange(e) }} />
              {errors.start_time && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">End *</label>
              <input {...register('end_time')} type="datetime-local" className="input"
                onChange={e => { endManuallyEdited.current = true; register('end_time').onChange(e) }} />
              {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Service</label>
            <select {...register('session_type')} className="input"
              onChange={e => { endManuallyEdited.current = false; register('session_type').onChange(e) }}>
              {serviceTypes.length > 0
                ? serviceTypes.map(s => <option key={s.id} value={s.name}>{s.name} ({s.duration_minutes} min)</option>)
                : <option value={appt.session_type}>{appt.session_type}</option>
              }
            </select>
          </div>
          <div>
            <label className="label">Override Price ({currencySymbol})</label>
            <input {...register('override_price')} type="number" step="0.01" className="input" placeholder="Leave blank for default" />
          </div>
          <Toggle checked={taxExempt ?? false} onChange={v => setValue('tax_exempt', v, { shouldDirty: true })} label="VAT / Tax Exempt" />
          <div>
            <label className="label">Notes</label>
            <textarea {...register('session_notes')} className="input h-20 resize-none" placeholder="Private notes (not visible to client)..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={anyPending || !isDirty} className="btn-primary flex-1">
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
          </div>
        </form>

        {(appt.status === 'scheduled' || appt.status === 'canceled') && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Status</p>
            <div className="flex gap-2">
              <button onClick={() => confirm('Mark this appointment as completed?') && statusMutation.mutate({ status: 'completed' })}
                disabled={anyPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                <CheckCircle className="w-4 h-4" /> Mark Complete
              </button>
              {appt.status === 'scheduled' && (
                <button onClick={() => statusMutation.mutate({ status: 'canceled', reason: prompt('Cancellation reason (optional):') ?? undefined })}
                  disabled={anyPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                  <Ban className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {appt.status === 'completed' && !appt.billed && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <button onClick={() => confirm(`Create and send invoice for ${appt.client_name}'s session?`) && billNowMutation.mutate()}
              disabled={anyPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors">
              <Zap className="w-4 h-4" /> Bill Now — Create & Send Invoice
            </button>
            <button onClick={() => statusMutation.mutate({ status: 'canceled', reason: prompt('Cancellation reason (optional):') ?? undefined })}
              disabled={anyPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
              <Ban className="w-4 h-4" /> Cancel This Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Approve Day Button (header dropdown) ─────────────────────────────────────

function ApproveDayButton({
  scheduledAppts,
  onApprove,
  isPending,
}: {
  scheduledAppts: Appointment[]
  onApprove: (ids: string[]) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayAppts = scheduledAppts.filter(
    a => format(new Date(a.start_time), 'yyyy-MM-dd') === today
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const [checked, setChecked] = useState<Set<string>>(new Set(todayAppts.map(a => a.id)))

  useEffect(() => {
    setChecked(new Set(todayAppts.map(a => a.id)))
  }, [scheduledAppts]) // eslint-disable-line

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) =>
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleApprove = () => {
    const ids = [...checked]
    if (ids.length === 0) return
    if (confirm(`Confirm ${ids.length} appointment${ids.length !== 1 ? 's' : ''} for today?`)) {
      onApprove(ids)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        Approve Day
        {todayAppts.length > 0 && (
          <span className="bg-green-500/80 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {todayAppts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-green-50">
            <p className="text-sm font-semibold text-green-900">Today's Sessions</p>
            <p className="text-xs text-green-700 mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          {todayAppts.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No scheduled sessions today.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {todayAppts.map(appt => (
                  <label key={appt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked.has(appt.id)}
                      onChange={() => toggle(appt.id)}
                      className="w-4 h-4 rounded accent-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{appt.client_name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
                        {' · '}{appt.session_type}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{checked.size} of {todayAppts.length} selected</p>
                <button
                  onClick={handleApprove}
                  disabled={isPending || checked.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm {checked.size > 0 ? checked.size : ''} Session{checked.size !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TherapistAppointments() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [confirmPanelOpen, setConfirmPanelOpen] = useState(false)
  const [newApptDropdownOpen, setNewApptDropdownOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const endManuallyEdited = useRef(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNewApptDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile })
  const sym = profile?.default_currency === 'ILS' ? '₪' : '$'

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => listTherapistAppointments(statusFilter ? { status: statusFilter } : {}),
    staleTime: 30_000,
  })

  const { data: scheduledAppts = [] } = useQuery({
    queryKey: ['appointments', 'scheduled'],
    queryFn: () => listTherapistAppointments({ status: 'scheduled' }),
    staleTime: 30_000,
  })
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listMyClients, staleTime: 60_000 })
  const { data: serviceTypes = [] } = useQuery({ queryKey: ['service-types'], queryFn: listServiceTypes, staleTime: 300_000 })
  const activeClients = clients.filter(c => c.is_active)

  // ── Create form ───────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { session_type: serviceTypes[0]?.name ?? 'Individual', tax_exempt: false, is_recurring: false, recurrence_type: 'weekly', end_by: 'count', occurrence_count: 12 },
  })
  const selectedClientId = watch('client_id')
  const createTaxExempt = watch('tax_exempt')
  const watchedStartTime = watch('start_time')
  const watchedSessionType = watch('session_type')
  const watchedIsRecurring = watch('is_recurring')
  const watchedEndBy = watch('end_by')
  const selectedClient = clients.find(c => c.client_id === selectedClientId)
  const selectedService = serviceTypes.find(s => s.name === watchedSessionType)
  const defaultDuration = selectedService?.duration_minutes ?? serviceTypes[0]?.duration_minutes ?? 50

  useEffect(() => {
    if (selectedClient) setValue('tax_exempt', selectedClient.tax_exempt ?? false)
  }, [selectedClientId]) // eslint-disable-line

  // Always recalculate end_time when start or service changes unless user manually edited end
  useEffect(() => {
    if (endManuallyEdited.current) return
    if (!watchedStartTime) return
    const start = new Date(watchedStartTime)
    if (isNaN(start.getTime())) return
    setValue('end_time', format(new Date(start.getTime() + defaultDuration * 60_000), "yyyy-MM-dd'T'HH:mm"))
  }, [watchedStartTime, watchedSessionType]) // eslint-disable-line

  const openModal = (recurring: boolean) => {
    setIsRecurring(recurring)
    setValue('is_recurring', recurring)
    setNewApptDropdownOpen(false)
    setShowModal(true)
  }

  const createMutation = useMutation<Appointment | Appointment[], Error, CreateForm>({
    mutationFn: (d: CreateForm) => {
      if (d.is_recurring) {
        // Parse start date + time from start_time field
        const startDt = new Date(d.start_time)
        return createRecurringAppointments({
          client_id: d.client_id,
          recurrence_type: d.recurrence_type ?? 'weekly',
          start_date: format(startDt, 'yyyy-MM-dd'),
          end_date: d.end_by === 'date' ? d.end_date : undefined,
          occurrence_count: d.end_by === 'count' ? d.occurrence_count : undefined,
          start_hour: startDt.getHours(),
          start_minute: startDt.getMinutes(),
          duration_minutes: defaultDuration,
          session_type: d.session_type,
          override_price: d.override_price,
        })
      }
      return createAppointment({
        ...d,
        start_time: new Date(d.start_time).toISOString(),
        end_time: new Date(d.end_time).toISOString(),
      })
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      const count = Array.isArray(result) ? result.length : 1
      toast.success(count > 1 ? `Created ${count} recurring appointments` : 'Appointment scheduled')
      setShowModal(false)
      reset()
      endManuallyEdited.current = false
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create appointment'),
  })

  // ── Status + bill ─────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateAppointmentStatus(id, status, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(vars.status === 'completed' ? 'Session confirmed' : 'Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const batchApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await updateAppointmentStatus(id, 'completed')
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(`${ids.length} session${ids.length !== 1 ? 's' : ''} confirmed`)
    },
    onError: () => toast.error('Some approvals failed — please check and retry'),
  })

  const billNowMutation = useMutation({
    mutationFn: billNow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created and sent')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create invoice'),
  })

  const handleComplete = (id: string) => {
    if (confirm('Mark this appointment as completed?')) statusMutation.mutate({ id, status: 'completed' })
  }
  const handleCancel = (id: string) => {
    const reason = prompt('Cancellation reason (optional):') ?? undefined
    statusMutation.mutate({ id, status: 'canceled', reason })
  }
  const handleBillNow = (appt: Appointment) => {
    if (confirm(`Create and send invoice for ${appt.client_name}'s session now?`)) billNowMutation.mutate(appt.id)
  }

  return (
    <div className="p-4 md:p-8">
      {editingAppt && (
        <EditModal appt={editingAppt} onClose={() => setEditingAppt(null)} currencySymbol={sym} serviceTypes={serviceTypes} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <CalendarDays className="w-4 h-4" /> Calendar
            </button>
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List className="w-4 h-4" /> List
            </button>
          </div>

          {/* Approve Day */}
          <ApproveDayButton
            scheduledAppts={scheduledAppts}
            onApprove={ids => batchApproveMutation.mutate(ids)}
            isPending={batchApproveMutation.isPending}
          />

          {/* Single "New Appointment" button with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <button
                onClick={() => openModal(false)}
                className="btn-primary flex items-center gap-2 rounded-r-none border-r border-primary-700 pr-3"
              >
                <Plus className="w-4 h-4" /> New Appointment
              </button>
              <button
                onClick={() => setNewApptDropdownOpen(v => !v)}
                className="btn-primary rounded-l-none px-2"
                aria-label="More options"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {newApptDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => openModal(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 text-primary-600" /> Single Appointment
                </button>
                <button
                  onClick={() => openModal(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 text-primary-600" /> Recurring Series
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Confirm Panel (all unconfirmed) */}
      {(() => {
        const now = new Date()
        const pending = [...scheduledAppts].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        return (
          <div className="card p-0 overflow-hidden mb-6">
            <button
              onClick={() => setConfirmPanelOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Confirm Sessions</span>
                {pending.length > 0 && (
                  <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              {confirmPanelOpen
                ? <ChevronDown className="w-4 h-4 text-amber-500" />
                : <ChevronRight className="w-4 h-4 text-amber-500" />}
            </button>

            {confirmPanelOpen && (
              pending.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No unconfirmed appointments.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pending.map(appt => {
                    const isPast = new Date(appt.start_time) < now
                    return (
                      <div key={appt.id} className={`flex items-center gap-3 px-4 py-3 ${isPast ? 'bg-orange-50/40' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{appt.client_name}</p>
                            {isPast && <span className="shrink-0 text-xs text-orange-600 font-medium">past</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(appt.start_time), 'EEE, MMM d')}
                            {' · '}
                            {format(new Date(appt.start_time), 'h:mm a')}–{format(new Date(appt.end_time), 'h:mm a')}
                            {' · '}{appt.session_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {appt.effective_price != null && (
                            <span className="text-sm text-gray-500 hidden sm:block">{sym}{appt.effective_price.toFixed(2)}</span>
                          )}
                          <button
                            onClick={() => statusMutation.mutate({ id: appt.id, status: 'completed' })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        )
      })()}

      {/* Status filter (list only) */}
      {viewMode === 'list' && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'scheduled', 'completed', 'canceled', 'no_show'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      )}

      {/* ── New / Recurring Appointment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{watchedIsRecurring ? 'Create Recurring Series' : 'New Appointment'}</h2>
              {/* Toggle between single / recurring */}
              <button
                type="button"
                onClick={() => { setIsRecurring(v => !v); setValue('is_recurring', !watchedIsRecurring) }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 border border-primary-200 bg-primary-50 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {watchedIsRecurring ? 'Switch to single' : 'Make recurring'}
              </button>
            </div>

            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              {/* Client */}
              <div>
                <label className="label">Client *</label>
                <select {...register('client_id')} className="input">
                  <option value="">Select client...</option>
                  {activeClients.map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
                </select>
                {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>}
                {selectedClient && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                    <span>Default price: {sym}{selectedClient.default_session_price.toFixed(2)}</span>
                    {selectedClient.tax_exempt && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">VAT Exempt</span>}
                  </div>
                )}
              </div>

              {/* Service */}
              <div>
                <label className="label">Service</label>
                <select {...register('session_type')} className="input"
                  onChange={e => { endManuallyEdited.current = false; register('session_type').onChange(e) }}>
                  {serviceTypes.length > 0
                    ? serviceTypes.map(s => <option key={s.id} value={s.name}>{s.name} ({s.duration_minutes} min)</option>)
                    : <option value="Appointment">Appointment</option>
                  }
                </select>
              </div>

              {/* Start + End (single mode) or Start + recurring config */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{watchedIsRecurring ? 'Start Date & Time *' : 'Start *'}</label>
                  <input {...register('start_time')} type="datetime-local" className="input"
                    onChange={e => { endManuallyEdited.current = false; register('start_time').onChange(e) }} />
                  {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
                </div>
                {!watchedIsRecurring ? (
                  <div>
                    <label className="label">End *</label>
                    <input {...register('end_time')} type="datetime-local" className="input"
                      onChange={e => { endManuallyEdited.current = true; register('end_time').onChange(e) }} />
                    {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
                  </div>
                ) : (
                  <div>
                    <label className="label">Frequency *</label>
                    <select {...register('recurrence_type')} className="input">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Recurring end config */}
              {watchedIsRecurring && (
                <div>
                  <label className="label">End By</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input {...register('end_by')} type="radio" value="count" /> Number of sessions
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input {...register('end_by')} type="radio" value="date" /> End date
                    </label>
                  </div>
                  {watchedEndBy === 'count'
                    ? <input {...register('occurrence_count')} type="number" min={1} max={104} className="input" placeholder="e.g. 12" />
                    : <input {...register('end_date')} type="date" className="input" />
                  }
                </div>
              )}

              {/* Price + VAT */}
              <div>
                <label className="label">Override Price ({sym})</label>
                <input {...register('override_price')} type="number" step="0.01" className="input" placeholder="Leave blank for default" />
              </div>
              <Toggle
                checked={createTaxExempt ?? false}
                onChange={v => setValue('tax_exempt', v)}
                label="VAT / Tax Exempt (pre-filled from client default)"
              />

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending
                    ? (watchedIsRecurring ? 'Creating...' : 'Scheduling...')
                    : (watchedIsRecurring ? 'Create Series' : 'Schedule')}
                </button>
                <button type="button" onClick={() => { setShowModal(false); reset(); endManuallyEdited.current = false }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar / List */}
      {viewMode === 'calendar' && (
        <CalendarView
          appointments={appointments}
          onEdit={setEditingAppt}
          onConfirm={(appt) => statusMutation.mutate({ id: appt.id, status: 'completed' })}
          currencySymbol={sym}
        />
      )}

      {viewMode === 'list' && (
        <div className="card p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No appointments found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {appt.client_name}
                      {appt.recurrence_id && <span className="ml-1.5 text-xs text-primary-500" title="Recurring">↻</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{format(new Date(appt.start_time), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appt.session_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {appt.effective_price != null ? `${sym}${appt.effective_price.toFixed(2)}` : <span className="text-gray-400">—</span>}
                      {appt.override_price != null && appt.override_price !== 0 && <span className="text-xs text-orange-500 ml-1">(custom)</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={appt.status} /></td>
                    <td className="px-6 py-4">
                      {appt.billed
                        ? <span className="badge-green text-xs">Billed</span>
                        : appt.status === 'completed' ? <span className="badge-yellow text-xs">Unbilled</span> : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingAppt(appt)} className="text-gray-400 hover:text-gray-600" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {appt.status === 'scheduled' && (
                          <>
                            <button onClick={() => handleComplete(appt.id)} className="text-green-600 hover:text-green-800" title="Mark complete">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleCancel(appt.id)} className="text-red-600 hover:text-red-800" title="Cancel">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {appt.status === 'completed' && !appt.billed && (
                          <button onClick={() => handleCancel(appt.id)} className="text-red-400 hover:text-red-600" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {appt.status === 'canceled' && (
                          <button onClick={() => handleComplete(appt.id)} className="text-green-500 hover:text-green-700" title="Mark completed">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {appt.status === 'completed' && !appt.billed && (
                          <button onClick={() => handleBillNow(appt)} disabled={billNowMutation.isPending}
                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 px-2 py-1 rounded" title="Bill Now">
                            <Zap className="w-3 h-3" /> Bill Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
