import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'

const categories = [
  {
    label: 'Getting Started',
    faqs: [
      {
        q: 'What types of businesses can use PracticeBilling?',
        a: 'Any service-based business that schedules appointments and invoices clients — therapists, psychologists, nutritionists, personal trainers, barbers, nail salons, physiotherapists, tutors, lawyers, coaches, and more. If you take appointments and need to get paid, PracticeBilling works for you.',
      },
      {
        q: 'How do I create an account?',
        a: 'Sign in with your Google account — no separate registration needed. On your first login you\'ll go through a quick onboarding flow to set up your business type, services, and payment provider. The whole process takes under 5 minutes.',
      },
      {
        q: 'Do my clients need an account?',
        a: 'Yes. When you add a client, they receive an invitation email with a link to activate their account. Once activated, they can view appointments, download invoices, and pay balances from their own portal.',
      },
    ],
  },
  {
    label: 'Billing & Invoicing',
    faqs: [
      {
        q: 'How does automatic billing work?',
        a: 'When you mark an appointment as complete, PracticeBilling immediately creates an invoice and emails it to your client with a payment link — no manual steps required. You can choose the billing frequency per client: same day (instant), next day, weekly, biweekly, or monthly batching.',
      },
      {
        q: 'Can I create invoices that aren\'t tied to an appointment?',
        a: 'Yes. From the Invoices page, click "Create Invoice" and switch to the Standalone tab. Enter the client, description, amount, and optional service date. The full invoicing flow — payment link, email, and Israeli accounting documents — runs exactly the same way.',
      },
      {
        q: 'Can I batch multiple sessions into one invoice?',
        a: 'Yes. If a client\'s billing frequency is set to weekly, biweekly, or monthly, PracticeBilling automatically groups all completed appointments in that period into a single invoice. Your client receives one clean invoice instead of multiple individual ones.',
      },
      {
        q: 'What if I need to adjust an invoice amount?',
        a: 'You can set an override price on any individual appointment to override the default session price. For standalone invoices, you enter the amount directly. Existing unpaid invoices can be voided and reissued.',
      },
    ],
  },
  {
    label: 'Payments',
    faqs: [
      {
        q: 'Which payment methods are supported?',
        a: 'We support Stripe Connect (credit/debit cards globally), PayMe (Israel\'s leading payment gateway), and PayPal. Every invoice email includes a one-click payment link for whichever provider you\'ve connected.',
      },
      {
        q: 'How do I connect my payment provider?',
        a: 'From Settings → Integrations, click "Connect Stripe" (OAuth flow), enter your PayMe credentials, or link your PayPal email. Takes about 2 minutes. You can switch providers at any time.',
      },
      {
        q: 'What if a client says they paid but the invoice still shows unpaid?',
        a: 'Use the "Check Stripe" button (refresh icon) on any unpaid invoice to pull the live payment status directly from Stripe. If payment is confirmed, the invoice is marked paid immediately and a receipt is issued automatically. For manual payments (cash, bank transfer), use "Mark as Paid."',
      },
    ],
  },
  {
    label: 'Payment Reminders',
    faqs: [
      {
        q: 'How do payment reminders work?',
        a: 'Go to Settings → Payment Reminders and set the frequency (e.g., every 7 days). PracticeBilling will automatically email any client with outstanding invoices at that interval. Each client receives one consolidated email listing all their unpaid invoices — not a separate email per invoice.',
      },
      {
        q: 'Will clients who just received an invoice immediately get a reminder too?',
        a: 'No. Invoices issued within the last 24 hours are excluded from reminders. Clients only receive a reminder for invoices that are at least one day old.',
      },
    ],
  },
  {
    label: 'Scheduling & Calendar',
    faqs: [
      {
        q: 'Can I connect my Google Calendar?',
        a: 'Yes. From Settings → Integrations, click "Connect Google Calendar." All appointments you create in PracticeBilling will appear in your Google Calendar automatically. Changes to times sync back as well.',
      },
      {
        q: 'How do recurring appointments work?',
        a: 'From the Appointments page, click "New Appointment" and toggle to the recurring option. Set the frequency (weekly, biweekly, monthly), start date, and number of occurrences or end date. PracticeBilling creates all appointments and syncs the full series to Google Calendar.',
      },
      {
        q: 'Can I set default durations for different services?',
        a: 'Yes. Under Settings → Services, define each service type with a default duration. When you select a service while creating an appointment, the end time auto-fills — so a 50-minute session starting at 2:00 PM automatically ends at 2:50 PM. You can always override it.',
      },
    ],
  },
  {
    label: 'Israeli Accounting',
    faqs: [
      {
        q: 'Is PracticeBilling compliant with Israeli accounting regulations?',
        a: 'Yes. We have built-in integrations with iCount and Green Invoice — the two leading Israeli accounting platforms. Tax invoices and receipts are issued automatically when a payment is made or marked as received.',
      },
      {
        q: 'What currencies does PracticeBilling support?',
        a: 'We support USD and ILS (Israeli Shekel). You can also enable an optional exchange rate conversion note on invoice emails, showing clients the current conversion rate between the two currencies.',
      },
    ],
  },
  {
    label: 'Security & Privacy',
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'All data is encrypted in transit (HTTPS/TLS) and at rest. We use industry-standard authentication (OAuth 2.0) and never store payment card details — payments are processed directly by Stripe, PayMe, or PayPal.',
      },
      {
        q: 'Who can see my client data?',
        a: 'Only you. Your clients can only see their own appointments and invoices. Therapist data is isolated per account — no other business can access your information.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4 text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

export function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].label)
  const category = categories.find(c => c.label === activeCategory)!

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20 border-b border-gray-100 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Frequently asked questions</h1>
          <p className="text-xl text-gray-500">
            Everything you need to know about PracticeBilling.{' '}
            <Link to="/contact" className="text-primary-600 hover:underline">Can't find your answer? Ask us.</Link>
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Category sidebar */}
          <nav className="md:w-48 shrink-0">
            <ul className="space-y-1 md:sticky md:top-24">
              {categories.map(({ label }) => (
                <li key={label}>
                  <button
                    onClick={() => setActiveCategory(label)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === label
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* FAQ list */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-5">{activeCategory}</h2>
            <div className="space-y-3">
              {category.faqs.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Still have questions?</h2>
          <p className="text-gray-500 mb-6">We typically respond within a few hours.</p>
          <Link to="/contact" className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2">
            Contact Us <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
