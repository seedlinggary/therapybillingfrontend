import { Link } from 'react-router-dom'
import { Check, ChevronRight, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'For solo practitioners just getting started.',
    highlight: false,
    cta: 'Get Started Free',
    features: [
      'Up to 10 active clients',
      'Manual invoice creation',
      'Client portal (view & download)',
      'Invoice PDF generation',
      'Email invoice delivery',
      'Basic appointment scheduling',
    ],
    missing: [
      'Automatic billing on completion',
      'Payment reminders',
      'Google Calendar sync',
      'Israeli accounting (iCount / Green Invoice)',
      'All payment providers',
    ],
  },
  {
    name: 'Growth',
    price: '$39',
    period: 'per month',
    desc: 'For growing practices that need automation.',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    features: [
      'Unlimited clients',
      'Automatic billing on appointment completion',
      'All billing frequencies (same day, weekly, monthly…)',
      'Automated payment reminders',
      'Google Calendar sync',
      'Stripe, PayMe & PayPal integration',
      'Recurring appointments',
      'Custom service types & durations',
      'Client portal',
      'PDF invoices',
    ],
    missing: [
      'Israeli accounting (iCount / Green Invoice)',
      'Multi-currency with conversion notes',
    ],
  },
  {
    name: 'Pro',
    price: '$79',
    period: 'per month',
    desc: 'For established practices with compliance needs.',
    highlight: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Growth',
      'iCount & Green Invoice integration',
      'Automatic tax invoice & receipt issuance',
      'Multi-currency billing (USD + ILS)',
      'Currency conversion notes on invoices',
      'Tax-exempt client support',
      'Priority email support',
      'Onboarding assistance',
    ],
    missing: [],
  },
]

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — the Starter plan is free forever. Growth and Pro plans come with a 14-day free trial, no credit card required.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time. Changes take effect at the start of the next billing cycle.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes — pay annually and save 20%. Contact us to switch to an annual plan.',
  },
  {
    q: 'What happens when I exceed the Starter client limit?',
    a: "You'll be prompted to upgrade to Growth when you try to add an 11th client. Existing clients and invoices are never affected.",
  },
]

export function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20 border-b border-gray-100 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-500">Start free. Scale when you're ready. No hidden fees, ever.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-7 relative ${
                  plan.highlight
                    ? 'border-primary-600 shadow-xl shadow-primary-100'
                    : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <Link
                  to="/contact"
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold mb-6 transition-colors ${
                    plan.highlight
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.missing.length > 0 && (
                  <ul className="space-y-2 pt-4 border-t border-gray-100">
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                        <span className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-gray-300 font-bold">–</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            All prices in USD. Israeli businesses may pay in ILS — <Link to="/contact" className="text-primary-600 hover:underline">contact us</Link> for details.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Not sure which plan is right?</h2>
          <p className="text-gray-500 text-lg mb-8">Talk to us and we'll help you find the best fit for your practice.</p>
          <Link to="/contact" className="btn-primary px-8 py-3 text-base rounded-xl inline-flex items-center gap-2">
            Contact Sales <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
