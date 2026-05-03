import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clientRegister } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2, 'Name required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type Form = z.infer<typeof schema>

export function ClientRegister() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: Form) => clientRegister(data.email, data.name, data.password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.role)
      navigate('/client', { replace: true })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Registration failed'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Client Account</h1>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name')} className="input" placeholder="Jane Smith" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
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
          <div>
            <label className="label">Confirm Password</label>
            <input {...register('confirmPassword')} type="password" className="input" placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-2">
            {mutation.isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/client/login" className="text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
