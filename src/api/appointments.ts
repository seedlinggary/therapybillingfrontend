import api from './client'
import type { Appointment, AvailabilitySlot, RecurringAppointmentCreate } from '../types'

export const getAvailability = (date: string, duration_minutes = 50): Promise<{ slots: AvailabilitySlot[] }> =>
  api.get('/therapist/availability', { params: { date, duration_minutes } }).then(r => r.data)

export const createAppointment = (data: {
  client_id: string
  start_time: string
  end_time: string
  session_type?: string
  override_price?: number
  session_notes?: string
}): Promise<Appointment> =>
  api.post('/therapist/appointments', data).then(r => r.data)

export const createRecurringAppointments = (data: RecurringAppointmentCreate): Promise<Appointment[]> =>
  api.post('/therapist/appointments/recurring', data).then(r => r.data)

export const listTherapistAppointments = (params?: {
  client_id?: string
  status?: string
  from_date?: string
  to_date?: string
}): Promise<Appointment[]> =>
  api.get('/therapist/appointments', { params }).then(r => r.data)

export const getTherapistAppointment = (id: string): Promise<Appointment> =>
  api.get(`/therapist/appointments/${id}`).then(r => r.data)

export const updateAppointment = (id: string, data: {
  start_time?: string
  end_time?: string
  session_type?: string
  override_price?: number | null
  session_notes?: string | null
  tax_exempt?: boolean | null
}): Promise<Appointment> =>
  api.patch(`/therapist/appointments/${id}`, data).then(r => r.data)

export const updateAppointmentStatus = (
  id: string,
  status: string,
  cancellation_reason?: string,
  session_notes?: string
): Promise<Appointment> =>
  api.patch(`/therapist/appointments/${id}/status`, { status, cancellation_reason, session_notes }).then(r => r.data)

export const deleteAppointment = (id: string): Promise<void> =>
  api.delete(`/therapist/appointments/${id}`).then(r => r.data)

export const listClientAppointments = (params?: { therapist_id?: string; status?: string }): Promise<Appointment[]> =>
  api.get('/client/appointments', { params }).then(r => r.data)

export const getClientAppointment = (id: string): Promise<Appointment> =>
  api.get(`/client/appointments/${id}`).then(r => r.data)
