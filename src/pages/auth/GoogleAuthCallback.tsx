import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

export function GoogleAuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  useEffect(() => {
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const role = params.get('role') as Role
    const isNew = params.get('is_new') === 'true'
    const error = params.get('error')

    if (error) {
      navigate(`/login?error=${error}`, { replace: true })
      return
    }

    if (accessToken && refreshToken && role) {
      setAuth(accessToken, refreshToken, role)
      if (role === 'therapist') {
        // New or incomplete-onboarding therapists go straight to onboarding
        navigate(isNew ? '/therapist/onboarding' : '/therapist', { replace: true })
      } else {
        navigate('/client', { replace: true })
      }
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
