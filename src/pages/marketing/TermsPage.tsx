export function TermsPage() {
  const updated = 'June 16, 2026'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {updated}</p>

      <div className="prose prose-gray max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using AutoInvoice ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, do not use the Service. These terms apply to all
            users of the platform, including therapists, practitioners, and any other service providers
            ("Users").
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            AutoInvoice is a billing and scheduling platform for service-based businesses. The Service
            includes appointment scheduling, invoice generation, payment collection, client management,
            automated billing, and integrations with third-party accounting and payment providers. We reserve
            the right to modify or discontinue any part of the Service at any time with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed">
            You must create an account to use the Service. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs under your account.
            You agree to provide accurate and complete information when creating your account and to keep
            this information up to date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You agree to use the Service only for lawful purposes. You may not:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed">
            <li>Use the Service to send unsolicited communications to clients who have not engaged with your business</li>
            <li>Attempt to access, tamper with, or use non-public areas of the Service</li>
            <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
            <li>Use the Service in any way that could damage, disable, or impair our infrastructure</li>
            <li>Violate any applicable local, national, or international laws or regulations</li>
            <li>Impersonate another person or entity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Client Data</h2>
          <p className="text-gray-600 leading-relaxed">
            You are responsible for obtaining any necessary consents from your clients before entering their
            information into the Service and before sending them invoices or other communications through the
            platform. You represent that you have the right to use and share the client data you submit to
            the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Payment and Billing</h2>
          <p className="text-gray-600 leading-relaxed">
            Certain features of AutoInvoice may require a paid subscription. Subscription fees are billed
            in advance on a monthly or annual basis. All fees are non-refundable except where required by law.
            We reserve the right to change pricing with 30 days' notice. Continued use of the Service after a
            price change constitutes acceptance of the new pricing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Third-Party Integrations</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service integrates with third-party providers including Google, Stripe, PayPal, PayMe,
            iCount, and Green Invoice. Your use of these integrations is also governed by those providers'
            terms of service. We are not responsible for the availability, accuracy, or actions of
            third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Google Calendar Integration</h2>
          <p className="text-gray-600 leading-relaxed">
            If you connect your Google Calendar, you authorize AutoInvoice to create and manage calendar
            events on your behalf. You can revoke this access at any time from your Google Account settings
            or from within AutoInvoice's settings page. Revoking access will not delete historical
            appointment data stored in AutoInvoice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service, including all software, designs, and content created by AutoInvoice, is owned
            by us and protected by applicable intellectual property laws. You retain ownership of all data
            you submit to the Service. By using the Service, you grant us a limited license to process
            your data solely to provide the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Disclaimers</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service is provided "as is" without warranties of any kind, express or implied. We do not
            warrant that the Service will be uninterrupted, error-free, or completely secure. The invoices
            and documents generated by AutoInvoice are provided as a convenience. You are responsible
            for ensuring that your invoicing and accounting practices comply with applicable laws and
            regulations in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            To the maximum extent permitted by law, AutoInvoice shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of or inability
            to use the Service. Our total liability to you for any claims arising from these terms or the
            Service shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            You may stop using the Service at any time. We may suspend or terminate your account if you
            violate these Terms, or for any other reason with reasonable notice. Upon termination, your
            right to use the Service will immediately cease. You may request an export of your data within
            30 days of termination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">13. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by the laws of the State of Israel. Any disputes arising from these
            Terms shall be subject to the exclusive jurisdiction of the courts located in Israel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">14. Changes to These Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these Terms from time to time. We will notify you of material changes by posting
            the updated Terms on this page with a new "Last updated" date. Continued use of the Service
            after changes take effect constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For any questions about these Terms, please contact us at:{' '}
            <a href="mailto:gary.s.schwartz617@gmail.com" className="text-primary-600 hover:underline">
              gary.s.schwartz617@gmail.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
