export function PrivacyPage() {
  const updated = 'June 16, 2026'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {updated}</p>

      <div className="prose prose-gray max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Overview</h2>
          <p className="text-gray-600 leading-relaxed">
            AutoInvoice ("we", "our", or "us") is a billing and scheduling platform for service-based
            businesses. This Privacy Policy explains what information we collect, how we use it, and your
            rights regarding that information. By using AutoInvoice you agree to the practices described here.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Account information</h3>
              <p>When you sign in with Google we receive your name, email address, and profile picture from Google's
              authentication service. We store this to identify your account and personalize the application.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Google Calendar data</h3>
              <p>If you connect Google Calendar, we access your calendar to create and manage appointment events
              on your behalf. We request the minimum scope necessary (<code className="text-sm bg-gray-100 px-1 rounded">calendar.events</code>).
              We use this data solely to sync appointments you create within AutoInvoice to your calendar.
              We do not read, store, share, or analyze your existing calendar events.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Client information</h3>
              <p>Information you enter about your clients (names, email addresses, appointment history, billing amounts)
              is stored securely and used only to provide the service to you.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Payment information</h3>
              <p>We do not store credit card numbers or sensitive payment credentials. Payments are processed
              by third-party providers (Stripe, PayPal, PayMe). We receive only transaction metadata such as
              payment status and amounts.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Usage data</h3>
              <p>We may collect basic usage data (pages visited, features used) to improve the platform.
              This data does not include the content of your appointments or invoices.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed">
            <li>To provide and operate the AutoInvoice platform</li>
            <li>To sync appointments with your Google Calendar when you have enabled that integration</li>
            <li>To send invoices, receipts, and payment reminders to your clients on your behalf</li>
            <li>To process payments through connected payment providers</li>
            <li>To generate accounting documents through connected accounting integrations (iCount, Green Invoice)</li>
            <li>To send you transactional notifications about your account</li>
            <li>To improve and maintain the platform</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            We do not sell your personal information or your clients' information to any third party.
            We do not use your data for advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Google API Data</h2>
          <p className="text-gray-600 leading-relaxed">
            AutoInvoice's use and transfer of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>We only access Google Calendar to create and manage events you initiate within AutoInvoice</li>
            <li>We do not transfer your Google data to third parties except as necessary to provide the service</li>
            <li>We do not use Google data for advertising or to train AI/ML models</li>
            <li>We do not allow humans to read your Google Calendar data</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            You can revoke AutoInvoice's access to your Google Calendar at any time from your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Google Account permissions
            </a>{' '}
            page, or by disconnecting the integration in your AutoInvoice settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed">
            We share data only as needed to operate the platform:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed mt-3">
            <li><strong>Payment processors</strong> (Stripe, PayPal, PayMe) — to process payments</li>
            <li><strong>Accounting integrations</strong> (iCount, Green Invoice) — to generate legal documents, only when you have connected these services</li>
            <li><strong>Email provider</strong> (Resend) — to deliver invoices and notifications</li>
            <li><strong>Database and infrastructure</strong> — hosted on secure cloud providers</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            We do not share your data with any other third parties without your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your account data for as long as your account is active. If you delete your account,
            we will delete your personal information within 30 days, except where we are required to retain
            it for legal or tax compliance purposes (such as accounting records).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We encrypt sensitive data at rest (OAuth tokens, API keys) using industry-standard encryption.
            All data is transmitted over HTTPS. We do not store payment card data — all payment processing
            is handled by PCI-compliant third-party providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You may request access to, correction of, or deletion of your personal data at any time
            by contacting us at the email below. You may also export your data from within the platform
            at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            AutoInvoice is not directed at children under 16. We do not knowingly collect personal
            information from children under 16.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by posting the updated policy on this page with a new "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For any privacy-related questions or requests, please contact us at:{' '}
            <a href="mailto:seedling.gary@gmail.com" className="text-primary-600 hover:underline">
              seedling.gary@gmail.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
