import api from './client'

export interface ServiceType {
  id: string
  name: string
  duration_minutes: number
  is_active: boolean
}

export const listServiceTypes = (): Promise<ServiceType[]> =>
  api.get('/therapist/service-types').then(r => r.data)

export const createServiceType = (data: { name: string; duration_minutes: number }): Promise<ServiceType> =>
  api.post('/therapist/service-types', data).then(r => r.data)

export const updateServiceType = (id: string, data: { name?: string; duration_minutes?: number; is_active?: boolean }): Promise<ServiceType> =>
  api.put(`/therapist/service-types/${id}`, data).then(r => r.data)

export const deleteServiceType = (id: string): Promise<void> =>
  api.delete(`/therapist/service-types/${id}`).then(r => r.data)
