import { useQuery } from '@tanstack/react-query'
import { listClientAppointments } from '../../api/appointments'
import { listClientInvoices } from '../../api/invoices'
import { format } from 'date-fns'
import { Calendar, FileText, DollarSign } from 'lucide-react'

export function ClientDashboard() {
  const { data: appointments = [] } = useQuery({
    queryKey: ['client-appointments'],
    queryFn: () => listClientAppointments(),
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: () => listClientInvoices(),
  })

  const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(a.start_time) >= new Date())
  const unpaid = invoices.filter(i => i.status === 'unpaid')
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0)
  const sym = (currency?: string) => currency === 'ILS' ? '₪' : '$'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Unpaid Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{unpaid.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Balance Due</p>
            <p className="text-2xl font-bold text-gray-900">{sym(unpaid[0]?.currency)}{unpaidTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Sessions</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming sessions.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">with {appt.therapist_name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(appt.start_time), 'MMM d, yyyy')} at {format(new Date(appt.start_time), 'h:mm a')}
                    </p>
                  </div>
                  <span className="badge-yellow text-xs">{appt.session_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Unpaid Invoices</h2>
          {unpaid.length === 0 ? (
            <p className="text-gray-400 text-sm">No outstanding invoices.</p>
          ) : (
            <div className="space-y-3">
              {unpaid.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">#{inv.invoice_number}</p>
                    <p className="text-xs text-gray-500">Due {format(new Date(inv.due_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-gray-900">{sym(inv.currency)}{inv.amount.toFixed(2)}</span>
                    {(inv.payment_link ?? inv.stripe_payment_link) && (
                      <a
                        href={(inv.payment_link ?? inv.stripe_payment_link)!}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-xs py-1 px-3"
                      >
                        Pay
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
