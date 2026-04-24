import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy — RipeSpot",
  description: "Privacy Policy for RipeSpot Development, LLC.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-base font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-slate-400 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

const TOC = [
  { id: "overview",          label: "1. Overview" },
  { id: "data-collected",    label: "2. Data We Collect" },
  { id: "how-we-use",        label: "3. How We Use Your Data" },
  { id: "data-storage",      label: "4. Data Storage & Security" },
  { id: "third-parties",     label: "5. Third-Party Services" },
  { id: "sharing",           label: "6. Data Sharing" },
  { id: "user-rights",       label: "7. Your Rights" },
  { id: "cookies",           label: "8. Cookies & Tracking" },
  { id: "retention",         label: "9. Data Retention" },
  { id: "security",          label: "10. Security Measures" },
  { id: "children",          label: "11. Children's Privacy" },
  { id: "changes",           label: "12. Changes to This Policy" },
  { id: "contact",           label: "13. Contact Us" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080E1A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-[#080E1A]/95 backdrop-blur-sm z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold font-serif text-white hover:text-teal-300 transition-colors">
            RipeSpot
          </Link>
          <nav className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Title block */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-500">
            <strong className="text-slate-400">Effective Date:</strong> April 23, 2026
            &nbsp;·&nbsp;
            <strong className="text-slate-400">Company:</strong> RipeSpot Development, LLC
            &nbsp;·&nbsp;
            <strong className="text-slate-400">Location:</strong> New Orleans, Louisiana
          </p>
          <p className="text-sm text-slate-400 mt-4 max-w-2xl">
            RipeSpot Development, LLC (&ldquo;RipeSpot,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to
            protecting your privacy. This Privacy Policy explains how we collect, use, store, and
            protect your information when you use the RipeSpot platform.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* TOC */}
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Contents</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-xs text-slate-500 hover:text-teal-400 transition-colors py-0.5 leading-snug"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Body */}
          <article className="flex-1 space-y-10 min-w-0">
            <Section id="overview" title="1. Overview">
              <p>
                This Privacy Policy applies to all users of the RipeSpot platform, including real
                estate developers, government housing agency users, vendors, and other professionals
                who access the Service. By using RipeSpot, you consent to the practices described
                in this Privacy Policy.
              </p>
              <p>
                This Policy should be read together with our{" "}
                <Link href="/terms" className="text-teal-400 hover:text-teal-300 underline">Terms of Service</Link>.
                Terms not defined here have the meanings given to them in the Terms of Service.
              </p>
            </Section>

            <Section id="data-collected" title="2. Data We Collect">
              <p>We collect the following categories of information:</p>

              <p className="font-semibold text-slate-300">Account Information</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Email address and password (stored as a secure hash)</li>
                <li>Full name and organization name</li>
                <li>Professional title and phone number (if provided)</li>
                <li>Account creation date and last login</li>
              </ul>

              <p className="font-semibold text-slate-300">Project and Business Data</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Project names, addresses, descriptions, and status information</li>
                <li>Deal pipeline data including addresses, prices, and projected returns</li>
                <li>Financial data entered into pro forma tools and financial analysis features</li>
                <li>LIHTC compliance checklist entries and notes</li>
                <li>Zoning lookup search queries and results viewed</li>
                <li>PILOT analysis inputs and outputs</li>
                <li>HOME and HTF compliance data</li>
                <li>Team member information (names, emails, roles)</li>
                <li>Task assignments, deadlines, and notes</li>
              </ul>

              <p className="font-semibold text-slate-300">Uploaded Documents</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Files and documents uploaded to the Document Repository (PDFs, Word documents, spreadsheets, images)</li>
                <li>File names, sizes, upload dates, and folder categorization</li>
                <li>Notes and metadata associated with uploaded documents</li>
              </ul>

              <p className="font-semibold text-slate-300">Payment Information</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Subscription plan and billing history</li>
                <li>Payment method details (credit card number, expiration, CVV — collected and stored exclusively by Stripe; we do not store raw card data)</li>
                <li>Billing address</li>
                <li>Stripe customer ID and subscription ID</li>
              </ul>

              <p className="font-semibold text-slate-300">Vendor Marketplace Data</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Vendor company information, contact details, and professional bios</li>
                <li>Vendor type, certifications (DBE, MBE, WBE, etc.), and service areas</li>
                <li>Project listings posted by developers</li>
                <li>Bid submissions including proposal text and fee amounts</li>
                <li>Bid status and award decisions</li>
              </ul>

              <p className="font-semibold text-slate-300">Usage and Analytics Data</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Pages visited and features used within the platform</li>
                <li>Time and duration of sessions</li>
                <li>Browser type, device type, and operating system</li>
                <li>IP address and approximate geographic location (country/state level)</li>
                <li>Clickstream data and interaction events</li>
                <li>Error logs and performance data</li>
              </ul>

              <p className="font-semibold text-slate-300">Communications</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Support requests and correspondence with RipeSpot</li>
                <li>Feedback and survey responses</li>
              </ul>
            </Section>

            <Section id="how-we-use" title="3. How We Use Your Data">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Provide, operate, maintain, and improve the RipeSpot platform and all its features</li>
                <li>Authenticate your identity and maintain the security of your account</li>
                <li>Process payments and manage your subscription</li>
                <li>Display your projects, documents, and data within the platform</li>
                <li>Send transactional emails (account confirmation, password reset, invoice receipts)</li>
                <li>Send service-related notifications (new project bids, bid status updates, team task assignments, deadline reminders)</li>
                <li>Send product updates, feature announcements, and relevant platform news (you may opt out)</li>
                <li>Respond to your support requests and inquiries</li>
                <li>Monitor platform usage, diagnose technical issues, and improve performance</li>
                <li>Detect, prevent, and address fraud, abuse, and security incidents</li>
                <li>Comply with applicable legal obligations</li>
                <li>Enforce our Terms of Service</li>
              </ul>
              <p>
                We do not use your User Content or project data to train AI models, develop competing
                products, or for any purpose other than providing and improving the Service.
              </p>
            </Section>

            <Section id="data-storage" title="4. Data Storage & Infrastructure">
              <p>
                <strong className="text-slate-300">Database:</strong> Your account information,
                project data, and all structured data is stored in Supabase, a managed PostgreSQL
                database service. Supabase is built on Amazon Web Services (AWS) infrastructure.
                Your data is stored in data centers located in the United States. Supabase implements
                encryption at rest and in transit for all data.
              </p>
              <p>
                <strong className="text-slate-300">File Storage:</strong> Uploaded documents and
                files are stored in Supabase Storage, which uses AWS S3 (Simple Storage Service) as
                the underlying storage layer. All files are encrypted at rest using AES-256 encryption
                and transmitted over HTTPS/TLS.
              </p>
              <p>
                <strong className="text-slate-300">Application Hosting:</strong> The RipeSpot
                web application is hosted on Vercel, a cloud platform for Next.js applications.
                Vercel operates data centers in multiple regions including the United States.
              </p>
              <p>
                <strong className="text-slate-300">Data Access Controls:</strong> We implement
                Row Level Security (RLS) policies at the database level to ensure that each user
                can only access their own data. Our storage system enforces user-scoped folder
                permissions so that uploaded files are only accessible to the account that uploaded them.
              </p>
            </Section>

            <Section id="third-parties" title="5. Third-Party Services">
              <p>
                We use the following third-party service providers to operate the RipeSpot platform.
                Each provider has its own privacy policy governing their use of data:
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Stripe, Inc.",
                    purpose: "Payment processing and subscription management",
                    data: "Payment card information, billing address, transaction history",
                    policy: "https://stripe.com/privacy",
                  },
                  {
                    name: "Supabase, Inc.",
                    purpose: "Database hosting, authentication, and file storage",
                    data: "All account data, project data, uploaded documents",
                    policy: "https://supabase.com/privacy",
                  },
                  {
                    name: "Vercel, Inc.",
                    purpose: "Web application hosting and content delivery",
                    data: "Request logs, IP addresses, performance data",
                    policy: "https://vercel.com/legal/privacy-policy",
                  },
                  {
                    name: "Amazon Web Services (AWS)",
                    purpose: "Cloud infrastructure (via Supabase)",
                    data: "Stored data as described above",
                    policy: "https://aws.amazon.com/privacy/",
                  },
                ].map((provider) => (
                  <div key={provider.name} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                    <p className="font-semibold text-slate-300 text-sm">{provider.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5"><span className="text-slate-400">Purpose:</span> {provider.purpose}</p>
                    <p className="text-xs text-slate-500"><span className="text-slate-400">Data shared:</span> {provider.data}</p>
                    <a
                      href={provider.policy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-500 hover:text-teal-400 transition-colors mt-1 inline-block"
                    >
                      Privacy Policy ↗
                    </a>
                  </div>
                ))}
              </div>
              <p>
                We do not sell your personal information to any third party, advertising network,
                or data broker. We will only share your information with third parties as described
                in this Privacy Policy or with your explicit consent.
              </p>
            </Section>

            <Section id="sharing" title="6. Data Sharing">
              <p>We share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>
                  <strong className="text-slate-300">Service providers:</strong> With the third-party
                  providers listed above, solely to provide the Service
                </li>
                <li>
                  <strong className="text-slate-300">Vendor Marketplace:</strong> When you register
                  as a vendor, your company profile (name, type, certifications, service areas, bio,
                  and contact information) is displayed to other authenticated users in the vendor
                  directory. You control what information you include in your profile.
                </li>
                <li>
                  <strong className="text-slate-300">Legal requirements:</strong> If we are required
                  to disclose information by applicable law, regulation, court order, subpoena,
                  or other legal process, we will comply after providing you notice where legally
                  permitted to do so
                </li>
                <li>
                  <strong className="text-slate-300">Protection of rights:</strong> To enforce our
                  Terms of Service, protect the rights, property, or safety of RipeSpot, our users,
                  or the public
                </li>
                <li>
                  <strong className="text-slate-300">Business transfers:</strong> In connection with
                  a merger, acquisition, asset sale, or other business transaction, in which case
                  we will notify you before your personal information is transferred and becomes
                  subject to a different privacy policy
                </li>
                <li>
                  <strong className="text-slate-300">With your consent:</strong> For any other purpose
                  with your explicit consent
                </li>
              </ul>
              <p>
                We do not sell, rent, lease, or otherwise disclose your personal information to
                third parties for their marketing or advertising purposes.
              </p>
            </Section>

            <Section id="user-rights" title="7. Your Rights">
              <p>You have the following rights with respect to your personal information:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>
                  <strong className="text-slate-300">Access:</strong> You may request a copy of the
                  personal information we hold about you
                </li>
                <li>
                  <strong className="text-slate-300">Correction:</strong> You may update or correct
                  inaccurate information directly in your account settings, or by contacting us
                </li>
                <li>
                  <strong className="text-slate-300">Export:</strong> You may export your project
                  data and uploaded documents at any time through the platform. Following account
                  termination, your data remains available for export for 30 days.
                </li>
                <li>
                  <strong className="text-slate-300">Deletion:</strong> You may request deletion
                  of your account and associated personal information by contacting us at{" "}
                  <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                    steven@ripespotdevelopment.com
                  </a>.
                  Note that we may retain certain information as required by law or for legitimate
                  business purposes (e.g., billing records).
                </li>
                <li>
                  <strong className="text-slate-300">Opt-out of marketing:</strong> You may opt out
                  of marketing and non-transactional emails at any time by clicking the unsubscribe
                  link in any marketing email, or by contacting us. You will continue to receive
                  transactional emails necessary to operate your account.
                </li>
                <li>
                  <strong className="text-slate-300">Data portability:</strong> You may request your
                  data in a structured, machine-readable format
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>.
                We will respond to your request within 30 days.
              </p>
            </Section>

            <Section id="cookies" title="8. Cookies & Tracking Technologies">
              <p>
                RipeSpot uses cookies and similar tracking technologies to operate and improve the
                platform. A cookie is a small text file stored on your device by your browser.
              </p>
              <p className="font-semibold text-slate-300">Types of cookies we use:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>
                  <strong className="text-slate-300">Essential cookies:</strong> Required for the
                  platform to function. These include authentication session cookies that keep you
                  logged in and security cookies that prevent cross-site request forgery. These
                  cannot be disabled without breaking the platform.
                </li>
                <li>
                  <strong className="text-slate-300">Functional cookies:</strong> Remember your
                  preferences and settings (such as display preferences and filters) to improve
                  your experience.
                </li>
                <li>
                  <strong className="text-slate-300">Analytics cookies:</strong> Help us understand
                  how users interact with the platform so we can improve features and fix issues.
                  We use privacy-respecting analytics tools.
                </li>
              </ul>
              <p>
                Most browsers allow you to control cookies through their settings. However, disabling
                essential cookies may prevent you from logging in or using core platform features.
              </p>
              <p>
                We do not use third-party advertising or tracking cookies. We do not share cookie
                data with advertising networks.
              </p>
            </Section>

            <Section id="retention" title="9. Data Retention">
              <p>We retain your personal information for the following periods:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>
                  <strong className="text-slate-300">Active accounts:</strong> We retain your data
                  for as long as your account is active or as needed to provide the Service
                </li>
                <li>
                  <strong className="text-slate-300">After account closure:</strong> User Content
                  is available for export for 30 days, then deleted from active systems. Backups
                  are purged within 90 days of the 30-day export period.
                </li>
                <li>
                  <strong className="text-slate-300">Payment records:</strong> Billing and transaction
                  records are retained for 7 years as required by applicable tax and financial
                  recordkeeping laws
                </li>
                <li>
                  <strong className="text-slate-300">Legal holds:</strong> We may retain information
                  for longer periods if required by a legal hold, litigation, or regulatory inquiry
                </li>
                <li>
                  <strong className="text-slate-300">Anonymized analytics:</strong> Aggregated,
                  de-identified analytics data may be retained indefinitely
                </li>
              </ul>
            </Section>

            <Section id="security" title="10. Security Measures">
              <p>
                We implement industry-standard technical and organizational security measures to
                protect your personal information from unauthorized access, disclosure, alteration,
                or destruction, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>All data transmitted to and from the platform is encrypted using TLS 1.2 or higher (HTTPS)</li>
                <li>Data stored in our database is encrypted at rest using AES-256 encryption</li>
                <li>Uploaded files are stored in encrypted, access-controlled object storage</li>
                <li>Database Row Level Security (RLS) policies ensure strict data isolation between users</li>
                <li>User-scoped storage policies prevent cross-user file access</li>
                <li>Passwords are hashed using bcrypt before storage — we never store plaintext passwords</li>
                <li>Authentication is managed through Supabase Auth with secure session handling</li>
                <li>Payment card data is processed exclusively by Stripe and never transmitted to or stored on our servers</li>
                <li>Access to production systems is restricted to authorized personnel only</li>
                <li>We conduct regular security reviews of our infrastructure and code</li>
              </ul>
              <p>
                While we take these precautions, no method of transmission over the Internet or
                method of electronic storage is 100% secure. We cannot guarantee the absolute
                security of your information. In the event of a security breach that affects
                your personal information, we will notify you as required by applicable law.
              </p>
            </Section>

            <Section id="children" title="11. Children's Privacy">
              <p>
                RipeSpot is a professional platform intended exclusively for use by adults aged 18
                and older. We do not knowingly collect, solicit, or maintain personal information
                from individuals under the age of 18.
              </p>
              <p>
                If you are under 18, you are not permitted to use RipeSpot or create an account.
                If we become aware that we have inadvertently collected personal information from
                a person under 18, we will promptly delete that information from our systems.
              </p>
              <p>
                If you believe that we have collected personal information from a child under 18,
                please contact us immediately at{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>.
              </p>
            </Section>

            <Section id="changes" title="12. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                practices, technology, legal requirements, or other factors. When we make material
                changes to this Policy, we will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Update the &ldquo;Effective Date&rdquo; at the top of this Policy</li>
                <li>Send an email notification to your account email address</li>
                <li>Display a prominent notice within the RipeSpot platform</li>
              </ul>
              <p>
                Your continued use of the Service after the effective date of any changes constitutes
                your acceptance of the updated Privacy Policy. We encourage you to review this
                Policy periodically.
              </p>
            </Section>

            <Section id="contact" title="13. Contact Us">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or
                our data practices, please contact us:
              </p>
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 not-prose">
                <p className="text-slate-300 font-semibold">RipeSpot Development, LLC</p>
                <p className="text-slate-400 text-sm">Attn: Privacy — Steven Kennedy, Owner</p>
                <p className="text-slate-400 text-sm">New Orleans, Louisiana</p>
                <p className="mt-2">
                  <a
                    href="mailto:steven@ripespotdevelopment.com"
                    className="text-teal-400 hover:text-teal-300 transition-colors text-sm"
                  >
                    steven@ripespotdevelopment.com
                  </a>
                </p>
              </div>
              <p>
                We will respond to all privacy inquiries within 30 days of receipt.
              </p>
            </Section>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
