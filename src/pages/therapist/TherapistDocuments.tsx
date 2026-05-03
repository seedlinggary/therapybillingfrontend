import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  listDocuments, resendDocumentEmail, cancelDocument,
  createManualReceipt, getMonthlyReport, downloadDocumentsCsv,
  listAuditLogs,
} from '../../api/accounting'
import { getMyTherapistProfile } from '../../api/clients'
import {
  Download, Mail, XCircle, Plus, FileText,
  BarChart2, ChevronDown, ChevronRight, AlertCircle,
} from 'lucide-react'
import type { AccountingDocument, AuditLog } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: 'badge-green',
    pending: 'badge-yellow',
    failed: 'badge-red',
    canceled: 'badge-gray',
  }
  return <span className={map[status] || 'badge-gray'}>{status}</span>
}

function DocTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    receipt: 'Receipt',
    receipt_invoice: 'Receipt-Invoice',
    invoice: 'Invoice',
    credit_note: 'Credit Note',
  }
  return (
    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 font-medium">
      {labels[type] || type}
    </span>
  )
}

const CURRENT_YEAR = new Date().getFullYear()

// ── Manual Receipt Modal ──────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS = [
  { value: 'receipt_invoice', label: 'Receipt-Invoice (חשבונית מס קבלה) — most common' },
  { value: 'invoice',         label: 'Invoice (חשבונית מס)' },
  { value: 'receipt',         label: 'Receipt (קבלה)' },
  { value: 'credit_note',     label: 'Credit Note (חשבונית זיכוי)' },
]

function ManualReceiptModal({
  currency,
  isIL,
  onClose,
  onSubmit,
  isPending,
}: {
  currency: string
  isIL: boolean
  onClose: () => void
  onSubmit: (data: {
    client_name: string; client_email: string; amount: number
    description: string; payment_method: string; currency: string; doc_type: string
  }) => void
  isPending: boolean
}) {
  const [form, setForm] = useState({
    client_name: '', client_email: '', amount: '',
    description: '', payment_method: 'cash',
    doc_type: isIL ? 'receipt_invoice' : 'receipt',
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, amount: parseFloat(form.amount) || 0, currency })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Document Type</label>
            <select value={form.doc_type} onChange={set('doc_type')} className="input">
              {DOC_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client Name</label>
              <input required value={form.client_name} onChange={set('client_name')} className="input" />
            </div>
            <div>
              <label className="label">Client Email</label>
              <input required type="email" value={form.client_email} onChange={set('client_email')} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount ({currency})</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className="input" />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select value={form.payment_method} onChange={set('payment_method')} className="input">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input value={form.description} onChange={set('description')} className="input"
              placeholder="Therapy Session — April 28, 2026" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Creating...' : 'Create Document'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TherapistDocuments() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'documents' | 'reports' | 'audit'>('documents')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reportYear, setReportYear] = useState(CURRENT_YEAR)
  const [showManual, setShowManual] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['therapist-profile'],
    queryFn: getMyTherapistProfile,
  })

  const isIL = (profile?.country || 'US').toUpperCase() === 'IL'
  const currency = isIL ? 'ILS' : 'USD'
  const currencySymbol = isIL ? '₪' : '$'

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['accounting-docs', typeFilter, statusFilter],
    queryFn: () => listDocuments({
      doc_type: typeFilter || undefined,
      status: statusFilter || undefined,
    }),
    enabled: tab === 'documents',
  })

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['accounting-report', reportYear],
    queryFn: () => getMonthlyReport(reportYear),
    enabled: tab === 'reports',
  })

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => listAuditLogs({ limit: 100 }),
    enabled: tab === 'audit',
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounting-docs'] })

  const resendMutation = useMutation({
    mutationFn: resendDocumentEmail,
    onSuccess: () => toast.success('Email resent'),
    onError: () => toast.error('Failed to resend email'),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, creditNote }: { id: string; creditNote: boolean }) =>
      cancelDocument(id, creditNote),
    onSuccess: (data) => {
      invalidate()
      toast.success(data.credit_note_id
        ? 'Document canceled — credit note issued'
        : 'Document canceled')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Cancellation failed'),
  })

  const manualMutation = useMutation({
    mutationFn: createManualReceipt,
    onSuccess: (doc) => {
      invalidate()
      setShowManual(false)
      if (doc.provider_error) {
        toast.error(
          `Receipt saved but provider rejected it: ${doc.provider_error}\n` +
          `It will retry automatically. Check the Audit Log for details.`,
          { duration: 8000 }
        )
      } else {
        toast.success('Receipt created and sent')
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create receipt'),
  })

  const handleCancel = (doc: AccountingDocument) => {
    const msg = isIL
      ? 'Cancel this document? A credit note will be issued automatically (Israeli law requires this).'
      : 'Cancel this document?'
    if (!confirm(msg)) return
    cancelMutation.mutate({ id: doc.id, creditNote: isIL })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Documents
          {isIL && (
            <span className="ml-3 text-sm font-normal text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5">
              🇮🇱 iCount — legally compliant
            </span>
          )}
        </h1>
        <button onClick={() => setShowManual(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Manual Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['documents', 'reports', 'audit'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'documents' ? 'Documents' : t === 'reports' ? 'Reports' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* ── Documents tab ── */}
      {tab === 'documents' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input w-auto text-sm">
              <option value="">All Types</option>
              <option value="receipt">Receipt</option>
              <option value="receipt_invoice">Receipt-Invoice</option>
              <option value="invoice">Invoice</option>
              <option value="credit_note">Credit Note</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto text-sm">
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            {docsLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No documents yet. They are created automatically after each payment.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    {isIL && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doc #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map(doc => {
                    const meta = (doc.doc_metadata || {}) as Record<string, string>
                    const isExpanded = expandedId === doc.id
                    return (
                      <>
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {format(new Date(doc.created_at), isIL ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <DocTypeBadge type={doc.doc_type} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                                className="text-gray-400 hover:text-gray-600">
                                {isExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5" />
                                  : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              {meta.client_name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {currencySymbol}{doc.amount.toFixed(2)}
                          </td>
                          {isIL && (
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {doc.vat_amount != null ? `₪${doc.vat_amount.toFixed(2)}` : '—'}
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">
                            {doc.external_id || <span className="text-gray-300 italic">internal</span>}
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {doc.pdf_url && (
                                <a href={doc.pdf_url} target="_blank" rel="noreferrer"
                                  title="View / Download PDF"
                                  className="text-gray-500 hover:text-gray-700">
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              {doc.status === 'issued' && (
                                <>
                                  <button onClick={() => resendMutation.mutate(doc.id)}
                                    title="Resend email"
                                    className="text-primary-600 hover:text-primary-800">
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleCancel(doc)}
                                    title={isIL ? 'Cancel & issue credit note' : 'Cancel document'}
                                    className="text-orange-500 hover:text-orange-700">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {doc.status === 'failed' && (
                                <span
                                  title={doc.provider_error || 'Provider call failed — will retry automatically'}
                                  className="flex items-center gap-1 text-xs text-red-500 cursor-help"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {doc.provider_error
                                    ? doc.provider_error.length > 40
                                      ? doc.provider_error.slice(0, 40) + '…'
                                      : doc.provider_error
                                    : 'Retrying…'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${doc.id}-detail`}>
                            <td colSpan={isIL ? 8 : 7} className="px-6 pb-3 pt-0 bg-gray-50">
                              <div className="ml-5 text-sm text-gray-600 space-y-1">
                                {meta.client_email && <p>Email: {meta.client_email}</p>}
                                {meta.invoice_number && <p>Invoice #: {meta.invoice_number}</p>}
                                {meta.payment_method && <p>Payment: {meta.payment_method}</p>}
                                {doc.parent_document_id && (
                                  <p className="text-orange-600">Credit note for document {doc.parent_document_id}</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Reports tab ── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <select
              value={reportYear}
              onChange={e => setReportYear(Number(e.target.value))}
              className="input w-auto"
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => downloadDocumentsCsv(reportYear)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {reportLoading ? (
            <div className="text-gray-400">Loading...</div>
          ) : !report || report.rows.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">No data for {reportYear}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="card text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Revenue {reportYear}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currencySymbol}{report.grand_total.toFixed(2)}
                  </p>
                </div>
                {isIL && (
                  <div className="card text-center">
                    <p className="text-sm text-gray-500 mb-1">Total VAT {reportYear}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₪{report.grand_vat.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      {isIL && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.rows.map(row => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.month}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.document_count}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {currencySymbol}{row.total_amount.toFixed(2)}
                        </td>
                        {isIL && (
                          <td className="px-6 py-4 text-sm text-gray-500">
                            ₪{row.total_vat.toFixed(2)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Audit Log tab ── */}
      {tab === 'audit' && (
        <div className="card p-0 overflow-hidden">
          {auditLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No audit events yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{log.action}</td>
                    <td className="px-6 py-4">
                      <span className={log.status === 'success' ? 'badge-green' : 'badge-red'}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.error_message
                        ? <span className="text-red-500">{log.error_message}</span>
                        : log.entity_id
                          ? <span className="font-mono text-xs">{log.entity_id}</span>
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showManual && (
        <ManualReceiptModal
          currency={currency}
          isIL={isIL}
          onClose={() => setShowManual(false)}
          onSubmit={data => manualMutation.mutate(data)}
          isPending={manualMutation.isPending}
        />
      )}
    </div>
  )
}
