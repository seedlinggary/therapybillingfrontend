import { useState, useEffect } from 'react'
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
import { CalendarView } from '../../components/therapist/CalendarView'
import { Plus, CheckCircle, XCircle, List, CalendarDays, RefreshCw, Zap, Pencil, Ban } from 'lucide-react'
import type { Appointment } from '../../types'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  session_type: z.string().default('Individual'),
  override_price: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().optional()),
  tax_exempt: z.boolean().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  session_type: z.string().default('Individual'),
  override_price: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().optional()),
  session_notes: z.string().optional(),
  tax_exempt: z.boolean().optional(),
})
type EditForm = z.infer<typeof editSchema>

const recurringSchema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  recurrence_type: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  start_date: z.string().min(1),
  end_by: z.enum(['date', 'count']),
  end_date: z.string().optional(),
  occurrence_count: z.coerce.number().int().min(1).max(104).optional(),
  start_hour: z.coerce.number().int().min(0).max(23),
  start_minute: z.coerce.number().int().min(0).max(59),
  duration_minutes: z.coerce.number().int().min(15).max(480),
  session_type: z.string().default('Individual'),
  override_price: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().optional()),
  tax_exempt: z.boolean().optional(),
})
type RecurringForm = z.infer<typeof recurringSchema>

type ViewMode = 'list' | 'calendar'
type ModalMode = 'none' | 'single' | 'recurring'

function toDatetimeLocal(iso: string) {
  // Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
  return iso.slice(0, 16)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'badge-yellow', completed: 'badge-green',
    canceled: 'badge-red', no_show: 'badge-gray',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status.replace('_', ' ')}</span>
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  appt,
  onClose,
  currencySymbol = '$',
}: {
  appt: Appointment
  onClose: () => void
  currencySymbol?: string
}) {
  const qc = useQueryClient()

  const { register, handleSubmit, watch: editWatch, setValue: editSetValue, formState: { errors, isDirty, dirtyFields } } = useForm<EditForm>({
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
  const editTaxExempt = editWatch('tax_exempt')

  const saveMutation = useMutation({
    mutationFn: (d: EditForm) => updateAppointment(appt.id, {
      // Only send times if the user actually changed them — avoids UTC/local-time drift on every save
      ...(dirtyFields.start_time && { start_time: new Date(d.start_time).toISOString() }),
      ...(dirtyFields.end_time   && { end_time:   new Date(d.end_time).toISOString() }),
      session_type: d.session_type,
      tax_exempt: d.tax_exempt,
      override_price: d.override_price !== undefined ? d.override_price : null,
      session_notes: d.session_notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment updated')
      onClose()
    },
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

  const handleMarkComplete = () => {
    if (confirm('Mark this session as completed?'))
      statusMutation.mutate({ status: 'completed' })
  }

  const handleCancel = () => {
    const reason = prompt('Cancellation reason (optional):') ?? undefined
    statusMutation.mutate({ status: 'canceled', reason })
  }

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
              <input {...register('start_time')} type="datetime-local" className="input" />
              {errors.start_time && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">End *</label>
              <input {...register('end_time')} type="datetime-local" className="input" />
              {errors.end_time && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
          </div>
          <div>
            <label className="label">Session Type</label>
            <select {...register('session_type')} className="input">
              {['Individual', 'Couples', 'Family', 'Group'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Override Price ({currencySymbol})</label>
            <input {...register('override_price')} type="number" step="0.01" className="input"
              placeholder="Leave blank for default" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={editTaxExempt ?? false} onChange={e => editSetValue('tax_exempt', e.target.checked, { shouldDirty: true })} />
              <div className={`w-10 h-6 rounded-full transition-colors ${editTaxExempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editTaxExempt ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">VAT / Tax Exempt</span>
          </label>
          <div>
            <label className="label">Session Notes</label>
            <textarea {...register('session_notes')} className="input h-20 resize-none"
              placeholder="Private notes (not visible to client)..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={anyPending || !isDirty} className="btn-primary flex-1">
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
          </div>
        </form>

        {/* ── Status actions ── */}
        {(appt.status === 'scheduled' || appt.status === 'canceled') && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Session Status</p>
            <div className="flex gap-2">
              <button
                onClick={handleMarkComplete}
                disabled={anyPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                <CheckCircle className="w-4 h-4" /> Mark Complete
              </button>
              {appt.status === 'scheduled' && (
                <button
                  onClick={handleCancel}
                  disabled={anyPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                  <Ban className="w-4 h-4" /> Cancel Session
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Completed + unbilled actions ── */}
        {appt.status === 'completed' && !appt.billed && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <button
              onClick={() => confirm(`Create and send invoice for ${appt.client_name}'s session?`) && billNowMutation.mutate()}
              disabled={anyPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors">
              <Zap className="w-4 h-4" /> Bill Now — Create & Send Invoice
            </button>
            <button
              onClick={handleCancel}
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

// ── Component ─────────────────────────────────────────────────────────────────

export function TherapistAppointments() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<ModalMode>('none')
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile })
  const sym = profile?.default_currency === 'ILS' ? '₪' : '$'

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => listTherapistAppointments(statusFilter ? { status: statusFilter } : {}),
  })
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listMyClients })
  const activeClients = clients.filter(c => c.is_active)

  // ── Single appointment form ───────────────────────────────────────────────
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { session_type: 'Individual', tax_exempt: false },
  })
  const selectedClientId = watch('client_id')
  const createTaxExempt = watch('tax_exempt')
  const selectedClient = clients.find(c => c.client_id === selectedClientId)

  // Pre-fill tax_exempt from the selected client's default whenever client changes
  useEffect(() => {
    if (selectedClient) setValue('tax_exempt', selectedClient.tax_exempt ?? false)
  }, [selectedClientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment scheduled')
      setModal('none'); reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create appointment'),
  })

  // ── Recurring form ────────────────────────────────────────────────────────
  const {
    register: rReg, handleSubmit: rSubmit, watch: rWatch, reset: rReset,
    setValue: rSetValue, formState: { errors: rErr },
  } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      recurrence_type: 'weekly', end_by: 'count', occurrence_count: 12,
      start_hour: 10, start_minute: 0, duration_minutes: 50, session_type: 'Individual',
      tax_exempt: false,
    },
  })
  const endBy = rWatch('end_by')
  const rClientId = rWatch('client_id')
  const rTaxExempt = rWatch('tax_exempt')
  const rSelectedClient = clients.find(c => c.client_id === rClientId)

  useEffect(() => {
    if (rSelectedClient) rSetValue('tax_exempt', rSelectedClient.tax_exempt ?? false)
  }, [rClientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const recurringMutation = useMutation({
    mutationFn: (d: RecurringForm) => createRecurringAppointments({
      client_id: d.client_id,
      recurrence_type: d.recurrence_type,
      start_date: d.start_date,
      end_date: d.end_by === 'date' ? d.end_date : undefined,
      occurrence_count: d.end_by === 'count' ? d.occurrence_count : undefined,
      start_hour: d.start_hour,
      start_minute: d.start_minute,
      duration_minutes: d.duration_minutes,
      session_type: d.session_type,
      override_price: d.override_price,
    }),
    onSuccess: (appts) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(`Created ${appts.length} recurring appointments`)
      setModal('none'); rReset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create recurring appointments'),
  })

  // ── Status + bill-now ─────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateAppointmentStatus(id, status, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
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
    if (confirm('Mark this session as completed?')) statusMutation.mutate({ id, status: 'completed' })
  }
  const handleCancel = (id: string) => {
    const reason = prompt('Cancellation reason (optional):') ?? undefined
    statusMutation.mutate({ id, status: 'canceled', reason })
  }
  const handleBillNow = (appt: Appointment) => {
    if (confirm(`Create and send invoice for ${appt.client_name}'s session now?`)) {
      billNowMutation.mutate(appt.id)
    }
  }

  return (
    <div className="p-8">
      {/* Edit modal */}
      {editingAppt && (
        <EditModal appt={editingAppt} onClose={() => setEditingAppt(null)} currencySymbol={sym} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
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

          <div className="flex items-center gap-2">
            <button onClick={() => setModal('recurring')}
              className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Recurring
            </button>
            <button onClick={() => setModal('single')}
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Session
            </button>
          </div>
        </div>
      </div>

      {/* Status filter (list only) */}
      {viewMode === 'list' && (
        <div className="flex gap-2 mb-6">
          {['', 'scheduled', 'completed', 'canceled', 'no_show'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      )}

      {/* ── Single appointment modal ── */}
      {modal === 'single' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Schedule Session</h2>
            <form onSubmit={handleSubmit(d => createMutation.mutate({
              ...d,
              start_time: new Date(d.start_time).toISOString(),
              end_time: new Date(d.end_time).toISOString(),
            }))} className="space-y-4">
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
                    {selectedClient.tax_exempt && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">VAT Exempt</span>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start *</label>
                  <input {...register('start_time')} type="datetime-local" className="input" />
                </div>
                <div>
                  <label className="label">End *</label>
                  <input {...register('end_time')} type="datetime-local" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Session Type</label>
                <select {...register('session_type')} className="input">
                  {['Individual', 'Couples', 'Family', 'Group'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Override Price ({sym})</label>
                <input {...register('override_price')} type="number" step="0.01" className="input"
                  placeholder="Leave blank for default" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={createTaxExempt ?? false} onChange={e => setValue('tax_exempt', e.target.checked)} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${createTaxExempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${createTaxExempt ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-700">VAT / Tax Exempt <span className="text-xs text-gray-400">(pre-filled from client default)</span></span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
                </button>
                <button type="button" onClick={() => { setModal('none'); reset() }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Recurring appointment modal ── */}
      {modal === 'recurring' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Create Recurring Series</h2>
            <p className="text-sm text-gray-500 mb-4">Generates individual appointment records for each occurrence.</p>
            <form onSubmit={rSubmit(d => recurringMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Client *</label>
                <select {...rReg('client_id')} className="input">
                  <option value="">Select client...</option>
                  {activeClients.map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
                </select>
                {rErr.client_id && <p className="text-red-500 text-xs mt-1">{rErr.client_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Frequency *</label>
                  <select {...rReg('recurrence_type')} className="input">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input {...rReg('start_date')} type="date" className="input" />
                  {rErr.start_date && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
              </div>

              <div>
                <label className="label">End By</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input {...rReg('end_by')} type="radio" value="count" /> Number of sessions
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input {...rReg('end_by')} type="radio" value="date" /> End date
                  </label>
                </div>
                {endBy === 'count' ? (
                  <input {...rReg('occurrence_count')} type="number" min={1} max={104}
                    className="input" placeholder="e.g. 12" />
                ) : (
                  <input {...rReg('end_date')} type="date" className="input" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Hour (24h)</label>
                  <input {...rReg('start_hour')} type="number" min={0} max={23} className="input" />
                </div>
                <div>
                  <label className="label">Minute</label>
                  <input {...rReg('start_minute')} type="number" min={0} max={59} step={5} className="input" />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input {...rReg('duration_minutes')} type="number" min={15} max={480} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Session Type</label>
                  <select {...rReg('session_type')} className="input">
                    {['Individual', 'Couples', 'Family', 'Group'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Override Price ({sym})</label>
                  <input {...rReg('override_price')} type="number" step="0.01"
                    className="input" placeholder="Default" />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={rTaxExempt ?? false} onChange={e => rSetValue('tax_exempt', e.target.checked)} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${rTaxExempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rTaxExempt ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-700">VAT / Tax Exempt <span className="text-xs text-gray-400">(pre-filled from client default)</span></span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={recurringMutation.isPending} className="btn-primary flex-1">
                  {recurringMutation.isPending ? 'Creating...' : 'Create Series'}
                </button>
                <button type="button" onClick={() => { setModal('none'); rReset() }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar / List */}
      {viewMode === 'calendar' && (
        <CalendarView appointments={appointments} onEdit={setEditingAppt} currencySymbol={sym} />
      )}

      {viewMode === 'list' && (
        <div className="card p-0 overflow-hidden">
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
                      {appt.recurrence_id && (
                        <span className="ml-1.5 text-xs text-primary-500" title="Recurring series">↻</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{format(new Date(appt.start_time), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appt.session_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {appt.effective_price != null
                        ? `${sym}${appt.effective_price.toFixed(2)}`
                        : <span className="text-gray-400">—</span>}
                      {appt.override_price != null && appt.override_price !== 0 && (
                        <span className="text-xs text-orange-500 ml-1">(custom)</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={appt.status} /></td>
                    <td className="px-6 py-4">
                      {appt.billed
                        ? <span className="badge-green text-xs">Billed</span>
                        : appt.status === 'completed'
                          ? <span className="badge-yellow text-xs">Unbilled</span>
                          : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit — always available */}
                        <button
                          onClick={() => setEditingAppt(appt)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit appointment">
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Status transitions — scheduled */}
                        {appt.status === 'scheduled' && (
                          <>
                            <button onClick={() => handleComplete(appt.id)}
                              className="text-green-600 hover:text-green-800" title="Mark complete">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleCancel(appt.id)}
                              className="text-red-600 hover:text-red-800" title="Cancel">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Cancel completed appointment when no active invoice */}
                        {appt.status === 'completed' && !appt.billed && (
                          <button onClick={() => handleCancel(appt.id)}
                            className="text-red-400 hover:text-red-600" title="Cancel (no active invoice)">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Restore canceled appointment to completed */}
                        {appt.status === 'canceled' && (
                          <button onClick={() => handleComplete(appt.id)}
                            className="text-green-500 hover:text-green-700" title="Mark as completed">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Bill Now — completed + unbilled */}
                        {appt.status === 'completed' && !appt.billed && (
                          <button
                            onClick={() => handleBillNow(appt)}
                            disabled={billNowMutation.isPending}
                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 px-2 py-1 rounded"
                            title="Bill Now">
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
