import { Link } from 'react-router-dom'
import { Heart, Target, Zap, ChevronRight } from 'lucide-react'

const values = [
  {
    icon: Zap,
    title: 'Automation first',
    desc: 'Every manual step we eliminate is time you get back to spend with clients, not spreadsheets.',
  },
  {
    icon: Heart,
    title: 'Built for real practitioners',
    desc: "We're not a generic SaaS tool. Every feature was built because a real service professional needed it.",
  },
  {
    icon: Target,
    title: 'No-nonsense reliability',
    desc: 'Billing is mission-critical. We obsess over uptime, correctness, and making sure invoices always go out.',
  },
]

const milestones = [
  { year: '2023', event: 'PracticeBilling founded out of frustration with existing billing tools for service professionals.' },
  { year: '2024', event: 'Launched with core invoicing, Stripe Connect, and Google Calendar sync. First 50 businesses onboarded.' },
  { year: '2024', event: 'Added iCount and Green Invoice integration, making PracticeBilling the only billing tool with full Israeli compliance built-in.' },
  { year: '2025', event: 'Expanded to any service-based business. Introduced custom service types, PayMe, PayPal, and automated payment reminders.' },
  { year: '2025', event: 'Crossed 500 active businesses and 10,000 invoices processed.' },
]

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
            We built the billing tool<br />we always wished existed.
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            PracticeBilling was born out of a simple frustration: every billing tool was either too complicated,
            too expensive, or too generic to handle the specific needs of service-based practitioners.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">The story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                It started with therapists — practitioners who were brilliant at their work but spending hours every
                month on invoicing, chasing late payments, and manually filing accounting documents.
                The tools available were either enterprise billing platforms designed for large companies, or basic
                invoice generators that required everything to be done by hand.
              </p>
              <p>
                We built PracticeBilling to automate the entire billing lifecycle: from scheduling an appointment,
                to confirming it's complete, to the invoice landing in the client's inbox, to the payment receipt
                being issued — all without a single manual step.
              </p>
              <p>
                Then we realized the same problems existed for barbers, nail salons, physiotherapists, personal
                trainers, nutritionists, tutors, and dozens of other service businesses. So we built a platform
                that adapts to any service-based business — not just one profession.
              </p>
              <p>
                Today, PracticeBilling handles thousands of invoices every month for hundreds of businesses.
                But our goal stays the same: give every service professional the tools to get paid on time,
                automatically, without lifting a finger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">What we believe in</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Our journey</h2>
          <div className="relative">
            <div className="absolute left-14 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-8">
              {milestones.map(({ year, event }) => (
                <div key={event} className="flex gap-6 items-start">
                  <div className="w-12 shrink-0 text-right">
                    <span className="text-sm font-bold text-primary-600">{year}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-primary-600 shrink-0 mt-0.5 relative z-10" />
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 -mt-0.5">{event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">A small team with a big focus</h2>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
            PracticeBilling is built and maintained by a small, focused team. We stay small on purpose —
            it keeps us close to our customers and laser-focused on what matters: helping you get paid.
          </p>
          <p className="text-sm text-gray-500">
            Headquartered in Israel — built for practitioners worldwide.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white mb-4">Join hundreds of practitioners</h2>
          <p className="text-primary-100 text-lg mb-8">Get your billing automated in under 5 minutes.</p>
          <Link to="/contact" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
            Get Started <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
