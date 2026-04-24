import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Terms of Service — RipeSpot",
  description: "Terms of Service for RipeSpot Development, LLC.",
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
  { id: "acceptance",        label: "1. Acceptance of Terms" },
  { id: "description",       label: "2. Description of Service" },
  { id: "accounts",          label: "3. User Accounts" },
  { id: "payment",           label: "4. Subscription and Payment" },
  { id: "ip",                label: "5. Intellectual Property" },
  { id: "user-content",      label: "6. User Content" },
  { id: "acceptable-use",    label: "7. Acceptable Use" },
  { id: "vendor-marketplace",label: "8. Vendor Marketplace Terms" },
  { id: "confidentiality",   label: "9. Confidentiality" },
  { id: "warranties",        label: "10. Disclaimer of Warranties" },
  { id: "liability",         label: "11. Limitation of Liability" },
  { id: "indemnification",   label: "12. Indemnification" },
  { id: "termination",       label: "13. Termination" },
  { id: "modifications",     label: "14. Modifications" },
  { id: "disputes",          label: "15. Dispute Resolution" },
  { id: "governing-law",     label: "16. Governing Law" },
  { id: "contact",           label: "17. Contact" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080E1A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-[#080E1A]/95 backdrop-blur-sm z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold font-serif text-white hover:text-teal-300 transition-colors">
            RipeSpot
          </Link>
          <nav className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Title block */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-sm text-slate-500">
            <strong className="text-slate-400">Effective Date:</strong> April 23, 2026
            &nbsp;·&nbsp;
            <strong className="text-slate-400">Company:</strong> RipeSpot Development, LLC
            &nbsp;·&nbsp;
            <strong className="text-slate-400">Location:</strong> New Orleans, Louisiana
          </p>
          <p className="text-sm text-slate-400 mt-4 max-w-2xl">
            Please read these Terms of Service carefully before using the RipeSpot platform. By
            accessing or using RipeSpot, you agree to be bound by these terms.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Table of Contents — sticky sidebar */}
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
            <Section id="acceptance" title="1. Acceptance of Terms">
              <p>
                By creating an account, accessing, or using the RipeSpot platform (&ldquo;Service&rdquo; or
                &ldquo;Platform&rdquo;), you (&ldquo;User&rdquo; or &ldquo;you&rdquo;) agree to be bound by these Terms of Service
                (&ldquo;Terms&rdquo;) and our{" "}
                <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline">Privacy Policy</Link>,
                which is incorporated herein by reference. These Terms constitute a legally binding agreement
                between you and RipeSpot Development, LLC (&ldquo;RipeSpot,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              </p>
              <p>
                If you do not agree to these Terms, you must not access or use the Service. If you are
                using the Service on behalf of an organization, you represent and warrant that you have
                authority to bind that organization to these Terms.
              </p>
            </Section>

            <Section id="description" title="2. Description of Service">
              <p>
                RipeSpot is a software-as-a-service (SaaS) platform designed for real estate developers,
                government housing agencies, housing authorities, and related professionals to manage
                affordable housing development projects. The Platform provides tools and features including,
                but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Zoning lookup and land use analysis</li>
                <li>Deal pipeline management</li>
                <li>Project tracking and timeline management</li>
                <li>Financial analysis and pro forma modeling</li>
                <li>LIHTC (Low-Income Housing Tax Credit) compliance checklists and review tools</li>
                <li>HOME, HTF, and CDBG program compliance support</li>
                <li>Document management and organized file storage</li>
                <li>Team collaboration and task assignment</li>
                <li>Vendor marketplace for connecting developers with qualified professionals</li>
                <li>PILOT analysis and reporting tools</li>
              </ul>
              <p>
                RipeSpot reserves the right to modify, suspend, or discontinue any aspect of the Service
                at any time, with or without notice. We shall not be liable to you or any third party for
                any modification, suspension, or discontinuation of the Service.
              </p>
            </Section>

            <Section id="accounts" title="3. User Accounts">
              <p>
                To access the Service, you must create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information to keep it accurate and current</li>
                <li>Keep your login credentials confidential and secure</li>
                <li>Not share your account credentials with any other person or entity</li>
                <li>Maintain only one account per individual or organization</li>
                <li>Immediately notify RipeSpot of any unauthorized use of your account or any other security breach</li>
                <li>Be at least 18 years of age</li>
              </ul>
              <p>
                You are solely responsible for all activity that occurs under your account. RipeSpot
                will not be liable for any loss or damage arising from your failure to maintain the
                security of your account credentials.
              </p>
            </Section>

            <Section id="payment" title="4. Subscription and Payment">
              <p>
                RipeSpot offers the following subscription plans and one-time purchase options:
              </p>
              <p className="font-semibold text-slate-300">Developer Plans:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Starter — $49.00 per month</li>
                <li>Pro — $149.00 per month</li>
                <li>Enterprise — $399.00 per month</li>
                <li>Pay-Per-Project — $99.00 (one-time, 90-day access)</li>
              </ul>
              <p className="font-semibold text-slate-300 mt-3">Vendor Marketplace Plans:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Vendor Basic — $29.00 per month</li>
                <li>Vendor Professional — $79.00 per month</li>
                <li>Vendor Premium — $149.00 per month</li>
              </ul>
              <p>
                <strong className="text-slate-300">Free Trial:</strong> New users are eligible for a 14-day free trial on
                eligible subscription plans. No payment information is required to begin a free trial,
                though a credit card may be required to access certain features. Your trial will
                automatically convert to a paid subscription at the end of the trial period unless
                you cancel before the trial expires.
              </p>
              <p>
                <strong className="text-slate-300">Payment Processing:</strong> All payments are processed
                securely through Stripe, Inc. By providing your payment information, you authorize
                RipeSpot to charge your payment method for all applicable fees. You represent and
                warrant that the payment information you provide is accurate and that you are
                authorized to use the payment method.
              </p>
              <p>
                <strong className="text-slate-300">Auto-Renewal:</strong> Subscription plans automatically
                renew at the end of each billing cycle unless you cancel your subscription before the
                renewal date. You may cancel your subscription at any time through your account settings.
                Cancellation takes effect at the end of the current billing period.
              </p>
              <p>
                <strong className="text-slate-300">No Refunds:</strong> All subscription fees are
                non-refundable. We do not provide refunds or credits for partial subscription periods,
                unused features, or any other reason. If you believe you have been charged in error,
                please contact us at{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>{" "}
                within 30 days of the charge.
              </p>
              <p>
                <strong className="text-slate-300">Price Changes:</strong> RipeSpot reserves the right to
                change subscription prices at any time. We will provide at least 30 days&apos; notice of
                any price changes. Your continued use of the Service after the price change takes effect
                constitutes your acceptance of the new price.
              </p>
            </Section>

            <Section id="ip" title="5. Intellectual Property">
              <p>
                <strong className="text-slate-300">RipeSpot&apos;s Proprietary Rights:</strong> All content,
                software, source code, object code, designs, user interfaces, features, functionality,
                databases, algorithms, workflows, documentation, trademarks, service marks, logos, and
                all other materials on or within the RipeSpot platform (collectively, the
                &ldquo;RipeSpot Materials&rdquo;) are the exclusive property of RipeSpot Development, LLC and
                are protected by applicable copyright, trademark, trade secret, patent, and other
                intellectual property laws of the United States and international conventions.
              </p>
              <p>
                <strong className="text-slate-300">Limited License:</strong> Subject to your compliance
                with these Terms and payment of applicable fees, RipeSpot grants you a limited,
                non-exclusive, non-transferable, non-sublicensable, revocable license to access and use
                the Platform solely for your internal business purposes during your subscription period.
                This license does not include any right to resell or make commercial use of the Platform
                or its contents.
              </p>
              <p>
                <strong className="text-slate-300">Prohibited Actions:</strong> You expressly agree that
                you will NOT, and will not permit or encourage any third party to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Copy, reproduce, duplicate, or create derivative works from any part of the Platform</li>
                <li>Modify, translate, adapt, or create derivative works based on the Platform or RipeSpot Materials</li>
                <li>Distribute, sell, lease, rent, sublicense, or transfer any rights in the Platform</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform</li>
                <li>Scrape, data mine, harvest, or extract data from the Platform using automated means, bots, crawlers, or any other automated tools</li>
                <li>Frame, mirror, or republish any portion of the Platform without express written consent</li>
                <li>Reproduce, replicate, or attempt to recreate the Platform&apos;s features, functionality, design, or user interface</li>
                <li>Remove or alter any proprietary notices, labels, or marks on the Platform</li>
                <li>Use the Platform to build or assist in building a competing product or service</li>
                <li>Access the Platform through any means other than the interfaces expressly provided by RipeSpot</li>
              </ul>
              <p>
                <strong className="text-slate-300">Trademarks:</strong> &ldquo;RipeSpot,&rdquo; the RipeSpot logo,
                and all related names, logos, product names, and slogans are trademarks of RipeSpot
                Development, LLC. You may not use these marks without RipeSpot&apos;s prior written consent.
                All other trademarks, service marks, or trade names appearing on the Platform are the
                property of their respective owners.
              </p>
              <p>
                Any unauthorized use of the RipeSpot Materials terminates the license granted herein and
                may constitute infringement of RipeSpot&apos;s intellectual property rights, which may subject
                you to civil and criminal penalties.
              </p>
            </Section>

            <Section id="user-content" title="6. User Content">
              <p>
                <strong className="text-slate-300">Your Ownership:</strong> You retain full ownership of
                all data, files, documents, text, images, and other content that you upload, submit, or
                otherwise make available through the Service (&ldquo;User Content&rdquo;). These Terms do not
                transfer any ownership of your User Content to RipeSpot.
              </p>
              <p>
                <strong className="text-slate-300">License to RipeSpot:</strong> By uploading or
                submitting User Content through the Service, you grant RipeSpot a limited, worldwide,
                royalty-free, non-exclusive license to store, host, process, display, transmit, and
                back up your User Content solely as necessary to provide the Service to you. This
                license terminates when you delete the User Content from the Service or close your account.
              </p>
              <p>
                <strong className="text-slate-300">No Sale or Sharing:</strong> RipeSpot will not sell,
                share, rent, lease, or use your User Content for any purpose other than providing the
                Service, except as required by law or as described in our Privacy Policy.
              </p>
              <p>
                <strong className="text-slate-300">Your Responsibility:</strong> You are solely
                responsible for your User Content. You represent and warrant that you have all necessary
                rights to upload and use your User Content, and that your User Content does not violate
                any applicable law or infringe any third-party rights.
              </p>
            </Section>

            <Section id="acceptable-use" title="7. Acceptable Use">
              <p>You agree to use the Service only for lawful purposes. You must NOT use the Service to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Engage in any activity that violates any applicable federal, state, or local law or regulation</li>
                <li>Gain unauthorized access to any computer systems, networks, or data</li>
                <li>Interfere with, disrupt, or damage the Service or servers or networks connected to the Service</li>
                <li>Upload, transmit, or distribute any viruses, malware, ransomware, spyware, or other harmful code</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity</li>
                <li>Engage in scraping, spidering, crawling, or any automated data collection from the Platform</li>
                <li>Attempt to probe, scan, or test the vulnerability of any system or network connected to the Service</li>
                <li>Collect or harvest personal information of other users without their consent</li>
                <li>Use the Service for any fraudulent, deceptive, or misleading purposes</li>
                <li>Send unsolicited communications or spam to other users through the Platform</li>
                <li>Use the Service in any manner that could harm minors</li>
              </ul>
              <p>
                RipeSpot reserves the right to investigate and take appropriate legal action against
                anyone who violates this section, including suspending or terminating their account and
                reporting them to law enforcement authorities.
              </p>
            </Section>

            <Section id="vendor-marketplace" title="8. Vendor Marketplace Terms">
              <p>
                The Vendor Marketplace is a feature within RipeSpot that allows registered vendors
                to connect with real estate developers seeking professional services. The following
                additional terms apply to Vendor Marketplace participants:
              </p>
              <p>
                <strong className="text-slate-300">Vendor Profiles:</strong> Vendors must maintain
                accurate, truthful, and current profiles. Misrepresentation of certifications
                (including but not limited to DBE, MBE, WBE, Section 3, or HUBZone status),
                qualifications, experience, or licensure is strictly prohibited and may result in
                immediate account termination and reporting to relevant authorities.
              </p>
              <p>
                <strong className="text-slate-300">Bids:</strong> Bids submitted through the Vendor
                Marketplace constitute binding offers by the vendor to perform the described services
                at the stated terms. Vendors should not submit bids unless they are genuinely able and
                willing to perform the work.
              </p>
              <p>
                <strong className="text-slate-300">No Agency Relationship:</strong> RipeSpot is a
                technology platform that facilitates connections between developers and vendors.
                RipeSpot is not a party to any contract, agreement, or transaction between developers
                and vendors. Any agreements entered into between developers and vendors are solely
                between those parties.
              </p>
              <p>
                <strong className="text-slate-300">No Guarantee:</strong> RipeSpot does not verify,
                endorse, or guarantee the quality, qualifications, reliability, legality, or
                performance of any vendor or the outcome of any project. Developers are responsible
                for conducting their own due diligence before engaging any vendor.
              </p>
              <p>
                <strong className="text-slate-300">Marketplace Fees:</strong> Access to the Vendor
                Marketplace requires an active vendor subscription. Marketplace subscription fees
                are separate from and in addition to any developer platform subscriptions.
              </p>
            </Section>

            <Section id="confidentiality" title="9. Confidentiality">
              <p>
                RipeSpot acknowledges that your User Content, including project data, financial
                information, deal pipeline data, uploaded documents, and any other information you
                provide through the Service, may be confidential and proprietary to you
                (&ldquo;Confidential Information&rdquo;).
              </p>
              <p>
                RipeSpot agrees to: (a) use your Confidential Information solely to provide the
                Service; (b) not disclose your Confidential Information to third parties except as
                required to provide the Service (e.g., to infrastructure providers subject to
                confidentiality obligations) or as required by law; and (c) implement and maintain
                industry-standard technical and organizational security measures to protect your
                Confidential Information from unauthorized access, disclosure, or destruction.
              </p>
              <p>
                For details on our data security practices and the third-party services we use,
                please review our{" "}
                <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline">Privacy Policy</Link>.
              </p>
            </Section>

            <Section id="warranties" title="10. Disclaimer of Warranties">
              <p>
                THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT ANY
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED
                BY APPLICABLE LAW, RIPESPOT DEVELOPMENT, LLC EXPRESSLY DISCLAIMS ALL WARRANTIES,
                INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2 uppercase text-xs">
                <li>WARRANTIES OF MERCHANTABILITY</li>
                <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>NON-INFRINGEMENT</li>
                <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY DATA OR INFORMATION</li>
                <li>UNINTERRUPTED OR ERROR-FREE OPERATION OF THE SERVICE</li>
              </ul>
              <p>
                <strong className="text-slate-300">Important Disclaimers Regarding Platform Output:</strong>{" "}
                RipeSpot&apos;s zoning lookup, compliance guidance, financial analysis tools, LIHTC
                compliance features, and any other analytical outputs are provided for informational
                and preliminary planning purposes only. This information does not constitute legal,
                financial, tax, or professional advice. RipeSpot does not guarantee the accuracy,
                completeness, or timeliness of zoning data, regulatory citations, compliance
                determinations, or financial projections. Users are solely responsible for verifying
                all information with qualified professionals (attorneys, accountants, engineers,
                government officials) before making any business, legal, or financial decisions.
              </p>
            </Section>

            <Section id="liability" title="11. Limitation of Liability">
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RIPESPOT
                DEVELOPMENT, LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, MEMBERS, AGENTS, OR LICENSORS
                BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR
                EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Loss of profits, revenue, or business</li>
                <li>Loss of data or information</li>
                <li>Loss of goodwill or reputation</li>
                <li>Cost of substitute goods or services</li>
                <li>Any damages arising from reliance on information provided by the Service</li>
              </ul>
              <p>
                RIPESPOT&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING
                TO THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE
                TOTAL AMOUNT OF FEES ACTUALLY PAID BY YOU TO RIPESPOT IN THE TWELVE (12) MONTHS
                IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO SUCH CLAIM, OR (B) ONE HUNDRED
                DOLLARS ($100.00).
              </p>
              <p>
                The limitations of liability in this section apply regardless of the theory of
                liability, whether in contract, tort (including negligence), strict liability, or
                otherwise, and even if RipeSpot has been advised of the possibility of such damages.
              </p>
              <p>
                Some jurisdictions do not allow the exclusion or limitation of incidental or
                consequential damages, so the above limitations may not apply to you.
              </p>
            </Section>

            <Section id="indemnification" title="12. Indemnification">
              <p>
                You agree to defend, indemnify, and hold harmless RipeSpot Development, LLC and its
                officers, directors, employees, members, agents, affiliates, and licensors from and
                against any and all claims, damages, obligations, losses, liabilities, costs, and
                expenses (including reasonable attorneys&apos; fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Your access to or use of the Service</li>
                <li>Your User Content</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable law or regulation</li>
                <li>Your violation of any third-party rights, including intellectual property rights</li>
                <li>Any misrepresentation you make in connection with the Service</li>
              </ul>
              <p>
                RipeSpot reserves the right, at your expense, to assume the exclusive defense and
                control of any matter for which you are required to indemnify us, and you agree to
                cooperate with our defense of such claims.
              </p>
            </Section>

            <Section id="termination" title="13. Termination">
              <p>
                <strong className="text-slate-300">Termination by You:</strong> You may terminate
                your account at any time by contacting us at{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>{" "}
                or through your account settings. Termination does not entitle you to any refund
                of prepaid subscription fees.
              </p>
              <p>
                <strong className="text-slate-300">Termination by RipeSpot:</strong> RipeSpot may
                suspend or terminate your account and access to the Service, with or without notice,
                for any reason, including but not limited to your violation of these Terms, non-payment
                of fees, fraudulent activity, or conduct that RipeSpot determines in its sole
                discretion is harmful to RipeSpot, other users, or third parties.
              </p>
              <p>
                <strong className="text-slate-300">Effect of Termination:</strong> Upon termination
                of your account:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Your right to access and use the Service immediately ceases</li>
                <li>Your User Content will remain available for export for 30 days following termination</li>
                <li>After 30 days, RipeSpot will delete your User Content from its active systems</li>
                <li>Your User Content may be retained in backup systems for up to 90 days following the 30-day export period, after which it will be permanently deleted</li>
              </ul>
              <p>
                Sections of these Terms that by their nature should survive termination shall survive,
                including Sections 5, 9, 10, 11, 12, 15, and 16.
              </p>
            </Section>

            <Section id="modifications" title="14. Modifications to Terms">
              <p>
                RipeSpot reserves the right to modify, update, or replace these Terms at any time
                in our sole discretion. When we make changes, we will update the &ldquo;Effective Date&rdquo;
                at the top of these Terms and take at least one of the following steps to notify you:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Send you an email notification to the address associated with your account</li>
                <li>Display a prominent notice within the Platform</li>
              </ul>
              <p>
                For material changes to these Terms, we will provide at least 14 days&apos; advance notice
                before the changes take effect. Your continued access to or use of the Service after
                the effective date of any modifications constitutes your acceptance of the updated
                Terms. If you do not agree to the modified Terms, you must stop using the Service.
              </p>
            </Section>

            <Section id="disputes" title="15. Dispute Resolution">
              <p>
                <strong className="text-slate-300">Informal Resolution:</strong> Before initiating
                any formal dispute proceedings, you agree to first contact RipeSpot at{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>{" "}
                and attempt to resolve the dispute informally. We will attempt to resolve the dispute
                within 30 days of receiving your written notice.
              </p>
              <p>
                <strong className="text-slate-300">Binding Arbitration:</strong> If we are unable
                to resolve a dispute informally within 30 days, any dispute, claim, or controversy
                arising out of or relating to these Terms or your use of the Service shall be
                resolved by binding arbitration administered by the American Arbitration Association
                (&ldquo;AAA&rdquo;) under its Commercial Arbitration Rules. The arbitration shall take place
                in New Orleans, Louisiana, or, if the parties mutually agree, by remote hearing.
                The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment
                in any court of competent jurisdiction.
              </p>
              <p>
                <strong className="text-slate-300">Class Action Waiver:</strong> YOU AND RIPESPOT
                EACH WAIVE THE RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE
                ARBITRATION. All disputes must be brought in your individual capacity and not as
                a plaintiff or class member in any purported class or representative proceeding.
              </p>
              <p>
                <strong className="text-slate-300">Arbitration Opt-Out:</strong> You may opt out of
                this arbitration agreement by sending written notice to{" "}
                <a href="mailto:steven@ripespotdevelopment.com" className="text-teal-400 hover:text-teal-300">
                  steven@ripespotdevelopment.com
                </a>{" "}
                within 30 days of first accepting these Terms. Your notice must include your name,
                account email address, and a clear statement that you are opting out of the
                arbitration clause.
              </p>
              <p>
                <strong className="text-slate-300">Small Claims Court:</strong> Notwithstanding the
                above, either party may bring an individual action in small claims court for
                disputes within that court&apos;s jurisdiction.
              </p>
            </Section>

            <Section id="governing-law" title="16. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                State of Louisiana, without regard to its conflict of law provisions. Subject to the
                arbitration agreement above, you consent to the exclusive jurisdiction of the state
                and federal courts located in New Orleans, Louisiana for the resolution of any
                disputes not subject to arbitration.
              </p>
            </Section>

            <Section id="contact" title="17. Contact Information">
              <p>
                If you have any questions, concerns, or comments regarding these Terms of Service,
                please contact us:
              </p>
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 not-prose">
                <p className="text-slate-300 font-semibold">RipeSpot Development, LLC</p>
                <p className="text-slate-400 text-sm">New Orleans, Louisiana</p>
                <p className="mt-2">
                  <a
                    href="mailto:steven@ripespotdevelopment.com"
                    className="text-teal-400 hover:text-teal-300 transition-colors text-sm"
                  >
                    steven@ripespotdevelopment.com
                  </a>
                </p>
                <p className="text-slate-500 text-xs mt-1">Attn: Steven Kennedy, Owner</p>
              </div>
            </Section>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
