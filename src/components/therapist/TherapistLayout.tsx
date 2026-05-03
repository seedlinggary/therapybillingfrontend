import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { getMyTherapistProfile } from '../../api/clients'
import {
  LayoutDashboard, Users, Calendar, FileText, LogOut, AlertCircle, Settings, BookOpen
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/therapist', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/therapist/clients', label: 'Clients', icon: Users, end: false },
  { to: '/therapist/appointments', label: 'Appointments', icon: Calendar, end: false },
  { to: '/therapist/invoices', label: 'Invoices', icon: FileText, end: false },
  { to: '/therapist/documents', label: 'Documents', icon: BookOpen, end: false },
  { to: '/therapist/settings', label: 'Settings', icon: Settings, end: false },
]

export function TherapistLayout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore(s => s.clearAuth)
  const { data: profile } = useQuery({ queryKey: ['therapist-profile'], queryFn: getMyTherapistProfile })

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const showOnboardingBanner = profile && !profile.onboarding_completed

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-semibold text-gray-900">TherapyBilling</span>
          </div>
        </div>

        {profile && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {profile.picture_url ? (
                <img src={profile.picture_url} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">{profile.name[0]}</span>
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {showOnboardingBanner && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              Your account setup is incomplete.{' '}
              <Link to="/therapist/onboarding" className="font-medium underline">Complete onboarding →</Link>
            </p>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
