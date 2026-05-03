import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listClientAppointments } from '../../api/appointments'
import { format } from 'date-fns'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'badge-yellow',
    completed: 'badge-green',
    canceled: 'badge-red',
    no_show: 'badge-gray',
  }
  return <span className={map[status] || 'badge-gray'}>{status}</span>
}

export function ClientSessions() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['client-appointments', statusFilter],
    queryFn: () => listClientAppointments(statusFilter ? { status: statusFilter } : {}),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-500 mt-1">View all your therapy sessions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'scheduled', 'completed', 'canceled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sessions found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoiced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map(appt => (
                <tr key={appt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{appt.therapist_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{format(new Date(appt.start_time), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{appt.session_type}</td>
                  <td className="px-6 py-4"><StatusBadge status={appt.status} /></td>
                  <td className="px-6 py-4">
                    {appt.has_invoice ? (
                      <span className="badge-green text-xs">Yes</span>
                    ) : appt.status === 'completed' ? (
                      <span className="badge-yellow text-xs">Pending</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
