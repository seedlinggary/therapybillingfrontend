import { Link } from 'react-router-dom'
import {
  Zap, CalendarCheck, Bell, CreditCard, BarChart2, Shield,
  RefreshCw, Users, FileText, ChevronRight, Star,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Instant Auto-Invoicing',
    desc: 'Mark an appointment complete and the invoice is created and emailed to your client automatically — no manual steps.',
  },
  {
    icon: CalendarCheck,
    title: 'Google Calendar Sync',
    desc: 'Connect your calendar and every appointment you create syncs instantly. Your schedule stays in one place.',
  },
  {
    icon: Bell,
    title: 'Payment Reminders',
    desc: 'Set a reminder cadence and PracticeBilling emails clients with outstanding balances — one consolidated email, never spam.',
  },
  {
    icon: CreditCard,
    title: 'Any Payment Provider',
    desc: 'Accept payments via Stripe, PayMe (Israel), or PayPal. Clients get a one-click pay link in every invoice.',
  },
  {
    icon: FileText,
    title: 'Israeli Accounting',
    desc: 'Built-in iCount and Green Invoice integration. Tax documents issued automatically the moment a payment lands.',
  },
  {
    icon: Users,
    title: 'Client Portal',
    desc: 'Clients log in to view appointments, download invoices, and pay balances — all without you lifting a finger.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Set up your services',
    desc: 'Define your service types, durations, and default prices. Works for any business — therapy, fitness, beauty, and more.',
  },
  {
    num: '02',
    title: 'Schedule appointments',
    desc: 'Create appointments and sync to Google Calendar. Add recurring sessions in one click.',
  },
  {
    num: '03',
    title: 'Get paid automatically',
    desc: 'Confirm the appointment and the invoice goes out. Clients pay online. You track everything from one dashboard.',
  },
]

const testimonials = [
  {
    quote: "I used to spend two hours every Sunday sending invoices. Now I don't even think about it.",
    name: 'Sarah M.',
    role: 'Licensed Therapist, Tel Aviv',
  },
  {
    quote: 'The automatic iCount integration saved me countless hours of manual bookkeeping every month.',
    name: 'David K.',
    role: 'Sports Physiotherapist, Jerusalem',
  },
  {
    quote: 'My clients love the clean invoice emails and the ability to pay with one click.',
    name: 'Anat R.',
    role: 'Nutritionist & Wellness Coach',
  },
]

const stats = [
  { value: '10,000+', label: 'Invoices sent' },
  { value: '500+', label: 'Active businesses' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2 min', label: 'Avg. setup time' },
]

export function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 text-sm font-medium text-primary-700 mb-6">
              <Zap className="w-3.5 h-3.5" />
              Billing that works as hard as you do
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Automate your billing.<br />
              <span className="text-primary-600">Focus on your clients.</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
              PracticeBilling handles invoicing, payment reminders, and accounting compliance for any service-based business — from therapists to barbershops.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="btn-primary px-8 py-3 text-base rounded-xl flex items-center gap-2"
              >
                Get Started Free <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="px-8 py-3 text-base rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                See All Features
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required. Free to get started.</p>
          </div>

          {/* Mock dashboard card */}
          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[420px] mr-8">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-800 text-sm">Recent Invoices</span>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">3 paid today</span>
              </div>
              {[
                { client: 'Sarah C.', amount: '₪350', status: 'paid', service: 'Individual' },
                { client: 'Michael B.', amount: '₪500', status: 'paid', service: 'Couples' },
                { client: 'Anat L.', amount: '₪350', status: 'unpaid', service: 'Individual' },
                { client: 'Ron S.', amount: '₪600', status: 'unpaid', service: 'Family' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{row.client}</p>
                    <p className="text-xs text-gray-400">{row.service} Session</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{row.amount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary-600 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-primary-100 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to run a modern practice
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From the first appointment to the final receipt — all in one place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-2xl p-6 transition-all">
                <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/features" className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1 justify-center">
              View all features <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-500">Three simple steps to fully automated billing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="text-6xl font-extrabold text-primary-100 mb-3 leading-none">{num}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Works for any business ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Built for every service business</h2>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Not just therapists. If you take appointments and invoice clients, PracticeBilling works for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Therapists', 'Psychologists', 'Nutritionists', 'Barbers', 'Nail Salons',
              'Personal Trainers', 'Physiotherapists', 'Tutors', 'Lawyers', 'Coaches',
              'Doctors', 'Dentists', 'Massage Therapists', 'Acupuncturists',
            ].map(b => (
              <span key={b} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Loved by practitioners</h2>
            <p className="text-primary-100">Real results from real businesses.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, name, role }) => (
              <div key={name} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
                <p className="text-white/90 leading-relaxed mb-5 text-sm">"{quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-primary-200 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Ready to get paid without the hassle?
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Join hundreds of service professionals who've automated their billing with PracticeBilling.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn-primary px-8 py-3 text-base rounded-xl flex items-center gap-2">
              Get Started Free <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="px-8 py-3 text-base rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
