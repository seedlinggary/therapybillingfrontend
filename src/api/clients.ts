import api from './client'
import type { TherapistClient, Therapist } from '../types'

export const getMyTherapistProfile = (): Promise<Therapist> =>
  api.get('/onboarding/me').then(r => r.data)

export const updateTherapistProfile = (data: Partial<Therapist>): Promise<Therapist> =>
  api.patch('/onboarding/me', data).then(r => r.data)

export const getOnboardingStatus = () =>
  api.get('/onboarding/status').then(r => r.data)

export const getCalendarConnectUrl = (): Promise<{ auth_url: string }> =>
  api.get('/onboarding/google-calendar/connect').then(r => r.data)

export const getStripeConnectUrl = (): Promise<{ auth_url: string }> =>
  api.get('/onboarding/stripe/connect').then(r => r.data)

export const manualConnectStripe = (account_id: string): Promise<{ stripe_connected: boolean }> =>
  api.post('/onboarding/stripe/manual-connect', { account_id }).then(r => r.data)

export const disconnectGoogleCalendar = (): Promise<void> =>
  api.delete('/onboarding/google-calendar').then(r => r.data)

export const disconnectStripe = (): Promise<void> =>
  api.delete('/onboarding/stripe').then(r => r.data)

export const connectPayMe = (data: { seller_id: string; api_key: string }): Promise<Therapist> =>
  api.post('/onboarding/payme/connect', data).then(r => r.data)

export const disconnectPayMe = (): Promise<void> =>
  api.delete('/onboarding/payme').then(r => r.data)

export const listMyClients = (): Promise<TherapistClient[]> =>
  api.get('/therapist/clients').then(r => r.data)

export const createClient = (data: {
  email: string
  name: string
  default_session_price: number
  phone?: string
  notes?: string
}): Promise<TherapistClient> =>
  api.post('/therapist/clients', data).then(r => r.data)

export const getClient = (clientId: string): Promise<TherapistClient> =>
  api.get(`/therapist/clients/${clientId}`).then(r => r.data)

export const updateClient = (clientId: string, data: {
  default_session_price?: number
  notes?: string
  is_active?: boolean
}): Promise<TherapistClient> =>
  api.patch(`/therapist/clients/${clientId}`, data).then(r => r.data)

export const resendInvite = (clientId: string): Promise<void> =>
  api.post(`/therapist/clients/${clientId}/resend-invite`).then(r => r.data)

export const updateClientBilling = (clientId: string, data: {
  billing_frequency?: string
  billing_anchor_day?: number | null
}): Promise<void> =>
  api.patch(`/therapist/clients/${clientId}/billing`, data).then(r => r.data)

export const getMyClientProfile = () =>
  api.get('/client/me').then(r => r.data)
