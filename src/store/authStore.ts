import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../types'

interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  role: Role | null
  setAuth: (accessToken: string, refreshToken: string, role: Role) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      setAuth: (accessToken, refreshToken, role) =>
        set({ accessToken, refreshToken, role }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, role: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
)
