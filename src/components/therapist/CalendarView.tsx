import { useState } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  addWeeks, subWeeks, isSameDay, format, isToday,
  startOfMonth, endOfMonth,
  addMonths, subMonths, isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { Appointment } from '../../types'

interface Props {
  appointments: Appointment[]
  onAppointmentClick?: (appt: Appointment) => void
  onEdit?: (appt: Appointment) => void
  currencySymbol?: string
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-primary-100 border-primary-400 text-primary-800',
  completed: 'bg-green-100 border-green-400 text-green-800',
  canceled:  'bg-red-100  border-red-300   text-red-700',
  no_show:   'bg-gray-100 border-gray-300   text-gray-600',
}

const HOUR_START = 7   // 7 am
const HOUR_END   = 20  // 8 pm
const HOUR_PX    = 56  // px per hour
const TOTAL_HOURS = HOUR_END - HOUR_START

// ── Week view ────────────────────────────────────────────────────────────────

function WeekView({ anchor, appointments, onAppointmentClick }: {
  anchor: Date
  appointments: Appointment[]
  onAppointmentClick?: (a: Appointment) => void
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 1 }),
    end:   endOfWeek(anchor,   { weekStartsOn: 1 }),
  })

  function apptStyle(appt: Appointment) {
    const s = new Date(appt.start_time)
    const e = new Date(appt.end_time)
    const topMinutes  = (s.getHours() - HOUR_START) * 60 + s.getMinutes()
    const durMinutes  = (e.getTime() - s.getTime()) / 60_000
    return {
      top:    `${(topMinutes  / 60) * HOUR_PX}px`,
      height: `${Math.max((durMinutes / 60) * HOUR_PX, 22)}px`,
    }
  }

  return (
    <div className="flex overflow-auto" style={{ maxHeight: '70vh' }}>
      {/* Time gutter */}
      <div className="w-14 shrink-0 border-r border-gray-200 bg-white sticky left-0 z-10">
        <div className="h-10 border-b border-gray-200" /> {/* header spacer */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div
            key={i}
            style={{ height: HOUR_PX }}
            className="pr-2 text-right text-xs text-gray-400 border-b border-gray-100 flex items-start pt-1"
          >
            {format(new Date(2000, 0, 1, HOUR_START + i), 'h a')}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex flex-1 min-w-0">
        {days.map(day => {
          const dayAppts = appointments.filter(a => isSameDay(new Date(a.start_time), day))
          return (
            <div key={day.toISOString()} className="flex-1 min-w-[90px] border-r border-gray-200 last:border-r-0">
              {/* Day header */}
              <div className={`h-10 border-b border-gray-200 flex flex-col items-center justify-center sticky top-0 z-10 ${
                isToday(day) ? 'bg-primary-50' : 'bg-white'
              }`}>
                <span className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</span>
                <span className={`text-sm font-semibold leading-none ${
                  isToday(day) ? 'text-primary-600' : 'text-gray-800'
                }`}>{format(day, 'd')}</span>
              </div>

              {/* Hour grid + appointments */}
              <div className="relative" style={{ height: TOTAL_HOURS * HOUR_PX }}>
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={i} className="border-b border-gray-100" style={{ height: HOUR_PX }} />
                ))}
                {dayAppts.map(appt => (
                  <button
                    key={appt.id}
                    onClick={() => onAppointmentClick?.(appt)}
                    style={apptStyle(appt)}
                    className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 text-left overflow-hidden
                      transition-opacity hover:opacity-80 ${STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled}`}
                  >
                    <p className="text-xs font-semibold truncate leading-tight">
                      {appt.client_name}
                    </p>
                    <p className="text-xs opacity-75 leading-tight">
                      {format(new Date(appt.start_time), 'h:mm a')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Month view ───────────────────────────────────────────────────────────────

function MonthView({ anchor, appointments, onAppointmentClick }: {
  anchor: Date
  appointments: Appointment[]
  onAppointmentClick?: (a: Appointment) => void
}) {
  // Grid: Mon–Sun, padded to full weeks
  const monthStart  = startOfMonth(anchor)
  const monthEnd    = endOfMonth(anchor)
  const gridStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days        = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {days.map(day => {
          const dayAppts = appointments.filter(a => isSameDay(new Date(a.start_time), day))
          const inMonth  = isSameMonth(day, anchor)
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[96px] p-1 ${inMonth ? 'bg-white' : 'bg-gray-50'}`}
            >
              <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
                isToday(day)
                  ? 'bg-primary-600 text-white'
                  : inMonth ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map(appt => (
                  <button
                    key={appt.id}
                    onClick={() => onAppointmentClick?.(appt)}
                    className={`w-full text-left text-xs rounded px-1 py-0.5 truncate border-l-2
                      hover:opacity-80 transition-opacity ${STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled}`}
                  >
                    {format(new Date(appt.start_time), 'h:mm a')} {appt.client_name}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-xs text-gray-400 pl-1">+{dayAppts.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Appointment detail popover ────────────────────────────────────────────────

function AppointmentDetail({
  appt, onClose, onEdit, currencySymbol = '$',
}: {
  appt: Appointment
  onClose: () => void
  onEdit?: (appt: Appointment) => void
  currencySymbol?: string
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{appt.client_name}</h3>
            <p className="text-sm text-gray-500">{appt.session_type}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border-l-2 ${STATUS_COLORS[appt.status]}`}>
            {appt.status.replace('_', ' ')}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{format(new Date(appt.start_time), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span>
              {format(new Date(appt.start_time), 'h:mm a')} – {format(new Date(appt.end_time), 'h:mm a')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Price</span>
            <span>{appt.effective_price != null ? `${currencySymbol}${appt.effective_price.toFixed(2)}` : '—'}{appt.override_price != null && appt.override_price !== 0 ? ' (custom)' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Billing</span>
            <span className={appt.billed ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {appt.billed ? 'Invoiced' : appt.status === 'completed' ? 'Unbilled' : '—'}
            </span>
          </div>
          {appt.session_notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-xs mb-1">Notes</p>
              <p className="text-gray-700 text-sm">{appt.session_notes}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <button
              onClick={() => { onClose(); onEdit(appt) }}
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

type ViewMode = 'week' | 'month'

export function CalendarView({ appointments, onAppointmentClick, onEdit, currencySymbol = '$' }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState<Appointment | null>(null)

  const handleClick = (appt: Appointment) => {
    setSelected(appt)
    onAppointmentClick?.(appt)
  }

  const goBack = () => setAnchor(a => viewMode === 'week' ? subWeeks(a, 1) : subMonths(a, 1))
  const goFwd  = () => setAnchor(a => viewMode === 'week' ? addWeeks(a, 1) : addMonths(a, 1))
  const goNow  = () => setAnchor(new Date())

  const rangeLabel = viewMode === 'week'
    ? `${format(startOfWeek(anchor, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(anchor, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
    : format(anchor, 'MMMM yyyy')

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={goFwd} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={goNow} className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
            Today
          </button>
          <h2 className="text-sm font-semibold text-gray-900 ml-1">{rangeLabel}</h2>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['week', 'month'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                viewMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-gray-50">
        {Object.entries({ scheduled: 'Scheduled', completed: 'Completed', canceled: 'Canceled' }).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm border-l-2 ${STATUS_COLORS[k]}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar body */}
      {viewMode === 'week'
        ? <WeekView  anchor={anchor} appointments={appointments} onAppointmentClick={handleClick} />
        : <MonthView anchor={anchor} appointments={appointments} onAppointmentClick={handleClick} />
      }

      {/* Detail popover */}
      {selected && (
        <AppointmentDetail
          appt={selected}
          onClose={() => setSelected(null)}
          onEdit={onEdit}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  )
}
