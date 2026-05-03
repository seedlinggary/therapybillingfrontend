import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  listTherapistInvoices, voidInvoice, deleteInvoice, markInvoicePaid,
  resendInvoiceEmail, downloadTherapistInvoicePdf, createInvoice,
  verifyStripePayment,
} from '../../api/invoices'
import { listTherapistAppointments } from '../../api/appointments'
import { getMyTherapistProfile } from '../../api/clients'
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
              <span className="text-xs text-gray-400 font-normal ml-1">({inv.items.length} sessions)</span>
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
                {inv.stripe_payment_link && (
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
  const [selectedApptId, setSelectedApptId] = useState('')

  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile })
  const profileSym = profile?.default_currency === 'ILS' ? '₪' : '$'

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => listTherapistInvoices(statusFilter ? { status: statusFilter } : {}),
  })

  // Auto-verify all unpaid Stripe invoices once per page load
  const autoChecked = useRef(false)
  useEffect(() => {
    if (autoChecked.current || isLoading) return
    const unpaid = invoices.filter(inv => inv.status === 'unpaid' && inv.stripe_payment_link)
    if (unpaid.length === 0) return
    autoChecked.current = true
    Promise.allSettled(unpaid.map(inv => verifyStripePayment(inv.id))).then(results => {
      const paid = results.filter(r => r.status === 'fulfilled').length
      if (paid > 0) {
        qc.invalidateQueries({ queryKey: ['invoices'] })
        toast.success(`${paid} invoice${paid > 1 ? 's' : ''} marked as paid via Stripe`)
      }
    })
  }, [isLoading, invoices])

  const { data: completedAppts = [] } = useQuery({
    queryKey: ['appointments-completed'],
    queryFn: () => listTherapistAppointments({ status: 'completed' }),
    enabled: showCreate,
  })
  const unbilledAppts = completedAppts.filter(a => !a.billed)

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
    mutationFn: markInvoicePaid,
    onSuccess: () => { invalidate(); toast.success('Invoice marked as paid') },
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

  const verifyMutation = useMutation({
    mutationFn: verifyStripePayment,
    onSuccess: () => { invalidate(); toast.success('Payment confirmed — invoice marked as paid') },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Payment not confirmed in Stripe'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
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
            <div className="space-y-4">
              <div>
                <label className="label">Completed Session (unbilled)</label>
                <select value={selectedApptId} onChange={e => setSelectedApptId(e.target.value)} className="input">
                  <option value="">Select session...</option>
                  {unbilledAppts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.client_name} — {format(new Date(a.start_time), 'MMM d, yyyy h:mm a')} ({profileSym}{(a.effective_price ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                {unbilledAppts.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No unbilled completed sessions.</p>
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
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
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
                  onMarkPaid={() => confirm('Mark this invoice as manually paid?') && markPaidMutation.mutate(inv.id)}
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
