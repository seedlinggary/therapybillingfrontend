import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { listClientInvoices, getPaymentLink, downloadClientInvoicePdf, confirmPayment } from '../../api/invoices'
import { Download, ExternalLink } from 'lucide-react'

const sym = (currency?: string) => currency === 'ILS' ? '₪' : '$'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unpaid: 'badge-yellow',
    paid: 'badge-green',
    void: 'badge-gray',
    refunded: 'badge-red',
  }
  return <span className={map[status] || 'badge-gray'}>{status}</span>
}

export function ClientInvoices() {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: () => listClientInvoices(),
  })

  // ── Auto-confirm payment when Stripe redirects back ───────────────────────
  const confirmMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-invoices'] })
      toast.success('Payment confirmed — invoice marked as paid!')
      // Remove query params from URL without navigation
      setSearchParams({}, { replace: true })
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? 'Could not confirm payment. Please contact your therapist.')
      setSearchParams({}, { replace: true })
    },
  })

  useEffect(() => {
    const invoiceId = searchParams.get('invoice_id')
    const paid = searchParams.get('paid')
    if (paid === 'true' && invoiceId && !confirmMutation.isPending) {
      confirmMutation.mutate(invoiceId)
    }
  }, []) // run once on mount

  const payMutation = useMutation({
    mutationFn: (id: string) => getPaymentLink(id),
    onSuccess: (data) => { window.open(data.payment_url, '_blank') },
    onError: () => toast.error('Could not load payment link'),
  })

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0)

  const isConfirming = confirmMutation.isPending

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
      </div>

      {isConfirming && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          Confirming your payment with Stripe…
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{sym(invoices[0]?.currency)}{totalPaid.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-orange-600">{sym(invoices[0]?.currency)}{totalUnpaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No invoices found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{inv.therapist_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {inv.appointment_start
                      ? format(new Date(inv.appointment_start), 'MMM d, yyyy')
                      : inv.items[0]?.appointment_start
                        ? format(new Date(inv.items[0].appointment_start), 'MMM d, yyyy')
                        : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{sym(inv.currency)}{inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(inv.due_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadClientInvoicePdf(inv.id, inv.invoice_number)}
                        title="Download PDF"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.status === 'unpaid' && (
                        inv.payment_link ?? inv.stripe_payment_link ? (
                          <a
                            href={(inv.payment_link ?? inv.stripe_payment_link)!}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Pay Now
                          </a>
                        ) : (
                          <button
                            onClick={() => payMutation.mutate(inv.id)}
                            disabled={payMutation.isPending}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Pay Now
                          </button>
                        )
                      )}
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
