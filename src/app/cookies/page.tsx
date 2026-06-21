import Link from 'next/link'

export const metadata = { title: 'Cookie Policy' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>{title}</h2>
    <div className="text-muted-light" style={{ fontSize: '0.9rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {children}
    </div>
  </div>
)

export default function CookiePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px clamp(16px, 4vw, 32px) 40px' }}>
      <Link href="/" className="text-muted-light hover:text-teal-light" style={{ fontSize: '13px', display: 'block', marginBottom: '24px' }}>&larr; Back to Home</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Cookie <span className="gradient-text">Policy</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Effective: <span className="spec">April 17, 2026</span></p>

      <div className="glass" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <Section title="1. What cookies are">
            <p>Cookies are small text files that websites store in your browser. They let a site remember you across pages and visits — for example, so you stay logged in as you move around The Scene.</p>
            <p>The term &quot;cookies&quot; in this policy also covers similar technologies like local storage and session storage, which serve the same purpose.</p>
          </Section>

          <Section title="2. Categories of cookies we use">
            <p><strong>Strictly necessary.</strong> These keep you signed in and secure. Without them the Service won&apos;t work. Examples: our Supabase authentication session token, a CSRF token, the session ID Next.js uses for server-rendered pages.</p>
            <p><strong>Preferences.</strong> Remember non-essential settings like your feed toggle (Following vs All) or the last tab you viewed on a listing. These are optional; disabling them just resets those preferences on each visit.</p>
            <p><strong>Analytics.</strong> If enabled, these help us count unique visitors and see which pages people use most. We only use aggregate, non-personally-identifying data — never to profile individuals. You can opt out in your browser (Do Not Track header) or via cookie settings.</p>
            <p>We do <strong>not</strong> use advertising or cross-site tracking cookies.</p>
          </Section>

          <Section title="3. Third-party cookies">
            <p>Some cookies are set by services we integrate with:</p>
            <p>• <strong>Google</strong> — if you sign in with Google OAuth, Google sets cookies on your browser to manage that sign-in. Controlled by your Google account preferences.</p>
            <p>• <strong>Discord</strong> — same as Google, if you choose Discord sign-in.</p>
            <p>• <strong>Cloudflare</strong> — our CDN sets a small security cookie (<code>__cf_bm</code>) that helps detect bots. It contains no personal information.</p>
            <p>• <strong>Stripe</strong> — if you reach a payment page, Stripe sets cookies to prevent fraud. You won&apos;t see Stripe cookies unless you actually open a checkout.</p>
            <p>• <strong>Mapbox</strong> — sets no tracking cookies; it&apos;s an API we call server-side, no third-party cookies are placed in your browser.</p>
          </Section>

          <Section title="4. Managing cookies in your browser">
            <p>Every modern browser has a cookies settings panel where you can view, block, or delete cookies per-site. Here&apos;s where to find it:</p>
            <p>• <strong>Chrome</strong> — Settings → Privacy and security → Cookies and other site data.</p>
            <p>• <strong>Safari</strong> — Settings → Privacy → Manage Website Data.</p>
            <p>• <strong>Firefox</strong> — Settings → Privacy & Security → Cookies and Site Data.</p>
            <p>• <strong>Edge</strong> — Settings → Cookies and site permissions.</p>
            <p>Blocking strictly-necessary cookies will sign you out and prevent The Scene from working correctly.</p>
          </Section>

          <Section title="5. Do Not Track">
            <p>We respect the <code>Sec-GPC</code> (Global Privacy Control) and <code>DNT</code> headers where our analytics vendors support them. Sending either will disable optional analytics tracking for your visit.</p>
          </Section>

          <Section title="6. Changes to this policy">
            <p>We&apos;ll update the &quot;Effective&quot; date at the top if we add, change, or remove cookie categories. Material changes get in-app or email notice.</p>
          </Section>

          <Section title="7. Related policies">
            <p>• <Link href="/privacy">Privacy Policy</Link> — what personal data we collect and how we use it.</p>
            <p>• <Link href="/terms">Terms of Service</Link> — the rules for using The Scene.</p>
          </Section>

          <Section title="8. Contact">
            <p><a href="mailto:support@thescene.fyi">support@thescene.fyi</a> for cookie-related questions.</p>
          </Section>

        </div>
      </div>
    </div>
  )
}
