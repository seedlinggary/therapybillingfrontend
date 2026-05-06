import api from './client'

export const adminListTherapists = () =>
  api.get('/admin/therapists').then(r => r.data)

export const adminGetTherapist = (id: string) =>
  api.get(`/admin/therapists/${id}`).then(r => r.data)

export const adminUpdateTherapist = (id: string, data: Record<string, unknown>) =>
  api.patch(`/admin/therapists/${id}`, data).then(r => r.data)

export const adminGetTherapistClients = (id: string) =>
  api.get(`/admin/therapists/${id}/clients`).then(r => r.data)

export const adminGetTherapistInvoices = (id: string) =>
  api.get(`/admin/therapists/${id}/invoices`).then(r => r.data)

export const adminGetTherapistAppointments = (id: string) =>
  api.get(`/admin/therapists/${id}/appointments`).then(r => r.data)

export const adminListClients = () =>
  api.get('/admin/clients').then(r => r.data)

export const adminGetClient = (id: string) =>
  api.get(`/admin/clients/${id}`).then(r => r.data)

export const adminUpdateClient = (id: string, data: Record<string, unknown>) =>
  api.patch(`/admin/clients/${id}`, data).then(r => r.data)

export const adminGetClientInvoices = (id: string) =>
  api.get(`/admin/clients/${id}/invoices`).then(r => r.data)

export const adminGetClientAppointments = (id: string) =>
  api.get(`/admin/clients/${id}/appointments`).then(r => r.data)
