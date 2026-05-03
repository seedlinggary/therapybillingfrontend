import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forgotPassword } from '../../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type Form = z.infer<typeof schema>

export function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: Form) => forgotPassword(data.email),
    onSuccess: () => toast.success('Check your email for a reset code'),
    onError: () => toast.error('Something went wrong. Please try again.'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-1">Enter your email and we'll send a 6-digit reset code</p>
        </div>

        {mutation.isSuccess ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-800 rounded-lg p-4 text-sm">
              A reset code has been sent if an account with that email exists.
            </div>
            <Link to="/client/reset-password" className="btn-primary w-full block text-center">
              Enter Reset Code
            </Link>
            <Link to="/client/login" className="text-sm text-primary-600 hover:underline block">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" autoFocus />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-2">
              {mutation.isPending ? 'Sending...' : 'Send Reset Code'}
            </button>
            <div className="text-center">
              <Link to="/client/login" className="text-sm text-gray-500 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
