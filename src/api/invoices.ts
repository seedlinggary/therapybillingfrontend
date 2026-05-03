import api from './client'
import type { Invoice } from '../types'

export const createInvoice = (appointment_id: string, notes?: string): Promise<Invoice> =>
  api.post('/therapist/invoices', { appointment_id, notes }).then(r => r.data)

export const billNow = (appointment_id: string): Promise<Invoice> =>
  api.post(`/therapist/appointments/${appointment_id}/bill-now`).then(r => r.data)

export const listTherapistInvoices = (params?: { status?: string; client_id?: string }): Promise<Invoice[]> =>
  api.get('/therapist/invoices', { params }).then(r => r.data)

export const getTherapistInvoice = (id: string): Promise<Invoice> =>
  api.get(`/therapist/invoices/${id}`).then(r => r.data)

export const verifyStripePayment = (id: string): Promise<Invoice> =>
  api.post(`/therapist/invoices/${id}/verify-stripe-payment`).then(r => r.data)

export const voidInvoice = (id: string): Promise<Invoice> =>
  api.post(`/therapist/invoices/${id}/void`).then(r => r.data)

export const deleteInvoice = (id: string): Promise<void> =>
  api.delete(`/therapist/invoices/${id}`).then(r => r.data)

export const markInvoicePaid = (id: string): Promise<Invoice> =>
  api.post(`/therapist/invoices/${id}/mark-paid`).then(r => r.data)

export const resendInvoiceEmail = (id: string): Promise<void> =>
  api.post(`/therapist/invoices/${id}/resend`).then(r => r.data)

export const downloadTherapistInvoicePdf = async (id: string, invoiceNumber: string) => {
  const response = await api.get(`/therapist/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${invoiceNumber}.pdf`
  link.click()
  window.URL.revokeObjectURL(url)
}

export const listClientInvoices = (params?: { status?: string; therapist_id?: string }): Promise<Invoice[]> =>
  api.get('/client/invoices', { params }).then(r => r.data)

export const getClientInvoice = (id: string): Promise<Invoice> =>
  api.get(`/client/invoices/${id}`).then(r => r.data)

export const getPaymentLink = (id: string): Promise<{ payment_url: string }> =>
  api.get(`/client/invoices/${id}/pay`).then(r => r.data)

export const confirmPayment = (id: string): Promise<import('../types').Invoice> =>
  api.post(`/client/invoices/${id}/confirm-payment`).then(r => r.data)

export const downloadClientInvoicePdf = async (id: string, invoiceNumber: string) => {
  const response = await api.get(`/client/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${invoiceNumber}.pdf`
  link.click()
  window.URL.revokeObjectURL(url)
}
