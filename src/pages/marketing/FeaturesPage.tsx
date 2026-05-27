import { Link } from 'react-router-dom'
import {
  Zap, CalendarCheck, Bell, CreditCard, FileText, Users,
  RefreshCw, Settings, BarChart2, Shield, Clock, Globe, ChevronRight,
} from 'lucide-react'

const sections = [
  {
    tag: 'Invoicing',
    title: 'Billing that happens automatically',
    desc: 'Stop chasing payments. PracticeBilling creates, sends, and tracks invoices the moment work is done.',
    color: 'bg-indigo-50',
    iconColor: 'text-primary-600',
    items: [
      { icon: Zap, title: 'Same-day invoicing', desc: 'Invoice fires the instant you mark an appointment complete. No daily batch, no waiting.' },
      { icon: Clock, title: 'Flexible billing cycles', desc: 'Per-client billing schedules: same day, next day, weekly, biweekly, or monthly batching into a single invoice.' },
      { icon: FileText, title: 'Professional PDFs', desc: 'Every invoice is a polished, downloadable PDF with your business name, client details, line items, and payment link.' },
      { icon: RefreshCw, title: 'Standalone invoices', desc: 'Need to bill for something not tied to an appointment? Create a standalone invoice in seconds.' },
    ],
  },
  {
    tag: 'Payments',
    title: 'Get paid the way your clients prefer',
    desc: 'Multiple payment providers, one seamless experience.',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    items: [
      { icon: CreditCard, title: 'Stripe Connect', desc: 'Accept credit and debit cards globally. Funds go directly to your connected Stripe account.' },
      { icon: Globe, title: 'PayMe (Israel)', desc: "Israel's leading payment gateway, fully integrated. Ideal for ILS billing and Israeli compliance." },
      { icon: CreditCard, title: 'PayPal', desc: 'Let clients pay via PayPal. One-click pay links included in every invoice email.' },
      { icon: Shield, title: 'Secure by design', desc: 'Card details never touch our servers. All payments processed directly by your chosen provider.' },
    ],
  },
  {
    tag: 'Reminders',
    title: 'Stop chasing outstanding invoices',
    desc: 'Automated payment reminders keep your cash flow healthy without awkward conversations.',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    items: [
      { icon: Bell, title: 'Automated reminders', desc: 'Set a reminder frequency (e.g. every 7 days) and PracticeBilling emails clients with outstanding balances automatically.' },
      { icon: Users, title: 'Consolidated emails', desc: 'One email per client listing all unpaid invoices — never multiple separate emails for the same client.' },
      { icon: Zap, title: 'Smart exclusions', desc: 'Invoices issued in the last 24h are excluded (they already received the original email). No double-dipping.' },
      { icon: Settings, title: 'Fully customizable', desc: 'Choose your reminder interval. Disable anytime. Each client can also have individual billing settings.' },
    ],
  },
  {
    tag: 'Scheduling',
    title: 'Calendar-first appointment management',
    desc: 'Your schedule and your billing in sync, always.',
    color: 'bg-sky-50',
    iconColor: 'text-sky-600',
    items: [
      { icon: CalendarCheck, title: 'Google Calendar sync', desc: 'Connect your Google Calendar and appointments sync automatically in both directions.' },
      { icon: RefreshCw, title: 'Recurring appointments', desc: 'Schedule daily, weekly, biweekly, or monthly recurring sessions in one step.' },
      { icon: Settings, title: 'Custom service types', desc: 'Define services with default durations. The end time auto-fills when you select a service — never calculate manually again.' },
      { icon: Clock, title: 'Auto-complete end time', desc: 'Pick a start time, select a service, and the end time fills in automatically based on that service\'s default duration.' },
    ],
  },
  {
    tag: 'Compliance',
    title: 'Israeli accounting built-in',
    desc: "Meet Israel's regulated accounting requirements without lifting a finger.",
    color: 'bg-rose-50',
    iconColor: 'text-rose-600',
    items: [
      { icon: FileText, title: 'iCount integration', desc: 'Tax invoices and receipts issued automatically via iCount — the leading Israeli accounting platform.' },
      { icon: FileText, title: 'Green Invoice', desc: 'Full Green Invoice support for businesses that prefer it. Switch providers in settings.' },
      { icon: Globe, title: 'Multi-currency', desc: 'Bill in USD or ILS. Optional exchange rate conversion note on every invoice.' },
      { icon: Shield, title: 'VAT & tax-exempt', desc: 'Per-client tax-exempt flag for 0% VAT clients. Handled automatically on all documents.' },
    ],
  },
]

export function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
            Every feature you need.<br />Nothing you don't.
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            PracticeBilling handles the full billing lifecycle — from scheduling to payment receipt — with no manual work required.
          </p>
          <Link to="/contact" className="btn-primary px-8 py-3 text-base rounded-xl inline-flex items-center gap-2">
            Get Started Free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature sections */}
      {sections.map(({ tag, title, desc, color, iconColor, items }, idx) => (
        <section key={tag} className={`py-16 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <span className={`inline-block text-xs font-bold uppercase tracking-widest ${iconColor} mb-2`}>{tag}</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{title}</h2>
              <p className="text-lg text-gray-500 max-w-2xl">{desc}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {items.map(({ icon: Icon, title: t, desc: d }) => (
                <div key={t} className={`${color} rounded-2xl p-5`}>
                  <Icon className={`w-5 h-5 ${iconColor} mb-3`} />
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{t}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white mb-4">See it in action</h2>
          <p className="text-primary-100 text-lg mb-8">Get your account set up and explore every feature — free.</p>
          <Link to="/contact" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
            Request Access <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
