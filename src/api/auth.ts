import api from './client'

export const clientLogin = (email: string, password: string) =>
  api.post('/auth/client/login', { email, password }).then(r => r.data)

export const clientRegister = (email: string, name: string, password: string, invite_token?: string) =>
  api.post('/auth/client/register', { email, name, password, invite_token }).then(r => r.data)

export const activateAccount = (invite_token: string, password: string, name?: string) =>
  api.post('/auth/client/activate', { invite_token, password, name }).then(r => r.data)

export const getGoogleLoginUrl = () =>
  api.get('/auth/google/login').then(r => r.data.auth_url as string)

export const forgotPassword = (email: string) =>
  api.post('/auth/client/forgot-password', { email }).then(r => r.data)

export const resetPassword = (email: string, code: string, new_password: string) =>
  api.post('/auth/client/reset-password', { email, code, new_password }).then(r => r.data)
