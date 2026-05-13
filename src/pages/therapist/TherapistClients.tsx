import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { listMyClients, createClient, updateClient, resendInvite, updateClientBilling, getMyTherapistProfile } from '../../api/clients'
import { Plus, Mail, Settings2, Pencil } from 'lucide-react'
import type { TherapistClient, BillingFrequency } from '../../types'

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  default_session_price: z.coerce.number().min(0),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tax_exempt: z.boolean().default(false),
})
type CreateForm = z.infer<typeof createSchema>

const BILLING_LABELS: Record<BillingFrequency, string> = {
  same_day: 'Same Day',
  next_day: 'Next Day',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function StatusBadge({ active, clientActive }: { active: boolean; clientActive: boolean }) {
  if (!clientActive) return <span className="badge-yellow">Invited</span>
  if (!active) return <span className="badge-gray">Inactive</span>
  return <span className="badge-green">Active</span>
}

function EditClientModal({
  client,
  onClose,
}: { client: TherapistClient; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone ?? '',
    default_session_price: client.default_session_price,
    notes: client.notes ?? '',
    is_active: client.is_active,
    tax_exempt: client.tax_exempt ?? false,
  })

  const mutation = useMutation({
    mutationFn: () => updateClient(client.client_id, {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      default_session_price: form.default_session_price,
      notes: form.notes || undefined,
      is_active: form.is_active,
      tax_exempt: form.tax_exempt,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client updated')
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to update client'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Edit Client</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 555-0100" />
          </div>
          <div>
            <label className="label">Default Price</label>
            <input
              type="number" step="0.01" min="0"
              value={form.default_session_price}
              onChange={e => setForm(f => ({ ...f, default_session_price: parseFloat(e.target.value) || 0 }))}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Private Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input h-20 resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active" type="checkbox" checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active (include in scheduling &amp; billing)</label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative flex-shrink-0">
            <input type="checkbox" className="sr-only" checked={form.tax_exempt} onChange={e => setForm(f => ({ ...f, tax_exempt: e.target.checked }))} />
            <div className={`w-10 h-6 rounded-full transition-colors ${form.tax_exempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.tax_exempt ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">VAT / Tax Exempt</span>
            <p className="text-xs text-gray-500"> This customer is VAT exempt: {form.tax_exempt ? "Yes" : "No"}</p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}


function BillingModal({
  client,
  onClose,
}: { client: TherapistClient; onClose: () => void }) {
  const qc = useQueryClient()
  const [freq, setFreq] = useState<BillingFrequency>(client.billing_frequency ?? 'same_day')
  const [anchorDay, setAnchorDay] = useState<number>(client.billing_anchor_day ?? 0)
  const [taxExempt, setTaxExempt] = useState<boolean>(client.tax_exempt ?? false)

  const mutation = useMutation({
    mutationFn: () => updateClientBilling(client.client_id, {
      billing_frequency: freq,
      billing_anchor_day: (freq === 'weekly' || freq === 'monthly') ? anchorDay : null,
      tax_exempt: taxExempt,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Billing schedule updated')
      onClose()
    },
    onError: () => toast.error('Failed to update billing schedule'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">Billing Schedule</h2>
        <p className="text-sm text-gray-500 mb-4">{client.name}</p>

        <div className="space-y-4">
          <div>
            <label className="label">Billing Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value as BillingFrequency)} className="input">
              <option value="same_day">Same Day (bill when session completes)</option>
              <option value="next_day">Next Day</option>
              <option value="weekly">Weekly (batch into one invoice)</option>
              <option value="monthly">Monthly (batch into one invoice)</option>
            </select>
          </div>

          {freq === 'weekly' && (
            <div>
              <label className="label">Bill on (day of week)</label>
              <select value={anchorDay} onChange={e => setAnchorDay(Number(e.target.value))} className="input">
                {DOW_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {freq === 'monthly' && (
            <div>
              <label className="label">Bill on (day of month)</label>
              <select value={anchorDay || 1} onChange={e => setAnchorDay(Number(e.target.value))} className="input">
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            {freq === 'same_day' && 'Invoice created the same day the session is marked complete.'}
            {freq === 'next_day' && 'Invoice created the day after the session.'}
            {freq === 'weekly' && `All completed sessions are batched into one invoice each ${DOW_LABELS[anchorDay]}.`}
            {freq === 'monthly' && `All completed sessions are batched into one invoice on the ${anchorDay || 1}${ordinal(anchorDay || 1)} of each month.`}
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={taxExempt}
                onChange={e => setTaxExempt(e.target.checked)}
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${taxExempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${taxExempt ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Tax / VAT exempt</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ordinal(n: number) {
  if (n === 1 || n === 21) return 'st'
  if (n === 2 || n === 22) return 'nd'
  if (n === 3 || n === 23) return 'rd'
  return 'th'
}

export function TherapistClients() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [billingClient, setBillingClient] = useState<TherapistClient | null>(null)
  const [editingClient, setEditingClient] = useState<TherapistClient | null>(null)

  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile })
  const sym = profile?.default_currency === 'ILS' ? '₪' : '$'

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: listMyClients,
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { tax_exempt: false },
  })
  const createTaxExempt = watch('tax_exempt')

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client added and invite sent')
      setShowCreate(false); reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create client'),
  })

  const resendMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => toast.success('Invite resent'),
    onError: () => toast.error('Failed to resend invite'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Add client modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Client</h2>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Email *</label>
                <input {...register('email')} type="email" className="input" placeholder="client@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Name *</label>
                <input {...register('name')} className="input" placeholder="Jane Smith" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Default Session Price ($) *</label>
                <input {...register('default_session_price')} type="number" step="0.01" className="input" placeholder="150.00" />
                {errors.default_session_price && <p className="text-red-500 text-xs mt-1">{errors.default_session_price.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} className="input" placeholder="+1 555-0100" />
              </div>
              <div>
                <label className="label">Private Notes</label>
                <textarea {...register('notes')} className="input h-20 resize-none" placeholder="Internal notes..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={createTaxExempt} onChange={e => setValue('tax_exempt', e.target.checked)} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${createTaxExempt ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${createTaxExempt ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">VAT / Tax Exempt</span>
                  <p className="text-xs text-gray-500">This client's sessions will not have VAT charged by default</p>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Adding...' : 'Add & Send Invite'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); reset() }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing schedule modal */}
      {billingClient && (
        <BillingModal client={billingClient} onClose={() => setBillingClient(null)} />
      )}

      {/* Edit client modal */}
      {editingClient && (
        <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} />
      )}

      {/* Client table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-4">No clients yet. Add your first client above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge active={client.is_active} clientActive={client.client_is_active} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {sym}{client.default_session_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col gap-1">
                      <span>{BILLING_LABELS[client.billing_frequency] ?? 'Same Day'}</span>
                      {client.tax_exempt && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 w-fit">
                          VAT Exempt
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {!client.client_is_active && (
                        <button onClick={() => resendMutation.mutate(client.client_id)}
                          className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Resend Invite
                        </button>
                      )}
                      <button onClick={() => setEditingClient(client)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setBillingClient(client)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <Settings2 className="w-3 h-3" /> Billing
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
