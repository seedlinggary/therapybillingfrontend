import api from './client'
import type {
  AccountingIntegration, AccountingDocument,
  AuditLog, MonthlyReport,
} from '../types'

// ── Integration ───────────────────────────────────────────────────────────────

export interface ConnectAccountingPayload {
  provider: string
  company_id: string
  username: string
  api_key: string
}

export const connectAccounting = (data: ConnectAccountingPayload): Promise<AccountingIntegration> =>
  api.post('/integrations/accounting/connect', data).then(r => r.data)

export const disconnectAccounting = (provider: string): Promise<void> =>
  api.delete('/integrations/accounting/disconnect', { params: { provider } }).then(r => r.data)

export const getAccountingStatus = (): Promise<AccountingIntegration | null> =>
  api.get('/integrations/accounting/status').then(r => r.data)

// ── Documents ─────────────────────────────────────────────────────────────────

export interface ListDocumentsParams {
  doc_type?: string
  status?: string
  limit?: number
  offset?: number
}

export const listDocuments = (params?: ListDocumentsParams): Promise<AccountingDocument[]> =>
  api.get('/documents/', { params }).then(r => r.data)

export const getDocument = (id: string): Promise<AccountingDocument> =>
  api.get(`/documents/${id}`).then(r => r.data)

export const resendDocumentEmail = (id: string): Promise<void> =>
  api.post(`/documents/${id}/resend`).then(r => r.data)

export const cancelDocument = (id: string, issueCreditNote = false): Promise<{ ok: boolean; credit_note_id?: string }> =>
  api.post(`/documents/${id}/cancel`, null, { params: { issue_credit_note: issueCreditNote } }).then(r => r.data)

export interface ManualReceiptPayload {
  invoice_id?: string
  amount: number
  currency?: string
  client_name: string
  client_email: string
  description?: string
  payment_method?: string
  doc_type?: string
}

export const createManualReceipt = (data: ManualReceiptPayload): Promise<AccountingDocument> =>
  api.post('/documents/manual-receipt', data).then(r => r.data)

// ── Audit logs ────────────────────────────────────────────────────────────────

export const listAuditLogs = (params?: { limit?: number; offset?: number }): Promise<AuditLog[]> =>
  api.get('/documents/audit-logs', { params }).then(r => r.data)

// ── Reports ───────────────────────────────────────────────────────────────────

export const getMonthlyReport = (year: number): Promise<MonthlyReport> =>
  api.get('/documents/reports/monthly', { params: { year } }).then(r => r.data)

export const getVatReport = (year: number, month: number) =>
  api.get('/documents/reports/vat', { params: { year, month } }).then(r => r.data)

export const downloadDocumentsCsv = async (year: number) => {
  const response = await api.get('/documents/export/csv', {
    params: { year },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = `documents_${year}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}
