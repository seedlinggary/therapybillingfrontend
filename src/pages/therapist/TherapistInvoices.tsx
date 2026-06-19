import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  listTherapistInvoices, voidInvoice, deleteInvoice, markInvoicePaid,
  resendInvoiceEmail, downloadTherapistInvoicePdf, createInvoice,
  verifyStripePayment, createStandaloneInvoice,
} from '../../api/invoices'
import { listTherapistAppointments } from '../../api/appointments'
import { getMyTherapistProfile, listMyClients } from '../../api/clients'
import { Download, Mail, XCircle, Plus, Trash2, CheckCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import type { Invoice } from '../../types'

const sym = (currency?: string) => currency === 'ILS' ? '₪' : '$'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unpaid: 'badge-yellow', paid: 'badge-green', void: 'badge-gray', refunded: 'badge-red',
  }
  return <span className={map[status] || 'badge-gray'}>{status}</span>
}

function InvoiceRow({
  inv,
  onVoid, onDelete, onMarkPaid, onResend, onDownload, onVerifyStripe,
}: {
  inv: Invoice
  onVoid: () => void
  onDelete: () => void
  onMarkPaid: () => void
  onResend: () => void
  onDownload: () => void
  onVerifyStripe: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMultiple = inv.items.length > 1

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm font-medium text-gray-900">
          <div className="flex items-center gap-1.5">
            {hasMultiple && (
              <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
            #{inv.invoice_number}
            {hasMultiple && (
              <span className="text-xs text-gray-400 font-normal ml-1">({inv.items.length} items)</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">{inv.client_name}</td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {inv.appointment_start
            ? format(new Date(inv.appointment_start), 'MMM d, yyyy')
            : inv.items[0]?.appointment_start
              ? format(new Date(inv.items[0].appointment_start), 'MMM d, yyyy')
              : '—'}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sym(inv.currency)}{inv.amount.toFixed(2)}</td>
        <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(inv.due_date), 'MMM d, yyyy')}</td>
        <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button onClick={onDownload} title="Download PDF" className="text-gray-500 hover:text-gray-700">
              <Download className="w-4 h-4" />
            </button>
            {inv.status === 'unpaid' && (
              <>
                {(inv.stripe_payment_link || (inv.payment_provider === 'stripe' && inv.payment_link)) && (
                  <button
                    onClick={onVerifyStripe}
                    title="Check Stripe — mark paid if payment completed"
                    className="text-blue-600 hover:text-blue-800">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button onClick={onResend} title="Resend email" className="text-primary-600 hover:text-primary-800">
                  <Mail className="w-4 h-4" />
                </button>
                <button onClick={onMarkPaid} title="Mark as paid manually"
                  className="text-green-600 hover:text-green-800">
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={onVoid} title="Void invoice" className="text-orange-500 hover:text-orange-700">
                  <XCircle className="w-4 h-4" />
                </button>
                <button onClick={onDelete} title="Delete invoice" className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded line items */}
      {expanded && inv.items.length > 0 && (
        <tr>
          <td colSpan={7} className="px-6 pb-3 pt-0">
            <div className="ml-5 border-l-2 border-gray-100 pl-4">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {inv.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-gray-600">{item.description}</td>
                      <td className="py-1.5 text-gray-400 text-xs">
                        {item.appointment_start
                          ? format(new Date(item.appointment_start), 'MMM d, yyyy h:mm a')
                          : ''}
                      </td>
                      <td className="py-1.5 text-right font-medium text-gray-700">{sym(inv.currency)}{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function TherapistInvoices() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createMode, setCreateMode] = useState<'appointment' | 'standalone'>('appointment')
  const [selectedApptId, setSelectedApptId] = useState('')
  const [standaloneClientId, setStandaloneClientId] = useState('')
  const [standaloneDescription, setStandaloneDescription] = useState('')
  const [standaloneAmount, setStandaloneAmount] = useState('')
  const [standaloneServiceDate, setStandaloneServiceDate] = useState('')
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null)
  const [markPaidMethod, setMarkPaidMethod] = useState('cash')
  const [markPaidDate, setMarkPaidDate] = useState(() => new Date().toISOString().slice(0, 10))

  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile, staleTime: 60_000 })
  const profileSym = profile?.default_currency === 'ILS' ? '₪' : '$'

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => listTherapistInvoices(statusFilter ? { status: statusFilter } : {}),
    staleTime: 15_000,
  })


  const { data: completedAppts = [] } = useQuery({
    queryKey: ['appointments-completed'],
    queryFn: () => listTherapistAppointments({ status: 'completed' }),
    enabled: showCreate && createMode === 'appointment',
  })
  const unbilledAppts = completedAppts.filter(a => !a.billed)

  const { data: allClients = [] } = useQuery({
    queryKey: ['therapist-clients'],
    queryFn: listMyClients,
    enabled: showCreate && createMode === 'standalone',
  })
  const activeClients = allClients.filter(c => c.is_active)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['invoices'] })
    qc.invalidateQueries({ queryKey: ['appointments'] })
  }

  const voidMutation = useMutation({
    mutationFn: voidInvoice,
    onSuccess: () => { invalidate(); toast.success('Invoice voided') },
    onError: () => toast.error('Failed to void invoice'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => { invalidate(); toast.success('Invoice deleted — appointments released') },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to delete invoice'),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method, date }: { id: string; method: string; date: string }) =>
      markInvoicePaid(id, { payment_method: method, payment_date: date }),
    onSuccess: () => {
      invalidate()
      toast.success('Invoice marked as paid')
      setMarkPaidInvoice(null)
    },
    onError: () => toast.error('Failed to mark invoice as paid'),
  })

  const resendMutation = useMutation({
    mutationFn: resendInvoiceEmail,
    onSuccess: () => toast.success('Invoice email resent'),
    onError: () => toast.error('Failed to resend email'),
  })

  const createMutation = useMutation({
    mutationFn: (apptId: string) => createInvoice(apptId),
    onSuccess: () => {
      invalidate()
      toast.success('Invoice created and sent')
      setShowCreate(false)
      setSelectedApptId('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create invoice'),
  })

  const standaloneMutation = useMutation({
    mutationFn: createStandaloneInvoice,
    onSuccess: () => {
      invalidate()
      toast.success('Invoice created and sent')
      setShowCreate(false)
      setStandaloneClientId('')
      setStandaloneDescription('')
      setStandaloneAmount('')
      setStandaloneServiceDate('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create invoice'),
  })

  const handleStandaloneSubmit = () => {
    const amt = parseFloat(standaloneAmount)
    if (!standaloneClientId || !standaloneDescription || isNaN(amt) || amt <= 0) {
      toast.error('Please fill in client, description, and a valid amount')
      return
    }
    standaloneMutation.mutate({
      client_id: standaloneClientId,
      description: standaloneDescription,
      amount: amt,
      service_date: standaloneServiceDate || undefined,
    })
  }

  const verifyMutation = useMutation({
    mutationFn: verifyStripePayment,
    onSuccess: () => { invalidate(); toast.success('Payment confirmed — invoice marked as paid') },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Payment not confirmed in Stripe'),
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => { setCreateMode('appointment'); setShowCreate(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {['', 'unpaid', 'paid', 'void'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Create invoice modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>

            {/* Mode tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
              <button
                onClick={() => setCreateMode('appointment')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${createMode === 'appointment' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                From Appointment
              </button>
              <button
                onClick={() => setCreateMode('standalone')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${createMode === 'standalone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Standalone
              </button>
            </div>

            {createMode === 'appointment' ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Completed Appointment (unbilled)</label>
                  <select value={selectedApptId} onChange={e => setSelectedApptId(e.target.value)} className="input">
                    <option value="">Select appointment...</option>
                    {unbilledAppts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.client_name} — {format(new Date(a.start_time), 'MMM d, yyyy h:mm a')} ({profileSym}{(a.effective_price ?? 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {unbilledAppts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No unbilled completed appointments.</p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => selectedApptId && createMutation.mutate(selectedApptId)}
                    disabled={!selectedApptId || createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Creating...' : 'Create & Send'}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">Client</label>
                  <select value={standaloneClientId} onChange={e => setStandaloneClientId(e.target.value)} className="input">
                    <option value="">Select client...</option>
                    {activeClients.map(c => (
                      <option key={c.client_id} value={c.client_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={standaloneDescription}
                    onChange={e => setStandaloneDescription(e.target.value)}
                    placeholder="e.g. Consultation, Monthly package..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Amount ({profileSym})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={standaloneAmount}
                    onChange={e => setStandaloneAmount(e.target.value)}
                    placeholder="0.00"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Service Date <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date"
                    value={standaloneServiceDate}
                    onChange={e => setStandaloneServiceDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleStandaloneSubmit}
                    disabled={standaloneMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {standaloneMutation.isPending ? 'Creating...' : 'Create & Send'}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark as Paid modal */}
      {markPaidInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Mark Invoice as Paid</h2>
            <p className="text-sm text-gray-500">Invoice #{markPaidInvoice.invoice_number} — {markPaidInvoice.client_name}</p>
            <div>
              <label className="label">Payment Date</label>
              <input
                type="date"
                value={markPaidDate}
                onChange={e => setMarkPaidDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select value={markPaidMethod} onChange={e => setMarkPaidMethod(e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="bit">Bit</option>
                <option value="paybox">Paybox</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => markPaidMutation.mutate({ id: markPaidInvoice.id, method: markPaidMethod, date: markPaidDate })}
                disabled={markPaidMutation.isPending}
                className="btn-primary flex-1"
              >
                {markPaidMutation.isPending ? 'Saving...' : 'Confirm Payment'}
              </button>
              <button onClick={() => setMarkPaidInvoice(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No invoices found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  onVoid={() => confirm('Void this invoice?') && voidMutation.mutate(inv.id)}
                  onDelete={() => confirm('Delete this invoice? The appointment(s) will become billable again.') && deleteMutation.mutate(inv.id)}
                  onMarkPaid={() => { setMarkPaidDate(new Date().toISOString().slice(0, 10)); setMarkPaidMethod('cash'); setMarkPaidInvoice(inv) }}
                  onResend={() => resendMutation.mutate(inv.id)}
                  onVerifyStripe={() => verifyMutation.mutate(inv.id)}
                  onDownload={() => downloadTherapistInvoicePdf(inv.id, inv.invoice_number)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
