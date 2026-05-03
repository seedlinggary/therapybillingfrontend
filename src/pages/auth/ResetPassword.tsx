import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '../../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Digits only'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type Form = z.infer<typeof schema>

export function ResetPassword() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: Form) => resetPassword(data.email, data.code, data.new_password),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in.')
      navigate('/client/login', { replace: true })
    },
    onError: () => toast.error('Invalid or expired reset code'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Enter Reset Code</h1>
          <p className="text-gray-500 mt-1">Check your email for the 6-digit code</p>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Reset Code</label>
            <input
              {...register('code')}
              className="input text-center text-xl tracking-widest font-mono"
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...register('new_password')} type="password" className="input" placeholder="••••••••" />
            {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...register('confirm_password')} type="password" className="input" placeholder="••••••••" />
            {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-2">
            {mutation.isPending ? 'Resetting...' : 'Reset Password'}
          </button>
          <div className="text-center">
            <Link to="/client/forgot-password" className="text-sm text-gray-500 hover:underline">
              Resend code
            </Link>
            <span className="mx-2 text-gray-300">·</span>
            <Link to="/client/login" className="text-sm text-gray-500 hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
