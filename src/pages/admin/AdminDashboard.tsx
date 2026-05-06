import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  adminListTherapists, adminGetTherapist, adminUpdateTherapist,
  adminGetTherapistClients, adminGetTherapistInvoices, adminGetTherapistAppointments,
  adminListClients, adminGetClient, adminUpdateClient,
  adminGetClientInvoices, adminGetClientAppointments,
} from '../../api/admin'
import { useAuthStore } from '../../store/authStore'
import { Shield, LogOut, ChevronDown } from 'lucide-react'

type EntityType = 'therapist' | 'client'
type TherapistTab = 'profile' | 'clients' | 'invoices' | 'appointments'
type ClientTab = 'profile' | 'invoices' | 'appointments'

const sym = (c?: string) => c === 'ILS' ? '₪' : '$'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unpaid: 'badge-yellow', paid: 'badge-green', void: 'badge-gray', refunded: 'badge-red',
    completed: 'badge-green', scheduled: 'badge-yellow', canceled: 'badge-gray', no_show: 'badge-red',
    active: 'badge-green', inactive: 'badge-gray',
  }
  return <span className={map[status] || 'badge-gray'}>{status}</span>
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{String(value)}</p>
    </div>
  )
}

function EditableProfile({
  data,
  fields,
  onSave,
  saving,
}: {
  data: Record<string, unknown>
  fields: { key: string; label: string; type?: string }[]
  onSave: (patch: Record<string, unknown>) => void
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const startEdit = () => {
    const initial: Record<string, unknown> = {}
    fields.forEach(f => { initial[f.key] = data[f.key] ?? '' })
    setForm(initial)
    setEditing(true)
  }

  if (!editing) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {fields.map(f => <Field key={f.key} label={f.label} value={data[f.key] as any} />)}
        </div>
        <button onClick={startEdit} className="btn-secondary text-sm px-4">Edit</button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="label text-xs">{f.label}</label>
            <input
              type={f.type || 'text'}
              value={String(form[f.key] ?? '')}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="input text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(form); setEditing(false) }}
          disabled={saving}
          className="btn-primary text-sm px-4"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} className="btn-secondary text-sm px-4">Cancel</button>
      </div>
    </div>
  )
}

function TherapistView({ therapistId }: { therapistId: string }) {
  const [tab, setTab] = useState<TherapistTab>('profile')
  const qc = useQueryClient()

  const { data: profile } = useQuery({ queryKey: ['admin-t', therapistId], queryFn: () => adminGetTherapist(therapistId) })
  const { data: tClients = [] } = useQuery({ queryKey: ['admin-t-clients', therapistId], queryFn: () => adminGetTherapistClients(therapistId), enabled: tab === 'clients' })
  const { data: invoices = [] } = useQuery({ queryKey: ['admin-t-invoices', therapistId], queryFn: () => adminGetTherapistInvoices(therapistId), enabled: tab === 'invoices' })
  const { data: appts = [] } = useQuery({ queryKey: ['admin-t-appts', therapistId], queryFn: () => adminGetTherapistAppointments(therapistId), enabled: tab === 'appointments' })

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => adminUpdateTherapist(therapistId, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-t', therapistId] }); toast.success('Saved') },
    onError: () => toast.error('Save failed'),
  })

  if (!profile) return <div className="p-6 text-gray-400">Loading…</div>

  const tabs: { key: TherapistTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'clients', label: 'Clients' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'appointments', label: 'Appointments' },
  ]

  const profileFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'license_number', label: 'License #' },
    { key: 'country', label: 'Country' },
    { key: 'default_currency', label: 'Currency' },
    { key: 'default_session_price', label: 'Default Price', type: 'number' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'payment_instructions', label: 'Payment Instructions' },
    { key: 'bio', label: 'Bio' },
  ]

  return (
    <div>
      {/* Summary strip */}
      <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
        {profile.picture_url && (
          <img src={profile.picture_url} className="w-10 h-10 rounded-full" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {profile.stripe_connected && <span className="badge-green">Stripe</span>}
          {profile.payment_provider === 'payme' && <span className="badge-green">PayMe</span>}
          {profile.google_calendar_connected && <span className="badge-green">Calendar</span>}
          <StatusBadge status={profile.is_active ? 'active' : 'inactive'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'profile' && (
          <EditableProfile
            data={profile}
            fields={profileFields}
            onSave={patch => updateMutation.mutate(patch)}
            saving={updateMutation.isPending}
          />
        )}

        {tab === 'clients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">Name</th>
                <th className="text-left py-2 font-medium text-gray-600">Email</th>
                <th className="text-left py-2 font-medium text-gray-600">Billing</th>
                <th className="text-left py-2 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {tClients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-gray-500">{c.email}</td>
                    <td className="py-2 text-gray-500">{c.billing_frequency} · {sym(profile.default_currency)}{c.default_session_price}</td>
                    <td className="py-2"><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {tClients.length === 0 && <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No clients</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'invoices' && <InvoiceTable rows={invoices} />}
        {tab === 'appointments' && <AppointmentTable rows={appts} />}
      </div>
    </div>
  )
}

function ClientView({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState<ClientTab>('profile')
  const qc = useQueryClient()

  const { data: profile } = useQuery({ queryKey: ['admin-c', clientId], queryFn: () => adminGetClient(clientId) })
  const { data: invoices = [] } = useQuery({ queryKey: ['admin-c-invoices', clientId], queryFn: () => adminGetClientInvoices(clientId), enabled: tab === 'invoices' })
  const { data: appts = [] } = useQuery({ queryKey: ['admin-c-appts', clientId], queryFn: () => adminGetClientAppointments(clientId), enabled: tab === 'appointments' })

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => adminUpdateClient(clientId, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-c', clientId] }); toast.success('Saved') },
    onError: () => toast.error('Save failed'),
  })

  if (!profile) return <div className="p-6 text-gray-400">Loading…</div>

  const tabs: { key: ClientTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'appointments', label: 'Appointments' },
  ]

  const profileFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'notes', label: 'Notes' },
    { key: 'address', label: 'Address' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
          {profile.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
        </div>
        <StatusBadge status={profile.is_active ? 'active' : 'inactive'} />
      </div>

      <div className="flex gap-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'profile' && (
          <EditableProfile
            data={profile}
            fields={profileFields}
            onSave={patch => updateMutation.mutate(patch)}
            saving={updateMutation.isPending}
          />
        )}
        {tab === 'invoices' && <InvoiceTable rows={invoices} />}
        {tab === 'appointments' && <AppointmentTable rows={appts} />}
      </div>
    </div>
  )
}

function InvoiceTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b">
          <th className="text-left py-2 font-medium text-gray-600">#</th>
          <th className="text-left py-2 font-medium text-gray-600">Client / Therapist</th>
          <th className="text-left py-2 font-medium text-gray-600">Amount</th>
          <th className="text-left py-2 font-medium text-gray-600">Provider</th>
          <th className="text-left py-2 font-medium text-gray-600">Status</th>
          <th className="text-left py-2 font-medium text-gray-600">Due</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-gray-50">
              <td className="py-2 font-mono text-xs">#{inv.invoice_number}</td>
              <td className="py-2 text-gray-700">{inv.client_name}</td>
              <td className="py-2 font-medium">{sym(inv.currency)}{Number(inv.amount).toFixed(2)}</td>
              <td className="py-2 text-gray-500 text-xs">{inv.payment_provider}</td>
              <td className="py-2"><StatusBadge status={inv.status} /></td>
              <td className="py-2 text-gray-500 text-xs">
                {inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="py-4 text-gray-400 text-center">No invoices</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function AppointmentTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b">
          <th className="text-left py-2 font-medium text-gray-600">Client</th>
          <th className="text-left py-2 font-medium text-gray-600">Date</th>
          <th className="text-left py-2 font-medium text-gray-600">Type</th>
          <th className="text-left py-2 font-medium text-gray-600">Status</th>
          <th className="text-left py-2 font-medium text-gray-600">Billed</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((a: any) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="py-2">{a.client_name}</td>
              <td className="py-2 text-gray-500 text-xs">
                {a.start_time ? format(new Date(a.start_time), 'MMM d, yyyy h:mm a') : '—'}
              </td>
              <td className="py-2 text-gray-500">{a.session_type || '—'}</td>
              <td className="py-2"><StatusBadge status={a.status} /></td>
              <td className="py-2">
                <span className={`text-xs font-medium ${a.billed ? 'text-green-600' : 'text-gray-400'}`}>
                  {a.billed ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="py-4 text-gray-400 text-center">No appointments</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore(s => s.clearAuth)
  const [entityType, setEntityType] = useState<EntityType>('therapist')
  const [selectedId, setSelectedId] = useState('')

  const { data: therapists = [] } = useQuery({
    queryKey: ['admin-therapists'],
    queryFn: adminListTherapists,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: adminListClients,
  })

  const list = entityType === 'therapist' ? therapists : clients

  const handleLogout = () => {
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  const handleTypeChange = (type: EntityType) => {
    setEntityType(type)
    setSelectedId('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span className="font-bold text-lg">Admin Dashboard</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Entity selector */}
        <div className="card flex items-center gap-4 flex-wrap">
          <div>
            <label className="label text-xs">View</label>
            <div className="flex gap-2 mt-1">
              {(['therapist', 'client'] as EntityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${entityType === type ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-48">
            <label className="label text-xs">
              Select {entityType === 'therapist' ? 'Therapist' : 'Client'}
            </label>
            <div className="relative mt-1">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="input pr-8 appearance-none"
              >
                <option value="">— choose —</option>
                {list.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="text-sm text-gray-500 self-end pb-1">
            {list.length} {entityType}{list.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Detail panel */}
        {selectedId && entityType === 'therapist' && (
          <TherapistView key={selectedId} therapistId={selectedId} />
        )}
        {selectedId && entityType === 'client' && (
          <ClientView key={selectedId} clientId={selectedId} />
        )}

        {!selectedId && (
          <div className="text-center text-gray-400 py-16">
            Select a {entityType} above to view their details.
          </div>
        )}
      </main>
    </div>
  )
}
