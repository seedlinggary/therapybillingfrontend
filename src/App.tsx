import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Auth pages
import { GoogleAuthCallback } from './pages/auth/GoogleAuthCallback'
import { ClientLogin } from './pages/auth/ClientLogin'
import { ClientRegister } from './pages/auth/ClientRegister'
import { ActivateAccount } from './pages/auth/ActivateAccount'
import { TherapistLogin } from './pages/auth/TherapistLogin'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { AdminLogin } from './pages/auth/AdminLogin'

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard'

// Therapist pages
import { TherapistLayout } from './components/therapist/TherapistLayout'
import { TherapistDashboard } from './pages/therapist/TherapistDashboard'
import { TherapistClients } from './pages/therapist/TherapistClients'
import { TherapistAppointments } from './pages/therapist/TherapistAppointments'
import { TherapistInvoices } from './pages/therapist/TherapistInvoices'
import { TherapistOnboarding } from './pages/therapist/TherapistOnboarding'
import { TherapistSettings } from './pages/therapist/TherapistSettings'
import { TherapistDocuments } from './pages/therapist/TherapistDocuments'

// Client pages
import { ClientLayout } from './components/client/ClientLayout'
import { ClientDashboard } from './pages/client/ClientDashboard'
import { ClientSessions } from './pages/client/ClientSessions'
import { ClientInvoices } from './pages/client/ClientInvoices'

function RequireAuth({ role, children }: { role: 'therapist' | 'client' | 'admin'; children: React.ReactNode }) {
  const { accessToken, role: userRole } = useAuthStore()
  if (!accessToken) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />
  if (userRole !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { role } = useAuthStore()

  return (
    <Routes>
      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <RequireAuth role="admin">
          <AdminDashboard />
        </RequireAuth>
      } />

      {/* Public */}
      <Route path="/login" element={<TherapistLogin />} />
      <Route path="/client/login" element={<ClientLogin />} />
      <Route path="/client/register" element={<ClientRegister />} />
      <Route path="/client/forgot-password" element={<ForgotPassword />} />
      <Route path="/client/reset-password" element={<ResetPassword />} />
      <Route path="/activate" element={<ActivateAccount />} />
      <Route path="/auth/callback" element={<GoogleAuthCallback />} />

      {/* Therapist */}
      <Route path="/therapist" element={
        <RequireAuth role="therapist">
          <TherapistLayout />
        </RequireAuth>
      }>
        <Route index element={<TherapistDashboard />} />
        <Route path="clients" element={<TherapistClients />} />
        <Route path="appointments" element={<TherapistAppointments />} />
        <Route path="invoices" element={<TherapistInvoices />} />
        <Route path="documents" element={<TherapistDocuments />} />
        <Route path="onboarding" element={<TherapistOnboarding />} />
        <Route path="settings" element={<TherapistSettings />} />
      </Route>

      {/* Client */}
      <Route path="/client" element={
        <RequireAuth role="client">
          <ClientLayout />
        </RequireAuth>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="sessions" element={<ClientSessions />} />
        <Route path="invoices" element={<ClientInvoices />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={
        role === 'therapist' ? <Navigate to="/therapist" replace /> :
        role === 'client' ? <Navigate to="/client" replace /> :
        role === 'admin' ? <Navigate to="/admin" replace /> :
        <Navigate to="/login" replace />
      } />
    </Routes>
  )
}
