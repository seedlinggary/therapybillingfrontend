import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clientLogin } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
})
type Form = z.infer<typeof schema>

export function ClientLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: Form) => clientLogin(data.email, data.password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.role)
      navigate('/client', { replace: true })
    },
    onError: () => toast.error('Invalid email or password'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Client Sign In</h1>
          <p className="text-gray-500 mt-1">Access your appointments and invoices</p>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" className="input" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-2">
            {mutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/client/forgot-password" className="text-sm text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/client/register" className="text-primary-600 hover:underline">Register</Link>
          <span className="mx-2">·</span>
          <Link to="/login" className="text-primary-600 hover:underline">Therapist login</Link>
        </div>
      </div>
    </div>
  )
}
