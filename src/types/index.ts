export type Role = 'therapist' | 'client' | 'admin'

export interface Therapist {
  id: string
  email: string
  name: string
  picture_url?: string
  timezone: string
  phone?: string
  license_number?: string
  bio?: string
  payment_instructions?: string
  country: string
  default_currency: string
  ils_exchange_rate?: number
  default_session_price?: number
  default_billing_frequency: BillingFrequency
  default_billing_anchor_day?: number
  google_calendar_connected: boolean
  stripe_connected: boolean
  onboarding_completed: boolean
  payment_provider: string
  payme_seller_id?: string
  paypal_email?: string
  paypal_connected: boolean
  show_conversion_note: boolean
  created_at: string
}

export interface Client {
  id: string
  email: string
  name: string
  phone?: string
  is_active: boolean
  created_at: string
}

export type BillingFrequency = 'same_day' | 'next_day' | 'weekly' | 'monthly'

export interface TherapistClient {
  id: string
  client_id: string
  email: string
  name: string
  phone?: string
  default_session_price: number
  is_active: boolean
  notes?: string
  client_is_active: boolean
  billing_frequency: BillingFrequency
  billing_anchor_day?: number
  tax_exempt: boolean
  created_at: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'no_show'
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface Appointment {
  id: string
  therapist_id: string
  client_id: string
  client_name?: string
  therapist_name?: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  session_type?: string
  override_price?: number
  effective_price?: number
  google_event_id?: string
  completed_at?: string
  canceled_at?: string
  session_notes?: string
  has_invoice: boolean
  billed: boolean
  recurrence_id?: string
  tax_exempt?: boolean
  created_at: string
}

export type InvoiceStatus = 'unpaid' | 'paid' | 'void' | 'refunded'

export interface InvoiceItem {
  id: string
  appointment_id: string
  amount: number
  description: string
  appointment_start?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  therapist_id: string
  therapist_name?: string
  client_id: string
  client_name?: string
  appointment_id?: string
  appointment_start?: string
  items: InvoiceItem[]
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string
  paid_at?: string
  stripe_payment_link?: string
  payment_provider?: string
  payment_link?: string
  created_at: string
}

// ── Accounting ────────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'issued' | 'canceled' | 'failed'
export type DocumentType = 'invoice' | 'receipt' | 'receipt_invoice' | 'credit_note'
export type AccountingProvider = 'icount' | 'internal'

export interface AccountingIntegration {
  id: string
  provider: AccountingProvider
  company_id?: string
  is_active: boolean
  created_at: string
}

export interface AccountingDocument {
  id: string
  invoice_id?: string
  parent_document_id?: string
  doc_type: DocumentType
  external_id?: string
  pdf_url?: string
  status: DocumentStatus
  amount: number
  currency: string
  vat_amount?: number
  doc_metadata?: Record<string, unknown>
  provider_error?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  action: string
  status: 'success' | 'failed'
  entity_type?: string
  entity_id?: string
  error_message?: string
  log_metadata?: Record<string, unknown>
  created_at: string
}

export interface MonthlyReportRow {
  month: string
  total_amount: number
  total_vat: number
  document_count: number
  currency: string
}

export interface MonthlyReport {
  rows: MonthlyReportRow[]
  grand_total: number
  grand_vat: number
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  role: Role | null
  userId: string | null
}

export interface AvailabilitySlot {
  start: string
  end: string
}

export interface RecurringAppointmentCreate {
  client_id: string
  recurrence_type: RecurrenceType
  start_date: string
  end_date?: string
  occurrence_count?: number
  start_hour: number
  start_minute: number
  duration_minutes: number
  session_type?: string
  override_price?: number
}
