import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { activateAccount } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type Form = z.infer<typeof schema>

export function ActivateAccount() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: Form) => activateAccount(token, data.password, data.name),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.role)
      toast.success('Account activated!')
      navigate('/client', { replace: true })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Activation failed'),
  })

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <p className="text-red-600">Invalid activation link. Please request a new invite.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Activate Your Account</h1>
          <p className="text-gray-500 mt-1">Set up your password to get started</p>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Your Name</label>
            <input {...register('name')} className="input" placeholder="Jane Smith" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
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
            {mutation.isPending ? 'Activating...' : 'Activate Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
