import Link from 'next/link'

export const metadata = { title: 'Privacy Policy' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>{title}</h2>
    <div className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {children}
    </div>
  </div>
)

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Privacy <span className="text-purple-light">Policy</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Effective: April 17, 2026 · Operated by The Scene (&quot;we&quot;, &quot;us&quot;) at thescene.fyi</p>

      <div className="glass" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <Section title="1. What this policy covers">
            <p>This Privacy Policy explains what personal information The Scene collects, how we use it, who we share it with, and the choices you have. It applies to the website at thescene.fyi and any mobile apps or services that link to this policy.</p>
            <p>By creating an account or using The Scene, you agree to the collection and use of information as described here.</p>
          </Section>

          <Section title="2. Information you provide to us">
            <p><strong>Account data.</strong> Email address (or phone number if phone auth is enabled), username, password (stored hashed by our auth provider), first and last name, avatar and cover photos, bio, location (&quot;City, ST&quot;), date of birth if provided, and subscription tier.</p>
            <p><strong>Vehicle and build data.</strong> Year, make, model, color, engine specs, modifications you list, photos you upload, shop tags, guestbook entries you post on others&apos; vehicles.</p>
            <p><strong>Social data.</strong> Clubs you join or start, events you RSVP to or create, shops you add, marketplace listings you post, feed posts, hashtags, WWYD votes, comments, reactions (props, loves, hearts), follows, sightings.</p>
            <p><strong>Payment data.</strong> If you subscribe to Premium, payment processing is handled by Stripe. We receive a tokenized reference and subscription status — we never see or store your full card number.</p>
            <p><strong>Communications.</strong> Emails you send to support@thescene.fyi and any feedback or reports you submit through the platform.</p>
          </Section>

          <Section title="3. Information we collect automatically">
            <p><strong>Usage data.</strong> Pages you visit, features you interact with, time spent, and referring URLs. We use this to improve the product and diagnose problems.</p>
            <p><strong>Device and connection.</strong> IP address, browser type and version, operating system, device identifiers, and approximate geolocation derived from IP.</p>
            <p><strong>Cookies.</strong> We use cookies for authentication, session management, and preferences. See our <Link href="/cookies" className="text-purple-light hover:text-neon-light">Cookie Policy</Link>.</p>
          </Section>

          <Section title="4. How we use your information">
            <p>• Operate and maintain the platform (serve pages, authenticate you, keep your session alive).</p>
            <p>• Display your profile, vehicles, and public content to other members according to your visibility settings.</p>
            <p>• Match members to nearby events, clubs, shops, and builds based on the city you provide.</p>
            <p>• Send transactional emails (verification, password resets, subscription receipts).</p>
            <p>• Enforce our Terms of Service and Community Guidelines, including responding to reports of abuse.</p>
            <p>• Improve the product through aggregated analytics and bug diagnostics.</p>
          </Section>

          <Section title="5. Service providers we share data with">
            <p>We share the minimum information necessary with third-party vendors that help operate The Scene. We do not sell personal information.</p>
            <p><strong>Supabase</strong> (database, authentication, file storage) — stores account data, profile data, vehicle data, uploaded images, and session tokens.</p>
            <p><strong>Mapbox</strong> (address autocomplete and geocoding) — receives city or address strings you type into location fields; used to produce lat/lng coordinates for the heatmap.</p>
            <p><strong>Hostinger</strong> (web hosting) — servers that run the Next.js app and receive HTTP request data (including IP).</p>
            <p><strong>Cloudflare</strong> (CDN, security, DNS) — proxies traffic between you and our servers, caches public pages.</p>
            <p><strong>Google and Discord</strong> (OAuth sign-in) — if you choose to sign in with Google or Discord, they provide us your basic profile data (name, email, avatar) per your consent with them.</p>
            <p><strong>Stripe</strong> (payments, Premium subscriptions) — handles card processing; we receive a customer reference.</p>
            <p><strong>Legal and safety.</strong> We may disclose information to comply with valid legal process, protect our rights or the safety of members, or enforce our terms.</p>
          </Section>

          <Section title="6. What you share publicly">
            <p>Content you post on The Scene — vehicles marked public, feed posts, event listings, club pages, shop listings, marketplace items, guestbook entries, comments, reactions, and public profile fields — is visible to other members and, where indexed, on search engines. Think of your profile as public by default unless you&apos;ve switched it to private in Settings.</p>
            <p>Private vehicles and private profiles are hidden from Explore, search, and heatmaps, but can still be shared via a direct URL.</p>
          </Section>

          <Section title="7. Your rights and choices">
            <p>• <strong>Access and export.</strong> Email support@thescene.fyi to request a copy of the personal data we have on you. We&apos;ll deliver it within 30 days.</p>
            <p>• <strong>Correction.</strong> Edit your profile, vehicles, and posts directly in the app. For data you can&apos;t edit yourself, contact us.</p>
            <p>• <strong>Deletion.</strong> Use the &quot;Delete My Account&quot; button in Settings, or email support@thescene.fyi. We&apos;ll delete your account and associated personal data within 30 days. Some data may remain in backups for up to 90 days before rolling out.</p>
            <p>• <strong>Visibility.</strong> Flip your profile, vehicles, or individual content to private in Settings at any time.</p>
            <p>• <strong>Communications.</strong> Every non-transactional email has an unsubscribe link. We can&apos;t disable transactional emails (verification, receipts) while you have an active account.</p>
          </Section>

          <Section title="8. California privacy rights (CCPA/CPRA)">
            <p>California residents have the right to know what personal information we collect, the right to request deletion, and the right to correct inaccurate information. You also have the right to opt out of the sale or sharing of personal information. We do not sell personal information.</p>
            <p>To exercise any of these rights, email support@thescene.fyi with the subject &quot;CCPA Request&quot;. We&apos;ll verify your identity and respond within 45 days.</p>
          </Section>

          <Section title="9. Users outside the United States">
            <p>The Scene is operated from the United States. If you access the platform from outside the US, you understand that your information will be transferred to and processed in the US, which may have data protection laws different from those in your jurisdiction.</p>
          </Section>

          <Section title="10. Children">
            <p>The Scene is not directed to children under 13. We do not knowingly collect personal information from anyone under 13. If you believe a child under 13 has created an account, email support@thescene.fyi and we&apos;ll delete it.</p>
            <p>Marketplace features (posting items for sale) are restricted to users 18 and older.</p>
          </Section>

          <Section title="11. Data retention">
            <p>We retain personal information for as long as your account is active, or as needed to provide you services, resolve disputes, and enforce agreements. After account deletion, residual data in encrypted backups is purged on a 90-day rotation.</p>
          </Section>

          <Section title="12. Security">
            <p>We use industry-standard measures — HTTPS everywhere, hashed passwords, row-level security on our database, and restricted access to production systems — to protect your information. No system is 100% secure; please use a strong unique password and enable your email provider&apos;s 2FA.</p>
          </Section>

          <Section title="13. Changes to this policy">
            <p>When we make material changes, we&apos;ll update the &quot;Effective&quot; date above and notify you by email or in-app notice. Your continued use of The Scene after the effective date constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="14. Contact us">
            <p>Privacy questions or requests: <a href="mailto:support@thescene.fyi" className="text-purple-light hover:text-neon-light">support@thescene.fyi</a>.</p>
          </Section>

        </div>
      </div>
    </div>
  )
}
