import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminLogin } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Shield } from 'lucide-react'

interface Form { email: string; password: string }

export function AdminLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const { register, handleSubmit } = useForm<Form>()

  const mutation = useMutation({
    mutationFn: (d: Form) => adminLogin(d.email, d.password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.role)
      navigate('/admin', { replace: true })
    },
    onError: () => toast.error('Invalid email or password'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 mb-3">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Superuser portal</p>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" className="input" autoComplete="current-password" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-2">
            {mutation.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
