import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { listTherapistAppointments } from '../../api/appointments'
import { listTherapistInvoices } from '../../api/invoices'
import { listMyClients, getMyTherapistProfile } from '../../api/clients'
import { CalendarView } from '../../components/therapist/CalendarView'
import { format } from 'date-fns'
import { Calendar, Users, FileText, DollarSign, ArrowRight } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function TherapistDashboard() {
  const today = new Date()
  const navigate = useNavigate()

  const { data: profile } = useQuery({
    queryKey: ['therapist-profile'],
    queryFn: getMyTherapistProfile,
  })

  // Redirect to onboarding until both Calendar and Stripe are connected
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/therapist/onboarding', { replace: true })
    }
  }, [profile])

  const { data: appointments = [] } = useQuery({ queryKey: ['appointments'], queryFn: () => listTherapistAppointments() })
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => listTherapistInvoices() })
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listMyClients })

  const upcomingAppts = appointments.filter(a => a.status === 'scheduled' && new Date(a.start_time) >= today)
  const todayAppts = upcomingAppts.filter(a => format(new Date(a.start_time), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0)
  const sym = (profile?.default_currency === 'ILS') ? '₪' : '$'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} label="Today's Sessions" value={todayAppts.length} />
        <StatCard icon={Calendar} label="Upcoming Sessions" value={upcomingAppts.length} sub="next 30 days" />
        <StatCard icon={Users} label="Active Clients" value={clients.filter(c => c.is_active).length} />
        <StatCard icon={DollarSign} label="Outstanding" value={`${sym}${unpaidTotal.toFixed(2)}`} sub={`${unpaidInvoices.length} unpaid invoices`} />
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Schedule</h2>
          <Link to="/therapist/appointments" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            Manage appointments <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <CalendarView appointments={appointments} currencySymbol={sym} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Today's Sessions</h2>
          {todayAppts.length === 0 ? (
            <p className="text-gray-400 text-sm">No sessions today.</p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{appt.client_name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
                    </p>
                  </div>
                  <span className="badge-yellow">{appt.session_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid invoices */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Unpaid Invoices</h2>
          {unpaidInvoices.length === 0 ? (
            <p className="text-gray-400 text-sm">All invoices paid.</p>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">#{inv.invoice_number}</p>
                    <p className="text-xs text-gray-500">{inv.client_name} · Due {format(new Date(inv.due_date), 'MMM d')}</p>
                  </div>
                  <span className="font-semibold text-sm text-gray-900">{sym}{inv.amount.toFixed(2)}</span>
                </div>
              ))}
              {unpaidInvoices.length > 5 && (
                <Link to="/therapist/invoices" className="text-xs text-primary-600 hover:underline">
                  View all {unpaidInvoices.length} unpaid invoices →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
